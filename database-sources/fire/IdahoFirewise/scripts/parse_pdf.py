"""
Parse the Idaho Firewise Garden Plant Database PDF and export to CSV, JSON, and SQLite.

Source: Idaho Firewise (idahofirewise.org)
PDF: Idaho-Firewise-Garden-Plant-Database_Web_2026.pdf (~379 plants)
"""

import csv
import json
import os
import re
import sqlite3

import pdfplumber

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
PDF_FILE = r"C:\Users\bd\Documents\GitHub\PRISM\docs\research\Idaho-Firewise-Garden-Plant-Database_Web_2026.pdf"


def clean_text(s):
    """Clean up text from PDF extraction."""
    if not s:
        return ""
    # Replace newlines with spaces, collapse whitespace
    s = re.sub(r"\s+", " ", s).strip()
    # Fix trademark symbols that got garbled
    s = s.replace("�", "\u2122")
    return s


def parse_botanical_name(raw):
    """Split botanical name into genus/species and cultivar if present."""
    raw = clean_text(raw)
    # Look for cultivar in quotes
    match = re.match(r"^(.*?)\s*'([^']+)'(.*)$", raw)
    if match:
        species_part = (match.group(1) + " " + match.group(3)).strip()
        cultivar = match.group(2)
        return species_part, cultivar
    return raw, ""


def main():
    print(f"Reading PDF: {PDF_FILE}")
    pdf = pdfplumber.open(PDF_FILE)
    print(f"Pages: {len(pdf.pages)}")

    all_rows = []
    for page in pdf.pages:
        tables = page.extract_tables()
        for tbl in tables:
            for row in tbl:
                # Skip header rows (merged cells have None)
                if row[1] is None:
                    continue
                all_rows.append(row)

    print(f"Raw rows extracted: {len(all_rows)}")

    # Parse into structured records
    plants = []
    for row in all_rows:
        plant_type = clean_text(row[0])
        botanical_raw = clean_text(row[1])
        common_name = clean_text(row[2])
        total_on_site = clean_text(row[3])
        grower_source = clean_text(row[4])
        comments = clean_text(row[5])

        scientific_name, cultivar = parse_botanical_name(botanical_raw)

        plants.append({
            "plant_type": plant_type,
            "scientific_name": scientific_name,
            "cultivar": cultivar,
            "botanical_name_raw": botanical_raw,
            "common_name": common_name,
            "total_on_site": total_on_site,
            "grower_source": grower_source,
            "comments": comments,
        })

    print(f"Parsed {len(plants)} plants")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = [
        "plant_type", "scientific_name", "cultivar", "botanical_name_raw",
        "common_name", "total_on_site", "grower_source", "comments",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in plants:
            writer.writerow(p)
    print(f"Wrote {csv_path} ({len(plants)} rows)")

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
            plant_type TEXT,
            scientific_name TEXT,
            cultivar TEXT,
            botanical_name_raw TEXT,
            common_name TEXT,
            total_on_site TEXT,
            grower_source TEXT,
            comments TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_scientific_name ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_plant_type ON plants(plant_type)")

    for p in plants:
        cur.execute(
            """INSERT INTO plants
               (plant_type, scientific_name, cultivar, botanical_name_raw,
                common_name, total_on_site, grower_source, comments)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                p["plant_type"], p["scientific_name"], p["cultivar"],
                p["botanical_name_raw"], p["common_name"],
                p["total_on_site"], p["grower_source"], p["comments"],
            ),
        )
    conn.commit()

    # Print summary stats
    cur.execute("SELECT plant_type, COUNT(*) FROM plants GROUP BY plant_type ORDER BY COUNT(*) DESC")
    print("\nPlant Type Distribution:")
    for ptype, count in cur.fetchall():
        print(f"  {ptype}: {count}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
