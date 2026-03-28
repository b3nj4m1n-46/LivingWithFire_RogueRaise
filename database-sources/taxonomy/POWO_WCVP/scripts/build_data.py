"""
Build POWO/WCVP (World Checklist of Vascular Plants) dataset.

Source: Royal Botanic Gardens, Kew
URL: https://powo.science.kew.org/
Full dataset: 1.44M name records, 362,739 accepted species

For PRISM/LivinWitFire we filter to:
  - Accepted species only (not synonyms, subspecies, etc.)
  - Species with lifeform OR climate data populated
  - Join with distribution data for native range info
"""

import csv
import json
import os
import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
NAMES_FILE = os.path.join(DATA_DIR, "Sources", "wcvp_names.csv")
DIST_FILE = os.path.join(DATA_DIR, "Sources", "wcvp_distribution.csv")


def main():
    print("=== Phase 1: Read accepted species with traits ===")

    # Read all accepted species
    species = {}
    total = 0
    with open(NAMES_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="|")
        for row in reader:
            total += 1
            if row["taxon_status"] == "Accepted" and row["taxon_rank"] == "Species":
                pid = row["plant_name_id"]
                species[pid] = {
                    "plant_name_id": pid,
                    "family": row["family"],
                    "genus": row["genus"],
                    "species": row["species"],
                    "scientific_name": f"{row['genus']} {row['species']}",
                    "taxon_name": row["taxon_name"],
                    "authors": row["taxon_authors"],
                    "lifeform": row.get("lifeform_description", ""),
                    "climate": row.get("climate_description", ""),
                    "geographic_area": row.get("geographic_area", ""),
                    "powo_id": row.get("powo_id", ""),
                    "native_regions": [],
                    "introduced_regions": [],
                }

    print(f"Total name records: {total}")
    print(f"Accepted species: {len(species)}")

    # Count species with traits
    with_lifeform = sum(1 for s in species.values() if s["lifeform"])
    with_climate = sum(1 for s in species.values() if s["climate"])
    print(f"With lifeform data: {with_lifeform}")
    print(f"With climate data: {with_climate}")

    print("\n=== Phase 2: Read distribution data ===")

    dist_count = 0
    with open(DIST_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="|")
        for row in reader:
            dist_count += 1
            pid = row["plant_name_id"]
            if pid in species:
                area = row.get("area", "")
                if row.get("introduced", "0") == "1":
                    species[pid]["introduced_regions"].append(area)
                else:
                    species[pid]["native_regions"].append(area)

    print(f"Distribution records processed: {dist_count}")

    # Flatten regions to comma-separated strings
    for s in species.values():
        s["native_to"] = ", ".join(sorted(set(s["native_regions"])))
        s["introduced_to"] = ", ".join(sorted(set(s["introduced_regions"])))
        del s["native_regions"]
        del s["introduced_regions"]

    plants = list(species.values())
    print(f"\nTotal plants for output: {len(plants)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["plant_name_id", "family", "genus", "species", "scientific_name",
              "taxon_name", "authors", "lifeform", "climate",
              "geographic_area", "native_to", "introduced_to", "powo_id"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in plants:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    # --- SQLite (skip JSON for this one — too large) ---
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE plants (
            plant_name_id TEXT PRIMARY KEY,
            family TEXT,
            genus TEXT,
            species TEXT,
            scientific_name TEXT,
            taxon_name TEXT,
            authors TEXT,
            lifeform TEXT,
            climate TEXT,
            geographic_area TEXT,
            native_to TEXT,
            introduced_to TEXT,
            powo_id TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_family ON plants(family)")
    cur.execute("CREATE INDEX idx_genus ON plants(genus)")
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_lifeform ON plants(lifeform)")
    cur.execute("CREATE INDEX idx_climate ON plants(climate)")

    for p in plants:
        cur.execute("""
            INSERT INTO plants (plant_name_id, family, genus, species, scientific_name,
                taxon_name, authors, lifeform, climate, geographic_area,
                native_to, introduced_to, powo_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (p["plant_name_id"], p["family"], p["genus"], p["species"],
             p["scientific_name"], p["taxon_name"], p["authors"],
             p["lifeform"], p["climate"], p["geographic_area"],
             p["native_to"], p["introduced_to"], p["powo_id"]))
    conn.commit()

    # Stats
    cur.execute("SELECT family, COUNT(*) FROM plants GROUP BY family ORDER BY COUNT(*) DESC LIMIT 20")
    print("\nTop 20 Families:")
    for fam, c in cur.fetchall():
        print(f"  {fam}: {c}")

    cur.execute("SELECT lifeform, COUNT(*) FROM plants WHERE lifeform != '' GROUP BY lifeform ORDER BY COUNT(*) DESC LIMIT 15")
    print("\nTop 15 Lifeforms:")
    for lf, c in cur.fetchall():
        print(f"  {lf}: {c}")

    cur.execute("SELECT climate, COUNT(*) FROM plants WHERE climate != '' GROUP BY climate ORDER BY COUNT(*) DESC LIMIT 15")
    print("\nTop 15 Climate Descriptions:")
    for cl, c in cur.fetchall():
        print(f"  {cl}: {c}")

    conn.close()
    print(f"\nWrote {db_path}")
    print("(JSON skipped — dataset too large, use CSV or SQLite)")


if __name__ == "__main__":
    main()
