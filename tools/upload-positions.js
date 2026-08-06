"use strict";
/* ============================================================================
   Dépose les fichiers de positions (produits par tools/gen-positions.py) dans
   un bucket PUBLIC de Supabase Storage, d'où l'app les lira à la création d'un
   projet — pour que la carte d'incidence se remplisse sans geste manuel.

   Exécution (depuis Appli/) :
       set SUPABASE_SERVICE_ROLE_KEY=eyJ...        (cmd)
       $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."     (PowerShell)
       node tools/upload-positions.js <dossier-positions>

   ⚠ LA CLÉ service_role EST UN PASSE-PARTOUT. Elle se lit ici dans une variable
     d'environnement et n'est JAMAIS écrite sur le disque ni dans Git. Ferme le
     terminal après usage.

   REPRENABLE : les fichiers déjà déposés à la même taille sont sautés. Si la
   connexion lâche au 700e fichier, relance la même commande.

   Le contenu est PUBLIC et c'est voulu : ce sont des données ouvertes du MAMH
   (CC-BY 4.0), les mêmes coordonnées que le GeoPackage téléchargeable par tous.
   Rien du mandat n'y figure — ni valeur, ni cotation, ni identité.
   ============================================================================ */
const fs = require('node:fs');
const path = require('node:path');

const URL_SB = process.env.SUPABASE_URL || 'https://sxshynpgiaeievdurjbk.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'positions';
const dossier = process.argv[2];

if (!KEY) {
  console.error('\n⚠ Variable SUPABASE_SERVICE_ROLE_KEY absente.');
  console.error('  Supabase → Settings → API → service_role (secret), puis :');
  console.error('    $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."   (PowerShell)\n');
  process.exit(1);
}
if (!dossier || !fs.existsSync(dossier)) {
  console.error('\nUsage : node tools/upload-positions.js <dossier-positions>');
  console.error('  (le dossier produit par tools/gen-positions.py)\n');
  process.exit(1);
}

const entetes = { apikey: KEY, Authorization: 'Bearer ' + KEY };

async function creerBucket() {
  const r = await fetch(URL_SB + '/storage/v1/bucket', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, entetes),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  const t = await r.text();
  if (r.ok) { console.log('Bucket « ' + BUCKET +' » créé (public).'); return; }
  if (/already exists|Duplicate/i.test(t)) { console.log('Bucket « ' + BUCKET + ' » déjà là.'); return; }
  throw new Error('création du bucket : ' + r.status + ' ' + t.slice(0, 200));
}

/* Inventaire de ce qui est DÉJÀ en place, pour ne pas re-téléverser 134 Mo à
   chaque relance. L'API liste par pages de 100. */
async function inventaire() {
  const vus = new Map();
  for (let offset = 0; ; offset += 100) {
    const r = await fetch(URL_SB + '/storage/v1/object/list/' + BUCKET, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, entetes),
      body: JSON.stringify({ prefix: '', limit: 100, offset }),
    });
    if (!r.ok) break;
    const lot = await r.json();
    if (!Array.isArray(lot) || !lot.length) break;
    lot.forEach(o => vus.set(o.name, (o.metadata && o.metadata.size) || 0));
    if (lot.length < 100) break;
  }
  return vus;
}

async function deposer(nom, contenu) {
  const r = await fetch(URL_SB + '/storage/v1/object/' + BUCKET + '/' + nom, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'text/csv; charset=utf-8', 'x-upsert': 'true' }, entetes),
    body: contenu,
  });
  if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 160));
}

(async () => {
  await creerBucket();
  const fichiers = fs.readdirSync(dossier).filter(f => /\.(csv|json)$/i.test(f));
  console.log(fichiers.length + ' fichiers à traiter.');
  console.log('Inventaire de ce qui est déjà en place…');
  const deja = await inventaire();
  console.log('  ' + deja.size + ' déjà présents.\n');

  let envoyes = 0, sautes = 0, octets = 0, echecs = [];
  for (let i = 0; i < fichiers.length; i++) {
    const nom = fichiers[i];
    const contenu = fs.readFileSync(path.join(dossier, nom));
    if (deja.get(nom) === contenu.length) { sautes++; continue; }
    try {
      await deposer(nom, contenu);
      envoyes++; octets += contenu.length;
    } catch (e) {
      echecs.push(nom + ' (' + e.message + ')');
    }
    if ((i + 1) % 50 === 0 || i === fichiers.length - 1) {
      process.stdout.write('\r  ' + (i + 1) + '/' + fichiers.length
        + ' · ' + envoyes + ' envoyés · ' + sautes + ' déjà là · '
        + (octets / 1048576).toFixed(1) + ' Mo   ');
    }
  }
  console.log('\n');
  if (echecs.length) {
    console.log('⚠ ' + echecs.length + ' échec(s) — relancer la même commande, les réussis seront sautés :');
    echecs.slice(0, 10).forEach(e => console.log('   ' + e));
  } else {
    console.log('✓ Dépôt complet.');
  }
  console.log('\nVérification (doit répondre du CSV) :');
  console.log('  ' + URL_SB + '/storage/v1/object/public/' + BUCKET + '/73005.csv');
})().catch(e => { console.error('\n⚠ ' + e.message); process.exit(1); });
