"use strict";
/* ============================================================================
   Génère deploiement/seed-demo.sql à partir de demo-data.js (même jeu de
   données FICTIVES que le bouton « Projet Démo » de l'app — déterministe).
   Exécution :   node tools/gen-seed-demo.js     (depuis le dossier Appli/)
   Le SQL produit REMPLACE le projet demo côté Supabase (delete + insert,
   les codes et réponses suivent en cascade). À coller dans le SQL Editor.
   ============================================================================ */
const fs = require('node:fs');
const path = require('node:path');
const DemoData = require('../demo-data.js');

const ds = DemoData.build();
const q = v => v==null ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";

const L = [];
L.push('-- ============================================================================');
L.push('-- SEED DU PROJET DÉMO (données 100 % fictives) — généré par tools/gen-seed-demo.js');
L.push('-- NE PAS ÉDITER À LA MAIN : modifier demo-data.js puis regénérer.');
L.push('-- À coller dans Supabase → SQL Editor → Run. Rejouable : remplace le projet demo.');
L.push('-- ============================================================================');
L.push('begin;');
L.push(`delete from public.projects where id = ${q(ds.project.id)};`);
L.push(`insert into public.projects (id, title, type, villes, created_at) values (${q(ds.project.id)}, ${q(ds.project.title)}, ${q(ds.project.type)}, ${q(JSON.stringify(ds.project.villes))}::jsonb, ${q(ds.project.createdAt)});`);

L.push('insert into public.access_codes (code, project_id, ville, prenom, nom, fonction, claimed_at, consent_at, created_at) values');
L.push(ds.codes.map(c => `  (${q(c.code)}, ${q(c.project)}, ${q(c.ville)}, ${q(c.person&&c.person.prenom)}, ${q(c.person&&c.person.nom)}, ${q(c.person&&c.person.fonction)}, ${q(c.claimedAt)}, ${q(c.consentAt||null)}, ${q(c.createdAt)})`).join(',\n') + ';');

const keys = Object.keys(ds.responses);
const BATCH = 500;
for (let i = 0; i < keys.length; i += BATCH) {
  L.push('insert into public.responses (code, measure_id, criterion_id, cote, comment, updated_at) values');
  L.push(keys.slice(i, i + BATCH).map(k => {
    const [code, m, c] = k.split('|');
    const r = ds.responses[k];
    return `  (${q(code)}, ${q(m)}, ${q(c)}, ${r.cote}, ${q(r.comment||'')}, ${q(r.updatedAt)})`;
  }).join(',\n') + ';');
}
L.push('commit;');
L.push(`-- ${ds.codes.length} codes · ${keys.length} réponses`);

const out = path.join(__dirname, '..', 'deploiement', 'seed-demo.sql');
fs.writeFileSync(out, L.join('\n') + '\n', 'utf8');
console.log(`OK → ${out} (${ds.codes.length} codes, ${keys.length} réponses)`);
