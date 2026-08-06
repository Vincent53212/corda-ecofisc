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
  assert.deepEqual(R.mrcSynthese(['rec','etude','non','rec']).cc, {rec:2, etude:1, non:1, impl:0});
});
test("mrcSynthese — égalités : « non » prime, puis « rec » prime sur « étude » (à valider — méthodo §5)", () => {
  assert.equal(R.mrcSynthese(['rec','non']).maj, 'non');
  assert.equal(R.mrcSynthese(['rec','etude']).maj, 'rec');
  assert.equal(R.mrcSynthese(['etude','non']).maj, 'non');
});
test('mrcSynthese — liste vide → aucune majorité (garde : les appelants filtrent en amont)', () => {
  assert.equal(R.mrcSynthese([]).maj, null);
  assert.equal(R.mrcSynthese(null).maj, null);
});
test('mrcSynthese — les villes « déjà en place » sortent du vote mais restent comptées', () => {
  const s = R.mrcSynthese(['rec','impl','impl','etude']);
  assert.deepEqual(s.cc, {rec:1, etude:1, non:0, impl:2});
  assert.equal(s.maj, 'rec');                       // 1 rec vs 1 étude → rec prime, impl ne vote pas
  assert.equal(R.mrcSynthese(['impl','impl']).maj, 'impl'); // toutes en place → statut « en place »
});

/* ---------- Intégrité des données de référence (grille V4) ---------- */
test('DIMENSIONS — 4 dimensions, 23 critères, ids uniques', () => {
  assert.equal(R.DIMENSIONS.length, 4);
  assert.equal(R.NCRIT, 23);
  assert.equal(R.ALLCRIT.length, 23);
  assert.equal(new Set(R.ALLCRIT.map(c=>c.id)).size, 23);
});
test('DIMENSIONS — répartition des critères (3/7/7/6) — sg7 « Historique » ajouté en V4', () => {
  assert.deepEqual(R.DIMENSIONS.map(d=>d.crit.length), [3,7,7,6]);
  const sg = R.DIMENSIONS.find(d=>d.id==='sg');
  assert.equal(sg.crit[6].id, 'sg7');
  assert.equal(sg.crit[6].label, 'Historique');
  assert.ok(sg.crit[6].mid, 'sg7 : le barème du 0 (« jamais étudiée ») doit être explicite');
});
test('V4 — les 7 questions repolarisées ne posent plus de question « inversée »', () => {
  const q = id => R.ALLCRIT.find(c=>c.id===id).q;
  assert.match(q('pf3'), /suffisamment bas pour laisser une marge/);
  assert.match(q('sg1'), /peut-il être administré avec des ressources/);
  assert.match(q('sg4'), /est-elle compatible avec les réglementations/);
  assert.match(q('sg5'), /risque de contestation judiciaire de la mesure est-il faible/);
  assert.match(q('ae3'), /évite-t-elle un impact financier/);
  assert.match(q('ae6'), /réparti uniformément/);
  assert.match(q('ae7'), /préserve-t-elle ou améliore-t-elle/);
  assert.doesNotMatch(q('pf3'), /Gatineau/);   // généricisation du gabarit
});

/* ---------- Question préalable « mesure déjà en place » (V4, 3 août 2026) ---------- */
test('PREALABLE — identifiant hors dimensions, libellés présents', () => {
  assert.equal(R.PREALABLE.id, 'impl');
  assert.ok(R.PREALABLE.q && R.PREALABLE.hint && R.PREALABLE.oui && R.PREALABLE.non);
  assert.ok(!R.ALLCRIT.some(c=>c.id===R.PREALABLE.id), "'impl' ne doit appartenir à aucune dimension");
  assert.ok(R.IMPL.l && R.IMPL.abbr === 'I');
});
test('estImplantee — vrai seulement sur une réponse « oui » explicite', () => {
  assert.equal(R.estImplantee({impl:1}), true);
  assert.equal(R.estImplantee({impl:0}), false);
  assert.equal(R.estImplantee({pf1:1}), false);
  assert.equal(R.estImplantee(null), false);
});
test('villeImplantee — un seul répondant suffit (fait, pas opinion — méthodo §7)', () => {
  assert.equal(R.villeImplantee([0,0,1]), true);
  assert.equal(R.villeImplantee([0,0]), false);
  assert.equal(R.villeImplantee([]), false);
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
test('MEASURES — 36 mesures, ids mNN uniques et croissants, catégories valides', () => {
  assert.equal(R.MEASURES.length, 36);
  const ids = R.MEASURES.map(m=>m.id);
  assert.equal(new Set(ids).size, 36);
  /* Les ids ne sont PLUS consécutifs depuis le retrait de m27 (4 août 2026, fusionnée
     dans m25) : un identifiant retiré n'est jamais réattribué et rien n'est renuméroté,
     parce que les réponses en base sont indexées par measure_id. On vérifie donc le
     format et la croissance stricte, pas la continuité. */
  let precedent = 0;
  for(const id of ids){
    assert.match(id, /^m\d\d$/, `identifiant mal formé : ${id}`);
    const n = Number(id.slice(1));
    assert.ok(n > precedent, `identifiants non croissants : ${id} après m${String(precedent).padStart(2,'0')}`);
    precedent = n;
  }
  assert.ok(!ids.includes('m27'), 'm27 a été retirée le 4 août 2026 : son identifiant ne doit pas être réattribué');
  for(const m of R.MEASURES){
    assert.ok(m.titre && m.titre.trim(), `mesure ${m.id} : titre manquant`);
    assert.ok(R.CATS[m.cat], `mesure ${m.id} : catégorie inconnue « ${m.cat} »`);
  }
});
test('MEASURES — les titres révisés du 4 août 2026 sont en place', () => {
  const t = Object.fromEntries(R.MEASURES.map(m=>[m.id, m.titre]));
  assert.equal(t.m07, 'Taxe sur les immeubles non-résidentiels vacants');
  assert.equal(t.m23, 'Taxe ou redevance sur la démolition');
  assert.equal(t.m25, 'Redevance sur la performance énergétique et climatique des immeubles');
  assert.equal(t.m37, 'Redevance sur les générateurs de risques');
});
/* Les titres ne passent PAS par le pipeline document → production (publier.js ne
   réinjecte que les descriptions) : rien d'autre que ce test ne les protège. */
test('MEASURES — les titres révisés du 6 août 2026 (Fanny) sont en place', () => {
  const t = Object.fromEntries(R.MEASURES.map(m=>[m.id, m.titre]));
  assert.equal(t.m04, 'Taux varié par tranche de valeur (non résidentiel)');
  assert.equal(t.m30, "Tarification variable de l'eau (résidentiel)");
  assert.equal(t.m31, "Tarification variable de l'eau (ICI)");
});
test('CATS — 6 catégories, libellé et couleur présents', () => {
  assert.equal(Object.keys(R.CATS).length, 6);
  for(const [k,c] of Object.entries(R.CATS)) assert.ok(c.label && c.color, `catégorie ${k} incomplète`);
});
test('DESCRIPTIONS — les 36 mesures sont décrites, sans orpheline (11 rédigées le 3 août 2026)', () => {
  const ids = new Set(R.MEASURES.map(m=>m.id));
  for(const k of Object.keys(R.DESCRIPTIONS)){
    assert.ok(ids.has(k), `description orpheline : ${k}`);
    assert.ok(R.DESCRIPTIONS[k].trim().length > 40, `description ${k} anormalement courte`);
  }
  assert.equal(Object.keys(R.DESCRIPTIONS).length, 36);
  for(const m of R.MEASURES) assert.ok(R.DESCRIPTIONS[m.id], `mesure sans description : ${m.id}`);
  /* Garde-fou du pipeline : le marqueur de retrait écrit dans le .md ne doit jamais
     se retrouver publié comme si c'était une description. */
  for(const [k,d] of Object.entries(R.DESCRIPTIONS)) assert.ok(!/RETIR[ÉE]/i.test(d), `${k} : marqueur de retrait publié comme description`);
});
test('Whitelist serveur — measure_id et criterion_id générables depuis rules.js', () => {
  const wl = new Set([...R.MEASURES.map(m=>m.id), ...R.ALLCRIT.map(c=>c.id), R.PREALABLE.id]);
  assert.equal(wl.size, 36+23+1);          // aucune collision entre les familles d'ids (+ le préalable)
  assert.ok(wl.has('m05') && wl.has('pf1') && wl.has('sg7') && wl.has('ee6') && wl.has('impl'));
});
