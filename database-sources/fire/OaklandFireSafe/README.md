# Oakland Fire Safe Council (OFSC) - Fire-Resistant & Fire-Prone Plant Lists

**Source:** Oakland Fire Safe Council (OFSC), combining lists from City of Oakland Public Works Watershed Division, FireSafe Marin (Marin County), and Diablo FireSafe Council
**Plants:** 193 total (150 fire-resistant, 43 fire-prone)

## About

This dataset combines fire-resistant and fire-prone plant lists from multiple Bay Area fire safety organizations. It includes both native and non-native species with California native status flagged.

**Important caveats from the source:**
- All plants will eventually burn
- Fire-resistant plants must be maintained in a living state, irrigated properly, and kept free of dead/dry material
- Plants not properly irrigated or pruned, or planted in inappropriate climate zones, will have increased fire risk

### Fire-Resistant (Table 1)
150 plants recommended for fire-safe landscaping. These exhibit relatively more resistance to burning when exposed to fire. Native species are included for their adaptability and habitat value to native fauna.

### Fire-Prone (Table 2)
43 plants identified as fire hazards with specific recommendations:
- **Remove** (26 plants): Should be removed within 100 feet of any structure in the Wildland Urban Interface
- **Avoid** (17 plants): Should not be planted; remove if possible; require greater maintenance if kept in defensible space
- **Pyrophytic** (9 plants): Marked "F" for extremely flammable

## Data Fields

| Field | Description |
|-------|-------------|
| scientific_name | Binomial/taxonomic name |
| common_name | Common plant name |
| lifeform | Ground cover, shrub, tree, vine, perennial, etc. |
| category | Grouping from source (Ground Covers, Shrubs, Trees, Perennials, Vines) |
| comments | Notes on growth habit, invasiveness, deciduousness |
| ca_native | True if California native species |
| origin | California Native, or region of origin if non-native (e.g., Europe, Australia) |
| fire_rating | Fire-Resistant or Fire-Prone |
| recommendation | For fire-prone plants: Remove or Avoid |
| pyrophytic | True if marked "F" (extremely flammable) in original data |

## Distributions

| Fire Rating | Count |
|-------------|-------|
| Fire-Resistant | 150 |
| Fire-Prone | 43 |

| Category (Fire-Resistant) | Count |
|---------------------------|-------|
| Perennials | 51 |
| Shrubs | 40 |
| Trees | 34 |
| Ground Covers | 25 |

| Category (Fire-Prone) | Count |
|------------------------|-------|
| Grasses, Ground Covers & Shrubs | 22 |
| Trees | 20 |
| Vines | 1 |

- **California Native:** 84 of 193 (44%)
- **Pyrophytic (extremely flammable):** 9

## Files

- `plants.csv` - All 193 plants with fire ratings, native status, and recommendations
- `plants.json` - JSON array of plant objects
- `plants.db` - SQLite database indexed on scientific_name, fire_rating, and ca_native
- `scripts/parse_xlsx.py` - Parser that extracts data from the source Excel file

## Sources

Source file is stored in the `Sources/` subfolder:

- `Fire-Resistant-Fire-Prone-Lists_OFSC.xlsx` - Original Excel workbook with 3 sheets (Fire Resistant, Fire Prone, Local Botanical Gardens & Natives reference links)

## Citation

Oakland Fire Safe Council. "Fire-Resistant and Fire-Prone Plant Lists." Compiled from City of Oakland Public Works Watershed Division, FireSafe Marin (Marin County), and Diablo FireSafe Council.
