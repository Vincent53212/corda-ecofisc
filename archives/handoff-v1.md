# MRC Thérèse-De Blainville — Mandat écofisc + plan climat
## Note de handoff / brainstorm pour Claude Code

**Statut**: handoff après séance de cadrage avec Claude (interface web).
**À utiliser comme**: contexte initial pour la session Claude Code qui va construire le système. À lire au complet avant de partir, à challenger là où ça mérite challenge.
**Tonalité voulue**: pas un cahier des charges, une note de réflexion à plusieurs voix.
**MAJ 2026-06-16**: ajout de la couche NLP / agents pour l'orchestration (section 3.2 réécrite), mises à jour propagées au séquencement, overlay publication, thoughts ouverts et annexes.

---

## 1. Le mandat en quelques lignes

**Boss**: Fanny Tremblay-Racicot (ENAP). Experte canonique en écofisc municipale au Québec (cf. tradition CIRANO/IRÉC). Le mandat passe par elle, donc toute décision méthodologique majeure transite par elle.

**Client**: MRC Thérèse-De Blainville + ses 7 villes (Boisbriand, Blainville, Bois-des-Filion, Lorraine, Rosemère, Sainte-Anne-des-Plaines, Sainte-Thérèse). Particularité importante: **MRC et villes sont toutes autour de la table en même temps**, pas séquentiellement. Ça change la dynamique politique du mandat.

**Deux livrables imbriqués**:
1. Stratégie d'écofiscalité pour le plan climat de la MRC
2. Conseil expert sur le plan climat lui-même

**Composante coordination**: aider les 7 villes à converger vers des mesures communes/compatibles via un chiffrier multi-dimensions + une app de soutien.

**Budget app**: 16k. Effort Claude Code estimé: 3-4 semaines max.

---

## 2. Ce qui est dans le périmètre / hors périmètre

**Dans**:
- Module fiscal: designer d'instrument, projection de recettes, calculateur d'incidence distributive
- Module orchestration: forum de coordination multi-tours, anonymat exploratoire, cartographie des positions, synthèse inter-rondes
- Données: rôle d'évaluation des 7 villes (à colliger), proxies socioéco par AD, CUBF
- Visualisations: Sankey, bar charts comparatifs ville×CUBF, courbe Lorenz pour progressivité, heatmap géo, radar 6-dim

**Hors** (volontairement, et c'est défendable comme posture):
- Modélisation des effets GES des mesures (couche d'incertitude qu'on ne peut pas calibrer honnêtement avec les ressources disponibles)
- Modélisation comportementale fine (élasticités exposées mais pas calibrées rigoureusement)
- Phase 2-3 du système de coordination (générateur de paquets, simulateur de stabilité de coalition) — gardée pour un mandat de suite
- Projection 10 ans (mono-année suffit pour tour 1)

**Pitch d'honnêteté à porter au client**: "on calibre la réalité fiscale/distributive avec précision, on orchestre la conversation rigoureusement, et on assume que la réponse comportementale est incertaine et contexte-dépendante". Plus crédible que des projections GES faussement précises.

---

## 3. Architecture cible (synthèse)

### 3.1 Module fiscal — 5 sous-modules

1. **Designer d'instrument**: type (taxe, redevance, crédit, tarification incitative), assiette (CUBF visés, seuils, exemptions), taux, indexation, mode d'allocation (fonds dédié vs général).
2. **Projecteur de recettes**: total annuel, décomposition ville × CUBF, scénarios bas/central/haut.
3. **Calculateur d'incidence**: charge moyenne par décile (proxy AD/valeur médiane), courbe de progressivité, outliers, cartographie à la parcelle. *Ne jamais couper.* C'est le différenciateur éthique et la base empirique du meta-paper.
4. **Modélisateur de réponse comportementale** (light): élasticité exposée et modifiable, adoption en S. Pas calibré rigoureusement — explicite.
5. **Comparateur de scénarios**: side-by-side, optimisation sous contraintes ("trouve les params qui rapportent X sans excéder charge décile bas = Y").

### 3.2 Module orchestration / forum

**Posture**: hybride Delphi + Polis + couche NLP générative entre les rondes. Ni Delphi pur (linéaire, peu génératif), ni Polis pur (cartographie sans voie de sortie). Le mariage des deux + agents NLP qui transforment l'outil d'un *système de mesure* en un *système de production de connaissance collective*. C'est le créneau libre dans la lit de design délibératif (Polis/vTaiwan, Recursive Public d'Ovadya).

**Inspiration littéraire**:
- Delphi (RAND) pour la mécanique multi-tours + anonymat
- Polis / vTaiwan pour la cartographie NLP des positions
- Recursive Public (Ovadya) pour le *structured deliberation with adaptive prompting* — plus proche de notre design que Polis pur
- Design de mécanisme léger pour l'engagement public final

**La boucle complète (Phase 0+1 enrichie)**:

`Rating → Synthèse NLP → Dites-en plus → Rapport → Rencontre en personne → Répète sur le résiduel → Engagement public`

**Ronde 1 — Quotation à froid.** Chaque ville code -1/0/+1 sur ~5 facteurs × ~30 mesures + champ commentaire libre par cellule. UX progressive (par secteur), save-and-resume obligatoire. Budget ~60-90 min par ville. ~150 ratings/ville/ronde.

**Synthèse 1 (assistée par agents).** Par mesure: moyenne, médiane, IQR, projection 2D (UMAP, n_neighbors=3 vu N=7). Trois familles: *consensus haut* (quick wins), *consensus bas* (à abandonner/repenser), *divisives* (cible de la conversation). Extraction NLP des thèmes, préoccupations, présupposés implicites, contradictions inter-villes.

**Ronde 2 — "Dites-en plus".** Pas un re-rating. Texte libre structuré par les questions générées par l'agent. *Framing constructif clé*: pas "pourquoi vous opposez-vous?" mais "*quelles protections pourraient protéger les personnes à faible revenu pour la mesure X?*", "*quel seuil rendrait cette mesure acceptable pour votre ville?*", "*sous quelles conditions Ville A pourrait porter un coût plus élevé si compensé ailleurs?*". On passe de l'expression de positions à la **co-construction de design alternatifs**.

**Synthèse 2 → rapport pré-rencontre (~20 pages).** Agent structure: réponses agrégées par mesure, *familles de protections proposées*, *gradients d'acceptabilité conditionnels* ("ces 3 villes accepteraient si X, ces 2 si Y, ces 2 sont fermes"), *trade-offs émergents*, *zones de convergence non-vues*. Human-readable, prêt pour la rencontre.

**Rencontre en personne.** Les villes confrontent les conditionnels. La matière est pré-mâchée — on anime une *négociation sur des design alternatives semi-structurées*, pas une discussion à blanc. Différence qualitative énorme avec les facilitations traditionnelles.

**Répète sur le résiduel.** Sur les mesures non-résolues, nouvelle ronde de rating (avec protections proposées intégrées comme variantes), puis nouveau "dites-en plus".

**Cycle final — engagement public.** Plus d'anonymat. Sur la base de la cartographie cumulée, chaque ville déclare formellement ses commitments. Sortie consultative du processus.

**Les 5 agents NLP à designer**:

1. **Extracteur thématique** — lit les commentaires d'une mesure, sort 5-10 thèmes avec sentence support. Stable, sweet spot Claude/GPT.
2. **Générateur de questions** — le plus délicat. Produit des questions *constructives* et *spécifiques* à partir des thèmes. *Test critique*: une question est valide si la réponse pourrait raisonnablement changer le design de la mesure. Sinon = rhétorique.
3. **Cartographe des positions conditionnelles** — à partir des réponses libres R2, matrice: ligne = ville, colonne = mesure, cellule = {ferme oui / conditionnel à X / conditionnel à Y / ferme non}.
4. **Détecteur de design alternatifs** — quand plusieurs villes proposent des protections similaires, agrège en *design proposal* nommé qui devient une variante de la mesure pour la ronde suivante.
5. **Red-teamer interne** — challenge la synthèse avant production du rapport: *"as-tu surreprésenté la voix de Ville A?"*, *"as-tu collapsé deux préoccupations distinctes?"*, *"as-tu introduit une recommandation qui ne vient pas des données?"*. Garde-fou méthodologique central pour la légitimité académique.

**Trois pièges méthodologiques à nommer explicitement**:

→ **Invisible curation.** Si les agents reformulent trop, les villes ne se reconnaissent plus dans le rapport. Règle ferme: chaque thème, chaque préoccupation traçable à des verbatims avec citations courtes. *Transparence du pipeline > élégance de la sortie.*

→ **Asymétrie linguistique.** Une ville avec un répondant verbose génère des commentaires riches, exploitables. Une ville laconique disparaît dans la synthèse. Mitigation: agent doit *flaguer* les mesures où une ville s'est peu exprimée et inviter à élaborer, plutôt que traiter comme signal manquant.

→ **Stabilité du framing.** Si les questions de R2 cadrent l'enjeu d'une certaine façon ("comment protéger les bas revenus" présuppose qu'il y a un problème), les réponses sont contraintes. Le red-teamer doit vérifier: les questions présupposent-elles des conclusions? Un sous-ensemble de questions doit *défier* le diagnostic implicite. Probablement: structure de prompt qui force la génération de questions de catégories distinctes (design / remise en cause / précision).

**Travail de facilitation (editorial labor)** souvent invisibilisé dans la doc des méthodes: entre chaque ronde, toi et/ou Fanny allez lire commentaires, valider/corriger synthèses NLP, formuler les énoncés ronde suivante, modérer légèrement. **2-3 jours-personnes entre R1 et R2, idem R2-R3.** À budgéter explicitement. Piège classique des outils délibératifs construits par devs.

**Risques propres à N=7 villes**:
- Anonymat fragile: montrer un outlier = révéler qui c'est. Ne jamais afficher cluster de taille <3, jamais min/max, toujours médiane + IQR.
- Polis à 7 = mathématiquement marginal. Le cluster map est un *outil de discussion*, pas une *vérité algorithmique*. Présenter comme tel.

**Distinguer build vs cycle opérationnel**:
- *Build* (ce que couvre le mandat de 16k): 3-4 semaines de dev pour produire l'outil
- *Cycle opérationnel* (4 rondes complètes): 5-7 semaines calendrier + 8-10 jours-personnes de facilitation. À budgéter explicitement, peut excéder le mandat initial.

**Pour plus tard (Phase 2-3, mandat de suite éventuel)**:
- Générateur de paquets de compromis (Nash bargaining ou recherche heuristique)
- Simulateur de stabilité de coalition (Shapley pour pouvoir effectif, défection à 1-2 villes)
- Mécanique de compensations latérales formalisée (transferts via fonds MRC, transforme un PD en jeu coopératif)

### 3.3 Système trois couches (Vincent applique son propre méta-système)

- **Étage 1**: CLAUDE.md persistant (méta-méthode qui ne change pas entre projets)
- **Étage 2**: pré-plan MD du projet (objectifs / inputs / outputs / processes / thoughts) — *ce document en est la base, à étoffer*
- **Étage 3**: exécution agentique

---

## 4. Décisions structurantes déjà prises

1. **Périmètre**: Phase 0+1 livrée brillamment > Phase 0-3 inégale. Décision ferme.
2. **Posture honnêteté**: tous les paramètres exposés et modifiables, jamais de boîte noire. Bandes d'incertitude obligatoires. Doc auto-générée des hypothèses.
3. **Grille de cotation**: la grille du plan climat (6 dimensions: Équité, Potentiel de réduction, Co-bénéfices, Acceptabilité sociale, Faisabilité financière, Capacité organisationnelle) est *celle du plan climat*. La grille écofisc propre au mandat est encore à définir (probablement 4 dim: efficacité environnementale, efficience économique, équité, acceptabilité / faisabilité administrative). **À clarifier avec Fanny en semaine 0.**
4. **Anonymat = exploratoire, pas décisionnel**: les engagements finaux doivent être publics. 3-4 rondes anonymes pour cartographier l'espace, puis ronde publique de commitment.
5. **Méthodologie comme code**: tout le pipeline versionné (git), hypothèses dans DuckDB ou SQL, scripts reproductibles.

---

## 5. Inputs disponibles / à colliger

**Disponible**:
- Excel des mesures du plan climat (Actions_GES_fusionne_es_15_05_2026.xlsx) — 37 mesures × 141 actions × 6 dim, déjà cotées en moyenne MRC. *Utile comme contexte, pas comme assiette de travail principale.*
- Connaissance Vincent du dossier téléphérique (réutilisation des modèles de redevances de développement)

**À colliger**:
- **Rôle d'évaluation des 7 villes** (priorité #1 — peut bouffer 3 jours à elle seule à cause de l'hétérogénéité des formats)
- Liste finale des instruments écofiscaux à modéliser (devra venir de Fanny / lit-review Tremblay-Racicot)
- Données socioéco StatCan par aire de diffusion (proxies pour incidence)
- Zonage des 7 villes (corrélation CUBF / usage permis pour le delta)

**Données synthétiques pour amorcer**: prototype avec données simulées dès fin semaine 1 — la moitié des décisions de design se prennent en jouant avec l'outil, pas en spec'ant à blanc.

---

## 6. FFOM

### Forces

- Mandat réel, financé, avec budget et client engagé
- Stack Vincent maîtrisée (Claude Code + MCPs + DuckDB + Streamlit/Next)
- Fanny Tremblay-Racicot comme experte du domaine ET boss = double validation
- MRC + 7 villes simultanément à la table = condition rare
- Affiliation ENAP = légitimité institutionnelle
- Capacité cross-domaine de Vincent (économie + droit + admin pub + tech) = avantage rare
- Réutilisation possible des composants du dossier téléphérique
- Excel des mesures plan climat déjà partagé = signal de transparence

### Faiblesses

- Budget de 16k = pression structurelle vers scope creep
- Solo dev = bottleneck humain malgré l'augmentation Claude Code
- Pas encore validé formellement l'appétit des 7 villes pour exercice délibératif
- Données du rôle probablement hétérogènes entre villes — normalisation coûteuse
- Modèle comportemental volontairement out-of-scope = critique méthodologique potentielle si pas bien cadré
- Pas encore de signature concept nommé pour le positionnement
- Pas de track record empirique de plusieurs mandats — n=1 pour méta-paper

### Opportunités

- Gap littéraire confirmé sur l'intersection écofisc + délibération + harmonisation intermunicipale sub-MRC (probablement personne en Amérique du Nord)
- Steve Jacob (Chaire admin publique numérique, Laval, prix Kernaghan 2025) comme point d'ancrage institutionnel à activer
- Programme de 4 outputs publication sur 18-24 mois envisageable
- Fenêtre de 18-24 mois avant que le champ "IA + admin publique" se sature au Québec
- Possible Phase 2-3 bookable séparément si Phase 0-1 réussit
- Réplication possible vers d'autres MRC du Québec si méthode portable
- L'angle méta (compression scoping-prototypage, taxonomie nouveaux modes d'échec) publiable en parallèle, programme dédié possible

### Menaces

- Concurrence académique pourrait s'installer dans la fenêtre 18-24 mois
- Permission de publier ce que les villes partagent en délibération anonyme — à régler *avant* le premier tour
- Scope creep MRC vers Phase 2-3 sans budget additionnel (risque consulting classique)
- Fanny pourrait préférer mode consulting pur sans co-autorat publication
- Méfiance villes si pas bien cadré ("recherche menée sur nous" ≠ "méthode consultative innovante avec nous")
- Cycle politique municipal — toute consultation traversant des phases électorales se fragilise
- Dépendances techniques (Claude API, MCP serveurs) — à monitorer mais pas bloquantes

---

## 7. Priorisation — brainstorm ouvert

C'est ici que je ne tranche pas, parce que Vincent a explicitement demandé une note de brainstorm.

### Tensions structurelles à arbitrer

**T1 — Outil interne vs outil pour les villes.**
Si toi+Fanny en outil interne: UX dense, hypothèses crues, paramètres exposés sans filtre. Si villes en self-service: UX guidée, garde-fous, vulgarisation. *Pas tranché.* Mon biais (Claude): commencer par usage interne au tour 1, élargir au tour 2-3 quand la grille est validée. Mais c'est une opinion, pas une conclusion.

**T2 — Profondeur vs largeur d'instruments modélisés.**
Un super-instrument bien modélisé d'abord, ou library de 8-12 à élasticité variable? Le 2e est plus utile politiquement (les villes ont besoin de comparer). Le 1er livre plus tôt. *Compromis suggéré*: 2-3 instruments canoniques Tremblay-Racicot bien modélisés en semaine 2, ajouts incrémentaux selon retour.

**T3 — Livrer le mandat MRC vs préserver matériel publication.**
En théorie ce n'est pas opposé. En pratique, le mode consulting tend à manger la rigueur de la captation. *Mitigation*: l'overlay publication (section 9) doit tourner en parallèle, 30 min/jour, dès le jour 1. Pas négociable si on veut le meta-paper.

**T4 — Stack technique.**
Streamlit (MVP rapide, throwaway) vs Next.js+FastAPI (productionnable, +1 semaine effort). *Décision à prendre semaine 0.* Mon biais (Claude): Streamlit pour Phase 0-1, plan de migration si Phase 2-3 booké.

### Quick wins identifiés

1. **Excel actions plan climat** → ingérable rapidement, alimente la couche contextuelle même si pas le cœur écofisc
2. **Données synthétiques** → prototype UX en 5-7 jours
3. **Sankey + bar charts ville×CUBF** → couvre 80% des viz value pour 20% de l'effort
4. **Fiche-mesure auto-générée** → premier livrable politique tangible, montre que ça marche

### Décisions à locker en semaine 0 (avant ligne 1 de code)

1. **Conversation Fanny** (~30 min, explicite): ambition publication, co-autorat, implications contractuelles avec les villes (consentement, partage de données, comité d'éthique ENAP ou pas)
2. **Grille écofisc 4-dim**: dériver avec Fanny depuis le canon Tremblay-Racicot/CIRANO, ou utiliser tel quel un cadre existant
3. **Stack**: Streamlit vs Next.js+FastAPI
4. **Auth multi-utilisateur**: magic links par ville? Délégué nommé par ville?
5. **Résidence des données pendant rondes anonymes**: implications privacy/légales
6. **Stockage**: DuckDB local vs Postgres hosted
7. **Audience primaire phase 1**: toi+Fanny ou villes
8. **Critère go/no-go pour Phase 2-3**: pré-écrit pour se protéger du scope creep émotionnel

---

## 8. Séquencement 4 semaines

**Semaine 0** — décisions structurelles (section 7) lockées. Données synthétiques générées. Architecture documentée.

**Semaine 1** — couche données: ingestion rôle des 7 villes (budget 3 jours, pas 1), modèle parcelle normalisé, mapping CUBF, app skeleton avec auth + routing + modules vides.

**Semaine 2** — module fiscal: 2-3 instruments bien modélisés, projection mono-année, calculateur d'incidence par décile, viz de base (Sankey, heatmap, Lorenz). Fin semaine: dogfood sur 1 instrument canonique.

**Semaine 3** — module consultation: structure des rondes lockée pour tour 1, formulaires d'input anonyme arrimés au module fiscal, cartographie des positions (UMAP), **les 5 agents NLP designés et testés sur données synthétiques** (extracteur thématique, générateur de questions, cartographe conditionnel, détecteur de design alternatifs, red-teamer). Prompts versionnés et exposés. Schéma de log de verbatims → thèmes pour traçabilité.

**Semaine 4** — intégration + première vraie ronde: soft launch avec 1 ville en beta (ou Fanny+équipe en simulation), polish des rough edges, documentation pour handoff + trace publication.

**À couper si serré**, dans cet ordre: projection 10 ans, plusieurs instruments simultanés (start avec 2), heatmap géo (Sankey + bar charts couvrent 80%), **agent red-teamer puis détecteur de design alternatifs** si vraiment pressé.

**Ne jamais couper**: calculateur d'incidence (différenciateur éthique + base empirique meta-paper); agents 1-3 du module consultation (extracteur thématique, générateur de questions, cartographe conditionnel) — sans eux la boucle "dites-en plus" n'a plus de squelette et le mandat redevient un Delphi traditionnel.

---

## 9. Overlay publication (parallèle, 30 min/jour)

À démarrer jour 1, non négociable si on veut préserver l'option publication.

- **Daily decision log**: quelle décision de scoping, quelles alternatives, pourquoi celle-là. → Section 3 du meta-paper.
- **Screenshot evolution**: capture l'UI à chaque semaine. → Évidence "compression scoping-to-prototype".
- **Friction log**: chaque fois qu'un truc prend plus de temps qu'estimé, pourquoi. → Taxonomie des nouveaux modes d'échec.
- **Sauvegarde des conversations Claude Code**: export régulier. → Audit trail méthodologique.
- **Journal de bord narratif**: 1 paragraphe par jour, libre. → Matière brute pour le narrative paper.
- **Mesure empirique de l'apport méthodologique**: tracker ratings R1 (à froid) vs commitments post-cycle pour chaque ville × chaque mesure. Le delta R1 → engagement final est un *résultat mesurable* de l'apport de la boucle délibérative + agents NLP, pas juste une promesse rhétorique. Critique pour la publication: c'est *le* chiffre que les reviewers vont chercher.

**Trois conditions structurelles** pour que le positionnement long terme tienne (au-delà de ce mandat):
1. Un *signature concept* nommable — à chercher activement pendant le mandat, pas après
2. Un *corpus d'évidence* (3-4 mandats documentés avec même rigueur, pas juste celui-ci)
3. Des *associations explicites* — affiliation ENAP active, co-autorat Fanny pour premier output, ancrage avec un groupe reconnu (OBVIA, PerfEval, CRISES, CERIUM)

---

## 10. Thoughts ouverts pour la session Claude Code

C'est le champ "thoughts" du système Vincent, transposé. Préservé comme cognition non-résolue.

- Le forum de coordination devrait-il être agnostique au domaine, ou spécifique à l'écofisc? Si agnostique, c'est un objet réutilisable pour d'autres mandats. Si spécifique, plus tight pour celui-ci. Choix qui a des conséquences sur l'effort de développement et sur la transmissibilité.

- Quelle place pour les agents adversariaux dans la pratique du mandat lui-même? Personas "élu municipal sceptique", "citoyen pressé", "juriste pointilleux" comme stress-test du livrable avant chaque rencontre client. À formaliser dans le système Vincent général, à appliquer ici.

- Comment éviter que l'outil de coordination, en augmentant la lisibilité des désaccords, ne *cristallise* des positions qui auraient évolué naturellement dans une conversation orale? Risque inverse de la facilitation — la transparence peut durcir au lieu d'assouplir. À watcher pendant les rondes.

- La grille de cotation des instruments écofisc est *en parallèle* de celle du plan climat (6 dim), pas une sous-partie. Comment les afficher conjointement sans confondre les utilisateurs? Possiblement deux radars distincts, ou une vue unifiée à 8-10 dim selon la mesure scorée.

- L'asymétrie entre les 7 villes (Boisbriand industriel, Lorraine résidentiel, Ste-Anne-des-Plaines agricole/grand territoire) peut rendre certains instruments très avantageux pour une ville et toxique pour une autre. La fonction de compensation latérale est probablement nécessaire même en Phase 1 si on veut éviter des deadlocks visibles dès le premier tour.

- Quel est le bon ratio "données réelles" / "données synthétiques" pour les démos avec villes? Tout synthétique = pas crédible. Tout réel = lent. Hybrid avec étiquetage clair = probablement le bon compromis, mais à designer.

- Naming du système: "infrastructure cognitive en couches", "méthode protocolaire augmentée", "journal d'orchestration"... la conversation continue avec Vincent.

- Steve Jacob: café à organiser. Pas pour ce mandat, pour le programme. Note que ça doit se faire pendant que ce mandat tourne (matière à montrer).

- **Le piège de framing dans l'agent 2 (générateur de questions)**: comment garantir qu'un sous-ensemble de questions *défie* le diagnostic implicite, plutôt que d'opérer toujours dans le cadre qu'il pose? Piste: structure de prompt qui force la génération de catégories distinctes (questions de design alternatif / questions de remise en cause du diagnostic / questions de précision). À itérer en testant sur données synthétiques.

- **Asymétrie linguistique entre villes** (DG verbose vs laconique) crée un risque de sous-représentation des villes moins articulées. L'agent doit *flaguer* plutôt qu'oublier. Mais à quel seuil? Et comment équilibrer sans dénaturer la position d'une ville qui choisit délibérément la concision?

- **Traçabilité verbatim → thème** dans la synthèse NLP: quelle granularité afficher dans le rapport pré-rencontre? Trop = illisible. Trop peu = soupçon de boîte noire. Probablement: thèmes en synthèse avec lien-popup vers verbatims. UX à designer.

- **Stratégie de génération du prompt système pour les agents**: stables et versionnés (probablement dans le dépôt git du projet), ou ajustés par mesure (plus puissant mais explosion combinatoire)? Ma recommandation initiale: un prompt par agent stable, avec injection de contexte par mesure. Mais à valider en testant.

---

## 11. Annexes — refs utiles

**Lignage intellectuel à invoquer dans la publication**:
- Engelbart, *Augmenting Human Intellect* (1962)
- Matuschak (evergreen notes, tools for thought)
- Victor (systèmes qui pensent avec nous)
- Litt, Ink & Switch (malleable software)
- Appleton (digital gardens)

**Canon écofisc à mobiliser**:
- Tremblay-Racicot et al., publications CIRANO
- IRÉC sur fiscalité écologique municipale
- Meloche sur fiscalité municipale Québec

**Canon délibération numérique**:
- Polis / vTaiwan (cas Taiwan, écosystème Audrey Tang) — référence cartographie et clustering
- **Recursive Public (Aviv Ovadya)** — référence pour *structured deliberation with adaptive prompting*, plus proche de notre design que Polis pur
- Delphi method (RAND, classique) — référence pour la mécanique multi-tours + anonymat
- Littérature sur *deliberative mini-publics* (Fishkin, Niemeyer) pour la légitimité épistémique du petit N

**Contacts à cultiver**:
- Steve Jacob, Laval — Chaire admin publique numérique
- Pierre-Majorique Léger, HEC Tech3Lab
- OBVIA (Observatoire international IA + société)
- ENAP — institution d'attache à activer

---

*Fin du handoff. Bonne séance.*
