# Corda Écofiscalité — Orchestrateur

> **Le projet en une phrase :** un outil web qui permet aux villes d'une MRC d'évaluer
> ensemble 37 mesures écofiscales (taxes et redevances vertes) selon une grille
> scientifique, et qui produit automatiquement le portrait régional des mesures
> recommandées.

Ce README s'adresse d'abord à un **lecteur non technique** — il explique quoi, pour qui,
comment les morceaux s'emboîtent, et où en est le chantier. (Les conventions pour
développeurs sont à la fin.)

---

## 1. C'est quoi, au juste ?

L'**écofiscalité municipale**, ce sont des taxes et redevances qui font payer les
comportements nuisibles (stationnements de surface, logements vacants, surfaces
minéralisées…) plutôt que d'augmenter la taxe foncière de tout le monde. La professeure
Fanny Tremblay-Racicot (ENAP/CERGO) a développé une **grille d'analyse multicritère**
pour évaluer ces mesures : chaque mesure est notée sur **22 questions** regroupées en
**4 dimensions** (potentiel fiscal · saine gestion administrative · acceptabilité et
équité · efficacité environnementale).

L'**Orchestrateur** transforme cette grille (jusqu'ici un fichier Excel) en application :

- chaque **répondant municipal** (directeur des finances, urbaniste…) reçoit un **code
  d'accès personnel**, se connecte et cote les mesures à son rythme (+ favorable /
  0 neutre / − défavorable, avec commentaires) ;
- le moteur calcule automatiquement l'**appréciation** de chaque dimension, puis la
  **recommandation** de chaque mesure (Recommandée / À l'étude / Non recommandée) ;
- l'**administrateur** (nous) voit le **Portrait global** : la matrice mesures × villes,
  la synthèse MRC (majorité des villes), et peut tout exporter en Excel.

Premier client : la **MRC Thérèse-De Blainville** (7 villes). L'outil est conçu
**multi-projets** dès le départ : d'autres MRC ou des villes seules pourront suivre,
chacune dans son projet étanche. La propriété intellectuelle de l'outil est chez
**Corda** ; la grille scientifique reste celle de l'équipe de recherche.

## 2. Comment les morceaux s'emboîtent

Le principe directeur : **la page publique est une coquille — tout ce qui a de la
valeur vit au serveur** (architecture « coffre-fort »). Un curieux qui inspecte le site
ne voit ni les questions, ni les mesures, ni les règles de calcul : ce contenu n'arrive
qu'après authentification, et les recommandations sont calculées côté serveur.

```
┌─ Le site public (cPanel · ecofisc.corda.consulting) ──────────────┐
│  dist/index.html      coquille minifiée : écrans vides + login    │
│                       (généré depuis orchestrateur.html)          │
└──────────────────────────────┬────────────────────────────────────┘
                     authentification (code ville ou compte admin)
┌─ Le serveur (Supabase · région Canada) ─────────▼─────────────────┐
│  Edge Functions       LE CERVEAU : questions, catalogue,          │
│  (générées depuis     descriptions, règles de calcul — livre le   │
│   rules.js)           contenu et retourne des RÉSULTATS calculés  │
│  Base Postgres        codes d'accès, réponses, consentements,     │
│  (verrouillée, RLS)   journal d'audit — rien n'en sort sans droit │
└───────────────────────────────────────────────────────────────────┘
┌─ L'atelier (ce dépôt) ────────────────────────────────────────────┐
│  rules.js             la SOURCE UNIQUE du cerveau (compilée vers  │
│                       le serveur par tools/gen-edge-functions.js) │
│  tests/               29 tests automatiques : toute modification  │
│                       des règles doit les passer                  │
│  docs/methodologie.md les règles en français clair (validation)   │
│  deploiement/         mode d'emploi, schéma SQL, paquet dist/,    │
│                       fonctions serveur générées (edge/)          │
└───────────────────────────────────────────────────────────────────┘
```

**Pourquoi `rules.js` reste séparé ?** Pour qu'il n'existe qu'**une seule** version de
la vérité. Si Fanny décide de changer une règle (ex. l'arrondi des moyennes), on modifie
**quelques lignes à un seul endroit**, les 29 tests confirment que rien d'autre n'a
bougé, on regénère les fonctions serveur, et tout l'écosystème suit.

**Où vivent les données ?** Dans **Supabase, région Canada** (exigence de la Loi 25
puisqu'on recueille des noms de représentants municipaux) : base verrouillée par défaut,
consentements horodatés, journal des accès, anti force-brute sur les codes. L'app est
**en ligne seulement** — aucun contenu ni donnée n'est entreposé dans les navigateurs.

## 3. Où en est le chantier

| Étape | Statut |
|---|---|
| Prototype complet (cotation, portrait, accès, projets, export Excel) | ✅ |
| Durcissement (sauvegarde fiable, accessibilité, contrastes, sécurité légère) | ✅ |
| Moteur isolé + 29 tests + méthodologie documentée | ✅ |
| Dossier de validation chez Fanny (règles + descriptions + Loi 25) | 📨 en circulation |
| Consentement à la 1re connexion (Loi 25, art. 8) | ✅ |
| Projet « Démo » (données fictives) pour les présentations | ✅ |
| Mise en ligne sur `ecofisc.corda.consulting` (HTTPS + en-têtes de sécurité) | ✅ |
| Backend centralisé (Supabase Canada) + vraie authentification admin | ✅ |
| Architecture « coffre-fort » (contenu et calculs servis après authentification) | ✅ |
| Cadrage Loi 25 complet (politique, EFVP, entente) — **avant toute vraie donnée** | 🔜 |
| Go-live en cercle fermé (~1 mois), ville pilote, puis les 7 villes | à venir |

Le détail vit dans `deploiement/plan-de-travail.md`.

## 4. Essayer l'outil en 2 minutes

1. Ouvrir **https://ecofisc.corda.consulting** (l'app est en ligne seulement — le
   contenu vit au serveur).
2. **Admin** : courriel + mot de passe (comptes créés à la main dans Supabase) →
   menu déroulant en haut → projet **« Démo — MRC (données fictives) »** : le Portrait
   s'anime (7 villes, 9 répondants fictifs).
3. Pour vivre l'expérience d'un répondant : **Déconnexion**, puis entrer le code
   `LOR-DEMO02` → première connexion, avis de consentement, cotation. (Le projet Démo
   se remet à neuf en rejouant `seed-demo.sql` dans Supabase.)

## 5. Petit glossaire

| Terme | Traduction |
|---|---|
| **Frontend** | La partie visible : la page web dans le navigateur |
| **Backend** | La partie cachée : le serveur qui garde et protège les données |
| **Minification** | Compression du code servi au navigateur — plus léger, et illisible d'un coup d'œil |
| **Supabase** | Service de base de données clé en main (on choisit la région Canada) |
| **Edge Function** | Petit programme côté serveur qui vérifie chaque demande (ex. « ce code d'accès a-t-il le droit d'écrire ceci ? ») |
| **RLS** | Verrou de la base : par défaut, personne ne peut rien lire ni écrire |
| **cPanel** | Panneau de contrôle de l'hébergement web Corda (sert les fichiers du frontend) |
| **CSP / SRI** | Ceintures de sécurité du navigateur (limitent ce que la page a le droit de charger) |
| **Loi 25** | Loi québécoise sur la protection des renseignements personnels — encadre noms/fonctions recueillis |
| **EFVP** | Évaluation des facteurs relatifs à la vie privée (analyse d'impact exigée par la Loi 25) |

## 6. Règles du dépôt (pour quiconque touche au code)

- **Jamais de secrets dans Git** (`service_role`, mots de passe — voir `.gitignore`) ;
  le document source Gatineau est confidentiel et exclu du dépôt.
- Toute modification des règles de cotation passe par `rules.js` **+ la suite de tests**
  (`node --test tests/rules.test.js`, verte avant commit), puis se documente dans
  `docs/methodologie.md`.
- Le paquet à téléverser se régénère par `node tools/build-dist.js` → `deploiement/dist/`.
- Le jeu de données Démo se régénère par `node tools/gen-seed-demo.js` (ne pas éditer
  `seed-demo.sql` à la main).
- Commit + push après chaque bloc du plan de travail.
