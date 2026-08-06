-- ============================================================================
--  ORCHESTRATEUR — Schéma de base de données (Supabase / Postgres) — v2
--  À coller dans : Supabase → ton projet → SQL Editor → New query → Run.
--  ⚠️ Crée le projet en RÉGION CANADA (Central) avant de rouler ceci (Loi 25).
--
--  v2 (2026-07-05) — révision Loi 25 + préparation backend :
--   · conservation/destruction RÉELLE documentée (art. 23) : l'archivage doux
--     (deleted_at) est un état TEMPORAIRE, suivi d'une destruction véritable
--     (fonction hard_delete_project + purge_expired) à l'échéance de conservation ;
--   · trigger updated_at sur responses ;
--   · table audit_log (journal des accès — attendu sous Loi 25) ;
--   · table login_attempts (anti force-brute des codes, utilisée par ville-claim).
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
  deleted_at  timestamptz                         -- suppression DOUCE (archive). ÉTAT TEMPORAIRE :
                                                  -- la destruction RÉELLE suit à l'échéance de
                                                  -- conservation (voir purge_expired ci-dessous).
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
  consent_at  timestamptz,                        -- horodatage du consentement (avis de collecte, art. 8)
  created_at  timestamptz not null default now()
);
-- Supprimer un code = destruction RÉELLE immédiate (droit de retrait) : le DELETE
-- entraîne en cascade la destruction de ses réponses. Pas de soft-delete ici.

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

-- updated_at maintenu automatiquement côté base (pas de confiance au client)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists responses_touch on public.responses;
create trigger responses_touch
  before update on public.responses
  for each row execute function public.touch_updated_at();

-- ---------- 3) Journal d'audit (Loi 25 : qui a accédé à quoi, quand) ----------
--  Alimenté par les Edge Functions (connexions ville) et par l'app admin
--  (connexions, lectures/exports). Table en append seul.
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor       text not null,                     -- 'ville:<code>' ou 'admin:<email>'
  action      text not null,                     -- 'claim' | 'login' | 'read' | 'write' | 'export' | 'delete'
  detail      jsonb not null default '{}'::jsonb -- contexte (projet, ville, nb lignes…), JAMAIS de contenu de réponse
);

-- ---------- 4) Anti force-brute : tentatives de connexion par code ----------
--  Utilisée par l'Edge Function ville-claim pour ralentir/verrouiller les essais.
--  Aucune RP ici : empreinte d'origine (hash) + code tenté.
create table if not exists public.login_attempts (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  origin_hash text not null,                     -- hash de l'IP/origine (jamais l'IP en clair)
  code_tried  text not null,
  success     boolean not null default false
);
create index if not exists login_attempts_origin_idx on public.login_attempts (origin_hash, at desc);

-- ---------- 5) Amorçage : le projet historique MRC Thérèse-De Blainville ----------
--  ⚠ Le champ `code` (code géographique MAMH) est INDISPENSABLE : sans lui, ni le
--    téléchargement du rôle officiel, ni le chargement des positions, ni donc la
--    carte d'incidence ne fonctionnent — l'écran Réglages affiche « code absent ».
--    Il manquait à ce semis jusqu'au 6 août 2026, le projet étant antérieur au
--    sélecteur de municipalités. Codes recoupés SGC StatCan ↔ répertoire MAMH.
insert into public.projects (id, title, type, villes)
values ('tdb', 'MRC Thérèse-De Blainville', 'multi', '[
  {"id":"blainville","nom":"Blainville","code":"73015"},
  {"id":"boisbriand","nom":"Boisbriand","code":"73005"},
  {"id":"bois-des-filion","nom":"Bois-des-Filion","code":"73030"},
  {"id":"lorraine","nom":"Lorraine","code":"73025"},
  {"id":"rosemere","nom":"Rosemère","code":"73020"},
  {"id":"sainte-therese","nom":"Sainte-Thérèse","code":"73010"},
  {"id":"sainte-anne-des-plaines","nom":"Sainte-Anne-des-Plaines","code":"73035"}
]'::jsonb)
on conflict (id) do nothing;

-- Rattrapage pour une base DÉJÀ installée : le `on conflict do nothing` ci-dessus
-- ne corrige pas un projet existant. Ce bloc ajoute le code aux villes qui n'en ont
-- pas, sans toucher au reste (ni aux autres projets, ni aux villes déjà codées).
update public.projects p
   set villes = (
     select jsonb_agg(
       case when v ? 'code' then v
            else v || jsonb_build_object('code', c.code) end)
       from jsonb_array_elements(p.villes) v
       left join (values
         ('blainville','73015'), ('boisbriand','73005'), ('bois-des-filion','73030'),
         ('lorraine','73025'), ('rosemere','73020'), ('sainte-therese','73010'),
         ('sainte-anne-des-plaines','73035')
       ) as c(id, code) on c.id = v->>'id')
 where p.id = 'tdb'
   and exists (select 1 from jsonb_array_elements(p.villes) v where not (v ? 'code'));

-- ============================================================================
--  CONSERVATION & DESTRUCTION RÉELLE (Loi 25, art. 23)
--  Politique : un projet supprimé dans l'app est d'abord ARCHIVÉ (deleted_at).
--  À l'échéance de conservation (décision D1 — proposition : durée du mandat
--  + 3 ans, à confirmer avec Fanny), on DÉTRUIT réellement.
-- ============================================================================

-- Destruction réelle d'UN projet (codes + réponses suivent en cascade).
create or replace function public.hard_delete_project(pid text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.projects where id = pid;
  insert into public.audit_log (actor, action, detail)
  values ('system', 'delete', jsonb_build_object('hard_delete_project', pid));
end $$;

-- Purge périodique : détruit ce qui est archivé depuis plus longtemps que la
-- durée de conservation (par défaut 3 ans — AJUSTER selon la décision D1).
create or replace function public.purge_expired(retention interval default interval '3 years')
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.projects where deleted_at is not null and deleted_at < now() - retention;
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.audit_log (actor, action, detail)
    values ('system', 'delete', jsonb_build_object('purge_expired', n));
  end if;
  return n;
end $$;

-- Ces fonctions ne sont PAS exposées à l'app : on les roule à la main dans le
-- SQL Editor (ou via un cron Supabase plus tard).
revoke execute on function public.hard_delete_project(text)   from public, anon, authenticated;
revoke execute on function public.purge_expired(interval)      from public, anon, authenticated;

-- ============================================================================
--  SÉCURITÉ — Row Level Security (RLS)
--  Principe : la base est verrouillée par défaut. Seuls 2 chemins existent :
--   (a) ADMIN = utilisateur authentifié (Supabase Auth) → lit/gère tout.
--   (b) VILLE = passe par une Edge Function (clé service_role, côté serveur) qui
--       valide le code et n'écrit que SES réponses. Le rôle « anon » (la page web
--       publique) n'a AUCUN accès direct aux tables.
-- ============================================================================
alter table public.projects       enable row level security;
alter table public.access_codes   enable row level security;
alter table public.responses      enable row level security;
alter table public.audit_log      enable row level security;
alter table public.login_attempts enable row level security;

-- Admins (authentifiés) : tout sur les projets et les codes, lecture des réponses.
drop policy if exists "admin_all_projects"   on public.projects;
drop policy if exists "admin_all_codes"      on public.access_codes;
drop policy if exists "admin_read_responses" on public.responses;
drop policy if exists "admin_read_audit"     on public.audit_log;
drop policy if exists "admin_write_audit"    on public.audit_log;

create policy "admin_all_projects" on public.projects
  for all to authenticated using (true) with check (true);

create policy "admin_all_codes" on public.access_codes
  for all to authenticated using (true) with check (true);

create policy "admin_read_responses" on public.responses
  for select to authenticated using (true);

-- L'admin peut consigner ses propres actions (append seul) et relire le journal.
create policy "admin_read_audit" on public.audit_log
  for select to authenticated using (true);
create policy "admin_write_audit" on public.audit_log
  for insert to authenticated with check (true);

-- (Volontairement : AUCUNE policy pour le rôle 'anon' → tout accès direct est refusé.
--  login_attempts n'a AUCUNE policy : seule la service_role (Edge Functions) y touche.
--  Les écritures des villes passent par les Edge Functions, qui utilisent la clé
--  service_role et contournent la RLS APRÈS avoir validé le code.)

-- ============================================================================
--  RAPPEL : la clé « service_role » (Settings → API) est un PASSE-PARTOUT.
--  Elle ne doit JAMAIS se retrouver dans le frontend ni être partagée par courriel.
--  Elle vit uniquement comme secret des Edge Functions.
-- ============================================================================
