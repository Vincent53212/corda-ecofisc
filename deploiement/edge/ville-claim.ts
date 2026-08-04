
/* GÉNÉRÉ par tools/gen-edge-functions.js — NE PAS ÉDITER À LA MAIN.
   © Corda · Écofiscalité — tous droits réservés. */
import { createClient } from "npm:@supabase/supabase-js@2";

/* ---- moteur + catalogue (compilés depuis rules.js — source unique testée) ---- */
const __mod: { exports: Record<string, unknown> } = { exports: {} };
{
  // deno-lint-ignore no-unused-vars
  const module = __mod;
  /* ============================================================================
     RULES.JS — Moteur de cotation de l'Orchestrateur (analyse multicritère)
     Un produit Corda · Écofiscalité — grille V4, dir. Pre Fanny Tremblay-Racicot.
  
     CE FICHIER EST LA SOURCE UNIQUE des règles métier :
     · la question PRÉALABLE (mesure déjà implantée → l'analyse ne s'applique pas) ;
     · les 4 dimensions et leurs 23 critères (questions verbatim de la grille V4,
       avec la « boussole » +/− de chaque question) ;
     · le CATALOGUE des mesures (CATS, MEASURES, DESCRIPTIONS — fiches Mascouche
       et Gatineau 2025) : la whitelist measure_id/criterion_id des Edge Functions
       est GÉNÉRÉE d'ici, jamais recopiée à la main ;
     · apprec()      — somme des cotes d'une dimension → appréciation ;
     · reco()        — 4 appréciations → recommandation de la mesure ;
     · villeMoyenne()— agrégation d'une ville = moyenne arrondie de ses répondants ;
     · mrcSynthese() — synthèse MRC = majorité des recommandations des villes ;
     · estImplantee()/villeImplantee() — lecture du préalable (mesure déjà en place).
  
     ⚠ Toute modification doit passer la suite de tests :   node --test tests/
     Les règles sont documentées en prose dans docs/methodologie.md (validation
     par la direction de recherche) et le format des données dans
     docs/dictionnaire-donnees.md.
  
     Format « universel » (UMD) : chargé par orchestrateur.html via
     <script src="rules.js"> (double-clic local et hébergement web), et par les
     tests Node via require(). Les deux fichiers doivent rester ensemble.
     ============================================================================ */
  (function (root, factory) {
    if (typeof module === 'object' && module.exports) { module.exports = factory(); }
    else { (root as any).Rules = factory(); }
  }(typeof self !== 'undefined' ? self : this, function () {
    "use strict";
  
    /* ---------- 4 dimensions · 23 critères (questions verbatim de la grille V4) ----------
       pos/neg (et mid, optionnel) = « boussole de cotation » : ce que signifie une réponse
       +, − (ou 0) pour CETTE question. Depuis la V4 (22 juill. 2026), les 7 questions
       jadis à polarité inversée (pf3, sg1, sg4, sg5, ae3, ae6, ae7) sont réécrites en
       polarité positive : un « oui » est TOUJOURS favorable (+1). La boussole est
       conservée — elle reste utile pour lever les ambiguïtés de degré. */
    const DIMENSIONS = [
      {id:'pf', nom:'Potentiel fiscal', crit:[
        {id:'pf1', label:"Largeur de l'assiette fiscale", q:"L'assiette fiscale concerne-t-elle un nombre de contribuables ou encore un flux ou un stock monétaire suffisamment grand pour assurer à court terme des revenus qui peuvent être considérés comme étant significatifs ?", pos:"Assiette large (nombreux contribuables ou flux important)", neg:"Assiette étroite ou marginale"},
        {id:'pf2', label:"Potentiel de croissance", q:"L'assiette fiscale présente-t-elle un potentiel de croissance raisonnablement prévisible à moyen et long terme ?", pos:"Croissance prévisible à moyen-long terme", neg:"Stagnation ou déclin attendu"},
        {id:'pf3', label:"Marge de manœuvre sur le taux du prélèvement", q:"En considérant le contexte de compétitivité fiscale de la Ville, le taux de prélèvement actuel sur cette assiette fiscale est-il suffisamment bas pour laisser une marge de manœuvre ?", pos:"Taux actuel bas → de la marge de manœuvre", neg:"Taux déjà élevé → peu de marge"},
      ]},
      {id:'sg', nom:'Saine gestion administrative', crit:[
        {id:'sg1', label:"Coûts d'administration", q:"Un prélèvement supplémentaire sur cette assiette fiscale peut-il être administré avec des ressources (immobilisations, exploitation, conformité fiscale) dont le coût peut être considéré comme faible ou raisonnable ? Par exemple, le processus de perception est-il compatible avec la méthode actuelle de gestion du compte de taxes ?", pos:"Coûts d'administration faibles, perception simple", neg:"Coûts élevés ou prohibitifs"},
        {id:'sg2', label:"Utilisateur-payeur", q:"La mesure s'appuie-t-elle sur le principe d'utilisateur-payeur ? Permet-elle d'accroître la participation financière de catégories de contribuables dont la consommation de services publics excède les coûts de production de la municipalité ?", pos:"S'appuie sur l'utilisateur-payeur", neg:"Aucun lien entre usage et coût"},
        {id:'sg3', label:"Applicabilité (court terme)", q:"À court terme, les données ou la technologie nécessaires à la mise en œuvre de la mesure sont-elles disponibles et applicables selon les pratiques actuellement en vigueur ?", pos:"Données et technologie déjà disponibles", neg:"Non disponibles à court terme"},
        {id:'sg4', label:"Conformité réglementaire", q:"La mesure est-elle compatible avec les réglementations et les politiques actuellement en vigueur, sans nécessiter la création d'un nouveau régime de réglementation ni une modification de la réglementation actuelle ?", pos:"Aucun conflit; le cadre actuel suffit", neg:"Conflit ou nouvelle réglementation requise"},
        {id:'sg5', label:"Contestation judiciaire", q:"Le risque de contestation judiciaire de la mesure est-il faible ou nul ?", pos:"Risque de contestation faible ou nul", neg:"Risque élevé de contestation judiciaire"},
        {id:'sg6', label:"Orientations du plan stratégique", q:"La mesure renforce-t-elle les orientations ou dispositions prévues au plan stratégique ou à d'autres documents de la municipalité ?", pos:"Renforce le plan stratégique", neg:"S'écarte des orientations"},
        /* sg7 — ajouté en V4 (22 juill. 2026). Seul critère dont le barème des trois
           valeurs est écrit dans la grille : le « 0 » y est explicite (non étudiée). */
        {id:'sg7', label:"Historique", q:"La mesure a-t-elle été récemment mise à l'étude par la municipalité ?", pos:"Récemment mise à l'étude", mid:"Jamais étudiée", neg:"Étudiée puis rejetée"},
      ]},
      {id:'ae', nom:'Acceptabilité et équité', crit:[
        {id:'ae1', label:"Perception", q:"La mesure recevrait-elle un niveau d'approbation de la population supérieur à celui auquel on pourrait s'attendre d'un prélèvement fiscal ?", pos:"Approbation probable de la population", neg:"Rejet probable"},
        {id:'ae2', label:"Disponibilité d'alternatives", q:"En principe, un contribuable peut-il diminuer ou éviter les prélèvements en modifiant son comportement ?", pos:"Évitable en changeant de comportement", neg:"Prélèvement subi, sans échappatoire"},
        {id:'ae3', label:"Personnes vulnérables", q:"La mesure évite-t-elle un impact financier plus important auprès des personnes vulnérables ?", pos:"Peu ou pas d'impact sur les personnes vulnérables", neg:"Impact important sur les personnes vulnérables"},
        {id:'ae4', label:"Capacité de payer", q:"La mesure permet-elle d'accroître raisonnablement la participation financière des personnes (morales ou physiques) ayant une capacité de payer supérieure ?", pos:"Cible les hautes capacités de payer", neg:"Frappe surtout les faibles capacités de payer"},
        {id:'ae5', label:"Équité temporelle", q:"La mesure permet-elle de cibler des catégories de contribuables qui ont bénéficié, dans les dernières années, d'un transfert fiscal favorable ?", pos:"Corrige un avantage fiscal passé", neg:"Sans effet correctif (ou l'accentue)"},
        {id:'ae6', label:"Équité territoriale", q:"L'impact de la mesure est-il réparti uniformément entre les contribuables des différents secteurs de la municipalité ?", pos:"Impact réparti uniformément sur le territoire", neg:"Impact concentré sur certains secteurs"},
        {id:'ae7', label:"Abordabilité", q:"Lorsqu'applicable, la mesure préserve-t-elle ou améliore-t-elle l'abordabilité des logements ?", pos:"Préserve ou améliore l'abordabilité du logement", neg:"Nuit à l'abordabilité (renchérit le logement)"},
      ]},
      {id:'ee', nom:'Efficacité environnementale', crit:[
        {id:'ee1', label:"Pertinence", q:"La mesure est-elle le moyen le plus approprié d'atteindre l'objectif environnemental visé ?", pos:"Le moyen le plus approprié pour l'objectif", neg:"Moyen mal adapté ou détourné"},
        {id:'ee2', label:"Utilisation du sol", q:"En principe, la mesure offre-t-elle un potentiel pour optimiser l'utilisation du sol ou privilégier les formes compactes d'aménagement ?", pos:"Optimise le sol / favorise les formes compactes", neg:"Sans effet (ou favorise l'étalement)"},
        {id:'ee3', label:"Attractivité", q:"En principe, la mesure offre-t-elle un potentiel pour renforcer l'attractivité du territoire ou orienter la croissance vers les milieux déjà urbanisés pour freiner l'étalement ?", pos:"Renforce l'attractivité / freine l'étalement", neg:"Sans effet sur l'attractivité"},
        {id:'ee4', label:"Résilience des écosystèmes", q:"En principe, la mesure offre-t-elle un potentiel pour contribuer à la résilience des écosystèmes ?", pos:"Contribue à la résilience des écosystèmes", neg:"Sans effet sur la résilience"},
        {id:'ee5', label:"Mobilité durable", q:"En principe, la mesure favorise-t-elle une occupation du sol favorable à la mobilité durable ?", pos:"Favorise la mobilité durable", neg:"Sans effet (ou la défavorise)"},
        {id:'ee6', label:"Pollueur-payeur", q:"En principe, la mesure permet-elle d'internaliser des externalités environnementales négatives ou de faire participer financièrement les générateurs de nuisance ?", pos:"Internalise les externalités / fait payer le pollueur", neg:"Sans effet d'internalisation"},
      ]},
    ];
    const ALLCRIT = DIMENSIONS.flatMap(d=>d.crit);
    const NCRIT = ALLCRIT.length; // 23
  
    /* ---------- Question PRÉALABLE (V4, 3 août 2026) ----------
       Posée AVANT les 23 critères, pour chaque mesure. « Oui » = la mesure est déjà
       en place (ou en voie de l'être) : l'analyse multicritère n'a plus d'objet pour
       cette municipalité — les 23 questions sont masquées et seul le commentaire est
       recueilli (ce qu'il y aurait à modifier ou à améliorer).
       Stockage : une réponse comme les autres (criterion_id 'impl'), cote 1 = oui,
       0 = non — mais elle n'entre dans AUCUN calcul d'appréciation (elle n'appartient
       à aucune dimension). Un statut d'affichage distinct la représente : IMPL. */
    const PREALABLE = Object.freeze({
      id:'impl',
      label:"Mesure déjà en place",
      q:"Est-ce que la mesure est déjà implantée ou en voie de l'être ?",
      hint:"Si oui, commentez les éléments à modifier ou à améliorer. Les 23 questions d'analyse ne s'appliqueront pas à cette mesure.",
      oui:"Oui — déjà implantée ou en voie de l'être",
      non:"Non — pas en place",
    });
    const IMPL = Object.freeze({l:'Déjà en place', abbr:'I', c:'var(--brass)', tc:'var(--ink)'});
    /* Le répondant a-t-il déclaré la mesure déjà en place ? (rm = {critId: cote}) */
    function estImplantee(rm){ return !!rm && rm[PREALABLE.id] === 1; }
    /* Agrégation ville du préalable : UN SEUL répondant qui l'affirme suffit — c'est un
       FAIT vérifiable, pas une opinion à moyenner (règle à valider, methodologie.md §7). */
    function villeImplantee(vals){ return !!vals && vals.some(v=>v===1); }
  
    /* ---------- Catalogue des mesures (37 mesures · 6 catégories) ----------
       Source unique du catalogue : l'UI l'affiche, les tests en vérifient l'intégrité,
       et la whitelist des Edge Functions (measure_id/criterion_id admis) en est générée. */
    const CATS = {
      fonc:{label:'Fiscalité foncière et assiette', color:'#E6B422'},
      transp:{label:'Transport et stationnement', color:'#E2574C'},
      amenag:{label:'Aménagement, sol et développement', color:'#9AA7B4'},
      crd:{label:'Matières résiduelles, émissions et énergie', color:'#9D6FD0'},
      eau:{label:'Eau', color:'#4473C5'},
      autres:{label:'Autres', color:'#B0668F'},
    };
    const MEASURES = [
      {id:'m01', cat:'fonc', titre:'Sous-catégorie - nombre de logements'},
      {id:'m02', cat:'fonc', titre:'Sous-catégorie - CUBF'},
      {id:'m03', cat:'fonc', titre:'Sous-catégorie - secteurs'},
      {id:'m04', cat:'fonc', titre:'Taux varié par tranche de valeur (non résidentiels)'},
      {id:'m05', cat:'fonc', titre:'Taux varié terrain vague desservi'},
      {id:'m06', cat:'fonc', titre:'Taxe logements vacants (résidentiel)'},
      {id:'m07', cat:'fonc', titre:'Taxe immeubles vacants (non résidentiel)'},
      {id:'m08', cat:'fonc', titre:'Taxe sur les terres à vocation agricole exploitables mais non exploitées'},
      {id:'m09', cat:'transp', titre:'Tarification stationnement sur rue'},
      {id:'m10', cat:'transp', titre:'Redevance grands générateurs de déplacements'},
      {id:'m11', cat:'transp', titre:'Redevance transport rémunéré de personnes'},
      {id:'m12', cat:'transp', titre:'Taxe sur les espaces de stationnement'},
      {id:'m13', cat:'transp', titre:'Redevances de transport'},
      {id:'m14', cat:'amenag', titre:"Taxe sur le COS (coefficient d'occupation du sol)"},
      {id:'m15', cat:'amenag', titre:'Taxe sur les surfaces non végétalisées'},
      {id:'m16', cat:'amenag', titre:'Redevances visant le financement de la voirie locale'},
      {id:'m17', cat:'amenag', titre:'Redevances de développement'},
      {id:'m18', cat:'amenag', titre:'Taxe arbre en cour avant'},
      {id:'m19', cat:'amenag', titre:'Redevance visant la réduction de la perte de canopée'},
      {id:'m20', cat:'amenag', titre:'Taxe sur les terrains contaminés'},
      {id:'m21', cat:'crd', titre:'Tarification variable des matières résiduelles'},
      {id:'m22', cat:'crd', titre:'Redevance visant les résidus de CRD'},
      {id:'m23', cat:'crd', titre:'Taxe sur la démolition'},
      {id:'m24', cat:'crd', titre:'Redevance sur les contenants à usage unique ou individuel'},
      {id:'m25', cat:'crd', titre:'Redevance sur les émissions de polluant par les industries (dont les GES)'},
      {id:'m26', cat:'crd', titre:'Redevance visant à compenser les GES associés au développement immobilier'},
      {id:'m27', cat:'crd', titre:"Redevance à l'égard de la performance énergétique des bâtiments"},
      {id:'m28', cat:'crd', titre:'Taxe sur les systèmes au mazout ou biénergie'},
      {id:'m29', cat:'eau', titre:"Redevance rejets d'eaux usées"},
      {id:'m30', cat:'eau', titre:'Tarification eau résidentiel'},
      {id:'m31', cat:'eau', titre:'Tarification eau ICI'},
      {id:'m32', cat:'eau', titre:'Taxe sur les piscines'},
      {id:'m33', cat:'autres', titre:"Redevance d'amusement"},
      {id:'m34', cat:'autres', titre:"Redevance d'hébergement touristique"},
      {id:'m35', cat:'autres', titre:"Taxe sur les panneaux d'affichage"},
      {id:'m36', cat:'autres', titre:'Redevance sur les services de câblodistribution et télécommunication'},
      {id:'m37', cat:'autres', titre:'Redevance sur les générateurs de risques (dont les réservoirs de produits chimiques)'},
    ];
  
    /* Descriptions des mesures — extraites des fiches analytiques Mascouche et Gatineau (2025)
       (dir. F. Tremblay-Racicot). Mécanismes transférables ; exemples sectoriels génériqués.
       Le reste = « Description à venir » (liste des manquantes dans le dossier de validation). */
    const DESCRIPTIONS = {
      m01:"Modulation du taux de taxe foncière selon le nombre de logements et la typologie, via des sous-catégories d'immeubles résidentiels (unifamilial, 2 logements, 3-5, 6-9, 10-49, 50+, habitations en commun, condominiums).",
      m02:"Taux de taxe foncière distincts pour les immeubles commerciaux/industriels selon le code d'utilisation des biens-fonds (CUBF) : soit pour les industries polluantes (aliments/boissons, minéraux, pétrole, chimie, transport…), soit pour les entreprises d'économie circulaire (recyclage, récupération, vente d'occasion, compostage).",
      m03:"Régime d'impôt foncier à taux variés modulés selon les secteurs d'imposition définis (p. ex. central, TOD, excentré, rural), avec des taux de base sectoriels respectant un écart maximal de 33,3 % par rapport au taux uniformisé.",
      m04:"Régime d'impôt foncier à taux variés par tranche de valeur pour les immeubles non résidentiels (p. ex. < 1 M$, 1-2 M$, 2 M$ et plus). Un second taux peut s'appliquer, sans excéder 133,3 % du premier.",
      m05:"Taxe pouvant atteindre quatre fois le taux de base (résidentiel) sur les terrains vagues desservis par l'aqueduc et l'égout sanitaire, afin de récupérer des revenus, accroître la densification et limiter la spéculation foncière.",
      m06:"Prélèvement sur la valeur foncière des immeubles comportant un logement vacant ou sous-utilisé, avec un taux maximal progressif (p. ex. 1 % la 1re année, 2 % la 2e, 3 % la 3e).",
      m08:"Taxe ou redevance visant les terres à vocation agricole exploitables mais non exploitées, pour décourager la spéculation et encourager la remise en culture : taxe sur la valeur foncière (plafonnée à trois fois le taux de base) ou redevance au m² alimentant un fonds de remise en culture, avec exemptions possibles (exploitants enregistrés, agri-projets partenaires).",
      m09:"Tarif (ou vignette) pour contrôler et gérer le stationnement sur rue ; le montant peut varier selon le secteur, le quartier ou le type de véhicule.",
      m10:"Redevance auprès des grands générateurs de déplacement (grands employeurs de 100+ employés, organisateurs d'événements) dépourvus d'un programme de gestion des déplacements, pour financer le transport collectif et les infrastructures de transport actif.",
      m12:"Taxe auprès des propriétaires de parcs de stationnement non résidentiels dans les zones desservies en transport collectif, calculée sur la superficie ou le nombre de cases (exemptions de base possibles), avec un taux modulable par secteur, type de stationnement (extérieur taxé davantage) et niveau de desserte — pour financer le transport collectif et optimiser l'usage des terrains.",
      m14:"Taxe sur les immeubles non résidentiels/industriels desservis dont le coefficient d'occupation du sol (COS) est inférieur à 20 %, calculée sur la différence entre 20 % de la superficie non contrainte et la superficie réelle, multipliée par un taux sectoriel.",
      m15:"Taxe sur les surfaces minéralisées (non végétalisées) de certains immeubles non résidentiels : superficie du terrain moins bâtiments moins surfaces végétalisées, avec strates progressives (exemption de base, puis tarifs croissants).",
      m18:"Taxe visant l'absence d'arbre en cour avant (façade) des immeubles résidentiels et non résidentiels : taxe unitaire imposée aux propriétaires non conformes.",
      m19:"Redevance visant la réduction de la perte de canopée dans les projets de construction ; montant établi de façon discrétionnaire ou selon la valeur écosystémique des arbres abattus (nombre, essence, âge, taille).",
      m21:"Tarification incitative selon le nombre de levées et la taille du bac, afin de réduire les matières vouées à l'enfouissement (coûts aujourd'hui assumés par la taxe foncière générale).",
      m22:"Redevance sur les permis de construction, rénovation et démolition pour détourner les résidus de CRD de l'élimination ; les redevables ayant un plan de gestion des matières pourraient être exemptés.",
      m24:"Redevance sur la quantité de contenants et produits à usage unique vendus ou fournis par les commerçants (verres, bouteilles d'eau, pailles…), établie par déclaration périodique, pour financer la gestion des matières résiduelles et inciter à la réduction à la source ; un montant compensatoire peut être retenu par les commerçants pour la gestion.",
      m26:"Redevance imposée au promoteur lors du permis de construction ou de branchement à l'aqueduc, pour compenser les GES émis par l'urbanisation d'un terrain (perte de biomasse, travaux d'infrastructures) : superficie développée × taux de compensation arrimé au prix du carbone (p. ex. 1,08 $/m²), versée à un fonds dédié à l'atténuation et à l'adaptation ; requalification exemptable.",
      m28:"Taxe imposée aux propriétaires d'immeubles résidentiels disposant d'appareils de chauffage au mazout ou d'un système biénergie au mazout ; montant fixe par appareil assujetti.",
      m29:"Redevance sur les rejets d'eaux usées, prélevée selon la quantité et le niveau de contamination rejetés sur une période donnée, pour financer le traitement des eaux usées.",
      m30:"Tarification de l'eau potable au secteur résidentiel selon le principe utilisateur-payeur : variable (consommation en m³ avec compteurs) ou forfaitaire (tarif annuel au compte de taxes).",
      m31:"Tarification de l'eau potable pour les industries, commerces et institutions (ICI) selon le principe utilisateur-payeur : variable selon la consommation (compteurs) ou forfaitaire au coût moyen.",
      m32:"Transformation de la tarification actuelle des piscines en taxe générale, avec un montant par propriété calibré pour générer des revenus supplémentaires.",
      m34:"Redevance réglementaire imposée aux exploitants d'établissements d'hébergement touristique — montant annuel par unité de capacité (chambre, lit, site de camping), modulable par type d'établissement et secteur — pour compenser les coûts municipaux liés au tourisme (voirie, parcs, déchets, sécurité) ; distincte de la taxe provinciale sur l'hébergement et non facturée aux touristes.",
      m36:"Redevance réglementaire liée à l'occupation du domaine public par les réseaux de câblodistribution et de télécommunication (encadrée par un accord d'accès municipal) : frais de permis, dégradation de la chaussée, relocalisations — au coût réel, selon les balises du CRTC (principe de neutralité des coûts pour les contribuables).",
    };
  
    /* ---------- Libellés et couleurs des états ----------
       c = couleur de fond · tc = couleur de TEXTE lisible sur ce fond (AA 4.5:1 : blanc sur
       les fonds foncés, encre sur les fonds clairs — ambre/gris/vert clair). Les valeurs
       sont des variables CSS résolues par la page ; inertes côté Node. */
    const APPREC = {
      tf:{l:'Très favorable', c:'var(--fav-pos)', tc:'#fff'},
      f:{l:'Favorable', c:'var(--fav-posl)', tc:'var(--ink)'},
      n:{l:'Neutre', c:'var(--fav-mid)', tc:'var(--ink)'},
      pf:{l:'Peu favorable', c:'var(--fav-warn)', tc:'var(--ink)'},
      pdf:{l:'Pas du tout favorable', c:'var(--fav-neg)', tc:'#fff'},
    };
    const RECO = {
      rec:{l:'Mesure recommandée', abbr:'R', c:'var(--fav-pos)', tc:'#fff'},
      etude:{l:"Mise à l'étude", abbr:'É', c:'var(--fav-warn)', tc:'var(--ink)'},
      non:{l:'Mesure non recommandée', abbr:'N', c:'var(--fav-neg)', tc:'#fff'},
    };
  
    /* ---------- Règle 1 : cotes d'une dimension → appréciation ----------
       S = somme des réponses présentes (+1/0/−1). Transcription EXACTE des formules
       du classeur V3 (fiches, col. B) : doctrine tranchée par la direction (le classeur
       Excel fait foi — décision Jérôme, 16 juill. 2026 ; voir audit §6).
       Seuils Excel : Très favorable dès S≥1 sans négatif · Pas du tout favorable dès
       S≤−1 sans positif (≠ les seuils ±2 du guide, écartés). L'ordre des tests suit la
       cascade IF du classeur. Vérifié 112/112 sur les données V3. Voir methodologie.md §2. */
    function apprec(cotes){
      const S=cotes.reduce((a,b)=>a+b,0);
      const hasNeg=cotes.some(c=>c<0), hasPos=cotes.some(c=>c>0);
      if(S===0) return 'n';         /* inclut « aucune réponse » (garde défensive) */
      if(!hasPos) return 'pdf';     /* aucun positif et S<0  (MIN≤0 ET MAX≤0 du classeur) */
      if(S<0) return 'pf';          /* au moins un positif mais S<0 */
      if(!hasNeg) return 'tf';      /* aucun négatif et S>0 */
      return 'f';                   /* au moins un négatif mais S>0 */
    }
  
    /* ---------- Règle 2 : 4 appréciations de dimension → recommandation ----------
       Transcription de la formule du classeur V3 (Synthèse, col. F) : doctrine Excel
       (décision Jérôme, 16 juill. 2026). Recommandée dès UNE dimension favorable (F ou
       TF) sans aucun « Peu / Pas du tout favorable » — hors tout-Neutre, qui reste à
       l'étude. Le guide exigeait ≥2 favorables : seuil écarté. Vérifié 28/28 sur les
       données V3. Voir docs/methodologie.md §3. */
    function reco(aps){
      const fav=aps.filter(a=>a==='f'||a==='tf').length;
      const pf=aps.filter(a=>a==='pf').length;
      const pdf=aps.filter(a=>a==='pdf').length;
      if(pdf>=1 || pf>=2) return 'non';
      if(pf===0 && pdf===0 && fav>=1) return 'rec';
      return 'etude';
    }
  
    /* ---------- Règle 3 : agrégation d'une ville = moyenne ARRONDIE des répondants ----------
       Appliquée question par question, avant de recalculer appréciations et reco.
       ⚠ Math.round arrondit ±0,5 vers le haut : +0,5 → +1 mais −0,5 → 0 (asymétrie
       signalée à la validation — docs/methodologie.md §4). Sans donnée → null. */
    function villeMoyenne(cotes){
      if(!cotes || !cotes.length) return null;
      const m=Math.round(cotes.reduce((a,b)=>a+b,0)/cotes.length);
      return m===0 ? 0 : m; /* normalise le −0 de Math.round(−0,5) en 0 */
    }
  
    /* ---------- Règle 4 : synthèse MRC = majorité des recommandations des villes ----------
       Égalités : 'non' prime sur tout, puis 'rec' prime sur 'etude' (docs/methodologie.md §5).
       Les villes ayant déclaré la mesure DÉJÀ EN PLACE ('impl') sont comptées à part et
       retirées du vote : leur situation n'est pas une recommandation (methodologie.md §7).
       Si toutes les villes concernées l'ont déjà en place, la majorité vaut 'impl'.
       Sans aucune donnée exploitable → maj null (les appelants filtrent déjà en amont). */
    function mrcSynthese(recos){
      const cc={rec:0,etude:0,non:0,impl:0};
      (recos||[]).forEach(r=>{ if(r in cc) cc[r]++; });
      const votes=cc.rec+cc.etude+cc.non;
      if(!votes) return {cc, maj: cc.impl ? 'impl' : null};
      const maj=(cc.non>=cc.rec && cc.non>=cc.etude)?'non':(cc.rec>=cc.etude)?'rec':'etude';
      return {cc, maj};
    }
  
    return Object.freeze({ DIMENSIONS, ALLCRIT, NCRIT, PREALABLE, IMPL, CATS, MEASURES, DESCRIPTIONS, APPREC, RECO, apprec, reco, villeMoyenne, mrcSynthese, estImplantee, villeImplantee });
  }));
  
}
// deno-lint-ignore no-explicit-any
const Rules: any = __mod.exports;
const { DIMENSIONS, ALLCRIT, NCRIT, PREALABLE, IMPL, CATS, MEASURES, DESCRIPTIONS, APPREC, RECO, apprec, reco, villeMoyenne, mrcSynthese, estImplantee, villeImplantee } = Rules;

const ORIGINS = [
  "https://ecofisc.corda.consulting",
  "http://127.0.0.1:8742", "http://localhost:8742", /* tests locaux */
];
function corsHeaders(req: Request): Record<string, string> {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}
function svc() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}
function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(req) });
}
async function sha256(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, "0")).join("");
}
const CODE_RE = /^[A-Z]{2,4}-[A-Z0-9]{3,10}$/;

/* ---- calculs partagés ----
   respMap : { measureId: { critId: cote } } → synthèse par mesure
   (appréciation par dimension, recommandation, nb de réponses). */
// deno-lint-ignore no-explicit-any
function synthOf(respMap: Record<string, Record<string, number>>): Record<string, any> {
  // deno-lint-ignore no-explicit-any
  const out: Record<string, any> = {};
  for (const m of MEASURES) {
    const rm = respMap[m.id]; if (!rm) continue;
    /* préalable « déjà en place » → l'analyse multicritère n'a pas d'objet :
       aucune appréciation, aucune recommandation, statut à part. */
    if (estImplantee(rm)) { out[m.id] = { impl: true, answered: 0, dims: {}, reco: null }; continue; }
    // deno-lint-ignore no-explicit-any
    const dims: Record<string, string | null> = {};
    let answered = 0;
    for (const d of DIMENSIONS) {
      const cotes = d.crit.map((c: { id: string }) => rm[c.id]).filter((x: number | undefined) => x !== undefined && x !== null);
      answered += cotes.length;
      dims[d.id] = cotes.length ? apprec(cotes) : null;
    }
    if (!answered) continue;
    out[m.id] = { impl: false, answered, dims, reco: reco(DIMENSIONS.map((d: { id: string }) => dims[d.id] || "n")) };
  }
  return out;
}
/* rows → { code: { measureId: { critId: cote } } } (cotes null exclues) */
// deno-lint-ignore no-explicit-any
function groupResponses(rows: any[]): Record<string, Record<string, Record<string, number>>> {
  const by: Record<string, Record<string, Record<string, number>>> = {};
  for (const r of rows) {
    if (r.cote === null || r.cote === undefined) continue;
    ((by[r.code] ??= {})[r.measure_id] ??= {})[r.criterion_id] = r.cote;
  }
  return by;
}
/* Le catalogue livré aux clients AUTORISÉS (questions + mesures + libellés
   d'affichage). Les seuils et règles de calcul, eux, restent ici. */
function catalogue() {
  return {
    dimensions: DIMENSIONS.map((d: { id: string; nom: string; crit: { id: string; label: string; q: string; pos: string; mid?: string; neg: string }[] }) =>
      ({ id: d.id, nom: d.nom, crit: d.crit.map(c => ({ id: c.id, label: c.label, q: c.q, pos: c.pos, mid: c.mid || null, neg: c.neg })) })),
    cats: CATS, measures: MEASURES, descriptions: DESCRIPTIONS,
    apprec: APPREC, reco: RECO, ncrit: NCRIT,
    prealable: PREALABLE, impl: IMPL,
  };
}

/* ville-claim — porte d'entrée des répondants municipaux. */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST attendu" });
  try {
    const { code, person, consent } = await req.json().catch(() => ({}));
    const clean = String(code || "").trim().toUpperCase();
    if (!CODE_RE.test(clean)) return json(req, 401, { error: "Code inconnu." });

    const db = svc();
    const ip = (req.headers.get("x-forwarded-for") || "?").split(",")[0].trim();
    const originHash = await sha256("ecofisc|" + ip);

    /* rate-limit : max 8 échecs par origine dans les 15 dernières minutes */
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await db.from("login_attempts").select("*", { count: "exact", head: true })
      .eq("origin_hash", originHash).eq("success", false).gte("at", since);
    if ((count ?? 0) >= 8) return json(req, 429, { error: "Trop de tentatives. Réessayez dans 15 minutes." });

    const { data: rec, error: e1 } = await db.from("access_codes").select("*").eq("code", clean).maybeSingle();
    if (e1) throw e1;
    await db.from("login_attempts").insert({ origin_hash: originHash, code_tried: clean, success: !!rec });
    if (!rec) return json(req, 401, { error: "Code inconnu." });

    const { data: proj, error: e2 } = await db.from("projects").select("id,title,type,villes,deleted_at").eq("id", rec.project_id).maybeSingle();
    if (e2) throw e2;
    if (!proj || proj.deleted_at) return json(req, 410, { error: "Ce projet est archivé." });

    if (person && !rec.prenom) {
      if (consent !== true) return json(req, 400, { error: "Le consentement est requis." });
      const p = {
        prenom: String(person.prenom || "").trim().slice(0, 80),
        nom: String(person.nom || "").trim().slice(0, 80),
        fonction: String(person.fonction || "").trim().slice(0, 120),
      };
      if (!p.prenom || !p.nom || !p.fonction) return json(req, 400, { error: "Prénom, nom et fonction sont requis." });
      const now = new Date().toISOString();
      const { error: e3 } = await db.from("access_codes").update({ ...p, claimed_at: now, consent_at: now }).eq("code", clean);
      if (e3) throw e3;
      Object.assign(rec, p, { claimed_at: now, consent_at: now });
      await db.from("audit_log").insert({ actor: "ville:" + clean, action: "claim", detail: { project: rec.project_id, ville: rec.ville } });
    } else {
      await db.from("audit_log").insert({ actor: "ville:" + clean, action: "login", detail: { project: rec.project_id, ville: rec.ville } });
    }

    const { data: resps, error: e4 } = await db.from("responses")
      .select("code,measure_id,criterion_id,cote,comment,updated_at").eq("code", clean);
    if (e4) throw e4;

    /* le catalogue et les synthèses ne partent QUE pour un code réclamé (ou en cours) */
    const grouped = groupResponses(resps || []);
    return json(req, 200, {
      code: { code: rec.code, ville: rec.ville, project_id: rec.project_id, prenom: rec.prenom, nom: rec.nom, fonction: rec.fonction, claimed_at: rec.claimed_at, consent_at: rec.consent_at, created_at: rec.created_at },
      project: { id: proj.id, title: proj.title, type: proj.type, villes: proj.villes },
      responses: resps || [],
      synth: synthOf(grouped[clean] || {}),
      catalogue: rec.prenom ? catalogue() : null, /* pas encore réclamé → l'écran de consentement n'a pas besoin du contenu */
    });
  } catch (e) { console.error(e); return json(req, 500, { error: "Erreur serveur." }); }
});
