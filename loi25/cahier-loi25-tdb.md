# Cahier Loi 25 — Orchestrateur (mandat MRC Thérèse-De Blainville)

**Corda · Écofiscalité — juillet 2026 (brouillons de travail, pour validation en rencontre d'équipe)**

Six documents : la table des variables, la politique de confidentialité, l'avis de
consentement (déjà en service dans l'outil), l'EFVP courte, la trame d'entente
d'encadrement (à réviser par juriste) et les procédures (droits, incidents). Les
marques ⏳ = décisions D1/D2 du dossier de validation, à confirmer en séance.

---

# Variables client — bibliothèque de conformité Corda

> Les six gabarits de ce dossier sont **réutilisables** pour tout mandat Corda : les
> valeurs propres au client sont des variables `{{…}}`. Ce fichier est la **table
> maîtresse** — remplir ici, reporter partout. Les valeurs ⏳ sont **en attente d'une
> décision** (référence : `docs/dossier-validation-fanny.md`, section D).

| Variable | Valeur — mandat MRC Thérèse-De Blainville | Statut |
|---|---|---|
| `{{PROJET}}` | Stratégie écofiscale de soutien à la transition climatique, MRC de Thérèse-De Blainville | ✔ nom officiel, fixé par Fanny le 6 août 2026 |
| `{{OUTIL}}` | Orchestrateur (ecofisc.corda.consulting), un produit Corda | ✔ |
| `{{CHERCHEURE}}` | Pre Fanny Tremblay-Racicot, ENAP / CERGO — chercheure responsable du mandat | ✔ |
| `{{MANDANT}}` | MRC Thérèse-De Blainville | ✔ à confirmer (signataire exact) |
| `{{FOURNISSEUR}}` | Corda (Vincent Duguay) — conception, exploitation et propriété de l'outil | ✔ |
| `{{RESPONSABLE_RP}}` | Vincent Duguay (Corda) — **proposition** (décision D2) | ⏳ D2 |
| `{{COURRIEL_RP}}` | vincent.duguay@enap.ca | ✔ |
| `{{DUREE_CONSERVATION}}` | Durée du mandat + 3 ans — **proposition** (décision D1) | ⏳ D1 |
| `{{HEBERGEUR_DONNEES}}` | Supabase (région Canada Central — Ontario, infrastructure AWS ca-central-1) | ✔ |
| `{{HEBERGEUR_PAGE}}` | Namecheap / cPanel (sert la page publique — aucune donnée personnelle) | ✔ |
| `{{DATE_MISE_EN_SERVICE}}` | ⏳ au go-live réel (cercle fermé) | ⏳ |

**Rappels d'architecture (vrais pour tout client, à ne pas re-décider) :**
- Les renseignements personnels vivent **exclusivement** chez `{{HEBERGEUR_DONNEES}}` ;
  la page publique n'en contient aucun.
- La suppression d'un code d'accès **détruit réellement** ses réponses (cascade) ;
  l'archivage d'un projet est temporaire, la destruction survient à l'échéance de
  conservation (`purge_expired`, schema.sql).
- L'analyse des commentaires par un outil d'IA est **interdite par défaut** (décision D5).


---

# Politique de confidentialité — {{OUTIL}}

*Version 1.0 (brouillon) · {{PROJET}} · Dernière mise à jour : juillet 2026*
*(Gabarit Corda — publier sur le site de l'outil ; art. 63.4 de la Loi sur l'accès pour
les organismes publics, art. 3.2 LPRPSP pour l'entreprise privée — la Loi 25 exige une
politique publiée en termes simples et clairs.)*

---

## 1. Qui est responsable de vos renseignements

Le responsable de la protection des renseignements personnels pour cet outil est
**{{RESPONSABLE_RP}}** — joignable à **{{COURRIEL_RP}}**. L'outil est conçu et exploité
par {{FOURNISSEUR}} dans le cadre du mandat de recherche « {{PROJET}} », dirigé par
{{CHERCHEURE}}.

## 2. Ce que nous recueillons — et rien de plus

| Renseignement | Pourquoi |
|---|---|
| Prénom, nom, fonction | Rattacher vos cotations à votre municipalité et à votre rôle |
| Vos cotations (+1 / 0 / −1) et commentaires libres | La matière même de l'analyse multicritère |
| Horodatages (consentement, connexions) et journal des accès | Sécurité et obligations légales (traçabilité) |

Nous ne recueillons **ni courriel, ni téléphone, ni adresse, ni témoin (cookie) de
suivi**. La connexion se fait par un code d'accès personnel remis par l'équipe du mandat.

## 3. Qui y a accès

L'équipe du mandat de recherche ({{CHERCHEURE}} et {{FOURNISSEUR}}) — personne d'autre.
Les résultats sont diffusés sous forme **agrégée par municipalité** ; aucune diffusion
nominative. Vos commentaires ne sont pas analysés par des outils d'intelligence
artificielle.

## 4. Où vivent vos renseignements

Dans une base de données hébergée au **Canada** ({{HEBERGEUR_DONNEES}}), verrouillée par
défaut : chiffrement en transit et au repos, accès par privilèges minimaux, journal des
accès, protection contre les essais de codes répétés. La page web publique
({{HEBERGEUR_PAGE}}) ne contient ni ne conserve aucun renseignement personnel. Le
fournisseur d'hébergement de la base est une entreprise établie hors Québec : cette
communication fait l'objet d'une évaluation écrite (art. 17) résumée dans notre
évaluation des facteurs relatifs à la vie privée, disponible sur demande.

## 5. Combien de temps

Vos renseignements sont conservés pour la durée suivante : **{{DUREE_CONSERVATION}}**,
puis **réellement détruits** (pas simplement archivés).

## 6. Vos droits

Vous pouvez en tout temps demander l'**accès** à vos renseignements, leur
**rectification** ou leur **retrait** (vos réponses sont alors détruites). Écrivez à
{{COURRIEL_RP}} — réponse dans un délai maximal de 30 jours. Si vous êtes insatisfait de
la réponse, vous pouvez vous adresser à la **Commission d'accès à l'information du
Québec** (cai.gouv.qc.ca).

## 7. En cas d'incident

Tout incident de confidentialité est consigné à un registre ; s'il présente un risque de
préjudice sérieux, les personnes concernées et la Commission d'accès à l'information en
sont avisées sans délai.


---

# Avis de collecte et consentement — {{OUTIL}}

*(Gabarit Corda — texte affiché DANS l'outil à la première connexion, avant toute
saisie d'identité. Art. 8 : informer de la finalité, des moyens, des droits, AVANT ou
AU MOMENT de la collecte. Le consentement est bloquant et horodaté en base
(`access_codes.consent_at`). CE FICHIER EST LA SOURCE : toute modification doit être
reportée mot pour mot dans l'application.)*

---

## Texte affiché (encadré « Avis de collecte — renseignements personnels »)

> Vos prénom, nom et fonction servent uniquement à rattacher vos cotations à votre
> ville dans le cadre du mandat d'analyse écofiscale « **{{PROJET}}** » (ENAP/CERGO).
> L'accès est restreint à l'équipe de recherche ; aucune diffusion nominative. Vous
> pouvez en tout temps demander l'accès à vos renseignements, leur rectification ou
> leur retrait auprès de l'équipe du mandat. [Politique de confidentialité](politique.html)

**Case à cocher (obligatoire) :** « J'ai lu l'avis et je consens à la collecte de ces
renseignements. »

## Caractéristiques du consentement (exigences remplies)

| Exigence | Mise en œuvre |
|---|---|
| Manifeste, libre, éclairé | Case non pré-cochée, bloquante ; avis affiché avant la saisie |
| Fins spécifiques | Une seule finalité énoncée (rattacher les cotations à la ville, mandat nommé) |
| Preuve | Horodatage `consent_at` inscrit côté serveur au moment précis du consentement |
| Retrait possible | Procédure des droits (document 05) — la suppression du code détruit les réponses |
| Termes simples et clairs | Texte court, sans jargon, lien vers la politique complète |

## Notes d'implantation

- Le titre du projet est **injecté dynamiquement** (`{{PROJET}}` = titre du projet
  auquel le code appartient) — le même texte sert donc à tous les mandats.
- Le contenu de l'outil (questions, mesures) n'est livré **qu'après** ce consentement.


---

# Évaluation des facteurs relatifs à la vie privée (EFVP) — {{OUTIL}}

*Version 1.0 (brouillon) · {{PROJET}} · Juillet 2026*
*(Gabarit Corda — EFVP « courte », proportionnée à la sensibilité du système
(art. 3.3 : EFVP proportionnée ; art. 17 : évaluation écrite avant communication hors
Québec). Rédigée d'après l'inventaire réel des données — `docs/dictionnaire-donnees.md`
et `deploiement/schema.sql` font foi.)*

---

## 1. Description du système

{{OUTIL}} numérise la grille d'analyse multicritère de {{CHERCHEURE}} : des
représentants municipaux désignés cotent 36 mesures écofiscales sur 23 critères ;
l'outil calcule les recommandations et le portrait régional. Accès par **code personnel**
remis par l'équipe du mandat (aucune inscription publique) ; administration par comptes
nominatifs. Le contenu et les calculs sont servis par le serveur **après
authentification** ; la page publique ne contient aucun renseignement.

## 2. Inventaire des renseignements personnels

| Donnée | Table | Sensibilité | Minimisation |
|---|---|---|---|
| Prénom, nom, fonction | `access_codes` | Identité **professionnelle** (contexte public municipal) | Aucun autre identifiant (ni courriel, ni téléphone) |
| Cotations (+1/0/−1) | `responses` | Opinions professionnelles — faible seule, **ré-identifiable** en petit groupe (N≈7 villes) | Diffusion agrégée par ville uniquement |
| Commentaires libres | `responses.comment` | **La zone la plus sensible** : peut contenir des renseignements sur des tiers | Analyse par IA interdite par défaut (D5) ; détachement des identités avant toute analyse externe |
| Consentement, connexions | `access_codes.consent_at`, `audit_log` | Traçabilité | Le journal ne contient jamais le contenu des réponses |
| Tentatives de connexion | `login_attempts` | Anti-force-brute | **Empreinte hachée** de l'origine — jamais l'adresse IP en clair |

## 3. Mesures de protection en place

Base **verrouillée par défaut** (RLS : le rôle public n'a aucun accès) · chiffrement en
transit (HTTPS/TLS) et au repos · villes limitées à **leurs propres** réponses via
fonctions serveur validant chaque écriture (liste blanche des champs, bornage) ·
verrouillage après 8 tentatives/15 min · comptes admin nominatifs, inscriptions
publiques désactivées · journal des accès (connexions, lectures, exports) · page
publique sans contenu ni donnée (en-têtes de sécurité CSP, anti-hameçonnage par iframe
interdit) · destruction réelle : suppression d'un code = cascade sur ses réponses ;
purge des projets archivés à l'échéance `{{DUREE_CONSERVATION}}`.

## 4. Communication hors Québec (art. 17) — évaluation écrite

| Fait | Analyse |
|---|---|
| La base réside chez {{HEBERGEUR_DONNEES}} : région « Canada Central » = **Ontario**, donc **hors Québec** (mais au Canada, régime fédéral LPRPDE) | Communication hors Québec au sens de l'art. 17 → la présente évaluation en tient lieu |
| Supabase Inc. est une société **américaine** (sous-traitant infonuagique ; infrastructure AWS ca-central-1) | Encadrement contractuel : conditions de service et addenda de traitement des données (DPA) de Supabase, clauses contractuelles types ; chiffrement au repos |
| Les **fonctions serveur** (calculs) s'exécutent sur un réseau distribué — un traitement **transitoire** peut survenir hors Canada | ⏳ **Point ouvert** : épinglage régional des fonctions possible si l'équipe l'exige ; les données au repos, elles, ne quittent pas ca-central-1 |
| Sensibilité globale : identités professionnelles + opinions dans un contexte municipal public | **Faible à modérée** — pas de renseignements financiers, de santé ni de mineurs |

**Conclusion (proposée)** : les renseignements bénéficient d'une protection adéquate,
équivalente aux principes de la loi québécoise, compte tenu de leur sensibilité, des
mesures techniques et de l'encadrement contractuel. À réévaluer si la nature des données
change (ex. données financières du calculateur d'impact).

## 5. Décisions rattachées et suivi

| # | Décision | Statut |
|---|---|---|
| D1 | Durée de conservation : {{DUREE_CONSERVATION}} | ⏳ à confirmer |
| D2 | Responsable RP : {{RESPONSABLE_RP}} | ⏳ à confirmer |
| D5 | Interdiction par défaut d'analyse des commentaires par IA | ✔ inscrite |
| — | Épinglage régional des fonctions serveur | ⏳ à discuter |

*Réévaluation de la présente EFVP : à chaque ajout de fonctionnalité traitant des RP
(orchestrateur de compromis, calculateur d'impact) ou changement de sous-traitant.*


---

# Entente d'encadrement des renseignements personnels — {{PROJET}}

*TRAME (brouillon de travail) — ⚠ à faire réviser par un conseiller juridique avant
signature. Gabarit Corda : structure et contenu factuel exacts, formulations à valider.*

**Entre :** {{CHERCHEURE}}, ci-après « la Chercheure » (responsable du mandat de
recherche) ; **et** {{MANDANT}}, ci-après « le Mandant ».
**Intervenant :** {{FOURNISSEUR}}, ci-après « le Fournisseur » — conçoit et exploite
l'outil {{OUTIL}} pour les fins du mandat.

*(Assise : art. 67.2 de la Loi sur l'accès — un organisme public qui confie des
renseignements personnels à un tiers dans le cadre d'un mandat doit l'encadrer par
écrit : finalité, confidentialité, sécurité, destruction.)*

---

## 1. Objet et finalité
La collecte et l'utilisation de renseignements personnels de représentants municipaux
(prénom, nom, fonction, cotations, commentaires) **aux seules fins** de l'analyse
multicritère des mesures écofiscales prévue au mandat « {{PROJET}} ». Toute autre
utilisation exige une entente distincte.

## 2. Rôles et responsabilités
- **La Chercheure** dirige le mandat, décide des finalités scientifiques et de la
  diffusion des résultats (agrégés, non nominatifs).
- **Le Fournisseur** exploite l'outil, applique les mesures de sécurité décrites à
  l'EFVP (document 03), tient le journal des accès et le registre des incidents.
- **Responsable de la protection des RP** pour l'outil : {{RESPONSABLE_RP}}
  ({{COURRIEL_RP}}).
- **Le Mandant** désigne les répondants municipaux et relaie la présente entente à ses
  villes membres, le cas échéant.

## 3. Sous-traitants et localisation
Base de données : {{HEBERGEUR_DONNEES}} (hors Québec — évaluation art. 17 à l'EFVP).
Page publique : {{HEBERGEUR_PAGE}} (aucune donnée personnelle). Tout nouveau
sous-traitant traitant des RP sera notifié à la Chercheure et au Mandant.

## 4. Sécurité et confidentialité
Mesures détaillées à l'EFVP (chiffrement, base verrouillée, accès minimaux, journal,
anti-force-brute). L'accès nominatif est restreint à l'équipe du mandat. **Aucune analyse
des commentaires par un outil d'intelligence artificielle** sans décision écrite
contraire (pseudonymisation et évaluation préalables exigées).

## 5. Conservation, destruction, réversibilité
Conservation : **{{DUREE_CONSERVATION}}**, puis destruction réelle (procédure
documentée ; la suppression d'un répondant détruit ses réponses immédiatement sur
demande). **Réversibilité** : sur demande du Mandant ou de la Chercheure, le Fournisseur
remet une exportation complète des données du projet dans un format ouvert (Excel/CSV),
puis procède à la destruction attestée.

## 6. Incidents
Tout incident de confidentialité est consigné au registre (document 06) ; s'il présente
un risque de préjudice sérieux, notification sans délai à la Chercheure, au Mandant, aux
personnes concernées et à la Commission d'accès à l'information.

## 7. Propriété intellectuelle et marque
- La **grille d'analyse multicritère** (dimensions, critères, règles) demeure l'œuvre
  scientifique de **Fanny Tremblay-Racicot et Jérôme Couture**, dûment créditée dans
  l'outil et ses exports.
- Le **logiciel** {{OUTIL}} (code, interface, architecture, marque Corda) demeure la
  **propriété exclusive du Fournisseur**. La présente entente ne confère au Mandant
  qu'un droit d'usage pour la durée du mandat.
- Les **données de cotation** appartiennent au mandat de recherche ; leur diffusion suit
  les règles de la section 1.

## 8. Durée et fin
De la signature jusqu'à la fin du mandat + la période de conservation. À l'échéance :
destruction attestée (art. 5). Les articles 6 et 7 survivent à l'entente.

---

| Signatures | |
|---|---|
| La Chercheure — {{CHERCHEURE}} | Date : |
| Le Mandant — {{MANDANT}} (représentant autorisé) | Date : |
| Le Fournisseur — {{FOURNISSEUR}} | Date : |

*⏳ À trancher avant signature : qui signe pour le Mandant (MRC seule, ou chaque ville) ;
statut exact ENAP/CERGO dans l'entente (employeur de la Chercheure vs partie).*


---

# Procédure des droits d'accès, de rectification et de retrait — {{OUTIL}}

*(Gabarit Corda — répond au constat « organismes non outillés » de la révision : une
procédure simple, documentée, affichée dans la politique. Le point d'entrée est un
courriel au responsable ; le traitement technique est déjà câblé dans l'outil.)*

---

## Pour la personne concernée (ce que dit la politique)

Écrire à **{{COURRIEL_RP}}** en précisant votre nom et votre municipalité. Réponse dans
un délai maximal de **30 jours**. Recours possible auprès de la Commission d'accès à
l'information (cai.gouv.qc.ca) en cas d'insatisfaction.

## Pour l'équipe du mandat (traitement interne)

| Étape | Quoi faire | Outillage |
|---|---|---|
| 1. Réception | Consigner la demande (date, personne, nature) au registre ci-dessous | Registre des demandes (bas de page) |
| 2. Vérification d'identité | Confirmer que le demandeur est bien le répondant : recouper prénom/nom/fonction/ville avec le code d'accès ; au besoin, valider par la direction générale de sa municipalité | Écran admin « Accès » |
| 3a. **Accès** | Exporter ses réponses : écran « Réponses » (sélectionner le répondant) → copie PDF/impression, ou extraction Excel | App (admin) |
| 3b. **Rectification** | Identité (prénom/nom/fonction) : correction en base par l'admin. Cotations : la personne se reconnecte avec son code et modifie elle-même | App + SQL au besoin |
| 3c. **Retrait** | Écran « Accès » → **Supprimer le code** → destruction RÉELLE et immédiate de l'identité ET de toutes ses réponses (cascade en base) | App (admin) |
| 4. Confirmation | Répondre par écrit à la personne (dans les 30 jours) ; consigner la clôture au registre | — |

**Notes.** Le retrait est irréversible et gratuit. Si la personne souhaite ensuite
recontribuer, un nouveau code est émis. Les données déjà **agrégées et diffusées**
(portraits par ville) ne sont pas rétroactivement modifiables — le mentionner dans la
réponse, conformément à la politique.

## Registre des demandes

| Date | Personne (ville) | Nature (accès/rectif/retrait) | Traitée le | Par | Notes |
|---|---|---|---|---|---|
| | | | | | |


---

# Registre des incidents de confidentialité — {{OUTIL}}

*(Gabarit Corda — la Loi 25 oblige à tenir un registre de TOUT incident de
confidentialité : accès, utilisation, communication ou perte non autorisés de
renseignements personnels — même mineur, même sans préjudice. Si un incident présente
un **risque de préjudice sérieux** : aviser sans délai la Commission d'accès à
l'information ET les personnes concernées.)*

**Tenu par :** {{RESPONSABLE_RP}} ({{COURRIEL_RP}}) · Conservation du registre : 5 ans
minimum après chaque incident.

---

## Grille d'évaluation rapide (à chaque incident)

1. **Quoi** : quels renseignements, combien de personnes, quelle cause (erreur, faille,
   perte d'appareil, hameçonnage…) ?
2. **Risque de préjudice sérieux ?** Sensibilité des renseignements × probabilité
   d'utilisation malveillante × gravité des conséquences. *(Repère pour cet outil :
   identités professionnelles + cotations = risque généralement faible ; commentaires
   libres = à évaluer cas par cas.)*
3. **Si oui** → notification CAI + personnes concernées **sans délai** ; mesures pour
   réduire le risque.
4. **Dans tous les cas** → consigner ci-dessous + mesure corrective.

## Registre

| # | Date de l'incident | Découvert le | Description (quoi, qui, combien) | Risque sérieux ? | CAI avisée | Personnes avisées | Mesures correctives | Clos le |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |
