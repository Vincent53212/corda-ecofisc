# -*- coding: utf-8 -*-
"""
ETL — Rôle d'évaluation foncière géoréférencé (MAMH, données ouvertes CC-BY 4.0)
→ intrant au FORMAT UNIVERSEL Corda (docs/format-intrants.md)

Un GeoPackage est une base SQLite : on lit la table attributaire directement
avec la bibliothèque standard (zéro dépendance). La géométrie (points) est
ignorée en v1 — lat/lon viendront en v2 (jointures StatCan).

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
    + rapport de contrôle à l'écran (n unités et valeur totale par ville)

Source : https://donneesouvertes.affmunqc.net/role/ROLE2026_GEOPACKAGE.zip
Guide des champs : « Répertoire des renseignements prescrits du rôle » (MAMH).
Les ville_id doivent correspondre aux ids de villes du projet dans l'app.
"""
import csv
import io
import os
import sqlite3
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
                   ("val. terrain", f_vt), ("val. bâtiment", f_vb), ("val. immeuble", f_vi)]:
        print(f"  {lab:14s} → {f}")
        if f is None:
            raise SystemExit(f"Champ « {lab} » introuvable — inspecter PRAGMA table_info('{table}')")

    # millésime depuis le nom de fichier (ROLE2026…)
    annee = "".join(ch for ch in os.path.basename(gpkg) if ch.isdigit())[:4] or "2026"
    out = os.path.join(outdir, f"role-{projet}-{annee}.csv")

    codes = ", ".join(f"'{k}'" for k in villes)
    q = (f"SELECT {f_mun}, {f_mat}, {f_cubf}, {f_vt}, {f_vb}, {f_vi}, {f_sup}, {f_log}, {f_tvd}, {f_zag} "
         f"FROM '{table}' WHERE CAST({f_mun} AS TEXT) IN ({codes})")

    stats = {v: [0, 0.0] for v in villes.values()}
    n = 0
    with io.open(out, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["ville_id", "matricule", "cubf", "valeur_terrain",
                    "valeur_batiment", "valeur_totale", "superficie_terrain", "nb_logements",
                    "terrain_vague_desservi", "zonage_agricole"])
        for mun, mat, cubf, vt, vb, vi, sup, log, tvd, zag in cx.execute(q):
            ville = villes[str(mun).strip()]
            vi_n = float(vi or 0)
            w.writerow([ville, str(mat).strip(), str(cubf or "").strip(),
                        int(vt or 0), int(vb or 0), int(vi_n),
                        (round(float(sup), 1) if sup not in (None, "") else ""),
                        (int(log) if log not in (None, "") else ""),
                        (str(tvd).strip() if tvd not in (None, "") else ""),
                        (str(zag).strip() if zag not in (None, "") else "")])
            stats[ville][0] += 1
            stats[ville][1] += vi_n
            n += 1

    print(f"\n→ {out}  ({n} unités)\n")
    print(f"{'Ville':26s} {'Unités':>8s} {'Valeur totale':>18s}")
    for v, (cnt, tot) in sorted(stats.items()):
        print(f"{v:26s} {cnt:8d} {tot:18,.0f} $".replace(",", " "))
    if n == 0:
        raise SystemExit("⚠ 0 unité extraite — vérifier le champ municipalité et les codes.")


if __name__ == "__main__":
    main()
