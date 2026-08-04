# Descriptions des mesures — document de révision

**Généré par** `node tools/descriptions.js --to-md` · **36 des 36 mesures** ont une description.

> [!important] Ce document est la copie révisable de ce que le site sert aux villes.
> Corrige librement le texte sous chaque **Description**. Ne touche pas aux titres `### mXX`,
> ce sont eux qui permettent la réinjection automatique. Renvoie-moi le fichier :
> `node tools/descriptions.js --from-md` le réécrit dans le code, sans recopiage à la main.

## D'où le site tire ses descriptions

```
  Fiches Mascouche + Gatineau (2025, dir. F. Tremblay-Racicot)   ← documents sources
        │  condensées en 1-3 phrases, exemples chiffrés génériqués
        ▼
  rules.js  →  const DESCRIPTIONS = { m01: "…", … }              ← SOURCE UNIQUE (dépôt)
        │  node tools/gen-edge-functions.js  (compile le catalogue)
        ▼
  deploiement/edge/{ville-claim, ville-set, admin-data}.ts        ← copies compilées
        │  Vincent colle les 3 fonctions dans Supabase
        ▼
  Edge Function Supabase  →  catalogue()  →  { descriptions }     ← ce que le SERVEUR détient
        │  livré APRÈS authentification seulement (« coffre-fort »)
        ▼
  ecofisc.corda.consulting  →  descHTML()  →  écran de cotation   ← ce que la ville LIT
```

La page publique ne contient **aucune** description : elle les reçoit du serveur une fois le code validé.
Une mesure sans description affiche « Description à venir. » à l'écran.

**Conséquence à retenir :** corriger `rules.js` ne suffit pas. Tant que les 3 Edge Functions ne sont pas
recollées dans Supabase, le site en ligne continue de servir les anciennes descriptions.

## Les 11 absences comblées — rédigées le 3 août 2026, à valider

| Situation | Mesures | Matière première disponible |
|---|---|---|
| Fiche de cotation au V3, **mais aucune fiche descriptive** | m07, m13, m17, m25, m33, m35, m37 | le libellé, le pouvoir habilitant, les cotes de Jérôme — pas de prose |
| **Aucune trace nulle part** (ni description, ni cotation) | m11, m16, m20, m23 | rien : m23 (démolition) a même été ajoutée hors corpus V3 |

Ni les fiches Mascouche/Gatineau, ni les fiches du classeur V3 (qui ne contiennent que des cotes) ne couvraient ces 11 mesures :
il n'y avait **rien à extraire**. Elles ont donc été **rédigées par Corda** le 3 août 2026 — mécanisme, assiette et finalité,
dans le même format que les 25 autres — à partir du pouvoir habilitant inscrit au V3 et de la pratique municipale québécoise.

> [!warning] Ces 11 descriptions n'ont **aucune caution scientifique** tant que Fanny ou Jérôme ne les a pas relues.
> Elles sont repérables ci-dessous à la mention ✍️ **rédigée par Corda**. Corrigez-les directement dans ce document :
> `node tools/publier.js` les remet en production. Les descriptions issues des fiches Mascouche/Gatineau, elles, sont sourcées.

> [!info] Révision de Vincent, 4 août 2026 — trois changements de **structure**, pas seulement de texte :
> **m27** (« Redevance à l'égard de la performance énergétique des bâtiments ») est **retirée** du catalogue,
> **fusionnée dans m25** dont l'objet s'élargit aux immeubles et à la performance énergétique. L'identifiant m27
> n'est pas réattribué et rien n'est renuméroté (les réponses en base sont indexées par `mXX`).
> **m07, m23, m37** ont été renommées. ⚠️ Point à trancher avec Jérôme : les cotes du V3 pour m25 portaient sur
> les seules émissions industrielles — restent-elles valides pour la mesure élargie ?

---

## Fiscalité foncière et assiette

### m01 · Sous-catégorie - nombre de logements

**en ligne** · source : Mascouche, fiche 10 « Taux variés par sous-catégories résidentielles » (+ fiche 8, condominiums) · aussi couverte par Gatineau, fiches 2, 3 et 5

**Description**

Modulation du taux de taxe foncière selon le nombre de logements et la typologie, via des sous-catégories d'immeubles résidentiels (unifamilial, 2 logements, 3-5, 6-9, 10-49, 50+, habitations en commun, condominiums).

### m02 · Sous-catégorie - CUBF

**en ligne** · source : Mascouche, fiches 3 (CUBF de nuisance) et 4 (CUBF à bénéfices environnementaux / économie circulaire) · aussi couverte par Gatineau, fiches 7 et 8

**Description**

Taux de taxe foncière distincts pour les immeubles commerciaux/industriels selon le code d'utilisation des biens-fonds (CUBF) : soit pour les industries polluantes (aliments/boissons, minéraux, pétrole, chimie, transport…), soit pour les entreprises d'économie circulaire (recyclage, récupération, vente d'occasion, compostage).

### m03 · Sous-catégorie - secteurs

**en ligne** · source : Mascouche, fiches 1 (unités de voisinage) et 2 (cinq secteurs d'imposition) · aussi couverte par Gatineau, fiche 1

**Description**

Régime d'impôt foncier à taux variés modulés selon les secteurs d'imposition définis (p. ex. central, TOD, excentré, rural), avec des taux de base sectoriels respectant un écart maximal de 33,3 % par rapport au taux uniformisé.

### m04 · Taux varié par tranche de valeur (non résidentiels)

**en ligne** · source : Mascouche, fiche 5 « Sous-catégories de taxation par tranche de valeur (non résidentiels) »

**Description**

Régime d'impôt foncier à taux variés par tranche de valeur pour les immeubles non résidentiels (p. ex. < 1 M$, 1-2 M$, 2 M$ et plus). Un second taux peut s'appliquer, sans excéder 133,3 % du premier.

### m05 · Taux varié terrain vague desservi

**en ligne** · source : Mascouche, fiche 11 « Taux varié pour les terrains vagues desservis » · aussi couverte par Gatineau, fiche 10

**Description**

Taxe pouvant atteindre quatre fois le taux de base (résidentiel) sur les terrains vagues desservis par l'aqueduc et l'égout sanitaire, afin de récupérer des revenus, accroître la densification et limiter la spéculation foncière.

### m06 · Taxe logements vacants (résidentiel)

**en ligne** · source : Mascouche, fiche 12 « Taxe à l'égard des logements vacants » · aussi couverte par Gatineau, fiche 6

**Description**

Prélèvement sur la valeur foncière des immeubles comportant un logement vacant ou sous-utilisé, avec un taux maximal progressif (p. ex. 1 % la 1re année, 2 % la 2e, 3 % la 3e).

### m07 · Taxe sur les immeubles non-résidentiels vacants

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme** · pouvoir habilitant (V3) : PGT

**Description**

Application du pouvoir général de taxation aux immeubles non-résidentiels vacants. L'assiette de cette taxe est la superficie des immeubles concernés et non leur valeur foncière.

### m08 · Taxe sur les terres à vocation agricole exploitables mais non exploitées

**en ligne** · source : Gatineau, fiche 9 « Taxe sur les terres à vocation agricole exploitables mais non exploitées » · pouvoir habilitant (V3) : LFM

**Description**

Taxe ou redevance visant les terres à vocation agricole exploitables mais non exploitées, pour décourager la spéculation et encourager la remise en culture : taxe sur la valeur foncière (plafonnée à trois fois le taux de base) ou redevance au m² alimentant un fonds de remise en culture, avec exemptions possibles (exploitants enregistrés, agri-projets partenaires).

## Transport et stationnement

### m09 · Tarification stationnement sur rue

**en ligne** · source : Mascouche, fiche 18 « Tarification du stationnement sur rue ou vignettes » · aussi couverte par Gatineau, fiche 12 · pouvoir habilitant (V3) : LFM

**Description**

Tarif (ou vignette) pour contrôler et gérer le stationnement sur rue ; le montant peut varier selon le secteur, le quartier ou le type de véhicule.

### m10 · Redevance grands générateurs de déplacements

**en ligne** · source : Mascouche, fiche 19 « Redevance visant les grands générateurs de déplacement » · pouvoir habilitant (V3) : PGRR

**Description**

Redevance auprès des grands générateurs de déplacement (grands employeurs de 100+ employés, organisateurs d'événements) dépourvus d'un programme de gestion des déplacements, pour financer le transport collectif et les infrastructures de transport actif.

### m11 · Redevance transport rémunéré de personnes

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme**

**Description**

La redevance est un montant fixe perçu sur chaque course de transport rémunéré de personnes (taxis et services par application), collecté auprès des usagers et versée à la municipalité. Le produit peut notamment financer le transport collectif et l'entretien du réseau routier local sollicité par ces déplacements.

### m12 · Taxe sur les espaces de stationnement

**en ligne** · source : Gatineau, fiche 11 « Taxe sur les espaces ou les billets de stationnements commerciaux » · pouvoir habilitant (V3) : PGT + PGRR

**Description**

Taxe auprès des propriétaires de parcs de stationnement non résidentiels dans les zones desservies en transport collectif, calculée sur la superficie ou le nombre de cases (exemptions de base possibles), avec un taux modulable par secteur, type de stationnement (extérieur taxé davantage) et niveau de desserte — pour financer le transport collectif et optimiser l'usage des terrains.

### m13 · Redevances de transport

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme** · pouvoir habilitant (V3) : LAU

**Description**

Redevance exigée des requérants de permis de construction et destinée à financer tout ou partie d’une dépense liée à un service de transport collectif qui bénéficie à l’immeuble visé par la demande de permis ou de certificat, à ses occupants ou à ses usagers. À distinguer de la redevance visant les grands générateurs de déplacements, qui vise à inciter le générateur à se doter d'un plan de réduction des déplacements.

## Aménagement, sol et développement

### m14 · Taxe sur le COS (coefficient d'occupation du sol)

**en ligne** · source : Mascouche, fiche 24 « Taxe sur le coefficient d'occupation du sol (COS) manquant » · aussi couverte par Gatineau, fiche 13 · pouvoir habilitant (V3) : PGT + PGRR

**Description**

Taxe sur les immeubles non-résidentiels desservis dont le coefficient d'occupation du sol (COS) est inférieur à un certain seuil. Le montant de la taxe/redevance total sur le COS pourrait notamment être calculé en utilisant la différence entre la superficie de plancher intérieur d’un bâtiment principal et la superficie requise pour atteindre le COS minimal fixé par la municipalité. Cet écart peut ensuite être imposé à un taux déterminé par la municipalité.

### m15 · Taxe sur les surfaces non végétalisées

**en ligne** · source : Mascouche, fiche 25 « Taxe sur les surfaces non végétalisées » · aussi couverte par Gatineau, fiche 14 (surfaces imperméables / minéralisées) · pouvoir habilitant (V3) : PGT + PGRR

**Description**

Taxe sur les surfaces minéralisées (non végétalisées) de certains immeubles non résidentiels : superficie du terrain moins bâtiments moins surfaces végétalisées, avec strates progressives (exemption de base, puis tarifs croissants).

### m16 · Redevances visant le financement de la voirie locale

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme**

**Description**

Redevance exigée auprès des utilisateurs de la voirie locale pour financer la construction, la réfection et l'entretien du réseau routier local.

### m17 · Redevances de développement

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme** · pouvoir habilitant (V3) : LAU

**Description**

Redevance exigée des requérants de permis de construction/lotissement pour financer les infrastructures et équipements municipaux rendus nécessaires par un nouveau développement (eau potable, eaux usées, voirie). Le règlement doit établir le lien entre la redevance et les dépenses financées, et peut moduler le montant par secteur ou par type de projet.

### m18 · Taxe arbre en cour avant

**en ligne** · source : Mascouche, fiche 13 « Taxe visant les arbres manquants en cour avant » · aussi couverte par Gatineau, fiche 15 · pouvoir habilitant (V3) : PGT + PGRR

**Description**

Taxe visant l'absence d'arbre en cour avant (façade) des immeubles résidentiels et non résidentiels : taxe unitaire imposée aux propriétaires non conformes.

### m19 · Redevance visant la réduction de la perte de canopée

**en ligne** · source : Mascouche, fiche 14 « Redevance visant la réduction de la perte de canopée » · aussi couverte par Gatineau, fiche 16 · pouvoir habilitant (V3) : PGRR

**Description**

Redevance visant la réduction de la perte de canopée dans les projets de construction ; montant établi de façon discrétionnaire ou selon la valeur écosystémique des arbres abattus (nombre, essence, âge, taille).

### m20 · Taxe sur les terrains contaminés

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme** · pouvoir habilitant (V3) : PGT

**Description**

Taxe imposée aux terrains inscrits comme contaminés et laissés inutilisés, pour inciter à la réhabilitation et à la remise en valeur des sites plutôt qu'à leur rétention en l'état. L'assiette peut s'appuyer sur le répertoire des terrains contaminés et doit s'asseoir sur la superficie, non la valeur foncière.

## Matières résiduelles, émissions et énergie

### m21 · Tarification variable des matières résiduelles

**en ligne** · source : Mascouche, fiche 16 « Tarification incitative pour la collecte et le traitement des matières résiduelles » · aussi couverte par Gatineau, fiche 17

**Description**

Tarification incitative selon le nombre de levées et la taille du bac, afin de réduire les matières vouées à l'enfouissement (coûts aujourd'hui assumés par la taxe foncière générale).

### m22 · Redevance visant les résidus de CRD

**en ligne** · source : Mascouche, fiche 17 « Redevance visant les résidus de travaux de CRD » · aussi couverte par Gatineau, fiche 18

**Description**

Redevance sur les permis de construction, rénovation et démolition pour détourner les résidus de CRD de l'élimination ; les redevables ayant un plan de gestion des matières pourraient être exemptés.

### m23 · Taxe ou redevance sur la démolition

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme**

**Description**

Prélèvement exigé à la délivrance d'une autorisation de démolition, proportionnel à la superficie/volume du bâtiment démoli. Dans le cas d'une redevance, celle-ci permettrait d'internaliser le coût environnemental de la démolition (résidus de construction-rénovation-démolition, énergie grise perdue) et de rendre la rénovation ou le réemploi plus avantageux.

### m24 · Redevance sur les contenants à usage unique ou individuel

**en ligne** · source : Gatineau, fiche 19 « Redevance sur les contenants à usage unique ou individuel » · pouvoir habilitant (V3) : PGRR

**Description**

Redevance sur la quantité de contenants et produits à usage unique vendus ou fournis par les commerçants (verres, bouteilles d'eau, pailles…), établie par déclaration périodique, pour financer la gestion des matières résiduelles et inciter à la réduction à la source ; un montant compensatoire peut être retenu par les commerçants pour la gestion.

### m25 · Redevance sur la performance énergétique et climatique des immeubles

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme** · pouvoir habilitant (V3) : PGRR

**Description**

Redevance exigée auprès des propriétaires d'immeubles en fonction de leurs émissions déclarées de polluants atmosphériques, de gaz à effet de serre ou de leur performance énergétique, selon le principe du pollueur-payeur. Elle vise à financer les mesures municipales d'amélioration de la qualité de l'air, l'adaptation aux changements climatiques, les programmes municipaux d'efficacité énergétique ou à inciter les propriétaires à apporter des améliorations à la performance environnementale du bâtiment. La redevance s'appuie sur les déclarations d'émissions exigées de ces établissements.

### m26 · Redevance visant à compenser les GES associés au développement immobilier

**en ligne** · source : Gatineau, fiche 21 « Redevance visant à compenser les GES associés au développement immobilier »

**Description**

Redevance imposée au promoteur lors du permis de construction ou de branchement à l'aqueduc, pour compenser les GES émis par l'urbanisation d'un terrain (perte de biomasse, travaux d'infrastructures) : superficie développée × taux de compensation arrimé au prix du carbone (p. ex. 1,08 $/m²), versée à un fonds dédié à l'atténuation et à l'adaptation ; requalification exemptable.

### m28 · Taxe sur les systèmes au mazout ou biénergie

**en ligne** · source : Mascouche, fiche 15 « Taxe sur les systèmes au mazout ou système biénergie » · aussi couverte par Gatineau, fiche 20 · pouvoir habilitant (V3) : PGT + PGRR

**Description**

Taxe imposée aux propriétaires d'immeubles résidentiels disposant d'appareils de chauffage au mazout ou d'un système biénergie au mazout ; montant fixe par appareil assujetti.

## Eau

### m29 · Redevance rejets d'eaux usées

**en ligne** · source : Mascouche, fiche 20 « Redevances sur les rejets d'eaux usées » · aussi couverte par Gatineau, fiche 24

**Description**

Redevance sur les rejets d'eaux usées, prélevée selon la quantité et le niveau de contamination rejetés sur une période donnée, pour financer le traitement des eaux usées.

### m30 · Tarification eau résidentiel

**en ligne** · source : Mascouche, fiche 21 « Tarification de l'eau potable — secteur résidentiel » · aussi couverte par Gatineau, fiche 22 · pouvoir habilitant (V3) : LFM

**Description**

Tarification de l'eau potable au secteur résidentiel selon le principe utilisateur-payeur : variable (consommation en m³ avec compteurs) ou forfaitaire (tarif annuel au compte de taxes).

### m31 · Tarification eau ICI

**en ligne** · source : Mascouche, fiche 22 « Tarification de l'eau potable — ICI » · aussi couverte par Gatineau, fiche 23 · pouvoir habilitant (V3) : LFM

**Description**

Tarification de l'eau potable pour les industries, commerces et institutions (ICI) selon le principe utilisateur-payeur : variable selon la consommation (compteurs) ou forfaitaire au coût moyen.

### m32 · Taxe sur les piscines

**en ligne** · source : Mascouche, fiche 23 « Transformation de la tarification sur les piscines en taxe » · aussi couverte par Gatineau, fiche 22 (traite les piscines avec l'eau résidentielle)

**Description**

Transformation de la tarification actuelle des piscines en taxe générale, avec un montant par propriété calibré pour générer des revenus supplémentaires.

## Autres

### m33 · Redevance d'amusement

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme**

**Description**

Prélèvement sur le prix d'entrée ou le droit de participation à des activités de divertissement commercial (spectacles, événements, attractions, jeux), perçu par l'exploitant et remis à la municipalité, qui fait contribuer une clientèle en bonne partie non résidente aux services municipaux.

### m34 · Redevance d'hébergement touristique

**en ligne** · source : Gatineau, fiche 26 « Redevance d'hébergement touristique »

**Description**

Redevance réglementaire imposée aux exploitants d'établissements d'hébergement touristique — montant annuel par unité de capacité (chambre, lit, site de camping), modulable par type d'établissement et secteur — pour compenser les coûts municipaux liés au tourisme (voirie, parcs, déchets, sécurité) ; distincte de la taxe provinciale sur l'hébergement et non facturée aux touristes.

### m35 · Taxe sur les panneaux d'affichage

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme**

**Description**

Taxe prélevée auprès des requérants de permis d'affichage sur les panneaux et enseignes publicitaires situés sur le territoire, modulée selon la superficie, le type (statique ou numérique) ou l'emplacement.

### m36 · Redevance sur les services de câblodistribution et télécommunication

**en ligne** · source : Gatineau, fiche 27 « Redevance sur les services de câblodistribution / infrastructures de télécommunication »

**Description**

Redevance réglementaire liée à l'occupation du domaine public par les réseaux de câblodistribution et de télécommunication (encadrée par un accord d'accès municipal) : frais de permis, dégradation de la chaussée, relocalisations — au coût réel, selon les balises du CRTC (principe de neutralité des coûts pour les contribuables).

### m37 · Redevance sur les générateurs de risques

**en ligne** · source : ✍️ **rédigée par Corda** (3 août 2026), à partir du pouvoir habilitant et de la pratique municipale québécoise — **à valider par Fanny / Jérôme**

**Description**

Redevance auprès des propriétaires d'installations présentant un risque pour la population ou l'environnement (réservoirs de produits chimiques, entreposage de matières dangereuses), calculée selon la nature et le volume entreposés, pour financer les capacités municipales de prévention et d'intervention d'urgence qu'exigent ces installations.

---

## Écarts de catalogue relevés au passage

Des mesures **décrites dans les documents sources** n'existent pas dans le catalogue des 36 :

| Mesure des sources | Où | Statut |
|---|---|---|
| Taux variés selon la **superficie habitable** | Mascouche 9 · Gatineau 3 · fiche V3 | absente du catalogue TDB (déjà signalée à l'audit de fidélité, §5) |
| Taux supérieur — terrain résidentiel > 9 000 pi² | Mascouche 6 | absente du catalogue TDB |
| Taux supérieur — terrain **scindable** (constructible) | Mascouche 7 | absente du catalogue TDB |
| Taxation des unifamiliaux à très grande superficie | Gatineau 4 | absente (proche de « superficie habitable ») |
| Tarification de la gestion des **fosses septiques** | Gatineau 25 | absente du catalogue TDB |

Rien à corriger en soi — le catalogue TDB vient de la *Grille des mesures* de la MRC, pas du corpus V3.
Mais c'est une décision de mandat à confirmer : **choix délibéré, ou oubli ?**

## Questions ouvertes (pour Fanny / Jérôme)

1. **Les 11 rédigées par Corda** (question C2 du dossier de validation) — elles sont maintenant écrites,
   faute de source à extraire, et **révisées par Vincent le 4 août 2026**. Reste à faire : les **relire** et confirmer
   que chacune décrit bien la mesure que la grille avait en tête (surtout m11, m13, m16 et m17, quatre redevances
   de transport / développement dont les périmètres se recoupent — la révision du 4 août les a resserrées : m13 vise
   le requérant d'un permis, m16 l'utilisateur de la voirie, m11 l'usager du transport rémunéré).
2. **m25 élargie, m27 retirée (4 août 2026)** — la redevance sur les émissions industrielles devient une redevance
   sur la **performance énergétique et climatique des immeubles**, et absorbe l'ancienne m27. **Pour Jérôme :** les cotes
   du V3 pour m25 ont été attribuées à la mesure étroite (émissions industrielles). Valent-elles pour la mesure élargie,
   ou faut-il recoter ? Le catalogue passe de 37 à **36 mesures**.
3. **Pouvoirs habilitants corrigés (4 août 2026)** — m07 : LFM → **PGT** · m13 : LAU + PGRR → **LAU** · m20 : **PGT** (absent du V3).
   À confirmer, ces attributions venaient de la feuille « Liste des mesures » du V3.
4. **Les 5 mesures des sources absentes du catalogue** (tableau ci-dessus) — à ajouter, ou hors mandat ?
