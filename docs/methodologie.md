# Méthodologie de cotation — Orchestrateur (analyse multicritère)

> **Source des règles :** grille d'analyse multicritère **V4** (dir. Pre Fanny Tremblay-Racicot, ENAP/CERGO).
> **Implémentation :** `rules.js` (source unique du moteur) · vérifiée par **35 tests** (`node --test tests/rules.test.js`).
> **Statut :** règles transcrites fidèlement du **classeur** — **points de validation en §6** pour la direction de recherche.

> [!important] Passage à la V4 — 3 août 2026
> Trois changements par rapport à la V3, tous portés dans `rules.js` :
> 1. les **7 questions à polarité inversée sont réécrites en polarité positive** (pf3, sg1, sg4, sg5, ae3, ae6, ae7) : un « oui » est désormais **toujours** favorable. Les cotes déjà saisies gardent leur sens (les répondants notaient −1/0/+1, pas oui/non) ;
> 2. **nouveau critère `sg7` « Historique »** (7e de la Saine gestion) : *la mesure a-t-elle été récemment mise à l'étude ?* — barème explicite : mise à l'étude **+1** · jamais étudiée **0** · étudiée puis rejetée **−1**. Total : **23 critères** ;
> 3. **question préalable « déjà en place »** (§7), qui court-circuite l'analyse pour une mesure déjà implantée.

> [!important] Doctrine des seuils — décision du 16 juillet 2026 (Jérôme)
> L'audit de fidélité (`docs/audit-fidelite-v3.md`) avait révélé que le **guide en prose** et les **formules du classeur Excel** de la V3 ne définissaient pas les mêmes seuils. **La direction a tranché : les formules du classeur font foi.** Le moteur applique donc les seuils Excel — Très favorable dès **S ≥ 1** sans négatif · Pas du tout favorable dès **S ≤ −1** sans positif · Recommandée dès **1** dimension favorable. Effet : **5 recommandations de référence du classeur V3 changent** par rapport aux seuils du guide (voir audit §6). Règles vérifiées bout-à-bout contre le classeur : **112/112** appréciations et **28/28** recommandations reproduites exactement.

## 1. L'échelle de cotation

Chaque répondant municipal cote **36 mesures** sur **23 questions** regroupées en **4 dimensions** :

| Dimension | Questions |
|---|---|
| Potentiel fiscal | 3 (pf1-pf3) |
| Saine gestion administrative | **7** (sg1-**sg7**) |
| Acceptabilité et équité | 7 (ae1-ae7) |
| Efficacité environnementale | 6 (ee1-ee6) |

Réponses possibles : **+1** (favorable) · **0** (neutre) · **−1** (défavorable) · **pas de réponse** (la question est simplement ignorée dans la somme — c'est ce qu'il faut choisir quand on ne sait pas, plutôt que « neutre »). Chaque question porte une **boussole** (« + signifie… / − signifie… ») affichée sous son libellé. Depuis la V4, plus aucune question n'est à polarité inversée ; la boussole reste affichée pour lever les ambiguïtés de degré, et `sg7` en affiche aussi le sens du **0** (« jamais étudiée »), seul critère dont la grille écrit les trois valeurs.

## 2. Des réponses à l'appréciation d'une dimension (`apprec`)

**S** = somme des réponses données dans la dimension (les questions sans réponse sont ignorées).
Seuils = transcription exacte des formules du classeur V3 (fiches, col. B ; cascade `IF`), doctrine du 16 juill. 2026.

| Condition (dans l'ordre)                     | Appréciation          |
| -------------------------------------------- | --------------------- |
| S = 0 (ou aucune réponse)                    | Neutre                |
| aucune réponse positive **et** S < 0         | Pas du tout favorable |
| S < 0 (avec au moins une réponse positive)   | Peu favorable         |
| S > 0 **et** au moins une réponse négative   | Favorable             |
| S > 0 **et** aucune réponse négative         | Très favorable        |

Cas limites à connaître :
- **S = +1 sans négatif** → Très favorable (le seuil Excel démarre à **+1**, non à +2 comme dans le guide).
- **S = −1 sans positif** → Pas du tout favorable (le seuil démarre à **−1**, non à −2) — et un seul « Pas du tout favorable » suffit à rendre la mesure « Non recommandée » (§3).
- **S > 0 avec au moins un −** → Favorable seulement : le négatif bloque le « Très favorable ».
- **S < 0 avec au moins un +** → Peu favorable seulement (symétrique).
- **Dimension entièrement sans réponse** → traitée comme Neutre dans le calcul de la recommandation (l'interface affiche « À coter »).

## 3. Des 4 appréciations à la recommandation (`reco`)

| Condition (dans l'ordre)                                                         | Recommandation      |
| -------------------------------------------------------------------------------- | ------------------- |
| ≥ 1 « Pas du tout favorable » **ou** ≥ 2 « Peu favorable »                       | **Non recommandée** |
| aucun « Peu / Pas du tout favorable » **et** ≥ 1 dimension favorable (F ou TF)   | **Recommandée**     |
| tout le reste (un seul « Peu favorable » ; ou tout-Neutre)                       | **Mise à l'étude**  |

Concrètement (seuil Excel) : la « recommandée » ne demande plus qu'**une seule** dimension favorable (au lieu de deux) sans aucune pénalité. La « mise à l'étude » recueille : un seul « Peu favorable » (même accompagné de dimensions favorables) ; le cas tout-neutre (aucune favorable, aucune pénalité).

> **Traçabilité :** règle transcrite de la formule `Synthèse!F` du classeur V3 (cascade `COUNTIF`), doctrine du 16 juill. 2026. Vérifiée sur les **28 recommandations réelles** du classeur (28/28). Auparavant, le guide exigeait ≥ 2 dimensions favorables — seuil écarté.

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
| 4 | ~~Seuils d'appréciation / recommandation (§2-§3)~~ **RÉSOLU (16 juill. 2026)** | seuils du classeur Excel | doctrine tranchée par Jérôme : le classeur fait foi (audit §6) |
| 5 | Agrégation ville (§4) | moyenne arrondie | médiane |
| 6 | Boussole ae7 (abordabilité) et ae2 (alternatives) | polarité proposée au Bloc boussole | confirmer le sens attendu |
| 7 | Mesures « non applicables » à une ville | aucun statut « N/A » (0 = neutre) | introduire un vrai N/A ? (ae7 dit « lorsqu'applicable ») |
| 8 | Agrégation ville du préalable (§7) | **un seul** répondant qui déclare « déjà en place » suffit | exiger la majorité des répondants de la ville |
| 9 | Effet du préalable sur la synthèse MRC (§7) | les villes « déjà en place » **sortent du vote** (comptées à part) | les compter comme « recommandée » (mesure validée par la pratique) |

## 7. Question préalable : « la mesure est-elle déjà en place ? » (V4)

Avant les 23 questions, chaque mesure pose une question **oui / non** : *« Est-ce que la mesure est déjà implantée ou en voie de l'être ? »*

- **Oui** → l'analyse multicritère **n'a pas d'objet** pour cette municipalité : les 23 questions sont masquées, aucune appréciation ni recommandation n'est calculée, et la mesure prend le statut distinct **« Déjà en place »** (pastille laiton `I` dans le Portrait). Seul un **commentaire** est recueilli : ce qu'il y aurait à *modifier ou améliorer*.
- **Non** (ou pas de réponse) → parcours normal.
- La réponse se stocke comme une réponse ordinaire, sous le critère **`impl`** (cote 1 = oui, 0 = non), mais `impl` **n'appartient à aucune dimension** : il n'entre dans aucune somme. Les cotes déjà saisies avant un « oui » sont **conservées** et redeviennent actives si le répondant revient à « non ».
- **Agrégation ville** : la mesure est réputée en place dès qu'**un** répondant de la ville l'affirme — c'est un *fait* vérifiable, pas une opinion à moyenner (à valider, §6 point 8).
- **Synthèse MRC** : les villes « déjà en place » sont **retirées du vote de majorité** et comptées séparément (`cc.impl`). Si toutes les villes ayant répondu l'ont déjà en place, la synthèse affiche « Déjà en place » (à valider, §6 point 9).

---
*Document produit au Bloc 2 du plan de travail (extraction du moteur `rules.js`). Toute modification des règles doit passer par `rules.js` + la suite de tests, puis être reflétée ici.*
