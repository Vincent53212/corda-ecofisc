# -*- coding: utf-8 -*-
"""
ETL — Rôle d'évaluation foncière géoréférencé (MAMH, données ouvertes CC-BY 4.0)
→ intrant au FORMAT UNIVERSEL Corda (docs/format-intrants.md)

Un GeoPackage est une base SQLite : on lit la table attributaire directement
avec la bibliothèque standard (zéro dépendance).

v2 (2026-08-06) — LA GÉOMÉTRIE EST LUE. Les attributs vivent dans une table
(`b05v_unite_evaln_<annee>`), les points dans une AUTRE (`rol_unite_p_<annee>`) ;
on les joint par (code_mun, mat18). Le CSV gagne deux colonnes `lon` et `lat`,
qui alimentent la carte d'incidence du Calculateur.

⚠ On écrit les degrés BRUTS du SRS source (EPSG:4269, NAD83 géographique), sans
  reprojection. Un degré de longitude vaut 77,7 km à la latitude de la MRC et un
  degré de latitude 110,6 km : découper « en mètres » directement sur ces valeurs
  donnerait des cellules étirées de 40 %. La conversion se fait à l'agrégation
  (fonction SQL calc_grille), au seul endroit où elle sert et où elle se relit.

RÉPLICABLE PAR PROJET : les codes municipaux se passent en argument — aucun
client en dur. Pour un nouveau mandat : trouver les codes géographiques des
municipalités (répertoire MAMH/ISQ), relancer.

Usage :
    python tools/etl-role.py <ROLE20XX.gpkg> <slug-projet> <code=ville_id> [...]

Exemple (MRC Thérèse-De Blainville) :
    python tools/etl-role.py role.gpkg tdb 73005=boisbriand 73010=sainte-therese \
        73015=blainville 73020=rosemere 73025=lorraine 73030=bois-des-filion \
        73035=sainte-anne-des-plaines

Produit :
    intrants/role-<projet>-<annee>.csv   (~60 k lignes pour la TDB)
    + rapport de contrôle à l'écran (n unités, valeur totale et EMPRISE par ville)

Le contrôle qui compte : les emprises des villes doivent être disjointes et
ordonnées d'ouest en est. Une jointure ratée le montre immédiatement.

Source : https://donneesouvertes.affmunqc.net/role/ROLE2026_GEOPACKAGE.zip
Guide des champs : « Répertoire des renseignements prescrits du rôle » (MAMH).
Les ville_id doivent correspondre aux ids de villes du projet dans l'app.
"""
import csv
import io
import os
import sqlite3
import struct
import sys

# Champs du rôle (répertoire MAMH) → colonnes du format universel
#   RL0105A  utilisation prédominante (CUBF)
#   RL0302A  superficie du terrain (m²)
#   RL0311A  nombre de logements
#   RL0402A  valeur du terrain ($)
#   RL0403A  valeur du bâtiment ($)
#   RL0404A  valeur de l'immeuble ($)
#   + matricule (identifiant d'unité) et code de municipalité


def trouver_table_et_champs(cx):
    """Repère la table des unités d'évaluation et le nom réel des champs
    (les GPKG du MAMH varient légèrement d'un millésime à l'autre)."""
    tables = [r[0] for r in cx.execute(
        "SELECT name FROM sqlite_master WHERE type IN ('table','view')")]
    candidates = [t for t in tables if 'unite' in t.lower()]
    if not candidates:
        raise SystemExit(f"Aucune table 'unité' trouvée. Tables : {tables}")

    def cols(t):
        return {r[1].lower(): r[1] for r in cx.execute(f"PRAGMA table_info('{t}')")}

    # priorité à la table qui porte les champs RL
    for t in sorted(candidates, key=lambda t: -len(cols(t))):
        c = cols(t)
        if any(k.startswith('rl0404') for k in c):
            return t, c
    raise SystemExit(f"Table avec champs RL04xx introuvable parmi {candidates}")


def champ(c, prefixe, *alternatives):
    """Trouve un champ par préfixe insensible à la casse (rl0404a, RL0404A…)."""
    for cand in (prefixe, *alternatives):
        for k, orig in c.items():
            if k == cand or k.startswith(cand):
                return orig
    return None


# ---------------------------------------------------------------------------
#  GÉOMÉTRIE — décodage d'un blob GeoPackage, sans dépendance
#
#  Un blob GPKG est : "GP" + version(1) + drapeaux(1) + srs_id(4) + enveloppe
#  optionnelle + WKB standard. Les drapeaux disent l'ordre des octets (bit 0),
#  la taille de l'enveloppe (bits 1-3) et si la géométrie est vide (bit 4).
#  Le rôle du MAMH livre des MULTIPOINT (et non des POINT) : il faut lire le
#  nombre de points puis descendre dans le premier.
# ---------------------------------------------------------------------------
SRS_GEOGRAPHIQUES = {4269, 4326}  # NAD83 et WGS84 : des DEGRÉS


def gpkg_point(blob):
    """(lon, lat) du premier point d'un blob GeoPackage, ou None si vide."""
    if blob is None or len(blob) < 8 or blob[0:2] != b"GP":
        return None
    drapeaux = blob[3]
    if drapeaux & 0x10:                       # bit 4 : géométrie vide
        return None
    env = (drapeaux >> 1) & 0x07              # bits 1-3 : indicateur d'enveloppe
    n_env = {0: 0, 1: 4, 2: 6, 3: 6, 4: 8}.get(env)
    if n_env is None:                         # valeur réservée : blob non conforme
        return None
    return _wkb_premier_point(blob, 8 + n_env * 8)


def _wkb_premier_point(b, pos):
    if pos + 5 > len(b):
        return None
    bo = "<" if b[pos] == 1 else ">"
    typ = struct.unpack_from(bo + "I", b, pos + 1)[0]
    # deux conventions coexistent pour Z/M : ISO (base + 1000·Z + 2000·M) et
    # EWKB (bits hauts). Seule la base nous intéresse — x et y viennent d'abord.
    base = (typ & 0x0FFFFFFF) % 1000
    pos += 5
    if base == 1:                             # POINT
        return struct.unpack_from(bo + "dd", b, pos)
    if base == 4:                             # MULTIPOINT → premier point
        n = struct.unpack_from(bo + "I", b, pos)[0]
        return _wkb_premier_point(b, pos + 4) if n else None
    return None


def trouver_geometrie(cx):
    """(table, colonne, srs_id) de la couche géométrique, ou None si absente."""
    try:
        lignes = list(cx.execute(
            "SELECT table_name, column_name, srs_id FROM gpkg_geometry_columns"))
    except sqlite3.Error:
        return None
    for t, col, srs in lignes:
        if "unite" in t.lower():
            return t, col, srs
    return lignes[0] if lignes else None


def charger_points(cx, table, colonne, villes):
    """{(code_mun, mat18): (lon, lat)} pour les municipalités demandées."""
    cols = {r[1].lower(): r[1] for r in cx.execute("PRAGMA table_info('%s')" % table)}
    f_mun = champ(cols, "code_mun", "rl0101", "co_mun", "mun")
    f_mat = champ(cols, "mat18", "matricule", "id_provinc")
    if not f_mun or not f_mat:
        raise SystemExit("Couche géométrique sans code_mun/mat18 : jointure impossible.")
    codes = ", ".join("?" for _ in villes)
    q = ('SELECT %s, %s, "%s" FROM "%s" WHERE CAST(%s AS TEXT) IN (%s)'
         % (f_mun, f_mat, colonne, table, f_mun, codes))
    pts, vides, doublons = {}, 0, 0
    for mun, mat, blob in cx.execute(q, list(villes)):
        p = gpkg_point(blob)
        if p is None:
            vides += 1
            continue
        cle = (str(mun).strip(), str(mat).strip())
        if cle in pts:
            doublons += 1                     # première occurrence conservée
            continue
        pts[cle] = p
    return pts, vides, doublons


def main():
    if len(sys.argv) < 4 or "=" not in sys.argv[3]:
        raise SystemExit(__doc__)
    gpkg = sys.argv[1]
    projet = sys.argv[2]
    villes = {}
    for arg in sys.argv[3:]:
        code, _, vid = arg.partition("=")
        villes[code.strip()] = vid.strip()
    outdir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "intrants")
    os.makedirs(outdir, exist_ok=True)

    cx = sqlite3.connect(gpkg)
    table, c = trouver_table_et_champs(cx)

    f_mun = champ(c, "rl0101", "code_mun", "co_mun", "mun")           # code municipalité
    f_mat = champ(c, "matricule", "mat18", "id_provinc", "rl0106")     # identifiant d'unité
    f_cubf = champ(c, "rl0105a", "cubf", "utilisation")
    f_sup = champ(c, "rl0302a", "superficie")
    f_log = champ(c, "rl0311a", "nb_logement", "nombre_logement")
    f_vt = champ(c, "rl0402a")   # valeur terrain
    f_vb = champ(c, "rl0403a")   # valeur bâtiment
    f_vi = champ(c, "rl0404a")   # valeur immeuble (totale)
    f_tvd = champ(c, "rl0501a")  # indicateur terrain vague desservi (0/1 — à confirmer au répertoire MAMH)
    f_zag = champ(c, "rl0303a")  # zonage agricole (0 non / 1 total / 2 partiel — à confirmer)

    print(f"Table : {table}")
    for lab, f in [("municipalité", f_mun), ("matricule", f_mat), ("CUBF", f_cubf),
                   ("superficie", f_sup), ("logements", f_log),
                   ("val. terrain", f_vt), ("val. bâtiment", f_vb), ("val. immeuble", f_vi),
                   ("terrain vague", f_tvd), ("zonage agricole", f_zag)]:
        print(f"  {lab:16s} -> {f if f else '(absent — NULL)'}")
        if f is None and lab not in ("terrain vague", "zonage agricole"):  # bonus optionnels
            raise SystemExit(f"Champ « {lab} » introuvable — inspecter PRAGMA table_info('{table}')")

    # ---- géométrie : couche séparée, jointe par (code_mun, mat18) ----
    geo = trouver_geometrie(cx)
    points, geo_vides, geo_doublons = {}, 0, 0
    if geo is None:
        print("\n⚠ Aucune couche géométrique : lon/lat seront vides (carte indisponible).")
    else:
        g_table, g_col, g_srs = geo
        print(f"\nGéométrie : {g_table}.{g_col}  (SRS {g_srs})")
        if g_srs not in SRS_GEOGRAPHIQUES:
            raise SystemExit(
                f"⚠ SRS {g_srs} inattendu. Ce script écrit des degrés (lon/lat) et la\n"
                f"  fonction SQL calc_grille les convertit en mètres en supposant un SRS\n"
                f"  géographique. Un SRS projeté produirait une carte fausse EN SILENCE.\n"
                f"  → adapter calc_grille avant de retirer ce garde-fou.")
        print("  lecture des points (une passe sur la couche)…")
        points, geo_vides, geo_doublons = charger_points(cx, g_table, g_col, villes)
        print(f"  {len(points)} points chargés"
              + (f", {geo_vides} géométries vides" if geo_vides else "")
              + (f", {geo_doublons} doublons ignorés" if geo_doublons else ""))

    # millésime : première année plausible dans le nom de fichier (évite « 22026 »)
    import re
    mo = re.search(r"(20\d{2})", os.path.basename(gpkg))
    annee = mo.group(1) if mo else "0000"
    out = os.path.join(outdir, f"role-{projet}-{annee}.csv")

    # champs bonus optionnels : NULL si le millésime ne les porte pas (sinon SQL « no such column: None »)
    sel_tvd = f_tvd if f_tvd else "NULL"
    sel_zag = f_zag if f_zag else "NULL"
    codes = ", ".join("?" for _ in villes)  # placeholders liés (pas d'interpolation)
    q = (f"SELECT {f_mun}, {f_mat}, {f_cubf}, {f_vt}, {f_vb}, {f_vi}, {f_sup}, {f_log}, {sel_tvd}, {sel_zag} "
         f'FROM "{table}" WHERE CAST({f_mun} AS TEXT) IN ({codes})')

    stats = {v: [0, 0.0, 0] for v in villes.values()}   # [unités, valeur, sans position]
    emprise = {}                                        # ville → [lon_min, lon_max, lat_min, lat_max]
    n = 0
    numv = lambda x: float(x) if x not in (None, "") else 0.0  # tolère REAL/TEXT/None
    with io.open(out, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["ville_id", "matricule", "cubf", "valeur_terrain",
                    "valeur_batiment", "valeur_totale", "superficie_terrain", "nb_logements",
                    "terrain_vague_desservi", "zonage_agricole", "lon", "lat"])
        for mun, mat, cubf, vt, vb, vi, sup, log, tvd, zag in cx.execute(q, list(villes)):
            ville = villes[str(mun).strip()]
            vi_n = numv(vi)
            p = points.get((str(mun).strip(), str(mat).strip()))
            if p is None:
                stats[ville][2] += 1
            else:
                e = emprise.get(ville)
                if e is None:
                    emprise[ville] = [p[0], p[0], p[1], p[1]]
                else:
                    e[0] = min(e[0], p[0]); e[1] = max(e[1], p[0])
                    e[2] = min(e[2], p[1]); e[3] = max(e[3], p[1])
            w.writerow([ville, str(mat).strip(), str(cubf or "").strip(),
                        int(numv(vt)), int(numv(vb)), int(vi_n),
                        (round(numv(sup), 1) if sup not in (None, "") else ""),
                        (int(numv(log)) if log not in (None, "") else ""),
                        (str(tvd).strip() if tvd not in (None, "") else ""),
                        (str(zag).strip() if zag not in (None, "") else ""),
                        (f"{p[0]:.6f}" if p else ""),    # ~11 cm à cette latitude
                        (f"{p[1]:.6f}" if p else "")])
            stats[ville][0] += 1
            stats[ville][1] += vi_n
            n += 1

    print(f"\n→ {out}  ({n} unités)\n")
    print(f"{'Ville':26s} {'Unités':>8s} {'Valeur totale':>18s} {'Sans pos.':>10s}")
    for v, (cnt, tot, sans) in sorted(stats.items()):
        print(f"{v:26s} {cnt:8d} {tot:18,.0f} $ {sans:10d}".replace(",", " "))
    if n == 0:
        raise SystemExit("⚠ 0 unité extraite — vérifier le champ municipalité et les codes.")

    # ---- contrôle géographique : les emprises doivent être DISJOINTES et
    #      ordonnées d'ouest en est. Une jointure ratée saute aux yeux ici.
    if emprise:
        print(f"\n{'Ville (d\'ouest en est)':26s} {'longitude':>21s} {'latitude':>21s}")
        for v, e in sorted(emprise.items(), key=lambda kv: (kv[1][0] + kv[1][1]) / 2):
            print(f"{v:26s} {e[0]:10.4f} {e[1]:10.4f} {e[2]:10.4f} {e[3]:10.4f}")
        sans_tot = sum(s[2] for s in stats.values())
        if sans_tot:
            print(f"\n⚠ {sans_tot} unité(s) sans position ({sans_tot / n * 100:.2f} %) — "
                  f"elles seront absentes de la carte, et l'app le dira.")


if __name__ == "__main__":
    main()
