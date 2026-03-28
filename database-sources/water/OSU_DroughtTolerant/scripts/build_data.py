"""
Build OSU Extension drought-tolerant landscape plants dataset.

Source: Oregon State University Extension
       "Top 5 Plants for Unirrigated Landscapes in Western Oregon"
URL: https://extension.oregonstate.edu/collection/top-5-plants-unirrigated-landscapes-western-oregon
Authors: Heather Stoven and Neil Bell (2024-2026)
Plants: 25 cultivars/species across 5 plant groups, all proven drought-tolerant
        in OSU unirrigated trials since 2000.
Region: Western Oregon
"""

import csv, json, os, sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

PLANTS = [
    # Ceanothus (California Lilac)
    {"scientific_name": "Ceanothus 'Victoria'", "common_name": "California Lilac", "group": "Ceanothus", "height": "10'", "spread": "10'", "flower_color": "Blue", "bloom": "Mid-May to early June", "notes": "Most commonly grown Ceanothus in Oregon"},
    {"scientific_name": "Ceanothus gloriosus", "common_name": "Point Reyes Ceanothus", "group": "Ceanothus", "height": "2'", "spread": "6+'", "flower_color": "Light blue", "bloom": "Mid- to late April", "notes": "Evergreen groundcover from coastal California"},
    {"scientific_name": "Ceanothus 'Blue Jeans'", "common_name": "California Lilac", "group": "Ceanothus", "height": "10'", "spread": "10'", "flower_color": "Blue/purple-blue", "bloom": "Early- to mid-April", "notes": "One of earliest to bloom"},
    {"scientific_name": "Ceanothus x delilianus 'Gloire de Versailles'", "common_name": "California Lilac", "group": "Ceanothus", "height": "6'", "spread": "10'", "flower_color": "Light blue", "bloom": "Mid-June through July", "notes": "Semi-evergreen; blooms much later than most"},
    {"scientific_name": "Ceanothus cuneatus", "common_name": "Buckbrush", "group": "Ceanothus", "height": "8'", "spread": "10'", "flower_color": "White or light blue", "bloom": "", "notes": "Most widely distributed Ceanothus in western US"},
    # Cistus (Rockrose)
    {"scientific_name": "Cistus 'Gordon Cooper'", "common_name": "Rockrose", "group": "Cistus", "height": "3'", "spread": "6'", "flower_color": "White with dark red blotches", "bloom": "Mid-May to mid-June", "notes": "Very vigorous, spreading; tall groundcover when massed"},
    {"scientific_name": "Cistus x obtusifolius", "common_name": "Rockrose", "group": "Cistus", "height": "3'", "spread": "5'", "flower_color": "White", "bloom": "Mid-May to mid-June", "notes": "Near-perfect dome of foliage"},
    {"scientific_name": "Cistus 'Snow Fire'", "common_name": "Rockrose", "group": "Cistus", "height": "5'", "spread": "8'", "flower_color": "White with red blotches", "bloom": "Mid-May through late June", "notes": "Excellent foliage; specimen or large-scale groundcover"},
    {"scientific_name": "Cistus x pulverulentus 'Sunset'", "common_name": "Rockrose", "group": "Cistus", "height": "2'", "spread": "4'", "flower_color": "Brilliant magenta", "bloom": "Late May to mid-July", "notes": "Flat, spreading groundcover; gray-green foliage"},
    {"scientific_name": "Cistus lasianthum 'Sandling'", "common_name": "Rockrose", "group": "Cistus", "height": "2'", "spread": "5'", "flower_color": "Yellow with red blotches", "bloom": "Mid-May to mid-June", "notes": "Mounding shrub; silvery foliage"},
    # Arctostaphylos (Manzanita)
    {"scientific_name": "Arctostaphylos uva-ursi 'Green Supreme'", "common_name": "Kinnikinnick", "group": "Arctostaphylos", "height": "8\"", "spread": "Several feet", "flower_color": "White to pale pink", "bloom": "Early spring", "notes": "Vigorous kinnikinnick selection; glossy green foliage"},
    {"scientific_name": "Arctostaphylos nummularia (Select Form)", "common_name": "Fort Bragg Manzanita", "group": "Arctostaphylos", "height": "2'", "spread": "4-5'", "flower_color": "White", "bloom": "Late winter", "notes": "Dense, mounded; glossy rounded leaves; reddish branches"},
    {"scientific_name": "Arctostaphylos hookeri 'Wayside'", "common_name": "Monterey Manzanita", "group": "Arctostaphylos", "height": "4-5'", "spread": "8-10'", "flower_color": "White with pink edges", "bloom": "March", "notes": "Dense evergreen; glossy green foliage"},
    {"scientific_name": "Arctostaphylos columbiana", "common_name": "Hairy Manzanita", "group": "Arctostaphylos", "height": "up to 30'", "spread": "", "flower_color": "White or pink", "bloom": "March", "notes": "Widely distributed in W. Oregon; mahogany bark"},
    {"scientific_name": "Arctostaphylos 'Sentinel'", "common_name": "Manzanita", "group": "Arctostaphylos", "height": "8'", "spread": "8'", "flower_color": "Pink", "bloom": "Late Dec to Feb", "notes": "Heavy bloomer; mid-winter forage for hummingbirds and bumblebees"},
    # Grevillea (Spider Flower)
    {"scientific_name": "Grevillea australis", "common_name": "Spider Flower", "group": "Grevillea", "height": "3.5'", "spread": "6'", "flower_color": "White", "bloom": "Late March to early April", "notes": "One of the hardiest; fragrant flowers"},
    {"scientific_name": "Grevillea juniperina 'Molonglo'", "common_name": "Spider Flower", "group": "Grevillea", "height": "2'", "spread": "6'", "flower_color": "Apricot-yellow", "bloom": "April through June", "notes": "Attracts hummingbirds and bumblebees"},
    {"scientific_name": "Grevillea 'Poorinda Leane'", "common_name": "Spider Flower", "group": "Grevillea", "height": "4.5'", "spread": "9'", "flower_color": "Orange", "bloom": "April to August", "notes": "Very long bloom period; highly attractive to hummingbirds"},
    {"scientific_name": "Grevillea victoriae", "common_name": "Spider Flower", "group": "Grevillea", "height": "8-9'", "spread": "8-9'", "flower_color": "Red to orange", "bloom": "December to April", "notes": "Winter blooms valuable for pollinators; needs protected site"},
    # Groundcovers
    {"scientific_name": "Artemisia alba", "common_name": "White Wormwood", "group": "Groundcovers", "height": "2'", "spread": "5'", "flower_color": "Yellow-gray", "bloom": "Late summer", "notes": "Semi-evergreen; fine-textured groundcover"},
    {"scientific_name": "Baccharis pilularis 'Pistol Pancake'", "common_name": "Coyote Brush", "group": "Groundcovers", "height": "3'", "spread": "6.7'", "flower_color": "Cream to yellow", "bloom": "September-October", "notes": "Native Oregon Coast; late-season pollinator food"},
    {"scientific_name": "Cotoneaster glaucophyllus", "common_name": "Grayleaf Cotoneaster", "group": "Groundcovers", "height": "2.3'", "spread": "3.3'", "flower_color": "White", "bloom": "Spring", "notes": "Blue-grey foliage; red berries"},
    {"scientific_name": "Pseudodictamnus hirsutus", "common_name": "Hairy Sage", "group": "Groundcovers", "height": "2.75'", "spread": "5.5'", "flower_color": "Purple-white", "bloom": "July", "notes": "Woolly foliage; bumblebees love this plant"},
    {"scientific_name": "Phlomis italica", "common_name": "Jerusalem Sage", "group": "Groundcovers", "height": "", "spread": "", "flower_color": "Lavender", "bloom": "", "notes": "Balearic Islands native; gray-green foliage; whorled blooms"},
]

for p in PLANTS:
    p["drought_tolerance"] = "Excellent (OSU unirrigated trial)"
    p["region"] = "Western Oregon"


def main():
    print(f"Plants: {len(PLANTS)}")
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "group", "height", "spread",
              "flower_color", "bloom", "drought_tolerance", "region", "notes"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for p in PLANTS: w.writerow(p)
    print(f"Wrote {csv_path}")

    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"source": "OSU Extension - Top 5 Plants for Unirrigated Landscapes in Western Oregon",
                    "url": "https://extension.oregonstate.edu/collection/top-5-plants-unirrigated-landscapes-western-oregon",
                    "authors": "Heather Stoven and Neil Bell",
                    "methodology": "Unirrigated field trials at OSU since 2000",
                    "plants": PLANTS}, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path): os.remove(db_path)
    conn = sqlite3.connect(db_path); cur = conn.cursor()
    cur.execute("""CREATE TABLE plants (id INTEGER PRIMARY KEY AUTOINCREMENT,
        scientific_name TEXT, common_name TEXT, 'group' TEXT, height TEXT, spread TEXT,
        flower_color TEXT, bloom TEXT, drought_tolerance TEXT, region TEXT, notes TEXT)""")
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    for p in PLANTS:
        cur.execute("INSERT INTO plants (scientific_name, common_name, 'group', height, spread, flower_color, bloom, drought_tolerance, region, notes) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (p["scientific_name"], p["common_name"], p["group"], p["height"], p["spread"],
                     p["flower_color"], p["bloom"], p["drought_tolerance"], p["region"], p["notes"]))
    conn.commit(); conn.close()
    print(f"Wrote {db_path}")

if __name__ == "__main__":
    main()
