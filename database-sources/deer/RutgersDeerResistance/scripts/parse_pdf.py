"""
Parse Rutgers Cooperative Extension E271:
Landscape Plants Rated by Deer Resistance

Rating system:
  A = Rarely Damaged
  B = Seldom Severely Damaged
  C = Occasionally Severely Damaged
  D = Frequently Severely Damaged

Source: Perdomo, P., Nitzsche, P., and Drake, D.
        Rutgers NJ Agricultural Experiment Station.
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
                        "Landscape Plants Rated by Deer Resistance.pdf")

RATING_MAP = {
    "A": "Rarely Damaged",
    "B": "Seldom Severely Damaged",
    "C": "Occasionally Severely Damaged",
    "D": "Frequently Severely Damaged",
}


def clean(s):
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def main():
    print(f"Reading PDF: {PDF_FILE}")
    pdf = pdfplumber.open(PDF_FILE)
    print(f"Pages: {len(pdf.pages)}")

    plants = []
    current_category = ""  # BULBS, GROUNDCOVERS, ORNAMENTAL GRASSES, PERENNIALS, SHRUBS, TREES
    current_rating = ""

    # Category keywords to detect
    categories = [
        "BULBS", "GROUNDCOVERS", "ORNAMENTAL GRASSES",
        "PERENNIALS", "SHRUBS", "TREES",
    ]
    ratings = [
        "Rarely Damaged", "Seldom Severely Damaged",
        "Occasionally Severely Damaged", "Frequently Severely Damaged",
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

            # Skip header rows
            if line.startswith("Latin Name") or line.startswith("E271") or line.startswith("Bulletin"):
                continue
            if "www.rce.rutgers.edu" in line or "Cooperative Extension" in line:
                continue

            # Check for category header
            for cat in categories:
                if cat in line and "Latin" not in line:
                    current_category = cat
                    # Also check for rating on same line
                    for r in ratings:
                        if r in line:
                            current_rating = r
                    break

            # Check for rating header
            for r in ratings:
                if r in line and "Latin" not in line:
                    current_rating = r
                    # Check if category also on this line
                    for cat in categories:
                        if cat in line:
                            current_category = cat
                    continue

            # Skip if we haven't established context yet
            if not current_category or not current_rating:
                continue

            # Try to parse as plant entry: "Latin Name Common Name"
            # The PDF has two columns per page, so each line might have two entries
            # Pattern: Scientific name (starts with capital, has lowercase species)
            # followed by common name

            # Try to find scientific names in the line
            # Look for pattern: CapitalWord lowercase_or_special followed by Common Name
            matches = re.findall(
                r"([A-Z][a-z]+(?:\s+(?:x\s+)?[a-z]+)?(?:\s+(?:sp\.\*?|cv\.\*?|'[^']+'))?)\s+"
                r"([A-Z][A-Za-z\s\-\'/,\.]+?)(?=\s{2,}[A-Z][a-z]|\s*$)",
                line,
            )

            if matches:
                for sci, com in matches:
                    sci = sci.strip()
                    com = com.strip().rstrip("*")
                    if len(sci) > 3 and len(com) > 2:
                        # Skip if common name looks like a scientific name
                        if not re.match(r"^[A-Z][a-z]+\s+[a-z]+$", com):
                            plants.append({
                                "scientific_name": sci,
                                "common_name": com,
                                "plant_type": current_category.title(),
                                "deer_rating": current_rating,
                                "deer_rating_code": [k for k, v in RATING_MAP.items() if v == current_rating][0] if current_rating in RATING_MAP.values() else "",
                            })
            else:
                # Simple split: try splitting on double spaces or recognizable patterns
                # Many lines are: "Scientific name Common Name Scientific name Common Name"
                parts = re.split(r"\s{2,}", line)
                for part in parts:
                    part = part.strip()
                    if not part:
                        continue
                    # Try: "Genus species Common Name"
                    m = re.match(
                        r"^([A-Z][a-z]+(?:\s+(?:x\s+)?[a-z]+)?(?:\s+(?:sp\.\*?|cv\.\*?|'[^']+'))?)\s+(.+)$",
                        part,
                    )
                    if m:
                        sci = m.group(1).strip()
                        com = m.group(2).strip().rstrip("*")
                        if len(sci) > 3 and len(com) > 2 and current_rating:
                            plants.append({
                                "scientific_name": sci,
                                "common_name": com,
                                "plant_type": current_category.title(),
                                "deer_rating": current_rating,
                                "deer_rating_code": [k for k, v in RATING_MAP.items() if v == current_rating][0] if current_rating in RATING_MAP.values() else "",
                            })

    print(f"Plants extracted: {len(plants)}")

    # Deduplicate
    seen = set()
    unique = []
    for p in plants:
        key = (p["scientific_name"], p["common_name"])
        if key not in seen:
            seen.add(key)
            unique.append(p)
    print(f"Unique plants: {len(unique)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "plant_type", "deer_rating", "deer_rating_code"]
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
            "source": "Rutgers Cooperative Extension E271: Landscape Plants Rated by Deer Resistance",
            "authors": "Perdomo, P., Nitzsche, P., and Drake, D.",
            "rating_scale": RATING_MAP,
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
            plant_type TEXT,
            deer_rating TEXT,
            deer_rating_code TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_rating ON plants(deer_rating_code)")

    for p in unique:
        cur.execute(
            "INSERT INTO plants (scientific_name, common_name, plant_type, deer_rating, deer_rating_code) VALUES (?, ?, ?, ?, ?)",
            (p["scientific_name"], p["common_name"], p["plant_type"],
             p["deer_rating"], p["deer_rating_code"]),
        )
    conn.commit()

    cur.execute("SELECT deer_rating, COUNT(*) FROM plants GROUP BY deer_rating ORDER BY deer_rating_code")
    print("\nDeer Rating Distribution:")
    for r, c in cur.fetchall():
        print(f"  {r}: {c}")

    cur.execute("SELECT plant_type, COUNT(*) FROM plants GROUP BY plant_type ORDER BY COUNT(*) DESC")
    print("\nPlant Type Distribution:")
    for t, c in cur.fetchall():
        print(f"  {t}: {c}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
