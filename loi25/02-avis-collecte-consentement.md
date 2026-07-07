# Avis de collecte et consentement — {{OUTIL}}

*(Gabarit Corda — texte affiché DANS l'outil à la première connexion, avant toute
saisie d'identité. Art. 8 : informer de la finalité, des moyens, des droits, AVANT ou
AU MOMENT de la collecte. Le consentement est bloquant et horodaté en base
(`access_codes.consent_at`). CE FICHIER EST LA SOURCE : toute modification doit être
reportée mot pour mot dans l'application.)*

---

## Texte affiché (encadré « Avis de collecte — renseignements personnels »)

> Vos prénom, nom et fonction servent uniquement à rattacher vos cotations à votre
> ville dans le cadre du mandat d'analyse écofiscale « **{{PROJET}}** » (ENAP/CERGO).
> L'accès est restreint à l'équipe de recherche ; aucune diffusion nominative. Vous
> pouvez en tout temps demander l'accès à vos renseignements, leur rectification ou
> leur retrait auprès de l'équipe du mandat. [Politique de confidentialité](politique.html)

**Case à cocher (obligatoire) :** « J'ai lu l'avis et je consens à la collecte de ces
renseignements. »

## Caractéristiques du consentement (exigences remplies)

| Exigence | Mise en œuvre |
|---|---|
| Manifeste, libre, éclairé | Case non pré-cochée, bloquante ; avis affiché avant la saisie |
| Fins spécifiques | Une seule finalité énoncée (rattacher les cotations à la ville, mandat nommé) |
| Preuve | Horodatage `consent_at` inscrit côté serveur au moment précis du consentement |
| Retrait possible | Procédure des droits (document 05) — la suppression du code détruit les réponses |
| Termes simples et clairs | Texte court, sans jargon, lien vers la politique complète |

## Notes d'implantation

- Le titre du projet est **injecté dynamiquement** (`{{PROJET}}` = titre du projet
  auquel le code appartient) — le même texte sert donc à tous les mandats.
- Le contenu de l'outil (questions, mesures) n'est livré **qu'après** ce consentement.
