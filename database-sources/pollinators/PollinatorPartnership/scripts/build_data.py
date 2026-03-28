"""
Build Pollinator Partnership Pacific Lowland guide dataset.

Source: Pollinator Partnership / NAPPC
Region: Pacific Lowland Mixed Forest Province (Oregon & Washington)
Data: Plants that attract pollinators with bloom period, color, height, sun, soil, pollinator types
"""

import csv, json, os, sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

# Extracted from pages 18-19 "Plants that attract pollinators" table
PLANTS = [
    # Trees & Shrubs
    {"scientific_name": "Acer spp.", "common_name": "Maple", "plant_type": "Tree/Shrub", "flower_color": "greenish white to red", "height_ft": "<30", "bloom": "March-June", "sun": "sun to partial shade", "soil": "moist, well drained", "pollinators": "bees", "host_plant": True},
    {"scientific_name": "Amelanchier alnifolia", "common_name": "Serviceberry", "plant_type": "Tree/Shrub", "flower_color": "white", "height_ft": "1-5", "bloom": "April-July", "sun": "sun to partial shade", "soil": "moist to dry", "pollinators": "bees, flies", "host_plant": True},
    {"scientific_name": "Arbutus menziesii", "common_name": "Madrone", "plant_type": "Tree/Shrub", "flower_color": "white", "height_ft": "6-30", "bloom": "April-May", "sun": "sun to partial shade", "soil": "dry", "pollinators": "bees", "host_plant": False},
    {"scientific_name": "Arctostaphylos spp.", "common_name": "Manzanita", "plant_type": "Tree/Shrub", "flower_color": "white", "height_ft": "0.1-4", "bloom": "April-July", "sun": "sun to partial shade", "soil": "dry, well drained", "pollinators": "hummingbirds", "host_plant": False},
    {"scientific_name": "Cornus nuttallii", "common_name": "Pacific Dogwood", "plant_type": "Tree/Shrub", "flower_color": "white", "height_ft": "1-30", "bloom": "April-June", "sun": "shade", "soil": "moist, well drained", "pollinators": "bees, beetles, flies, butterflies", "host_plant": False},
    {"scientific_name": "Ribes spp.", "common_name": "Currants/Gooseberries", "plant_type": "Tree/Shrub", "flower_color": "greenish white, pink, red", "height_ft": "1-3", "bloom": "March-June", "sun": "sun to shade", "soil": "moist to dry, well drained", "pollinators": "hummingbirds", "host_plant": False},
    {"scientific_name": "Sambucus spp.", "common_name": "Elderberry", "plant_type": "Tree/Shrub", "flower_color": "white to creamy", "height_ft": "1-6", "bloom": "May-July", "sun": "sun to partial shade", "soil": "moist to dry, well drained", "pollinators": "bees", "host_plant": False},
    {"scientific_name": "Symphoricarpos spp.", "common_name": "Snowberry", "plant_type": "Tree/Shrub", "flower_color": "pink", "height_ft": "0.5-2", "bloom": "May-August", "sun": "sun to shade", "soil": "moist, well drained", "pollinators": "bees", "host_plant": True},
    {"scientific_name": "Vaccinium spp.", "common_name": "Huckleberry", "plant_type": "Tree/Shrub", "flower_color": "pink", "height_ft": "0.1-3", "bloom": "April-August", "sun": "sun to partial shade", "soil": "moist to dry, well drained", "pollinators": "bees", "host_plant": False},
    # Perennial Flowers
    {"scientific_name": "Achillea millefolium", "common_name": "Yarrow", "plant_type": "Perennial", "flower_color": "white", "height_ft": "0.2-1", "bloom": "April-October", "sun": "sun to partial shade", "soil": "dry", "pollinators": "bees", "host_plant": True},
    {"scientific_name": "Aquilegia formosa", "common_name": "Cascade Columbine", "plant_type": "Perennial", "flower_color": "red, yellow", "height_ft": "0.2-1", "bloom": "April-August", "sun": "partial shade to shade", "soil": "moist to dry", "pollinators": "hummingbirds", "host_plant": False},
    {"scientific_name": "Aster spp.", "common_name": "Daisy", "plant_type": "Perennial", "flower_color": "white, purple", "height_ft": "0.1-1", "bloom": "June-October", "sun": "sun to partial shade", "soil": "dry to moist", "pollinators": "bees, butterflies", "host_plant": True},
    {"scientific_name": "Delphinium spp.", "common_name": "Larkspur", "plant_type": "Perennial", "flower_color": "white, blue, purple", "height_ft": "0.3-2", "bloom": "May-August", "sun": "sun to partial shade", "soil": "moist, well drained", "pollinators": "hummingbirds, bees", "host_plant": False},
    {"scientific_name": "Erigeron spp.", "common_name": "Fleabane", "plant_type": "Perennial", "flower_color": "white, purple", "height_ft": "0.1-0.6", "bloom": "May-September", "sun": "sun", "soil": "dry, well drained", "pollinators": "bees, butterflies", "host_plant": False},
    {"scientific_name": "Eriogonum spp.", "common_name": "Buckwheat", "plant_type": "Perennial", "flower_color": "white, yellow", "height_ft": "0.1-0.5", "bloom": "May-September", "sun": "sun", "soil": "dry, well drained", "pollinators": "bees, butterflies", "host_plant": True},
    {"scientific_name": "Erythronium spp.", "common_name": "Fawnlily", "plant_type": "Perennial", "flower_color": "white, pink, yellow", "height_ft": "0.1-0.3", "bloom": "March-August", "sun": "sun to shade", "soil": "", "pollinators": "bees", "host_plant": False},
    {"scientific_name": "Eschscholzia californica", "common_name": "California Poppy", "plant_type": "Perennial", "flower_color": "yellow to orange", "height_ft": "0.1-0.5", "bloom": "May-September", "sun": "sun", "soil": "dry, well drained", "pollinators": "bees", "host_plant": False},
    {"scientific_name": "Hydrophyllum spp.", "common_name": "Waterleaf", "plant_type": "Perennial", "flower_color": "white, blue, purple", "height_ft": "0.2-0.8", "bloom": "April-July", "sun": "sun to shade", "soil": "moist", "pollinators": "bees", "host_plant": False},
    {"scientific_name": "Iris spp.", "common_name": "Iris", "plant_type": "Perennial", "flower_color": "white, yellow to purple", "height_ft": "0.1-0.4", "bloom": "April-July", "sun": "sun to partial shade", "soil": "", "pollinators": "bees", "host_plant": False},
    {"scientific_name": "Lilium spp.", "common_name": "Lily", "plant_type": "Perennial", "flower_color": "white to pinkish, orange", "height_ft": "0.2-1", "bloom": "June-July", "sun": "sun to partial shade", "soil": "moist", "pollinators": "hummingbirds", "host_plant": False},
    {"scientific_name": "Lupinus spp.", "common_name": "Lupine", "plant_type": "Perennial", "flower_color": "blue to purple", "height_ft": "0.1-1", "bloom": "April-August", "sun": "sun to partial shade", "soil": "dry to moist", "pollinators": "bees", "host_plant": True},
    {"scientific_name": "Mentha arvensis", "common_name": "Mint", "plant_type": "Perennial", "flower_color": "white to pink or purple", "height_ft": "0.2-0.8", "bloom": "July-September", "sun": "sun to partial shade", "soil": "moist", "pollinators": "bees", "host_plant": False},
    {"scientific_name": "Penstemon spp.", "common_name": "Penstemon", "plant_type": "Perennial", "flower_color": "white to purple or red", "height_ft": "0.1-0.6", "bloom": "May-August", "sun": "sun to partial shade", "soil": "dry, well drained", "pollinators": "bees", "host_plant": True},
    {"scientific_name": "Phacelia spp.", "common_name": "Scorpion Weed", "plant_type": "Perennial", "flower_color": "white", "height_ft": "0.2-1", "bloom": "May-August", "sun": "sun", "soil": "dry, well drained", "pollinators": "bees", "host_plant": False},
    {"scientific_name": "Sedum spp.", "common_name": "Stonecrop", "plant_type": "Perennial", "flower_color": "white, pink, yellow", "height_ft": "0.1-0.3", "bloom": "May-August", "sun": "sun", "soil": "dry, well drained", "pollinators": "bees", "host_plant": True},
    {"scientific_name": "Solidago spp.", "common_name": "Goldenrod", "plant_type": "Perennial", "flower_color": "yellow", "height_ft": "0.3-2", "bloom": "July-October", "sun": "sun to partial shade", "soil": "moist", "pollinators": "bees, butterflies, beetles, wasps", "host_plant": True},
    {"scientific_name": "Trillium spp.", "common_name": "Trillium", "plant_type": "Perennial", "flower_color": "white to purple", "height_ft": "0.1-0.3", "bloom": "March-June", "sun": "partial shade to shade", "soil": "", "pollinators": "beetles, flies, bees", "host_plant": False},
    # Vines
    {"scientific_name": "Lonicera hispidula", "common_name": "Hairy Honeysuckle", "plant_type": "Vine", "flower_color": "pink, yellowish pink", "height_ft": "<6", "bloom": "June-August", "sun": "partial shade to shade", "soil": "dry to moist", "pollinators": "hummingbirds", "host_plant": False},
]


def main():
    print(f"Plants: {len(PLANTS)}")

    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "plant_type", "flower_color", "height_ft",
              "bloom", "sun", "soil", "pollinators", "host_plant"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for p in PLANTS: w.writerow(p)
    print(f"Wrote {csv_path}")

    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Pollinator Partnership - Pacific Lowland Mixed Forest Province Guide",
            "url": "https://www.pollinator.org/guides",
            "region": "Pacific Lowland Mixed Forest Province (Oregon & Washington)",
            "note": "Plants that attract pollinators with bloom period, color, height, sun, soil, and pollinator types. Host plants for caterpillars/larvae flagged.",
            "plants": PLANTS,
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path): os.remove(db_path)
    conn = sqlite3.connect(db_path); cur = conn.cursor()
    cur.execute("""CREATE TABLE plants (id INTEGER PRIMARY KEY AUTOINCREMENT,
        scientific_name TEXT, common_name TEXT, plant_type TEXT, flower_color TEXT,
        height_ft TEXT, bloom TEXT, sun TEXT, soil TEXT, pollinators TEXT, host_plant BOOLEAN)""")
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    for p in PLANTS:
        cur.execute("INSERT INTO plants (scientific_name, common_name, plant_type, flower_color, height_ft, bloom, sun, soil, pollinators, host_plant) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (p["scientific_name"], p["common_name"], p["plant_type"], p["flower_color"],
                     p["height_ft"], p["bloom"], p["sun"], p["soil"], p["pollinators"], p["host_plant"]))
    conn.commit(); conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
