"""
Build UC Davis WUCOLS (Water Use Classification of Landscape Species) dataset.

Source: UC Davis California Center for Urban Horticulture
URL: https://wucols.ucdavis.edu/
Plants: ~4,100 landscape species
Regions: 6 California climate regions

Water Use Categories:
  VL = Very Low (10-30% ET0)
  Lo = Low (10-40% ET0)
  Mo = Moderate (40-60% ET0)
  Hi = High (60-90% ET0)
  Unknown = Not yet classified
  Not Appropriate = Not suitable for this region
"""

import csv
import json
import os
import sqlite3

import openpyxl

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
XLSX_FILE = os.path.join(DATA_DIR, "Sources", "WUCOLS_all_regions.xlsx")

REGIONS = {
    1: "North Central Valley",
    2: "Central Valley",
    3: "South Inland Valleys",
    4: "South Coastal",
    5: "High & Intermediate Desert",
    6: "North Coastal / Bay Area",
}


def main():
    print(f"Reading: {XLSX_FILE}")
    wb = openpyxl.load_workbook(XLSX_FILE, read_only=True)
    ws = wb["Plants"]

    rows = list(ws.iter_rows(values_only=True))
    header = rows[0]
    data_rows = rows[1:]
    print(f"Rows: {len(data_rows)}")
    print(f"Columns: {list(header)}")

    plants = []
    for row in data_rows:
        if not row[1]:  # skip empty botanical name
            continue

        plant = {
            "plant_type": str(row[0] or "").strip(),
            "scientific_name": str(row[1] or "").strip(),
            "common_name": str(row[2] or "").strip(),
        }

        # Extract regional water use data
        for reg_num in range(1, 7):
            base_idx = 3 + (reg_num - 1) * 3
            water_use = str(row[base_idx] or "").strip() if base_idx < len(row) else ""
            et0 = str(row[base_idx + 1] or "").strip() if base_idx + 1 < len(row) else ""
            pf = str(row[base_idx + 2] or "").strip() if base_idx + 2 < len(row) else ""

            plant[f"region_{reg_num}_water_use"] = water_use
            plant[f"region_{reg_num}_et0"] = et0
            plant[f"region_{reg_num}_plant_factor"] = pf

        plants.append(plant)

    print(f"Plants parsed: {len(plants)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "plant_type",
              "region_1_water_use", "region_1_et0", "region_1_plant_factor",
              "region_2_water_use", "region_2_et0", "region_2_plant_factor",
              "region_3_water_use", "region_3_et0", "region_3_plant_factor",
              "region_4_water_use", "region_4_et0", "region_4_plant_factor",
              "region_5_water_use", "region_5_et0", "region_5_plant_factor",
              "region_6_water_use", "region_6_et0", "region_6_plant_factor"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in plants:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "UC Davis WUCOLS - Water Use Classification of Landscape Species",
            "url": "https://wucols.ucdavis.edu/",
            "regions": REGIONS,
            "water_use_categories": {
                "Very Low": "10-30% ET0",
                "Low": "10-40% ET0",
                "Moderate": "40-60% ET0",
                "High": "60-90% ET0",
                "Unknown": "Not yet classified",
                "Not Appropriate for this Region": "Not suitable",
            },
            "plants": plants,
        }, f, indent=2, ensure_ascii=False)
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
            scientific_name TEXT,
            common_name TEXT,
            plant_type TEXT,
            region_1_water_use TEXT,
            region_1_et0 TEXT,
            region_1_plant_factor TEXT,
            region_2_water_use TEXT,
            region_2_et0 TEXT,
            region_2_plant_factor TEXT,
            region_3_water_use TEXT,
            region_3_et0 TEXT,
            region_3_plant_factor TEXT,
            region_4_water_use TEXT,
            region_4_et0 TEXT,
            region_4_plant_factor TEXT,
            region_5_water_use TEXT,
            region_5_et0 TEXT,
            region_5_plant_factor TEXT,
            region_6_water_use TEXT,
            region_6_et0 TEXT,
            region_6_plant_factor TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_type ON plants(plant_type)")

    for p in plants:
        cur.execute("""
            INSERT INTO plants (scientific_name, common_name, plant_type,
                region_1_water_use, region_1_et0, region_1_plant_factor,
                region_2_water_use, region_2_et0, region_2_plant_factor,
                region_3_water_use, region_3_et0, region_3_plant_factor,
                region_4_water_use, region_4_et0, region_4_plant_factor,
                region_5_water_use, region_5_et0, region_5_plant_factor,
                region_6_water_use, region_6_et0, region_6_plant_factor)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (p["scientific_name"], p["common_name"], p["plant_type"],
             p["region_1_water_use"], p["region_1_et0"], p["region_1_plant_factor"],
             p["region_2_water_use"], p["region_2_et0"], p["region_2_plant_factor"],
             p["region_3_water_use"], p["region_3_et0"], p["region_3_plant_factor"],
             p["region_4_water_use"], p["region_4_et0"], p["region_4_plant_factor"],
             p["region_5_water_use"], p["region_5_et0"], p["region_5_plant_factor"],
             p["region_6_water_use"], p["region_6_et0"], p["region_6_plant_factor"]))
    conn.commit()

    # Stats
    cur.execute("SELECT plant_type, COUNT(*) FROM plants GROUP BY plant_type ORDER BY COUNT(*) DESC")
    print("\nPlant Type Distribution:")
    for t, c in cur.fetchall():
        print(f"  {t}: {c}")

    # Water use distribution across Region 1 as sample
    cur.execute("SELECT region_1_water_use, COUNT(*) FROM plants GROUP BY region_1_water_use ORDER BY COUNT(*) DESC")
    print("\nRegion 1 Water Use Distribution:")
    for w, c in cur.fetchall():
        print(f"  {w}: {c}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
