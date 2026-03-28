"""
Parse Missouri Botanical Garden / Shaw Nature Reserve:
Native Plants for a Deer Resistant Garden

Browse categories: No Browse, Light Browse, Medium Browse, Complete Browse

Source: Shaw Nature Reserve, Missouri Botanical Garden.
        Three-year study in Wildwood, Missouri (heavy deer population).
"""

import csv
import json
import os
import re
import sqlite3

import pdfplumber

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
PDF_FILE = os.path.join(DATA_DIR, "Sources", "MissouriBotanical_DeerBrowse.pdf")


def clean(s):
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def main():
    print(f"Reading PDF: {PDF_FILE}")
    pdf = pdfplumber.open(PDF_FILE)
    print(f"Pages: {len(pdf.pages)}")

    plants = []
    current_browse = ""

    # Order matters: longest/most specific first to avoid substring matches
    browse_categories = [
        "Very Light Browse (Tasted)", "Very Light Browse",
        "Complete Browse", "Heavy Browse", "Medium Browse",
        "Light Browse", "No Browse",
    ]

    for pg_idx in range(len(pdf.pages)):
        text = pdf.pages[pg_idx].extract_text()
        if not text:
            continue

        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Skip headers
            if "Native Plants" in line or "This information" in line or "three year" in line:
                continue
            if "over-population" in line:
                continue

            # Check for browse category - match longest first to avoid partial matches
            matched_cat = False
            for cat in browse_categories:
                if cat in line:
                    current_browse = cat
                    # Remove the category from the line to check for trailing plant
                    line = line.replace(cat, "").replace("(cont.)", "").strip()
                    matched_cat = True
                    if not line:
                        break
                    break
            if matched_cat and not line:
                continue

            if not current_browse:
                continue

            # Parse plant entries: "Scientific name (Common name)"
            entries = re.findall(
                r"([A-Z][a-z]+(?:\s+[a-z]+)?(?:\s+(?:var\.|subsp\.)\s+[a-z]+)?)\s+\(([^)]+)\)",
                line,
            )

            for sci, com in entries:
                sci = sci.strip()
                com = com.strip()
                if len(sci) > 3 and len(com) > 2:
                    plants.append({
                        "scientific_name": sci,
                        "common_name": com,
                        "deer_browse": current_browse,
                    })

    print(f"Plants extracted: {len(plants)}")

    # Deduplicate
    seen = set()
    unique = []
    for p in plants:
        key = p["scientific_name"]
        if key not in seen:
            seen.add(key)
            unique.append(p)
    print(f"Unique plants: {len(unique)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "deer_browse"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in unique:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Shaw Nature Reserve / Missouri Botanical Garden: Native Plants for a Deer Resistant Garden",
            "methodology": "Three-year study in Wildwood, Missouri with heavy deer over-population",
            "browse_scale": {
                "No Browse": "Deer do not eat this plant",
                "Light Browse": "Minor/occasional browsing",
                "Medium Browse": "Moderate browsing damage",
                "Complete Browse": "Deer consume entirely",
            },
            "plants": unique,
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
            deer_browse TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_browse ON plants(deer_browse)")
    for p in unique:
        cur.execute("INSERT INTO plants (scientific_name, common_name, deer_browse) VALUES (?, ?, ?)",
                    (p["scientific_name"], p["common_name"], p["deer_browse"]))
    conn.commit()

    cur.execute("SELECT deer_browse, COUNT(*) FROM plants GROUP BY deer_browse")
    print("\nBrowse Distribution:")
    for b, c in cur.fetchall():
        print(f"  {b}: {c}")
    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
