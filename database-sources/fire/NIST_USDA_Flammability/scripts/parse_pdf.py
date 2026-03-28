"""
Parse the Long et al. 2006 paper table of 34 ornamental shrubs tested for flammability
at the NIST Building and Fire Research Laboratory.

Source: Long, A.J., Behm, A., Zipperer, W.C., Hermansen, A., Maranghides, A., and Mell, W.
        2006. Quantifying and Ranking the Flammability of Ornamental Shrubs in the Southern
        United States. Pages 13-17 in 2006 Fire Ecology and Management Congress Proceedings.
        https://www.srs.fs.usda.gov/pubs/ja/ja_long004.pdf
"""

import csv
import json
import os
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

# Data extracted from Table 1 of the paper.
# PDF table extraction is unreliable for this layout (multi-line cells,
# authority names mixed into columns), so we hardcode from the paper.
PLANTS = [
    ("Glossy abelia", "Abelia x grandiflora", "(Andre) Rehd.", "", "Moderate"),
    ("Pipestem", "Agarista populifolia", "(Lam.) Judd", "", "Moderate"),
    ("Azalea", "Azalea obtusum", "(Lindl.) Planch.", "Hershey red", "Moderate"),
    ("Butterfly bush", "Buddleia davidii", "(Franch.)", "Royal red", "Low"),
    ("Boxwood", "Buxus microphylla var. koreana", "Siebold & Zucc.", "Wintergreen", "Moderate"),
    ("Beautyberry", "Callicarpa dichotoma", "(Lour.) C. Koch", "Profusion", "Low"),
    ("Camellia", "Camellia japonica", "L.", "", "Low"),
    ("Summer-sweet; sweet pepperbush", "Clethra alnifolia", "L.", "", "Low"),
    ("Leyland cypress", "x Cupressocyparis leylandii", "(A. B. Jacks. & Dallim.)", "", "Moderate"),
    ("Klein's forsythia", "Forsythia x intermedia", "Zab.", "", "Low"),
    ("Cape jasmine", "Gardenia jasminoides", "Ellis", "August beauty", "Low"),
    ("Bigleaf hydrangea; French hydrangea", "Hydrangea macrophylla", "(Thunb.) Ser.", "Nikko", "Low"),
    ("Oakleaf hydrangea", "Hydrangea quercifolia", "Bartr.", "", "Low"),
    ("Foster holly", "Ilex x attenuata", "Ashe", "Fosteri", "Low"),
    ("Gallberry", "Ilex glabra", "L.", "Compacta", "High"),
    ("Blue holly", "Ilex x meservea", "S. Y. Hu", "Mesdob", "Moderate"),
    ("Winterberry", "Ilex verticillata", "(L.) A. Gray", "Berry nice", "Low"),
    ("Dwarf yaupon", "Ilex vomitoria", "Ait.", "Schellings dwarf", "High"),
    ("Anisetree", "Illicium floridanum", "Ellis", "", "Low"),
    ("Ashe juniper; Ozark white cedar", "Juniperus ashei", "Buchh.", "", "Moderate"),
    ("Chinese juniper", "Juniperus chinensis", "L.", "Pfitzerana", "High"),
    ("Mountain laurel; calico bush", "Kalmia latifolia", "L.", "Olympic fire", "High"),
    ("Bayberry; candleberry", "Myrica pennsylvanica", "Loisel.", "", "Low"),
    ("Oleander", "Nerium oleander", "L.", "Calypso", "Low"),
    ("Pittosporum", "Pittosporum tobira", "(Thunb.) Ait.", "Compacta", "Low"),
    ("Potentilla; shrubby cinquefoil; golden hardhack", "Potentilla fruiticosa", "L.", "Gold star", "Low"),
    ("Scarlet firethorn", "Pyracantha coccinea", "M. J. Roem.", "Mohave", "Low"),
    ("Rhododendron", "Rhododendron x chionoides", "L.", "Chionoides", "Moderate"),
    ("Rosebay; great laurel", "Rhododendron maximum", "L.", "", "Low"),
    ("Arrowwood", "Viburnum dentatum", "L.", "Chicago luster", "Low"),
    ("Walter's viburnum", "Viburnum obovatum", "Walt.", "", "Low"),
    ("Weigela", "Weigela florida", "(Bunge) A. DC.", "Wine and roses", "Low"),
    ("Adam's needle", "Yucca filamentosa", "L.", "", "Low"),
    ("Coontie", "Zamia pumila", "L.", "", "Low"),
]


def main():
    plants = []
    for common, sci, authority, cultivar, rank in PLANTS:
        plants.append({
            "common_name": common,
            "scientific_name": sci,
            "authority": authority,
            "cultivar": cultivar,
            "flammability_rank": rank,
        })

    print(f"Plants: {len(plants)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["common_name", "scientific_name", "authority", "cultivar", "flammability_rank"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in plants:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(plants, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            common_name TEXT,
            scientific_name TEXT,
            authority TEXT,
            cultivar TEXT,
            flammability_rank TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_scientific_name ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_flammability_rank ON plants(flammability_rank)")

    for p in plants:
        cur.execute(
            "INSERT INTO plants (common_name, scientific_name, authority, cultivar, flammability_rank) VALUES (?, ?, ?, ?, ?)",
            (p["common_name"], p["scientific_name"], p["authority"], p["cultivar"], p["flammability_rank"]),
        )
    conn.commit()

    cur.execute("SELECT flammability_rank, COUNT(*) FROM plants GROUP BY flammability_rank ORDER BY COUNT(*) DESC")
    print("\nFlammability Rank Distribution:")
    for rank, count in cur.fetchall():
        print(f"  {rank}: {count}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
