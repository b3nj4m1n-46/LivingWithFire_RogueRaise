"""
Build CSU Extension deer damage prevention dataset.

Source: Colorado State University Extension
        "Preventing Deer Damage" (Fact Sheet 6.520)
        https://extension.colostate.edu/resource/preventing-deer-damage/

Rating system: Often browsed, Sometimes browsed, Rarely browsed
Plant categories: Flowers, Vines, Trees and Shrubs
"""

import csv
import json
import os
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

# Data extracted from web fetch of the CSU Extension page
PLANTS = [
    # Flowers
    {"common_name": "Geranium, wild", "scientific_name": "Geranium fremontii", "plant_type": "Flowers", "deer_resistance": "Often browsed"},
    {"common_name": "Silver Lupine", "scientific_name": "Lupinus argenteus", "plant_type": "Flowers", "deer_resistance": "Often browsed"},
    {"common_name": "Low sunflower", "scientific_name": "Helianthus pumilus", "plant_type": "Flowers", "deer_resistance": "Often browsed"},
    {"common_name": "Nodding onion", "scientific_name": "Allium cernuum", "plant_type": "Flowers", "deer_resistance": "Often browsed"},
    {"common_name": "Penstemon, low", "scientific_name": "Penstemon virens", "plant_type": "Flowers", "deer_resistance": "Often browsed"},
    {"common_name": "Phlox, common", "scientific_name": "Phlox multiflora", "plant_type": "Flowers", "deer_resistance": "Often browsed"},
    {"common_name": "Strawberry", "scientific_name": "Fragaria spp.", "plant_type": "Flowers", "deer_resistance": "Often browsed"},
    {"common_name": "Larkspur", "scientific_name": "Delphinium nelsonii", "plant_type": "Flowers", "deer_resistance": "Often browsed"},
    {"common_name": "Black-eyed susan", "scientific_name": "Rudbeckia spp.", "plant_type": "Flowers", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Pasque flower", "scientific_name": "Pulsatilla patens", "plant_type": "Flowers", "deer_resistance": "Sometimes browsed"},
    {"common_name": "California fuchsia", "scientific_name": "Epilobium spp.", "plant_type": "Flowers", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Prairie coneflower", "scientific_name": "Ratibida columnifera", "plant_type": "Flowers", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Scarlet gilia", "scientific_name": "Ipomopsis aggregata", "plant_type": "Flowers", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Gayflower", "scientific_name": "Liatris punctata", "plant_type": "Flowers", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Tall coneflower", "scientific_name": "Rudbeckia laciniata", "plant_type": "Flowers", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Tulips", "scientific_name": "Tulipa spp.", "plant_type": "Flowers", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Daffodils", "scientific_name": "Narcissus cvv.", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Lanceleaf Sage", "scientific_name": "Salvia reflexa", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Gaillardia/blanketflower", "scientific_name": "Gaillardia aristata", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Pussytoes, rose", "scientific_name": "Antennaria rosea", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Grape hyacinth", "scientific_name": "Muscari armeniacum", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Western wallflower", "scientific_name": "Erysimum asperum", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Wild iris", "scientific_name": "Iris missouriensis", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Lavender", "scientific_name": "Lavandula spp.", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Mariposa lily", "scientific_name": "Calochortus gunnisonii", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Mountain harebell", "scientific_name": "Campanula rotundifolia", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Pearly everlasting", "scientific_name": "Anaphalis margaritacea", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Purple coneflower", "scientific_name": "Echinacea purpurea", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Russian sage", "scientific_name": "Perovskia atriplicifolia", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Thyme", "scientific_name": "Thymus spp.", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    {"common_name": "Yarrow", "scientific_name": "Achillea spp.", "plant_type": "Flowers", "deer_resistance": "Rarely browsed"},
    # Vines
    {"common_name": "Grapes", "scientific_name": "Vitis spp.", "plant_type": "Vines", "deer_resistance": "Often browsed"},
    {"common_name": "English ivy", "scientific_name": "Hedera helix", "plant_type": "Vines", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Virginia creeper", "scientific_name": "Parthenocissus quinquefolia", "plant_type": "Vines", "deer_resistance": "Rarely browsed"},
    # Trees and Shrubs
    {"common_name": "Apples", "scientific_name": "Malus cvv.", "plant_type": "Trees and Shrubs", "deer_resistance": "Often browsed"},
    {"common_name": "Aspen", "scientific_name": "Populus tremuloides", "plant_type": "Trees and Shrubs", "deer_resistance": "Often browsed"},
    {"common_name": "Mugo pine", "scientific_name": "Pinus mugo", "plant_type": "Trees and Shrubs", "deer_resistance": "Often browsed"},
    {"common_name": "Mountain maple", "scientific_name": "Acer glabrum", "plant_type": "Trees and Shrubs", "deer_resistance": "Often browsed"},
    {"common_name": "Douglas-fir", "scientific_name": "Pseudotsuga menziesii", "plant_type": "Trees and Shrubs", "deer_resistance": "Often browsed"},
    {"common_name": "Roses", "scientific_name": "Rosa spp.", "plant_type": "Trees and Shrubs", "deer_resistance": "Often browsed"},
    {"common_name": "Hawthorn", "scientific_name": "Crataegus spp.", "plant_type": "Trees and Shrubs", "deer_resistance": "Often browsed"},
    {"common_name": "Wild plum", "scientific_name": "Prunus americana", "plant_type": "Trees and Shrubs", "deer_resistance": "Often browsed"},
    {"common_name": "Alder", "scientific_name": "Alnus tenuifolia", "plant_type": "Trees and Shrubs", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Golden currant", "scientific_name": "Ribes aureum", "plant_type": "Trees and Shrubs", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Rocky Mountain juniper", "scientific_name": "Juniperus scopulorum", "plant_type": "Trees and Shrubs", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Ninebark", "scientific_name": "Physocarpus monogynus", "plant_type": "Trees and Shrubs", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Oregon grape", "scientific_name": "Berberis repens", "plant_type": "Trees and Shrubs", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Wild raspberry", "scientific_name": "Rubus idaeus", "plant_type": "Trees and Shrubs", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Mountain mahogany", "scientific_name": "Cercocarpus montanus", "plant_type": "Trees and Shrubs", "deer_resistance": "Sometimes browsed"},
    {"common_name": "Apache plume", "scientific_name": "Fallugia paradoxa", "plant_type": "Trees and Shrubs", "deer_resistance": "Rarely browsed"},
    {"common_name": "Blue mist spiraea", "scientific_name": "Caryopteris x clandonensis", "plant_type": "Trees and Shrubs", "deer_resistance": "Rarely browsed"},
    {"common_name": "Common juniper", "scientific_name": "Juniperus communis", "plant_type": "Trees and Shrubs", "deer_resistance": "Rarely browsed"},
    {"common_name": "Pinon pine", "scientific_name": "Pinus edulis", "plant_type": "Trees and Shrubs", "deer_resistance": "Rarely browsed"},
    {"common_name": "Potentilla/cinquefoil", "scientific_name": "Potentilla spp.", "plant_type": "Trees and Shrubs", "deer_resistance": "Rarely browsed"},
    {"common_name": "Rabbit brush", "scientific_name": "Chrysothamnus spp.", "plant_type": "Trees and Shrubs", "deer_resistance": "Rarely browsed"},
]


def main():
    print(f"Plants: {len(PLANTS)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "plant_type", "deer_resistance"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in PLANTS:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Colorado State University Extension - Preventing Deer Damage (Fact Sheet 6.520)",
            "url": "https://extension.colostate.edu/resource/preventing-deer-damage/",
            "rating_scale": {
                "Rarely browsed": "Deer rarely eat this plant",
                "Sometimes browsed": "Deer occasionally browse this plant",
                "Often browsed": "Deer frequently eat this plant",
            },
            "plants": PLANTS,
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scientific_name TEXT,
            common_name TEXT,
            plant_type TEXT,
            deer_resistance TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    for p in PLANTS:
        cur.execute("INSERT INTO plants (scientific_name, common_name, plant_type, deer_resistance) VALUES (?, ?, ?, ?)",
                    (p["scientific_name"], p["common_name"], p["plant_type"], p["deer_resistance"]))
    conn.commit()

    cur.execute("SELECT deer_resistance, COUNT(*) FROM plants GROUP BY deer_resistance")
    print("\nDeer Resistance Distribution:")
    for r, c in cur.fetchall():
        print(f"  {r}: {c}")
    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
