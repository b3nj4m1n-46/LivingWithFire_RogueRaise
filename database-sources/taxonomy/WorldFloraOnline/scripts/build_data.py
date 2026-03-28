"""
Build World Flora Online (WFO) Plant List dataset.

Source: World Flora Online Consortium
URL: https://www.worldfloraonline.org/
Download: https://zenodo.org/records/18007552
Version: December 2025

Raw data: 1,657,866 total records
Output: All 381,467 accepted species (unfiltered)

Note: The raw source files in Sources/ contain the full dump including
synonyms (1,022,626), unchecked names (182,073), and infraspecific ranks.
The output files contain accepted species-rank records only.
"""

import csv
import json
import os
import sqlite3
import sys

sys.stdout.reconfigure(encoding="utf-8")
csv.field_size_limit(10_000_000)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
INPUT_FILE = os.path.join(DATA_DIR, "Sources", "classification.csv")

MAJOR_GROUPS = {
    "A": "Angiosperms",
    "Bryophyta": "Bryophyta (mosses)",
    "Polypodiophyta": "Polypodiophyta (ferns)",
    "Marchantiophyta": "Marchantiophyta (liverworts)",
    "Pinophyta": "Pinophyta (conifers)",
    "Lycopodiophyta": "Lycopodiophyta (clubmosses)",
    "Cycadophyta": "Cycadophyta (cycads)",
    "Anthocerotophyta": "Anthocerotophyta (hornworts)",
    "Ginkgophyta": "Ginkgophyta (ginkgo)",
}


def main():
    print(f"Reading: {INPUT_FILE}")

    plants = []
    total = 0

    with open(INPUT_FILE, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            total += 1
            if row.get("taxonomicStatus") == "Accepted" and row.get("taxonRank") == "species":
                plants.append({
                    "wfo_id": row.get("taxonID", ""),
                    "scientific_name": row.get("scientificName", "").strip('"'),
                    "family": row.get("family", ""),
                    "subfamily": row.get("subfamily", ""),
                    "tribe": row.get("tribe", ""),
                    "genus": row.get("genus", ""),
                    "specific_epithet": row.get("specificEpithet", ""),
                    "authors": row.get("scientificNameAuthorship", "").strip('"'),
                    "major_group": row.get("majorGroup", ""),
                    "major_group_name": MAJOR_GROUPS.get(row.get("majorGroup", ""), ""),
                    "nomenclatural_status": row.get("nomenclaturalStatus", ""),
                    "references": row.get("references", ""),
                })

    print(f"Total records: {total}")
    print(f"Accepted species: {len(plants)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["wfo_id", "scientific_name", "family", "subfamily", "tribe",
              "genus", "specific_epithet", "authors", "major_group",
              "major_group_name", "nomenclatural_status", "references"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in plants:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE plants (
            wfo_id TEXT PRIMARY KEY,
            scientific_name TEXT,
            family TEXT,
            subfamily TEXT,
            tribe TEXT,
            genus TEXT,
            specific_epithet TEXT,
            authors TEXT,
            major_group TEXT,
            major_group_name TEXT,
            nomenclatural_status TEXT,
            "references" TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_family ON plants(family)")
    cur.execute("CREATE INDEX idx_genus ON plants(genus)")
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_group ON plants(major_group)")

    for p in plants:
        cur.execute("""
            INSERT INTO plants (wfo_id, scientific_name, family, subfamily, tribe,
                genus, specific_epithet, authors, major_group, major_group_name,
                nomenclatural_status, "references")
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (p["wfo_id"], p["scientific_name"], p["family"], p["subfamily"],
             p["tribe"], p["genus"], p["specific_epithet"], p["authors"],
             p["major_group"], p["major_group_name"],
             p["nomenclatural_status"], p["references"]))
    conn.commit()

    # Stats
    cur.execute("SELECT major_group_name, COUNT(*) FROM plants WHERE major_group_name != '' GROUP BY major_group_name ORDER BY COUNT(*) DESC")
    print("\nMajor Groups:")
    for g, c in cur.fetchall():
        print(f"  {g}: {c:,}")

    cur.execute("SELECT family, COUNT(*) FROM plants GROUP BY family ORDER BY COUNT(*) DESC LIMIT 20")
    print("\nTop 20 Families:")
    for fam, c in cur.fetchall():
        print(f"  {fam}: {c:,}")

    conn.close()
    print(f"\nWrote {db_path}")
    print("(JSON skipped — dataset too large, use CSV or SQLite)")


if __name__ == "__main__":
    main()
