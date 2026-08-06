# Format universel des intrants — Corda Écofiscalité

> **À qui s'adresse ce document :** aux municipalités qui nous transmettent des données
> **au-delà du rôle d'évaluation**. Le rôle (valeurs, usages CUBF, logements,
> superficies), nous l'avons déjà — c'est une donnée ouverte du MAMH que nous chargeons
> nous-mêmes. Ce qu'il nous faut de vous : ce que **vos systèmes** savent et que le rôle
> ignore.

## Le principe en une phrase

**Un fichier Excel ou CSV, une ligne par unité d'évaluation (matricule), vos colonnes à
vous.** C'est tout. Votre service de géomatique ou des finances peut produire ça depuis
n'importe quel outil (ArcGIS, JMap, AccèsCité, Excel).

## Exemple — redevance sur le déficit de canopée

La ville détermine, selon **ses** données, quelles unités sont visées et leur couvert :

| matricule | zone_taxable | canopee_pct |
|---|---|---|
| 7325-88-1234-5-000-0000 | oui | 12,5 |
| 7325-88-2233-4-000-0000 | non | 41,0 |
| 7325-89-0011-2-000-0000 | oui | 8,0 |

Nous joignons ces colonnes au rôle par le **matricule**, et le calculateur peut alors
simuler la mesure (assiette = unités `zone_taxable = oui`, modulation par `canopee_pct`).

## Les règles (courtes)

1. **Format** : CSV (UTF-8, séparateur virgule ou point-virgule) ou Excel `.xlsx`
   première feuille. Première ligne = en-têtes.
2. **Colonne obligatoire** : `matricule` — le matricule complet de l'unité d'évaluation,
   tel qu'au rôle. C'est la clé de jointure ; sans lui, la ligne est ignorée.
3. **Vos colonnes** : autant que voulu, noms courts sans accents ni espaces
   (`zone_taxable`, `canopee_pct`, `desservi_aqueduc`, `stationnement_cases`…).
4. **Valeurs** : nombres SANS séparateur de milliers (12500 et non 12 500), décimale
   point ou virgule ; oui/non pour les booléens ; case vide = inconnu.
5. **Une thématique par fichier** de préférence (ex. `canopee-blainville-2026.csv`) —
   le fichier est votre « source », son nom reste tracé dans l'outil.
6. **Données géographiques** (zones, polygones) : exportez-les **par matricule** («
   quelles unités tombent dans la zone ») — vos outils SIG font cette intersection en
   quelques clics. L'échange de géométries brutes viendra dans une version future.
7. ⚠ **Aucun renseignement personnel** : pas de noms de propriétaires, pas de comptes de
   taxes individuels nominatifs. Les matricules et attributs physiques suffisent.

## Ce que ça devient chez nous

Chaque colonne est stockée en base sous forme **matricule → attribut → valeur**, greffée
au rôle, versionnée par fichier source. Attributs déjà prévus par le calculateur (à
transmettre quand une ville veut simuler la mesure correspondante) :

| Attribut suggéré | Type | Débloque |
|---|---|---|
| `desservi_aqueduc`, `desservi_egout` | oui/non | m05 — terrains vagues desservis |
| `vacant` | oui/non | m06/m07 — logements/locaux vacants |
| `zone_taxable`, `canopee_pct` | oui/non, % | m19 — perte de canopée |
| `stationnement_cases`, `stationnement_m2` | nombre | m12 — espaces de stationnement |
| `surface_minerale_m2` | nombre | m15 — surfaces non végétalisées |

*(Un attribut inconnu n'est jamais rejeté — il est conservé et devient utilisable dès
qu'une mesure s'en sert.)*

---

## Annexe — runbook interne « nouveau projet » (équipe Corda)

**Le chemin normal ne demande plus rien de tout ça.** À la création d'un projet, on
cherche les municipalités par leur nom dans le sélecteur : le code officiel s'attache
tout seul et l'app télécharge le rôle du MAMH pour chacune, avec une barre de
progression. Si une ville échoue, elle se recharge d'un clic (**Réglages ⚙ → ↻**).
La taille n'est plus un obstacle : le fichier est lu en flux (Montréal, 758 Mo, passe).

Le chemin ci-dessous reste le **secours** — site du MAMH indisponible, millésime plus
ancien, ou besoin des colonnes géoréférencées que le XML ne porte pas :

1. Trouver les **codes géographiques** des municipalités du mandat (répertoire MAMH/ISQ).
2. Télécharger le rôle géoréférencé du millésime courant :
   `https://donneesouvertes.affmunqc.net/role/ROLE<année>_GEOPACKAGE.zip` (~600 Mo, tout
   le Québec, licence CC-BY 4.0 — dézipper hors OneDrive).
3. Extraire : `python tools/etl-role.py <gpkg> <slug-projet> <code=ville_id> …`
   (les `ville_id` = ids des villes du projet dans l'app).
4. Charger le CSV produit via **Réglages → Sources de données** de l'app (projet actif),
   ou l'import CSV du Table Editor Supabase en secours.
5. Les intrants des villes (le présent format) se chargent au même endroit, à mesure
   qu'ils arrivent.
