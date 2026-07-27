"use strict";
/* ============================================================================
   Tests du moteur de cotation (rules.js) — Orchestrateur · Corda Écofiscalité
   Exécution :   node --test tests/     (depuis le dossier Appli/)
   Zéro dépendance : test runner intégré de Node (node:test), Node ≥ 18.
   Chaque règle testée est documentée en prose dans docs/methodologie.md.
   ============================================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../rules.js');

/* ---------- Règle 1 · apprec : cotes d'une dimension → appréciation ----------
   Doctrine = formules du classeur V3 (fiches, col. B), décision Jérôme 16 juill. 2026.
   Seuils : TF dès S≥1 sans négatif · PDF dès S≤−1 sans positif (≠ seuils ±2 du guide). */
test('apprec — S≥1 sans négatif → très favorable (seuil Excel, dès +1)', () => {
  assert.equal(R.apprec([1,1,1]), 'tf');
  assert.equal(R.apprec([1,1,0]), 'tf');
  assert.equal(R.apprec([1,0,0]), 'tf');       // S=1 sans négatif → TF (et non « favorable »)
});
test("apprec — S>0 mais présence d'un négatif → favorable (le négatif bloque le TF)", () => {
  assert.equal(R.apprec([1,1,1,-1]), 'f');     // S=2 avec un négatif
  assert.equal(R.apprec([1,1,-1]), 'f');       // S=1 avec un négatif
});
test('apprec — S=0 → neutre', () => {
  assert.equal(R.apprec([0,0]), 'n');
  assert.equal(R.apprec([1,-1]), 'n');         // compensation exacte
});
test('apprec — aucune réponse → neutre (garde défensive)', () => {
  assert.equal(R.apprec([]), 'n');
});
test('apprec — S<0 avec au moins un positif → peu favorable', () => {
  assert.equal(R.apprec([-1,-1,1]), 'pf');
  assert.equal(R.apprec([-1,-1,-1,1]), 'pf');  // symétrique du cas favorable
});
test('apprec — S≤−1 sans positif → pas du tout favorable (seuil Excel, dès −1)', () => {
  assert.equal(R.apprec([-1]), 'pdf');         // un seul −1 → PDF (et non « peu favorable »)
  assert.equal(R.apprec([-1,0,0,0,0,0]), 'pdf');
  assert.equal(R.apprec([-1,-1]), 'pdf');
});

/* ---------- Règle 2 · reco : 4 appréciations → recommandation ----------
   Doctrine = formule du classeur V3 (Synthèse, col. F). Recommandée dès 1 favorable
   sans PF/PDF ; tout-Neutre reste à l'étude ; un seul PDF ou ≥2 PF → non recommandée. */
test('reco — ≥1 dimension favorable sans PF/PDF → recommandée (seuil Excel, dès 1 favorable)', () => {
  assert.equal(R.reco(['tf','tf','tf','tf']), 'rec');
  assert.equal(R.reco(['f','f','n','n']), 'rec');
  assert.equal(R.reco(['f','n','n','n']), 'rec');   // une seule favorable suffit désormais
  assert.equal(R.reco(['n','tf','n','n']), 'rec');  // « générateurs de risques » V3
});
test('reco — ≥1 pas-du-tout-favorable → non recommandée (véto)', () => {
  assert.equal(R.reco(['tf','tf','tf','pdf']), 'non');
});
test('reco — ≥2 peu-favorables → non recommandée', () => {
  assert.equal(R.reco(['pf','pf','f','f']), 'non');
});
test('reco — 1 seul peu-favorable bloque la recommandation → étude', () => {
  assert.equal(R.reco(['tf','f','pf','n']), 'etude');   // fav=2 mais pf=1
});
test('reco — tout neutre → étude (aucune favorable)', () => {
  assert.equal(R.reco(['n','n','n','n']), 'etude');
});

/* ---------- Non-régression : les 5 recommandations V3 qui basculent vers la doctrine Excel ----------
   Cotes brutes réelles du classeur → apprec → reco. Vérifie que le moteur reproduit
   la colonne « Recommandation » de la Synthèse V3 (et non l'ancien résultat « guide »). */
test('bascule — Taxe logements vacants (résid.) : SG=[−1,0…] → PDF → non recommandée', () => {
  const sg = R.apprec([-1,0,0,0,0,0]);         // un seul −1 en Saine gestion
  assert.equal(sg, 'pdf');
  assert.equal(R.reco(['n', sg, 'tf', 'tf']), 'non');   // guide donnait « étude »
});
test('bascule — Redevance émissions industrielles : SG=[0,0,−1,…] → PDF → non recommandée', () => {
  assert.equal(R.reco(['n', R.apprec([0,0,-1,0,0,0]), 'n', 'tf']), 'non');
});
test('bascule — Redevance générateurs de risques : (n,tf,n,n) → recommandée', () => {
  assert.equal(R.reco(['n','tf','n','n']), 'rec');       // guide donnait « étude »
});

/* ---------- Règle 3 · villeMoyenne : agrégation des répondants ---------- */
test('villeMoyenne — moyenne arrondie', () => {
  assert.equal(R.villeMoyenne([1,1,-1]), 0);   // 0,33 → 0
  assert.equal(R.villeMoyenne([1,1,0]), 1);    // 0,67 → 1
  assert.equal(R.villeMoyenne([1]), 1);
});
test('villeMoyenne — sans données → null', () => {
  assert.equal(R.villeMoyenne([]), null);
  assert.equal(R.villeMoyenne(null), null);
});
test("villeMoyenne — ⚠ asymétrie d'arrondi à ±0,5 (comportement actuel, à valider — méthodo §4)", () => {
  assert.equal(R.villeMoyenne([1,0]), 1);      // +0,5 → +1
  assert.equal(R.villeMoyenne([-1,0]), 0);     // −0,5 → 0 (et non −1)
});

/* ---------- Règle 4 · mrcSynthese : majorité des recommandations ---------- */
test('mrcSynthese — majorité simple', () => {
  assert.equal(R.mrcSynthese(['rec','rec','non']).maj, 'rec');
  assert.equal(R.mrcSynthese(['etude','etude','rec']).maj, 'etude');
});
test('mrcSynthese — compte exact par catégorie', () => {
  assert.deepEqual(R.mrcSynthese(['rec','etude','non','rec']).cc, {rec:2, etude:1, non:1});
});
test("mrcSynthese — égalités : « non » prime, puis « rec » prime sur « étude » (à valider — méthodo §5)", () => {
  assert.equal(R.mrcSynthese(['rec','non']).maj, 'non');
  assert.equal(R.mrcSynthese(['rec','etude']).maj, 'rec');
  assert.equal(R.mrcSynthese(['etude','non']).maj, 'non');
});
test('mrcSynthese — liste vide → « non » (garde : les appelants filtrent les villes sans données)', () => {
  assert.equal(R.mrcSynthese([]).maj, 'non');  // comportement actuel documenté, jamais atteint dans l'UI
});

/* ---------- Intégrité des données de référence (grille V3) ---------- */
test('DIMENSIONS — 4 dimensions, 22 critères, ids uniques', () => {
  assert.equal(R.DIMENSIONS.length, 4);
  assert.equal(R.NCRIT, 22);
  assert.equal(R.ALLCRIT.length, 22);
  assert.equal(new Set(R.ALLCRIT.map(c=>c.id)).size, 22);
});
test('DIMENSIONS — répartition des critères (3/6/7/6)', () => {
  assert.deepEqual(R.DIMENSIONS.map(d=>d.crit.length), [3,6,7,6]);
});
test('DIMENSIONS — chaque critère porte sa question et sa boussole (pos/neg)', () => {
  for(const c of R.ALLCRIT){
    assert.ok(c.label && c.q, `critère ${c.id} : label/question manquant`);
    assert.ok(c.pos && c.neg, `critère ${c.id} : boussole pos/neg manquante`);
  }
});
test('APPREC / RECO — codes complets et libellés français', () => {
  assert.deepEqual(Object.keys(R.APPREC), ['tf','f','n','pf','pdf']);
  assert.deepEqual(Object.keys(R.RECO), ['rec','etude','non']);
  for(const k of Object.keys(R.RECO)) assert.ok(R.RECO[k].l && R.RECO[k].abbr && R.RECO[k].tc);
});

/* ---------- Intégrité du catalogue des mesures (source de la whitelist serveur) ---------- */
test('MEASURES — 37 mesures, ids m01…m37 uniques, catégories valides', () => {
  assert.equal(R.MEASURES.length, 37);
  const ids = R.MEASURES.map(m=>m.id);
  assert.equal(new Set(ids).size, 37);
  for(const [i,id] of ids.entries()) assert.equal(id, 'm'+String(i+1).padStart(2,'0'));
  for(const m of R.MEASURES){
    assert.ok(m.titre && m.titre.trim(), `mesure ${m.id} : titre manquant`);
    assert.ok(R.CATS[m.cat], `mesure ${m.id} : catégorie inconnue « ${m.cat} »`);
  }
});
test('CATS — 6 catégories, libellé et couleur présents', () => {
  assert.equal(Object.keys(R.CATS).length, 6);
  for(const [k,c] of Object.entries(R.CATS)) assert.ok(c.label && c.color, `catégorie ${k} incomplète`);
});
test('DESCRIPTIONS — chaque description pointe vers une mesure existante (25/37 rédigées)', () => {
  const ids = new Set(R.MEASURES.map(m=>m.id));
  for(const k of Object.keys(R.DESCRIPTIONS)){
    assert.ok(ids.has(k), `description orpheline : ${k}`);
    assert.ok(R.DESCRIPTIONS[k].trim().length > 40, `description ${k} anormalement courte`);
  }
  assert.equal(Object.keys(R.DESCRIPTIONS).length, 25); // 12 manquantes — dossier de validation §C2
});
test('Whitelist serveur — measure_id et criterion_id générables depuis rules.js', () => {
  const wl = new Set([...R.MEASURES.map(m=>m.id), ...R.ALLCRIT.map(c=>c.id)]);
  assert.equal(wl.size, 37+22);            // aucune collision entre les deux familles d'ids
  assert.ok(wl.has('m05') && wl.has('pf1') && wl.has('ee6'));
});
