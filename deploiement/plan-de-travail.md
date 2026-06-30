# Plan de travail — suites de la Révision 1 (Orchestrateur + déploiement)

> Feuille de route approuvée le **2026-06-30**. Source : `déploiement_révision_1.md` (3 réviseurs : normes admin publique · sécurité · bonnes pratiques de dev). **Prochaine séance = Bloc 1.**

## Contexte
**Pourquoi ce plan.** Trois réviseurs indépendants (A normes de l'administration publique · B sécurité · C bonnes pratiques de dev) ont produit `déploiement_révision_1.md`. Ce plan transforme sa section « Priorités » en **séquence de travail**. Le projet est désormais **sous Git** (dépôt privé `Vincent53212/corda-ecofisc`, dossier `Appli/` gardé dans OneDrive). Vincent n'est **pas développeur** (un dev révisera plus tard) → on vise un code **propre, testable, prêt au handoff**, et on documente le « pourquoi ».

**Cadrage commun aux 3 revues :** en mode **prototype localStorage**, rien n'expose les RP en ligne ; les risques « Élevé/Moyen » se **matérialisent à la bascule backend** → on traite ces points **en conception**, avant d'écrire le code serveur, et **aucune vraie donnée en ligne** avant le cadrage Loi 25 + le backend.

**Décisions de Vincent (2026-06-30) qui fixent l'ordre :**
- On **commence par le durcissement du prototype** (visible, sans backend, faible risque).
- **Pas pressé pour la démo Fanny** → pas de mise en ligne anticipée ; on construit solide d'abord.

**Légende :** 🤖 = Claude · 🧑 = Vincent (+ Fanny pour validations/légal) · ⛓️ = dépendance · (A)/(B)/(C) = réviseur source. **Après CHAQUE bloc : 🤖 `commit` + `push`** (miroir GitHub à jour).

---

## Bloc 0 — Fondation ✅ FAIT (2026-06-30)
`git init` + dépôt **privé** `corda-ecofisc`, 1er commit poussé, `.gitignore` (exclut `old/`, factsheet autre projet, secrets). *(Constat C Critique « pas de contrôle de version ».)*

## Bloc 1 — Durcissement du prototype ⭐ PROCHAINE SÉANCE (🤖, ~1 séance, sans backend)
Tout dans `orchestrateur.html`. Faible risque, gros gain de qualité ; chaque point = un constat de la révision.
1. **Sauvegarde fiable** (C — « perte de données invisible ») : `store._save()` ne doit plus avaler l'exception ; n'afficher « Enregistré ✓ » (`flashSaved`) **qu'après** écriture réussie ; toast d'erreur si quota/JSON.
2. **Accessibilité** (A) : `<label for=…>` sur tous les champs (`#codeInput`, `#fcPrenom/#fcNom/#fcFonction`, textarea commentaire) ; rendre le détail des 4 appréciations du Portrait accessible au **clic/focus** (pas seulement `title` au survol) ; déplacer le focus + `aria-live` sur changements d'écran/toasts/« Enregistré ✓ ».
3. **Sécurité légère** (B/C) : `esc()` → ajouter `'` et `/` ; **SRI** (`integrity` + `crossorigin`) sur ExcelJS ; neutraliser l'**injection de formule Excel** (préfixer `'` les cellules débutant par `= + - @`).
4. **Contrastes / tailles** (A) : foncer `--faint` et l'ambre `--fav-warn` ; relever les textes < 12 px (cible contrastomètre 4.5:1).
5. **Nettoyage** (C) : factoriser la **règle de majorité MRC** dupliquée (`renderPortrait` vs `mrcMaj` dans `exportExcel`) en une fonction unique ; regrouper quelques **chaînes magiques** (ids d'écran) en constantes ; `aria-label` sur boutons-icônes (`💬`, `×`), `role=progressbar` sur la barre.
- **Vérif :** Playwright PC + mobile (0 débordement, focus/aria) ; contrastomètre ; tests manuels (forcer un échec localStorage → toast d'erreur ; exporter un nom « =SUM » → pas de formule active). ⮕ 🤖 commit + push.

## Bloc 2 — Moteur testable + méthodologie documentée (🤖, ~1 séance) ⛓️ après Bloc 1
1. **Extraire le moteur** (C) : sortir `apprec()`/`reco()`/agrégation (`villeCote`, `dimApprecVille`, `recoForVille`) + données de référence (`DIMENSIONS`, seuils) dans un **module isolé** (`rules.js` exporté), importé par l'UI — UI inchangée.
2. **Tests unitaires** (C) : petite suite (Vitest) sur les règles ; cas connus (tous +1 → tf/rec ; mélanges) ; **clarifier/supprimer la branche morte de `reco()`** (deux issues identiques).
3. **Doc méthodo** (A/C) : **table de décision en prose** (somme→appréciation ; 4 appréciations→reco) + **dictionnaire de données** (localStorage ↔ `schema.sql`). → 🧑/Fanny valident les règles (cas limites + l'agrégation ville = **moyenne des répondants**).
- **Vérif :** suite de tests verte ; relecture de la doc avec Vincent. ⮕ commit + push.

## Bloc 3 — Cadrage Loi 25 (🤖 rédige les gabarits FR · 🧑 Vincent/Fanny décident & signent) — GATING avant toute vraie donnée
1. **Avis de collecte + consentement** (A) à la 1re connexion (`s-firstconn`) : finalité / destinataires / durée / droits / responsable + case « je consens ». *(art. 8)*
2. **Politique de confidentialité** (A) : page liée au login. *(art. 3.2)*
3. **EFVP** (A/B) : gabarit court (système traitant des RP **et communication hors Québec** — préciser que Supabase « Canada Central » = Ontario, **hors Québec**) ; **désigner + afficher le responsable RP**. *(art. 3.1/3.3/17)*
4. **Entente de mandataire** Corda ↔ MRC/CERGO (A) : gabarit (finalité, sécurité, sous-traitants, destruction, réversibilité, marque). *(art. 67.2 Loi accès)*
5. **Conservation** (A/C) : trancher la **durée** + la **vraie destruction** ; **aligner la suppression** soft/hard entre client / `schema.sql` / `DEPLOIEMENT.md` (corriger d'abord le « on ne détruit jamais » du schéma — contraire à l'art. 23).
6. **Portail-LLM commentaires** (A/B) : inscrire l'**interdiction par défaut** + conditions (pseudonymisation, fournisseur Canada, endpoint scopé/journalisé). Pas d'implémentation.
- 🤖 produit les **brouillons** ; 🧑/Fanny valident. ⛓️ **Aucune vraie donnée en ligne** tant que ce bloc + le backend ne sont pas faits.

## Bloc 4 — Backend Supabase (Phase B/C) — sécurité intégrée dès la conception
**Prérequis 🧑 :** créer le projet Supabase **région Canada**, rouler `schema.sql`, désactiver inscriptions publiques, créer comptes admin, m'envoyer **Project URL + anon key** (la `service_role` reste SECRÈTE). *(Runbook : `DEPLOIEMENT.md` Parties A/B.)*
**Conception/code 🤖** (garde-fous AVANT d'écrire les Edge Functions) :
1. **Repenser la couture `store` sync → async** (C) : pré-chargement en mémoire (+ flush) **ou** appelants async ; encapsuler la clé `rid|m|c`. ⛓️ gros morceau structurant.
2. **Codes** (B) : entropie `crypto.getRandomValues` (6-8 car.) + **rate-limit / lockout** dans `ville-claim`.
3. **Garde-fous Edge Functions** (B) : ville/projet **dérivés du code** côté serveur ; **whitelist** `measure_id`/`criterion_id` ; bornage des longueurs ; upsert idempotent.
4. **Journal d'audit** (A/B) : table + alimentation (connexions, lectures/exports admin).
5. **Auth admin réelle** (B) : retirer le placeholder `Corda$2026` ; `enterAdmin()` inerte sans session Supabase.
6. **RLS / transport** (B) : note multi-tenant (« jamais de compte authenticated pour un tiers ») ; **CORS** limité au domaine ; **CSP + en-têtes** via `.htaccess` ; SRI confirmé.
7. **Brancher** `orchestrateur.html` en ligne (repli localStorage), héberger, **test bout-en-bout**.
- **Vérif :** parcours admin→code→1re connexion→cotation depuis un autre appareil → données dans Supabase → Portrait ; écriture hors périmètre **rejetée** ; brute-force des codes **ralenti**. ⮕ commit + push à chaque sous-étape.

## Bloc 5 — Vitrine / Go-live (plus tard — pas pressé)
Mise en ligne sur `ecofisc.corda.consulting` (Partie A cPanel), d'abord en **données fictives** pour la démo Fanny ; **go-live réel** seulement après la checklist « À corriger AVANT déploiement » de la révision **entièrement cochée**.

---

## À valider avec Fanny (transversal — à collecter au fil des blocs)
Règles de reco (cas limites + branche morte) · agrégation ville = moyenne des répondants · descriptions adaptées de Mascouche · durée de conservation · note méthodologique · finalité/consentement.

## Fichiers touchés (principaux)
`orchestrateur.html` (blocs 1, 2, 4) · `deploiement/schema.sql` + `DEPLOIEMENT.md` (blocs 3-4) · **nouveaux** : `rules.js` + tests (bloc 2), gabarits Loi 25 `.md` (bloc 3), `.htaccess` (bloc 4). **Source** : `déploiement_révision_1.md`. Après chaque bloc : 🤖 `git commit` + `push` vers `Vincent53212/corda-ecofisc`.

## Vérification globale
Chaque bloc a sa vérif (Playwright a11y/responsive · tests unitaires du moteur · parcours e2e backend). La section **« À corriger AVANT déploiement »** de `déploiement_révision_1.md` sert de **checklist finale de go-live**.
