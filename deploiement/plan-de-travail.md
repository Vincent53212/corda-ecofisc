# Plan de travail v2.1 — Orchestrateur (Écofiscalité · Corda)

> **v2.1 du 2026-07-05 — MODE SPRINT.** Rencontre Fanny + équipe dans ~4 jours (≈ 9 juillet) : objectif = produit « fini » (à ajuster) démontrable sur **`ecofisc.corda.consulting`**, backend complet **avec repli local** (la démo ne peut pas échouer), projet « Démo » en données fictives. Décisions Vincent (2026-07-05) : backend Supabase pour la rencontre ✔ · projet Démo distinct ✔ · + README non-initié · + présentation d'équipe (vision moyen terme).
>
> **v2 du 2026-07-01** — révision autonome du plan v1 (approuvée par Vincent), après achèvement des Blocs 0-2. Source d'origine : `déploiement_révision_1.md` (3 réviseurs : normes admin publique · sécurité · dev). Changement majeur : **le goulot n'est pas le code, c'est la latence de validation (Fanny)** → toutes les validations sont **batchées** dans un dossier unique, et le travail technique se poursuit en parallèle de l'attente.

## 🏃 Sprint 4 jours (avant la rencontre)
- **J1 (2026-07-05) ✅ 🤖** : `schema.sql` v2 (`017de7c`) · Bloc 3.5 complet + consentement art. 8 + projet Démo + paquet `dist/` + correctif mobile (`3732695`) · README non-initié · présentation d'équipe.
- **J1 🧑 (~40 min de clics, peut se faire dès maintenant)** : Partie A cPanel (sous-domaine + téléverser `dist/` + AutoSSL) · Partie B Supabase (projet **région Canada**, rouler `schema.sql` v2 puis `seed-demo.sql`, désactiver les inscriptions, comptes admin, m'envoyer **Project URL + anon key** seulement).
- **J2 🤖** : Edge Functions (`ville-claim`/`ville-get`/`ville-set` : dérivation serveur, whitelist générée de `rules.js`, rate-limit via `login_attempts`, bornage) · adaptateur Supabase branché sur la couture `sync` · auth admin réelle en ligne (placeholder conservé en repli local seulement) · CORS · re-upload `dist/`.
- **J3 🤖** : test bout-en-bout multi-appareils sur le domaine · gabarits Loi 25 essentiels pour la rencontre (avis ✅ déjà dans l'app ; politique de confidentialité + EFVP courte + trame d'entente) · corrections.
- **J4** : marge, répétition de la démo (scénario : Portrait Démo → `LOR-DEMO02` en direct → export Excel), checklist finale.
- ⚠ Gating Loi 25 inchangé : **données fictives seulement** tant que le Bloc 3 n'est pas signé — les codes réels ne sont pas distribués.

## Contexte et décisions structurantes
- Vincent n'est **pas développeur** (un dev révisera) → code propre, testé, documenté, prêt au handoff. Dépôt privé `Vincent53212/corda-ecofisc`.
- **Aucune donnée réelle en ligne** avant : cadrage Loi 25 (Bloc 3) **+** backend sécurisé (Bloc 4).
- **Décisions Vincent (2026-07-01) :** pas de vitrine anticipée — **go-live directement en cercle fermé (~1 mois)** une fois les blocs faits, puis itérations en continu. Validations Fanny regroupées en **un seul dossier**. `demoSwitch` retiré ; annotation = Ctrl+Alt+A admin.
- **Légende :** 🤖 = Claude · 🧑 = Vincent (+ Fanny pour validations) · ⛓️ = dépendance. **Après CHAQUE bloc : commit + push.**

---

## ✅ Fait
- **Bloc 0 — Fondation** (2026-06-30) : Git + dépôt privé + `.gitignore`.
- **Bloc 1 — Durcissement du prototype** (2026-07-01, `cadd404`) : sauvegarde fiable (+ copie de secours JSON), accessibilité (labels, aria, popover Portrait, focus, aria-live), sécurité légère (esc, SRI vérifié, anti-formule Excel), contrastes AA (ambre → texte encre), factorisation MRC.
- **Bloc 2 — Moteur testable + méthodo** (2026-07-01, `9cbb05a`) : `rules.js` (source unique, gelée), **25 tests** (`node --test tests/rules.test.js`, zéro dépendance), `docs/methodologie.md`, `docs/dictionnaire-donnees.md`, `README.md`. Branche morte de `reco()` clarifiée ; asymétrie d'arrondi ±0,5 découverte par les tests.
- **Intermède — révision du plan** (2026-07-01) : descriptions Gatineau intégrées (25/37), `demoSwitch` retiré (pollution des vraies données), annotation → Ctrl+Alt+A admin seulement (coupée en entrant côté ville), **dossier de validation Fanny** produit (`docs/dossier-validation-fanny.md` + `.docx`).
- **Bloc 3.5 — Préparation backend sans Supabase** (2026-07-05, `3732695`) : couture `store` async (`store.init()` + couche `sync` à backend enfichable, file d'opérations, repli local) ; catalogue `CATS`/`MEASURES`/`DESCRIPTIONS` → `rules.js` (whitelist générable) ; clé `rid|m|c` encapsulée ; codes à entropie crypto (6 car.). En bonus : consentement art. 8 à la 1re connexion (bloquant, horodaté), projet Démo déterministe (app + `seed-demo.sql`), paquet `deploiement/dist/` (+ `.htaccess` CSP), correctif défilement fantôme mobile, favicon.

---

## 📦 En circulation — Dossier de validation Fanny (🧑 transmet, latence externe)
`docs/dossier-validation-fanny.docx` : A. règles de calcul (7 points) · B. boussole ae7/ae2 · C. six descriptions Gatineau à approuver + **12 mesures sans description** (source à identifier) · D. décisions Loi 25 (conservation, responsable RP, finalité/consentement, entente Corda↔MRC/CERGO + PI, interdiction IA sur commentaires).
⛓️ Ses réponses alimentent `rules.js` (changements = quelques lignes + tests), les gabarits du Bloc 3 et le contenu des mesures. **Le travail des Blocs 3-3.5 avance sans attendre.**

## Bloc 3 — Cadrage Loi 25 : gabarits ⭐ PROCHAINE SÉANCE (🤖 rédige · 🧑/Fanny décident & signent) — GATING avant toute vraie donnée
1. **Avis de collecte + consentement** à la 1re connexion (`s-firstconn`) : finalité / destinataires / durée / droits / responsable + case « je consens ». *(art. 8)*
2. **Politique de confidentialité** liée au login. *(art. 3.2)*
3. **EFVP** courte (système traitant des RP **+ communication hors Québec** — Supabase « Canada Central » = Ontario) ; désigner + afficher le **responsable RP**. *(art. 3.1/3.3/17)*
4. **Entente d'encadrement** Corda ↔ MRC/CERGO : finalité, sécurité, sous-traitants, destruction, réversibilité, **propriété intellectuelle (IP = Corda)**, marque. *(art. 67.2 Loi accès)*
5. **Procédure des droits d'accès/rectification/retrait** (constat A « non outillés ») : au minimum une procédure documentée (courriel au responsable) affichée dans la politique.
6. **Conservation** : appliquer la décision D1 du dossier + **réviser `schema.sql`** (corriger « on ne détruit jamais », aligner soft/hard delete client-schéma-runbook). ⚠ `schema.sql` doit être révisé **avant** que Vincent le roule dans Supabase.
7. **Portail-LLM commentaires** : inscrire l'interdiction par défaut + conditions. Pas d'implémentation.
- 🧩 Les gabarits sont écrits **avec variables client** (réutilisables pour les futurs projets Corda ville-unique).

## Bloc 4 — Backend Supabase (⛓️ après 3.5 ✅ — EN COURS, J2 du sprint)
**Prérequis 🧑 :** projet Supabase **région Canada**, rouler le `schema.sql` **révisé (post-Bloc 3)**, désactiver inscriptions publiques, comptes admin, m'envoyer **Project URL + anon key** (`service_role` = SECRÈTE, jamais partagée).
**Code 🤖 :**
1. **Codes** : entropie `crypto.getRandomValues` (6-8 car.) + **rate-limit / lockout** dans `ville-claim`.
2. **Edge Functions** : ville/projet **dérivés du code côté serveur** ; whitelist générée (3.5) ; bornage des longueurs ; upsert idempotent.
3. **Journal d'audit** (connexions, lectures/exports admin).
4. **Auth admin réelle** : retirer `ADMIN_CODE` ; `enterAdmin()` inerte sans session Supabase.
5. **RLS / transport** : note multi-tenant ; CORS limité au domaine ; **CSP + en-têtes** via `.htaccess` ; SRI confirmé.
6. **Export brut complet admin** (réversibilité + droits Loi 25) — réponses individuelles + métadonnées.
7. **Brancher** l'app en ligne (repli localStorage), test bout-en-bout multi-appareils.

## Bloc 5 — Go-live en cercle fermé (~1 mois), puis itérations
1. Checklist « À corriger AVANT déploiement » de la révision 1 **entièrement cochée**.
2. Mise en ligne `ecofisc.corda.consulting` (Partie A cPanel + `rules.js`) — **cercle fermé** : accès par codes seulement, non publicisé, ~1 mois.
3. **Walkthrough guidé avec Fanny**, puis **1 ville pilote** avant les 7.
4. Nettoyage prod : `console.log` de repli, purge des données de test, procédure de réinitialisation.
5. Itérations en continu pendant le cercle fermé (retours → correctifs → push).

---

## Fond de panier (rien ne se perd — non bloquant)
Cibles tactiles 44 px (`.cb`) · auto-hébergement polices + ExcelJS (coupe le tiers CDN) · statut « N/A » par mesure (selon décision A7) · médiane vs moyenne (selon A5) · trigger `updated_at` + normalisation table `villes` côté SQL · page « mes données » côté répondant (droits) · déploiement scripté (rsync/Action GitHub).

## Fichiers touchés (principaux)
Bloc 3 : gabarits `.md` (nouveau dossier `loi25/`), `schema.sql`, `DEPLOIEMENT.md` · Bloc 3.5 : `orchestrateur.html`, `rules.js`, tests · Bloc 4 : Edge Functions (nouveau), `orchestrateur.html`, `.htaccess` · Bloc 5 : prod. **Après chaque bloc : commit + push vers `Vincent53212/corda-ecofisc`.**

## Vérification globale
Tests unitaires verts à chaque commit · régression Playwright PC + mobile après tout changement UI · parcours e2e multi-appareils au Bloc 4 · la section « À corriger AVANT déploiement » de `déploiement_révision_1.md` = checklist finale de go-live.
