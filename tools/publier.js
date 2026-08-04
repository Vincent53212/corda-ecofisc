"use strict";
/* ============================================================================
   PUBLIER — du document révisé jusqu'au paquet prêt à déployer, en une commande

       node tools/publier.js

   Enchaîne, dans l'ordre, et s'arrête au premier problème :

     1. docs/descriptions-mesures.md   →  rules.js      (réinjection des textes)
     2. rules.js                        →  35 tests      (le moteur tient toujours)
     3. rules.js                        →  3 Edge Functions (catalogue serveur)
     4. rules.js + orchestrateur.html   →  deploiement/dist/ (page publique)
     5. rules.js                        →  docs/descriptions-mesures.md (remis au propre)

   Filet de sécurité : rules.js est sauvegardé avant l'étape 1 et RESTAURÉ si les
   tests échouent — impossible de laisser le dépôt dans un état cassé.

   Options :
     --verifier   n'écrit rien : dit seulement ce qui changerait (étapes 1-2 à blanc)
     --sans-md    saute l'étape 1 (utile si on a modifié rules.js directement)

   ⚠ Ce script prépare le déploiement, il ne déploie PAS : la dernière étape est
   manuelle (coller les 3 Edge Functions dans Supabase + téléverser dist/), et il
   la rappelle à la fin avec les tailles de fichiers à vérifier.
   ============================================================================ */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const RULES = path.join(ROOT, 'rules.js');
const MD = path.join(ROOT, 'docs', 'descriptions-mesures.md');
const DIST = path.join(ROOT, 'deploiement', 'dist');
const EDGE = path.join(ROOT, 'deploiement', 'edge');

const VERIF = process.argv.includes('--verifier');
const SANS_MD = process.argv.includes('--sans-md');

/* --- petits utilitaires d'affichage (pas de dépendance, pas de couleur ANSI :
       la console Windows de Vincent les rend mal dans certains terminaux) --- */
let etapeNo = 0;
const titre = t => console.log('\n[' + (++etapeNo) + '/5] ' + t);
const ok = m => console.log('      ✓ ' + m);
const info = m => console.log('      · ' + m);
function stop(msg, detail) {
  console.error('\n╳ ARRÊT — ' + msg);
  if (detail) console.error('\n' + String(detail).trim().split('\n').map(l => '   ' + l).join('\n'));
  console.error('\nRien n\'a été déployé. Corrigez, puis relancez : node tools/publier.js\n');
  process.exit(1);
}
function node(script, args, quoi) {
  /* --no-deprecation : build-dist lance esbuild via le shell, ce qui déclenche un
     avertissement Node sans rapport avec nous — il n'a rien à faire dans un rapport
     destiné à être lu par un non-développeur. */
  try { return execFileSync(process.execPath, ['--no-deprecation', script, ...(args || [])], { cwd: ROOT, encoding: 'utf8' }); }
  catch (e) { stop(quoi, (e.stdout || '') + (e.stderr || '') || e.message); }
}
function descriptions() { /* relecture à froid : rules.js change sous nos pieds */
  delete require.cache[require.resolve(RULES)];
  return require(RULES).DESCRIPTIONS;
}
const ko = f => (fs.statSync(f).size / 1024).toFixed(1).replace('.', ',') + ' Ko';

/* ---------------------------------------------------------------------------- */
console.log('\n══ PUBLIER — descriptions des mesures ' + (VERIF ? '(mode vérification, rien ne sera écrit)' : '') + ' ══');

if (!fs.existsSync(MD)) stop('le document docs/descriptions-mesures.md est introuvable.\n  Générez-le d\'abord : node tools/descriptions.js --to-md');

const avant = Object.assign({}, descriptions());
const sauvegarde = fs.readFileSync(RULES, 'utf8');

/* --- 1. document → code ---------------------------------------------------- */
titre('Réinjection du document dans le code');
if (SANS_MD) { info('sautée (--sans-md) : on publie rules.js tel quel'); }
else {
  node(path.join(__dirname, 'descriptions.js'), ['--from-md'], 'la réinjection du document a échoué.');
  const apres = descriptions();
  const modifiees = Object.keys(apres).filter(id => avant[id] && avant[id] !== apres[id]);
  const ajoutees = Object.keys(apres).filter(id => !avant[id]);
  const retirees = Object.keys(avant).filter(id => !apres[id]);
  ok(Object.keys(apres).length + ' descriptions dans rules.js');
  if (modifiees.length) info('modifiées : ' + modifiees.join(', '));
  if (ajoutees.length) info('ajoutées  : ' + ajoutees.join(', '));
  if (retirees.length) info('RETIRÉES  : ' + retirees.join(', ') + '  ← ces mesures afficheront « Description à venir. »');
  if (!modifiees.length && !ajoutees.length && !retirees.length) info('aucun changement de texte (le document est identique au code)');
  if (VERIF) { fs.writeFileSync(RULES, sauvegarde, 'utf8'); info('mode vérification : rules.js remis comme avant'); }
}

/* --- 2. tests -------------------------------------------------------------- */
titre('Vérification du moteur (tests)');
try {
  const out = execFileSync(process.execPath, ['--test', 'tests/rules.test.js'], { cwd: ROOT, encoding: 'utf8' });
  const pass = /^# pass (\d+)$/m.exec(out) || /pass (\d+)/.exec(out);
  ok((pass ? pass[1] : '?') + ' tests réussis');
} catch (e) {
  if (!VERIF && !SANS_MD) { fs.writeFileSync(RULES, sauvegarde, 'utf8'); console.error('      ↩ rules.js a été restauré dans son état d\'avant.'); }
  /* on ne montre que ce qui a CASSÉ : le journal complet (33 lignes de tests réussis)
     noierait l'information utile. */
  const brut = ((e.stdout || '') + (e.stderr || '')).split('\n');
  const i = brut.findIndex(l => /failing tests:/.test(l));
  const extrait = (i >= 0 ? brut.slice(i + 1) : brut.filter(l => /✖|Expected|!==|Error/.test(l)))
    .filter(l => l.trim() && !/^\s*at /.test(l))   /* pas de pile d'appels */
    .slice(0, 12).join('\n');
  stop('un contrôle du moteur a échoué — le document contient probablement une erreur.\n'
     + '  La ligne « ✖ » ci-dessous dit lequel ; le plus courant est une description effacée\n'
     + '  par mégarde, ou un titre « ### mXX » modifié.', extrait);
}

if (VERIF) {
  console.log('\n══ Vérification terminée — aucun fichier modifié. ══');
  console.log('Pour publier pour de vrai : node tools/publier.js\n');
  process.exit(0);
}

/* --- 3. Edge Functions ----------------------------------------------------- */
titre('Recompilation des 3 Edge Functions (catalogue serveur)');
node(path.join(__dirname, 'gen-edge-functions.js'), [], 'la génération des Edge Functions a échoué.');
for (const f of ['ville-claim.ts', 'ville-set.ts', 'admin-data.ts']) ok(f + ' — ' + ko(path.join(EDGE, f)));

/* --- 4. page publique ------------------------------------------------------ */
titre('Reconstruction de la page publique (dist/)');
node(path.join(__dirname, 'build-dist.js'), [], 'la construction de dist/ a échoué.');
const fichiersDist = fs.readdirSync(DIST).sort();
for (const f of fichiersDist) ok(f + ' — ' + ko(path.join(DIST, f)));

/* --- 5. document remis au propre ------------------------------------------- */
titre('Document de révision remis au propre');
node(path.join(__dirname, 'descriptions.js'), ['--to-md'], 'la régénération du document a échoué.');
ok('docs/descriptions-mesures.md régénéré depuis le code');

/* --- rapport --------------------------------------------------------------- */
const idx = fs.existsSync(path.join(DIST, 'index.html')) ? fs.statSync(path.join(DIST, 'index.html')) : null;
console.log('\n══ PRÊT À DÉPLOYER ══\n');
console.log('Il reste deux gestes manuels, dans cet ordre :\n');
console.log('  1. SUPABASE → Edge Functions : coller les 3 fichiers de deploiement/edge/');
console.log('     (ville-claim, ville-set, admin-data — « Enforce JWT verification » DÉSACTIVÉ).');
console.log('     Tant que ce n\'est pas fait, le site sert les ANCIENNES descriptions.\n');
console.log('  2. cPANEL → téléverser les ' + fichiersDist.length + ' fichiers de deploiement/dist/.');
if (idx) console.log('     Vérifiez la taille de index.html AVANT l\'envoi : ' + idx.size.toLocaleString('fr-CA') + ' octets.');
console.log('\n  Puis, pour contrôler : ouvrir ecofisc.corda.consulting, se connecter avec un code');
console.log('  et vérifier qu\'une mesure corrigée affiche bien le nouveau texte.\n');
console.log('  Pensez aussi au commit : git add -A && git commit -m "Descriptions des mesures" && git push\n');
