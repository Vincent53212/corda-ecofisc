-- ============================================================================
--  CALCULATEUR — données foncières + agrégats (Supabase / Postgres)
--  À coller dans : Supabase → SQL Editor → Run (APRÈS schema.sql v2).
--  Rejouable sans danger (create if not exists / or replace).
--
--  Deux tables :
--   · role_unites : le RÔLE D'ÉVALUATION (données ouvertes MAMH, CC-BY 4.0),
--     chargé par l'équipe via l'ETL (tools/etl-role.py) puis l'écran Réglages.
--   · intrants    : les données DES VILLES au format universel (matricule →
--     attribut → valeur) — tout ce qui dépasse le rôle (canopée, desserte…).
--
--  Une fonction :
--   · calc_aggregats(pid) : histogrammes par ville × secteur × classe × tranche
--     de valeur. Le client simule les mesures sur CES AGRÉGATS (curseurs
--     instantanés) — la simulation ne tire aucune donnée parcellaire en vrac
--     (seul un échantillon des 8 plus grandes unités est lu, sous RLS admin).
--
--  ⚠ Le rôle est une donnée OUVERTE (CC-BY MAMH) → agrégats à n=1 sans enjeu
--     ici. Mais dès qu'on joindra des attributs d'`intrants` (NON ouverts) aux
--     agrégats, il faudra un seuil de suppression (n < 5) contre la ré-identif.
--  ⚠ Aucun renseignement personnel ici : matricules et attributs physiques.
-- ============================================================================

-- ⚠ La clé primaire inclut ville_id : le matricule (18 pos.) n'est garanti unique
-- que DANS une municipalité. Sans ville_id, deux villes partageant un matricule
-- s'écraseraient (perte silencieuse dans un projet multi-villes). Si une version
-- antérieure de cette table existe (PK sans ville_id), la remplacer :
drop table if exists public.role_unites cascade;
create table if not exists public.role_unites (
  project_id   text not null references public.projects(id) on delete cascade,
  ville_id     text not null,
  matricule    text not null,
  cubf         text not null default '',      -- utilisation prédominante (RL0105A)
  valeur_terrain   numeric not null default 0, -- RL0402A
  valeur_batiment  numeric not null default 0, -- RL0403A
  valeur_totale    numeric not null default 0, -- RL0404A (valeur de l'immeuble)
  superficie_terrain numeric,                  -- RL0302A (m²)
  nb_logements     integer,                    -- RL0311A
  terrain_vague_desservi text,                 -- RL0501A (à confirmer au répertoire)
  zonage_agricole  text,                       -- RL0303A (à confirmer)
  charge_at    timestamptz not null default now(),
  primary key (project_id, ville_id, matricule)
);
create index if not exists role_unites_ville_idx on public.role_unites (project_id, ville_id);
create index if not exists role_unites_cubf_idx  on public.role_unites (project_id, cubf);

-- Intrants des villes — FORMAT UNIVERSEL (docs/format-intrants.md) :
-- une ligne = (matricule, attribut, valeur), greffée au rôle par le matricule.
create table if not exists public.intrants (
  project_id  text not null references public.projects(id) on delete cascade,
  ville_id    text not null,
  matricule   text not null,
  attribut    text not null,                   -- ex. 'canopee_pct', 'zone_taxable'
  valeur      text not null default '',        -- brut ; conversion à l'usage
  source      text not null default '',        -- nom du fichier transmis (traçabilité)
  charge_at   timestamptz not null default now(),
  primary key (project_id, matricule, attribut)
);
create index if not exists intrants_attr_idx on public.intrants (project_id, attribut);

-- ---------- RLS : même moule que le reste — verrouillé, admin seulement ----------
alter table public.role_unites enable row level security;
alter table public.intrants    enable row level security;
drop policy if exists "admin_all_role_unites" on public.role_unites;
drop policy if exists "admin_all_intrants"    on public.intrants;
create policy "admin_all_role_unites" on public.role_unites
  for all to authenticated using (true) with check (true);
create policy "admin_all_intrants" on public.intrants
  for all to authenticated using (true) with check (true);
-- (aucune policy anon : la page publique ne voit rien)
-- ⚠ MODÈLE ASSUMÉ (identique à projects/access_codes/responses) : « authentifié »
--    = admin, car les INSCRIPTIONS PUBLIQUES SONT DÉSACTIVÉES (Auth → Providers).
--    Si un jour on ouvre le signup, il FAUDRA restreindre ces policies à une
--    table d'admins (using (auth.uid() in (select id from admins))). Les intrants
--    des villes ne sont PAS des données ouvertes — cette frontière compte.

-- ============================================================================
--  AGRÉGATS — histogrammes pour la simulation côté client
--  secteur : 'res' (CUBF 1000-1999) / 'nonres' (le reste)
--  classe  : res → catégorie de logements (1, 2, 3-5, 6-9, 10-49, 50plus)
--            nonres → famille CUBF (2 premiers caractères)
--  tranche : bornes fixes fines (les tranches de l'usager s'y accrochent →
--            arithmétique EXACTE sur agrégats, y compris en taux marginal)
-- ============================================================================
-- Retourne UN document JSON (jsonb) plutôt qu'un ensemble de lignes :
-- PostgREST plafonne les fonctions « à lignes » à 1000 lignes — un JSON, non.
drop function if exists public.calc_aggregats(text); -- le type de retour a changé (table → jsonb)
create or replace function public.calc_aggregats(pid text)
returns jsonb
language sql stable
as $$
  with bornes as (
    select array[100000,200000,300000,400000,500000,600000,700000,800000,900000,
                 1000000,1250000,1500000,2000000,3000000,5000000,10000000,
                 25000000,50000000]::numeric[] as b
  ),
  agg as (
    select
      r.ville_id,
      case when r.cubf >= '1000' and r.cubf < '2000' then 'res' else 'nonres' end as secteur,
      case when r.cubf >= '1000' and r.cubf < '2000' then
        case when coalesce(r.nb_logements,1) >= 50 then '50plus'
             when r.nb_logements >= 10 then '10-49'
             when r.nb_logements >= 6  then '6-9'
             when r.nb_logements >= 3  then '3-5'
             when r.nb_logements =  2  then '2'
             else '1' end
        else coalesce(nullif(substr(r.cubf,1,2),''),'00') end as classe,
      (array_prepend(0::numeric, b))[width_bucket(r.valeur_totale, b) + 1] as tranche_lo,
      count(*) as n, sum(r.valeur_totale) as somme_valeur, sum(r.valeur_terrain) as somme_terrain
    from public.role_unites r, bornes
    where r.project_id = pid
    group by 1, 2, 3, 4
  )
  select coalesce(jsonb_agg(to_jsonb(agg)), '[]'::jsonb) from agg
$$;
-- exécution réservée aux admins authentifiés (la RLS de role_unites s'applique
-- aussi DANS la fonction : security invoker par défaut)
revoke execute on function public.calc_aggregats(text) from public, anon;
grant  execute on function public.calc_aggregats(text) to authenticated;
