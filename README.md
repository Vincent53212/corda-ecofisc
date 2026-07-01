# Corda Écofiscalité — Orchestrateur

Outil d'**analyse multicritère de mesures écofiscales municipales** (37 mesures × 22 critères × 4 dimensions), développé pour le mandat MRC Thérèse-De Blainville (ENAP/CERGO, dir. Pre Fanny Tremblay-Racicot) et conçu multi-projets.

**Statut : prototype** — persistance locale (localStorage), aucune donnée réelle en ligne. Le backend (Supabase, région Canada) arrive en Phase B — voir `deploiement/plan-de-travail.md`.

## Fichiers

| Chemin | Rôle |
|---|---|
| `orchestrateur.html` | L'application — s'ouvre par double-clic, aucun build |
| `rules.js` | **Le moteur de cotation** (règles métier, source unique) — doit rester à côté du HTML ; les deux se déploient ensemble |
| `tests/rules.test.js` | Tests du moteur — `node --test tests/rules.test.js` (zéro dépendance) |
| `docs/methodologie.md` | Règles de cotation en prose + points à valider par la direction |
| `docs/dictionnaire-donnees.md` | localStorage ↔ `schema.sql` + inventaire RP (EFVP) |
| `deploiement/` | Runbook cPanel + Supabase, schéma SQL, révision 1 (3 réviseurs), plan de travail |

## Démarrage rapide

1. Ouvrir `orchestrateur.html` (double-clic).
2. Côté admin : générer un code d'accès par répondant (écran « Accès »).
3. Côté ville : entrer le code → première connexion → coter les mesures.
4. Le « Portrait global » agrège par ville (moyenne des répondants) et par MRC (majorité des villes).

> Le code admin visible dans le source est un **placeholder de démonstration** (aucune sécurité) — remplacé par l'authentification Supabase en Phase B.

## Règles du dépôt

- **Jamais de secrets dans Git** (`service_role`, mots de passe — voir `.gitignore`).
- Toute modification des règles de cotation passe par `rules.js` **+ la suite de tests** (verte avant commit), puis se documente dans `docs/methodologie.md`.
- Commit + push après chaque bloc du plan de travail.
