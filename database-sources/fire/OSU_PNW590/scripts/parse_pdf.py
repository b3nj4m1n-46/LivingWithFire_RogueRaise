"""
Parse Oregon State University Extension PNW-590:
Fire-resistant Plants for Home Landscapes (Revised October 2023)

Strategy: Use the plant INDEX on pages 54-55 for clean names,
then enrich with trait data (height, spread, zones, etc.) from individual pages.

Source: Detweiler, A.J., Fitzgerald, S., Cowan, A., et al. 2023.
        Fire-resistant Plants for Home Landscapes. PNW 590.
        Oregon State University Extension.
"""

import csv
import json
import os
import re
import sqlite3

import pdfplumber

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
PDF_FILE = os.path.join(DATA_DIR, "Sources", "OSU_PNW590_FireResistantPlants.pdf")


def clean(s):
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def parse_index(pdf):
    """Parse the plant index from pages 54-55."""
    plants = []
    current_category = ""

    for pg_num in [53, 54]:  # 0-indexed: pages 54, 55
        text = pdf.pages[pg_num].extract_text()
        if not text:
            continue

        lines = text.split("\n")
        for line in lines:
            line = line.strip()

            # Skip headers and noise
            if not line or line.startswith("PLANT INDEX") or line.startswith("Alternative"):
                continue
            if "PHOTO:" in line or "stock.adobe" in line or "wise plants" in line:
                continue

            # Detect category headers
            if line in ["Groundcovers", "Perennials", "Broadleaf evergreens", "Shrubs", "Trees"]:
                current_category = line
                continue

            # Parse index entries: "Scientific name, common name PAGE"
            # Or "Common name PAGE" (genus-only entries)
            # May have multiple entries per line separated by spaces with page numbers

            # Split line at page numbers to separate multiple entries
            # Pattern: text followed by one or more page numbers
            entries = re.findall(
                r"([A-Z][^,\d]+(?:,\s*[^,\d]+)?)\s+(\d{1,2}(?:\s*,\s*\d{1,2})*)",
                line,
            )

            if not entries:
                # Try entries that start lowercase (continuation from previous line)
                entries = re.findall(
                    r"([a-z][^,\d]+(?:,\s*[^,\d]+)?)\s+(\d{1,2}(?:\s*,\s*\d{1,2})*)",
                    line,
                )

            for entry_text, pages in entries:
                entry_text = entry_text.strip()
                if len(entry_text) < 3:
                    continue

                # Skip cross-references
                if entry_text.startswith("(see ") or entry_text.startswith("see "):
                    continue

                scientific = ""
                common = ""

                # Check if it has comma separator
                if "," in entry_text:
                    parts = entry_text.split(",", 1)
                    first = parts[0].strip()
                    second = parts[1].strip()

                    # If first part starts with uppercase and looks like a genus
                    if re.match(r"^[A-Z][a-z]+(?:\s+[a-z]|\s+x\s|$)", first):
                        scientific = first
                        common = second
                    else:
                        common = first
                        scientific = second
                else:
                    # No comma - could be just a common name or genus
                    if re.match(r"^[A-Z][a-z]+(?:\s+[a-z])", entry_text):
                        scientific = entry_text
                    else:
                        common = entry_text

                page_ref = pages.strip()

                if scientific or common:
                    # Clean up category words that leaked into names
                    for cat_word in ["Groundcovers", "Perennials", "Broadleaf evergreens", "Shrubs", "Trees"]:
                        scientific = scientific.replace(cat_word, "").strip()
                        common = common.replace(cat_word, "").strip()

                    # Assign category by page number
                    first_pg = int(re.match(r"\d+", page_ref).group()) if re.match(r"\d+", page_ref) else 0
                    if 11 <= first_pg <= 16:
                        cat = "Groundcover"
                    elif 17 <= first_pg <= 31:
                        cat = "Perennial"
                    elif 32 <= first_pg <= 34:
                        cat = "Broadleaf Evergreen"
                    elif 35 <= first_pg <= 42:
                        cat = "Shrub"
                    elif 43 <= first_pg <= 53:
                        cat = "Tree"
                    else:
                        cat = current_category

                    plants.append({
                        "scientific_name": scientific,
                        "common_name": common,
                        "category": cat,
                        "page": page_ref,
                    })

    return plants


def extract_traits_from_page(pdf, page_num):
    """Extract height/spread/zones/flowers/bloom from a page."""
    text = pdf.pages[page_num - 1].extract_text()
    if not text:
        return {}

    traits = {}

    # Find all height entries
    heights = re.findall(
        r"height:\s*([\d–\-\.]+\s*(?:inches|feet|inch|foot))",
        text, re.IGNORECASE,
    )
    spreads = re.findall(
        r"spread:\s*([\d–\-\.]+\s*(?:inches|feet|inch|foot))",
        text, re.IGNORECASE,
    )
    zones = re.findall(
        r"usda\s*hardiness\s*zones?:\s*([\d–\-]+)",
        text, re.IGNORECASE,
    )
    flowers = re.findall(
        r"flowers?:\s*([^\n]{3,80})",
        text, re.IGNORECASE,
    )
    blooms = re.findall(
        r"bloom\s*time:\s*([^\n]{3,60})",
        text, re.IGNORECASE,
    )

    # Check for water use indicators
    water = ""
    # L, M, H appear as standalone characters on many pages
    if re.search(r"\bL\b.*(?:low water|minimal.*irrigation)", text, re.IGNORECASE):
        water = "Low"
    elif re.search(r"\bM\b.*(?:moderate|supplemental)", text, re.IGNORECASE):
        water = "Moderate"
    elif re.search(r"\bH\b.*(?:high|needs.*irrigation)", text, re.IGNORECASE):
        water = "High"

    invasive = "invasive" in text.lower()
    native_or = "native" in text.lower() and "oregon" in text.lower()
    native_pnw = "native" in text.lower() and ("pacific northwest" in text.lower() or "western" in text.lower())

    return {
        "heights": heights,
        "spreads": spreads,
        "zones": zones,
        "flowers": flowers,
        "blooms": blooms,
        "water_use": water,
        "invasive_warning": invasive,
        "native_hint": native_or or native_pnw,
    }


def main():
    print(f"Reading PDF: {PDF_FILE}")
    pdf = pdfplumber.open(PDF_FILE)
    print(f"Pages: {len(pdf.pages)}")

    # Parse index
    plants = parse_index(pdf)
    print(f"Plants from index: {len(plants)}")

    # Deduplicate by scientific name
    seen = set()
    unique = []
    for p in plants:
        key = p["scientific_name"] or p["common_name"]
        if key and key not in seen:
            seen.add(key)
            unique.append(p)

    print(f"Unique plants: {len(unique)}")

    # Enrich with traits from referenced pages
    for p in unique:
        page_str = p["page"]
        first_page = int(re.match(r"\d+", page_str).group())
        traits = extract_traits_from_page(pdf, first_page)

        # Assign traits (take first match from the page as approximate)
        p["height"] = traits.get("heights", [""])[0] if traits.get("heights") else ""
        p["spread"] = traits.get("spreads", [""])[0] if traits.get("spreads") else ""
        p["usda_zones"] = traits.get("zones", [""])[0] if traits.get("zones") else ""
        p["flower_color"] = traits.get("flowers", [""])[0] if traits.get("flowers") else ""
        p["bloom_time"] = traits.get("blooms", [""])[0] if traits.get("blooms") else ""
        p["water_use"] = traits.get("water_use", "")
        p["invasive_warning"] = traits.get("invasive_warning", False)

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = [
        "scientific_name", "common_name", "category", "page",
        "height", "spread", "usda_zones", "flower_color", "bloom_time",
        "water_use", "invasive_warning",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in unique:
            writer.writerow(p)
    print(f"Wrote {csv_path} ({len(unique)} rows)")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "OSU Extension PNW-590: Fire-resistant Plants for Home Landscapes (Rev. Oct 2023)",
            "authors": "Detweiler, A.J., Fitzgerald, S., Cowan, A., et al.",
            "url": "https://extension.oregonstate.edu/pub/pnw-590",
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
            category TEXT,
            page TEXT,
            height TEXT,
            spread TEXT,
            usda_zones TEXT,
            flower_color TEXT,
            bloom_time TEXT,
            water_use TEXT,
            invasive_warning BOOLEAN
        )
    """)
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_cat ON plants(category)")

    for p in unique:
        cur.execute(
            """INSERT INTO plants (scientific_name, common_name, category, page,
               height, spread, usda_zones, flower_color, bloom_time,
               water_use, invasive_warning)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (p["scientific_name"], p["common_name"], p["category"], p["page"],
             p["height"], p["spread"], p["usda_zones"], p["flower_color"],
             p["bloom_time"], p["water_use"], p["invasive_warning"]),
        )

    conn.commit()

    cur.execute("SELECT category, COUNT(*) FROM plants GROUP BY category ORDER BY COUNT(*) DESC")
    print("\nCategory Distribution:")
    for cat, count in cur.fetchall():
        print(f"  {cat}: {count}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
