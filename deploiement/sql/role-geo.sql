-- ============================================================================
--  GÉOMÉTRIE DU RÔLE + AGRÉGATS PAR CELLULE (carte d'incidence)
--  À coller dans : Supabase → SQL Editor → Run.
--  Prérequis : sql/calculateur.sql (table role_unites).
--
--  ⚠ CE FICHIER NE DÉTRUIT AUCUNE TABLE et se rejoue sans danger. Il n'a
--    volontairement PAS été ajouté à calculateur.sql, qui commence par un
--    « drop table role_unites cascade » : le rejouer viderait le rôle chargé.
--
--  ── POURQUOI ──────────────────────────────────────────────────────────────
--  Le rôle du MAMH est publié GÉORÉFÉRENCÉ : la couche `rol_unite_p_<annee>`
--  du GeoPackage porte un point par unité d'évaluation. L'ETL v1 jetait cette
--  géométrie ; l'ETL v2 (tools/etl-role.py) l'extrait en deux colonnes lon/lat.
--  Elles alimentent la carte d'incidence de l'écran Calculateur : les unités
--  sont agrégées en cellules côté serveur, et les cellules occupées dessinent
--  le territoire toutes seules — aucun contour, aucun fond de carte, aucune
--  requête vers un tiers.
--
--  ── DEGRÉS EN ENTRÉE, WEB MERCATOR EN SORTIE ─────────────────────────────
--  Le SRS source est EPSG:4269 (NAD83 géographique) : lon/lat sont des DEGRÉS.
--  On les stocke bruts — la donnée source, sans transformation destructive —
--  et on projette ICI, à l'agrégation, au seul endroit où ça se relit.
--
--  La projection est **Web Mercator (EPSG:3857)** et non une grille locale,
--  parce que la carte affiche un FOND DE TUILES : les tuiles du web sont en
--  Mercator, et une case découpée autrement ne se superposerait jamais
--  exactement au fond — le décalage grandirait du sud au nord de la MRC.
--
--  ⚠ PIÈGE À CONNAÎTRE : le « mètre » Mercator n'est PAS un mètre au sol. Il
--    est gonflé de 1/cos(latitude), soit ×1,43 à la latitude de la MRC (45,7°).
--    Découper tous les 500 mètres Mercator donnerait des cases de 349 m au sol,
--    et l'échelle affichée mentirait de 30 %. On divise donc le pas demandé par
--    cos(lat0) : les cases font bien `pas_m` mètres AU SOL, et l'échelle dit vrai.
-- ============================================================================

-- ---------- 1) Les deux colonnes ----------
alter table public.role_unites
  add column if not exists lon double precision,
  add column if not exists lat double precision;

comment on column public.role_unites.lon is
  'Longitude NAD83 (EPSG:4269), degrés — couche rol_unite_p du GeoPackage MAMH.';
comment on column public.role_unites.lat is
  'Latitude NAD83 (EPSG:4269), degrés. NULL pour les rôles importés en XML (role-import) : le format prescrit ne porte pas la géométrie.';

-- Index partiel : seules les unités positionnées entrent dans la carte, et
-- elles sont toujours filtrées par projet.
create index if not exists role_unites_geo_idx
  on public.role_unites (project_id) where lat is not null;

-- ---------- 2) Agrégats par cellule ----------
-- Retourne UN document JSON (PostgREST plafonne les fonctions « à lignes » à
-- 1000 — même raison qu'en calculateur.sql).
--
-- Les cellules portent EXACTEMENT les colonnes de calc_aggregats, plus cx/cy.
-- C'est délibéré : le client peut appeler simM04/simM01/simM02 telles quelles
-- sur les lignes d'une cellule. Aucune logique de simulation dupliquée, donc
-- aucune nouvelle façon de se tromper — et l'exactitude du calcul marginal est
-- héritée telle quelle.
--
-- AUCUNE SUPPRESSION ICI. La fonction retourne toutes les cellules, y compris
-- celles à une seule unité : le rôle est une donnée OUVERTE (CC-BY MAMH) et la
-- fonction est réservée aux admins authentifiés. C'est le client qui atténue
-- les cellules trop maigres, par lisibilité. Conséquence utile : la somme des
-- cellules égale le total affiché, ce qui sert de test.
-- ⚠ Le jour où des attributs d'`intrants` (NON ouverts) rejoindront la carte,
--   un seuil de suppression (n < 5) devra descendre ICI, côté serveur — même
--   avertissement qu'en tête de calculateur.sql.
drop function if exists public.calc_grille(text, integer);
create or replace function public.calc_grille(pid text, pas_m integer default 500)
returns jsonb
language sql stable
as $$
  with param as (
    select
      greatest(50, least(5000, coalesce(pas_m, 500)))::numeric as pas,   -- garde-fou : 50 m à 5 km
      (select percentile_cont(0.5) within group (order by lat)
         from public.role_unites where project_id = pid and lat is not null) as lat0
  ),
  maille as (
    -- pas exprimé en mètres MERCATOR : le pas au sol divisé par cos(lat0),
    -- pour que la case fasse bien `pas` mètres sur le terrain (voir l'en-tête).
    select pas, lat0, pas / cos(radians(lat0)) as pas_merc from param
  ),
  bornes as (
    select array[100000,200000,300000,400000,500000,600000,700000,800000,900000,
                 1000000,1250000,1500000,2000000,3000000,5000000,10000000,
                 25000000,50000000]::numeric[] as b
  ),
  agg as (
    select
      -- lon/lat (EPSG:4269) → Web Mercator (EPSG:3857), puis découpage
      floor(6378137.0 * radians(r.lon) / d.pas_merc)::integer as cx,
      floor(6378137.0 * ln(tan(pi()/4 + radians(r.lat)/2)) / d.pas_merc)::integer as cy,
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
    from public.role_unites r, bornes, maille d
    where r.project_id = pid and r.lat is not null and r.lon is not null
    group by 1, 2, 3, 4, 5, 6
  )
  select jsonb_build_object(
    'pas_m',    (select pas      from maille),   -- mètres AU SOL (ce qu'affiche l'échelle)
    'pas_merc', (select pas_merc from maille),   -- mètres Mercator (ce dont le client a besoin
                                                 -- pour poser les tuiles au bon endroit)
    'lat0',     (select lat0     from maille),
    -- ce que la carte ne montrera pas, pour que l'app puisse le dire
    'sans_position', (select count(*) from public.role_unites
                       where project_id = pid and lat is null),
    'cellules', coalesce((select jsonb_agg(to_jsonb(agg)) from agg), '[]'::jsonb)
  )
$$;

-- exécution réservée aux admins authentifiés (la RLS de role_unites s'applique
-- aussi DANS la fonction : security invoker par défaut)
revoke execute on function public.calc_grille(text, integer) from public, anon;
grant  execute on function public.calc_grille(text, integer) to authenticated;

-- ---------- 3) Remplissage des positions depuis le dépôt public ----------
-- Le rechargement automatique du rôle lit le XML prescrit du MAMH, qui NE PORTE
-- PAS la géométrie (vérifié : les champs RL0104G/H y sont vides partout). Les
-- positions viennent donc d'un dépôt à part, un fichier par municipalité, extrait
-- une fois du GeoPackage par tools/gen-positions.py et déposé par
-- tools/upload-positions.js. L'app le lit et appelle cette fonction par lots.
--
-- UPDATE et non UPSERT, délibérément : on ne crée JAMAIS d'unité ici. Un fichier
-- de positions couvre TOUTE la municipalité, alors qu'un projet peut n'en avoir
-- importé qu'une partie (ou un millésime différent) ; un upsert fabriquerait des
-- unités fantômes sans valeur ni CUBF, qui fausseraient les agrégats en silence.
-- Les matricules inconnus sont donc ignorés sans bruit — et l'écart se lit dans
-- le compte retourné.
create or replace function public.maj_positions(pid text, ville text, lignes jsonb)
returns integer language plpgsql as $$
declare n integer;
begin
  update public.role_unites r
     set lon = p.lon, lat = p.lat
    from jsonb_to_recordset(lignes)
      as p(matricule text, lon double precision, lat double precision)
   where r.project_id = pid and r.ville_id = ville and r.matricule = p.matricule;
  get diagnostics n = row_count;
  return n;
end $$;
-- security INVOKER (défaut) : la RLS de role_unites s'applique, donc admin seul.
revoke execute on function public.maj_positions(text, text, jsonb) from public, anon;
grant  execute on function public.maj_positions(text, text, jsonb) to authenticated;

-- ---------- 4) Contrôle : à lire après le Run ----------
-- Avant le rechargement du rôle, lon/lat sont NULL partout : c'est normal.
-- Après, « sans position » doit être à 0 pour le projet TDB.
select p.id  as projet,
       p.title,
       count(r.matricule)                                  as unites,
       count(r.matricule) filter (where r.lat is null)      as sans_position,
       round(min(r.lon)::numeric, 4) as lon_min, round(max(r.lon)::numeric, 4) as lon_max,
       round(min(r.lat)::numeric, 4) as lat_min, round(max(r.lat)::numeric, 4) as lat_max
  from public.projects p
  left join public.role_unites r on r.project_id = p.id
 where p.deleted_at is null
 group by p.id, p.title
 order by count(r.matricule) desc;

-- Et un aperçu de ce que la carte recevra (taille du document, nb de cellules) :
-- select jsonb_array_length(calc_grille('tdb', 500) -> 'cellules') as cellules,
--        pg_size_pretty(length(calc_grille('tdb', 500)::text)::bigint) as poids_json;
