import csv, json, os, sqlite3, re, sys
sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
source = os.path.join(DATA_DIR, "Sources", "cal-ipc-inventory.csv")

with open(source, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    headers = [h for h in reader.fieldnames if h]
    plants = []
    for row in reader:
        sci = row.get("Latin binomial", "").strip().strip('"')
        rating = row.get("Rating", "").strip()
        if sci and rating:
            clean = {}
            for k in headers:
                v = row.get(k, "")
                clean[k] = re.sub(r"<[^>]+>", "", v.strip()) if v else ""
            plants.append(clean)

print(f"Plants: {len(plants)}, Columns: {len(headers)}")

# Full CSV
csv_full = os.path.join(DATA_DIR, "plants_full.csv")
with open(csv_full, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
    w.writeheader()
    for p in plants:
        w.writerow(p)
print(f"Wrote {csv_full}")

# Key columns CSV
key_cols = ["Latin binomial", "Common Names", "Rating", "Alert",
            "Impact Score", "Invasiveness Score", "Distribution Score",
            "Documentation Score", "CDFA Rating"]
csv_key = os.path.join(DATA_DIR, "plants.csv")
with open(csv_key, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=key_cols, extrasaction="ignore")
    w.writeheader()
    for p in plants:
        w.writerow(p)
print(f"Wrote {csv_key}")

# JSON
json_path = os.path.join(DATA_DIR, "plants.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump({
        "source": "California Invasive Plant Council (Cal-IPC) Inventory",
        "url": "https://www.cal-ipc.org/plants/inventory/",
        "ratings": {
            "High": "Severe ecological impacts; widespread or likely to become so",
            "Moderate": "Substantial ecological impacts; widespread or increasing",
            "Limited": "Minor ecological impacts; limited distribution",
            "Watch": "Not yet invasive but high risk",
        },
        "total_columns": len(headers),
        "plants": plants,
    }, f, indent=2, ensure_ascii=False)
print(f"Wrote {json_path}")

# SQLite
db_path = os.path.join(DATA_DIR, "plants.db")
if os.path.exists(db_path):
    os.remove(db_path)
conn = sqlite3.connect(db_path)
cur = conn.cursor()

safe = []
for h in headers:
    s = re.sub(r"[^a-zA-Z0-9_]", "_", h)
    safe.append(s)

col_defs = ", ".join(f'"{s}" TEXT' for s in safe)
cur.execute(f"CREATE TABLE plants (id INTEGER PRIMARY KEY AUTOINCREMENT, {col_defs})")
cur.execute('CREATE INDEX idx_sci ON plants("Latin_binomial")')
cur.execute('CREATE INDEX idx_rating ON plants("Rating")')

col_names = ", ".join(f'"{s}"' for s in safe)
placeholders = ", ".join(["?"] * len(safe))
for p in plants:
    vals = [p.get(h, "") for h in headers]
    cur.execute(f"INSERT INTO plants ({col_names}) VALUES ({placeholders})", vals)

conn.commit()

cur.execute('SELECT "Rating", COUNT(*) FROM plants GROUP BY "Rating" ORDER BY COUNT(*) DESC')
print("\nRating distribution:")
for r, c in cur.fetchall():
    print(f"  {r}: {c}")

conn.close()
print(f"Wrote {db_path}")
