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
