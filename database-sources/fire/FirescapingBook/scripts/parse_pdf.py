"""
Parse the Firescaping Your Home (Edwards & Schleiger, 2023) PDF.

Extracts:
1. "BAD OR NOXIOUS PLANTS" / "PLANT INSTEAD" swap tables
2. "POOR PLANTS" / "PLANT INSTEAD" swap tables
3. Chapter/category context for each table

Source: Edwards, A. and Schleiger, R. 2023. Firescaping Your Home:
        A Manual for Readiness in Wildfire Country. Timber Press, Portland, OR.
"""

import csv
import json
import os
import re
import sqlite3

import pdfplumber

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
PDF_FILE = os.path.join(DATA_DIR, "Sources",
                        "Firescaping_Your_Home_-_Adrienne_Edwards_Rachel_Schleiger.pdf")


def clean(s):
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def parse_plant_entry(text):
    """Parse 'Scientific name (COMMON NAME)' into components."""
    # Pattern: Genus species (COMMON NAME), possible notes after
    m = re.match(r"^(.*?)\s*\(([^)]+)\)(.*)?$", text.strip())
    if m:
        scientific = m.group(1).strip()
        common = m.group(2).strip()
        notes = m.group(3).strip().lstrip(",").strip() if m.group(3) else ""
        return scientific, common, notes
    return text.strip(), "", ""


def extract_swap_tables(pdf):
    """Extract all BAD/NOXIOUS -> PLANT INSTEAD tables."""
    swaps = []

    # Track chapter context
    current_category = ""

    for i in range(len(pdf.pages)):
        text = pdf.pages[i].extract_text()
        tables = pdf.pages[i].extract_tables()

        if not text:
            continue

        # Try to detect category context from page text
        lines = text.split("\n")
        for line in lines[:10]:
            line_clean = line.strip()
            # Category headers like "Large Deciduous Trees", "Medium Evergreen to Semi-Evergreen Trees"
            if re.match(
                r"^(Large|Medium|Small|Deciduous|Evergreen|Semi-Evergreen|Shrubs|Groundcovers?|Perennial|Vines|Grasses|Ferns|Succulents)",
                line_clean,
            ):
                current_category = line_clean[:80]
                break

        for tbl in tables:
            if len(tbl) < 2:
                continue

            header = str(tbl[0])
            if "BAD" not in header and "NOXIOUS" not in header and "POOR" not in header:
                continue

            swap_type = "POOR" if "POOR" in header else "BAD OR NOXIOUS"

            for row in tbl[1:]:
                if len(row) < 2:
                    continue
                bad_cell = clean(row[0]) if row[0] else ""
                good_cell = clean(row[1]) if row[1] else ""

                if not bad_cell or not good_cell:
                    continue

                # Split multi-plant cells
                bad_plants_raw = re.split(r"\n|(?<=\))\s*(?=[A-Z][a-z])", bad_cell)
                good_plants_raw = re.split(r"\n|(?<=\))\s*(?=[A-Z][a-z])", good_cell)

                bad_entries = []
                for bp in bad_plants_raw:
                    bp = bp.strip()
                    if bp and not bp.startswith("hybrid"):
                        sci, com, notes = parse_plant_entry(bp)
                        if sci:
                            bad_entries.append({
                                "scientific_name": sci,
                                "common_name": com,
                                "notes": notes,
                            })

                good_entries = []
                for gp in good_plants_raw:
                    gp = gp.strip()
                    if gp:
                        sci, com, notes = parse_plant_entry(gp)
                        if sci:
                            good_entries.append({
                                "scientific_name": sci,
                                "common_name": com,
                                "notes": notes,
                            })

                # Create swap records: each bad plant maps to all good replacements
                for bad in bad_entries:
                    for good in good_entries:
                        swaps.append({
                            "page": i + 1,
                            "category": current_category,
                            "swap_type": swap_type,
                            "bad_scientific": bad["scientific_name"],
                            "bad_common": bad["common_name"],
                            "bad_notes": bad["notes"],
                            "replacement_scientific": good["scientific_name"],
                            "replacement_common": good["common_name"],
                            "replacement_notes": good["notes"],
                        })

    return swaps


def main():
    print(f"Reading PDF: {PDF_FILE}")
    pdf = pdfplumber.open(PDF_FILE)
    print(f"Pages: {len(pdf.pages)}")

    swaps = extract_swap_tables(pdf)
    print(f"Plant swap records extracted: {len(swaps)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plant_swaps.csv")
    fields = [
        "page", "category", "swap_type",
        "bad_scientific", "bad_common", "bad_notes",
        "replacement_scientific", "replacement_common", "replacement_notes",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for s in swaps:
            writer.writerow(s)
    print(f"Wrote {csv_path}")

    # --- Unique plants lists ---
    bad_plants = {}
    good_plants = {}
    for s in swaps:
        key = s["bad_scientific"]
        if key not in bad_plants:
            bad_plants[key] = {
                "scientific_name": s["bad_scientific"],
                "common_name": s["bad_common"],
                "notes": s["bad_notes"],
                "swap_type": s["swap_type"],
                "categories": set(),
            }
        bad_plants[key]["categories"].add(s["category"])

        key2 = s["replacement_scientific"]
        if key2 not in good_plants:
            good_plants[key2] = {
                "scientific_name": s["replacement_scientific"],
                "common_name": s["replacement_common"],
                "notes": s["replacement_notes"],
                "categories": set(),
            }
        good_plants[key2]["categories"].add(s["category"])

    print(f"\nUnique bad/noxious plants: {len(bad_plants)}")
    print(f"Unique native replacements: {len(good_plants)}")

    # --- Unique plants CSV ---
    bad_csv = os.path.join(DATA_DIR, "bad_plants.csv")
    with open(bad_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["scientific_name", "common_name", "swap_type", "notes", "categories"])
        for p in sorted(bad_plants.values(), key=lambda x: x["scientific_name"]):
            writer.writerow([
                p["scientific_name"], p["common_name"], p["swap_type"],
                p["notes"], "; ".join(sorted(p["categories"])),
            ])
    print(f"Wrote {bad_csv}")

    good_csv = os.path.join(DATA_DIR, "replacement_plants.csv")
    with open(good_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["scientific_name", "common_name", "notes", "categories"])
        for p in sorted(good_plants.values(), key=lambda x: x["scientific_name"]):
            writer.writerow([
                p["scientific_name"], p["common_name"],
                p["notes"], "; ".join(sorted(p["categories"])),
            ])
    print(f"Wrote {good_csv}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plant_swaps.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Firescaping Your Home (Edwards & Schleiger, 2023)",
            "swaps": swaps,
            "bad_plant_count": len(bad_plants),
            "replacement_plant_count": len(good_plants),
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "plant_swaps.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE plant_swaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page INTEGER,
            category TEXT,
            swap_type TEXT,
            bad_scientific TEXT,
            bad_common TEXT,
            bad_notes TEXT,
            replacement_scientific TEXT,
            replacement_common TEXT,
            replacement_notes TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_bad_sci ON plant_swaps(bad_scientific)")
    cur.execute("CREATE INDEX idx_repl_sci ON plant_swaps(replacement_scientific)")

    for s in swaps:
        cur.execute(
            "INSERT INTO plant_swaps (page, category, swap_type, bad_scientific, bad_common, bad_notes, replacement_scientific, replacement_common, replacement_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (s["page"], s["category"], s["swap_type"],
             s["bad_scientific"], s["bad_common"], s["bad_notes"],
             s["replacement_scientific"], s["replacement_common"],
             s["replacement_notes"]),
        )

    conn.commit()

    cur.execute("SELECT swap_type, COUNT(*) FROM plant_swaps GROUP BY swap_type")
    print("\nSwap Type Distribution:")
    for t, c in cur.fetchall():
        print(f"  {t}: {c}")

    cur.execute("SELECT category, COUNT(*) FROM plant_swaps GROUP BY category ORDER BY COUNT(*) DESC LIMIT 15")
    print("\nTop Categories:")
    for cat, c in cur.fetchall():
        print(f"  {cat}: {c}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
