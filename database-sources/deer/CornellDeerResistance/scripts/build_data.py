"""
Build Cornell Cooperative Extension (Dutchess County) deer resistance dataset.

Source: Cornell Cooperative Extension of Dutchess County
        "Deer Resistant Plants"
        https://ccedutchess.org/gardening/deer-resistant-plants

Rating system (matches Rutgers scale):
  Rarely Damaged
  Seldom Severely Damaged
  Occasionally Damaged
  Frequently Severely Damaged

NOTE: This source provides COMMON NAMES ONLY (no scientific names).
"""

import csv
import json
import os
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

PLANTS = []

def add(names, plant_type, deer_rating):
    for n in names:
        n = n.strip()
        if n:
            PLANTS.append({
                "common_name": n,
                "plant_type": plant_type,
                "deer_rating": deer_rating,
            })

# Woody - Rarely Damaged
add(["Common boxwood", "Spruce"], "Woody Ornamental", "Rarely Damaged")

# Herbaceous - Rarely Damaged (Annuals)
add(["Ageratum", "Blanket flower", "Blue salvia", "Cleome", "Dahlia", "Datura",
     "Dusty Miller", "Edging Lobelia", "Forget-me-not", "Four o'clock", "Heliotrope",
     "Marigold", "Morning glory", "Nicotiana", "Parsley", "Polka-dot plant", "Poppy",
     "Snapdragon", "Sweet alyssum", "Sweet basil", "Verbena", "Wax begonia",
     "Zonal geranium"], "Annual/Biennial", "Rarely Damaged")

# Herbaceous - Rarely Damaged (Perennials)
add(["Amsonia", "Anemones", "Angelica", "Astilbe", "Avens", "Baby's breath",
     "Balloon flower", "Barrenwort", "Basket of gold", "Beebalm", "Bergenia",
     "Bleeding heart", "Boltonia", "Bugbane", "Buttercup", "Butterfly bush",
     "Candytuft", "Christmas fern", "Cinnamon fern", "Cinquefoil", "Clematis",
     "Columbine", "Coreopsis", "Crown imperial", "Daffodil", "Dead nettle",
     "Evening primrose", "False indigo", "Feverfew", "Forget-me-not", "Garlic chives",
     "Gas plant", "Globe thistle", "Goldenrod", "Hay-scented fern", "Heath", "Heather",
     "Hellebore", "Hungarian speedwell", "Interrupted fern", "Jack-in-the-pulpit",
     "Japanese pachysandra", "Joe pyeweed", "Kirengeshoma", "Labrador violet",
     "Lamb's ear", "Lavender", "Lily-of-the-valley", "Lupine", "Lungwort", "Mint",
     "Mullein", "New York fern", "Oregano", "Ornamental onion", "Ostrich fern",
     "Oriental poppy", "Partridgeberry", "Pennyroyal", "Perennial blue flax",
     "Plumbago", "Primrose", "Purple coneflower", "Queen-of-the-prairie",
     "Ribbon grass", "Royal fern", "Sage", "Scilla", "Shasta daisy",
     "Spike gayfeather", "Statice", "Sundrops", "Sweet Cicely", "Sweet William",
     "Sweet woodruff", "Tiger lily", "Turtlehead", "Tussock bellflower",
     "Wisteria", "Wormwood", "Yarrow"], "Perennial", "Rarely Damaged")

# Woody - Seldom Severely Damaged
add(["American bittersweet", "Austrian pine", "Beautybush", "Chinese junipers",
     "Common sassafras", "Corkscrew willow", "English hawthorn", "European beech",
     "European white birch", "Forsythia", "Honey locust", "Inkberry",
     "Japanese flowering cherry", "Japanese wisteria", "Kousa dogwood", "Mugo pine",
     "Pitch pine", "Red osier dogwood", "Red pine", "Redvein enkianthus",
     "Scots pine", "White spruce"], "Woody Ornamental", "Seldom Severely Damaged")

# Woody - Occasionally Damaged
add(["Allegheny serviceberry", "Anthony water spirea", "Basswood",
     "Border forsythia", "Bridalwreath spirea", "Bush cinquefoil",
     "Carolina hemlock", "Chestnut oak", "Climbing hydrangea",
     "Common horsechestnut", "Cranberry cotoneaster", "Dawn redwood",
     "Deciduous azaleas", "Doublefile viburnum", "Downy serviceberry",
     "Eastern hemlock", "Eastern red cedar", "Eastern white pine",
     "European larch", "Greenspire littleleaf linden",
     "Japanese flowering quince", "Japanese tree lilac", "Judd viburnum",
     "Koreanspice viburnum", "Leatherleaf viburnum", "Northern red oak",
     "Oldfashion weigelia", "Panicled dogwood", "Paperbark maple",
     "Red maple", "Rockspray cotoneaster", "Rosebay rhododendron",
     "Rose of Sharon", "Saucer magnolia", "Smokebush", "Smooth hydrangea",
     "Staghorn sumac", "Sugar maple", "Sweet cherry", "Sweet mock orange",
     "Trumpet creeper", "Virginia creeper", "White fir", "White oak",
     "Willows"], "Woody Ornamental", "Occasionally Damaged")

# Herbaceous - Occasionally Damaged (Annuals)
add(["Pansy", "Sunflower"], "Annual/Biennial", "Occasionally Damaged")

# Herbaceous - Occasionally Damaged (Perennials)
add(["Coneflower", "Cranesbill geranium", "Iris", "Meadow rue", "Peony",
     "Sedum", "Wood hyacinth"], "Perennial", "Occasionally Damaged")

# Woody - Frequently Severely Damaged
add(["American arborvitae", "Atlantic white cedar", "Apples", "Balsam fir",
     "Catawba rhododendron", "Cherries", "Clematis", "English yew",
     "English/Japanese hybrid yew", "European mountain ash", "Evergreen azaleas",
     "Frazer fir", "Hybrid tea rose", "Japanese yew", "Pinxterbloom azalea",
     "Plums", "Rhododendrons", "Wintercreeper"], "Woody Ornamental", "Frequently Severely Damaged")

# Herbaceous - Frequently Damaged (Annuals)
add(["Hollyhocks", "Impatiens"], "Annual/Biennial", "Frequently Severely Damaged")

# Herbaceous - Frequently Damaged (Perennials)
add(["Cardinal flower", "Crocus", "Daylily", "Goatsbeard", "Hosta", "Lilies",
     "Phlox", "Roses", "Tulips"], "Perennial", "Frequently Severely Damaged")


def main():
    print(f"Plants: {len(PLANTS)}")

    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["common_name", "plant_type", "deer_rating"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in PLANTS:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Cornell Cooperative Extension of Dutchess County - Deer Resistant Plants",
            "url": "https://ccedutchess.org/gardening/deer-resistant-plants",
            "note": "Common names only - no scientific names provided in source",
            "rating_scale": {
                "Rarely Damaged": "Plants not preferred by deer",
                "Seldom Severely Damaged": "Minor damage occasionally",
                "Occasionally Damaged": "Moderate damage in some conditions",
                "Frequently Severely Damaged": "Deer strongly prefer these plants",
            },
            "plants": PLANTS,
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            common_name TEXT,
            plant_type TEXT,
            deer_rating TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_rating ON plants(deer_rating)")
    for p in PLANTS:
        cur.execute("INSERT INTO plants (common_name, plant_type, deer_rating) VALUES (?, ?, ?)",
                    (p["common_name"], p["plant_type"], p["deer_rating"]))
    conn.commit()

    cur.execute("SELECT deer_rating, COUNT(*) FROM plants GROUP BY deer_rating")
    print("\nDeer Rating Distribution:")
    for r, c in cur.fetchall():
        print(f"  {r}: {c}")

    cur.execute("SELECT plant_type, COUNT(*) FROM plants GROUP BY plant_type ORDER BY COUNT(*) DESC")
    print("\nPlant Type Distribution:")
    for t, c in cur.fetchall():
        print(f"  {t}: {c}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
