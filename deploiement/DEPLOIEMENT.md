# Déploiement de l'Orchestrateur — guide pas-à-pas

> **But** : publier l'app à l'adresse **`https://ecofisc.corda.consulting`** (ton domaine Corda, hébergé chez Namecheap / cPanel) et lui brancher une **base de données partagée au Canada**, avec une authentification validée sur le serveur.

## L'idée en une phrase (l'architecture retenue)
**cPanel sert la page ; Supabase garde les données.** Deux morceaux qui vivent à deux endroits :
- **Le frontend** = le paquet **`deploiement/dist/`** (`index.html` minifié + `.htaccess` + `robots.txt`), généré par `node tools/build-dist.js` → hébergé sur **cPanel** à `ecofisc.corda.consulting`. **« Coffre-fort »** : la page publique ne contient NI la grille, NI les règles de calcul, NI les descriptions — tout le contenu métier est livré par Supabase APRÈS authentification, et les recommandations sont calculées côté serveur.
- **Les données + l'auth** (codes, identités, réponses, commentaires) = **Supabase**, **région Canada**.

```
  Navigateur  ─(charge la page)─►  cPanel / Namecheap  (sert UN fichier HTML, AUCUNE donnée perso)
       │
       └─(codes, réponses, commentaires)─►  Supabase (Canada)  ── base verrouillée (RLS) + Edge Functions
```

### ⚠️ Pourquoi PAS tout mettre sur cPanel ?
Tu as **déjà verrouillé** « région Canada exigée par la Loi 25 » (on stocke des **noms de représentants** + leurs commentaires = renseignements personnels). Or les serveurs d'hébergement partagé Namecheap/cPanel sont aux **États-Unis (Phoenix) ou au R.-U.**, **pas au Canada** — y déposer ces données serait un **transfert transfrontalier** à éviter. La solution propre : la page (qui ne contient **aucune** donnée perso) est servie par cPanel ; les données entrées par les villes vont **directement** du navigateur vers **Supabase Canada**, sans jamais transiter ni dormir sur le serveur Namecheap. Sa localisation devient donc sans conséquence.
*(Mettre la base sur cPanel/MySQL serait aussi **plus** de code à écrire et à maintenir que Supabase — l'inverse de « pas de dev pour l'instant ».)*

## Décisions verrouillées (mise à jour 2026-06-30)
- **Adresse publique : `ecofisc.corda.consulting`** (sous-domaine de `corda.consulting`, domaine Namecheap, hébergement **cPanel**). On part **de zéro** sur ce domaine.
- **Frontend : hébergé sur cPanel** (paquet `deploiement/dist/` : `index.html` minifié + `.htaccess` + `robots.txt` — aucun contenu métier). **Backend : Supabase**, **région Canada (Central)** — données, catalogue ET moteur de calcul (Edge Functions).
- **Multi-projets** : l'app pilote plusieurs projets, chacun **« ville unique »** ou **« multi-villes »** (ex. une MRC). Le schéma inclut donc une table `projects` + un `project_id` sur les codes ; le projet « MRC Thérèse-De Blainville » est **amorcé d'office**. La suppression d'un projet est **douce** (champ `deleted_at` = archive, on ne détruit jamais).
- **Connexion des villes : par code**, validé **côté serveur** (Edge Functions). **Admin = vrai compte** (courriel + mot de passe Supabase).
- **Pas de dev pour l'instant** → ce guide flagge chaque point de sécurité à valider avant une vraie utilisation.

---

## PARTIE A — Mettre l'app EN LIGNE sur `ecofisc.corda.consulting` (cPanel)
> ≈ 20 min, aucune ligne de code. **Bon à savoir :** dès cette étape, l'app est **visible et fonctionnelle** à ton adresse — mais en **mode local** (chaque navigateur garde ses propres réponses, rien n'est encore centralisé). La centralisation arrive en Partie B+C. Ça te permet de **voir le résultat tout de suite** et de le montrer à Fanny.

### A1. Pointer le domaine vers l'hébergement
1. **Namecheap → Domain List → `corda.consulting` → Manage.**
2. Section **Nameservers** : choisis les **serveurs de noms de ton hébergement** (ils sont dans le courriel de bienvenue cPanel, du genre `dns1.namecheaphosting.com` / `dns2.…`). *(Si domaine et hébergement sont déjà liés dans ton tableau de bord Namecheap, c'est peut-être déjà fait.)*
3. La propagation DNS peut prendre de **quelques minutes à ~24 h** (souvent < 1 h).

### A2. Créer le sous-domaine `ecofisc`
1. **cPanel → section Domains → Domains (ou « Subdomains »).** Clique **Create / Create a New Domain**.
2. Saisis **`ecofisc.corda.consulting`**. cPanel propose automatiquement un **dossier racine** (Document Root), par ex. `/home/<ton-user>/ecofisc.corda.consulting`. Note ce chemin.
3. Crée. Le sous-domaine existe maintenant.

### A3. Téléverser l'app
1. **cPanel → File Manager** → entre dans le **dossier racine** du sous-domaine (celui noté en A2).
2. **Upload** les **3 fichiers** du dossier `Appli/deploiement/dist/` : `index.html`, `.htaccess` et `robots.txt`. ⚠ `.htaccess` commence par un point : dans File Manager, active « **Show Hidden Files** » (Settings, coin supérieur droit) pour le voir.
3. ⚠ **Supprime** du serveur les anciens fichiers `rules.js` et `demo-data.js` s'ils s'y trouvent (versions pré-coffre-fort : ils exposaient le contenu métier en clair).
   - *Alternative :* via **FTP** (identifiants dans cPanel → FTP Accounts) si tu préfères glisser-déposer depuis l'explorateur.

### A4. Activer le HTTPS (cadenas)
1. **cPanel → SSL/TLS Status** (ou « SSL/TLS » → AutoSSL). Coche `ecofisc.corda.consulting` → **Run AutoSSL**. cPanel installe un certificat **Let's Encrypt** gratuit.
2. **Indispensable** : sans HTTPS, le navigateur bloquera plus tard les appels à Supabase et certaines fonctions (presse-papier, etc.).

### ✅ Vérif Partie A
Ouvre **`https://ecofisc.corda.consulting`** → l'écran de connexion de l'Orchestrateur s'affiche, cadenas vert. (En mode local pour l'instant : tu peux déjà te connecter en admin et tester l'interface.)

---

## PARTIE B — Créer le BACKEND Supabase (région Canada)
> ≈ 20 min, aucune ligne de code. C'est ce qui rend les réponses **partagées et centralisées** (au lieu de rester dans chaque navigateur).

### B1. Créer le projet Supabase
1. **supabase.com → Start your project** → connecte-toi.
2. **New project. Region : `Canada (Central)`** ← important (Loi 25). Mot de passe de base **fort**, noté dans ton gestionnaire.
3. Attends ~2 min le provisionnement.

### B2. Créer les tables
1. **SQL Editor → New query.**
2. Ouvre **`schema.sql`** (ce dossier, version **v2 révisée**), copie tout, colle, **Run**. Tu dois voir « Success » (Table Editor → `projects`, `access_codes`, `responses`, `audit_log`, `login_attempts`).
3. *(Optionnel mais recommandé pour la démo)* Même manœuvre avec **`seed-demo.sql`** : installe le projet « Démo — MRC (données fictives) » (7 villes, 9 répondants fictifs) — le même jeu de données que le bouton « Projet Démo » de l'app. Rejouable à volonté (il remplace le projet demo).
4. **`sql/calculateur.sql`** (module Calculateur) : tables du rôle d'évaluation et des intrants + fonction d'agrégats. Rejouable. Le rôle se charge ensuite via l'écran **Réglages ⚙** de l'app (CSV produit par `tools/etl-role.py` — voir `docs/format-intrants.md`, runbook en annexe).

### B3. Verrouiller les inscriptions + créer les comptes admin
1. **Authentication → Sign In / Providers** → **désactive les inscriptions publiques** (« Allow new users to sign up » → OFF).
2. **Authentication → Users → Add user** : crée **à la main** le(s) compte(s) admin (toi, Fanny), mot de passe **fort** (active la 2FA si dispo). *(Tu peux utiliser une adresse `@corda.consulting` une fois ta messagerie cPanel configurée — optionnel.)*

### B4. Récupérer les clés (Settings → API)
- **Project URL** — *sûre à partager* (ex. `https://abcdxyz.supabase.co`).
- **anon public key** — *sûre à partager* (clé publique, conçue pour vivre dans la page).
- **service_role key** — 🔴 **SECRÈTE. Passe-partout.** JAMAIS dans le frontend, ne me l'envoie PAS, pas par courriel. Elle servira uniquement de *secret* d'Edge Function (Partie C).

### ✅ À m'envoyer pour la suite
Juste **Project URL** + **anon public key** (les deux publiques). Avec ça je branche tout (Partie C).

---

## PARTIE C — Brancher les deux (code fait ✅ — reste 2 collages)

**C1. Déployer les 4 Edge Functions (~15 min, 🧑)** — le serveur au complet : validation des codes (rate-limit), catalogue livré après authentification, **moteur de calcul** (le client ne reçoit que des résultats), et l'**import des rôles** (assistant nouveau projet). Pour **chacun** des quatre fichiers du dossier `deploiement/edge/` :
1. **Supabase → Edge Functions → Deploy a new function → Via Editor.**
2. Nomme la fonction **exactement** : `ville-claim`, `ville-set`, `admin-data`, `role-import` (selon le fichier `.ts` collé). *(`role-import` embarque la liste des 1011 municipalités et télécharge le rôle officiel MAMH par municipalité — regénérée par `node tools/gen-role-import.js`.)*
3. Efface le code d'exemple, **colle tout le contenu** du fichier `.ts`, clique **Deploy**.
4. ⚠ Dans les détails de chaque fonction : **désactive « Enforce JWT verification »** (nos clés *publishable* ne sont pas des JWT ; `admin-data` valide lui-même le jeton de session admin, les fonctions villes valident le code d'accès avec anti force-brute).
- *(Rien d'autre à configurer : la `service_role` est déjà injectée automatiquement dans l'environnement des fonctions. Les fichiers `.ts` sont GÉNÉRÉS depuis `rules.js` par `node tools/gen-edge-functions.js` — après toute modification des règles : regénérer, re-coller.)*

**C2. Frontend branché ✅** : `index.html` (dist) contient l'URL du projet + la clé publishable. Mode « en ligne » automatique, **repli localStorage** si le serveur est injoignable. Admin = auth Supabase (courriel + mot de passe) ; villes = Edge Functions ; le placeholder `Corda$2026` ne fonctionne plus qu'en mode local.

**C3. CORS ✅** : géré dans les fonctions elles-mêmes (origines admises : `https://ecofisc.corda.consulting` + local de test). REST/Auth Supabase acceptent le domaine par défaut.

**C4. Re-téléverser `deploiement/dist/`** sur cPanel (File Manager, comme en Partie A) après chaque regénération.

**C5. Test de bout en bout** : admin (courriel) génère un code → une « ville » se connecte depuis un **autre appareil** sur `ecofisc.corda.consulting` → code → consentement → cotation → les réponses atterrissent dans Supabase → l'admin les voit dans le Portrait. Codes de démo serveur : ceux de `seed-demo.sql` (dont `LOR-DEMO02`, volontairement non réclamé).

---

## 🔒 Checklist sécurité & Loi 25 (puisque pas de dev — à valider avant la VRAIE utilisation)
- [ ] **Données (Supabase) en région Canada** confirmée — *c'est là que vivent les renseignements personnels*.
- [ ] **cPanel/Namecheap ne stocke AUCUNE donnée perso** (sert seulement le fichier) → sa localisation US/UK n'est pas un enjeu de résidence des données.
- [ ] **HTTPS actif** (AutoSSL) sur `ecofisc.corda.consulting`.
- [ ] **service_role key** jamais dans le frontend / jamais partagée (uniquement secret d'Edge Function).
- [ ] **Inscriptions publiques désactivées** ; comptes admin créés à la main ; **mots de passe forts + 2FA**.
- [ ] **RLS active** sur les deux tables (le `schema.sql` le fait ; vérifier « enabled »).
- [ ] **CORS** limité à `https://ecofisc.corda.consulting` (pas `*`).
- [ ] **Finalité + consentement** : courte mention de confidentialité dans l'app (pourquoi on collecte prénom/nom/fonction, qui y accède, combien de temps).
- [ ] **Durée de conservation** définie (purge après le mandat ?).
- [ ] **Journal d'accès** (qui s'est connecté, quand) — attendu sous Loi 25.
- [ ] **Sauvegardes** Supabase : confirmer la politique de rétention.

## 💵 Coûts
- **Domaine `corda.consulting`** (Namecheap) : déjà payé (~15-20 $/an).
- **Hébergement cPanel** (Namecheap) : déjà payé — sert le fichier + le HTTPS gratuitement (AutoSSL/Let's Encrypt).
- **Supabase** : palier **gratuit** (large pour 7 villes / quelques dizaines de répondants). Payant (~25 $US/mois) seulement à plus grande échelle.
- **Total nouveau pour ce projet : 0 $** (tu réutilises domaine + hébergement déjà en main).

---
*Prochaine étape côté toi : **Partie A** (mettre l'app en ligne — visible tout de suite) puis **Partie B** (Supabase Canada) → m'envoyer Project URL + anon key. Prochaine étape côté moi : **Partie C** dès que j'ai ces deux clés.*
