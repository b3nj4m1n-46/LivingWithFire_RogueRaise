# Fire Performance Plants Selector Database

**Source:** Fire Performance Plant Selector (https://fire.sref.info/selector/plant-list)
**Archived:** September 2025 via Wayback Machine (original site returned 502)
**Plants:** 541 species and cultivars with firewise ratings

## Data Fields

| Field | Description |
|-------|-------------|
| common_name | Common plant name |
| scientific_name | Binomial/taxonomic name |
| size_feet | Mature height in feet |
| firewise_rating | Original rating string from source |
| firewise_rating_code | Numeric code: 1=Firewise, 2=Moderately, 3=At Risk, 4=Not Firewise |
| firewise_rating_label | Cleaned label |
| landscape_zone | LZ1 (Immediate), LZ2 (Intermediate), LZ3 (Extended), LZ4 (Beyond) |
| slug | URL slug from source site (links to detail pages) |

## Home Ignition Zones & Landscape Zones

The Home Ignition Zone begins at least 30 feet of defensible space immediately around the home and extends out 100 to 200 feet depending on adjacent land characteristics. Within this zone, a Firewise landscape is created by reducing fuels through Landscape Zones (LZ) that start at the home and move outward.

**Since no plant is completely non-ignitable or nonflammable, there is no "Fire Resistant" category. However, low-flammable plants, if maintained properly, can be used within Landscape Zones 1, 2, and 3.**

### Landscape Zone 1 (LZ1) - 0 to 5 feet from structure
Nothing flammable should be planted or placed against the structure (trees, brush, tall grass, leaves, firewood, bark mulch). Prune tree branches that hang into LZ1 to prevent the "ladder effect." Only low-flammable, well-maintained plants are acceptable here.

### Landscape Zone 2 (LZ2) - 5 to 10 feet from structure
Maintain a well-kept lawn; avoid easily-ignited evergreens. Use raised beds, rock gardens, stone walkways, walls, and patios as fuel breaks. Trees should have at least 10 feet vertical and horizontal clearance from the structure at mature height, with 10-15 feet between tree crown edges.

### Landscape Zone 3 (LZ3) - 10 to 30 feet from structure
Remove yard debris and thin vegetation. Driveways can serve as fire breaks. On slopes, extend clearing to 100 feet downhill. Select shrubs and groundcovers based on mature height. Low and moderately flammable plants are acceptable. Minimize massing of plant material. Trees should have 10-15 feet between crowns.

### Landscape Zone 4 (LZ4) - Beyond 30 feet from structure
Extends up to 200 feet. The Fire Performance Plant Selector does not directly address this zone. More flammable plants can be used here, but cultural and Firewise maintenance recommendations still apply.

*Source: [Home Ignition Zones page](https://fire.sref.info/firewise-zones) (archived Sept 2025)*

## Firewise Rating Distribution

| Rating | Count |
|--------|-------|
| Firewise (1) | 169 |
| At Risk Firewise (3) | 136 |
| Not Firewise (4) | 122 |
| Moderately Firewise (2) | 112 |

## Landscape Zone Distribution

| Zone | Count |
|------|-------|
| LZ2 (Intermediate) | 204 |
| LZ3 (Extended) | 297 |
| LZ4 (Beyond) | 34 |
| LZ1 (Immediate) | 5 |

## Files

- `plants.csv` - Flat CSV with all fields
- `plants.json` - JSON array of plant objects
- `plants.db` - SQLite database with indexes on scientific_name, firewise_rating_code, landscape_zone
- `scripts/parse_html.py` - Parser that extracts data from the saved Wayback Machine HTML
- `scripts/raw_plant_list.txt` - Raw text backup of plant data

## Sources

Source HTML files (saved from Wayback Machine, Sept 2025) are stored in the `Sources/` subfolder:

- `Plant List — Fire Performance Plant Selector.html` - Main plant list table (541 plants). Primary data source for the CSV/JSON/SQLite exports.
- `Home Ignition Zones — Fire Performance Plant Selector.html` - Explanation of Home Ignition Zones and Landscape Zones (LZ1-LZ4) used in the plant ratings.

## Data Notes

- 2 entries have missing/unusual data: "beaked hazelnut" has rating "13" (likely data entry error), and "ninebark" is missing a landscape zone.
- The source site also has individual plant detail pages (accessible via slug) that may contain additional data.
