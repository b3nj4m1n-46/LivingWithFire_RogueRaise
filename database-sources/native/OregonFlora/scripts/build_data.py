"""
Build Oregon Flora dataset from supplement CSVs.

Source: Oregon Flora Project, Oregon State University
URL: https://oregonflora.org/pages/flora-of-oregon.php
Data: 355 accepted taxa (supplements to printed Flora) + 59 taxonomic changes
Note: The main Flora of Oregon covers ~4,380 taxa in Volumes 1 & 2.
      These CSVs are supplements — the full checklist is not available for download.
"""

import csv, json, os, sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)


def main():
    # Read AcceptedTaxa
    taxa = []
    with open(os.path.join(DATA_DIR, "Sources", "AcceptedTaxa_NotTreatedInFlora.csv"),
              "r", encoding="latin-1") as f:
        for row in csv.DictReader(f):
            taxa.append({
                "scientific_name": row.get("taxon", "").strip(),
                "family": row.get("Family", "").strip(),
                "group": row.get("Group", "").strip(),
                "origin": row.get("Origin", "").strip(),
                "comments": row.get("Published_Comments", "").strip(),
                "source": "AcceptedTaxa_NotTreatedInFlora",
            })

    # Read Changes
    changes = []
    with open(os.path.join(DATA_DIR, "Sources", "Flora_ChangeSincePublication.csv"),
              "r", encoding="latin-1") as f:
        for row in csv.DictReader(f):
            changes.append({
                "scientific_name": row.get("scientific_name", "").strip(),
                "family": row.get("Family", "").strip(),
                "group": row.get("Group", "").strip(),
                "was_status": row.get("Was", "").strip(),
                "now_status": row.get("Now", "").strip(),
                "flora_page": row.get("FloraOfOregonPage", "").strip(),
                "source": "Flora_ChangeSincePublication",
            })

    print(f"Accepted taxa (supplements): {len(taxa)}")
    print(f"Taxonomic changes: {len(changes)}")

    # Combined plants CSV (taxa only — changes are status updates, not new plants)
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "family", "group", "origin", "comments", "source"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for t in taxa:
            w.writerow(t)
    print(f"Wrote {csv_path} ({len(taxa)} taxa)")

    # Changes CSV
    changes_path = os.path.join(DATA_DIR, "taxonomic_changes.csv")
    cfields = ["scientific_name", "family", "group", "was_status", "now_status", "flora_page", "source"]
    with open(changes_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cfields)
        w.writeheader()
        for c in changes:
            w.writerow(c)
    print(f"Wrote {changes_path} ({len(changes)} changes)")

    # JSON
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Oregon Flora Project, Oregon State University",
            "url": "https://oregonflora.org/pages/flora-of-oregon.php",
            "note": "Supplement to Flora of Oregon Volumes 1 & 2. The main Flora covers ~4,380 taxa but is not available as a downloadable dataset.",
            "accepted_taxa": taxa,
            "taxonomic_changes": changes,
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # SQLite
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""CREATE TABLE accepted_taxa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scientific_name TEXT, family TEXT, 'group' TEXT, origin TEXT, comments TEXT)""")
    cur.execute("CREATE INDEX idx_sci ON accepted_taxa(scientific_name)")
    for t in taxa:
        cur.execute("INSERT INTO accepted_taxa (scientific_name, family, 'group', origin, comments) VALUES (?,?,?,?,?)",
                    (t["scientific_name"], t["family"], t["group"], t["origin"], t["comments"]))

    cur.execute("""CREATE TABLE taxonomic_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scientific_name TEXT, family TEXT, 'group' TEXT,
        was_status TEXT, now_status TEXT, flora_page TEXT)""")
    for c in changes:
        cur.execute("INSERT INTO taxonomic_changes (scientific_name, family, 'group', was_status, now_status, flora_page) VALUES (?,?,?,?,?,?)",
                    (c["scientific_name"], c["family"], c["group"], c["was_status"], c["now_status"], c["flora_page"]))

    conn.commit()

    cur.execute("SELECT origin, COUNT(*) FROM accepted_taxa GROUP BY origin ORDER BY COUNT(*) DESC")
    print("\nOrigin Distribution:")
    for o, c in cur.fetchall():
        print(f"  {o}: {c}")

    conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
