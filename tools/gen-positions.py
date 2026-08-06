# -*- coding: utf-8 -*-
"""
Extrait les POSITIONS de toutes les unités d'évaluation du Québec, une fois,
en un fichier par municipalité — pour que la carte d'incidence se remplisse
toute seule à la création d'un projet.

POURQUOI CE DÉTOUR
------------------
Le rôle a deux chemins d'entrée dans l'app, et un seul porte la géométrie :
  · rechargement automatique  → RL<code>_2026.XML du MAMH : format prescrit,
    AUCUNE coordonnée (vérifié : les champs RL0104G/H sont vides partout) ;
  · CSV de tools/etl-role.py  → GeoPackage : les points y sont.
Sans ce script, toute ville créée par le sélecteur arrive sans position et sa
carte reste vide jusqu'à une manipulation manuelle.

Les fichiers produits sont déposés dans un espace public (tools/upload-positions.js),
puis lus par l'Edge Function role-import en même temps que le XML.

RÉPLICABLE : aucun client en dur. À REJOUER À CHAQUE MILLÉSIME du rôle.

Usage :
    python tools/gen-positions.py <ROLE20XX.gpkg> [dossier-de-sortie]

Produit :
    positions/<code_mun>.csv        (matricule,lon,lat — degrés NAD83, 5 déc. ≈ 1 m)
    positions/_index.json           (inventaire : code → nb d'unités, taille)

Source : https://donneesouvertes.affmunqc.net/role/ROLE20XX_GEOPACKAGE.zip
Licence : MAMH, CC-BY 4.0.
"""
import json
import os
import re
import sqlite3
import struct
import sys
from collections import defaultdict

# 5 décimales ≈ 1,1 m de longitude à cette latitude : très en deçà de la plus
# fine grille offerte (250 m). Au-delà, on paierait des octets pour du bruit.
DECIMALES = 5


def gpkg_point(blob):
    """(lon, lat) du premier point d'un blob GeoPackage, ou None. Voir
    tools/etl-role.py pour le détail du format (en-tête GP + WKB)."""
    if blob is None or len(blob) < 8 or blob[0:2] != b"GP":
        return None
    drapeaux = blob[3]
    if drapeaux & 0x10:
        return None
    n_env = {0: 0, 1: 4, 2: 6, 3: 6, 4: 8}.get((drapeaux >> 1) & 0x07)
    if n_env is None:
        return None
    return _wkb_premier_point(blob, 8 + n_env * 8)


def _wkb_premier_point(b, pos):
    if pos + 5 > len(b):
        return None
    bo = "<" if b[pos] == 1 else ">"
    typ = struct.unpack_from(bo + "I", b, pos + 1)[0]
    base = (typ & 0x0FFFFFFF) % 1000
    pos += 5
    if base == 1:
        return struct.unpack_from(bo + "dd", b, pos)
    if base == 4:
        n = struct.unpack_from(bo + "I", b, pos)[0]
        return _wkb_premier_point(b, pos + 4) if n else None
    return None


def trouver_couche(cx):
    """(table, colonne géométrique, srs_id) de la couche des unités."""
    lignes = list(cx.execute(
        "SELECT table_name, column_name, srs_id FROM gpkg_geometry_columns"))
    if not lignes:
        raise SystemExit("Aucune couche géométrique dans ce GeoPackage.")
    for t, col, srs in lignes:
        if "unite" in t.lower():
            return t, col, srs
    return lignes[0]


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    gpkg = sys.argv[1]
    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sortie = sys.argv[2] if len(sys.argv) > 2 else os.path.join(racine, "positions")
    os.makedirs(sortie, exist_ok=True)

    cx = sqlite3.connect("file:" + gpkg + "?mode=ro", uri=True)
    table, colonne, srs = trouver_couche(cx)
    print("Couche : %s.%s (SRS %s)" % (table, colonne, srs))
    if srs not in (4269, 4326):
        raise SystemExit(
            "⚠ SRS %s inattendu. Ce script écrit des DEGRÉS (lon/lat) et la fonction\n"
            "  SQL calc_grille les projette en supposant un SRS géographique. Un SRS\n"
            "  projeté produirait une carte fausse EN SILENCE.\n"
            "  → adapter calc_grille avant de retirer ce garde-fou." % srs)

    cols = {r[1].lower(): r[1] for r in cx.execute("PRAGMA table_info('%s')" % table)}
    f_mun = cols.get("code_mun") or cols.get("rl0101a")
    f_mat = cols.get("mat18") or cols.get("matricule")
    if not f_mun or not f_mat:
        raise SystemExit("Couche sans code_mun/mat18 : impossible de répartir par municipalité.")

    print("Lecture des géométries (une passe)…")
    par_mun = defaultdict(list)
    n = vides = hors = 0
    q = 'SELECT %s, %s, "%s" FROM "%s"' % (f_mun, f_mat, colonne, table)
    for mun, mat, blob in cx.execute(q):
        n += 1
        code = str(mun or "").strip()
        # les territoires non organisés portent un code non numérique (« NR942 ») :
        # ils n'apparaissent dans aucun projet de l'app, qui ne connaît que les
        # 1 011 municipalités du sélecteur
        if not re.fullmatch(r"\d{5}", code):
            hors += 1
            continue
        p = gpkg_point(blob)
        if p is None:
            vides += 1
            continue
        par_mun[code].append("%s,%.*f,%.*f" % (str(mat).strip(), DECIMALES, p[0], DECIMALES, p[1]))
        if n % 500000 == 0:
            print("  %d lignes lues…" % n)

    print("\n%d lignes lues · %d hors municipalités · %d sans géométrie" % (n, hors, vides))
    print("Écriture de %d fichiers dans %s …" % (len(par_mun), sortie))

    index, total = {}, 0
    for code, lignes in sorted(par_mun.items()):
        chemin = os.path.join(sortie, code + ".csv")
        contenu = "matricule,lon,lat\n" + "\n".join(lignes) + "\n"
        with open(chemin, "w", encoding="utf-8", newline="") as fh:
            fh.write(contenu)
        taille = len(contenu.encode("utf-8"))
        index[code] = {"unites": len(lignes), "octets": taille}
        total += taille

    with open(os.path.join(sortie, "_index.json"), "w", encoding="utf-8") as fh:
        json.dump({"millesime": (re.search(r"20\d{2}", os.path.basename(gpkg)) or ["?"])[0],
                   "decimales": DECIMALES, "municipalites": index}, fh, ensure_ascii=False)

    gros = sorted(index.items(), key=lambda kv: -kv[1]["octets"])[:5]
    print("\n→ %d fichiers · %.1f Mo au total" % (len(index), total / 1048576))
    print("Les 5 plus gros :")
    for code, i in gros:
        print("   %s : %7d unités · %5.1f Mo" % (code, i["unites"], i["octets"] / 1048576))
    print("\nProchaine étape : node tools/upload-positions.js (dépôt dans Supabase Storage).")


if __name__ == "__main__":
    main()
