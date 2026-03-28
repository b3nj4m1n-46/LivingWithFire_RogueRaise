"""
Build WSU Extension deer-resistant plants dataset.

Source: Washington State University Extension, C063
        "Deer Resistant Plants"
        Adapted from Washington Department Fish and Wildlife
        and Backyard Wildlife Sanctuary Program.
        Format updated 2024.

Region: Eastern Washington (mule deer and whitetail deer)
Rating: Binary — "best bets" for deer disinterest (no severity scale)
"""

import csv
import json
import os
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

PLANTS = [
    # Annuals/Biennials
    {"scientific_name": "Ageratum", "common_name": "Ageratum", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Antirrhinum", "common_name": "Snapdragon", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Aquilegia spp.", "common_name": "Columbine", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Calendula", "common_name": "Calendula", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Campanula medium", "common_name": "Canterbury Bell", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Cosmos", "common_name": "Cosmos", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Cynoglossum amabile", "common_name": "Chinese Forget-me-not", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Digitalis", "common_name": "Foxglove", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Euphorbia marginata", "common_name": "Snow-on-the-mountain", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Helianthus annuus", "common_name": "Sunflower", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Jacobaea maritima", "common_name": "Dusty Miller", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Lobularia maritima", "common_name": "Sweet Alyssum", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Mirabilis jalapa", "common_name": "Four O'clock", "plant_type": "Annuals/Biennials"},
    {"scientific_name": "Papaver spp.", "common_name": "Poppy", "plant_type": "Annuals/Biennials"},

    # Evergreen Shrubs
    {"scientific_name": "Artemisia tridentata", "common_name": "Sagebrush", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Berberis", "common_name": "Evergreen Barberry", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Buxus spp.", "common_name": "Boxwood", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Ericameria nauseosa", "common_name": "Rabbitbrush", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Ilex spp.", "common_name": "Holly", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Juniperus", "common_name": "Juniper", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Mahonia", "common_name": "Oregon Grape", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Pinus mugo", "common_name": "Mugo Pine", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Rhododendron", "common_name": "Rhododendron (not azaleas)", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Sambucus racemosa", "common_name": "Red Elderberry", "plant_type": "Evergreen Shrubs"},
    {"scientific_name": "Spiraea", "common_name": "Spirea", "plant_type": "Evergreen Shrubs"},

    # Herbs and Vegetables
    {"scientific_name": "Allium schoenoprasum", "common_name": "Chives", "plant_type": "Herbs/Vegetables"},
    {"scientific_name": "Lavandula", "common_name": "Lavender", "plant_type": "Herbs/Vegetables"},
    {"scientific_name": "Mentha", "common_name": "Mint", "plant_type": "Herbs/Vegetables"},
    {"scientific_name": "Origanum vulgare", "common_name": "Oregano", "plant_type": "Herbs/Vegetables"},
    {"scientific_name": "Rosmarinus officinalis", "common_name": "Rosemary", "plant_type": "Herbs/Vegetables"},
    {"scientific_name": "Salvia officinalis", "common_name": "Sage", "plant_type": "Herbs/Vegetables"},
    {"scientific_name": "Thymus", "common_name": "Thyme", "plant_type": "Herbs/Vegetables"},

    # Deciduous Shrubs
    {"scientific_name": "Berberis thunbergii", "common_name": "Japanese Barberry", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Buddleja davidii", "common_name": "Butterfly Bush", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Cornus sericea", "common_name": "Red-Osier Dogwood", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Cotoneaster", "common_name": "Cotoneaster", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Forsythia", "common_name": "Forsythia", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Philadelphus lewisii", "common_name": "Mock Orange", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Potentilla fruticosa", "common_name": "Shrubby Cinquefoil", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Ribes aureum", "common_name": "Golden Currant", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Rosa rugosa", "common_name": "Rugosa Rose", "plant_type": "Deciduous Shrubs"},
    {"scientific_name": "Syringa vulgaris", "common_name": "Lilac", "plant_type": "Deciduous Shrubs"},

    # Trees
    {"scientific_name": "Abies", "common_name": "Fir", "plant_type": "Trees"},
    {"scientific_name": "Acer", "common_name": "Maple", "plant_type": "Trees"},
    {"scientific_name": "Cedrus", "common_name": "Cedar", "plant_type": "Trees"},
    {"scientific_name": "Corylus spp.", "common_name": "Hazelnut/Filbert", "plant_type": "Trees"},
    {"scientific_name": "Cotinus coggygria", "common_name": "Smoke Tree", "plant_type": "Trees"},
    {"scientific_name": "Picea", "common_name": "Spruce", "plant_type": "Trees"},
    {"scientific_name": "Pinus", "common_name": "Pine", "plant_type": "Trees"},
    {"scientific_name": "Prunus virginiana", "common_name": "Chokecherry", "plant_type": "Trees"},
    {"scientific_name": "Pseudotsuga menziesii", "common_name": "Douglas Fir", "plant_type": "Trees"},
    {"scientific_name": "Quercus", "common_name": "Oak", "plant_type": "Trees"},
    {"scientific_name": "Rhus", "common_name": "Sumac", "plant_type": "Trees"},
    {"scientific_name": "Robinia pseudoacacia", "common_name": "Black Locust", "plant_type": "Trees"},

    # Perennials/Bulbs
    {"scientific_name": "Achillea spp.", "common_name": "Yarrow", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Aquilegia", "common_name": "Columbine", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Armeria maritima", "common_name": "Sea Thrift", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Asclepias tuberosa", "common_name": "Butterfly Weed", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Campanula rotundifolia", "common_name": "Bluebells", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Campanula medium", "common_name": "Canterbury Bells", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Cerastium tomentosum", "common_name": "Snow-in-summer", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Clematis spp.", "common_name": "Clematis", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Coreopsis spp.", "common_name": "Coreopsis", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Delphinium spp.", "common_name": "Larkspur", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Dicentra", "common_name": "Bleeding Heart", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Erysimum", "common_name": "Wallflower", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Ferns", "common_name": "Ferns", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Gaillardia", "common_name": "Blanket Flower", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Helleborus", "common_name": "Hellebore", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Hemerocallis spp.", "common_name": "Daylily", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Heuchera", "common_name": "Coral Bells", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Iris", "common_name": "Iris", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Lavandula spica", "common_name": "English Lavender", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Liatris spicata", "common_name": "Gay Feather", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Linum usitatissimum", "common_name": "Flax", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Lupinus spp.", "common_name": "Lupine", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Paeonia spp.", "common_name": "Peony", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Papaver spp.", "common_name": "Poppy", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Phlox subulata", "common_name": "Creeping Phlox", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Rudbeckia hirta", "common_name": "Black-eyed Susan", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Symphoricarpos", "common_name": "Snowberry", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Trillium spp.", "common_name": "Trillium", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Yucca", "common_name": "Yucca", "plant_type": "Perennials/Bulbs"},
    {"scientific_name": "Zantedeschia spp.", "common_name": "Calla Lily", "plant_type": "Perennials/Bulbs"},
]


def main():
    print(f"Plants: {len(PLANTS)}")

    # Deduplicate
    seen = set()
    unique = []
    for p in PLANTS:
        key = p["scientific_name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(p)
    print(f"Unique: {len(unique)}")

    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "plant_type", "deer_resistant"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in unique:
            writer.writerow({**p, "deer_resistant": True})
    print(f"Wrote {csv_path}")

    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Washington State University Extension C063: Deer Resistant Plants",
            "adapted_from": "Washington Department of Fish and Wildlife and Backyard Wildlife Sanctuary Program",
            "region": "Eastern Washington (mule deer and whitetail deer)",
            "note": "Binary list - 'best bets' for deer disinterest. No severity scale. Trees must be protected when young.",
            "format_updated": "2024",
            "plants": [{**p, "deer_resistant": True} for p in unique],
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
            scientific_name TEXT,
            common_name TEXT,
            plant_type TEXT,
            deer_resistant BOOLEAN DEFAULT TRUE
        )
    """)
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    for p in unique:
        cur.execute("INSERT INTO plants (scientific_name, common_name, plant_type, deer_resistant) VALUES (?, ?, ?, ?)",
                    (p["scientific_name"], p["common_name"], p["plant_type"], True))
    conn.commit()

    cur.execute("SELECT plant_type, COUNT(*) FROM plants GROUP BY plant_type ORDER BY COUNT(*) DESC")
    print("\nPlant Type Distribution:")
    for t, c in cur.fetchall():
        print(f"  {t}: {c}")
    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
