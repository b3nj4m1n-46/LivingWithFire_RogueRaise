# UC Davis WUCOLS - Water Use Classification of Landscape Species

**Source:** UC Davis California Center for Urban Horticulture
**URL:** https://wucols.ucdavis.edu/
**Plants:** 4,103 landscape species
**Regions:** 6 California climate regions
**Last Updated:** March 2025 (WUCOLS V with ~1,200 new taxa)

## About

WUCOLS (Water Use Classification of Landscape Species) is the definitive reference for landscape water use in California. Originally developed to help implement the California Model Water Efficient Landscape Ordinance (MWELO), it classifies landscape plants by their water needs across six distinct California climate regions.

This is a **critical dataset** for fire-wise landscaping — low water use plants tend to have higher drought tolerance, and the regional specificity makes it directly applicable to site-level plant selection.

## California Climate Regions

| Region | Name |
|--------|------|
| 1 | North Central Valley |
| 2 | Central Valley |
| 3 | South Inland Valleys |
| 4 | South Coastal |
| 5 | High & Intermediate Desert |
| 6 | North Coastal / Bay Area |

## Water Use Categories

| Category | ET0 Range | Plant Factor | Description |
|----------|-----------|-------------|-------------|
| Very Low | 10-30% | 0.10-0.30 | Minimal supplemental water once established |
| Low | 10-40% | 0.10-0.40 | Low supplemental water |
| Moderate | 40-60% | 0.40-0.60 | Regular watering needed |
| High | 60-90% | 0.60-0.90 | Frequent watering needed |
| Unknown | N/A | N/A | Not yet classified for this region |
| Not Appropriate | N/A | N/A | Not suitable for this region |

## Region 1 Water Use Distribution (sample)

| Category | Count |
|----------|-------|
| Moderate | 1,519 |
| Low | 1,360 |
| Unknown | 623 |
| Very Low | 316 |
| Not Appropriate | 180 |
| High | 105 |

## Top Plant Types

| Type | Count |
|------|-------|
| Shrub | 889 |
| Perennial | 799 |
| Tree | 566 |
| Shrub, California Native | 284 |
| Perennial, California Native | 234 |
| Vine | 140 |
| Bulb | 102 |

## Data Fields

| Field | Description |
|-------|-------------|
| scientific_name | Botanical name |
| common_name | Common plant name |
| plant_type | Type tags (Shrub, Tree, Perennial, California Native, etc.) |
| region_N_water_use | Water use category for region N (1-6) |
| region_N_et0 | ET0 percentage for region N |
| region_N_plant_factor | Plant factor (decimal) for region N |

## Files

- `plants.csv` - All 4,103 plants with regional water use data
- `plants.json` - JSON with metadata, region definitions, and category descriptions
- `plants.db` - SQLite database with indexes
- `scripts/build_data.py` - Parser for the XLSX source

## Sources

- `Sources/WUCOLS_all_regions.xlsx` - Original spreadsheet from UC Davis

## Citation

UC Davis California Center for Urban Horticulture. "Water Use Classification of Landscape Species (WUCOLS)." https://wucols.ucdavis.edu/
