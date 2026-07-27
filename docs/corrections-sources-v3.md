# Journal des corrections textuelles — sources V3 (guide Word + classeur Excel)

**Date :** 22 juillet 2026
**Originaux (intacts) :** `sources/Outil d'aide à la décision_V3.docx` · `sources/Grille d'analyse multicritère_V3.xlsx`
**Copies corrigées** (créées comme « V3 (corrigé 2026-07-22) », **renommées V4** par Vincent le 22 juill.) :
- `sources/Outil d'aide à la décision_V4.docx` — **avec suivi des modifications Word** (révisions attribuées à « Vincent Duguay », 22 juill. 2026 — sans mention de Corda, le document étant destiné au MAMH) : ancien texte barré, nouveau texte inséré, chaque changement acceptable ou refusable dans Word.
- `sources/Grille d'analyse multicritère_V4.xlsx` — copie **cumulative** : part de la copie du 17 juillet (corrections mécaniques, voir `corrections-classeur-v3.md`), y applique les mêmes corrections textuelles (feuille « Guide aide à la décision ») et ajoute le **critère SG « Historique »** (section C).

> **Portée.** Trois familles de corrections : (a) **réécriture en polarité positive des 7 questions à valeur inversée** (pf3, sg1, sg4, sg5, ae3, ae6, ae7) — un « oui » y était *défavorable* ; les questions sont reformulées pour qu'une réponse affirmative soit toujours favorable (+1), dans le sens « + » de la boussole de l'application ; (b) une correction grammaticale (ae1) ; (c) l'alignement de la prose des règles de décision sur la **doctrine tranchée le 16 juillet 2026** (Jérôme : *le classeur Excel fait foi* — voir `audit-fidelite-v3.md` §6).
>
> **Les cotes existantes du classeur ne sont pas affectées** : les analystes ont saisi directement des notes −1/0/+1 (pas des oui/non) ; la réécriture change la formulation des questions, pas la signification des notes.

---

## A. Réécriture des 7 questions à polarité inversée (Word §2 / Excel `Guide!`)

| # | Question (Word ¶ / Excel cellule) | Avant (polarité inversée — barré) | Après (polarité positive — inséré) |
|---|---|---|---|
| 1 | **pf3** — Marge de manœuvre (¶20 / `A21`) | « En considérant le contexte de compétitivité fiscale de la Ville **de Gatineau**, le taux de prélèvement actuel sur cette assiette fiscale peut-il être considéré comme étant déjà élevé ? » | « En considérant le contexte de compétitivité fiscale de la Ville, le taux de prélèvement actuel sur cette assiette fiscale est-il suffisamment bas pour laisser une marge de manœuvre ? » *(intègre la généricisation Gatineau → Ville)* |
| 2 | **sg1** — Coûts d'administration (¶24 / `A25`) | « Un prélèvement supplémentaire… nécessiterait-il des ressources… dont le coût peut être considéré comme étant élevé ou même prohibitif ? » | « Un prélèvement supplémentaire… peut-il être administré avec des ressources… dont le coût peut être considéré comme étant faible ou raisonnable ? » *(la sous-question « Par exemple, le processus de perception… », déjà en polarité positive, est conservée)* |
| 3 | **sg4** — Conformité réglementaire (¶27 / `A28`) | « La mesure entre-t-elle en contradiction avec des réglementations ou des politiques actuellement en vigueur ? La mesure nécessite-t-elle la création d'un nouveau régime de réglementation ou une modification de la réglementation actuelle ? » | « La mesure est-elle compatible avec les réglementations et les politiques actuellement en vigueur, sans nécessiter la création d'un nouveau régime de réglementation ni une modification de la réglementation actuelle ? » |
| 4 | **sg5** — Contestation judiciaire (¶28 / `A29`) | « La mesure possède-t-elle un risque de contestation judiciaire ? » | « Le risque de contestation judiciaire de la mesure est-il faible ou nul ? » |
| 5 | **ae3** — Personnes vulnérables (¶36 / `A36`) | « La mesure a-t-elle un impact financier plus important auprès des personnes vulnérables ? » | « La mesure évite-t-elle un impact financier plus important auprès des personnes vulnérables ? » |
| 6 | **ae6** — Équité territoriale (¶39 / `A39`) | « La mesure a-t-elle potentiellement un impact plus important pour les contribuables de certains secteurs de la municipalité ? » | « L'impact de la mesure est-il réparti uniformément entre les contribuables des différents secteurs de la municipalité ? » |
| 7 | **ae7** — Abordabilité (¶40 / `A40`) | « Lorsqu'applicable, la mesure a-t-elle un effet sur l'abordabilité des logements ? » | « Lorsqu'applicable, la mesure préserve-t-elle ou améliore-t-elle l'abordabilité des logements ? » *(polarité conforme à la boussole B1 du dossier de validation)* |

## B. Autres corrections textuelles

| # | Emplacement (Word ¶ / Excel cellule) | Avant | Après | Nature |
|---|---|---|---|---|
| 8 | Question **ae1** (¶34 / `A34`) | « …supérieur à celui **dont** on pourrait s'attendre… » | « …supérieur à celui **auquel** on pourrait s'attendre… » | Correction grammaticale |
| 9 | Seuil **Très favorable** (¶58 / `A62`) | « La somme… est **supérieure à 1** » | « La somme… est **égale ou supérieure à 1** » | Alignement prose → formule Excel (doctrine 16 juill.) |
| 10 | Seuil **Favorable** (¶59 / `A64`) | « La somme… est **égale ou supérieure à 1** » | « La somme… est **supérieure à 0** » | Alignement prose → formule Excel (doctrine 16 juill.) |
| 11 | Seuil **Pas du tout favorable** (¶62 / `A70`) | « La somme… est **inférieure à − 1** » | « La somme… est **égale ou inférieure à − 1** » | Alignement prose → formule Excel (doctrine 16 juill.) |
| 12 | Seuil **Recommandée** (¶71 / `A79`) | « **Au moins deux dimensions obtiennent**… » | « **Au moins une dimension obtient**… » | Alignement prose → formule Excel (doctrine 16 juill. ; divergence n° 3 de l'audit) |

## C. Ajout du critère « Historique » (Saine gestion administrative) — Excel seulement

**Question ajoutée** (liste SG du Guide, nouvelle puce A31) : « La mesure a-t-elle été récemment mise à l'étude par la municipalité? Barème : mesure récemment mise à l'étude = note positive (+1) ; mesure non étudiée = neutre (0) ; mesure étudiée puis rejetée = note négative (−1). (Historique) ». Demande de Vincent, 22 juill. 2026 (barème précisé le même jour — la polarité n'est plus ambiguë).

Mécanique (le critère devient le 7e de la dimension SG, **ligne 14** de chaque fiche) :
- **28 fiches** : ligne 14 insérée (`A14` = « Historique », `B14` **vide** — non coté ; tant que la cellule est vide, les formules SUM/MIN/MAX l'ignorent et l'appréciation SG est inchangée) ; formule SG étendue (`B8:B13` → `B8:B14`) ; formules AE et EE réécrites pour leurs nouvelles positions (`B16` sur `B17:B23`, `B25` sur `B26:B31`) ; mise en forme conditionnelle décalée (`B2 B7 B16 B25`).
- **Analyse multicritère** : ligne 14 insérée et **miroir régénéré ligne à ligne** (27 colonnes × lignes 2-31, chaque ligne *r* pointe vers `B{r}` de sa fiche).
- **Synthèse** : 56 renvois mis à jour (AE `B15`→`B16`, EE `B24`→`B25` pour chaque mesure) ; le correctif du 17 juill. (`Synthèse!C4`→`C7`) vérifié conservé.
- Contrôles : 32 feuilles, 68 blocs de MFC, recalcul forcé à l'ouverture ; ouverture LibreOffice sans erreur.

**Incident corrigé (référence circulaire).** La colonne **V** de l'Analyse multicritère (« Redevances de développement ») est un cas particulier du classeur d'origine : ses cotes sont **saisies directement** dans la colonne (pas de renvoi à sa fiche) avec des formules d'appréciation locales. L'insertion de la ligne 14 a décalé ces formules sans ajuster leurs plages — `V16` sommait `V16:V22` (lui-même) et `V25` sommait `V25:V30` : Excel signalait des **références circulaires** à l'ouverture. Corrigé (plages `V8:V14`, `V17:V23`, `V26:V31`) ; balayage complet du graphe de dépendances des 1123 formules : **aucun cycle restant** (l'original V3 n'en avait aucun — la boucle venait de l'insertion).

**Constat préexistant (non touché) :** 3 fiches n'ont **aucune colonne** dans l'Analyse multicritère ni de ligne dans la Synthèse — *Redevance d'amusement, Redevance d'hébergement touristique, Taxe sur les panneaux d'affichage*. Elles étaient déjà absentes de l'agrégation dans le classeur d'origine (leurs colonnes faisaient vraisemblablement partie des `#REF!` purgés le 17 juill.). À recâbler si ces mesures doivent réapparaître dans la synthèse.

**Non modifié (assumé) :** l'énumération « Mise à l'étude » du §4 reste telle quelle — son incomplétude est documentée (dossier de validation, point A6 ; audit §2, note) et résolue côté application. Les « allègements typographiques » de l'app (audit §4) ne sont pas reportés : choix d'interface, pas des corrections.

## ⚠️ À arrimer

1. **Validation scientifique des reformulations.** Les 7 nouvelles formulations sont dérivées du sens « + » de la boussole de l'application ; elles reformulent des questions de la grille scientifique V3 (dir. Pre Tremblay-Racicot). À faire valider par la direction scientifique avant diffusion externe.
2. **Cohérence app ↔ sources.** L'application (`rules.js`) affiche toujours les questions **d'origine** (verbatim V3) avec la boussole +/−, et compte **22 critères** — le critère « Historique » n'y existe pas (ni dans `methodologie.md`, le dictionnaire de données, les Edge Functions ou les 29 tests). Si la V4 est entérinée : aligner le moteur (23 critères, sg7) et les questions, ou documenter l'écart.
3. **Le critère « Historique » n'est pas dans le Word V4** — la question vit dans l'Excel (Guide + fiches) ; ajouter la puce au §2.2 du guide Word si la V4 est entérinée.

## Note de traçabilité

Le 17 juillet, les seuils §3 avaient été corrigés **directement dans le Word original** (sans copie), lors de l'alignement du moteur sur la doctrine. Le 22 juillet, l'original a été **restauré depuis le dépôt Git** et l'ensemble des corrections reportées sur la copie datée, en révisions marquées. Les deux originaux V3 sont donc intacts sur le poste et dans le dépôt.

## Contrôles effectués

- **Word** : relecture programmatique — les 12 corrections lues « révisions acceptées » redonnent exactement le texte cible ; conversion PDF LibreOffice réussie (structure valide).
- **Excel** : 12/12 corrections en place ; 32 feuilles et 68 blocs de mise en forme conditionnelle conservés ; recalcul complet forcé à l'ouverture (`fullCalcOnLoad`).

*Corrections appliquées par script (python-docx 1.2.0 / openpyxl 3.1.5) ; reproductibles sur demande (`scratchpad/rewrite_questions.py`).*
