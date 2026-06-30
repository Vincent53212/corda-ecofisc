-- ============================================================================
--  ORCHESTRATEUR — Schéma de base de données (Supabase / Postgres)
--  À coller dans : Supabase → ton projet → SQL Editor → New query → Run.
--  ⚠️ Crée le projet en RÉGION CANADA (Central) avant de rouler ceci (Loi 25).
-- ============================================================================

-- ---------- 0) Projets : un orchestrateur peut piloter plusieurs projets ----------
--  Un projet est « ville unique » (1 seule ville = son titre) ou « multi-villes »
--  (ex. une MRC). La liste des villes est portée par le projet (colonne `villes`).
create table if not exists public.projects (
  id          text primary key,                 -- slug, ex. 'tdb' ou 'ville-de-saint-jerome'
  title       text not null,                     -- ex. 'MRC Thérèse-De Blainville'
  type        text not null default 'multi' check (type in ('single','multi')),
  villes      jsonb not null default '[]'::jsonb, -- [{ "id": "...", "nom": "..." }, ...]
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz                         -- suppression DOUCE (archive « /old ») : on ne détruit jamais, on date
);

-- ---------- 1) Codes d'accès : un par répondant (= identité d'une personne) ----------
create table if not exists public.access_codes (
  code        text primary key,                 -- ex. "STH-7F3K" (le « mot de passe » de la personne)
  project_id  text not null references public.projects(id) on delete cascade,
  ville       text not null,                     -- id de ville DANS le projet (ex. 'sainte-therese')
  prenom      text,
  nom         text,
  fonction    text,
  claimed_at  timestamptz,                        -- 1re connexion (null = pas encore réclamé)
  created_at  timestamptz not null default now()
);

-- ---------- 2) Réponses : indexées par RÉPONDANT (le code), pas par ville ----------
--  Le projet d'une réponse se déduit de son code (access_codes.project_id).
create table if not exists public.responses (
  code         text not null references public.access_codes(code) on delete cascade,
  measure_id   text not null,                     -- ex. 'm05'
  criterion_id text not null,                     -- ex. 'pf1'
  cote         smallint check (cote in (-1, 0, 1)),
  comment      text default '',
  updated_at   timestamptz not null default now(),
  primary key (code, measure_id, criterion_id)
);

create index if not exists responses_code_idx       on public.responses (code);
create index if not exists access_codes_project_idx on public.access_codes (project_id);
create index if not exists access_codes_ville_idx   on public.access_codes (ville);

-- ---------- 3) Amorçage : le projet historique MRC Thérèse-De Blainville ----------
insert into public.projects (id, title, type, villes)
values ('tdb', 'MRC Thérèse-De Blainville', 'multi', '[
  {"id":"blainville","nom":"Blainville"},
  {"id":"boisbriand","nom":"Boisbriand"},
  {"id":"bois-des-filion","nom":"Bois-des-Filion"},
  {"id":"lorraine","nom":"Lorraine"},
  {"id":"rosemere","nom":"Rosemère"},
  {"id":"sainte-therese","nom":"Sainte-Thérèse"},
  {"id":"sainte-anne-des-plaines","nom":"Sainte-Anne-des-Plaines"}
]'::jsonb)
on conflict (id) do nothing;

-- ============================================================================
--  SÉCURITÉ — Row Level Security (RLS)
--  Principe : la base est verrouillée par défaut. Seuls 2 chemins existent :
--   (a) ADMIN = utilisateur authentifié (Supabase Auth) → lit/gère tout.
--   (b) VILLE = passe par une Edge Function (clé service_role, côté serveur) qui
--       valide le code et n'écrit que SES réponses. Le rôle « anon » (la page web
--       publique) n'a AUCUN accès direct aux tables.
-- ============================================================================
alter table public.projects     enable row level security;
alter table public.access_codes enable row level security;
alter table public.responses    enable row level security;

-- Admins (authentifiés) : tout sur les projets et les codes, lecture des réponses.
drop policy if exists "admin_all_projects"   on public.projects;
drop policy if exists "admin_all_codes"       on public.access_codes;
drop policy if exists "admin_read_responses"  on public.responses;

create policy "admin_all_projects" on public.projects
  for all to authenticated using (true) with check (true);

create policy "admin_all_codes" on public.access_codes
  for all to authenticated using (true) with check (true);

create policy "admin_read_responses" on public.responses
  for select to authenticated using (true);

-- (Volontairement : AUCUNE policy pour le rôle 'anon' → tout accès direct est refusé.
--  Les écritures des villes passent par les Edge Functions, qui utilisent la clé
--  service_role et contournent la RLS APRÈS avoir validé le code.)

-- ============================================================================
--  RAPPEL : la clé « service_role » (Settings → API) est un PASSE-PARTOUT.
--  Elle ne doit JAMAIS se retrouver dans le frontend ni être partagée par courriel.
--  Elle vit uniquement comme secret des Edge Functions.
-- ============================================================================
