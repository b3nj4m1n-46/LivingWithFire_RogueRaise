# Lady Bird Johnson Wildflower Center - Native Plant Database

**Source:** Lady Bird Johnson Wildflower Center, University of Texas at Austin
**URL:** https://www.wildflower.org/plants/
**Total Database:** 25,240 native plants across North America
**Extracted:** 593 unique plants (OR, WA, CA collections) with full detail pages

## About

The LBJ Wildflower Center maintains the largest native plant database in North America. Each plant has a detailed profile with physical characteristics, growing conditions, native range, ecological value, pollinator value, and propagation information.

Data was scraped in two phases:
1. **Collection pages** — paginated list of plants per state (100 per page)
2. **Detail pages** — full profile for each plant (25 fields extracted)

## Regional Distribution

| Collection | Plants | URL Pattern |
|-----------|--------|-------------|
| Oregon (OR) | 228 | `collection.php?collection=OR` |
| California | 265 | `collection.php?collection=California` |
| CA North | 308 | `collection.php?collection=CA_north` |
| CA South | 226 | `collection.php?collection=CA_south` |
| Washington (WA) | 226 | `collection.php?collection=WA` |
| **Unique total** | **593** | (deduplicated across overlapping collections) |

**Note:** California has 487 unique plants across three overlapping collections (California, CA_north, CA_south).

## Data Fields (25 fields from detail pages)

| Field | Coverage | Description |
|-------|----------|-------------|
| usda_symbol | 100% | USDA PLANTS symbol (e.g., ABGR) |
| scientific_name | 100% | Binomial Latin name |
| family | 100% | Plant family |
| states | 100% | Comma-separated state codes (OR, CA, WA) |
| habit | 100% | Growth habit (Tree, Shrub, Herb/Forb, etc.) |
| duration | 100% | Perennial, Annual, Biennial |
| bloom_color | 100% | Flower color |
| native_status | 100% | L48 (N), CAN (N), etc. |
| distribution | 100% | US states where found |
| habitat | 100% | Native habitat description |
| light | 97% | Sun, Part Shade, Shade |
| propagation | 94% | Seeds, cuttings, division, etc. |
| bloom_time | 92% | Months of bloom |
| soil_moisture | 82% | Dry, Moist, Wet |
| water | 60% | Water use classification |
| leaf_retention | 47% | Deciduous, Evergreen |
| spread | 31% | Mature spread in feet |
| wildlife | 30% | Wildlife value notes |
| height | 20% | Mature height in feet |
| common_name | <1% | Common names (sparse on list pages) |

## Files

- `plants.csv` — All 593 unique plants with 25 fields
- `plants_oregon.csv` — 228 Oregon natives
- `plants_california.csv` — 487 California natives
- `plants_washington.csv` — 226 Washington natives
- `plants.json` — Full dataset with metadata
- `plants.db` — SQLite database with indexes
- `scripts/scrape_lbj.py` — Full scraper (collections + detail pages)

## Rescraping

```bash
cd LBJ_Wildflower
python scripts/scrape_lbj.py
# Takes ~10 minutes (1-second delay between requests)
```

## Citation

Lady Bird Johnson Wildflower Center. "Native Plants of North America." University of Texas at Austin. https://www.wildflower.org/plants/
