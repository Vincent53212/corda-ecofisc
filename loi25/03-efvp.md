# Évaluation des facteurs relatifs à la vie privée (EFVP) — {{OUTIL}}

*Version 1.0 (brouillon) · {{PROJET}} · Juillet 2026*
*(Gabarit Corda — EFVP « courte », proportionnée à la sensibilité du système
(art. 3.3 : EFVP proportionnée ; art. 17 : évaluation écrite avant communication hors
Québec). Rédigée d'après l'inventaire réel des données — `docs/dictionnaire-donnees.md`
et `deploiement/schema.sql` font foi.)*

---

## 1. Description du système

{{OUTIL}} numérise la grille d'analyse multicritère de {{CHERCHEURE}} : des
représentants municipaux désignés cotent 36 mesures écofiscales sur 23 critères ;
l'outil calcule les recommandations et le portrait régional. Accès par **code personnel**
remis par l'équipe du mandat (aucune inscription publique) ; administration par comptes
nominatifs. Le contenu et les calculs sont servis par le serveur **après
authentification** ; la page publique ne contient aucun renseignement.

## 2. Inventaire des renseignements personnels

| Donnée | Table | Sensibilité | Minimisation |
|---|---|---|---|
| Prénom, nom, fonction | `access_codes` | Identité **professionnelle** (contexte public municipal) | Aucun autre identifiant (ni courriel, ni téléphone) |
| Cotations (+1/0/−1) | `responses` | Opinions professionnelles — faible seule, **ré-identifiable** en petit groupe (N≈7 villes) | Diffusion agrégée par ville uniquement |
| Commentaires libres | `responses.comment` | **La zone la plus sensible** : peut contenir des renseignements sur des tiers | Analyse par IA interdite par défaut (D5) ; détachement des identités avant toute analyse externe |
| Consentement, connexions | `access_codes.consent_at`, `audit_log` | Traçabilité | Le journal ne contient jamais le contenu des réponses |
| Tentatives de connexion | `login_attempts` | Anti-force-brute | **Empreinte hachée** de l'origine — jamais l'adresse IP en clair |

## 3. Mesures de protection en place

Base **verrouillée par défaut** (RLS : le rôle public n'a aucun accès) · chiffrement en
transit (HTTPS/TLS) et au repos · villes limitées à **leurs propres** réponses via
fonctions serveur validant chaque écriture (liste blanche des champs, bornage) ·
verrouillage après 8 tentatives/15 min · comptes admin nominatifs, inscriptions
publiques désactivées · journal des accès (connexions, lectures, exports) · page
publique sans contenu ni donnée (en-têtes de sécurité CSP, anti-hameçonnage par iframe
interdit) · destruction réelle : suppression d'un code = cascade sur ses réponses ;
purge des projets archivés à l'échéance `{{DUREE_CONSERVATION}}`.

## 4. Communication hors Québec (art. 17) — évaluation écrite

| Fait | Analyse |
|---|---|
| La base réside chez {{HEBERGEUR_DONNEES}} : région « Canada Central » = **Ontario**, donc **hors Québec** (mais au Canada, régime fédéral LPRPDE) | Communication hors Québec au sens de l'art. 17 → la présente évaluation en tient lieu |
| Supabase Inc. est une société **américaine** (sous-traitant infonuagique ; infrastructure AWS ca-central-1) | Encadrement contractuel : conditions de service et addenda de traitement des données (DPA) de Supabase, clauses contractuelles types ; chiffrement au repos |
| Les **fonctions serveur** (calculs) s'exécutent sur un réseau distribué — un traitement **transitoire** peut survenir hors Canada | ⏳ **Point ouvert** : épinglage régional des fonctions possible si l'équipe l'exige ; les données au repos, elles, ne quittent pas ca-central-1 |
| Sensibilité globale : identités professionnelles + opinions dans un contexte municipal public | **Faible à modérée** — pas de renseignements financiers, de santé ni de mineurs |

**Conclusion (proposée)** : les renseignements bénéficient d'une protection adéquate,
équivalente aux principes de la loi québécoise, compte tenu de leur sensibilité, des
mesures techniques et de l'encadrement contractuel. À réévaluer si la nature des données
change (ex. données financières du calculateur d'impact).

## 5. Décisions rattachées et suivi

| # | Décision | Statut |
|---|---|---|
| D1 | Durée de conservation : {{DUREE_CONSERVATION}} | ⏳ à confirmer |
| D2 | Responsable RP : {{RESPONSABLE_RP}} | ⏳ à confirmer |
| D5 | Interdiction par défaut d'analyse des commentaires par IA | ✔ inscrite |
| — | Épinglage régional des fonctions serveur | ⏳ à discuter |

*Réévaluation de la présente EFVP : à chaque ajout de fonctionnalité traitant des RP
(orchestrateur de compromis, calculateur d'impact) ou changement de sous-traitant.*
