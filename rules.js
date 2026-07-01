/* ============================================================================
   RULES.JS — Moteur de cotation de l'Orchestrateur (analyse multicritère)
   Un produit Corda · Écofiscalité — grille V3, dir. Pre Fanny Tremblay-Racicot.

   CE FICHIER EST LA SOURCE UNIQUE des règles métier :
   · les 4 dimensions et leurs 22 critères (questions verbatim de la grille V3,
     avec la « boussole » +/− de chaque question) ;
   · apprec()      — somme des cotes d'une dimension → appréciation ;
   · reco()        — 4 appréciations → recommandation de la mesure ;
   · villeMoyenne()— agrégation d'une ville = moyenne arrondie de ses répondants ;
   · mrcSynthese() — synthèse MRC = majorité des recommandations des villes.

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
  else { root.Rules = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  "use strict";

  /* ---------- 4 dimensions · 22 critères (questions verbatim de la grille V3) ----------
     pos/neg = « boussole de cotation » : ce que signifie une réponse + ou − pour CETTE
     question (7 questions sont à polarité inversée : un « oui » y est défavorable). */
  const DIMENSIONS = [
    {id:'pf', nom:'Potentiel fiscal', crit:[
      {id:'pf1', label:"Largeur de l'assiette fiscale", q:"L'assiette fiscale concerne-t-elle un nombre de contribuables ou encore un flux ou un stock monétaire suffisamment grand pour assurer à court terme des revenus qui peuvent être considérés comme étant significatifs ?", pos:"Assiette large (nombreux contribuables ou flux important)", neg:"Assiette étroite ou marginale"},
      {id:'pf2', label:"Potentiel de croissance", q:"L'assiette fiscale présente-t-elle un potentiel de croissance raisonnablement prévisible à moyen et long terme ?", pos:"Croissance prévisible à moyen-long terme", neg:"Stagnation ou déclin attendu"},
      {id:'pf3', label:"Marge de manœuvre sur le taux du prélèvement", q:"En considérant le contexte de compétitivité fiscale de la Ville, le taux de prélèvement actuel sur cette assiette fiscale peut-il être considéré comme étant déjà élevé ?", pos:"Taux actuel bas → de la marge de manœuvre", neg:"Taux déjà élevé → peu de marge"},
    ]},
    {id:'sg', nom:'Saine gestion administrative', crit:[
      {id:'sg1', label:"Coûts d'administration", q:"Un prélèvement supplémentaire sur cette assiette fiscale nécessiterait-il des ressources (immobilisations, exploitation, conformité fiscale) dont le coût peut être considéré comme élevé ou prohibitif ? Par exemple, le processus de perception est-il compatible avec la méthode actuelle de gestion du compte de taxes ?", pos:"Coûts d'administration faibles, perception simple", neg:"Coûts élevés ou prohibitifs"},
      {id:'sg2', label:"Utilisateur-payeur", q:"La mesure s'appuie-t-elle sur le principe d'utilisateur-payeur ? Permet-elle d'accroître la participation financière de catégories de contribuables dont la consommation de services publics excède les coûts de production de la municipalité ?", pos:"S'appuie sur l'utilisateur-payeur", neg:"Aucun lien entre usage et coût"},
      {id:'sg3', label:"Applicabilité (court terme)", q:"À court terme, les données ou la technologie nécessaires à la mise en œuvre de la mesure sont-elles disponibles et applicables selon les pratiques actuellement en vigueur ?", pos:"Données et technologie déjà disponibles", neg:"Non disponibles à court terme"},
      {id:'sg4', label:"Conformité réglementaire", q:"La mesure entre-t-elle en contradiction avec des réglementations ou politiques en vigueur ? Nécessite-t-elle un nouveau régime de réglementation ou une modification de la réglementation actuelle ?", pos:"Aucun conflit; le cadre actuel suffit", neg:"Conflit ou nouvelle réglementation requise"},
      {id:'sg5', label:"Contestation judiciaire", q:"La mesure possède-t-elle un risque de contestation judiciaire ?", pos:"Risque de contestation faible ou nul", neg:"Risque élevé de contestation judiciaire"},
      {id:'sg6', label:"Orientations du plan stratégique", q:"La mesure renforce-t-elle les orientations ou dispositions prévues au plan stratégique ou à d'autres documents de la municipalité ?", pos:"Renforce le plan stratégique", neg:"S'écarte des orientations"},
    ]},
    {id:'ae', nom:'Acceptabilité et équité', crit:[
      {id:'ae1', label:"Perception", q:"La mesure recevrait-elle un niveau d'approbation de la population supérieur à celui auquel on pourrait s'attendre d'un prélèvement fiscal ?", pos:"Approbation probable de la population", neg:"Rejet probable"},
      {id:'ae2', label:"Disponibilité d'alternatives", q:"En principe, un contribuable peut-il diminuer ou éviter les prélèvements en modifiant son comportement ?", pos:"Évitable en changeant de comportement", neg:"Prélèvement subi, sans échappatoire"},
      {id:'ae3', label:"Personnes vulnérables", q:"La mesure a-t-elle un impact financier plus important auprès des personnes vulnérables ?", pos:"Peu ou pas d'impact sur les personnes vulnérables", neg:"Impact important sur les personnes vulnérables"},
      {id:'ae4', label:"Capacité de payer", q:"La mesure permet-elle d'accroître raisonnablement la participation financière des personnes (morales ou physiques) ayant une capacité de payer supérieure ?", pos:"Cible les hautes capacités de payer", neg:"Frappe surtout les faibles capacités de payer"},
      {id:'ae5', label:"Équité temporelle", q:"La mesure permet-elle de cibler des catégories de contribuables qui ont bénéficié, dans les dernières années, d'un transfert fiscal favorable ?", pos:"Corrige un avantage fiscal passé", neg:"Sans effet correctif (ou l'accentue)"},
      {id:'ae6', label:"Équité territoriale", q:"La mesure a-t-elle potentiellement un impact plus important pour les contribuables de certains secteurs de la municipalité ?", pos:"Impact réparti uniformément sur le territoire", neg:"Impact concentré sur certains secteurs"},
      {id:'ae7', label:"Abordabilité", q:"Lorsqu'applicable, la mesure a-t-elle un effet sur l'abordabilité des logements ?", pos:"Sans effet — ou améliore l'abordabilité du logement", neg:"Nuit à l'abordabilité (renchérit le logement)"},
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
  const NCRIT = ALLCRIT.length; // 22

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
     S = somme des réponses présentes (+1/0/−1). Voir docs/methodologie.md §2. */
  function apprec(cotes){
    const S=cotes.reduce((a,b)=>a+b,0);
    const hasNeg=cotes.some(c=>c<0), hasPos=cotes.some(c=>c>0);
    if(S>=2 && !hasNeg) return 'tf';
    if(S>=1) return 'f';
    if(S===0) return 'n';         /* inclut « aucune réponse » (garde défensive) */
    if(S<=-2 && !hasPos) return 'pdf';
    return 'pf';
  }

  /* ---------- Règle 2 : 4 appréciations de dimension → recommandation ----------
     Voir docs/methodologie.md §3. NOTE : la V3 énumérait « (fav≥2 et pf=1) ou
     tout-neutre » comme cas d'étude PUIS retombait de toute façon sur 'etude'
     (branche morte, constat C de la révision 1). Simplifié ici SANS changement
     de comportement : tout ce qui n'est ni 'non' ni 'rec' → mise à l'étude. */
  function reco(aps){
    const fav=aps.filter(a=>a==='f'||a==='tf').length;
    const pf=aps.filter(a=>a==='pf').length;
    const pdf=aps.filter(a=>a==='pdf').length;
    if(pdf>=1 || pf>=2) return 'non';
    if(pf===0 && pdf===0 && fav>=2) return 'rec';
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
     À n'appeler qu'avec ≥1 recommandation (les appelants filtrent les villes sans données). */
  function mrcSynthese(recos){
    const cc={rec:0,etude:0,non:0}; recos.forEach(r=>cc[r]++);
    const maj=(cc.non>=cc.rec && cc.non>=cc.etude)?'non':(cc.rec>=cc.etude)?'rec':'etude';
    return {cc, maj};
  }

  return Object.freeze({ DIMENSIONS, ALLCRIT, NCRIT, APPREC, RECO, apprec, reco, villeMoyenne, mrcSynthese });
}));
