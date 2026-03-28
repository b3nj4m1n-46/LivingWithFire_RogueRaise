"""
Build WGA Top 50 Invasive Species in the West - plant species only.

Source: Western Governors' Association
URL: https://westgov.org/images/editor/WGA_Top_50_Invasive_Species_List_1.pdf
Date: December 2017
"""

import csv, json, os, sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

# Top 25 Terrestrial - PLANTS ONLY (excluding animals/diseases)
TERRESTRIAL_PLANTS = [
    {"rank": 1, "scientific_name": "Tamarix spp.", "common_name": "Salt Cedar (Tamarisk)"},
    {"rank": 2, "scientific_name": "Bromus tectorum", "common_name": "Cheatgrass"},
    {"rank": 3, "scientific_name": "Cirsium arvense", "common_name": "Canada Thistle"},
    {"rank": 4, "scientific_name": "Cardaria draba", "common_name": "Hoary Cress"},
    {"rank": 7, "scientific_name": "Elaeagnus angustifolia", "common_name": "Russian Olive"},
    {"rank": 8, "scientific_name": "Euphorbia esula", "common_name": "Leafy Spurge"},
    {"rank": 9, "scientific_name": "Sorghum halepense", "common_name": "Johnsongrass"},
    {"rank": 11, "scientific_name": "Arundo donax", "common_name": "Giant Reed"},
    {"rank": 12, "scientific_name": "Acroptilon repens", "common_name": "Russian Knapweed"},
    {"rank": 14, "scientific_name": "Lepidium latifolium", "common_name": "Perennial Pepperweed"},
    {"rank": 16, "scientific_name": "Centaurea solstitialis", "common_name": "Yellow Starthistle"},
    {"rank": 17, "scientific_name": "Polygonum spp.", "common_name": "Knotweeds"},
    {"rank": 18, "scientific_name": "Lespedeza cuneata", "common_name": "Sericea Lespedeza"},
    {"rank": 20, "scientific_name": "Lythrum salicaria", "common_name": "Purple Loosestrife"},
    {"rank": 21, "scientific_name": "Onopordum acanthium", "common_name": "Scotch Thistle"},
    {"rank": 22, "scientific_name": "Isatis tinctoria", "common_name": "Dyer's Woad"},
    {"rank": 23, "scientific_name": "Butomus umbellatus", "common_name": "Flowering Rush"},
    {"rank": 24, "scientific_name": "Phalaris arundinacea", "common_name": "Reed Canary-Grass"},
]

# Top 25 Aquatic - PLANTS ONLY (excluding animals/diseases/algae)
AQUATIC_PLANTS = [
    {"rank": 1, "scientific_name": "Myriophyllum spicatum", "common_name": "Eurasian Watermilfoil"},
    {"rank": 5, "scientific_name": "Potamogeton crispus", "common_name": "Curly-leaved Pondweed"},
    {"rank": 8, "scientific_name": "Lythrum salicaria", "common_name": "Purple Loosestrife"},
    {"rank": 9, "scientific_name": "Hydrilla verticillata", "common_name": "Hydrilla"},
    {"rank": 15, "scientific_name": "Egeria densa", "common_name": "Brazilian Elodea"},
    {"rank": 17, "scientific_name": "Salvinia molesta", "common_name": "Giant Salvinia"},
    {"rank": 23, "scientific_name": "Eichhornia crassipes", "common_name": "Water Hyacinth"},
    {"rank": 25, "scientific_name": "Phragmites australis", "common_name": "Common Reed"},
]

PLANTS = []
for p in TERRESTRIAL_PLANTS:
    PLANTS.append({**p, "category": "Terrestrial"})
for p in AQUATIC_PLANTS:
    PLANTS.append({**p, "category": "Aquatic"})


def main():
    print(f"Plants: {len(PLANTS)} ({len(TERRESTRIAL_PLANTS)} terrestrial, {len(AQUATIC_PLANTS)} aquatic)")

    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["rank", "scientific_name", "common_name", "category"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for p in PLANTS: w.writerow(p)
    print(f"Wrote {csv_path}")

    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"source": "Western Governors' Association - Top 50 Invasive Species in the West",
                    "url": "https://westgov.org/images/editor/WGA_Top_50_Invasive_Species_List_1.pdf",
                    "date": "December 2017",
                    "methodology": "Survey of invasive species coordinators in western states, weighted ranking",
                    "note": "Plant species only extracted (animals, diseases, algae excluded from original Top 50)",
                    "plants": PLANTS}, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path): os.remove(db_path)
    conn = sqlite3.connect(db_path); cur = conn.cursor()
    cur.execute("CREATE TABLE plants (rank INTEGER, scientific_name TEXT, common_name TEXT, category TEXT)")
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    for p in PLANTS:
        cur.execute("INSERT INTO plants VALUES (?,?,?,?)", (p["rank"], p["scientific_name"], p["common_name"], p["category"]))
    conn.commit(); conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
