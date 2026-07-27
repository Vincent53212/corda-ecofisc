# Dossier de validation — Orchestrateur d'analyse multicritère

**À :** Pre Fanny Tremblay-Racicot (ENAP / CERGO)
**De :** Vincent Duguay — Corda · Écofiscalité
**Date :** 1er juillet 2026
**Objet :** décisions à trancher avant la mise en service de l'outil de cotation (MRC Thérèse-De Blainville). Une seule rencontre devrait suffire à tout régler — chaque point offre la règle actuelle, l'alternative, et un espace de décision.

---

## A. Règles de calcul (moteur de cotation)

Les règles de la grille V3 ont été transcrites dans un moteur unique, testé automatiquement (25 tests). La transcription a mis au jour quelques cas limites que le document méthodologique complet (`methodologie.md`) détaille — en voici la synthèse décisionnelle.

| # | Point | Règle actuelle (implémentée) | Alternative | Décision |
|---|---|---|---|---|
| A1 | **Arrondi de la moyenne d'une ville** quand elle tombe à ±0,5 (deux répondants) | +0,5 → **+1**, mais −0,5 → **0** (arrondi standard, léger biais favorable) | Arrondi symétrique (−0,5 → −1) | ☐ |
| A2 | **Égalités dans la synthèse MRC** (autant de villes « pour » que « contre ») | « Non recommandée » prime sur tout ; puis « Recommandée » prime sur « À l'étude » | Autre priorité, ou afficher « égalité » | ☐ |
| A3 | **Dimension sans aucune réponse** | Comptée « Neutre » dans le calcul de la recommandation | Exclure la dimension du calcul | ☐ |
| A4 | **Somme ≥ 2 avec au moins une réponse négative** | « Favorable » (le négatif bloque le « Très favorable ») — symétrique côté négatif | Confirmer l'intention | ☐ |
| A5 | **Agrégation des répondants d'une même ville** | Moyenne arrondie, question par question | Médiane (moins sensible aux extrêmes) | ☐ |
| A6 | **Règle de recommandation** : 1 seul « Peu favorable » suffit à bloquer « Recommandée » (→ « À l'étude »), même avec 3 dimensions favorables | Comportement du code V3, conservé tel quel | Confirmer l'intention | ☐ |
| A7 | **Mesures « non applicables » à une ville** | Aucun statut « N/A » — une question ignorée compte comme neutre | Introduire un vrai « N/A » (la question ae7 dit « lorsqu'applicable ») | ☐ |

## B. Boussole de cotation (sens du + et du −)

Chaque question affiche maintenant une « boussole » (+ signifie… / − signifie…), car 7 questions sont à polarité inversée (un « oui » y est défavorable) : pf3, sg1, sg4, sg5, ae3, ae6, ae7. Deux polarités demandent votre confirmation :

| # | Question | Boussole proposée | Décision |
|---|---|---|---|
| B1 | **ae7 — Abordabilité** (« Lorsqu'applicable, la mesure a-t-elle un effet sur l'abordabilité des logements ? ») | **+** = sans effet, ou améliore l'abordabilité · **−** = nuit à l'abordabilité (renchérit le logement) | ☐ |
| B2 | **ae2 — Disponibilité d'alternatives** (« un contribuable peut-il diminuer ou éviter les prélèvements en modifiant son comportement ? ») | **+** = évitable en changeant de comportement · **−** = prélèvement subi, sans échappatoire | ☐ |

## C. Descriptions des mesures

### C1. Six nouvelles descriptions, tirées des fiches analytiques Gatineau (2025) — à approuver

Rédigées dans le même style que celles tirées des fiches Mascouche (mécanisme génériqué, 1-3 phrases).

- **m08 · Taxe sur les terres à vocation agricole exploitables mais non exploitées** — Taxe ou redevance visant les terres à vocation agricole exploitables mais non exploitées, pour décourager la spéculation et encourager la remise en culture : taxe sur la valeur foncière (plafonnée à trois fois le taux de base) ou redevance au m² alimentant un fonds de remise en culture, avec exemptions possibles (exploitants enregistrés, agri-projets partenaires).
- **m12 · Taxe sur les espaces de stationnement** — Taxe auprès des propriétaires de parcs de stationnement non résidentiels dans les zones desservies en transport collectif, calculée sur la superficie ou le nombre de cases (exemptions de base possibles), avec un taux modulable par secteur, type de stationnement (extérieur taxé davantage) et niveau de desserte — pour financer le transport collectif et optimiser l'usage des terrains.
- **m24 · Redevance sur les contenants à usage unique ou individuel** — Redevance sur la quantité de contenants et produits à usage unique vendus ou fournis par les commerçants (verres, bouteilles d'eau, pailles…), établie par déclaration périodique, pour financer la gestion des matières résiduelles et inciter à la réduction à la source ; un montant compensatoire peut être retenu par les commerçants pour la gestion.
- **m26 · Redevance visant à compenser les GES associés au développement immobilier** — Redevance imposée au promoteur lors du permis de construction ou de branchement à l'aqueduc, pour compenser les GES émis par l'urbanisation d'un terrain (perte de biomasse, travaux d'infrastructures) : superficie développée × taux de compensation arrimé au prix du carbone (p. ex. 1,08 $/m²), versée à un fonds dédié à l'atténuation et à l'adaptation ; requalification exemptable.
- **m34 · Redevance d'hébergement touristique** — Redevance réglementaire imposée aux exploitants d'établissements d'hébergement touristique — montant annuel par unité de capacité (chambre, lit, site de camping), modulable par type d'établissement et secteur — pour compenser les coûts municipaux liés au tourisme (voirie, parcs, déchets, sécurité) ; distincte de la taxe provinciale sur l'hébergement et non facturée aux touristes.
- **m36 · Redevance sur les services de câblodistribution et télécommunication** — Redevance réglementaire liée à l'occupation du domaine public par les réseaux de câblodistribution et de télécommunication (encadrée par un accord d'accès municipal) : frais de permis, dégradation de la chaussée, relocalisations — au coût réel, selon les balises du CRTC (principe de neutralité des coûts pour les contribuables).

☐ Approuvées telles quelles  ☐ Avec corrections (annoter ci-dessus)

### C2. Douze mesures encore sans description — source à identifier (ou rédaction à prévoir)

| id | Mesure |
|---|---|
| m07 | Taxe immeubles vacants (non résidentiel) — *la fiche Gatineau ne couvre que le résidentiel* (libellé aligné sur le V3 le 16 juill. 2026) |
| m11 | Redevance transport rémunéré de personnes |
| m13 | Redevances de transport |
| m16 | Redevances visant le financement de la voirie locale |
| m17 | Redevances de développement |
| m20 | Taxe sur les terrains contaminés |
| m23 | Taxe sur la démolition |
| m25 | Redevance sur les émissions de polluant par les industries (dont les GES) |
| m27 | Redevance à l'égard de la performance énergétique des bâtiments |
| m33 | Redevance d'amusement |
| m35 | Taxe sur les panneaux d'affichage |
| m37 | Redevance sur les générateurs de risques (dont les réservoirs de produits chimiques) |

**Question :** existe-t-il d'autres fiches (autres mandats) couvrant ces mesures, ou souhaitez-vous que nous rédigions des descriptions courtes à partir de la littérature (à valider ensuite) ? ☐

## D. Décisions Loi 25 (avant toute collecte réelle)

L'outil recueillera prénom, nom et fonction de représentants municipaux, ainsi que leurs commentaires libres. Avant toute donnée réelle, quatre décisions institutionnelles :

| # | Décision | Proposition de départ | Décision |
|---|---|---|---|
| D1 | **Durée de conservation** des réponses et identités (puis destruction réelle) | Durée du mandat + 3 ans (à confirmer avec les obligations de recherche/archives) | ☐ |
| D2 | **Responsable de la protection des renseignements personnels** (nom + courriel affichés dans l'outil) | À désigner (par défaut : plus haute autorité chez Corda pour l'outil ; à articuler avec l'ENAP/CERGO pour le mandat) | ☐ |
| D3 | **Finalité affichée au consentement** (1re connexion) | « Vos nom, prénom et fonction servent uniquement à rattacher vos cotations à votre ville dans le cadre du mandat d'analyse écofiscale de la MRC Thérèse-De Blainville (ENAP/CERGO). Accès restreint à l'équipe de recherche ; aucune diffusion nominative. » | ☐ |
| D4 | **Entente d'encadrement** Corda ↔ MRC/CERGO (finalité, sécurité, sous-traitants, destruction, réversibilité, propriété intellectuelle de l'outil et marque Corda) | Gabarit rédigé au prochain bloc de travail — qui signe, pour quelle organisation ? | ☐ |
| D5 | **Analyse des commentaires par outil d'IA** | **Interdit par défaut** (les commentaires peuvent contenir des renseignements sur des tiers) ; toute exception exigera pseudonymisation + fournisseur canadien + évaluation dédiée | ☐ |

---

*Les règles de calcul vivent dans un module testé (`rules.js`, 25 tests automatiques) : tout changement décidé ici s'applique en quelques lignes, sans risque de régression. Documents de référence : `methodologie.md` (règles en prose) et `dictionnaire-donnees.md` (inventaire des données).*
