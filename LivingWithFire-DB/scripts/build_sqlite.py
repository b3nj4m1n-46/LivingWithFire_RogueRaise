"""Build SQLite database from extracted CSVs and generate JSON metadata."""

import csv
import json
import os
import sqlite3
import sys

sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# All tables to import
TABLES = [
    "plants", "attributes", "values", "sources", "attribute_sources",
    "nurseries", "plant_nurseries", "plant_images", "plant_research",
    "filter_presets", "key_terms", "resource_sections", "risk_reduction_snippets",
]

# --- SQLite ---
db_path = os.path.join(BASE, "plants.db")
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

for table in TABLES:
    csv_path = os.path.join(BASE, f"{table}.csv")
    if not os.path.exists(csv_path):
        print(f"  SKIP {table} (no CSV)")
        continue

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        rows = list(reader)

    # Create table
    col_defs = ", ".join(f'"{h}" TEXT' for h in headers)
    cur.execute(f'CREATE TABLE "{table}" ({col_defs})')

    # Insert rows
    placeholders = ", ".join(["?"] * len(headers))
    col_names = ", ".join(f'"{h}"' for h in headers)
    for row in rows:
        vals = [row.get(h, "") for h in headers]
        cur.execute(f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders})', vals)

    print(f"  {table:30s} {len(rows):>8,} rows  ({len(headers)} cols)")

# Create indexes
cur.execute('CREATE INDEX IF NOT EXISTS idx_plants_genus ON plants(genus)')
cur.execute('CREATE INDEX IF NOT EXISTS idx_plants_species ON plants(species)')
cur.execute('CREATE INDEX IF NOT EXISTS idx_values_plant ON "values"(plant_id)')
cur.execute('CREATE INDEX IF NOT EXISTS idx_values_attr ON "values"(attribute_id)')
cur.execute('CREATE INDEX IF NOT EXISTS idx_sources_name ON sources(name)')
cur.execute('CREATE INDEX IF NOT EXISTS idx_attr_name ON attributes(name)')

conn.commit()
conn.close()
print(f"\nWrote {db_path}")

# --- JSON (metadata + small tables only, not the 94K values table) ---
json_data = {
    "source": "Living With Fire Application Database",
    "connection": "Neon PostgreSQL (living-with-fire)",
    "tables": {},
}

for table in TABLES:
    csv_path = os.path.join(BASE, f"{table}.csv")
    if not os.path.exists(csv_path):
        continue

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    json_data["tables"][table] = {
        "row_count": len(rows),
        "columns": list(rows[0].keys()) if rows else [],
    }

    # Include full data for small tables only
    if len(rows) <= 200:
        json_data["tables"][table]["data"] = rows

json_path = os.path.join(BASE, "plants.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Wrote {json_path}")
