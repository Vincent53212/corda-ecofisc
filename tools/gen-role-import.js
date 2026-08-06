"use strict";
/* ============================================================================
   Génère l'Edge Function Supabase  deploiement/edge/role-import.ts
   Exécution :   node tools/gen-role-import.js     (depuis Appli/)

   La fonction a DEUX modes :
     · { action:"municipalites" }              → liste des 1011 municipalités
       (code + nom), pour le sélecteur du « nouveau projet ». Non sensible.
     · { projectId, villes:[{code,ville_id}] } → (JWT admin validé) télécharge
       le rôle d'évaluation OFFICIEL de chaque municipalité (fichier XML du
       MAMH, un par municipalité) et l'importe dans role_unites.
       Réponse en FLUX NDJSON : une ligne { ville_id, code, pct, n } par point
       de progression, puis une ligne finale { fin:true, resultats }. Le XML est
       lu en flux — aucune limite de taille (Montréal, 758 Mo, passe).

   La liste des municipalités est EMBARQUÉE ici (générée depuis
   deploiement/data/municipalites-qc.csv) — un seul fichier à coller dans le
   dashboard Supabase. NE PAS ÉDITER role-import.ts À LA MAIN.
   ============================================================================ */
const fs = require('node:fs');
const path = require('node:path');

const csv = fs.readFileSync(path.join(__dirname, '..', 'deploiement', 'data', 'municipalites-qc.csv'), 'utf8');
const munis = csv.split(/\r?\n/).slice(1).filter(Boolean).map(l => {
  const i = l.indexOf(',');
  return { code: l.slice(0, i), nom: l.slice(i + 1) };
});
// encodage compact « code|nom » sur une ligne (parsé côté fonction)
const MUNI_BLOB = munis.map(m => m.code + '|' + m.nom).join('\n');

const TS = `/* GÉNÉRÉ par tools/gen-role-import.js — NE PAS ÉDITER À LA MAIN.
   © Corda · Écofiscalité. Données municipales : MAMH (CC-BY 4.0).

   AUCUNE dépendance npm ici, contrairement aux trois autres fonctions : le module
   supabase-js se recharge et se recompile à CHAQUE démarrage d'isolate, et ce coût
   est facturé sur les ~2 s de CPU allouées à l'invocation (mesuré en production :
   « CPU Time exceeded » à 2079 ms alors que le parsing n'en représentait que ~330).
   On parle donc directement à PostgREST en fetch — exactement ce que la librairie
   fait sous le capot, sans payer son chargement à chaque passe. */

const URL_SB = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/* Les identifiants viennent du client et finissent dans un filtre PostgREST :
   on les borne au jeu de caractères que produit slugify() côté page. */
const ID_OK = /^[A-Za-z0-9_-]{1,64}$/;

async function rest(chemin: string, opt?: { method?: string; body?: string; prefer?: string; range?: string }) {
  const o = opt || {};
  const h: Record<string, string> = {
    apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json",
  };
  if (o.prefer) h["Prefer"] = o.prefer;
  if (o.range) h["Range"] = o.range;
  const r = await fetch(URL_SB + "/rest/v1/" + chemin, { method: o.method || "GET", headers: h, body: o.body });
  const texte = await r.text(); // toujours consommé : sinon la connexion reste ouverte
  if (!r.ok) throw new Error("REST " + r.status + " " + texte.slice(0, 200));
  return { headers: r.headers, texte };
}

/* Les trois seules opérations de base dont l'import a besoin. Regroupées pour
   rester remplaçables par un double en test (tools/../scratchpad). */
const DB = {
  async purger(pid: string, villeId: string) {
    await rest("role_unites?project_id=eq." + pid + "&ville_id=eq." + villeId,
      { method: "DELETE", prefer: "return=minimal" });
  },
  async inserer(lignes: unknown[]) {
    /* resolution=ignore-duplicates → ON CONFLICT DO NOTHING. La ville vient d'être
       purgée : les seuls conflits possibles sont les quelques blocs retraités au
       recouvrement des passes, et les réécrire à l'identique coûte une écriture. */
    await rest("role_unites?on_conflict=project_id,ville_id,matricule",
      { method: "POST", body: JSON.stringify(lignes), prefer: "resolution=ignore-duplicates,return=minimal" });
  },
  async compter(pid: string, villeId: string): Promise<number | undefined> {
    const r = await rest("role_unites?select=matricule&project_id=eq." + pid + "&ville_id=eq." + villeId,
      { prefer: "count=exact", range: "0-0" });
    const m = (r.headers.get("content-range") || "").match(/\\/(\\d+)$/); // "0-0/437192"
    return m ? parseInt(m[1], 10) : undefined;
  },
  async journal(entree: unknown) {
    await rest("audit_log", { method: "POST", body: JSON.stringify(entree), prefer: "return=minimal" });
  },
};

/* Valide le jeton de session admin (endpoint Auth, pas de librairie). */
// deno-lint-ignore no-explicit-any
async function utilisateur(jwt: string): Promise<any | null> {
  const r = await fetch(URL_SB + "/auth/v1/user", { headers: { apikey: ANON, Authorization: "Bearer " + jwt } });
  const t = await r.text();
  if (!r.ok) return null;
  try { return JSON.parse(t); } catch (_e) { return null; }
}

const ORIGINS = [
  "https://ecofisc.corda.consulting",
  "http://127.0.0.1:8742", "http://localhost:8742",
];
function corsHeaders(req: Request): Record<string, string> {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}
function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(req) });
}

/* ---- liste des municipalités du Québec (code officiel + nom) ---- */
const MUNICIPALITES: { code: string; nom: string }[] = ${JSON.stringify(MUNI_BLOB)}
  .split("\\n").map((l) => { const i = l.indexOf("|"); return { code: l.slice(0, i), nom: l.slice(i + 1) }; });
const CODES = new Set(MUNICIPALITES.map((m) => m.code));

/* ---- parseur du rôle XML (format prescrit MAMH) ----
   Le format est plat et généré par machine : on découpe sur <RLUEx> et on
   extrait les champs connus par expression régulière. Robuste pour ce format
   rigide (pas de balises imbriquées arbitraires dans les champs lus).
   La lecture se fait EN FLUX (voir importerVille) : le fichier n'est jamais
   chargé en mémoire, seul un bloc <RLUEx> à la fois l'est. */
function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp("<" + name + ">([^<]*)</" + name + ">"));
  return m ? m[1].trim() : null;
}
function num(s: string | null): number { const v = parseFloat(s || ""); return isNaN(v) ? 0 : v; }
function pad(s: string | null, n: number): string { return (s || "").padStart(n, "0").slice(-n); }

// deno-lint-ignore no-explicit-any
function unite(b: string, pid: string, villeId: string): any {
  // matricule 18 : A(4)+B(2)+C(4)+D(1)+E(3)+F(4), défauts à 0
  const mat = pad(tag(b, "RL0104A"), 4) + pad(tag(b, "RL0104B"), 2) + pad(tag(b, "RL0104C"), 4)
    + pad(tag(b, "RL0104D"), 1) + pad(tag(b, "RL0104E"), 3) + pad(tag(b, "RL0104F"), 4);
  const cubf = (tag(b, "RL0105A") || "").replace(/\\D/g, "").padStart(4, "0").slice(0, 4);
  const vt = num(tag(b, "RL0402A"));          // valeur terrain
  const vtot = num(tag(b, "RL0404A")) || vt;  // valeur immeuble (totale)
  const vb = tag(b, "RL0403A") !== null ? num(tag(b, "RL0403A")) : Math.max(0, vtot - vt);
  const sup = tag(b, "RL0302A"); const log = tag(b, "RL0311A");
  return {
    project_id: pid, ville_id: villeId, matricule: mat, cubf,
    valeur_terrain: Math.round(vt), valeur_batiment: Math.round(vb), valeur_totale: Math.round(vtot),
    superficie_terrain: sup !== null ? num(sup) : null,
    nb_logements: log !== null ? Math.round(num(log)) : null,
    terrain_vague_desservi: tag(b, "RL0501A"),
    zonage_agricole: tag(b, "RL0303A"),
  };
}

const MAX_XML = 2 * 1024 * 1024 * 1024; // garde-fou anti-aberration seulement : le flux borne la mémoire
/* Unités par upsert. Chaque envoi paie une latence fixe (Edge Function → pooler →
   Postgres) qui domine largement le coût des lignes elles-mêmes : à 1000, les 438
   allers-retours de Montréal pesaient l'essentiel des 9 minutes du premier import
   complet. Mais un lot trop gros gonfle le corps de requête et le pic mémoire —
   2000 est le compromis retenu. Réglable par le secret ROLE_IMPORT_LOT. */
const LOT = parseInt(Deno.env.get("ROLE_IMPORT_LOT") || "2000", 10) || 2000;
/* Filet secondaire : sortie propre avant le wall clock de la plateforme (150 s par
   défaut côté Supabase). Ce n'est PAS ce qui borne l'invocation en pratique —
   MAX_OCTETS s'atteint bien avant. Réglable par le secret ROLE_IMPORT_BUDGET_MS. */
const BUDGET_MS = parseInt(Deno.env.get("ROLE_IMPORT_BUDGET_MS") || "120000", 10) || 120000;
/* Travail maximal PAR INVOCATION, en octets lus. Le vrai plafond côté Supabase est
   le CPU (~2 s), que ni le wall clock ni la mémoire ne signalent — l'invocation est
   tuée net, sans message. Ce réglage est la seule façon de le borner depuis le code.
   Mesuré : le parsing tourne à ~96 Mo/s, donc 24 Mo ≈ 250 ms de CPU ; le reste du
   budget absorbe le démarrage, la sérialisation JSON et le TLS vers Postgres.
   Réglable par le secret ROLE_IMPORT_MAX_MO. */
const MAX_OCTETS = (parseInt(Deno.env.get("ROLE_IMPORT_MAX_MO") || "24", 10) || 24) * 1024 * 1024;
const RECUL = 64; // octets de recouvrement à la reprise (voir importerVille)

/* ---- import d'UNE ville, en flux, REPRENABLE ----
   Le corps de la réponse HTTP est lu par morceaux ; chaque bloc <RLUEx> complet
   est parsé puis jeté, et les unités partent en base par lots de LOT. La mémoire
   ne dépend donc PAS de la taille du fichier.

   Une invocation traite AU PLUS MAX_OCTETS, puis rend la main en retournant
   { suite:{offset,etag,total} } : le client rappelle avec cette reprise et le
   serveur redemande le fichier en « Range: bytes=offset- ». Ce plafond en OCTETS
   (et non en secondes) est le seul qui borne réellement le CPU consommé — c'est
   la limite qui a tué l'import de Montréal à 18 % en production, et ni le budget
   de temps ni le wall clock de la plateforme ne la voient venir.

   Trois points mesurés qui expliquent le code :
     · la déduplication est INTRA-LOT (vus.clear() à chaque envoi) — un Set gardé
       pour tout le fichier coûtait à lui seul 70 Mo sur Montréal. Elle ne sert
       qu'à éviter deux fois la même clé dans un même upsert (ON CONFLICT ne le
       tolère pas) ; au-delà du lot, la contrainte d'unicité fait le travail.
     · l'offset de reprise RECULE volontairement de RECUL octets. Le décodeur UTF-8
       peut retenir 1 à 3 octets d'un caractère à cheval sur deux morceaux, donc la
       position calculée peut dépasser la réalité de quelques octets — et rater le
       <RLUEx> suivant, c'est perdre une unité pour de bon. En reculant, on retraite
       au pire un bloc déjà inséré : l'upsert l'absorbe sans bruit. Perdre est
       irrattrapable, doubler ne coûte rien.
     · le compte final est relu en base (count exact) plutôt qu'additionné entre
       les passes, justement parce que ce recouvrement fausserait la somme. */
// deno-lint-ignore no-explicit-any
async function importerVille(db: any, pid: string, code: string, villeId: string,
                             // deno-lint-ignore no-explicit-any
                             reprise: any, emit: (o: unknown) => void, deadline: number) {
  const url = "https://donneesouvertes.affmunqc.net/role/RL" + code + "_2026.xml";
  const debut = reprise && reprise.offset > 0 ? Number(reprise.offset) : 0;

  const head = await fetch(url, { method: "HEAD" });
  if (!head.ok) return { erreur: "rôle introuvable sur le site du MAMH (" + head.status + ")" };
  const total = parseInt(head.headers.get("content-length") || "0", 10);
  const etag = head.headers.get("etag") || "";
  if (total > MAX_XML) return { erreur: "fichier hors norme (" + Math.round(total / 1048576) + " Mo)" };
  // coudre deux millésimes différents produirait un rôle incohérent, en silence
  if (debut > 0 && reprise.etag && etag && reprise.etag !== etag) {
    return { erreur: "le rôle a changé sur le site du MAMH pendant l'import", recommencer: true };
  }

  const r = await fetch(url, debut > 0 ? { headers: { Range: "bytes=" + debut + "-" } } : undefined);
  if (!r.ok || !r.body) return { erreur: "téléchargement impossible (" + r.status + ")" };
  if (debut > 0 && r.status !== 206) {
    return { erreur: "reprise refusée par le serveur du MAMH", recommencer: true };
  }

  // la ville est réécrite intégralement : purge à la PREMIÈRE passe seulement,
  // et après que le téléchargement soit acquis (un rôle indisponible ne doit pas
  // détruire les données en place)
  if (debut === 0) await db.purger(pid, villeId);

  const reader = r.body.getReader();
  const dec = new TextDecoder("utf-8");
  const enc = new TextEncoder();
  const vus = new Set<string>();
  // deno-lint-ignore no-explicit-any
  let lot: any[] = [];
  let buf = "", lus = 0, n = 0, pct = -1, msDb = 0;
  let sur = debut; // dernier offset dont les unités sont CONFIRMÉES en base

  const vider = async () => {
    if (!lot.length) return;
    const t = Date.now();
    await db.inserer(lot);
    msDb += Date.now() - t;
    n += lot.length; lot = []; vus.clear();
    /* Ces lignes sont maintenant en base : on publie le point de reprise. Si
       l'invocation meurt après cet instant — limite de CPU, de mémoire, coupure
       réseau, peu importe — le client redémarre ici sans rien perdre. C'est ce qui
       rend l'import insensible à la cause exacte de la mort. */
    sur = Math.max(debut, debut + lus - enc.encode(buf).length - RECUL);
  };
  // compte exact en base : le recouvrement entre passes rend la somme des n approximative
  const compter = () => db.compter(pid, villeId);

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      lus += value.byteLength;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf("</RLUEx>")) !== -1) {
        const d = buf.lastIndexOf("<RLUEx>", i);
        // d === -1 : bloc entamé avant l'offset de reprise, donc déjà inséré — on le saute
        if (d !== -1) {
          const u = unite(buf.slice(d + 7, i), pid, villeId);
          if (!vus.has(u.matricule)) { vus.add(u.matricule); lot.push(u); }
        }
        buf = buf.slice(i + 8);
        if (lot.length >= LOT) await vider();
      }
      const p = total ? Math.floor((debut + lus) / total * 100) : 0;
      // off/etag/total voyagent avec la progression : ils suffisent au client pour
      // reconstruire une reprise valide si la réponse se coupe en cours de route
      if (p !== pct) { pct = p; emit({ pct, n, off: sur, etag, total }); }

      if (lus >= MAX_OCTETS || Date.now() > deadline) {
        await vider();
        if (debut + lus < total) {
          const offset = Math.max(debut, debut + lus - enc.encode(buf).length - RECUL);
          return { n, ms_db: msDb, suite: { offset, etag, total } };
        }
        break; // plafond atteint pile en fin de fichier : rien à reprendre
      }
    }
    await vider();
    return { n, ms_db: msDb, total_ville: await compter() };
  } finally {
    try { await reader.cancel(); } catch (_e) { /* flux déjà clos */ }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST attendu" });
  try {
    const body = await req.json().catch(() => ({}));

    // --- mode liste (public) ---
    if (body.action === "municipalites") return json(req, 200, { municipalites: MUNICIPALITES });

    // --- mode import (admin) ---
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\\s+/i, "");
    if (!jwt) return json(req, 401, { error: "Session requise." });
    const usager = await utilisateur(jwt);
    if (!usager || !usager.id) return json(req, 401, { error: "Session invalide ou expirée." });

    const pid = String(body.projectId || "");
    const villes = Array.isArray(body.villes) ? body.villes : [];
    if (!pid || !villes.length) return json(req, 400, { error: "projectId et villes requis." });
    if (!ID_OK.test(pid)) return json(req, 400, { error: "projectId invalide." });
    let reprise = body.reprise || null; // { offset, etag, total } renvoyé par la passe précédente

    /* ---- réponse EN FLUX (NDJSON) ----
       Une ligne JSON par événement, terminée par { fin:true, resultats }.
       Le statut HTTP est figé dès le premier octet émis : c'est donc la ligne
       finale qui porte le verdict, et son ABSENCE que le client doit lire comme
       un échec (voir remote.fnStream). */
    const enc = new TextEncoder();
    const flux = new ReadableStream({
      async start(controller) {
        const emit = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\\n"));
        // deno-lint-ignore no-explicit-any
        const resultats: any[] = [];
        const deadline = Date.now() + BUDGET_MS;
        try {
          for (const v of villes) {
            const code = String(v.code || "").trim();
            const villeId = String(v.ville_id || "").trim();
            if (!CODES.has(code) || !ID_OK.test(villeId)) { resultats.push({ ville_id: villeId, code, erreur: "code invalide" }); continue; }
            // point de départ = là où la passe précédente s'est arrêtée : émettre 0
            // ferait retomber la barre à chaque reprise (une fois par tranche de 32 Mo)
            const depart = reprise && reprise.offset > 0 && reprise.total
              ? Math.floor(Number(reprise.offset) / Number(reprise.total) * 100) : 0;
            emit({ ville_id: villeId, code, pct: depart, n: 0 });
            try {
              // la reprise ne vaut que pour la 1re ville : le client n'en envoie qu'une par appel
              const res = await importerVille(DB, pid, code, villeId, reprise,
                (p) => emit(Object.assign({ ville_id: villeId, code }, p)), deadline);
              reprise = null;
              resultats.push(Object.assign({ ville_id: villeId, code }, res));
            } catch (e) {
              console.error(code, e);
              resultats.push({ ville_id: villeId, code, erreur: "échec du traitement" });
            }
          }
          try {
            await DB.journal({ actor: "admin:" + (usager.email || usager.id), action: "write", detail: { role_import: pid, villes: resultats } });
          } catch (e) { console.error("audit", e); } // l'audit ne doit pas faire perdre un import réussi
          emit({ fin: true, resultats });
        } catch (e) {
          console.error(e);
          emit({ fin: true, resultats, error: "Erreur serveur." });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(flux, {
      headers: Object.assign(corsHeaders(req), {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no", // pas de mise en tampon intermédiaire : la barre doit avancer en direct
      }),
    });
  } catch (e) {
    console.error(e);
    return json(req, 500, { error: "Erreur serveur." });
  }
});
`;

const out = path.join(__dirname, '..', 'deploiement', 'edge', 'role-import.ts');
fs.writeFileSync(out, TS, 'utf8');
console.log(`OK → deploiement/edge/role-import.ts (${munis.length} municipalités embarquées)`);
