# Méthodologie de cotation — Orchestrateur (analyse multicritère)

> **Source des règles :** grille d'analyse multicritère **V3** (dir. Pre Fanny Tremblay-Racicot, ENAP/CERGO).
> **Implémentation :** `rules.js` (source unique du moteur) · vérifiée par **25 tests** (`node --test tests/rules.test.js`).
> **Statut :** règles transcrites fidèlement du prototype — **points de validation en §6** pour la direction de recherche.

## 1. L'échelle de cotation

Chaque répondant municipal cote **37 mesures** sur **22 questions** regroupées en **4 dimensions** :

| Dimension | Questions |
|---|---|
| Potentiel fiscal | 3 (pf1-pf3) |
| Saine gestion administrative | 6 (sg1-sg6) |
| Acceptabilité et équité | 7 (ae1-ae7) |
| Efficacité environnementale | 6 (ee1-ee6) |

Réponses possibles : **+1** (favorable) · **0** (neutre) · **−1** (défavorable). Chaque question porte une **boussole** (« + signifie… / − signifie… ») affichée sous son libellé, car **7 questions sont à polarité inversée** — un « oui » y est *défavorable* : pf3 (taux déjà élevé), sg1 (coûts élevés), sg4 (conflit réglementaire), sg5 (risque judiciaire), ae3 (impact sur personnes vulnérables), ae6 (impact concentré), ae7 (nuit à l'abordabilité).

## 2. Des réponses à l'appréciation d'une dimension (`apprec`)

**S** = somme des réponses données dans la dimension (les questions sans réponse sont ignorées).

| Condition (dans l'ordre) | Appréciation |
|---|---|
| S ≥ 2 **et** aucune réponse négative | Très favorable |
| S ≥ 1 (sinon) | Favorable |
| S = 0 (ou aucune réponse) | Neutre |
| S ≤ −2 **et** aucune réponse positive | Pas du tout favorable |
| Tous les autres cas (S < 0) | Peu favorable |

Cas limites à connaître :
- **S ≥ 2 avec au moins un −** → Favorable seulement : le négatif bloque le « Très favorable ».
- **S ≤ −2 avec au moins un +** → Peu favorable seulement (symétrique).
- **Dimension entièrement sans réponse** → traitée comme Neutre dans le calcul de la recommandation (l'interface affiche « À coter »).

## 3. Des 4 appréciations à la recommandation (`reco`)

| Condition (dans l'ordre) | Recommandation |
|---|---|
| ≥ 1 « Pas du tout favorable » **ou** ≥ 2 « Peu favorable » | **Non recommandée** |
| aucun « Peu / Pas du tout favorable » **et** ≥ 2 dimensions favorables (F ou TF) | **Recommandée** |
| tout le reste | **Mise à l'étude** |

Concrètement, la « mise à l'étude » recueille : un seul « Peu favorable » (même accompagné de 3 dimensions favorables) ; 0 ou 1 dimension favorable sans pénalité ; tout-neutre.

> **Note de révision (constat C, révision 1) :** le code V3 énumérait « (≥ 2 favorables **et** 1 Peu favorable) **ou** tout-neutre → étude » *puis* retombait de toute façon sur « étude » pour tout le reste — une **branche morte**. Elle a été simplifiée **sans aucun changement de comportement** : la règle effective est celle du tableau ci-dessus.

## 4. Agrégation d'une ville = moyenne arrondie de ses répondants (`villeMoyenne`)

Quand une ville compte plusieurs répondants, l'Orchestrateur calcule, **question par question**, la **moyenne arrondie** de leurs cotes, puis recalcule les appréciations (§2) et la recommandation (§3) sur ces moyennes.

- Exemple : répondants à +1 et −1 → moyenne 0 (neutre).
- ⚠ **Asymétrie d'arrondi à ±0,5** (comportement standard de `Math.round`) : **+0,5 → +1** mais **−0,5 → 0**. Deux répondants {+1, 0} donnent +1 ; deux répondants {−1, 0} donnent 0. Léger biais vers le favorable dans les égalités — **à trancher** (§6).
- Alternative non retenue à ce stade : la **médiane** (moins sensible aux extrêmes) — pertinente si le nombre de répondants par ville dépasse 2-3.

## 5. Synthèse MRC = majorité des recommandations des villes (`mrcSynthese`)

Pour chaque mesure, la colonne MRC compte les recommandations des villes **ayant des données** et retient la **majorité**. En cas d'égalité :
1. « Non recommandée » prime sur tout (règle de prudence) ;
2. puis « Recommandée » prime sur « Mise à l'étude ».

Exemples : {1 R, 1 N} → **N** · {1 R, 1 É} → **R** · {1 É, 1 N} → **N**.

## 6. Points soumis à validation (Pre Tremblay-Racicot)

| # | Point | Règle actuelle | Alternative à considérer |
|---|---|---|---|
| 1 | Arrondi à ±0,5 (§4) | +0,5 → +1 ; −0,5 → 0 (asymétrique) | arrondi symétrique (loin de zéro) |
| 2 | Égalités dans la synthèse MRC (§5) | N prime, puis R prime sur É | autre priorité, ou afficher « égalité » |
| 3 | Dimension sans aucune réponse | comptée Neutre dans la reco | exclure la dimension du calcul |
| 4 | S ≥ 2 avec un négatif (§2) | Favorable (jamais TF) | confirmer l'intention |
| 5 | Agrégation ville (§4) | moyenne arrondie | médiane |
| 6 | Boussole ae7 (abordabilité) et ae2 (alternatives) | polarité proposée au Bloc boussole | confirmer le sens attendu |
| 7 | Mesures « non applicables » à une ville | aucun statut « N/A » (0 = neutre) | introduire un vrai N/A ? (ae7 dit « lorsqu'applicable ») |

---
*Document produit au Bloc 2 du plan de travail (extraction du moteur `rules.js`). Toute modification des règles doit passer par `rules.js` + la suite de tests, puis être reflétée ici.*
