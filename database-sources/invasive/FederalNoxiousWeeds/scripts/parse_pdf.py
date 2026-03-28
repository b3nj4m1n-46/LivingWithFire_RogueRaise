"""
Parse the Federal Noxious Weed List PDF.

Source: USDA APHIS PPQ
URL: https://www.invasive.org/species/list.cfm?id=16
Effective: December 10, 2010
Categories: Aquatic, Parasitic, Terrestrial
"""

import csv, json, os, re, sqlite3, sys
import pdfplumber

sys.stdout.reconfigure(encoding="utf-8")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
PDF_FILE = os.path.join(DATA_DIR, "Sources", "federal noxious weed list.pdf")


def main():
    pdf = pdfplumber.open(PDF_FILE)
    print(f"Pages: {len(pdf.pages)}")

    plants = []
    current_category = ""

    for pg_idx in range(len(pdf.pages)):
        text = pdf.pages[pg_idx].extract_text()
        if not text:
            continue

        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Detect category headers
            if line == "Aquatic":
                current_category = "Aquatic"
                continue
            elif line == "Parasitic":
                current_category = "Parasitic"
                continue
            elif line == "Terrestrial":
                current_category = "Terrestrial"
                continue

            # Skip headers and footers
            if any(skip in line for skip in ["Latin Name", "Author(s)", "Common Name",
                    "Federal Noxious", "Page", "Change Log", "Version", "Effective",
                    "Formatting", "Added change"]):
                continue

            # Skip update notes
            if line.startswith("=") or line.startswith("Now:") or line.startswith("(updated"):
                continue

            if not current_category:
                continue

            # Try to parse: scientific_name author(s) common_name(s)
            # Scientific names start with a capital letter and are italic
            # The challenge is separating author from common name

            # Simple approach: find the first word that looks like an author
            # (starts with capital after genus+species, contains periods or parentheses)
            # Or just grab the whole line and clean up later

            # Many lines are continuations - skip those that start with lowercase
            # or are just common names
            if line[0].islower() and not line.startswith("ex "):
                continue

            # Check if line starts with a genus name (Capital + lowercase)
            m = re.match(r"^([A-Z][a-z]+(?:\s+[a-z]+(?:\s+(?:ssp\.|subsp\.|var\.)\s+[a-z]+)?)?)\s+(.+)$", line)
            if m:
                sci = m.group(1).strip()
                rest = m.group(2).strip()

                # Try to find where the common name starts (after author)
                # Common names often start with a capital letter after a space
                # Authors have abbreviations with periods
                # Simple heuristic: split on the last run of capitalized words
                common = ""
                # Look for known common name patterns
                for cname_match in re.finditer(r"([A-Z][a-z]+(?:\s+[a-z]+)*(?:\s*,\s*[a-z]+\s+[a-z]+)*)\s*$", rest):
                    common = cname_match.group(1)

                if not common:
                    # Fallback: everything after the last period or parenthesis
                    parts = re.split(r"[.)]\s+", rest)
                    if len(parts) > 1:
                        common = parts[-1].strip()

                if sci and len(sci) > 3:
                    plants.append({
                        "scientific_name": sci,
                        "common_name": common,
                        "category": current_category,
                    })

    # Deduplicate
    seen = set()
    unique = []
    for p in plants:
        key = p["scientific_name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(p)

    print(f"Plants extracted: {len(unique)}")

    # Count by category
    cats = {}
    for p in unique:
        cats[p["category"]] = cats.get(p["category"], 0) + 1
    for c, n in sorted(cats.items()):
        print(f"  {c}: {n}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "category"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for p in unique: w.writerow(p)
    print(f"Wrote {csv_path}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"source": "USDA APHIS PPQ Federal Noxious Weed List",
                    "effective_date": "December 10, 2010",
                    "categories": ["Aquatic", "Parasitic", "Terrestrial"],
                    "plants": unique}, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path): os.remove(db_path)
    conn = sqlite3.connect(db_path); cur = conn.cursor()
    cur.execute("CREATE TABLE plants (id INTEGER PRIMARY KEY AUTOINCREMENT, scientific_name TEXT, common_name TEXT, category TEXT)")
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_cat ON plants(category)")
    for p in unique:
        cur.execute("INSERT INTO plants (scientific_name, common_name, category) VALUES (?,?,?)",
                    (p["scientific_name"], p["common_name"], p["category"]))
    conn.commit(); conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
