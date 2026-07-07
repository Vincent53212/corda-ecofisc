# Procédure des droits d'accès, de rectification et de retrait — {{OUTIL}}

*(Gabarit Corda — répond au constat « organismes non outillés » de la révision : une
procédure simple, documentée, affichée dans la politique. Le point d'entrée est un
courriel au responsable ; le traitement technique est déjà câblé dans l'outil.)*

---

## Pour la personne concernée (ce que dit la politique)

Écrire à **{{COURRIEL_RP}}** en précisant votre nom et votre municipalité. Réponse dans
un délai maximal de **30 jours**. Recours possible auprès de la Commission d'accès à
l'information (cai.gouv.qc.ca) en cas d'insatisfaction.

## Pour l'équipe du mandat (traitement interne)

| Étape | Quoi faire | Outillage |
|---|---|---|
| 1. Réception | Consigner la demande (date, personne, nature) au registre ci-dessous | Registre des demandes (bas de page) |
| 2. Vérification d'identité | Confirmer que le demandeur est bien le répondant : recouper prénom/nom/fonction/ville avec le code d'accès ; au besoin, valider par la direction générale de sa municipalité | Écran admin « Accès » |
| 3a. **Accès** | Exporter ses réponses : écran « Réponses » (sélectionner le répondant) → copie PDF/impression, ou extraction Excel | App (admin) |
| 3b. **Rectification** | Identité (prénom/nom/fonction) : correction en base par l'admin. Cotations : la personne se reconnecte avec son code et modifie elle-même | App + SQL au besoin |
| 3c. **Retrait** | Écran « Accès » → **Supprimer le code** → destruction RÉELLE et immédiate de l'identité ET de toutes ses réponses (cascade en base) | App (admin) |
| 4. Confirmation | Répondre par écrit à la personne (dans les 30 jours) ; consigner la clôture au registre | — |

**Notes.** Le retrait est irréversible et gratuit. Si la personne souhaite ensuite
recontribuer, un nouveau code est émis. Les données déjà **agrégées et diffusées**
(portraits par ville) ne sont pas rétroactivement modifiables — le mentionner dans la
réponse, conformément à la politique.

## Registre des demandes

| Date | Personne (ville) | Nature (accès/rectif/retrait) | Traitée le | Par | Notes |
|---|---|---|---|---|---|
| | | | | | |
