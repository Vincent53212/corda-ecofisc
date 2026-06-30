# Déploiement — Révision 1

**Objet de la revue :** l'**Orchestrateur** (`orchestrateur.html`) + le **plan de déploiement** (`DEPLOIEMENT.md`, `schema.sql`).
**Date :** 2026-06-30
**Méthode :** trois revues **indépendantes et parallèles**, en lecture seule —
**(A)** conformité aux **normes de l'administration publique** (Loi 25, accessibilité SGQRI 008 / WCAG 2.1 AA, langue, gouvernance, transparence) ;
**(B)** **audit de sécurité applicative** (auth, RLS, XSS, secrets, transport, écritures villes) ;
**(C)** **bonnes pratiques de développement logiciel** (architecture, contrôle de version, testabilité, maintenabilité, reproductibilité, prêt-pour-handoff).
**Statut de l'objet :** *prototype* (persistance **localStorage**). Le backend **Supabase + Edge Functions** (Phase B/C) reste à écrire.

---

## 1. Synthèse exécutive

L'**architecture est bien raisonnée** et **la qualité est nettement au-dessus de la moyenne pour un prototype de non-développeur** : résidence des données (page sans RP sur cPanel, données sur Supabase Canada), **RLS deny-by-default** (`anon` sans aucune policy), clé `service_role` tenue hors frontend, **échappement anti-XSS `esc()` appliqué partout**, **règles métier déterministes centralisées** (`apprec`/`reco`), couture `store` réelle, amorçage/migration des données prévus, interface intégralement en **français**. C'est une base saine.

Mais **l'outil n'est pas prêt pour une utilisation réelle auprès de corps publics**, pour trois raisons que les réviseurs pointent (souvent en convergence) :

1. **Tout le dispositif Loi 25 manque au point de collecte** ★ (A+B) : aucun avis de confidentialité ni consentement à la première connexion, aucune politique publiée, aucune EFVP, aucune entente de mandataire Corda ↔ MRC, et une **règle de conservation contraire à la loi** (le `schema.sql` affirme « on ne détruit **jamais** »).
2. **Le modèle d'accès est faible** ★ (A+B) : **codes à très faible entropie** (32⁴ ≈ 1,05 M, préfixe de ville devinable) **sans aucune limitation de débit** — énumération réaliste **dès que les Edge Functions seront en ligne** ; et la sécurité des écritures « villes » repose sur des **Edge Functions non encore écrites** dont il faut **spécifier les garde-fous maintenant**.
3. **La dette technique est surtout *autour* du code** (C) : le projet **n'est pas sous contrôle de version** (fichier unique qui vit dans OneDrive — risque réel, pas cosmétique) ; la couture de persistance est **synchrone** et ne tiendra pas telle quelle face à un Supabase **asynchrone** ; et les trois artefacts (client / `schema.sql` / `DEPLOIEMENT.md`) **divergent sur la suppression** (soft vs hard delete). Le cœur métier est *parfaitement testable en théorie* mais *intestable en pratique* (tout est inline).

**Nuance de cadrage commune aux trois revues :** en l'état **prototype localStorage**, rien n'expose en ligne les RP d'autrui (tout est local au navigateur). Les sévérités « Élevé/Moyen » **se matérialisent à la bascule Phase B** (Supabase + Edge Functions) — d'où l'intérêt de les traiter **pendant la conception, avant d'écrire le code serveur**. **Verdict handoff (C) :** prêt à être **lu et compris** par un dev ; **pas** prêt à être **repris et étendu** sans une première passe « mise en dépôt Git + extraction du moteur ».

> ★ = constat **soulevé par au moins deux des trois réviseurs** (signal fort). Les réviseurs sont notés (A)/(B)/(C).

---

## 2. Priorités AVANT déploiement (fusion des trois revues)

### 🟣 Fondation — à faire en premier (faible coût, fort effet)
0. **Mettre le projet sous contrôle de version** : `git init` + dépôt **GitHub privé**, sortir le code de la seule « sauvegarde OneDrive ». Le dossier n'est pas versionné et vit dans OneDrive (sync auto = risque de corruption silencieuse) ; le versionnage manuel (`old/`) est fragile. C'est le **prérequis n°1 du passage de relais** au dev (revue par diff, historique, rollback) et ça débloque les skills de revue. *(Critique — C)*

### 🔴 Bloquant — conditions avant toute donnée réelle
1. ★ **Aucune donnée réelle en ligne avant la Phase C** (auth serveur livrée). Pendant la vitrine (Partie A), n'utiliser que des **données fictives**, **ou** protéger le sous-domaine par mot de passe cPanel (`.htpasswd`) — le placeholder `Corda$2026` est **lisible dans le source public**. *(A+B+C)*
2. **Avis de collecte + consentement** à la 1re connexion (finalité, destinataires, durée, droits d'accès/rectification, responsable). *(art. 8 LPRPSP — A+B)*
3. **Politique de confidentialité publiée** et liée depuis l'écran de login. *(art. 3.2 LPRPSP — A)*
4. **Durée de conservation tranchée + destruction réelle planifiée**, et **aligner la politique de suppression** : aujourd'hui le client fait un *hard delete*, le `schema.sql` ne met `deleted_at` que sur `projects`, et le `DEPLOIEMENT.md` promet « on ne détruit jamais » — **les trois divergent**. ★ *(art. 23 LPRPSP — A+B+C)*
5. **EFVP** (développement d'un système traitant des RP **et** communication hors Québec) + **désigner/afficher le responsable** de la protection des RP. *(art. 3.1, 3.3, 17 LPRPSP — A)*
6. **Entente de mandataire** écrite Corda ↔ MRC/CERGO (finalité, sécurité, sous-traitants, destruction, réversibilité, marque). *(art. 67.2 Loi sur l'accès — A)*

### 🟠 Élevé — conception serveur + intégrité des données (avant d'écrire les Edge Functions)
7. ★ **Codes d'accès** : entropie cryptographique (`crypto.getRandomValues`, 6-8 caractères) **+ rate-limit / lockout** dans `ville-claim`. Le vrai trou exploitable une fois en ligne. *(B, appuyé par A)*
8. **Garde-fous des Edge Functions** (le `service_role` contourne la RLS → seul rempart) : `ville`/`project_id` **dérivés du code côté serveur** (jamais d'un paramètre client) ; **whitelist** des `measure_id`/`criterion_id` (aucune FK ne les contraint) ; **bornage des longueurs** ; upsert idempotent. *(B)*
9. ★ **« Portail de pull des commentaires » vers un LLM** : interdiction **par défaut** sans EFVP dédiée. Si requis : **pseudonymisation/caviardage des noms**, fournisseur à **résidence canadienne** + entente, **endpoint authentifié/scopé/journalisé**, commentaires traités comme **entrée hostile** (injection de prompt). *(A+B)*
10. **Repenser la granularité de la couture `store` (synchrone → asynchrone).** La persistance actuelle lit/écrit en **mémoire synchrone** (appels en boucle dans `villeCote`/`renderPortrait`) ; Supabase via Edge Functions est **asynchrone** → la bascule **n'est pas** un simple remplacement de l'objet `store`. Prévoir un **pré-chargement en mémoire** (+ flush) ou rendre les appelants async ; **encapsuler** le format de clé `rid|m|c`. *(Élevé — C)*
11. **Ne plus « mentir » sur la sauvegarde** : `_save()` avale les exceptions et « Enregistré ✓ » s'affiche **sans vérifier** le succès → **perte de données invisible** (quota localStorage, JSON corrompu). Remonter l'échec ; n'afficher le ✓ qu'après écriture réussie. *(Élevé, ~5 lignes — C)*
12. **Accessibilité bloquante** (corrections faciles) : `<label>` sur **tous** les champs ; détail des 4 appréciations du Portrait accessible **autrement qu'au survol** (clic/focus). *(WCAG 1.3.1, 3.3.2, 1.4.13 — A)*

### 🟡 Moyen — durcissement, testabilité & qualité
13. **CSP + en-têtes de sécurité** via `.htaccess` (`X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, HSTS) **+ SRI** (`integrity`) sur ExcelJS ★ ; idéalement **auto-héberger** polices et librairie. *(B+C)*
14. **Journal d'audit** (connexions, lectures/exports admin). ★ *(A+B)*
15. **Retirer le placeholder admin** `Corda$2026` avant la Phase B ; `enterAdmin()` inerte sans session Supabase ; **ne pas réutiliser** le pattern. ★ *(A+B+C)*
16. **Extraire le moteur** (`apprec`/`reco`/agrégation + données de référence) dans un module **testé** (règles pures = cas d'école pour des tests unitaires ; un bug y coûte cher — il décide des recommandations). Corriger au passage la **branche morte de `reco()`** (deux branches retournent la même valeur). *(C)*
17. **Factoriser les duplications** : la règle de **majorité MRC** (et la reco par ville) est écrite **deux fois** (Portrait vs Export Excel) → risque de dérive. *(C)*
18. **Contrastes / tailles** (foncer `--faint` et l'ambre, ≥ 12 px) ; **durcir `esc()`** (`'`, `/`) ★ ; **neutraliser l'injection de formule Excel** (préfixer `' ` les cellules débutant par `= + - @`). *(A/B/C)*
19. **Documenter pour le handoff** : un **dictionnaire de données** (forme localStorage ↔ `schema.sql`) + la **table de décision `apprec`/`reco` en prose** (le cœur du produit ne vit qu'en JS → à faire valider par la Pre Tremblay-Racicot sans lire le code). *(C, rejoint la « neutralité méthodologique » de A)*
20. **RLS multi-tenant** : documenter la limite (« ne jamais créer de compte `authenticated` pour un tiers ») ; scoper par `project_id` si élargissement. **CORS** strictement limité au domaine (déjà prévu — à exécuter en C3). *(B)*

---

## 3. Revue A — Conformité aux normes de l'administration publique

### Synthèse
Bonne conscience des enjeux de résidence des données (architecture cPanel/Supabase, RLS, protection de `service_role`, checklist Loi 25 amorcée), **mais pas prêt pour une utilisation réelle auprès de corps publics**. Risque dominant : **absence complète du dispositif Loi 25 au point de collecte** (aucun avis, consentement, politique, EFVP, entente de mandataire ; règle de conservation contraire à la loi). Accessibilité (SGQRI 008 / WCAG 2.1 AA) : manques concrets et faciles à corriger (champs sans `<label>`, info au seul survol, contrastes faibles). Gouvernance d'un outil privé (Corda) traitant des RP de représentants nommés d'organismes publics : encadrement contractuel et méthodologique encore absent. La **langue française est pleinement conforme**.

### Constats

| Sévérité | Constat | Emplacement | Recommandation concrète |
|---|---|---|---|
| Critique | Aucun avis de collecte au moment de recueillir prénom/nom/fonction. L'écran « Première connexion » demande trois champs obligatoires sans dire pourquoi, qui y accède, combien de temps, ni les droits de la personne. | `orchestrateur.html` ≈ écran `s-firstconn` et handler `#fcBtn` | Encadré d'avis au-dessus des champs (finalité, destinataires, durée, droits, responsable + courriel) + case « J'ai lu et je consens » obligatoire avant « Commencer ». |
| Critique | Aucune politique de confidentialité publiée alors que la collecte se fait par un moyen technologique (art. 3.2). Le login n'offre aucun lien. | `orchestrateur.html` `s-login` ; absente du déploiement | Rédiger une politique et la lier depuis le login et le pied de page (page statique cPanel ou section de l'app). |
| Critique | Conservation illimitée revendiquée : « suppression DOUCE… on ne détruit JAMAIS, on date » + archive complète indéfinie. Contraire au principe de conservation limitée et à l'obligation de destruction (art. 23). | `schema.sql` (commentaire `deleted_at`) ; `orchestrateur.html` (`d.archived.push`) ; `DEPLOIEMENT.md` (« purge ? » non tranché) | Calendrier de conservation (durée du mandat + délai légal) puis destruction réelle (purge SQL planifiée). |
| Critique | Mot de passe admin en clair (`Corda$2026`) alors que la Partie A met l'app **publiquement en ligne** avant la vraie auth serveur (Partie C). N'importe qui lit le source et entre en admin. | `orchestrateur.html` (`if(v==='Corda$2026')`) ; `DEPLOIEMENT.md` Partie A | Aucune donnée réelle avant la Partie C ; en vitrine, données fictives ou sous-domaine protégé (`.htpasswd`). |
| Élevé | Aucune EFVP, alors qu'elle est doublement obligatoire : développement d'un système traitant des RP (art. 3.3) et communication hors Québec (art. 17). | Transversal ; absente de `DEPLOIEMENT.md` | Réaliser une EFVP courte avant toute collecte réelle ; la faire valider et la conserver. |
| Élevé | Aucune entente écrite encadrant le traitement de RP par Corda (privé) pour des organismes publics (art. 67.2 Loi sur l'accès). | Transversal | Entente de traitement (finalité, sécurité, sous-traitants, non-usage secondaire, destruction, réversibilité). |
| Élevé | « Région Canada » présentée comme suffisante, mais Supabase Canada Central = Ontario (**hors Québec**) et Supabase Inc. = société américaine (exposition CLOUD Act). C'est une **communication hors Québec**, pas une simple résidence au Canada. | `DEPLOIEMENT.md` ; `schema.sql` | Documenter la communication hors Québec dans l'EFVP, vérifier la protection adéquate (clauses Supabase, sous-traitants/sauvegardes) ; ne pas assimiler « Canada » à « Québec ». |
| Élevé | Champs de formulaire sans `<label>` (placeholder seul) : code d'accès, 3 champs d'identité, zones de commentaire. | `orchestrateur.html` (`#codeInput`, `#fcPrenom/#fcNom/#fcFonction`, textarea commentaire) | `<label for=…>` à chaque champ (visible ou masqué visuellement). WCAG 1.3.1, 3.3.2, 4.1.2. |
| Élevé | Projet futur « extraire les commentaires » vers un LLM externe = communication de RP à un tiers (souvent hors Québec) + nouvelle finalité ; les commentaires libres peuvent contenir des RP de tiers. | Idée future ; champ libre commentaire | EFVP dédiée, base légale/consentement, anonymisation/caviardage, entente fournisseur ; interdiction par défaut dès maintenant. |
| Élevé | Droits d'accès, rectification et retrait du répondant non outillés. | `orchestrateur.html` (aucun écran « mes données » côté ville) | Au minimum une procédure documentée (courriel au responsable) ; idéalement accès en lecture/rectification de ses propres réponses. |
| Moyen | Contrastes et tailles sous AA : `--faint #94897A` sur crème, blanc sur ambre (`.rpill.etude`), nombreux textes `.58–.7rem`. | `orchestrateur.html` (variables ; `.pmatrix th` ; `.rpill.etude` ; `.faint mono`) | Vérifier au contrastomètre (4.5:1), foncer `--faint` et l'ambre, relever les < 12 px. WCAG 1.4.3. |
| Moyen | Information au seul survol (`title`) : le détail des 4 appréciations du Portrait n'existe que dans l'infobulle (inaccessible clavier/tactile/lecteur d'écran). | `orchestrateur.html` (`title="'+esc(tip)+'"`) | Détail accessible au clic/focus, ou tableau dépliable. WCAG 1.4.13, 4.1.2. |
| Moyen | Aucun journal d'accès/audit (qui a consulté/exporté quoi, quand). | `schema.sql` (aucune table d'audit) ; `DEPLOIEMENT.md` (case non cochée) | Table de journalisation (connexions, lectures admin, exports) horodatée, alimentée par les Edge Functions. |
| Moyen | Transitions d'écran (SPA) sans gestion du focus ni `aria-live` ; « Enregistré ✓ », toasts, « code généré » non annoncés. | `orchestrateur.html` (`go()`, `.toast`, `#orchSaved`) | Déplacer le focus sur le titre de l'écran cible + conteneur `aria-live="polite"`. WCAG 2.4.3, 4.1.3. |
| Moyen | Code = identifiant **et** mot de passe, faible entropie, aucun anti-force-brute. | `orchestrateur.html` (`genCode`, `createCode`) | Allonger l'aléatoire + rate-limiting dans `ville-claim`. |
| Moyen | Neutralité méthodologique non transparente : les seuils `apprec()`/`reco()` ne sont ni documentés ni visibles. | `orchestrateur.html` (`apprec`, `reco`) | Note méthodologique (validée par la Pre Tremblay-Racicot) accessible depuis l'app. |
| Moyen | Minimisation à justifier : 3 champs d'identité obligatoires ; commentaires libres pouvant contenir des RP de tiers, sans avertissement. | `orchestrateur.html` (validation `#fcBtn` ; textarea) | Documenter la nécessité de chaque champ ; rappel sous la zone de commentaire « ne pas inscrire de RP de tiers ». |
| Moyen | Responsable de la protection des RP non désigné ni affiché (art. 3.1). | Absent de l'app et du déploiement | Désigner (par défaut, plus haute autorité chez Corda) + afficher titre + courriel. |
| Faible | Barre de progression sans `role="progressbar"`/`aria-valuenow`. | `orchestrateur.html` (`.progress`, `#globalProg`) | Ajouter rôles/attributs ARIA. |
| Faible | Boutons-icônes sans nom accessible : `💬` (title seul), `×` (retrait de ville). | `orchestrateur.html` (`.cbubble`, `.npvdel`) | `aria-label` explicite. |
| Faible | Cibles tactiles des boutons de cote 42×38 px (< 44). Conforme AA (seuil 24) mais limite. | `orchestrateur.html` (`.cb`) | Agrandir vers 44×44 si possible. |
| Faible | Codes via `Math.random()` (non cryptographique). | `orchestrateur.html` (`genCode`) | Génération serveur avec source sûre (Phase C). |
| Faible | Réversibilité partielle : l'export Excel est une vue agrégée/admin, pas un export brut complet. | `orchestrateur.html` (`exportExcel`) | Prévoir un export brut (réponses individuelles + métadonnées) pour la portabilité. |
| Faible | Dépendances CDN tiers (Google Fonts, ExcelJS) : transmettent l'IP du répondant hors Québec + dépendance de disponibilité. | `orchestrateur.html` (fonts ; ExcelJS) | Auto-héberger sur cPanel ; mentionner dans la politique. |
| Info | Marque privée « Corda » sur un outil de consultation de corps publics : propriété/usage à clarifier. | `orchestrateur.html` ; `schema.sql` (en-tête) | Préciser dans le contrat l'usage de la marque et la propriété outil/données. |
| Info | RLS admin `using(true)` pour tout `authenticated` : aucun cloisonnement par organisme/projet. Acceptable avec un seul admin. | `schema.sql` (policies) | Si plusieurs admins/organismes, restreindre par `project_id`/rôle. |

### Déjà conforme (Revue A)
- **Résidence des données** bien raisonnée (page sans RP sur cPanel ; données sur Supabase ; séparation explicitée).
- **RLS activée sur les 3 tables** + « zéro accès `anon` » assumé ; clé `service_role` protégée (avertissements répétés).
- **Bonnes pratiques de déploiement** prévues : inscriptions publiques désactivées, comptes admin manuels, mots de passe forts + 2FA, CORS restreint, HTTPS obligatoire.
- **Checklist Loi 25** dédiée déjà présente (base à compléter).
- **Langue** : `lang="fr"`, interface 100 % française (Charte de la langue française).
- **Accessibilité partielle** : `:focus-visible`, double encodage couleur + lettre (R/É/N), SVG décoratifs en `aria-hidden`, repères sémantiques `<header>/<nav>/<main>/<aside>`, `aria-label` sur le sélecteur de projet et la fermeture du panneau.
- **Anti-injection** : échappement HTML systématique via `esc()`.
- **Traçabilité partielle** : horodatages `created_at`/`updated_at`/`claimed_at`.

---

## 4. Revue B — Audit de sécurité applicative

### Synthèse
Posture **correcte pour un prototype** : hygiène anti-XSS réellement soignée (`esc()` systématique) et intention RLS saine (deny-by-default, `anon` sans policy, `service_role` hors frontend). Les risques dominants ne sont **pas dans le rendu** mais dans le **modèle d'accès** : **codes à très faible entropie** (32⁴ ≈ 1,05 M, préfixe devinable) **sans rate-limit** → énumération réaliste une fois les Edge Functions en ligne. La sécurité des écritures villes repose sur des **Edge Functions non écrites** qui contournent la RLS via `service_role` (le schéma n'offre aucun filet : pas de FK sur `measure_id`/`criterion_id`). Deux chantiers Loi 25 à cadrer en amont : le **« portail de pull des commentaires »** (transfert transfrontalier + injection de prompt) et l'absence de journal d'audit / mention de confidentialité. Le mot de passe admin en clair = placeholder à portée locale nulle, **à supprimer avant la Phase B**.

### Constats

| Sévérité | Constat | Emplacement | Recommandation |
|---|---|---|---|
| Élevé | **Codes faible entropie + aucun rate limiting.** Alphabet 32, 4 positions → **32⁴ = 1 048 576**. Préfixe (3 lettres de ville) public/devinable, hors secret. Sans limite de débit, trouver un code valide ≈ 150 k essais (~25 min à 100 req/s) → usurpation d'une ville. | `orchestrateur.html:542-548` (`genCode`), `:586` (`claimCode`) ; pas de rate-limit dans `DEPLOIEMENT.md` (C1) | Codes 6-8 car. via `crypto.getRandomValues` ; **rate-limit + lockout** par IP/code dans `ville-claim` ; journaliser les tentatives. |
| Élevé | **Futur « portail de pull des commentaires » vers un LLM externe** : RP de personnes nommées exposées à un tiers hors Canada (**transfert transfrontalier**), **injection de prompt indirecte** (texte libre non fiable), désanonymisation. | Conception future ; `responses.comment` `schema.sql:38` | Pas de RP brutes hors Supabase Canada ; pseudonymisation/agrégation ; fournisseur résidence Canada + entente ; endpoint authentifié/scopé/journalisé ; consentement couvrant ce traitement ; commentaires = entrée hostile. |
| Moyen | **Écritures villes déléguées aux Edge Functions (non écrites) qui contournent la RLS via `service_role`.** Pas de **FK** sur `responses.measure_id`/`criterion_id` (text libres) → insertion de lignes arbitraires possible ; rien ne force la déduction `ville`/`project_id` à partir du code côté serveur. | `schema.sql:33-41` ; `DEPLOIEMENT.md:85` (C1, intention) | Spécifier avant d'écrire : ville+projet **dérivés du code** ; **whitelist** `measure_id`/`criterion_id` ; bornage longueurs ; upsert idempotent (PK le permet). |
| Moyen | **RLS admin sans séparation tenant/projet** : tout `authenticated` accède à **tous** projets/codes/réponses (`using(true)`). OK avec 2-3 admins de confiance, mais aucun cloisonnement si élargissement. | `schema.sql:77-84` | Documenter la limite ; à terme scoper par `project_id`/appartenance (claim JWT ou table de liaison). |
| Moyen | **Mot de passe admin en clair** `Corda$2026` dans le JS livré (contournable : source ou `enterAdmin()` en console). Portée données d'autrui **nulle** en localStorage, mais le secret sera **publié** (Partie A) et le **pattern** risque d'être réutilisé. | `orchestrateur.html:696` ; `enterAdmin` `:672-677` ; `demoSwitch` `:718-722` | Retirer avant Phase B ; `enterAdmin()` inerte sans session Supabase ; ne pas réutiliser le pattern. |
| Moyen | **Aucune CSP ni en-têtes de sécurité** (`CSP`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, HSTS) → un futur XSS s'exécuterait sans barrière ; clickjacking possible. | `orchestrateur.html:1-10` (head) ; à poser via `.htaccess` | CSP (après externalisation du `<script>` inline pour éviter `unsafe-inline`) + en-têtes via `.htaccess` ; HSTS. |
| Moyen | **Absence de SRI / chaîne d'approvisionnement** : ExcelJS depuis cdnjs sans `integrity`/`crossorigin` → une altération du CDN exécuterait du code arbitraire dans une page qui manipule des RP. | `orchestrateur.html:382` (ExcelJS) ; `:7-9` (fonts) | `integrity="sha384-…"` + `crossorigin="anonymous"` sur ExcelJS ; envisager l'auto-hébergement. |
| Moyen | **`Math.random()` pour les codes** — PRNG non cryptographique, théoriquement prédictible. | `orchestrateur.html:546` | `crypto.getRandomValues` (et génération côté serveur). |
| Moyen | **Conformité Loi 25 non implémentée** : pas de table d'audit, pas de mention de confidentialité/consentement au `claim`, pas de durée de conservation/purge (le doc les **liste** sans rien coder). | `schema.sql` (aucune table audit) ; `s-firstconn` `orchestrateur.html:296-310` ; `DEPLOIEMENT.md:101-103` | Table d'audit ; mention finalité/consentement au `claim` ; purge post-mandat automatisée. |
| Faible | **`esc()` n'échappe pas l'apostrophe `'`** (ni `/`). Aucun trou aujourd'hui (attributs en guillemets doubles), mais un futur attribut en guillemets simples avec valeur utilisateur (« O'Brien », « directeur de l'urbanisme ») permettrait une évasion d'attribut → XSS. | `orchestrateur.html:603` | Ajouter `'`→`&#39;` (et `/`→`&#47;`) à `esc()`. |
| Faible | **Injection de formule Excel** : les **noms de villes** (saisis par l'admin) en en-têtes/feuilles ; un nom débutant par `= + - @` pourrait être interprété comme formule à l'ouverture. Risque limité (commentaires/identités **non** exportés). | `orchestrateur.html:978,990,992,993` | Préfixer `' ` les cellules texte débutant par `= + - @`. |
| Faible | **RP en clair dans localStorage + session sans expiration** : sur poste partagé, lecture triviale via l'inspecteur ; le « repli localStorage » (C2) pourrait y laisser dormir des RP. | `orchestrateur.html:540,566,596-599` ; `DEPLOIEMENT.md:86` | Pas de vraies RP avant Phase B ; éviter de persister des RP en local ; expiration/déconnexion. |
| Faible | **Pas de validation de longueur** (commentaire, identité, titre projet, nom ville) côté client ni schéma → payloads volumineux. | `:586`, `:591` ; `schema.sql:24-27,38` | Borner (client + Edge Function + `check`/`varchar`). |
| Info | **Préfixe de code non fiable** : `genCode` produit `SAI-…` (pas `STH-…` comme l'illustre le schéma) et génère des **collisions** (Boisbriand/Bois-des-Filion → `BOI` ; Sainte-Thérèse/Sainte-Anne-des-Plaines → `SAI`). | `orchestrateur.html:543-544` ; `schema.sql:21` | Aligner doc/code ; le préfixe n'est pas un secret. |
| Info | **Incohérence soft/hard delete** : schéma prévoit `deleted_at` (douce) mais le client fait un **hard delete** ; `access_codes`/`responses` sans soft-delete. | `schema.sql:16` vs `orchestrateur.html:574-580,587` | Réconcilier en Phase B (archive serveur + traçabilité de l'effacement). |
| Info | **`console.log(md)` en repli de copie** (pas de RP en principe). | `orchestrateur.html:1059` | Retirer en prod. |

### Déjà solide (Revue B)
- **Échappement XSS systématique** : `esc()` appliqué à **toutes** les données utilisateur rendues (commentaires, identités, noms de villes, titres de projet, labels d'annotation), y compris dans les attributs `title=`/`data-*`. Aucun `innerHTML` non échappé trouvé.
- **RLS deny-by-default** : activée sur les 3 tables ; **aucune policy `anon`** → accès direct de la page publique refusé.
- **`service_role` isolé** : jamais dans le frontend (rappelé deux fois) ; `anon key` correctement identifiée comme publique.
- **Filet d'intégrité DB** : `check (cote in (-1,0,1))` valide côté serveur, indépendamment du client.
- **Résidence/Loi 25** : Supabase Canada + frontend cPanel sans RP — raisonnement correct.
- **Comptes admin** : inscriptions désactivées + création manuelle + 2FA recommandée.
- **Bonnes pratiques de code** : `"use strict"`, messages de login génériques, `try/catch` silencieux qui ne fuit pas, unicité des codes garantie, préfixe sans accent.

---

## 5. Revue C — Bonnes pratiques de développement logiciel

### Synthèse
Pour un prototype assumé écrit par un non-développeur « en construisant l'avion en vol », la qualité est **nettement au-dessus de la moyenne** : intentions documentées, couture `store` réelle, règles déterministes (`apprec`/`reco`) centralisées et pures, échappement HTML systématique, amorçage/migration des données prévus. La **dette technique dominante n'est pas dans le code mais autour** : absence totale de contrôle de version sur un fichier unique qui vit dans OneDrive (risque réel), couture de persistance **synchrone** incompatible telle quelle avec un Supabase asynchrone, et trois artefacts (client / `schema.sql` / `DEPLOIEMENT.md`) qui **divergent sur le soft/hard delete**. Le cœur métier est *parfaitement testable en théorie* mais *intestable en pratique* (tout est inline). **Handoff : prêt à être lu et compris par un dev ; pas à être repris/étendu sans une passe « mise en dépôt + extraction du moteur ».**

### Constats

| Sévérité | Constat | Emplacement | Recommandation |
|---|---|---|---|
| Critique | **Aucun contrôle de version** (`git rev-parse` → « PAS un dépôt git »). Pas d'historique, pas de branches, **aucune revue par diff**, et le source vit dans **OneDrive** (sync auto + conflits « …-PC-de-Vincent » = corruption silencieuse possible). Le versionnage manuel (`old/`, `déploiement_révision_1.md`) est fragile. | dossier `Appli/` | `git init` **immédiatement**, commit de l'état courant, push sur dépôt **privé GitHub**. Prérequis #1 du handoff : sans historique, le dev part aveugle. |
| Élevé | **Mot de passe admin en clair** : `if(v==='Corda$2026')`, visible par quiconque ouvre le source de la page publique → accès admin complet. | `orchestrateur.html:696` | OK pour démo locale à Fanny ; **inacceptable dès une donnée réelle** (déjà prévu : vrai compte Supabase en B). À documenter comme bloquant. |
| Élevé | **La couture `store` est synchrone et fuit son implémentation.** (1) `get/setResponse` lisent/écrivent en mémoire **synchrone**, appelés **en boucles serrées** (`villeCote`/`renderPortrait`) → incompatible avec des Edge Functions **réseau (asynchrones)**. (2) Le format de clé `rid\|m\|c` **fuit** : `deleteProject`/`deleteCode` font un `split` sur la clé dans la logique métier. | `store` `:550-592` ; fuite `:576,578,587` ; clé `:589` | La bascule Supabase **n'est pas** un simple swap de `store`. Pré-charger les réponses d'un répondant en mémoire (garder l'interface sync + flush) **ou** rendre les appelants async ; **encapsuler** la clé. À crédit : la couture *existe*, c'est sa granularité à revoir. |
| Élevé | **Sauvegarde silencieuse + UI optimiste = perte de données invisible.** `_save()`/`_load()` avalent toute exception (`catch(e){}`) et « Enregistré ✓ » s'affiche **sans vérifier** le succès. Quota localStorage atteint ou JSON corrompu → l'utilisateur croit avoir sauvegardé, rien n'est gardé. | `:554`, `:566` ; flag `:828` | Remonter l'échec (toast d'erreur) au lieu de l'avaler ; le « ✓ » seulement après écriture réussie. |
| Moyen | **Incohérence soft/hard delete entre les 3 artefacts** : `DEPLOIEMENT.md` promet « ne jamais détruire » ; `schema.sql` ne met `deleted_at` que sur `projects` (`access_codes`/`responses` en `cascade` = hard) ; le **client** fait du **hard delete**. | `DEPLOIEMENT.md:23` ; `schema.sql:16,22,33-41` ; client `:574-580,587` | Trancher **une** politique de suppression et l'aligner partout. |
| Moyen | **Cœur métier intestable en isolation** : `apprec`/`reco`/agrégation sont **purs et déterministes** (cas d'école pour des tests) mais inline, sans `export`, sans harnais. | `:519-537`, `:605-615` | Extraire dans un `rules.js` exporté + une petite suite (Vitest/Jest). Module où un bug coûte le plus cher. |
| Moyen | **Branche morte dans `reco()`** : les deux dernières branches retournent `'etude'` (la condition `(fav>=2 && pf===1)` ou `allN` est inutile). Symptôme d'une table de décision pas parfaitement spécifiée. | `:535-536` | Un test unitaire l'exposerait. Clarifier la règle et la documenter **en prose**. |
| Moyen | **Duplication de la règle de majorité MRC** (et de la reco par ville) : écrite **deux fois** (inline dans `renderPortrait` + `mrcMaj` dans `exportExcel`) → risque de dérive. | `:849` vs `:974` | Factoriser dans une fonction unique réutilisée par l'affichage **et** l'export. |
| Moyen | **Déploiement 100 % manuel, non reproductible** : upload → renommer `index.html` → re-uploader en C. Pas de build, pas de CI, pas de staging/prod, **pas de rollback** (fichier non versionné), secrets à la main. | `DEPLOIEMENT.md:42-45, 88` | OK pour aller vite ; mais versionner le HTML et viser un **déploiement scripté** (rsync/FTP ou GitHub Action) pour un « dernier bon état » récupérable. |
| Moyen | **État global mutable `VILLES`** réassigné via `syncVilles()` → **couplage temporel fragile** (toute fonction lisant `VILLES`, ex. `genCode`, dépend d'un appel au bon moment). | `:387`, `:593` | À terme, dériver les villes du projet actif **à la demande** (ou les passer en paramètre). Géré en prototype, piège classique à signaler. |
| Moyen | **ExcelJS sans intégrité (SRI)** (version épinglée 4.4.0 — bien) : un CDN compromis exécuterait du code arbitraire. | `:382` (garde `:965`) | Ajouter `integrity` + `crossorigin`. À crédit : dégrade proprement si absent (`if(!window.ExcelJS)`). |
| Faible | `esc()` n'échappe **pas** `'`. Latent (attributs en doubles quotes aujourd'hui) mais un futur attribut en simple quote avec une valeur utilisateur deviendrait une faille. | `:603` | Ajouter `'`→`&#39;` (coût nul). |
| Faible | **Re-render complet** de la liste des mesures à chaque cote (37 boutons × 22 lectures). OK à cette échelle ; les textareas ne sont pas re-rendues (focus préservé). | `:801,821-827` | À surveiller si la grille grandit ; ne pas optimiser prématurément. |
| Faible | **Chaînes magiques** non centralisées (ids d'écran, id projet `tdb`, format de clé, code admin). | `:636,696`, `SCREEN_OF` | Regrouper en constantes nommées en tête de fichier. |
| Faible | **Intégrité référentielle ville non contrainte** (`access_codes.ville` = texte libre vers un id du `villes` jsonb ; aucune FK) ; pas de trigger pour `responses.updated_at`. | `schema.sql:14,26,39` | Pragmatique en prototype (à documenter) ; normalisation (table `villes`) + trigger = avant vrai produit. |
| Faible | **Session persistée en localStorage** (`role`/`ville`/`respondentId`) → reconnexion auto sans vraie auth. | `:598-599,1133-1134` | Normal en prototype ; session Supabase en B. |
| Info | **Documentation & handoff réellement présents** (commentaires d'intention, sources des règles citées, runbook, handoff `.md`). **Manque** un dictionnaire de données (localStorage ↔ `schema.sql`) et une **spec en prose** des règles `apprec`/`reco`. | global | Ajouter une demi-page : modèle de données + table de décision en prose — ce qui manquera le plus au dev/analyste. |

### Déjà sain (Revue C)
- **Le fichier unique est un choix défendable**, pas un défaut, à ce stade : zéro build, déploiement trivial, un seul artefact pour le dev ; les seams d'extraction futurs (données→DB, règles→module, store→adaptateur, UI jetable) sont déjà conceptuellement en place.
- **La couture `store` existe et est nommée** — bon instinct architectural ; c'est sa granularité (sync) à affiner, pas son principe.
- **Règles métier pures et centralisées** (`apprec`/`reco`), prêtes à extraire et tester.
- **Échappement HTML systématique** (`esc()`) — rare dans un prototype de non-dev.
- **Dégradations gracieuses** (garde `if(!window.ExcelJS)`, fallbacks de polices, repli `execCommand('copy')`).
- **Version ExcelJS épinglée** (4.4.0) — il ne manque que le SRI.
- **Amorçage + migration de données prévus** (projet `tdb` semé, migration `if(!c.project)`, archive avant suppression).
- **`schema.sql` soigné et pédagogique** (RLS par défaut, `anon` sans accès, avertissements `service_role`).
- **`DEPLOIEMENT.md` = excellent runbook** pour son public (archi justifiée, checklist sécurité, coûts).
- **Accessibilité correcte** (`aria-pressed`, `aria-label`, `:focus-visible`, `title` informatifs).

---

## 6. Note de cadrage (commune)

En l'état **prototype localStorage**, **aucun** de ces constats n'expose en ligne les RP d'autrui (tout est local au navigateur). Les sévérités « Élevé/Moyen » se matérialisent **à la bascule Phase B** (Supabase + Edge Functions + mise en ligne). L'intérêt de cette révision est donc de **traiter ces points pendant la conception du backend**, avant d'écrire le code serveur et avant toute collecte de données réelles — c'est le bon moment, et le coût de correction y est minimal.

---
*Révision 1 — produite par trois réviseurs indépendants (normes de l'administration publique + sécurité applicative + bonnes pratiques de développement), consolidée par Claude Code. Prochaine étape suggérée : transformer la section 2 (« Priorités avant déploiement ») en plan d'action daté, et décider lesquels sont des prérequis Phase A (vitrine) vs Phase B/C (backend). Le point Fondation 0 (mise sous Git) est le premier à régler — il débloque aussi la revue par diff du dev.*
