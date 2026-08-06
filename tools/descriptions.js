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

   ⚠ CE QUE --from-md NE RÉINJECTE PAS : uniquement les DESCRIPTIONS. Les titres
   des mesures (MEASURES) et les métadonnées ci-dessous (source, pouvoir
   habilitant) vivent dans le code — les corriger dans le .md ne sert à rien,
   ils seraient réécrits à la régénération. Il faut les porter ici à la main.
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
   pouvoir = pouvoir habilitant selon la feuille « Liste des mesures » du V3
          (PGT = pouvoir général de taxation · PGRR = pouvoir général de
          redevance réglementaire · LFM · LAU)
   note = traçabilité interne (d'où vient — ou ne vient pas — la description).
          Conservée ici mais PLUS affichée dans le document de révision depuis le
          4 août 2026 : Vincent l'a jugée bruyante pour la relecture de Fanny.
          La mention « ✍️ rédigée par Corda » suffit à signaler ce qui est à valider. */
const SOURCES = {
  m01: { src: 'Mascouche, fiche 10 « Taux variés par sous-catégories résidentielles » (+ fiche 8, condominiums)', aussi: 'Gatineau, fiches 2, 3 et 5', v3: true },
  m02: { src: 'Mascouche, fiches 3 (CUBF de nuisance) et 4 (CUBF à bénéfices environnementaux / économie circulaire)', aussi: 'Gatineau, fiches 7 et 8', v3: true },
  m03: { src: 'Mascouche, fiches 1 (unités de voisinage) et 2 (cinq secteurs d\'imposition)', aussi: 'Gatineau, fiche 1', v3: true },
  m04: { src: 'Mascouche, fiche 5 « Sous-catégories de taxation par tranche de valeur (non résidentiels) »', v3: true },
  m05: { src: 'Mascouche, fiche 11 « Taux varié pour les terrains vagues desservis »', aussi: 'Gatineau, fiche 10', v3: true },
  m06: { src: 'Mascouche, fiche 12 « Taxe à l\'égard des logements vacants »', aussi: 'Gatineau, fiche 6', v3: true },
  m07: { src: null, v3: true, pouvoir: 'PGT',
         note: 'Aucune fiche descriptive : Mascouche 12 et Gatineau 6 ne couvrent que le RÉSIDENTIEL. La fiche de cotation existe au V3 sous « Taxe immeubles vacants (non résidentiel) ». Écart de libellé (audit §5) RÉSOLU le 16 juill. 2026 (décision Jérôme : « immeubles », pas « logements »), libellé précisé le 4 août 2026 par Vincent en « Taxe sur les immeubles non-résidentiels vacants ». Pouvoir habilitant corrigé le 4 août 2026 : PGT (le V3 indiquait LFM).' },
  m08: { src: 'Gatineau, fiche 9 « Taxe sur les terres à vocation agricole exploitables mais non exploitées »', v3: true, pouvoir: 'LFM' },
  m09: { src: 'Mascouche, fiche 18 « Tarification du stationnement sur rue ou vignettes »', aussi: 'Gatineau, fiche 12', v3: true, pouvoir: 'LFM' },
  m10: { src: 'Mascouche, fiche 19 « Redevance visant les grands générateurs de déplacement »', v3: true, pouvoir: 'PGRR' },
  m11: { src: null, v3: false,
         note: 'Aucune trace : ni fiche descriptive (Mascouche/Gatineau), ni fiche de cotation au V3. À rédiger de zéro.' },
  m12: { src: 'Gatineau, fiche 11 « Taxe sur les espaces ou les billets de stationnements commerciaux »', v3: true, pouvoir: 'PGT + PGRR' },
  m13: { src: null, v3: true, pouvoir: 'LAU',
         note: 'Fiche de cotation au V3 (« Redevances de transport ») mais aucune fiche descriptive. À distinguer de m10 (grands générateurs) et de m16 (voirie locale). Pouvoir habilitant restreint à LAU le 4 août 2026 par Vincent (le V3 indiquait LAU + PGRR) : la redevance de transport de la LAU vise le requérant d\'un permis, pas l\'exploitation.' },
  m14: { src: 'Mascouche, fiche 24 « Taxe sur le coefficient d\'occupation du sol (COS) manquant »', aussi: 'Gatineau, fiche 13', v3: true, pouvoir: 'PGT + PGRR' },
  m15: { src: 'Mascouche, fiche 25 « Taxe sur les surfaces non végétalisées »', aussi: 'Gatineau, fiche 14 (surfaces imperméables / minéralisées)', v3: true, pouvoir: 'PGT + PGRR' },
  m16: { src: null, v3: false, note: 'Aucune trace : ni fiche descriptive, ni fiche de cotation au V3. À rédiger de zéro.' },
  m17: { src: null, v3: true, pouvoir: 'LAU',
         note: 'Fiche de cotation au V3 (« Redevances de développement ») mais aucune fiche descriptive. Outil bien documenté dans la littérature (art. 145.21 et suiv. LAU).' },
  m18: { src: 'Mascouche, fiche 13 « Taxe visant les arbres manquants en cour avant »', aussi: 'Gatineau, fiche 15', v3: true, pouvoir: 'PGT + PGRR' },
  m19: { src: 'Mascouche, fiche 14 « Redevance visant la réduction de la perte de canopée »', aussi: 'Gatineau, fiche 16', v3: true, pouvoir: 'PGRR' },
  m20: { src: null, v3: false, pouvoir: 'PGT',
         note: 'Aucune trace : ni fiche descriptive, ni fiche de cotation au V3 — rédigée de zéro le 3 août 2026. Pouvoir habilitant (PGT) et assiette (superficie, non valeur foncière) précisés le 4 août 2026 par Vincent.' },
  m21: { src: 'Mascouche, fiche 16 « Tarification incitative pour la collecte et le traitement des matières résiduelles »', aussi: 'Gatineau, fiche 17', v3: true },
  m22: { src: 'Mascouche, fiche 17 « Redevance visant les résidus de travaux de CRD »', aussi: 'Gatineau, fiche 18', v3: true,
         note: 'Description reformulée par Fanny le 6 août 2026 : l\'assujettissement est énoncé à l\'endroit plutôt qu\'à l\'envers — ce sont les requérants SANS plan de gestion des matières qui pourraient être assujettis (et non les requérants AVEC plan qui seraient exemptés). Même dispositif, énoncé positif.' },
  m23: { src: null, v3: false,
         note: 'Aucune trace. Mesure AJOUTÉE au catalogue à la demande de la MRC (elle ne vient pas du corpus V3). Rédigée de zéro le 3 août 2026. Titre élargi le 4 août 2026 par Vincent (« Taxe OU redevance sur la démolition ») : les deux véhicules juridiques restent ouverts, la description distingue leurs finalités.' },
  m24: { src: 'Gatineau, fiche 19 « Redevance sur les contenants à usage unique ou individuel »', v3: true, pouvoir: 'PGRR' },
  m25: { src: null, v3: true, pouvoir: 'PGRR',
         note: 'CHANGEMENT D\'OBJET (4 août 2026, Vincent) : « Redevance sur les émissions de polluant par les industries (dont les GES) » devient « Redevance sur la performance énergétique et climatique des immeubles ». La mesure absorbe m27 (retirée le même jour) : elle vise désormais les PROPRIÉTAIRES D\'IMMEUBLES, plus seulement les établissements industriels, et l\'assiette inclut la performance énergétique. ⚠ La fiche de COTATION du V3 (« Redevance sur les émissions de polluant par les industries ») porte donc sur un objet plus étroit — à signaler à Jérôme : ses cotes restent-elles valides pour la mesure élargie ?' },
  m26: { src: 'Gatineau, fiche 21 « Redevance visant à compenser les GES associés au développement immobilier »', v3: false },
  /* m27 RETIRÉE du catalogue le 4 août 2026 (fusionnée dans m25). Entrée conservée en
     commentaire pour la traçabilité — l'identifiant n'est pas réattribué :
     m27: { src: null, v3: false, note: 'Aucune trace : ni fiche descriptive, ni fiche de cotation au V3. À rédiger de zéro.' }, */
  m28: { src: 'Mascouche, fiche 15 « Taxe sur les systèmes au mazout ou système biénergie »', aussi: 'Gatineau, fiche 20', v3: true, pouvoir: 'PGT + PGRR' },
  m29: { src: 'Mascouche, fiche 20 « Redevances sur les rejets d\'eaux usées »', aussi: 'Gatineau, fiche 24', v3: false },
  m30: { src: 'Mascouche, fiche 21 « Tarification de l\'eau potable — secteur résidentiel »', aussi: 'Gatineau, fiche 22', v3: true, pouvoir: 'LFM',
         note: 'RESSERREMENT D\'OBJET (6 août 2026, Fanny) : la description offrait le choix entre tarif variable et tarif forfaitaire. « Pas mal tout le monde a ça » — le forfait n\'a aucune portée écofiscale, la mesure ne retient donc que la tarification VARIABLE (au compteur), et le mot « variable » monte dans le titre. Titre : « Tarification eau résidentiel » → « Tarification variable de l\'eau (résidentiel) ». ⚠ Les cotes du V3 ont été attribuées à la mesure large (variable OU forfait) — même question qu\'à m25 : restent-elles valides ?' },
  m31: { src: 'Mascouche, fiche 22 « Tarification de l\'eau potable — ICI »', aussi: 'Gatineau, fiche 23', v3: true, pouvoir: 'LFM',
         note: 'RESSERREMENT D\'OBJET (6 août 2026, Fanny) — identique à m30, pour les ICI. Titre : « Tarification eau ICI » → « Tarification variable de l\'eau (ICI) ».' },
  m32: { src: 'Mascouche, fiche 23 « Transformation de la tarification sur les piscines en taxe »', aussi: 'Gatineau, fiche 22 (traite les piscines avec l\'eau résidentielle)', v3: false,
         note: 'ÉLARGISSEMENT (6 août 2026, Fanny) : la mesure n\'est plus la seule transformation de la tarification existante en taxe — c\'est l\'application du pouvoir général de taxation aux immeubles dotés d\'une piscine, la transformation devenant une modalité parmi d\'autres.' },
  m33: { src: null, v3: true, note: 'Fiche de cotation au V3 (« Redevance d\'amusement », cotée entièrement Neutre) mais aucune fiche descriptive.' },
  m34: { src: 'Gatineau, fiche 26 « Redevance d\'hébergement touristique »', v3: true },
  m35: { src: null, v3: true, note: 'Fiche de cotation au V3 (« Taxe sur les panneaux d\'affichage ») mais aucune fiche descriptive.' },
  m36: { src: 'Gatineau, fiche 27 « Redevance sur les services de câblodistribution / infrastructures de télécommunication »', v3: true,
         note: '⏳ EN ATTENTE DE JÉRÔME (demande de Fanny, 6 août 2026) : « faire valider la définition par Jérôme ». Seule mesure de la révision du 6 août laissée telle quelle — la description en ligne reste celle de la fiche Gatineau 27 tant que Jérôme ne s\'est pas prononcé.' },
  m37: { src: null, v3: true, note: 'Fiche de cotation au V3 (« Redevance sur les générateurs de risques ») mais aucune fiche descriptive. Libellé raccourci le 4 août 2026 par Vincent (parenthèse « dont les réservoirs de produits chimiques » retirée du titre, l\'exemple restant dans la description) ; les redevables sont les PROPRIÉTAIRES et non les exploitants.' },
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
  /* Les mesures sans fiche source = celles rédigées par Corda, à faire valider.
     Comptées à partir de SOURCES pour ne plus jamais mentir quand le catalogue bouge. */
  const redigees = MEASURES.filter(m => !(SOURCES[m.id] || {}).src).map(m => m.id);
  const avecCotationV3 = redigees.filter(id => (SOURCES[id] || {}).v3);
  const sansRien = redigees.filter(id => !(SOURCES[id] || {}).v3);
  const sourcees = MEASURES.length - redigees.length;

  L.push(`## Les ${redigees.length} absences comblées — rédigées le 3 août 2026, à valider`);
  L.push('');
  L.push('| Situation | Mesures | Matière première disponible |');
  L.push('|---|---|---|');
  L.push(`| Fiche de cotation au V3, **mais aucune fiche descriptive** | ${avecCotationV3.join(', ')} | le libellé, le pouvoir habilitant, les cotes de Jérôme — pas de prose |`);
  L.push(`| **Aucune trace nulle part** (ni description, ni cotation) | ${sansRien.join(', ')} | rien : m23 (démolition) a même été ajoutée hors corpus V3 |`);
  L.push('');
  L.push(`Ni les fiches Mascouche/Gatineau, ni les fiches du classeur V3 (qui ne contiennent que des cotes) ne couvraient ces ${redigees.length} mesures :`);
  L.push('il n\'y avait **rien à extraire**. Elles ont donc été **rédigées par Corda** le 3 août 2026 — mécanisme, assiette et finalité,');
  L.push(`dans le même format que les ${sourcees} autres — à partir du pouvoir habilitant inscrit au V3 et de la pratique municipale québécoise.`);
  L.push('');
  L.push(`> [!warning] Ces ${redigees.length} descriptions n'ont **aucune caution scientifique** tant que Fanny ou Jérôme ne les a pas relues.`);
  L.push('> Elles sont repérables ci-dessous à la mention ✍️ **rédigée par Corda**. Corrigez-les directement dans ce document :');
  L.push('> `node tools/publier.js` les remet en production. Les descriptions issues des fiches Mascouche/Gatineau, elles, sont sourcées.');
  L.push('');
  L.push('> [!info] Révision de Vincent, 4 août 2026 — trois changements de **structure**, pas seulement de texte :');
  L.push('> **m27** (« Redevance à l\'égard de la performance énergétique des bâtiments ») est **retirée** du catalogue,');
  L.push('> **fusionnée dans m25** dont l\'objet s\'élargit aux immeubles et à la performance énergétique. L\'identifiant m27');
  L.push('> n\'est pas réattribué et rien n\'est renuméroté (les réponses en base sont indexées par `mXX`).');
  L.push('> **m07, m23, m37** ont été renommées. ⚠️ Point à trancher avec Jérôme : les cotes du V3 pour m25 portaient sur');
  L.push('> les seules émissions industrielles — restent-elles valides pour la mesure élargie ?');
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
    /* s.note n'est PLUS émise ici (décision du 4 août 2026) : elle alourdissait la
       relecture. Elle reste dans SOURCES, en tête de ce fichier, pour la traçabilité. */
  }

  L.push('---');
  L.push('');
  L.push('## Écarts de catalogue relevés au passage');
  L.push('');
  L.push(`Des mesures **décrites dans les documents sources** n'existent pas dans le catalogue des ${MEASURES.length} :`);
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
  L.push(`1. **Les ${redigees.length} rédigées par Corda** (question C2 du dossier de validation) — elles sont maintenant écrites,`);
  L.push('   faute de source à extraire, et **révisées par Vincent le 4 août 2026**. Reste à faire : les **relire** et confirmer');
  L.push('   que chacune décrit bien la mesure que la grille avait en tête (surtout m11, m13, m16 et m17, quatre redevances');
  L.push('   de transport / développement dont les périmètres se recoupent — la révision du 4 août les a resserrées : m13 vise');
  L.push('   le requérant d\'un permis, m16 l\'utilisateur de la voirie, m11 l\'usager du transport rémunéré).');
  L.push('2. **m25 élargie, m27 retirée (4 août 2026)** — la redevance sur les émissions industrielles devient une redevance');
  L.push('   sur la **performance énergétique et climatique des immeubles**, et absorbe l\'ancienne m27. **Pour Jérôme :** les cotes');
  L.push('   du V3 pour m25 ont été attribuées à la mesure étroite (émissions industrielles). Valent-elles pour la mesure élargie,');
  L.push('   ou faut-il recoter ? Le catalogue passe de 37 à **36 mesures**.');
  L.push('3. **Pouvoirs habilitants corrigés (4 août 2026)** — m07 : LFM → **PGT** · m13 : LAU + PGRR → **LAU** · m20 : **PGT** (absent du V3).');
  L.push('   À confirmer, ces attributions venaient de la feuille « Liste des mesures » du V3.');
  L.push('4. **Les 5 mesures des sources absentes du catalogue** (tableau ci-dessus) — à ajouter, ou hors mandat ?');
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
