"""
Native Trees & Shrubs for Pollinators - Heather Holm poster data.

Extracted visually from treesshrubs1.pdf poster chart.
Source: Heather Holm / pollinatorsnativeplants.com
"""

import csv, json, os, sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

PLANTS = [
    # CANOPY TREES
    {"scientific_name": "Acer rubrum", "common_name": "Red Maple", "type": "Canopy Tree", "color": "red/yellow", "moisture": "m", "height": "to 95 ft", "bloom": "Apr", "pollinators": "butterflies", "wasps": True, "bees": True, "other": "sawflies"},
    {"scientific_name": "Acer saccharum", "common_name": "Sugar Maple", "type": "Canopy Tree", "color": "yellow", "moisture": "m", "height": "to 100 ft", "bloom": "Apr-May", "pollinators": "butterflies", "wasps": True, "bees": True, "other": "sawflies"},
    {"scientific_name": "Aesculus glabra", "common_name": "Ohio Buckeye", "type": "Canopy Tree", "color": "yellow", "moisture": "m", "height": "to 35 ft", "bloom": "May", "pollinators": "", "wasps": False, "bees": True, "other": "hummingbirds"},
    {"scientific_name": "Gleditsia triacanthos", "common_name": "Honey Locust", "type": "Canopy Tree", "color": "yellow", "moisture": "m, d", "height": "to 45 ft", "bloom": "May-Jun", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Gymnocladus dioicus", "common_name": "Kentucky Coffeetree", "type": "Canopy Tree", "color": "white", "moisture": "w, m", "height": "to 75 ft", "bloom": "May-Jun", "pollinators": "butterflies", "wasps": True, "bees": True, "other": "hummingbirds"},
    {"scientific_name": "Prunus serotina", "common_name": "Black Cherry", "type": "Canopy Tree", "color": "white", "moisture": "m, d", "height": "to 100 ft", "bloom": "May", "pollinators": "butterflies", "wasps": True, "bees": True, "other": "ants"},
    {"scientific_name": "Tilia americana", "common_name": "American Basswood", "type": "Canopy Tree", "color": "white", "moisture": "m", "height": "to 95 ft", "bloom": "Jun-Jul", "pollinators": "moths", "wasps": True, "bees": True, "other": "sawflies"},
    # TALL TREES
    {"scientific_name": "Amelanchier spp.", "common_name": "Serviceberries", "type": "Tall Tree", "color": "white", "moisture": "w, m, d", "height": "10-25 ft", "bloom": "Apr-May", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Amorpha fruticosa", "common_name": "False Indigo", "type": "Tall Tree", "color": "purple", "moisture": "m", "height": "12 ft", "bloom": "Jun", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Cercis canadensis", "common_name": "Eastern Redbud", "type": "Tall Tree", "color": "pink", "moisture": "m", "height": "to 25 ft", "bloom": "Apr-May", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Cornus alternifolia", "common_name": "Pagoda Dogwood", "type": "Tall Tree", "color": "white", "moisture": "m", "height": "to 25 ft", "bloom": "May-Jun", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Cornus rugosa", "common_name": "Round-Leaved Dogwood", "type": "Tall Tree", "color": "white", "moisture": "m, d", "height": "5-18 ft", "bloom": "Jun", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Crataegus crus-galli", "common_name": "Cockspur Hawthorn", "type": "Tall Tree", "color": "white", "moisture": "m", "height": "to 25 ft", "bloom": "May-Jun", "pollinators": "butterflies", "wasps": True, "bees": True, "other": ""},
    # SHRUBS
    {"scientific_name": "Ceanothus americanus", "common_name": "New Jersey Tea", "type": "Shrub", "color": "white", "moisture": "m, d", "height": "2-6 ft", "bloom": "Jun-Jul", "pollinators": "butterflies", "wasps": True, "bees": True, "other": "sawflies"},
    {"scientific_name": "Cephalanthus occidentalis", "common_name": "Buttonbush", "type": "Shrub", "color": "white", "moisture": "w, m", "height": "5-15 ft", "bloom": "Jul-Aug", "pollinators": "butterflies", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Cornus amomum", "common_name": "Silky Dogwood", "type": "Shrub", "color": "white", "moisture": "w", "height": "10-15 ft", "bloom": "May-Jun", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Cornus racemosa", "common_name": "Gray Dogwood", "type": "Shrub", "color": "white", "moisture": "m, d", "height": "10-18 ft", "bloom": "May-Jun", "pollinators": "butterflies", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Cornus sericea", "common_name": "Red Osier Dogwood", "type": "Shrub", "color": "white", "moisture": "w, m", "height": "6-15 ft", "bloom": "May-Jun", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Diervilla lonicera", "common_name": "Dwarf Bush Honeysuckle", "type": "Shrub", "color": "yellow", "moisture": "m, d", "height": "2-4 ft", "bloom": "Jun-Jul", "pollinators": "moths", "wasps": False, "bees": True, "other": ""},
    {"scientific_name": "Ilex verticillata", "common_name": "Winterberry", "type": "Shrub", "color": "white", "moisture": "w, m", "height": "6-15 ft", "bloom": "Jun", "pollinators": "", "wasps": False, "bees": True, "other": "butterflies"},
    {"scientific_name": "Physocarpus opulifolius", "common_name": "Ninebark", "type": "Shrub", "color": "white", "moisture": "m, d", "height": "5-10 ft", "bloom": "Jun", "pollinators": "butterflies", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Ribes spp.", "common_name": "Currant/Gooseberry", "type": "Shrub", "color": "wh/yell", "moisture": "w, m, d", "height": "2-10 ft", "bloom": "Apr-May", "pollinators": "both", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Rosa arkansana", "common_name": "Prairie Wild Rose", "type": "Shrub", "color": "pink", "moisture": "m, d", "height": "1-3 ft", "bloom": "Jun-Jul", "pollinators": "", "wasps": False, "bees": True, "other": ""},
    {"scientific_name": "Rosa blanda", "common_name": "Smooth Wild Rose", "type": "Shrub", "color": "pink", "moisture": "m, d", "height": "3-5 ft", "bloom": "Jun", "pollinators": "", "wasps": False, "bees": True, "other": ""},
    {"scientific_name": "Spiraea alba", "common_name": "Meadowsweet", "type": "Shrub", "color": "white", "moisture": "w", "height": "3-7 ft", "bloom": "Jul-Aug", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Spiraea tomentosa", "common_name": "Hardhack", "type": "Shrub", "color": "pink", "moisture": "w", "height": "3-6 ft", "bloom": "Jul-Aug", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Symphoricarpos albus", "common_name": "Snowberry", "type": "Shrub", "color": "white/pink", "moisture": "m, d", "height": "3-6 ft", "bloom": "Jun-Jul", "pollinators": "both", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Symphoricarpos occidentalis", "common_name": "Wolfberry", "type": "Shrub", "color": "white/pink", "moisture": "m, d", "height": "3-6 ft", "bloom": "Jun-Jul", "pollinators": "", "wasps": True, "bees": True, "other": ""},
    {"scientific_name": "Viburnum rafinesquianum", "common_name": "Downy Arrowwood Vib.", "type": "Shrub", "color": "white", "moisture": "m, d", "height": "5-8 ft", "bloom": "May-Jun", "pollinators": "", "wasps": True, "bees": True, "other": ""},
]


def main():
    print(f"Trees & Shrubs for Pollinators: {len(PLANTS)}")

    # Append to existing plants.csv
    csv_path = os.path.join(DATA_DIR, "trees_shrubs_pollinators.csv")
    fields = ["scientific_name", "common_name", "type", "color", "moisture", "height", "bloom", "pollinators", "wasps", "bees", "other"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for p in PLANTS: w.writerow(p)
    print(f"Wrote {csv_path}")

    # Update SQLite
    db_path = os.path.join(DATA_DIR, "plants.db")
    conn = sqlite3.connect(db_path); cur = conn.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS trees_shrubs_pollinators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scientific_name TEXT, common_name TEXT, type TEXT, color TEXT,
        moisture TEXT, height TEXT, bloom TEXT, pollinators TEXT,
        wasps BOOLEAN, bees BOOLEAN, other TEXT)""")
    for p in PLANTS:
        cur.execute("INSERT INTO trees_shrubs_pollinators (scientific_name, common_name, type, color, moisture, height, bloom, pollinators, wasps, bees, other) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (p["scientific_name"], p["common_name"], p["type"], p["color"], p["moisture"], p["height"], p["bloom"], p["pollinators"], p["wasps"], p["bees"], p["other"]))
    conn.commit(); conn.close()
    print(f"Updated {db_path}")


if __name__ == "__main__":
    main()
