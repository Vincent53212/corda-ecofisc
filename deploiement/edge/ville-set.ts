
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

/* ville-set — écrit UNE réponse d'un répondant.
   Entrée : { code, measureId, critId, cote, comment }
   · le code doit exister ET être réclamé (identité fournie)
   · measureId/critId : whitelist GÉNÉRÉE de rules.js · cote ∈ {−1,0,1,null}
   · le projet/la ville sont DÉRIVÉS du code côté serveur — jamais du client. */
const MEASURE_IDS = new Set(["m01","m02","m03","m04","m05","m06","m07","m08","m09","m10","m11","m12","m13","m14","m15","m16","m17","m18","m19","m20","m21","m22","m23","m24","m25","m26","m27","m28","m29","m30","m31","m32","m33","m34","m35","m36","m37"]);
const CRIT_IDS = new Set(["pf1","pf2","pf3","sg1","sg2","sg3","sg4","sg5","sg6","ae1","ae2","ae3","ae4","ae5","ae6","ae7","ee1","ee2","ee3","ee4","ee5","ee6"]);

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
