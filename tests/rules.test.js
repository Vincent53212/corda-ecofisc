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

/* ---------- Règle 1 · apprec : cotes d'une dimension → appréciation ---------- */
test('apprec — tous +1 → très favorable', () => {
  assert.equal(R.apprec([1,1,1]), 'tf');
  assert.equal(R.apprec([1,1,0]), 'tf');       // S=2 sans négatif
});
test("apprec — S≥2 mais présence d'un négatif → favorable (pas TF)", () => {
  assert.equal(R.apprec([1,1,1,-1]), 'f');     // S=2, un négatif bloque le TF
});
test('apprec — S=1 → favorable', () => {
  assert.equal(R.apprec([1]), 'f');
  assert.equal(R.apprec([1,1,-1]), 'f');
});
test('apprec — S=0 → neutre', () => {
  assert.equal(R.apprec([0,0]), 'n');
  assert.equal(R.apprec([1,-1]), 'n');         // compensation exacte
});
test('apprec — aucune réponse → neutre (garde défensive)', () => {
  assert.equal(R.apprec([]), 'n');
});
test('apprec — S=−1 → peu favorable', () => {
  assert.equal(R.apprec([-1]), 'pf');
  assert.equal(R.apprec([-1,-1,1]), 'pf');
});
test('apprec — S≤−2 sans positif → pas du tout favorable', () => {
  assert.equal(R.apprec([-1,-1]), 'pdf');
  assert.equal(R.apprec([-1,-1,-1,0]), 'pdf');
});
test("apprec — S≤−2 mais présence d'un positif → peu favorable (pas PDF)", () => {
  assert.equal(R.apprec([-1,-1,-1,1]), 'pf');  // symétrique du cas TF
});

/* ---------- Règle 2 · reco : 4 appréciations → recommandation ---------- */
test('reco — ≥2 dimensions favorables sans PF/PDF → recommandée', () => {
  assert.equal(R.reco(['tf','tf','tf','tf']), 'rec');
  assert.equal(R.reco(['f','f','n','n']), 'rec');
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
test('reco — tout neutre → étude', () => {
  assert.equal(R.reco(['n','n','n','n']), 'etude');
});
test('reco — 1 seule dimension favorable → étude', () => {
  assert.equal(R.reco(['f','n','n','n']), 'etude');
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
