"""
Parse the Fire Safe Monterey plant lists HTML page and export to CSV, JSON, and SQLite.

Source: Fire Safe Monterey County - Fire-Safe and Fire-Unsafe Plant Lists
        https://www.firesafemonterey.org/plant-lists.html
        Based on: University of California Forest Products Laboratory, July 1997
        Literature review of fire ratings from 58 published references.

The page contains three tables:
  1. Fire-Resistant/Fire-Retardant Plants (148 entries)
  2. Highly Flammable Plants (18 entries)
  3. References (58 sources cited)
"""

import csv
import json
import os
import re
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
HTML_FILE = os.path.join(DATA_DIR, "Sources",
                         "firesafemonterey.org plant list.html")


def extract_tables(html_content):
    """Extract all tables from HTML, returning list of (headers, rows)."""
    tables = re.findall(r'<table[^>]*>(.*?)</table>', html_content, re.DOTALL)
    result = []
    for tbl in tables:
        # Extract headers
        headers = re.findall(r'<th[^>]*>(.*?)</th>', tbl, re.DOTALL)
        headers = [re.sub(r'<[^>]+>', '', h).strip() for h in headers]

        # Extract rows
        rows_html = re.findall(r'<tr[^>]*>(.*?)</tr>', tbl, re.DOTALL)
        rows = []
        for row_html in rows_html:
            cells = re.findall(r'<td[^>]*>(.*?)</td>', row_html, re.DOTALL)
            if cells:
                cells = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
                cells = [re.sub(r'\s+', ' ', c) for c in cells]
                rows.append(cells)
        result.append((headers, rows))
    return result


def main():
    print(f"Reading HTML from: {HTML_FILE}")
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        html_content = f.read()

    tables = extract_tables(html_content)
    print(f"Found {len(tables)} tables")

    # Table 1: Fire-Resistant plants
    h1, rows1 = tables[0]
    print(f"Fire-Resistant plants: {len(rows1)} rows, columns: {h1}")

    # Table 2: Highly Flammable plants
    h2, rows2 = tables[1]
    print(f"Highly Flammable plants: {len(rows2)} rows, columns: {h2}")

    # Table 3: References
    h3, rows3 = tables[2]
    print(f"References: {len(rows3)} rows, columns: {h3}")

    # Build plant records
    # Some scientific names contain *!* to indicate invasive species
    plants = []
    for row in rows1:
        if len(row) >= 5:
            sci_name = row[0]
            invasive = "*!*" in sci_name
            sci_name = sci_name.replace("*!*", "").strip()
            plants.append({
                "scientific_name": sci_name,
                "common_name": row[1],
                "plant_type": row[2],
                "plant_form": row[3],
                "fire_rating": "Fire-Resistant",
                "invasive": invasive,
                "references": row[4],
            })

    for row in rows2:
        if len(row) >= 5:
            sci_name = row[0]
            invasive = "*!*" in sci_name
            sci_name = sci_name.replace("*!*", "").strip()
            plants.append({
                "scientific_name": sci_name,
                "common_name": row[1],
                "plant_type": row[2],
                "plant_form": row[3],
                "fire_rating": "Highly Flammable",
                "invasive": invasive,
                "references": row[4],
            })

    print(f"\nTotal plants: {len(plants)}")

    # Build references list
    references = []
    for row in rows3:
        if len(row) >= 6:
            references.append({
                "ref_number": row[0].replace("</b", "").strip(),
                "author": row[1],
                "title": row[2],
                "year": row[3],
                "publisher": row[4],
                "summary": row[5],
            })

    # --- Plants CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "plant_type", "plant_form",
              "fire_rating", "invasive", "references"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in plants:
            writer.writerow(p)
    print(f"Wrote {csv_path} ({len(plants)} rows)")

    # --- References CSV ---
    ref_csv_path = os.path.join(DATA_DIR, "references.csv")
    ref_fields = ["ref_number", "author", "title", "year", "publisher", "summary"]
    with open(ref_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=ref_fields)
        writer.writeheader()
        for r in references:
            writer.writerow(r)
    print(f"Wrote {ref_csv_path} ({len(references)} rows)")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"plants": plants, "references": references}, f, indent=2,
                  ensure_ascii=False)
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
            plant_form TEXT,
            fire_rating TEXT,
            invasive BOOLEAN,
            "references" TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_scientific_name ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_fire_rating ON plants(fire_rating)")
    cur.execute("CREATE INDEX idx_plant_type ON plants(plant_type)")

    for p in plants:
        cur.execute(
            'INSERT INTO plants (scientific_name, common_name, plant_type, plant_form, fire_rating, invasive, "references") VALUES (?, ?, ?, ?, ?, ?, ?)',
            (p["scientific_name"], p["common_name"], p["plant_type"],
             p["plant_form"], p["fire_rating"], p["invasive"], p["references"]),
        )

    cur.execute("""
        CREATE TABLE references_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ref_number TEXT,
            author TEXT,
            title TEXT,
            year TEXT,
            publisher TEXT,
            summary TEXT
        )
    """)

    for r in references:
        cur.execute(
            "INSERT INTO references_list (ref_number, author, title, year, publisher, summary) VALUES (?, ?, ?, ?, ?, ?)",
            (r["ref_number"], r["author"], r["title"], r["year"],
             r["publisher"], r["summary"]),
        )

    conn.commit()

    # Stats
    cur.execute("SELECT fire_rating, COUNT(*) FROM plants GROUP BY fire_rating")
    print("\nFire Rating Distribution:")
    for rating, count in cur.fetchall():
        print(f"  {rating}: {count}")

    cur.execute("SELECT plant_type, COUNT(*) FROM plants GROUP BY plant_type ORDER BY COUNT(*) DESC")
    print("\nPlant Type Distribution:")
    for ptype, count in cur.fetchall():
        print(f"  {ptype}: {count}")

    cur.execute("SELECT plant_form, COUNT(*) FROM plants GROUP BY plant_form ORDER BY COUNT(*) DESC")
    print("\nPlant Form Distribution:")
    for form, count in cur.fetchall():
        print(f"  {form}: {count}")

    cur.execute("SELECT COUNT(*) FROM plants WHERE invasive = 1")
    print(f"\nInvasive species flagged: {cur.fetchone()[0]}")
    cur.execute("SELECT scientific_name, common_name FROM plants WHERE invasive = 1")
    for sci, common in cur.fetchall():
        print(f"  *!* {sci} ({common})")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
