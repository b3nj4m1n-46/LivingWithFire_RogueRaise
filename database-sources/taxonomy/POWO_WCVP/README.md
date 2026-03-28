# POWO / WCVP - World Checklist of Vascular Plants

**Source:** Royal Botanic Gardens, Kew
**URL:** https://powo.science.kew.org/
**Download:** https://sftp.kew.org/pub/data-repositories/WCVP/
**Species:** 362,739 accepted species (from 1,441,152 total name records)
**Distribution Records:** 1,986,879
**Date:** January 2026

## About

The World Checklist of Vascular Plants (WCVP) is a comprehensive global taxonomy maintained by Kew. It provides accepted names, synonyms, family classification, lifeform descriptions, climate associations, and geographic distribution for all known vascular plant species.

This is the **backbone reference** for resolving plant taxonomy across all other datasets in the LivinWitFire project.

## Output vs. Source

The **raw source** (`Sources/`) contains the full WCVP dump: 1,441,152 name records including synonyms, subspecies, varieties, and unresolved names. The **output files** (`plants.csv`, `plants.db`) are filtered to **accepted species-rank names only** (362,739 species). No trait or distribution data was dropped — if Kew left a field blank for a species, it appears blank in our output.

Not every accepted species has every field populated:

| Field | Species with data | Coverage |
|-------|------------------|----------|
| lifeform | 276,739 | 76% |
| climate | 335,418 | 92% |
| native_to (distribution) | ~340,000+ | ~94% |

Species missing lifeform/climate data are still included in the output — they remain useful for **taxonomic name resolution** across other LivinWitFire datasets even without traits.

## Key Statistics

- **362,739** accepted species in output
- **276,739** with lifeform data (76%)
- **335,418** with climate data (92%)
- **1,986,879** distribution records joined to species

## Top Families

| Family | Species Count |
|--------|-------------|
| Asteraceae | 35,225 |
| Orchidaceae | 31,562 |
| Fabaceae | 22,688 |
| Rubiaceae | 14,355 |
| Poaceae | 12,391 |
| Lamiaceae | 8,227 |
| Rosaceae | 5,843 |

## Lifeform Categories

| Lifeform | Count |
|----------|-------|
| perennial | 50,485 |
| tree | 38,320 |
| shrub | 22,938 |
| subshrub | 18,635 |
| shrub or tree | 17,903 |
| epiphyte | 15,402 |
| annual | 12,970 |
| climber | 6,250 |

## Climate Categories

| Climate | Count |
|---------|-------|
| wet tropical | 133,068 |
| temperate | 69,178 |
| subtropical | 52,348 |
| seasonally dry tropical | 51,297 |
| desert or dry shrubland | 17,400 |
| subalpine or subarctic | 8,210 |

## Data Fields

| Field | Description |
|-------|-------------|
| plant_name_id | Kew unique identifier |
| family | Plant family (APG) |
| genus | Genus name |
| species | Species epithet |
| scientific_name | Genus + species |
| taxon_name | Full taxon name with infraspecific ranks |
| authors | Taxonomic authority |
| lifeform | Growth form (tree, shrub, perennial, etc.) |
| climate | Climate zone (temperate, tropical, etc.) |
| geographic_area | Summary native range |
| native_to | Comma-separated native regions (from distribution data) |
| introduced_to | Comma-separated introduced regions |
| powo_id | POWO link identifier |

## Files

- `plants.csv` - All 362,739 accepted species with distribution (large file ~200MB+)
- `plants.db` - SQLite database with indexed columns (family, genus, scientific_name, lifeform, climate)
- `scripts/build_data.py` - Parser for raw WCVP data
- *JSON skipped due to file size — use CSV or SQLite*

## Sources

- `Sources/wcvp.zip` - Original download from Kew
- `Sources/wcvp_names.csv` - Raw taxonomy (298MB, 1.44M records)
- `Sources/wcvp_distribution.csv` - Raw distribution (141MB, 1.99M records)
- `Sources/README_WCVP.xlsx` - Kew's data dictionary

## Citation

WCVP (2026). World Checklist of Vascular Plants, version 14.0. Facilitated by the Royal Botanic Gardens, Kew. Published on the Internet; http://wcvp.science.kew.org/
