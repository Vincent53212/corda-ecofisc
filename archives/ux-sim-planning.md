# Architecture
- Header avec logo: se référer au logo en haut de "C:\Users\Vince\OneDrive - École Nationale d'Administration Publique\Documents\Ste-Thérèse MRC\Appli\corda-levered-all-weather-factsheet.html" pour le logo, mais remonter corda un peu et mettre en sous-titre "Écofiscalité" parce qu'il y aura d'autres produits corda. D'ailleurs si tu veux te changer les idées un peu tu peux lire le doc haha c'est un autre projet.
- Accueil: Écran de connexion avec un code à usage unique, le code admin étant pour l'instant Corda$2026. 
	- Admins
		- Accueil: menu déroulant pour choisir le projet (ex: MRC Thérèse-de-Blainville)
		- Orchestrateur de discussion
			- *Absent de la première version, à suivre
			- Juste mettre l'option mais qui n'ouvre rien, avec un "*à suivre*"
		- Calculateur
			- Comme discuté, estime les revenus et l'impact distributif par mesure
			- Exportateur de fiches avec données
			- Idéalement, après avoir configuré une mesure, on peut l'ajouter au portfolio (bouton +, ou finaliser jsp) et avoir une analyse globale des mesures proposées
		- Analyse
			- Un mode permettant de combiner les résultats des deux modes pour générer des visuels, présentations et rapports
	- Utilisateurs
		- Orchestrateur de discussion
			- *Absent de la première version, à suivre
		- Communications
			- Données de l'orchestrateur, du calculateur ou analyses globales partagées par les admins
			- Note quand un utilisateur ouvre le "message"
			- Outil pour commenter


## Manager de projets (ajout 26-06-30)
- Ouverture: Lors du clic en haut sur le sélecteur de projets, la dernière option de la liste est "+ gestionnaire de projets" et ouvre cette page
- Liste les projets ouverts, date de création, option supprimer (demande confirmation, fait quand même une sauvegarde complète des fichiers mais dans /old)
- Option *Nouveau projet*
	- Titre du projet
	- Ville unique / multi-villes
	- Pour ville unique, titre=ville, pour multi-villes, liste à éléments modifiables avec bouton + pour ajouter une ville
- Même design que le reste du site