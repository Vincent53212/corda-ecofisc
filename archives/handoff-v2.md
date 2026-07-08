# MRC Thérèse-De Blainville — Handoff v2 (révision)
## Note de révision du handoff initial, en vue du plan d'implémentation

**Statut**: révision du handoff v1 (`handoff-v1.md`) après séance de challenge avec Claude Code.
**À utiliser comme**: pont entre le brainstorm v1 et le plan d'exécution. Les renvois pointent vers les sections de v1.
**Tonalité**: même esprit que v1 — note à plusieurs voix.
**Date**: 2026-06-16. **MAJ**: revampée autour du cadrage stratégique réel — **l'app = outil-conseil / moat ; publication = porte ouverte, pas moteur**.
**Ce qui change vs v1**: cadrage stratégique explicite (§0), différenciateur à deux couches, 4 révisions structurantes, publication démotée et allégée, **question de propriété/IP ajoutée et placée en tête**, carte des décisions + questions de cadrage.

---

## 0. Cadrage stratégique — pourquoi cette app existe

*(Absorbe les annotations marginales de Vincent : c'est désormais la colonne vertébrale du document.)*

**Le problème que l'app résout.** Le chiffrier Excel initial a été produit dans un **mandat public** → il **sera diffusé**. Une fois public, c'est une *commodité* : n'importe qui (firmes privées incluses) peut se l'approprier. Fanny veut une app pour **préserver l'avantage consulting** : aller *au-delà du chiffrier* en se dotant d'un **véritable assistant de la démarche-conseil**, pour que même si les *données* deviennent publiques, la *manière de travailler* reste à vous.

**Conséquence sur le positionnement.** Le moat n'est pas la *donnée* (publique, commoditisée) — c'est la **démarche encodée** : le workflow d'analyse + d'orchestration. L'app doit encoder *la méthode*, pas ré-héberger le chiffrier.
*Commentaire de Vincent: en fait ce serait même pas si grave de just ré-héberger le chiffrier, même si c'est pas l'objectif — c'est très niché comme domaine et on est déjà reconnus comme les experts.*

**Publication.** Porte gardée ouverte, **pas le moteur**. La priorité est l'outil-conseil. *(Bonne nouvelle : ça retire du scope — voir §3 bis.)*

**⚠️ Le hic existentiel à régler avant tout.** Un moat logiciel n'en est un que si **la propriété de l'app vous appartient** — pas au mandat public qui la finance. Or le « budget app 16k » (v1 §1) : s'il vient du mandat, l'app risque d'être un *livrable du mandat public*… donc diffusable elle aussi → **même problème que le chiffrier, moat = zéro**. Deux structurations propres pour que ça tienne :
1. L'app est **votre outil de production privé** (IP préexistante / indépendante) que vous *utilisez* pour livrer ; le mandat paie le **service**, pas l'outil. Livrable public = chiffrier + rapport ; l'app reste à vous. *Commentaire de Vincent: oui c'est à nous
2. L'app est **licenciée** au mandat, sans transfert de propriété.

Caveat honnête : « une app » n'est pas, en soi, un moat — d'autres ont Claude Code aussi. Le vrai moat = **méthode + relations + premier entrant** ; l'app est le *véhicule*. Ça pèse sur *où* tu investis : **la méthode encodée > le vernis logiciel**. → question **C1**.

---

## 1. Le différenciateur (raffiné) — à deux couches

1. **Couche catégorie** : IA + délibération structurée → **premier entrant** dans le secteur municipal québécois. Inédit, point — c'est ce qui te rend *visible et neuf*. (Tu avais raison de pousser là-dessus.)
2. **Couche défendabilité** : **ancrage-incidence** — les villes cotent des instruments dont l'incidence distributive sur *leurs propres parcelles* est **calculée**, pas des opinions à blanc. C'est ce qui te sépare d'un Polis municipal générique et ce qui reste *non-copiable* une fois la catégorie connue.

*(Marché académique, désormais secondaire : la lignée méthodo existe — Polis/vTaiwan, Ovadya, Delphi. Pertinent uniquement si tu marches un jour vers la publication, et seulement pour ne pas sur-claimer l'invention. Pas un moteur de design.)*

---

## 2. Révisions structurantes

### R1 — Auditer la posture d'honnêteté contre elle-même
*(v1 §2, §3.1 #2 et #3.)* — **inchangée, et encore plus importante** : la crédibilité-conseil repose là-dessus.

- **Recette vs comportement.** On ne peut pas sortir le comportement du périmètre ET promettre une recette « précise » : pour tout instrument *incitatif* (= ceux qui ont un sens dans un plan climat), la recette **est** fonction de la réponse comportementale (un écofrais qui marche érode son assiette). → reformuler en « **incidence mécanique à t=0, comportement neutre** » + étiqueter le sentier dynamique comme incertain ; distinguer dans l'UI instruments *purement fiscaux* (recette = point) vs *incitatifs* (recette = bande).
- **Incidence ≠ revenu.** Le calculateur d'incidence projette « par décile (proxy AD/valeur médiane) », mais valeur foncière ≠ revenu (propriétaire âgé *asset-rich/income-poor*). Le proxy AD = **inférence écologique**, faible là où on en a le plus besoin (progressivité). → calculer sur la **distribution de valeur foncière** (défendable) ; progressivité-revenu en couche séparée et flaggée. → question **D1**.

### R2 — Le chemin critique, c'est les données, pas le code
*(v1 §5, §8.)*

Obtenir le rôle d'évaluation de 7 villes (formats hétérogènes, accès à négocier) est une tâche **organisationnelle à latence externe**, pas une tâche de dev que tu contrôles. Si 2 villes traînent, le dogfood semaine-2 saute.
- **Demande de données** = **geste #1, semaine −1**, en parallèle (gabarit de schéma + note aux 7 DG). → question **B3**.
- Build **100 % sur synthétique** sur ce schéma ; le réel est un *swap-in*.
- **Fiscal-first** — justification mise à jour pour le cadrage moat : on mène avec le module fiscal+incidence non plus « pour la base empirique du papier », mais parce que c'est (a) une **capacité-conseil différenciée** que le chiffrier public ne confère pas, (b) **démontrable tout de suite**, (c) la **seule partie qui ne dépend pas** de la coopération des 7 villes. Forum complet à 5 agents → **Phase 1.5**. → question **A1**.

### R3 — Propriété + juridique : la grille d'entrée *(reworké)*
*(v1 §6, §7 #5.)* — **scindé**, parce que retirer la publication comme moteur change la nature du gate.

- **Gate réel (semaine 0)** — même pour un outil purement consulting : (a) **propriété/IP de l'app** (§0 — *le* point) ; (b) **Loi 25** + **consentement à l'usage** des données des villes + **résidence des données** (ré-identifiables à N=7). Ça détermine ce que tu as le droit de collecter et où ça vit.
- **Différé / conditionnel** — **CER ENAP + consentement à la publication** : requis *seulement si* tu publies. Tu ne publies pas maintenant → on **sort le CER du chemin critique** (gain de temps réel), tout en gardant la porte ouverte via §3 bis.

### R4 — La lisibilité qui durcit : contrainte de design de premier ordre
*(v1 §10.)* En rendant le désaccord lisible, écrit, persistant, ré-attribuable à 7, l'outil peut **cristalliser** des positions qu'une facilitation orale aurait gardées fluides — *l'inverse* de ta proposition de valeur, et ça vaut pour la **qualité du résultat-conseil** indépendamment de toute publication. → cartographie volontairement basse-résolution et provisoire ; privilégier l'**élaboration conditionnelle** sur la cotation de position ; **ne jamais persister** « Ville X a dit non », seulement « voici les conditions où le groupe converge ».

> **Note publication (option, pas moteur)** — *remplace l'ancienne révision « descriptif > causal ».* Si un jour tu publies : ne sur-claime pas la causalité du delta R1→engagement (N=7, pas de contrôle, rondes façonnées → desk-reject) ; cadrage **descriptif** (« on a instrumenté et rendu lisible un processus ») > causal. **Mais rien à bâtir pour ça maintenant.**

---

## 3. Ce qui se confirme — ne pas toucher

Build vs cycle opérationnel · travail éditorial budgété · **framing constructif R2** (le cœur de l'innovation) · **red-teamer** *(recadré : garde-fou de **crédibilité-conseil**, plus « légitimité académique »)* · ne jamais couper l'incidence (sous R1) · anonymat exploratoire → commitment public.

## 3 bis. Overlay publication — démoté et allégé
v1 §9 le disait « non négociable, 30 min/jour ». Recadrage : publication = option → **journal léger** (1 ligne de décision/jour + export des conversations) = assurance *bon marché* qui garde la porte ouverte. **Ne pas** bâtir l'infra de recherche lourde (apparat de mesure du delta, captation rigoureuse pour reviewers) tant que la porte n'est pas franchie. → **retire du scope**, ce qui aide le 16k / 3-4 sem.

---

## 4. Carte des décisions — mise à jour

| # | Décision | Statut | Défaut |
|---|----------|--------|--------|
| 1 | **Propriété/IP de l'app** (vs mandat public qui finance) | **gate sem. 0 — dominant** | App = outil de production privé Vincent/Fanny ; le mandat paie le service, pas l'outil |
| 2 | Ordre de build | recommandé-lock | Fiscal+incidence Phase 1 ; forum à 5 agents Phase 1.5 |
| 3 | Audience Phase 1 | **résolu par le cadrage** | **Interne** (assistant de *votre* démarche) — toi+Fanny d'abord |
| 4 | Stack | conditionné par #3 | Streamlit (interne, expert-facing) |
| 5 | Loi 25 / consentement-usage / résidence | gate sem. 0 | DuckDB local tant que zéro verbatim réel ; trancher après avis Loi 25 |
| 6 | CER + consentement-publication | **différé / optionnel** | Hors chemin critique ; journal léger garde la porte |
| 7 | Grille écofisc 4-dim | **déjà existante (à confirmer)** | Réutiliser la grille de l'Excel : Potentiel fiscal · Saine gestion admin. · Acceptabilité et équité · Efficacité environn. |
| 8 | Short-list d'instruments | ouvert (Fanny + lit-review) | 2-3 canoniques, ajouts incrémentaux |

---

## 5. Questions pour Vincent — à répondre (ça cadre le plan)

### A — Périmètre & séquencement
- **A1.** Fiscal-first confirmé (forum complet en Phase 1.5)? Défaut : oui. *Commentaire de Vincent: Oui.*
- **A2.** Audience Phase 1 = **interne** (toi+Fanny) — le cadrage « assistant de notre démarche » le résout dans ce sens. Tu confirmes, ou tu vois un usage villes-self-service plus tôt? *Commentaire de Vincent: Oui je confirme, c'est plus payant et moins risqué this way.

### B — Technique & données
- **B1.** Streamlit pour Phase 0-1 (interne)? *Défaut : oui ; on rediscute si self-service villes.*
- **B2.** Stockage : DuckDB local d'abord, trancher Postgres après l'avis Loi 25? *Commentaire de Vincent: On doit parler du format (standalone, webapp, etc), du language, etc tout ça est sa propre discussion et c'est prioritaire.
- **B3.** Qui possède la demande de rôle aux 7 DG, et **peut-elle partir cette semaine**? *(Je te rédige gabarit + note aujourd'hui si tu veux.)* 

> **Réponse B3 — la demande aux 7 DG n'est probablement PAS le chemin critique : le rôle est en données ouvertes.** — *Claude (Claude Code), 2026-06-18*
>
> En reprenant la méthode du dossier téléphérique Québec–Lévis (où on a bâti l'incidence par parcelle à partir du rôle), j'ai vérifié : le rôle d'évaluation foncière des 7 villes n'est **pas** à négocier ville par ville. Il est publié, **géoréférencé et standardisé**, dans un **dépôt provincial unique** du MAMH (Données Québec / `donneesouvertes.affmunqc.net/role/`) — un seul GeoPackage couvrant « l'ensemble des rôles d'évaluation des municipalités du Québec » (~1 140 rôles). On extrait chaque ville en filtrant le champ **`code_mun`**.
>
> **Codes `code_mun` vérifiés** (recoupés SGC StatCan ↔ code géographique MAMH, + fiche MAMH pour Boisbriand) :
>
> | Municipalité | `code_mun` (filtre rôle) | Code SGC |
> |---|---|---|
> | Boisbriand | **73005** | 2473005 |
> | Sainte-Thérèse | **73010** | 2473010 |
> | Blainville | **73015** | 2473015 |
> | Rosemère | **73020** | 2473020 |
> | Lorraine | **73025** | 2473025 |
> | Bois-des-Filion | **73030** | 2473030 |
> | Sainte-Anne-des-Plaines | **73035** | 2473035 |
>
> Les 7 sont des villes à **cadastre rénové** (banlieue, Laurentides) → présentes dans la version **géoréférencée**, pas seulement les XML. Confiance élevée : le dépôt se déclare exhaustif et j'ai déjà extrait une grande ville (Lévis, `25213`) du **même** GeoPackage. Seul reliquat non fait : tirer le zip (~542 Mo → GPKG ~2,8 Go) pour confirmer les 7 codes octet par octet — ~30 min, je le fais sur un mot.
>
> **Champs utiles par parcelle** (table `b05v_unite_evaln`, jointe à la géométrie `rol_unite_p` par le matricule `mat18`) : `rl0105a` = **CUBF** (usage), `rl0302a` = superficie, `rl0306a` = étages, `rl0311a` = nb logements, `rl0404a` = **valeur immeuble** (+ terrain/bâtiment). C'est exactement la matière première de l'**incidence par parcelle** (couche-2 défendabilité, §1).
>
> **Conséquence sur R2 / le chemin critique.** La prémisse de R2 (« obtenir le rôle de 7 villes = tâche organisationnelle à latence externe ») **tombe en grande partie** : le rôle est un *swap-in* immédiat, pas une négociation → on peut **construire sur données réelles tout de suite**, sans attendre la coopération des DG. La « demande aux 7 DG » devient **optionnelle / de confort** — utile seulement pour des champs **hors rôle public** (identité des propriétaires, comptes de taxes détaillés), qui eux restent à négocier **et déclenchent la Loi 25** (cf. C2). À noter : pour Thérèse-De Blainville, l'**OMRE est souvent la MRC elle-même** → un seul interlocuteur, pas sept, si jamais on veut le non-public.

> **Réponse B3 bis — croisement avec le revenu (StatCan, aire de diffusion) : faisable, mais c'est LUI le vrai enjeu de données, pas le rôle.** — *Claude (Claude Code), 2026-06-18*
>
> Le rôle donne la **valeur**, jamais le **revenu** — cœur du caveat **R1 « incidence ≠ revenu »** et de **D1**. Le revenu vient de StatCan, et la plus fine géographie standard **diffusée librement** est l'**aire de diffusion (AD)** (~400-700 personnes). Deux ingrédients, gratuits et ouverts :
> 1. **Profil du recensement 2021 à l'AD** — revenu médian/moyen des ménages (avant/après impôt), déciles, prévalence du faible revenu (MFR-ApI), **mode d'occupation (propriétaire/locataire)**, valeur des logements, taux d'effort. (`www12.statcan.gc.ca`, téléchargement en lot.)
> 2. **Fichier des limites des AD 2021** (StatCan 92-169-X) pour la jointure spatiale.
>
> **Méthode de croisement** : point-dans-polygone — chaque parcelle du rôle (point) → son AD → on lui attache les attributs de revenu de l'AD ; puis, par instrument, charge par parcelle (depuis le rôle) confrontée à la distribution de revenu des AD.
>
> **⚠️ Trois pièges à encoder explicitement** (sinon l'analyse d'impact sur-claime) :
> - **Inférence écologique.** Attribuer le revenu *médian de l'AD* à chaque parcelle suppose l'homogénéité intra-AD — exactement le point R1. → présenter le revenu comme **contexte de quartier**, jamais comme revenu du ménage de la parcelle.
> - **Propriétaire ≠ résident.** Le revenu StatCan décrit qui *habite* ; l'instrument frappe qui *possède*. Concordant pour le résidentiel **occupé par le propriétaire**, faux pour le locatif/commercial (revenu du locataire ≠ celui du bailleur). → le **CUBF + le mode d'occupation de l'AD** permettent de **restreindre la couche revenu au résidentiel-propriétaire** (où résident≈propriétaire) et de **flagger le reste** — raffinement concret que le CUBF rend possible.
> - **Incidence économique ≠ légale.** Une redevance/hausse sur du locatif est partiellement **répercutée sur le locataire** → la distribution « par propriétaire » ne dit pas qui *porte* la charge. À signaler ; hors d'un calcul mécanique à t=0 (cohérent avec R1 : « incidence mécanique à t=0, comportement neutre »).
>
> **Recommandation (aligne le défaut D1 « valeur foncière d'abord ») — trois couches, du plus défendable au plus inféré :**
> 1. **Distribution de valeur foncière** (rôle seul, **zéro inférence**) — couche primaire, c'est la couche-2 défendable du moat.
> 2. **Contexte-revenu par AD** (jointure spatiale, **flaggé inférence écologique**, restreint au résidentiel-propriétaire) — « charge en % du revenu médian local », jamais un revenu individuel.
> 3. **Progressivité-revenu fine** (déciles réels par ménage) — **n'existe pas en open data sous l'AD** ; exigerait T1FF / tabulations sur mesure StatCan (payant, Community Data Program) → **option flaggée, hors chemin critique** (confirme le défaut D1).
>
> **Caveat données 2021** : non-réponse globale plus élevée en 2021 ; pour les petites AD, **suppression/arrondi** fréquents → prévoir le repli des AD supprimées vers le **secteur de recensement**. En contrepartie, le revenu 2021 est largement **issu du couplage fiscal ARC** → bonne qualité là où il n'est pas supprimé.
>
> *Net : la donnée qui pilote vraiment l'analyse d'impact n'est pas le rôle (ouvert, immédiat) mais le revenu — et là, le travail n'est pas une négociation, c'est un **choix méthodologique assumé** (AD-contexte flaggé vs. tabulation fine payante). → voir R1 et D1.*

### C — Propriété, juridique & données *(le bloc qui a le plus changé)*
- **C1. (dominante)** À qui appartient l'app, vu que le mandat public la finance (16k)? As-tu déjà clarifié avec Fanny / ENAP qu'elle reste **votre** outil et non un livrable diffusable? **Toute la logique du moat en dépend** — c'est la première chose à verrouiller. *Commentaire de Vincent: Elle nous appartient.
- **C2.** Loi 25 + consentement à l'**usage** des données des villes pour un outil-conseil (≠ publication) : qui valide côté ENAP? *Commentaire de Vincent: à valider mais pour l'instant c'est version test sur données publiques donc ça va.
- **C3.** Publication = porte ouverte → OK pour un **journal léger** (cheap insurance) sans infra de recherche lourde? *Défaut : oui.* *Commentaire de Vincent: oui

### D — Méthode & substance fiscale *(inchangé)*
- **D1.** Progressivité-revenu *load-bearing* pour le pitch, ou on mène avec distribution de valeur foncière + inférence flaggée? *Défaut : valeur foncière d'abord.* *Commentaire de Vincent: Les deux comptent
- **D2.** Grille 4-dim : une grille écofisc **existe déjà** dans le livrable Excel (*Potentiel fiscal · Saine gestion administrative · Acceptabilité et équité · Efficacité environnementale*, cotée +1/0/−1). On confirme que l'app **réutilise celle-là** plutôt que d'en inventer une? *Défaut : oui, on s'aligne sur la grille existante.*
- **D3.** Instruments : candidats déjà en tête (p. ex. redevances de développement du dossier téléphérique), ou ça attend la lit-review Tremblay-Racicot? Combien au tour 1? *Commentaire de Vincent: On en parle plus en détail verbalement

---

*Une fois A→D répondues, je transforme ça en **plan d'implémentation séquencé** (semaines −1 à 4, chemin critique données, jalons de dogfood).*
