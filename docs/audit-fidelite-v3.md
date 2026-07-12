# Audit de fidélité — l'application face aux sources V3

**Date :** 7 juillet 2026 (veille de la rencontre du 8 juillet)
**Sources auditées :** `sources/Outil d'aide à la décision_V3.docx` (guide, prose) · `sources/Grille d'analyse multicritère_V3.xlsx` (classeur : feuille Guide, fiches mesures, Analyse multicritère, Synthèse — **formules incluses**)
**Objet audité :** `rules.js` (moteur de l'application, 29 tests) et ses libellés.

## Verdict en une phrase

**L'application est fidèle à la méthodologie écrite (le guide) — mais l'audit révèle que le classeur Excel V3 et son propre guide ne disent pas la même chose sur trois cas.** L'application a donc trois divergences avec les *formules* du classeur, toutes héritées d'une divergence interne aux sources. C'est un point à faire trancher par la direction scientifique, pas un bug de transcription.

---

## 1 · Règles d'appréciation (cotes d'une dimension → appréciation)

Le guide (docx §3, identique à la feuille « Guide » du classeur) définit :

| Appréciation          | Règle du guide (prose)          | Formule du classeur (fiches, col. B) | `rules.js`                      |
| --------------------- | ------------------------------- | ------------------------------------ | ------------------------------- |
| Très favorable        | aucun négatif **et somme > 1**  | aucun négatif et **somme > 0**       | = guide (S ≥ 2, aucun négatif)  |
| Favorable             | somme ≥ 1 (négatifs permis)     | somme > 0 avec ≥ 1 négatif           | = guide                         |
| Neutre                | somme = 0                       | somme = 0                            | = guide                         |
| Peu favorable         | somme < 0 (positifs permis)     | somme < 0 avec ≥ 1 positif           | = guide                         |
| Pas du tout favorable | aucun positif **et somme < −1** | aucun positif et **somme < 0**       | = guide (S ≤ −2, aucun positif) |

**Divergence interne n° 1 — le seuil « Très favorable ».** Une dimension à somme **+1 sans aucun négatif** est *Favorable* selon le guide (et l'app), mais *Très favorable* selon la formule Excel. Exemples réels dans le classeur V3 : « Taux variés par tranche de valeur » (Potentiel fiscal : 1,0,0) et « Taux supérieur terrain vague » y affichent *Très favorable* avec une somme de 1.

**Divergence interne n° 2 — le seuil « Pas du tout favorable » (celui qui change des recommandations).** Une dimension à somme **−1 sans aucun positif** est *Peu favorable* selon le guide (et l'app), mais *Pas du tout favorable* selon la formule Excel. Comme un seul « Pas du tout favorable » entraîne « Non recommandée », **la même cotation produit des recommandations finales différentes** selon la source suivie. Cas réels du classeur V3 :

| Mesure (cotes réelles V3) | Selon la formule Excel | Selon le guide (= l'app) |
|---|---|---|
| Taxe logements vacants (résidentiel) — SG : un seul −1 | SG = Pas du tout favorable → **Non recommandée** | SG = Peu favorable → **Mise à l'étude** |
| Taxe terres agricoles non exploitées — SG : un seul −1 | **Non recommandée** | **Mise à l'étude** |
| Redevance émissions industrielles — SG : un seul −1 | **Non recommandée** | **Mise à l'étude** |

## 2 · Règle de recommandation (4 appréciations → recommandation)

| Cas | Guide (prose) | Formule Excel (Synthèse, col. F) | `rules.js` |
|---|---|---|---|
| ≥ 1 « Pas du tout favorable » | Non recommandée | idem | = guide |
| ≥ 2 « Peu favorable » | Non recommandée | idem | = guide |
| 1 « Peu favorable » | Mise à l'étude | idem | = guide |
| Tout Neutre | Mise à l'étude | idem | = guide |
| Aucun PF/PDF, **≥ 2 favorables** | Recommandée | Recommandée | = guide |
| Aucun PF/PDF, **1 seule favorable** | *(exige ≥ 2 favorables → pas Recommandée ; cas non énuméré → l'app le classe Mise à l'étude)* | **Recommandée** | Mise à l'étude |

**Divergence interne n° 3 — le seuil « Recommandée ».** La formule Excel recommande dès qu'il n'y a ni « Peu » ni « Pas du tout » favorable (hors tout-Neutre) — une seule dimension favorable suffit. Le guide exige **au moins deux** dimensions favorables. Cas réel du classeur : « Redevance sur les générateurs de risques » (Neutre / Très favorable / Neutre / Neutre) = *Recommandée* dans l'Excel ; *Mise à l'étude* selon le guide et l'app.

**Note (déjà au dossier de validation, point A6)** : l'énumération « Mise à l'étude » du guide est incomplète (p. ex. une seule favorable sans aucun défavorable n'entre dans aucun des trois cas énumérés). L'app résout l'incomplétude en classant *Mise à l'étude* tout ce qui n'est ni « Recommandée » ni « Non recommandée » — la formule Excel la résout dans l'autre sens (vers « Recommandée »).

## 3 · Constats de robustesse sur le classeur (facteur de la décision, pas un blâme)

- **Référence croisée erronée** : `Synthèse!C4` (Saine gestion de « Taux variés superficie habitable ») pointe vers `Analyse multicritère!C2` (Potentiel fiscal) au lieu de `C7`. Sans effet visible aujourd'hui (les deux cellules valent « Très favorable ») — mais latent.
- **Colonnes `#REF!`** dans « Analyse multicritère » et une mesure affichée « 0 » dans la Synthèse (références brisées par des suppressions de feuilles).
- Ces classes d'erreurs (copie de formule, référence brisée, prose ≠ formule) sont précisément ce que la transcription en **module unique testé** élimine : dans l'app, la règle n'existe qu'une fois et 29 tests la verrouillent.

## 4 · Fidélité des libellés (questions et critères)

- **22/22 critères présents**, mêmes dimensions, même ordre, même échelle −1/0/+1.
- Questions : **fidèles au sens partout**. Écarts recensés :
  - `pf3` : « la Ville de Gatineau » → « la Ville » (généricisation assumée, documentée depuis le début) ;
  - `ae1` : « celui **dont** on pourrait s'attendre » → « celui **auquel** on pourrait s'attendre » (correction grammaticale) ;
  - une dizaine d'allègements typographiques sans changement de sens (ex. sg1 : « que ce soit en termes d'immobilisations, d'exploitation ou du respect de la conformité fiscale » → « (immobilisations, exploitation, conformité fiscale) » ; ae2 : « diminuer ou *même* éviter » → « diminuer ou éviter » ; ee3 : « milieux déjà *plus* urbanisés… étalement *urbain* » → « milieux déjà urbanisés… étalement »).
- Étiquettes : « Applicabilité (court terme) » reprend le libellé du classeur ; « Résilience » → « Résilience des écosystèmes » (précision, la question parle bien des écosystèmes).
- La **boussole +/−** de chaque question est un ajout de l'app (aide à la cotation), sans modification des libellés — les deux polarités ambiguës (ae7, ae2) sont au dossier de validation (section B).

## 5 · Catalogue des mesures

Le catalogue de l'app (37 mesures) vient de la *Grille des mesures — MRC Thérèse-De Blainville*, pas du classeur V3 (~30 fiches, liste « non exhaustive » selon le guide). Deux écarts à confirmer en passant :
- « Taux variés en fonction de la **superficie habitable** » existe dans le classeur V3 mais pas dans le catalogue TDB (choix de mandat ?) ;
- m07 s'intitule « Taxe **logements** vacants (non résidentiel) » dans le catalogue TDB alors que le classeur V3 dit « Taxe **immeubles** vacants (non résidentiel) » — le libellé V3 semble le bon.

## 6 · La question à trancher (pour Jérôme)

> **Laquelle des deux sources fait doctrine : la prose du guide, ou les formules du classeur ?**
> L'application suit aujourd'hui la prose (seuils stricts : TF à ±2, Recommandée à 2 favorables). Si les formules du classeur reflètent l'intention réelle (seuils à ±1, Recommandée dès 1 favorable), le changement dans l'app tient en trois lignes du moteur, couvert par les tests — mais il faut le décider explicitement, car **trois recommandations du classeur V3 changent** selon la réponse.

*Méthode : extraction openpyxl des formules et valeurs du classeur (fiches, Analyse multicritère, Synthèse) ; conversion pandoc du guide ; comparaison ligne à ligne avec `rules.js`. Reproduisible sur demande.*
