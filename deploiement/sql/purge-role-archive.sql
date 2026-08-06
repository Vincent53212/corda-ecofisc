-- ============================================================================
--  PURGE DU RÔLE D'ÉVALUATION À L'ARCHIVAGE D'UN PROJET
--  À coller dans : Supabase → SQL Editor → Run.
--  Prérequis : schema.sql (table projects) et sql/calculateur.sql (role_unites).
--
--  ⚠ CE FICHIER NE DÉTRUIT AUCUNE TABLE et se rejoue sans danger. Il n'a
--    volontairement PAS été ajouté à calculateur.sql, qui commence par un
--    « drop table role_unites cascade » : le rejouer viderait le rôle chargé.
--
--  ── POURQUOI ──────────────────────────────────────────────────────────────
--  Supprimer un projet dans l'app est une suppression DOUCE : la ligne de
--  `projects` reste, marquée `deleted_at`. Or `role_unites` est rattaché en
--  `on delete cascade` — donc la cascade ne part qu'à la DESTRUCTION RÉELLE,
--  des années plus tard (purge_expired, art. 23).
--
--  Entre les deux, un projet archivé conserve son rôle au complet : ~60 000
--  lignes pour les 7 villes de la MRC Thérèse-De Blainville, 437 000 pour la
--  seule ville de Montréal. Chaque projet-test créé avec le sélecteur de
--  municipalités importe un rôle entier, et ce rôle survit à la suppression
--  du projet. Ça s'accumule en silence : aucun écran de l'app ne le montre,
--  et le disque se remplit sans qu'un usager n'ait rien fait.
--
--  ── CE QU'ON PURGE, ET SURTOUT CE QU'ON NE PURGE PAS ─────────────────────
--   · role_unites → PURGÉ. Donnée OUVERTE du MAMH (CC-BY 4.0), retéléchargée
--     en un clic depuis l'écran Réglages. Pour un projet archivé, ce n'est
--     qu'une copie d'un fichier public : la garder n'apporte rien.
--   · intrants → CONSERVÉ. Ce sont les données transmises par les VILLES
--     (canopée, desserte…). Elles ne se retéléchargent NULLE PART. Elles
--     suivent la conservation du projet et meurent avec lui.
--   · codes d'accès, réponses, consentements, journal → CONSERVÉS, même
--     raison : la Loi 25 impose une durée de conservation, pas l'effacement
--     immédiat. La destruction réelle reste le travail de purge_expired().
--
--  La règle en une phrase : on ne jette que ce qui se retélécharge.
--
--  ⚠ Si un projet archivé devait un jour être réactivé, son rôle se recharge
--    depuis l'écran Réglages (bouton par ville). Rien n'est perdu.
-- ============================================================================

-- ---------- 1) Le déclencheur : purge à l'archivage ----------
create or replace function public.purge_role_on_archive()
returns trigger language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.role_unites where project_id = new.id;
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.audit_log (actor, action, detail)
    values ('system', 'delete',
            jsonb_build_object('purge_role_on_archive', new.id, 'unites', n));
  end if;
  return new;
end $$;

-- (Pas de `revoke execute` ici, contrairement à hard_delete_project() et
--  purge_expired() : une fonction de déclencheur ne peut PAS être appelée
--  directement — Postgres refuse avec « may only be called as a trigger ».
--  Le privilège est vérifié à la création du déclencheur, pas à chaque
--  déclenchement ; un revoke n'ajouterait aucune sécurité et risquerait
--  seulement de casser l'archivage d'un projet en production.)

-- Se déclenche au SEUL passage de « actif » à « archivé » : pas au chargement
-- du rôle, pas au renommage, pas si deleted_at était déjà rempli (rejeu de la
-- file de synchronisation → le PATCH peut repasser, la condition l'ignore).
drop trigger if exists trg_purge_role_on_archive on public.projects;
create trigger trg_purge_role_on_archive
  after update of deleted_at on public.projects
  for each row
  when (old.deleted_at is null and new.deleted_at is not null)
  execute function public.purge_role_on_archive();

-- ---------- 2) Rattrapage : les projets DÉJÀ archivés ----------
-- Le déclencheur ne vaut que pour l'avenir. Ce bloc nettoie ce qui traîne
-- depuis les archivages passés (projets-tests, essais du sélecteur de villes).
do $$
declare n integer;
begin
  delete from public.role_unites r
   using public.projects p
   where p.id = r.project_id
     and p.deleted_at is not null;
  get diagnostics n = row_count;
  raise notice 'Rattrapage — % ligne(s) de rôle supprimée(s) (projets déjà archivés).', n;
  if n > 0 then
    insert into public.audit_log (actor, action, detail)
    values ('system', 'delete', jsonb_build_object('purge_role_rattrapage', n));
  end if;
end $$;

-- ---------- 3) Contrôle : ce qui reste, et pour quel projet ----------
-- À lire après le Run. Tout projet marqué « archivé » doit afficher 0 unité.
select p.id    as projet,
       p.title as titre,
       case when p.deleted_at is null then 'actif' else 'archivé' end as etat,
       count(r.matricule) as unites_role
  from public.projects p
  left join public.role_unites r on r.project_id = p.id
 group by p.id, p.title, p.deleted_at
 order by count(r.matricule) desc;

-- Et le poids que ça représente sur le disque (index compris) :
select pg_size_pretty(pg_total_relation_size('public.role_unites')) as poids_role,
       pg_size_pretty(pg_total_relation_size('public.intrants'))    as poids_intrants,
       pg_size_pretty(pg_database_size(current_database()))         as poids_base;
