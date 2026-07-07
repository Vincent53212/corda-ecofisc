"use strict";
/* ============================================================================
   Génère l'Edge Function Supabase  deploiement/edge/role-import.ts
   Exécution :   node tools/gen-role-import.js     (depuis Appli/)

   La fonction a DEUX modes :
     · { action:"municipalites" }              → liste des 1011 municipalités
       (code + nom), pour le sélecteur du « nouveau projet ». Non sensible.
     · { projectId, villes:[{code,ville_id}] } → (JWT admin validé) télécharge
       le rôle d'évaluation OFFICIEL de chaque municipalité (fichier XML du
       MAMH, un par municipalité) et l'importe dans role_unites. Retourne les
       comptes par ville.

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
   © Corda · Écofiscalité. Données municipales : MAMH (CC-BY 4.0). */
import { createClient } from "npm:@supabase/supabase-js@2";

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
function svc() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
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
   rigide (pas de balises imbriquées arbitraires dans les champs lus). */
const RE_UNIT = /<RLUEx>([\\s\\S]*?)<\\/RLUEx>/g;
function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp("<" + name + ">([^<]*)</" + name + ">"));
  return m ? m[1].trim() : null;
}
function num(s: string | null): number { const v = parseFloat(s || ""); return isNaN(v) ? 0 : v; }
function pad(s: string | null, n: number): string { return (s || "").padStart(n, "0").slice(-n); }

// deno-lint-ignore no-explicit-any
function parseRole(xml: string, pid: string, villeId: string): any[] {
  const rows: any[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  RE_UNIT.lastIndex = 0;
  while ((m = RE_UNIT.exec(xml)) !== null) {
    const b = m[1];
    // matricule 18 : A(4)+B(2)+C(4)+D(1)+E(3)+F(4), défauts à 0
    const mat = pad(tag(b, "RL0104A"), 4) + pad(tag(b, "RL0104B"), 2) + pad(tag(b, "RL0104C"), 4)
      + pad(tag(b, "RL0104D"), 1) + pad(tag(b, "RL0104E"), 3) + pad(tag(b, "RL0104F"), 4);
    if (seen.has(mat)) continue; seen.add(mat);
    const cubf = (tag(b, "RL0105A") || "").replace(/\\D/g, "").padStart(4, "0").slice(0, 4);
    const vt = num(tag(b, "RL0402A"));          // valeur terrain
    const vtot = num(tag(b, "RL0404A")) || vt;  // valeur immeuble (totale)
    const vb = tag(b, "RL0403A") !== null ? num(tag(b, "RL0403A")) : Math.max(0, vtot - vt);
    const sup = tag(b, "RL0302A"); const log = tag(b, "RL0311A");
    rows.push({
      project_id: pid, ville_id: villeId, matricule: mat, cubf,
      valeur_terrain: Math.round(vt), valeur_batiment: Math.round(vb), valeur_totale: Math.round(vtot),
      superficie_terrain: sup !== null ? num(sup) : null,
      nb_logements: log !== null ? Math.round(num(log)) : null,
      terrain_vague_desservi: tag(b, "RL0501A"),
      zonage_agricole: tag(b, "RL0303A"),
    });
  }
  return rows;
}

const MAX_XML = 40 * 1024 * 1024; // garde-fou mémoire : ~40 Mo (grandes villes → chemin ETL)

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
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: u, error: eAuth } = await authClient.auth.getUser(jwt);
    if (eAuth || !u?.user) return json(req, 401, { error: "Session invalide ou expirée." });

    const pid = String(body.projectId || "");
    const villes = Array.isArray(body.villes) ? body.villes : [];
    if (!pid || !villes.length) return json(req, 400, { error: "projectId et villes requis." });

    const db = svc();
    const resultats: { ville_id: string; code: string; n?: number; erreur?: string }[] = [];

    for (const v of villes) {
      const code = String(v.code || "").trim();
      const villeId = String(v.ville_id || "").trim();
      if (!CODES.has(code) || !villeId) { resultats.push({ ville_id: villeId, code, erreur: "code invalide" }); continue; }
      const url = "https://donneesouvertes.affmunqc.net/role/RL" + code + "_2026.xml";
      try {
        const head = await fetch(url, { method: "HEAD" });
        const len = parseInt(head.headers.get("content-length") || "0", 10);
        if (len > MAX_XML) { resultats.push({ ville_id: villeId, code, erreur: "rôle trop volumineux — utiliser l'outil d'extraction (ETL)" }); continue; }
        const r = await fetch(url);
        if (!r.ok) { resultats.push({ ville_id: villeId, code, erreur: "téléchargement impossible (" + r.status + ")" }); continue; }
        const xml = await r.text();
        const rows = parseRole(xml, pid, villeId);
        // purge des anciennes lignes de cette ville dans ce projet, puis insertion
        await db.from("role_unites").delete().eq("project_id", pid).eq("ville_id", villeId);
        for (let i = 0; i < rows.length; i += 1000) {
          const { error } = await db.from("role_unites").upsert(rows.slice(i, i + 1000), { onConflict: "project_id,ville_id,matricule" });
          if (error) throw error;
        }
        resultats.push({ ville_id: villeId, code, n: rows.length });
      } catch (e) {
        console.error(code, e);
        resultats.push({ ville_id: villeId, code, erreur: "échec du traitement" });
      }
    }
    await db.from("audit_log").insert({ actor: "admin:" + (u.user.email || u.user.id), action: "write", detail: { role_import: pid, villes: resultats } });
    return json(req, 200, { resultats });
  } catch (e) {
    console.error(e);
    return json(req, 500, { error: "Erreur serveur." });
  }
});
`;

const out = path.join(__dirname, '..', 'deploiement', 'edge', 'role-import.ts');
fs.writeFileSync(out, TS, 'utf8');
console.log(`OK → deploiement/edge/role-import.ts (${munis.length} municipalités embarquées)`);
