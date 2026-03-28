#!/usr/bin/env python3
"""
Convert plants.csv to JSON and SQLite formats.
Run from the project directory: python3 convert_csv.py
"""

import csv
import json
import sqlite3
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent
CSV_PATH = OUTPUT_DIR / "plants.csv"
JSON_PATH = OUTPUT_DIR / "plants.json"
DB_PATH = OUTPUT_DIR / "plants.db"

# Fields that should be converted from pipe-separated strings back to lists
LIST_FIELDS = {
    "common_names", "synonyms", "cultivars", "tags", "image_urls",
    "play_value", "woody_leaf_characteristics", "habit_form",
    "light", "soil_texture", "soil_ph", "soil_drainage",
    "available_space", "nc_region", "flower_color", "flower_value",
    "flower_bloom_time", "flower_petals", "leaf_color", "stem_color",
    "landscape_location", "landscape_theme", "design_feature",
    "attracts", "bark_color", "plant_type", "resistance",
}


def read_csv():
    """Read plants.csv and return list of dicts with list fields restored."""
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        plants = list(reader)

    for plant in plants:
        for field in LIST_FIELDS:
            val = plant.get(field, "")
            if val and " | " in val:
                plant[field] = [v.strip() for v in val.split(" | ") if v.strip()]
            elif val:
                plant[field] = [val]
            else:
                plant[field] = []

    return plants


def write_json(plants):
    """Write plants to JSON."""
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(plants, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(plants)} plants to {JSON_PATH}")


def write_sqlite(plants):
    """Write plants to SQLite with a main table and a normalized attributes table."""
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # Determine scalar vs list fields from the actual data
    all_keys = set()
    for p in plants:
        all_keys.update(p.keys())

    multi_fields = set()
    scalar_fields = set()
    for key in all_keys:
        if key in LIST_FIELDS:
            multi_fields.add(key)
        else:
            for p in plants:
                if isinstance(p.get(key), list):
                    multi_fields.add(key)
                    break
            else:
                scalar_fields.add(key)

    scalar_cols = sorted(scalar_fields)

    # Create plants table
    col_defs = ", ".join(f'"{c}" TEXT' for c in scalar_cols)
    cur.execute(f"""
        CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            {col_defs}
        )
    """)

    # Create normalized attributes table for list fields
    cur.execute("""
        CREATE TABLE plant_attributes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plant_id INTEGER NOT NULL,
            field TEXT NOT NULL,
            value TEXT NOT NULL,
            FOREIGN KEY (plant_id) REFERENCES plants(id)
        )
    """)

    # Insert data
    for plant in plants:
        vals = []
        for c in scalar_cols:
            v = plant.get(c, "")
            if isinstance(v, list):
                v = " | ".join(str(x) for x in v)
            vals.append(str(v) if v else "")

        placeholders = ", ".join("?" for _ in scalar_cols)
        col_names = ", ".join(f'"{c}"' for c in scalar_cols)
        cur.execute(f"INSERT INTO plants ({col_names}) VALUES ({placeholders})", vals)
        plant_id = cur.lastrowid

        for field in multi_fields:
            if not field:
                continue
            values = plant.get(field, [])
            if isinstance(values, str):
                values = [values] if values else []
            for v in values:
                if v:
                    cur.execute(
                        "INSERT INTO plant_attributes (plant_id, field, value) VALUES (?, ?, ?)",
                        (plant_id, field, str(v)),
                    )

    # Create indexes
    cur.execute('CREATE INDEX idx_plants_scientific ON plants("scientific_name")')
    cur.execute('CREATE INDEX idx_plants_genus ON plants("genus")')
    cur.execute('CREATE INDEX idx_plants_family ON plants("family")')
    cur.execute("CREATE INDEX idx_attrs_plant ON plant_attributes(plant_id)")
    cur.execute("CREATE INDEX idx_attrs_field ON plant_attributes(field)")

    conn.commit()
    conn.close()
    print(f"Saved {len(plants)} plants to {DB_PATH}")


def main():
    if not CSV_PATH.exists():
        print(f"Error: {CSV_PATH} not found")
        return

    plants = read_csv()
    print(f"Read {len(plants)} plants from {CSV_PATH}")

    write_json(plants)
    write_sqlite(plants)
    print("\nDone!")


if __name__ == "__main__":
    main()
