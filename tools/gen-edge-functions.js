"use strict";
/* ============================================================================
   Génère les Edge Functions Supabase (Deno/TS) dans deploiement/edge/ — v2
   « COFFRE-FORT » : le moteur (rules.js) et le catalogue sont COMPILÉS ici et
   ne quittent jamais le serveur. Le client ne reçoit que du contenu autorisé
   (après validation d'un code ou d'une session admin) et des RÉSULTATS.

     · ville-claim.ts — valide un code (rate-limit), réclame identité +
       consentement, retourne : catalogue (questions/mesures/descriptions),
       projet, réponses du répondant, synthèses CALCULÉES par mesure
     · ville-set.ts   — écrit UNE réponse (whitelist, bornage) et retourne
       la synthèse recalculée de la mesure
     · admin-data.ts  — session admin (JWT) validée → données brutes +
       portrait calculé (matrice mesures × villes, synthèse MRC, cotes
       agrégées par ville pour l'export) + synthèses par répondant

   Exécution :   node tools/gen-edge-functions.js     (depuis Appli/)
   NE PAS ÉDITER les .ts à la main : modifier rules.js puis regénérer.
   Déploiement : Supabase → Edge Functions → coller chaque fichier sous son
   nom exact (ville-claim / ville-set / admin-data), « Enforce JWT
   verification » DÉSACTIVÉ (admin-data valide lui-même le JWT de session).
   ============================================================================ */
const fs = require('node:fs');
const path = require('node:path');

const RULES_SRC = fs.readFileSync(path.join(__dirname, '..', 'rules.js'), 'utf8')
  /* branche navigateur de l'UMD — morte côté Deno, mais TS s'en plaint : on la caste */
  .replace('root.Rules = factory();', '(root as any).Rules = factory();');

/* Le moteur, inliné avec un shim CommonJS (la branche module.exports de l'UMD). */
const ENGINE = `
/* ---- moteur + catalogue (compilés depuis rules.js — source unique testée) ---- */
const __mod: { exports: Record<string, unknown> } = { exports: {} };
{
  // deno-lint-ignore no-unused-vars
  const module = __mod;
${RULES_SRC.replace(/^/gm, '  ')}
}
// deno-lint-ignore no-explicit-any
const Rules: any = __mod.exports;
const { DIMENSIONS, ALLCRIT, NCRIT, CATS, MEASURES, DESCRIPTIONS, APPREC, RECO, apprec, reco, villeMoyenne, mrcSynthese } = Rules;
`;

const COMMON = `
/* GÉNÉRÉ par tools/gen-edge-functions.js — NE PAS ÉDITER À LA MAIN.
   © Corda · Écofiscalité — tous droits réservés. */
import { createClient } from "npm:@supabase/supabase-js@2";
${ENGINE}
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

/* ---- calculs partagés ----
   respMap : { measureId: { critId: cote } } → synthèse par mesure
   (appréciation par dimension, recommandation, nb de réponses). */
// deno-lint-ignore no-explicit-any
function synthOf(respMap: Record<string, Record<string, number>>): Record<string, any> {
  // deno-lint-ignore no-explicit-any
  const out: Record<string, any> = {};
  for (const m of MEASURES) {
    const rm = respMap[m.id]; if (!rm) continue;
    // deno-lint-ignore no-explicit-any
    const dims: Record<string, string | null> = {};
    let answered = 0;
    for (const d of DIMENSIONS) {
      const cotes = d.crit.map((c: { id: string }) => rm[c.id]).filter((x: number | undefined) => x !== undefined && x !== null);
      answered += cotes.length;
      dims[d.id] = cotes.length ? apprec(cotes) : null;
    }
    if (!answered) continue;
    out[m.id] = { answered, dims, reco: reco(DIMENSIONS.map((d: { id: string }) => dims[d.id] || "n")) };
  }
  return out;
}
/* rows → { code: { measureId: { critId: cote } } } (cotes null exclues) */
// deno-lint-ignore no-explicit-any
function groupResponses(rows: any[]): Record<string, Record<string, Record<string, number>>> {
  const by: Record<string, Record<string, Record<string, number>>> = {};
  for (const r of rows) {
    if (r.cote === null || r.cote === undefined) continue;
    ((by[r.code] ??= {})[r.measure_id] ??= {})[r.criterion_id] = r.cote;
  }
  return by;
}
/* Le catalogue livré aux clients AUTORISÉS (questions + mesures + libellés
   d'affichage). Les seuils et règles de calcul, eux, restent ici. */
function catalogue() {
  return {
    dimensions: DIMENSIONS.map((d: { id: string; nom: string; crit: { id: string; label: string; q: string; pos: string; neg: string }[] }) =>
      ({ id: d.id, nom: d.nom, crit: d.crit.map(c => ({ id: c.id, label: c.label, q: c.q, pos: c.pos, neg: c.neg })) })),
    cats: CATS, measures: MEASURES, descriptions: DESCRIPTIONS,
    apprec: APPREC, reco: RECO, ncrit: NCRIT,
  };
}
`;

const CLAIM = `${COMMON}
/* ville-claim — porte d'entrée des répondants municipaux. */
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

    const { data: proj, error: e2 } = await db.from("projects").select("id,title,type,villes,deleted_at").eq("id", rec.project_id).maybeSingle();
    if (e2) throw e2;
    if (!proj || proj.deleted_at) return json(req, 410, { error: "Ce projet est archivé." });

    if (person && !rec.prenom) {
      if (consent !== true) return json(req, 400, { error: "Le consentement est requis." });
      const p = {
        prenom: String(person.prenom || "").trim().slice(0, 80),
        nom: String(person.nom || "").trim().slice(0, 80),
        fonction: String(person.fonction || "").trim().slice(0, 120),
      };
      if (!p.prenom || !p.nom || !p.fonction) return json(req, 400, { error: "Prénom, nom et fonction sont requis." });
      const now = new Date().toISOString();
      const { error: e3 } = await db.from("access_codes").update({ ...p, claimed_at: now, consent_at: now }).eq("code", clean);
      if (e3) throw e3;
      Object.assign(rec, p, { claimed_at: now, consent_at: now });
      await db.from("audit_log").insert({ actor: "ville:" + clean, action: "claim", detail: { project: rec.project_id, ville: rec.ville } });
    } else {
      await db.from("audit_log").insert({ actor: "ville:" + clean, action: "login", detail: { project: rec.project_id, ville: rec.ville } });
    }

    const { data: resps, error: e4 } = await db.from("responses")
      .select("code,measure_id,criterion_id,cote,comment,updated_at").eq("code", clean);
    if (e4) throw e4;

    /* le catalogue et les synthèses ne partent QUE pour un code réclamé (ou en cours) */
    const grouped = groupResponses(resps || []);
    return json(req, 200, {
      code: { code: rec.code, ville: rec.ville, project_id: rec.project_id, prenom: rec.prenom, nom: rec.nom, fonction: rec.fonction, claimed_at: rec.claimed_at, consent_at: rec.consent_at, created_at: rec.created_at },
      project: { id: proj.id, title: proj.title, type: proj.type, villes: proj.villes },
      responses: resps || [],
      synth: synthOf(grouped[clean] || {}),
      catalogue: rec.prenom ? catalogue() : null, /* pas encore réclamé → l'écran de consentement n'a pas besoin du contenu */
    });
  } catch (e) { console.error(e); return json(req, 500, { error: "Erreur serveur." }); }
});
`;

const SET = `${COMMON}
/* ville-set — écrit UNE réponse et retourne la synthèse recalculée de la mesure. */
const MEASURE_IDS = new Set(MEASURES.map((m: { id: string }) => m.id));
const CRIT_IDS = new Set(ALLCRIT.map((c: { id: string }) => c.id));

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

    /* synthèse recalculée de CETTE mesure (le client n'a pas les règles) */
    const { data: rows, error: e3 } = await db.from("responses")
      .select("code,measure_id,criterion_id,cote").eq("code", clean).eq("measure_id", measureId);
    if (e3) throw e3;
    const grouped = groupResponses(rows || []);
    const synth = synthOf(grouped[clean] || {});
    return json(req, 200, { ok: true, measureId, synth: synth[measureId] || null });
  } catch (e) { console.error(e); return json(req, 500, { error: "Erreur serveur." }); }
});
`;

const ADMIN = `${COMMON}
/* admin-data — tout ce que l'écran admin affiche, calculé côté serveur.
   Exige une session Supabase VALIDE (le JWT de l'admin est vérifié ici même).
   Entrée : { projectId? } — le portrait est calculé pour ce projet. */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST attendu" });
  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\\s+/i, "");
    if (!jwt) return json(req, 401, { error: "Session requise." });
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: eAuth } = await authClient.auth.getUser(jwt);
    if (eAuth || !userData?.user) return json(req, 401, { error: "Session invalide ou expirée." });

    const { projectId } = await req.json().catch(() => ({}));
    const db = svc();

    const [{ data: projs, error: eP }, { data: codes, error: eC }] = await Promise.all([
      db.from("projects").select("id,title,type,villes,created_at").is("deleted_at", null).order("created_at"),
      db.from("access_codes").select("*").order("created_at"),
    ]);
    if (eP) throw eP; if (eC) throw eC;

    /* réponses : pagination serveur (par tranches de 1000) */
    // deno-lint-ignore no-explicit-any
    const resps: any[] = [];
    for (let off = 0; ; off += 1000) {
      const { data: page, error: eR } = await db.from("responses")
        .select("code,measure_id,criterion_id,cote,comment,updated_at")
        .order("code").order("measure_id").order("criterion_id").range(off, off + 999);
      if (eR) throw eR;
      resps.push(...(page || []));
      if (!page || page.length < 1000) break;
    }

    const pid = projectId && projs?.some((p: { id: string }) => p.id === projectId) ? projectId : projs?.[0]?.id;
    const proj = projs?.find((p: { id: string }) => p.id === pid);
    const byCode = groupResponses(resps);

    /* synthèses par répondant (projet actif) */
    // deno-lint-ignore no-explicit-any
    const respondents: Record<string, any> = {};
    const projCodes = (codes || []).filter((c: { project_id: string }) => c.project_id === pid);
    for (const c of projCodes) if (c.prenom && byCode[c.code]) respondents[c.code] = synthOf(byCode[c.code]);

    /* portrait : agrégation par ville (moyenne arrondie des répondants, critère par critère) */
    // deno-lint-ignore no-explicit-any
    const matrix: Record<string, any> = {};
    const villes: { id: string }[] = (proj?.villes || []);
    const codesByVille: Record<string, string[]> = {};
    for (const v of villes) codesByVille[v.id] = projCodes.filter((c: { ville: string; prenom: string | null }) => c.ville === v.id && c.prenom).map((c: { code: string }) => c.code);
    for (const m of MEASURES) {
      // deno-lint-ignore no-explicit-any
      const cells: Record<string, any> = {};
      const recos: string[] = [];
      for (const v of villes) {
        const cotes: Record<string, number> = {};
        let answered = 0;
        for (const cr of ALLCRIT) {
          const cs = codesByVille[v.id].map(code => byCode[code]?.[m.id]?.[cr.id]).filter(x => x !== undefined && x !== null);
          const agg = villeMoyenne(cs);
          if (agg !== null) { cotes[cr.id] = agg; answered++; }
        }
        if (!answered) continue;
        const dims: Record<string, string | null> = {};
        for (const d of DIMENSIONS) {
          const cs = d.crit.map((c: { id: string }) => cotes[c.id]).filter((x: number | undefined) => x !== undefined);
          dims[d.id] = cs.length ? apprec(cs) : null;
        }
        const rc = reco(DIMENSIONS.map((d: { id: string }) => dims[d.id] || "n"));
        cells[v.id] = { answered, dims, reco: rc, cotes };
        recos.push(rc);
      }
      matrix[m.id] = { cells, mrc: recos.length ? mrcSynthese(recos) : null };
    }

    await db.from("audit_log").insert({ actor: "admin:" + (userData.user.email || userData.user.id), action: "read", detail: { project: pid } });

    return json(req, 200, {
      projects: projs, codes, responses: resps,
      computed: { projectId: pid, matrix, respondents },
      catalogue: catalogue(),
    });
  } catch (e) { console.error(e); return json(req, 500, { error: "Erreur serveur." }); }
});
`;

const outDir = path.join(__dirname, '..', 'deploiement', 'edge');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'ville-claim.ts'), CLAIM, 'utf8');
fs.writeFileSync(path.join(outDir, 'ville-set.ts'), SET, 'utf8');
fs.writeFileSync(path.join(outDir, 'admin-data.ts'), ADMIN, 'utf8');
console.log('OK → deploiement/edge/ville-claim.ts + ville-set.ts + admin-data.ts (moteur + catalogue compilés serveur)');
