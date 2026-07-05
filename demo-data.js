/* ============================================================================
   DEMO-DATA.JS — Projet « Démo » de l'Orchestrateur (données 100 % FICTIVES)
   Un produit Corda · Écofiscalité.

   Générateur DÉTERMINISTE (PRNG semé) du projet de démonstration : 7 villes,
   9 répondants fictifs, cotations plausibles et commentaires d'exemple.
   Déterministe = les mêmes données partout : le bouton « Projet Démo » de
   l'app (mode local) et le script tools/gen-seed-demo.js (SQL pour Supabase)
   produisent EXACTEMENT le même jeu de données.

   ⚠ Aucune personne réelle : noms inventés, projet étiqueté « données fictives ».
   Format UMD : <script src="demo-data.js"> côté navigateur (expose DemoData),
   require() côté Node. Dépend de rules.js (catalogue des mesures).
   ============================================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./rules.js')); }
  else { root.DemoData = factory(root.Rules); }
}(typeof self !== 'undefined' ? self : this, function (Rules) {
  "use strict";
  const {MEASURES, DIMENSIONS} = Rules;

  const PROJECT_ID = 'demo';
  const VILLES = [
    {id:'blainville', nom:'Blainville'},
    {id:'boisbriand', nom:'Boisbriand'},
    {id:'bois-des-filion', nom:'Bois-des-Filion'},
    {id:'lorraine', nom:'Lorraine'},
    {id:'rosemere', nom:'Rosemère'},
    {id:'sainte-therese', nom:'Sainte-Thérèse'},
    {id:'sainte-anne-des-plaines', nom:'Sainte-Anne-des-Plaines'},
  ];

  /* Personnes FICTIVES (aucun lien avec des personnes réelles). */
  const RESPONDENTS = [
    {code:'BLA-DEMO01', ville:'blainville',              prenom:'Julie',      nom:'Bergevin',   fonction:'Directrice des finances'},
    {code:'BLA-DEMO02', ville:'blainville',              prenom:'Marc-André', nom:'Rousselle',  fonction:'Trésorier adjoint'},
    {code:'BOI-DEMO01', ville:'boisbriand',              prenom:'Karine',     nom:'Lachapelle', fonction:'Directrice générale adjointe'},
    {code:'BDF-DEMO01', ville:'bois-des-filion',         prenom:'Simon',      nom:'Théberge',   fonction:'Directeur de l’urbanisme'},
    {code:'LOR-DEMO01', ville:'lorraine',                prenom:'Élise',      nom:'Falardeau',  fonction:'Trésorière'},
    {code:'ROS-DEMO01', ville:'rosemere',                prenom:'Patrick',    nom:'Vaillant',   fonction:'Directeur des services techniques'},
    {code:'STH-DEMO01', ville:'sainte-therese',          prenom:'Nathalie',   nom:'Comtois',    fonction:'Directrice des finances'},
    {code:'STH-DEMO02', ville:'sainte-therese',          prenom:'Hugo',       nom:'Périgny',    fonction:'Conseiller en environnement'},
    {code:'SAD-DEMO01', ville:'sainte-anne-des-plaines', prenom:'Caroline',   nom:'Duquette',   fonction:'Directrice générale'},
  ];
  /* Un code NON réclamé, pour démontrer en direct la 1re connexion + consentement. */
  const UNCLAIMED = [{code:'LOR-DEMO02', ville:'lorraine'}];

  const COMMENTS = [
    "À valider avec le service juridique avant d'aller plus loin.",
    "Nos données actuelles ne permettent pas de suivre cette assiette finement.",
    "Déjà discuté au comité de finances — accueil plutôt favorable.",
    "Attention à l'effet sur les commerces du centre-ville.",
    "Le règlement actuel devrait suffire, à confirmer.",
    "Expérience similaire dans une MRC voisine : résultats encourageants.",
    "Risque de déplacement du problème vers les municipalités voisines.",
    "Prévoir une campagne d'information avant toute mise en œuvre.",
  ];

  /* PRNG mulberry32 — semé, donc reproductible. */
  function rng(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }

  /* Horodatages fixes (déterminisme) : cotations étalées sur 3 jours fictifs. */
  const T0 = Date.UTC(2026,5,29,13,0,0); /* 29 juin 2026, 13 h UTC */
  const iso = (offsetMin)=> new Date(T0 + offsetMin*60000).toISOString();

  function build(){
    const codes=[], responses={};
    RESPONDENTS.forEach((r,ri)=>{
      const claimedAt=iso(ri*37);
      codes.push({code:r.code, ville:r.ville, project:PROJECT_ID,
        person:{prenom:r.prenom, nom:r.nom, fonction:r.fonction},
        createdAt:iso(ri*11), claimedAt, consentAt:claimedAt});
      const rand=rng(hash('demo-'+r.code));
      let clock=ri*37+30;
      MEASURES.forEach((m,mi)=>{
        /* ~1 mesure sur 6 laissée non cotée par ce répondant (réalisme « en cours ») */
        if(rand() < 0.16) return;
        /* tendance de la mesure (partagée entre répondants via hash du m.id), nuancée
           PAR DIMENSION (une mesure peut être forte fiscalement mais faible en équité)
           puis bruitée par répondant/critère → portraits mélangés et plausibles */
        const mu = ((hash('mesure-'+m.id) % 1000)/1000)*1.3 - 0.32; /* biais mesure ∈ [−0,32 ; +0,98] */
        DIMENSIONS.forEach(d=>{
          const dOff = ((hash('dim-'+m.id+'-'+d.id) % 1000)/1000)*1.1 - 0.55; /* écart de dimension ∈ [−0,55 ; +0,55] */
          d.crit.forEach(c=>{
            const x = mu + dOff + (rand()*2-1)*0.75;                /* bruit répondant/critère */
            const cote = x > 0.3 ? 1 : x < -0.3 ? -1 : 0;
            clock += 1;
            const rec = {cote, comment:'', updatedAt:iso(clock)};
            if(rand() < 0.018) rec.comment = COMMENTS[Math.floor(rand()*COMMENTS.length)];
            responses[r.code+'|'+m.id+'|'+c.id] = rec;
          });
        });
      });
    });
    UNCLAIMED.forEach((u,i)=>codes.push({code:u.code, ville:u.ville, project:PROJECT_ID, person:null, createdAt:iso(500+i), claimedAt:null}));
    return {
      project:{id:PROJECT_ID, title:'Démo — MRC (données fictives)', type:'multi', villes:VILLES.map(v=>({id:v.id, nom:v.nom})), createdAt:iso(0)},
      codes, responses,
    };
  }

  return Object.freeze({ PROJECT_ID, build });
}));
