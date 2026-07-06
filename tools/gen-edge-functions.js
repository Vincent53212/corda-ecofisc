"use strict";
/* ============================================================================
   Génère les Edge Functions Supabase (Deno/TypeScript) dans deploiement/edge/ :
     · ville-claim.ts  — valide un code (rate-limit), réclame l'identité +
                         consentement, retourne projet + réponses du répondant
     · ville-set.ts    — écrit UNE réponse (whitelist mesures/critères, bornage)
   Exécution :   node tools/gen-edge-functions.js     (depuis Appli/)
   La whitelist measure_id/criterion_id est GÉNÉRÉE depuis rules.js — ne jamais
   éditer les .ts à la main : modifier rules.js puis regénérer.
   Déploiement : Supabase → Edge Functions → Deploy a new function (via Editor),
   nom EXACT (ville-claim / ville-set), coller le fichier, désactiver
   « Enforce JWT verification » (nos clés publishable ne sont pas des JWT ;
   la vraie clé d'entrée est le code d'accès, validé ici même).
   ============================================================================ */
const fs = require('node:fs');
const path = require('node:path');
const R = require('../rules.js');

const MEASURE_IDS = JSON.stringify(R.MEASURES.map(m => m.id));
const CRIT_IDS = JSON.stringify(R.ALLCRIT.map(c => c.id));

const COMMON = `
/* GÉNÉRÉ par tools/gen-edge-functions.js — NE PAS ÉDITER À LA MAIN. */
import { createClient } from "npm:@supabase/supabase-js@2";

const ORIGINS = [
  "https://ecofisc.corda.consulting",
  "http://127.0.0.1:8742", "http://localhost:8742", /* tests locaux */
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
async function sha256(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, "0")).join("");
}
const CODE_RE = /^[A-Z]{2,4}-[A-Z0-9]{3,10}$/;
`;

const CLAIM = `${COMMON}
/* ville-claim — porte d'entrée des répondants municipaux.
   Entrée : { code, person?: {prenom,nom,fonction}, consent?: boolean }
   · valide le code (anti force-brute : 8 échecs / 15 min par origine)
   · si person fournie et code non réclamé : enregistre identité + consentement (art. 8)
   · retourne le code, son projet (avec villes) et SES réponses — rien d'autre. */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST attendu" });
  try {
    const { code, person, consent } = await req.json().catch(() => ({}));
    const clean = String(code || "").trim().toUpperCase();
    if (!CODE_RE.test(clean)) return json(req, 401, { error: "Code inconnu." });

    const db = svc();
    const ip = (req.headers.get("x-forwarded-for") || "?").split(",")[0].trim();
    const originHash = await sha256("ecofisc|" + ip);

    /* rate-limit : max 8 échecs par origine dans les 15 dernières minutes */
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await db.from("login_attempts").select("*", { count: "exact", head: true })
      .eq("origin_hash", originHash).eq("success", false).gte("at", since);
    if ((count ?? 0) >= 8) return json(req, 429, { error: "Trop de tentatives. Réessayez dans 15 minutes." });

    const { data: rec, error: e1 } = await db.from("access_codes").select("*").eq("code", clean).maybeSingle();
    if (e1) throw e1;
    await db.from("login_attempts").insert({ origin_hash: originHash, code_tried: clean, success: !!rec });
    if (!rec) return json(req, 401, { error: "Code inconnu." });

    /* projet du code (villes incluses) — refuse les projets archivés */
    const { data: proj, error: e2 } = await db.from("projects").select("id,title,type,villes,deleted_at").eq("id", rec.project_id).maybeSingle();
    if (e2) throw e2;
    if (!proj || proj.deleted_at) return json(req, 410, { error: "Ce projet est archivé." });

    /* réclamation : identité + consentement, une seule fois */
    if (person && !rec.prenom) {
      if (consent !== true) return json(req, 400, { error: "Le consentement est requis." });
      const p = {
        prenom: String(person.prenom || "").trim().slice(0, 80),
        nom: String(person.nom || "").trim().slice(0, 80),
        fonction: String(person.fonction || "").trim().slice(0, 120),
      };
      if (!p.prenom || !p.nom || !p.fonction) return json(req, 400, { error: "Prénom, nom et fonction sont requis." });
      const now = new Date().toISOString();
      const { error: e3 } = await db.from("access_codes")
        .update({ ...p, claimed_at: now, consent_at: now }).eq("code", clean);
      if (e3) throw e3;
      Object.assign(rec, p, { claimed_at: now, consent_at: now });
      await db.from("audit_log").insert({ actor: "ville:" + clean, action: "claim", detail: { project: rec.project_id, ville: rec.ville } });
    } else {
      await db.from("audit_log").insert({ actor: "ville:" + clean, action: "login", detail: { project: rec.project_id, ville: rec.ville } });
    }

    const { data: resps, error: e4 } = await db.from("responses")
      .select("measure_id,criterion_id,cote,comment,updated_at").eq("code", clean);
    if (e4) throw e4;

    return json(req, 200, {
      code: { code: rec.code, ville: rec.ville, project_id: rec.project_id, prenom: rec.prenom, nom: rec.nom, fonction: rec.fonction, claimed_at: rec.claimed_at, consent_at: rec.consent_at, created_at: rec.created_at },
      project: { id: proj.id, title: proj.title, type: proj.type, villes: proj.villes },
      responses: resps || [],
    });
  } catch (e) {
    console.error(e);
    return json(req, 500, { error: "Erreur serveur." });
  }
});
`;

const SET = `${COMMON}
/* ville-set — écrit UNE réponse d'un répondant.
   Entrée : { code, measureId, critId, cote, comment }
   · le code doit exister ET être réclamé (identité fournie)
   · measureId/critId : whitelist GÉNÉRÉE de rules.js · cote ∈ {−1,0,1,null}
   · le projet/la ville sont DÉRIVÉS du code côté serveur — jamais du client. */
const MEASURE_IDS = new Set(${MEASURE_IDS});
const CRIT_IDS = new Set(${CRIT_IDS});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST attendu" });
  try {
    const { code, measureId, critId, cote, comment } = await req.json().catch(() => ({}));
    const clean = String(code || "").trim().toUpperCase();
    if (!CODE_RE.test(clean)) return json(req, 401, { error: "Code inconnu." });
    if (!MEASURE_IDS.has(measureId)) return json(req, 400, { error: "Mesure inconnue." });
    if (!CRIT_IDS.has(critId)) return json(req, 400, { error: "Critère inconnu." });
    if (!(cote === null || cote === -1 || cote === 0 || cote === 1)) return json(req, 400, { error: "Cote invalide." });
    const com = String(comment ?? "").slice(0, 2000);

    const db = svc();
    const { data: rec, error: e1 } = await db.from("access_codes").select("code,prenom").eq("code", clean).maybeSingle();
    if (e1) throw e1;
    if (!rec) return json(req, 401, { error: "Code inconnu." });
    if (!rec.prenom) return json(req, 403, { error: "Code non réclamé." });

    const { error: e2 } = await db.from("responses").upsert(
      { code: clean, measure_id: measureId, criterion_id: critId, cote, comment: com },
      { onConflict: "code,measure_id,criterion_id" },
    );
    if (e2) throw e2;
    return json(req, 200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(req, 500, { error: "Erreur serveur." });
  }
});
`;

const outDir = path.join(__dirname, '..', 'deploiement', 'edge');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'ville-claim.ts'), CLAIM, 'utf8');
fs.writeFileSync(path.join(outDir, 'ville-set.ts'), SET, 'utf8');
console.log(`OK → deploiement/edge/ville-claim.ts + ville-set.ts (whitelist : ${R.MEASURES.length} mesures, ${R.ALLCRIT.length} critères)`);
