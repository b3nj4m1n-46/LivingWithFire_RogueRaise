"""
Build USDA National Invasive Species Information Center - Terrestrial Plants dataset.

Source: USDA National Invasive Species Information Center
URL: https://www.invasivespeciesinfo.gov/terrestrial/plants
Plants: 30 key terrestrial invasive species
"""

import csv, json, os, sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

PLANTS = [
    {"scientific_name": "Dioscorea bulbifera", "common_name": "Air Potato"},
    {"scientific_name": "Elaeagnus umbellata", "common_name": "Autumn Olive"},
    {"scientific_name": "Vitex rotundifolia", "common_name": "Beach Vitex"},
    {"scientific_name": "Schinus terebinthifolius", "common_name": "Brazilian Peppertree"},
    {"scientific_name": "Inula britannica", "common_name": "British Yellowhead"},
    {"scientific_name": "Pyrus calleryana", "common_name": "Callery Pear"},
    {"scientific_name": "Cirsium arvense", "common_name": "Canada Thistle"},
    {"scientific_name": "Ligustrum sinense", "common_name": "Chinese Privet"},
    {"scientific_name": "Triadica sebifera", "common_name": "Chinese Tallow"},
    {"scientific_name": "Imperata cylindrica", "common_name": "Cogongrass"},
    {"scientific_name": "Rhamnus cathartica", "common_name": "Common Buckthorn"},
    {"scientific_name": "Dipsacus fullonum", "common_name": "Common Teasel"},
    {"scientific_name": "Linaria dalmatica", "common_name": "Dalmatian Toadflax"},
    {"scientific_name": "Centaurea diffusa", "common_name": "Diffuse Knapweed"},
    {"scientific_name": "Bromus tectorum", "common_name": "Downy Brome"},
    {"scientific_name": "Hedera spp.", "common_name": "English Ivy"},
    {"scientific_name": "Ficaria verna", "common_name": "Fig Buttercup"},
    {"scientific_name": "Alliaria petiolata", "common_name": "Garlic Mustard"},
    {"scientific_name": "Heracleum mantegazzianum", "common_name": "Giant Hogweed"},
    {"scientific_name": "Phyllostachys aurea", "common_name": "Golden Bamboo"},
    {"scientific_name": "Lepidium appelianum", "common_name": "Hairy Whitetop"},
    {"scientific_name": "Cynoglossum officinale", "common_name": "Houndstongue"},
    {"scientific_name": "Berberis thunbergii", "common_name": "Japanese Barberry"},
    {"scientific_name": "Lygodium japonicum", "common_name": "Japanese Climbing Fern"},
    {"scientific_name": "Lonicera japonica", "common_name": "Japanese Honeysuckle"},
    {"scientific_name": "Fallopia japonica", "common_name": "Japanese Knotweed"},
    {"scientific_name": "Spiraea japonica", "common_name": "Japanese Spiraea"},
    {"scientific_name": "Microstegium vimineum", "common_name": "Japanese Stiltgrass"},
    {"scientific_name": "Sorghum halepense", "common_name": "Johnsongrass"},
    {"scientific_name": "Pueraria montana var. lobata", "common_name": "Kudzu"},
]


def main():
    print(f"Plants: {len(PLANTS)}")
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "invasive_status"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for p in PLANTS: w.writerow({**p, "invasive_status": "USDA Listed Invasive"})
    print(f"Wrote {csv_path}")

    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"source": "USDA National Invasive Species Information Center",
                    "url": "https://www.invasivespeciesinfo.gov/terrestrial/plants",
                    "plants": [{**p, "invasive_status": "USDA Listed Invasive"} for p in PLANTS]},
                  f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path): os.remove(db_path)
    conn = sqlite3.connect(db_path); cur = conn.cursor()
    cur.execute("CREATE TABLE plants (id INTEGER PRIMARY KEY AUTOINCREMENT, scientific_name TEXT, common_name TEXT, invasive_status TEXT)")
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    for p in PLANTS:
        cur.execute("INSERT INTO plants (scientific_name, common_name, invasive_status) VALUES (?,?,?)",
                    (p["scientific_name"], p["common_name"], "USDA Listed Invasive"))
    conn.commit(); conn.close()
    print(f"Wrote {db_path}")

if __name__ == "__main__":
    main()
