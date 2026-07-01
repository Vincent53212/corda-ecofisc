# Dictionnaire de données — Orchestrateur

> Correspondance entre la persistance **prototype** (localStorage, gérée par `orchestrateur.html`)
> et le **schéma cible** (Supabase/Postgres, `deploiement/schema.sql`).
> Publics : le **dev repreneur** (handoff) et l'**EFVP** (inventaire des renseignements personnels).

## 1. Clés localStorage

| Clé | Contenu |
|---|---|
| `orchestrateur-v1` | Données métier : projets, codes d'accès, réponses, archives |
| `orchestrateur-ui-v1` | Session UI : rôle, ville, répondant, mesure ouverte, annotations de design |
| `orchestrateur-v1-secours-<timestamp>` | Copie de secours créée automatiquement si le JSON principal est illisible (jamais écrasée) |

## 2. Structure de `orchestrateur-v1` ↔ `schema.sql`

### 2.1 Projets — `projects[]` ↔ `public.projects`

| localStorage | Postgres | Notes |
|---|---|---|
| `id` (slug du titre) | `id text primary key` | ex. `tdb`, `ville-de-saint-jerome` |
| `title` | `title text not null` | |
| `type` `'single'` \| `'multi'` | `type` + `check (type in ('single','multi'))` | ville unique = le titre sert de ville |
| `villes` `[{id, nom}]` | `villes jsonb` | même forme |
| `createdAt` (ISO) | `created_at timestamptz` | |
| — *(suppression = retrait + archive locale, voir 2.4)* | `deleted_at` (suppression douce) | ⚠ **divergence** à trancher au Bloc 3 (art. 23 Loi 25) |
| `activeProject` (id du projet actif) | — | état d'interface, pas persisté côté serveur |

### 2.2 Codes d'accès — `codes[]` ↔ `public.access_codes`

| localStorage | Postgres | Notes |
|---|---|---|
| `code` ex. `STH-7F3K` | `code text primary key` | préfixe = 3 lettres de la ville — **non fiable** (collisions Boisbriand/Bois-des-Filion), jamais un secret (révision B) |
| `ville` (id de ville) | `ville text` | id **dans** le projet ; aucune FK (texte libre) — garde-fou prévu en Edge Function |
| `project` | `project_id text references projects(id)` | |
| `person` `{prenom, nom, fonction}` ou `null` | `prenom`, `nom`, `fonction` (3 colonnes à plat) | 🔒 **RP** — représentants municipaux nommés (Loi 25) |
| `createdAt` / `claimedAt` | `created_at` / `claimed_at` | `claimed_at null` = pas encore réclamé |

### 2.3 Réponses — `responses{}` ↔ `public.responses`

| localStorage | Postgres | Notes |
|---|---|---|
| clé `"<code>\|<measureId>\|<critId>"` | `primary key (code, measure_id, criterion_id)` | même clé composite ; le format `rid\|m\|c` est encapsulé dans `store._k()` |
| `cote` −1 \| 0 \| 1 \| null | `cote smallint check (cote in (-1,0,1))` | le check SQL vaut côté serveur, indépendamment du client |
| `comment` | `comment text default ''` | 🔒 texte libre — **peut contenir des RP de tiers** (rappel prévu au Bloc 3) |
| `updatedAt` | `updated_at timestamptz` | pas de trigger de mise à jour côté SQL (constat C — Phase B) |
| — | `measure_id` / `criterion_id` sans FK | whitelist à imposer dans les Edge Functions (révision B) |

### 2.4 Archives — `archived[]` (sans équivalent SQL)

À la suppression d'un projet, le client archive localement `{project, codes, responses, archivedAt}` avant de retirer les données. Le schéma cible n'a pour l'instant que `projects.deleted_at`. **Trois politiques divergent** (client : hard delete + archive locale · schéma : soft delete sur `projects` seulement · runbook : « ne jamais détruire ») — **alignement obligatoire au Bloc 3** (conservation limitée, art. 23).

## 3. Inventaire des renseignements personnels (pour l'EFVP)

| Donnée | Où | Sensibilité |
|---|---|---|
| Prénom, nom, fonction des répondants | `codes[].person` ↔ `access_codes` | RP de représentants d'organismes publics, nommément identifiés |
| Commentaires libres | `responses{}.comment` ↔ `responses.comment` | Peuvent contenir des RP de tiers ; traiter comme **entrée hostile** (LLM interdit par défaut) |
| Horodatages de connexion | `claimedAt` / `claimed_at` | Traçabilité — à couvrir par l'avis de collecte |

Durée de conservation : **à trancher au Bloc 3** (aucune purge implémentée à ce jour).

## 4. Références

- Moteur de calcul : `rules.js` · règles en prose : `docs/methodologie.md`
- Schéma cible complet (RLS incluse) : `deploiement/schema.sql`
- Divergences et constats : `deploiement/déploiement_révision_1.md`
