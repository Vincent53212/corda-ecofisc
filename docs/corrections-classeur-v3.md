# Journal des corrections — classeur « Grille d'analyse multicritère V3 »

**Date :** 16 juillet 2026
**Fichier source (intact) :** `sources/Grille d'analyse multicritère_V3.xlsx`
**Copie corrigée :** `sources/Grille d'analyse multicritère_V3 (corrigé 2026-07-17).xlsx`
**Méthode :** corrections appliquées par script (openpyxl 3.1.5) sur une **copie** ; l'original n'est pas modifié.

> **Suite (22 juill. 2026) :** une copie **cumulative** `…(corrigé 2026-07-22).xlsx` reprend ces corrections mécaniques et y ajoute les corrections textuelles (questions pf3/ae1, seuils §3-§4). Journal : `corrections-sources-v3.md`. La présente copie du 17 juillet est conservée pour la traçabilité.

> **Portée.** Ce journal ne couvre que les **erreurs mécaniques** du classeur (références, cellule vide) — celles qui ne demandent aucun arbitrage. La question de **doctrine des seuils** (guide en prose vs formules Excel) a été tranchée séparément par Jérôme le 16 juillet : *le classeur fait foi*. Les formules du classeur étant déjà la doctrine retenue, **elles ne sont pas modifiées** ; c'est l'application (`rules.js`) qui a été alignée sur elles. Voir `docs/audit-fidelite-v3.md` §6 et `docs/methodologie.md`.

---

## Corrections appliquées (3)

| # | Emplacement | Avant | Après | Nature |
|---|---|---|---|---|
| 1 | `Synthèse!C4` | `='Analyse multicritère'!C2` | `='Analyse multicritère'!C7` | Référence croisée erronée |
| 2 | `'Taxe sur les espaces de station'!B1` | *(vide)* | `Taxe sur les espaces de stationnement` | Titre manquant |
| 3 | `Analyse multicritère` — colonnes J, N, S, T, U, Y, Z, AC, AE, AH (lignes 1-30) | `=#REF!` (300 cellules) | *(vidées)* | Références brisées |

### 1 — Référence croisée `Synthèse!C4`
La colonne C de la Synthèse (« Saine gestion administrative ») doit pointer vers la **ligne 7** de la colonne correspondante dans `Analyse multicritère`. Pour la mesure « Taux variés en fonction de la superficie habitable » (ligne 4), la formule pointait par erreur vers **`C2`** (ligne 2 = Potentiel fiscal) — un doublon de la cellule `B4`.
**Sans effet visible aujourd'hui** : `C2` et `C7` valent toutes deux « Très favorable ». L'erreur était **latente** — elle aurait faussé la recommandation dès que ces deux appréciations auraient divergé. Corrigée par prudence.

### 2 — Titre manquant de la fiche « stationnement »
La cellule `B1` (titre de la mesure) de la feuille *Taxe sur les espaces de station* était **vide**. Comme `Analyse multicritère!O1` la recopie, et que `Synthèse!A15` recopie `O1`, la mesure s'affichait **« 0 »** dans la Synthèse.
Corrigé à la source (la fiche `B1`), en reprenant le libellé de la mesure. Le « 0 » disparaît au recalcul.
⚠️ **À confirmer :** le titre exact « Taxe sur les espaces de stationnement » est **inféré** (nom de la feuille + catalogue) — la cellule d'origine étant vide, ajuster si le libellé officiel diffère.

### 3 — Colonnes orphelines `#REF!`
Dix colonnes de `Analyse multicritère` (J, N, S, T, U, Y, Z, AC, AE, AH) contenaient `=#REF!` sur les lignes 1 à 30 — vestiges de **feuilles de mesures supprimées**. Elles ne sont **référencées par aucune formule de la Synthèse** (qui ne lit que les colonnes vivantes).
Les 300 cellules ont été **vidées** pour retirer les erreurs.
⚠️ **Irrécupérable :** le contenu de ces colonnes ne peut **pas** être reconstitué (les feuilles sources n'existent plus). Il ne s'agit donc pas d'une restauration mais d'un **nettoyage**. Si ces mesures devaient réapparaître, il faudrait recréer leurs fiches.

---

## Contrôle de fidélité de la copie

Vérifié après réécriture (réouverture du fichier) :

- **32 feuilles** conservées (identique à l'original) ;
- **68 blocs de mise en forme conditionnelle** conservés ;
- styles de cellule (remplissages, polices) préservés ; **aucun graphique ni image** dans le classeur (rien à perdre) ;
- **recalcul complet forcé à l'ouverture** (`fullCalcOnLoad`) — les valeurs mises en cache des formules touchées se recalculent automatiquement à l'ouverture dans Excel ou LibreOffice.

> **À faire à l'ouverture :** ouvrir la copie dans Excel une fois pour laisser les formules se recalculer, puis vérifier d'un coup d'œil la ligne 15 de la Synthèse (le nom de mesure, plus « 0 ») et l'absence de `#REF!` dans `Analyse multicritère`. Un enregistrement depuis Excel régénère aussi le cache de calcul natif.

*Corrections et contrôle reproductibles sur demande (script openpyxl).*
