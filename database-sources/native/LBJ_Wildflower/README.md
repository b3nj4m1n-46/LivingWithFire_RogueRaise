# Lady Bird Johnson Wildflower Center - Native Plant Database

**Source:** Lady Bird Johnson Wildflower Center, University of Texas at Austin
**URL:** https://www.wildflower.org/plants/
**Total Database:** 25,240 native plants across North America
**Extracted:** 1,000 plants (OR, WA, CA North, CA South collections)

## About

The LBJ Wildflower Center maintains the largest native plant database in North America. Each plant has a detailed profile with physical characteristics, growing conditions, native range, ecological value, pollinator value, and propagation information.

## Output vs. Source

The **output files** contain native plants from four state/region collections relevant to the Pacific West. The full database has 25,240 species — additional states could be scraped using the same collection URL pattern.

## Regional Distribution

| Collection | Count |
|-----------|-------|
| Oregon (OR) | 230 |
| Washington (WA) | 230 |
| California North (CA_north) | 310 |
| California South (CA_south) | 230 |
| **Total** | **1,000** |

## Data Fields

| Field | Description |
|-------|-------------|
| usda_symbol | USDA PLANTS symbol (links to detail page) |
| scientific_name | Binomial name |
| common_name | Common plant name |
| state | Collection region (OR, WA, CA North, CA South) |

## Detail Page Access

Each plant's full profile is at:
`https://www.wildflower.org/plants/result.php?id_plant={usda_symbol}`

Detail pages include: family, habit, duration, height, spread, leaf traits, bloom time/color, light, soil moisture, native range, wildlife value, pollinator value, propagation, and wetland status.

## Files

- `plants_oregon.csv` - 230 Oregon natives
- `plants_ca_wa.csv` - 230 WA natives
- `plants_california.csv` - 540 CA natives (310 North, 230 South)
- `plants.db` - Combined SQLite database (all 1,000)

## Citation

Lady Bird Johnson Wildflower Center. "Native Plants of North America." University of Texas at Austin. https://www.wildflower.org/plants/
