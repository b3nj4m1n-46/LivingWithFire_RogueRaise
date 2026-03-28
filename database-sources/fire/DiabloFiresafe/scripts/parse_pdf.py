"""
Parse the Diablo Firesafe Council plant lists PDF.

Source: Diablo Firesafe Council
        Based on UC Forest Products Laboratory methodology (July 1997)

Structure:
  Pages 1-8: Table 1 - Fire-resistant plants (3+ favorable references)
  Page 9: Table 2 - Highly flammable plants (3+ unfavorable references)
  Pages 10-21: Reference sources with methodology notes
"""

import csv
import json
import os
import re
import sqlite3

import pdfplumber

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
PDF_FILE = os.path.join(DATA_DIR, "Sources", "Diablo Firesafe Council List.pdf")


def clean(s):
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def extract_plants(pdf):
    """Extract plants from Tables 1 and 2 (pages 1-9)."""
    plants = []
    current_rating = "Fire-Resistant"

    for i in range(9):  # pages 1-9
        text = pdf.pages[i].extract_text()
        if not text:
            continue

        # Detect switch to Table 2
        if "unfavorable" in text.lower() and "fire performance" in text.lower():
            current_rating = "Highly Flammable"

        tables = pdf.pages[i].extract_tables()
        for tbl in tables:
            # Accumulate multi-line rows
            pending = None
            for row in tbl:
                cells = [clean(c) if c else "" for c in row]

                # Skip header rows
                if any(h in cells[0] for h in ["Scientific", "Name", ""]) and cells[1] in ["Common", "Name", ""]:
                    continue

                # If first cell is empty, this is a continuation of the previous row
                if not cells[0] and pending:
                    for j in range(len(cells)):
                        if cells[j]:
                            pending[j] = (pending[j] + " " + cells[j]).strip()
                    continue

                # Save previous pending row
                if pending and pending[0]:
                    sci = pending[0]
                    common = pending[1]
                    ptype = pending[2]
                    pform = pending[3]
                    refs = pending[4] if len(pending) > 4 else ""
                    if common:  # skip category headers
                        plants.append({
                            "scientific_name": sci,
                            "common_name": common,
                            "plant_type": ptype,
                            "plant_form": pform,
                            "fire_rating": current_rating,
                            "references": refs,
                        })

                pending = cells

            # Don't forget last pending
            if pending and pending[0] and pending[1]:
                plants.append({
                    "scientific_name": pending[0],
                    "common_name": pending[1],
                    "plant_type": pending[2],
                    "plant_form": pending[3],
                    "fire_rating": current_rating,
                    "references": pending[4] if len(pending) > 4 else "",
                })

    return plants


def extract_references(pdf):
    """Extract reference sources from pages 10-21."""
    refs = []
    for i in range(9, len(pdf.pages)):
        tables = pdf.pages[i].extract_tables()
        for tbl in tables:
            for row in tbl:
                cells = [clean(c) if c else "" for c in row]
                if len(cells) >= 6 and cells[0]:
                    # Skip header-like rows
                    if cells[0] in ["Ref.", "Ref"]:
                        continue
                    refs.append({
                        "ref_number": cells[0],
                        "author": cells[1],
                        "title": cells[2],
                        "year": cells[3],
                        "publisher": cells[4],
                        "summary": cells[5],
                    })
    return refs


def main():
    print(f"Reading PDF: {PDF_FILE}")
    pdf = pdfplumber.open(PDF_FILE)
    print(f"Pages: {len(pdf.pages)}")

    plants = extract_plants(pdf)
    print(f"Plants extracted: {len(plants)}")

    references = extract_references(pdf)
    print(f"References extracted: {len(references)}")

    # --- Plants CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "plant_type", "plant_form",
              "fire_rating", "references"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in plants:
            writer.writerow(p)
    print(f"Wrote {csv_path} ({len(plants)} rows)")

    # --- References CSV ---
    ref_path = os.path.join(DATA_DIR, "references.csv")
    ref_fields = ["ref_number", "author", "title", "year", "publisher", "summary"]
    with open(ref_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=ref_fields)
        writer.writeheader()
        for r in references:
            writer.writerow(r)
    print(f"Wrote {ref_path} ({len(references)} rows)")

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
            "references" TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_scientific_name ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_fire_rating ON plants(fire_rating)")

    for p in plants:
        cur.execute(
            'INSERT INTO plants (scientific_name, common_name, plant_type, plant_form, fire_rating, "references") VALUES (?, ?, ?, ?, ?, ?)',
            (p["scientific_name"], p["common_name"], p["plant_type"],
             p["plant_form"], p["fire_rating"], p["references"]),
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

    cur.execute("SELECT fire_rating, COUNT(*) FROM plants GROUP BY fire_rating")
    print("\nFire Rating Distribution:")
    for rating, count in cur.fetchall():
        print(f"  {rating}: {count}")

    cur.execute("SELECT plant_form, COUNT(*) FROM plants GROUP BY plant_form ORDER BY COUNT(*) DESC")
    print("\nPlant Form Distribution:")
    for form, count in cur.fetchall():
        print(f"  {form}: {count}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
