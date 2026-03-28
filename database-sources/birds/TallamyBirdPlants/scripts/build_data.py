"""
Build bird-supporting plant dataset based on Doug Tallamy's research.

Source: Doug Tallamy, University of Delaware
        "20 Most Valuable Native Plant Genera for Biodiversity" (2018)
        + NWF Native Plant Finder methodology

The connection: 96% of terrestrial bird species feed caterpillars to
their nestlings. Plants that host more Lepidoptera (butterfly/moth)
caterpillar species support more bird species. This is the primary
mechanism by which native plants support birds.

Tallamy's research ranks plant GENERA by the number of Lepidoptera
species whose caterpillars feed on them — directly predicting bird value.
"""

import csv, json, os, sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

# From Tallamy 2018 PDF + expanded data from his publications
WOODY_PLANTS = [
    {"genus": "Quercus", "common_name": "Oak", "lepidoptera_species": 557, "type": "Woody"},
    {"genus": "Prunus", "common_name": "Black Cherry", "lepidoptera_species": 456, "type": "Woody"},
    {"genus": "Salix", "common_name": "Willow", "lepidoptera_species": 455, "type": "Woody"},
    {"genus": "Betula", "common_name": "Birch", "lepidoptera_species": 413, "type": "Woody"},
    {"genus": "Populus", "common_name": "Poplar", "lepidoptera_species": 368, "type": "Woody"},
    {"genus": "Malus", "common_name": "Crabapple", "lepidoptera_species": 311, "type": "Woody"},
    {"genus": "Acer", "common_name": "Maple", "lepidoptera_species": 297, "type": "Woody"},
    {"genus": "Vaccinium", "common_name": "Blueberry", "lepidoptera_species": 288, "type": "Woody"},
    {"genus": "Alnus", "common_name": "Alder", "lepidoptera_species": 255, "type": "Woody"},
    {"genus": "Carya", "common_name": "Hickory", "lepidoptera_species": 235, "type": "Woody"},
    {"genus": "Ulmus", "common_name": "Elm", "lepidoptera_species": 215, "type": "Woody"},
    {"genus": "Pinus", "common_name": "Pine", "lepidoptera_species": 203, "type": "Woody"},
    {"genus": "Crataegus", "common_name": "Hawthorn", "lepidoptera_species": 168, "type": "Woody"},
    {"genus": "Picea", "common_name": "Spruce", "lepidoptera_species": 156, "type": "Woody"},
    {"genus": "Tilia", "common_name": "Basswood", "lepidoptera_species": 150, "type": "Woody"},
    {"genus": "Fraxinus", "common_name": "Ash", "lepidoptera_species": 150, "type": "Woody"},
    {"genus": "Rosa", "common_name": "Rose", "lepidoptera_species": 139, "type": "Woody"},
    {"genus": "Corylus", "common_name": "Filbert", "lepidoptera_species": 131, "type": "Woody"},
    {"genus": "Juglans", "common_name": "Walnut", "lepidoptera_species": 130, "type": "Woody"},
    {"genus": "Fagus", "common_name": "Beech", "lepidoptera_species": 127, "type": "Woody"},
    {"genus": "Castanea", "common_name": "Chestnut", "lepidoptera_species": 127, "type": "Woody"},
]

PERENNIALS = [
    {"genus": "Solidago", "common_name": "Goldenrod", "lepidoptera_species": 104, "type": "Perennial"},
    {"genus": "Fragaria", "common_name": "Strawberry", "lepidoptera_species": 67, "type": "Perennial"},
    {"genus": "Helianthus", "common_name": "Sunflower", "lepidoptera_species": 56, "type": "Perennial"},
    {"genus": "Eupatorium", "common_name": "Joe Pye / Boneset", "lepidoptera_species": 31, "type": "Perennial"},
    {"genus": "Viola", "common_name": "Violet", "lepidoptera_species": 28, "type": "Perennial"},
    {"genus": "Panicum", "common_name": "Switchgrass", "lepidoptera_species": 25, "type": "Perennial"},
    {"genus": "Geranium", "common_name": "Geranium", "lepidoptera_species": 25, "type": "Perennial"},
    {"genus": "Hibiscus", "common_name": "Rosemallow", "lepidoptera_species": 25, "type": "Perennial"},
    {"genus": "Lupinus", "common_name": "Lupine", "lepidoptera_species": 24, "type": "Perennial"},
    {"genus": "Sium", "common_name": "Water Parsnip", "lepidoptera_species": 21, "type": "Perennial"},
    {"genus": "Erigeron", "common_name": "Fleabane", "lepidoptera_species": 19, "type": "Perennial"},
    {"genus": "Baptisia", "common_name": "Wild Indigo", "lepidoptera_species": 19, "type": "Perennial"},
    {"genus": "Vernonia", "common_name": "Ironweed", "lepidoptera_species": 19, "type": "Perennial"},
    {"genus": "Rudbeckia", "common_name": "Black-eyed Susan", "lepidoptera_species": 18, "type": "Perennial"},
    {"genus": "Verbesina", "common_name": "Wingstem", "lepidoptera_species": 15, "type": "Perennial"},
    {"genus": "Oenothera", "common_name": "Evening Primrose", "lepidoptera_species": 15, "type": "Perennial"},
    {"genus": "Thalictrum", "common_name": "Meadow Rue", "lepidoptera_species": 15, "type": "Perennial"},
    {"genus": "Andropogon", "common_name": "Bluestem", "lepidoptera_species": 14, "type": "Perennial"},
    {"genus": "Apocynum", "common_name": "Dogbane", "lepidoptera_species": 14, "type": "Perennial"},
    {"genus": "Asclepias", "common_name": "Milkweed", "lepidoptera_species": 12, "type": "Perennial"},
    {"genus": "Aquilegia", "common_name": "Columbine", "lepidoptera_species": 11, "type": "Perennial"},
]

PLANTS = WOODY_PLANTS + PERENNIALS

# Add bird value tier based on lepidoptera count
for p in PLANTS:
    count = p["lepidoptera_species"]
    if count >= 200:
        p["bird_value"] = "Exceptional"
    elif count >= 100:
        p["bird_value"] = "Very High"
    elif count >= 50:
        p["bird_value"] = "High"
    elif count >= 20:
        p["bird_value"] = "Moderate"
    else:
        p["bird_value"] = "Good"
    p["region"] = "Mid-Atlantic (applicable nationwide for genera)"


def main():
    print(f"Plants: {len(PLANTS)} genera ({len(WOODY_PLANTS)} woody, {len(PERENNIALS)} perennial)")

    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["genus", "common_name", "type", "lepidoptera_species", "bird_value", "region"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for p in PLANTS: w.writerow(p)
    print(f"Wrote {csv_path}")

    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Doug Tallamy, University of Delaware - 20 Most Valuable Native Plant Genera (2018)",
            "url": "https://canr.udel.edu/wp-content/uploads/sites/16/2018/10/30121131/20-Most-Valuable-for-Biodiversity.pdf",
            "methodology": "Number of Lepidoptera (butterfly/moth) species whose caterpillars feed on the given plant genus. 96% of terrestrial birds feed caterpillars to nestlings, so Lepidoptera count directly predicts bird food value.",
            "bird_value_tiers": {
                "Exceptional": "200+ Lepidoptera species",
                "Very High": "100-199 Lepidoptera species",
                "High": "50-99 Lepidoptera species",
                "Moderate": "20-49 Lepidoptera species",
                "Good": "10-19 Lepidoptera species",
            },
            "plants": PLANTS,
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path): os.remove(db_path)
    conn = sqlite3.connect(db_path); cur = conn.cursor()
    cur.execute("""CREATE TABLE plants (
        genus TEXT PRIMARY KEY, common_name TEXT, type TEXT,
        lepidoptera_species INTEGER, bird_value TEXT, region TEXT)""")
    for p in PLANTS:
        cur.execute("INSERT INTO plants VALUES (?,?,?,?,?,?)",
                    (p["genus"], p["common_name"], p["type"],
                     p["lepidoptera_species"], p["bird_value"], p["region"]))
    conn.commit(); conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
