"use strict";
/* ============================================================================
   Descriptions des mesures — aller-retour entre le code et un document révisable

     node tools/descriptions.js --to-md     rules.js  →  docs/descriptions-mesures.md
     node tools/descriptions.js --from-md   docs/descriptions-mesures.md  →  rules.js

   Le document est fait pour être RÉVISÉ (Obsidian, Word, n'importe quoi) puis
   réinjecté sans recopiage à la main. Après --from-md :
       node tools/gen-edge-functions.js     (recompile le catalogue serveur)
       node tools/build-dist.js             (reconstruit la page publique)
   puis Vincent redéploie les 3 Edge Functions + dist/ — sinon le site en ligne
   continue de servir les anciennes descriptions.

   PROVENANCE : les fiches sources sont recensées dans SOURCES ci-dessous
   (Mascouche 2025 et Gatineau 2025, dir. F. Tremblay-Racicot). C'est la seule
   partie de ce fichier qui demande un jugement humain : elle documente d'où
   vient chaque description.
   ============================================================================ */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const RULES_PATH = path.join(ROOT, 'rules.js');
const MD_PATH = path.join(ROOT, 'docs', 'descriptions-mesures.md');
const Rules = require(RULES_PATH);

/* Fiche(s) source de chaque description + matière première pour les manquantes.
   src  = fiche d'où la description actuelle a été tirée
   aussi= autre fiche couvrant la même mesure (utile en révision)
   v3   = une fiche de COTATION existe dans la Grille d'analyse multicritère V3
          (cotes seulement — ces fiches ne contiennent aucune description)
   pouvoir = pouvoir habilitant selon la feuille « Liste des mesures » du V3 */
const SOURCES = {
  m01: { src: 'Mascouche, fiche 10 « Taux variés par sous-catégories résidentielles » (+ fiche 8, condominiums)', aussi: 'Gatineau, fiches 2, 3 et 5', v3: true },
  m02: { src: 'Mascouche, fiches 3 (CUBF de nuisance) et 4 (CUBF à bénéfices environnementaux / économie circulaire)', aussi: 'Gatineau, fiches 7 et 8', v3: true },
  m03: { src: 'Mascouche, fiches 1 (unités de voisinage) et 2 (cinq secteurs d\'imposition)', aussi: 'Gatineau, fiche 1', v3: true },
  m04: { src: 'Mascouche, fiche 5 « Sous-catégories de taxation par tranche de valeur (non résidentiels) »', v3: true },
  m05: { src: 'Mascouche, fiche 11 « Taux varié pour les terrains vagues desservis »', aussi: 'Gatineau, fiche 10', v3: true },
  m06: { src: 'Mascouche, fiche 12 « Taxe à l\'égard des logements vacants »', aussi: 'Gatineau, fiche 6', v3: true },
  m07: { src: null, v3: true, pouvoir: 'LFM',
         note: 'Aucune fiche descriptive : Mascouche 12 et Gatineau 6 ne couvrent que le RÉSIDENTIEL. La fiche de cotation existe au V3 sous « Taxe immeubles vacants (non résidentiel) ». Écart de libellé (audit §5) RÉSOLU le 16 juill. 2026 : le catalogue reprend désormais le libellé V3 « immeubles » (décision Jérôme).' },
  m08: { src: 'Gatineau, fiche 9 « Taxe sur les terres à vocation agricole exploitables mais non exploitées »', v3: true, pouvoir: 'LFM' },
  m09: { src: 'Mascouche, fiche 18 « Tarification du stationnement sur rue ou vignettes »', aussi: 'Gatineau, fiche 12', v3: true, pouvoir: 'LFM' },
  m10: { src: 'Mascouche, fiche 19 « Redevance visant les grands générateurs de déplacement »', v3: true, pouvoir: 'PGRR' },
  m11: { src: null, v3: false,
         note: 'Aucune trace : ni fiche descriptive (Mascouche/Gatineau), ni fiche de cotation au V3. À rédiger de zéro.' },
  m12: { src: 'Gatineau, fiche 11 « Taxe sur les espaces ou les billets de stationnements commerciaux »', v3: true, pouvoir: 'PGT + PGRR' },
  m13: { src: null, v3: true, pouvoir: 'LAU + PGRR',
         note: 'Fiche de cotation au V3 (« Redevances de transport ») mais aucune fiche descriptive. À distinguer de m10 (grands générateurs) et de m16 (voirie locale).' },
  m14: { src: 'Mascouche, fiche 24 « Taxe sur le coefficient d\'occupation du sol (COS) manquant »', aussi: 'Gatineau, fiche 13', v3: true, pouvoir: 'PGT + PGRR' },
  m15: { src: 'Mascouche, fiche 25 « Taxe sur les surfaces non végétalisées »', aussi: 'Gatineau, fiche 14 (surfaces imperméables / minéralisées)', v3: true, pouvoir: 'PGT + PGRR' },
  m16: { src: null, v3: false, note: 'Aucune trace : ni fiche descriptive, ni fiche de cotation au V3. À rédiger de zéro.' },
  m17: { src: null, v3: true, pouvoir: 'LAU',
         note: 'Fiche de cotation au V3 (« Redevances de développement ») mais aucune fiche descriptive. Outil bien documenté dans la littérature (art. 145.21 et suiv. LAU).' },
  m18: { src: 'Mascouche, fiche 13 « Taxe visant les arbres manquants en cour avant »', aussi: 'Gatineau, fiche 15', v3: true, pouvoir: 'PGT + PGRR' },
  m19: { src: 'Mascouche, fiche 14 « Redevance visant la réduction de la perte de canopée »', aussi: 'Gatineau, fiche 16', v3: true, pouvoir: 'PGRR' },
  m20: { src: null, v3: false, note: 'Aucune trace : ni fiche descriptive, ni fiche de cotation au V3. À rédiger de zéro.' },
  m21: { src: 'Mascouche, fiche 16 « Tarification incitative pour la collecte et le traitement des matières résiduelles »', aussi: 'Gatineau, fiche 17', v3: true },
  m22: { src: 'Mascouche, fiche 17 « Redevance visant les résidus de travaux de CRD »', aussi: 'Gatineau, fiche 18', v3: true },
  m23: { src: null, v3: false,
         note: 'Aucune trace. Mesure AJOUTÉE au catalogue à la demande de la MRC (elle ne vient pas du corpus V3). À rédiger de zéro.' },
  m24: { src: 'Gatineau, fiche 19 « Redevance sur les contenants à usage unique ou individuel »', v3: true, pouvoir: 'PGRR' },
  m25: { src: null, v3: true, pouvoir: 'PGRR',
         note: 'Fiche de cotation au V3 (« Redevance sur les émissions de polluant par les industries ») mais aucune fiche descriptive.' },
  m26: { src: 'Gatineau, fiche 21 « Redevance visant à compenser les GES associés au développement immobilier »', v3: false },
  m27: { src: null, v3: false, note: 'Aucune trace : ni fiche descriptive, ni fiche de cotation au V3. À rédiger de zéro.' },
  m28: { src: 'Mascouche, fiche 15 « Taxe sur les systèmes au mazout ou système biénergie »', aussi: 'Gatineau, fiche 20', v3: true, pouvoir: 'PGT + PGRR' },
  m29: { src: 'Mascouche, fiche 20 « Redevances sur les rejets d\'eaux usées »', aussi: 'Gatineau, fiche 24', v3: false },
  m30: { src: 'Mascouche, fiche 21 « Tarification de l\'eau potable — secteur résidentiel »', aussi: 'Gatineau, fiche 22', v3: true, pouvoir: 'LFM' },
  m31: { src: 'Mascouche, fiche 22 « Tarification de l\'eau potable — ICI »', aussi: 'Gatineau, fiche 23', v3: true, pouvoir: 'LFM' },
  m32: { src: 'Mascouche, fiche 23 « Transformation de la tarification sur les piscines en taxe »', aussi: 'Gatineau, fiche 22 (traite les piscines avec l\'eau résidentielle)', v3: false },
  m33: { src: null, v3: true, note: 'Fiche de cotation au V3 (« Redevance d\'amusement », cotée entièrement Neutre) mais aucune fiche descriptive.' },
  m34: { src: 'Gatineau, fiche 26 « Redevance d\'hébergement touristique »', v3: true },
  m35: { src: null, v3: true, note: 'Fiche de cotation au V3 (« Taxe sur les panneaux d\'affichage ») mais aucune fiche descriptive.' },
  m36: { src: 'Gatineau, fiche 27 « Redevance sur les services de câblodistribution / infrastructures de télécommunication »', v3: true },
  m37: { src: null, v3: true, note: 'Fiche de cotation au V3 (« Redevance sur les générateurs de risques ») mais aucune fiche descriptive.' },
};

/* ---------------------------------------------------------------- --to-md */
function toMd() {
  const { MEASURES, CATS, DESCRIPTIONS } = Rules;
  const nOk = MEASURES.filter(m => DESCRIPTIONS[m.id]).length;
  const L = [];

  L.push('# Descriptions des mesures — document de révision');
  L.push('');
  L.push(`**Généré par** \`node tools/descriptions.js --to-md\` · **${nOk} des ${MEASURES.length} mesures** ont une description.`);
  L.push('');
  L.push('> [!important] Ce document est la copie révisable de ce que le site sert aux villes.');
  L.push('> Corrige librement le texte sous chaque **Description**. Ne touche pas aux titres `### mXX`,');
  L.push('> ce sont eux qui permettent la réinjection automatique. Renvoie-moi le fichier :');
  L.push('> `node tools/descriptions.js --from-md` le réécrit dans le code, sans recopiage à la main.');
  L.push('');
  L.push('## D\'où le site tire ses descriptions');
  L.push('');
  L.push('```');
  L.push('  Fiches Mascouche + Gatineau (2025, dir. F. Tremblay-Racicot)   ← documents sources');
  L.push('        │  condensées en 1-3 phrases, exemples chiffrés génériqués');
  L.push('        ▼');
  L.push('  rules.js  →  const DESCRIPTIONS = { m01: "…", … }              ← SOURCE UNIQUE (dépôt)');
  L.push('        │  node tools/gen-edge-functions.js  (compile le catalogue)');
  L.push('        ▼');
  L.push('  deploiement/edge/{ville-claim, ville-set, admin-data}.ts        ← copies compilées');
  L.push('        │  Vincent colle les 3 fonctions dans Supabase');
  L.push('        ▼');
  L.push('  Edge Function Supabase  →  catalogue()  →  { descriptions }     ← ce que le SERVEUR détient');
  L.push('        │  livré APRÈS authentification seulement (« coffre-fort »)');
  L.push('        ▼');
  L.push('  ecofisc.corda.consulting  →  descHTML()  →  écran de cotation   ← ce que la ville LIT');
  L.push('```');
  L.push('');
  L.push('La page publique ne contient **aucune** description : elle les reçoit du serveur une fois le code validé.');
  L.push('Une mesure sans description affiche « Description à venir. » à l\'écran.');
  L.push('');
  L.push('**Conséquence à retenir :** corriger `rules.js` ne suffit pas. Tant que les 3 Edge Functions ne sont pas');
  L.push('recollées dans Supabase, le site en ligne continue de servir les anciennes descriptions.');
  L.push('');
  L.push('## Les 12 anciennes absences — rédigées le 3 août 2026, à valider');
  L.push('');
  L.push('| Situation | Mesures | Matière première disponible |');
  L.push('|---|---|---|');
  L.push('| Fiche de cotation au V3, **mais aucune fiche descriptive** | m07, m13, m17, m25, m33, m35, m37 | le libellé, le pouvoir habilitant, les cotes de Jérôme — pas de prose |');
  L.push('| **Aucune trace nulle part** (ni description, ni cotation) | m11, m16, m20, m23, m27 | rien : m23 (démolition) a même été ajoutée hors corpus V3 |');
  L.push('');
  L.push('Ni les fiches Mascouche/Gatineau, ni les fiches du classeur V3 (qui ne contiennent que des cotes) ne couvraient ces 12 mesures :');
  L.push('il n\'y avait **rien à extraire**. Elles ont donc été **rédigées par Corda** le 3 août 2026 — mécanisme, assiette et finalité,');
  L.push('dans le même format que les 25 autres — à partir du pouvoir habilitant inscrit au V3 et de la pratique municipale québécoise.');
  L.push('');
  L.push('> [!warning] Ces 12 descriptions n\'ont **aucune caution scientifique** tant que Fanny ou Jérôme ne les a pas relues.');
  L.push('> Elles sont repérables ci-dessous à la mention ✍️ **rédigée par Corda**. Corrigez-les directement dans ce document :');
  L.push('> `node tools/publier.js` les remet en production. Les descriptions issues des fiches Mascouche/Gatineau, elles, sont sourcées.');
  L.push('');
  L.push('---');
  L.push('');

  let lastCat = null;
  for (const m of MEASURES) {
    if (m.cat !== lastCat) { L.push(`## ${CATS[m.cat].label}`); L.push(''); lastCat = m.cat; }
    const s = SOURCES[m.id] || {};
    const d = DESCRIPTIONS[m.id];
    L.push(`### ${m.id} · ${m.titre}`);
    L.push('');
    const meta = [d ? '**en ligne**' : '⛔ **absente** — l\'app affiche « Description à venir. »'];
    /* pas de fiche source = l'une des 12 rédigées par Corda le 3 août 2026 (aucune
       des deux sources ne les couvrait) → à faire valider avant diffusion. */
    meta.push(`source : ${s.src || '✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme**'}`);
    if (s.aussi) meta.push(`aussi couverte par ${s.aussi}`);
    if (s.pouvoir) meta.push(`pouvoir habilitant (V3) : ${s.pouvoir}`);
    L.push(meta.join(' · '));
    L.push('');
    L.push('**Description**');
    L.push('');
    L.push(d || '<!-- À RÉDIGER -->');
    L.push('');
    if (s.note) { L.push(`*Note : ${s.note}*`); L.push(''); }
  }

  L.push('---');
  L.push('');
  L.push('## Écarts de catalogue relevés au passage');
  L.push('');
  L.push('Des mesures **décrites dans les documents sources** n\'existent pas dans le catalogue des 37 :');
  L.push('');
  L.push('| Mesure des sources | Où | Statut |');
  L.push('|---|---|---|');
  L.push('| Taux variés selon la **superficie habitable** | Mascouche 9 · Gatineau 3 · fiche V3 | absente du catalogue TDB (déjà signalée à l\'audit de fidélité, §5) |');
  L.push('| Taux supérieur — terrain résidentiel > 9 000 pi² | Mascouche 6 | absente du catalogue TDB |');
  L.push('| Taux supérieur — terrain **scindable** (constructible) | Mascouche 7 | absente du catalogue TDB |');
  L.push('| Taxation des unifamiliaux à très grande superficie | Gatineau 4 | absente (proche de « superficie habitable ») |');
  L.push('| Tarification de la gestion des **fosses septiques** | Gatineau 25 | absente du catalogue TDB |');
  L.push('');
  L.push('Rien à corriger en soi — le catalogue TDB vient de la *Grille des mesures* de la MRC, pas du corpus V3.');
  L.push('Mais c\'est une décision de mandat à confirmer : **choix délibéré, ou oubli ?**');
  L.push('');
  L.push('## Questions ouvertes (pour Fanny / Jérôme)');
  L.push('');
  L.push('1. **Les 12 rédigées par Corda** (question C2 du dossier de validation) — elles sont maintenant écrites,');
  L.push('   faute de source à extraire. Restent à faire : les **relire** et confirmer que chacune décrit bien la mesure');
  L.push('   que la grille avait en tête (surtout m11, m13, m16 et m17, quatre redevances de transport / développement');
  L.push('   dont les périmètres se recoupent). Existe-t-il des fiches d\'un autre mandat qui les couvriraient mieux ?');
  L.push('2. **m07 — RÉSOLU (16 juill. 2026)** : le catalogue reprend désormais le libellé V3 « Taxe **immeubles** vacants (non résidentiel) »');
  L.push('   (décision Jérôme — un non-résidentiel n\'a pas de « logements » ; anciennement « Taxe logements vacants »).');
  L.push('3. **Les 5 mesures des sources absentes du catalogue** (tableau ci-dessus) — à ajouter, ou hors mandat ?');
  L.push('');

  fs.mkdirSync(path.dirname(MD_PATH), { recursive: true });
  fs.writeFileSync(MD_PATH, L.join('\n'), 'utf8');
  console.log(`OK → docs/descriptions-mesures.md (${nOk}/${MEASURES.length} descriptions, ${MEASURES.length - nOk} à rédiger)`);
}

/* -------------------------------------------------------------- --from-md */
function fromMd() {
  /* fins de ligne normalisées : le .md peut revenir de Word, d'Obsidian ou de
     OneDrive en CRLF — les gabarits ci-dessous raisonnent en \n. */
  const md = fs.readFileSync(MD_PATH, 'utf8').replace(/\r\n/g, '\n');
  const found = {};

  /* chaque bloc « ### mXX … » jusqu'au prochain titre ; la description est ce qui
     suit la ligne « **Description** » (les notes en italique sont ignorées). */
  const blocks = md.split(/^### (m\d\d)[^\n]*$/m);
  for (let i = 1; i < blocks.length; i += 2) {
    const id = blocks[i];
    const body = blocks[i + 1];
    const mm = /\*\*Description\*\*\s*\n+([\s\S]*?)(?=\n\s*\n\s*(?:\*Note ?:|###|##|---)|$)/.exec(body);
    if (!mm) continue;
    const txt = mm[1].trim().replace(/\s*\n\s*/g, ' ');
    if (!txt || /^<!--/.test(txt)) continue;   /* « À RÉDIGER » → reste absente */
    found[id] = txt;
  }

  const known = new Set(Rules.MEASURES.map(m => m.id));
  const unknown = Object.keys(found).filter(id => !known.has(id));
  if (unknown.length) { console.error('ERREUR — identifiants inconnus dans le .md : ' + unknown.join(', ')); process.exit(1); }

  const src = fs.readFileSync(RULES_PATH, 'utf8');
  const EOL = src.includes('\r\n') ? '\r\n' : '\n';   /* rules.js est en CRLF ici */

  const esc = s => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const body = Rules.MEASURES
    .filter(m => found[m.id])
    .map(m => `    ${m.id}:"${esc(found[m.id])}",`)
    .join(EOL);

  /* on teste que le bloc EXISTE — pas que le fichier a changé : un aller-retour
     sans modification est idempotent, et doit le rester (c'est le test). */
  const BLOC = /(const DESCRIPTIONS = \{\r?\n)[\s\S]*?(\r?\n {2}\};)/;
  if (!BLOC.test(src)) { console.error('ERREUR — bloc DESCRIPTIONS introuvable dans rules.js.'); process.exit(1); }
  const next = src.replace(BLOC, (_all, open, close) => open + body + close);
  fs.writeFileSync(RULES_PATH, next, 'utf8');

  const before = Object.keys(Rules.DESCRIPTIONS).length;
  const after = Object.keys(found).length;
  console.log(`OK → rules.js : ${after} descriptions (${before} avant, ${after - before >= 0 ? '+' : ''}${after - before}).`);
  console.log('SUITE : node --test tests/rules.test.js && node tools/gen-edge-functions.js && node tools/build-dist.js');
  console.log('        puis Vincent redéploie les 3 Edge Functions + dist/ (sinon le site sert encore les anciennes).');
}

const mode = process.argv[2];
if (mode === '--to-md') toMd();
else if (mode === '--from-md') fromMd();
else { console.error('usage : node tools/descriptions.js --to-md | --from-md'); process.exit(1); }
