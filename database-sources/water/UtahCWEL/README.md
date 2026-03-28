# Utah State University CWEL - Western Native Plants

**Source:** USU Center for Water-Efficient Landscaping (CWEL)
**URL:** https://cwelwnp.usu.edu/westernnativeplants/plantlist.php
**Plants:** 94 western native species
**Region:** Intermountain West (Utah, Idaho, Wyoming, Colorado, Nevada, Montana)

## About

The CWEL Western Native Plants database profiles native plants suitable for water-efficient landscaping in the Intermountain West. Each species has a detailed narrative page covering drought tolerance, water needs, soil preferences, sun exposure, wildlife value, propagation methods, maintenance requirements, invasiveness assessment, and nursery availability.

## Output vs. Source

The **output files** contain the full list of 94 species with scientific and common names extracted from all A-Z pages. The **detail pages** on the CWEL website contain extensive narrative profiles per species (see sample fields below) — a future enhancement could scrape those for structured trait data.

## Detail Page Fields (available per species on website)

| Field | Example (Acer glabrum) |
|-------|----------------------|
| Water/Drought | "Surprisingly drought tolerant...requires periodic supplemental irrigation" |
| Size | 15-30 ft tall, 7.5-15 ft wide |
| Form | Small tree or upright multi-stemmed shrub |
| Sun | Moderately deep shade to full sun |
| Soil | Slightly acidic preferred, tolerates moderate alkalinity |
| Wildlife | (varies by species) |
| Invasiveness | "Shows no tendency for spread" |
| Propagation | Seed, cuttings, layering notes |
| Availability | Nursery availability notes |
| Maintenance | Pruning and care notes |

## Data Fields (current output)

| Field | Description |
|-------|-------------|
| scientific_name | Binomial/trinomial name |
| common_name | Common plant name |

## Files

- `plants.csv` - All 94 plants
- `plants.json` - JSON with metadata and detail URL pattern
- `plants.db` - SQLite database
- `scripts/build_data.py` - Data builder with embedded scraped data

## Citation

Utah State University Center for Water-Efficient Landscaping. "Western Native Plants for Intermountain Landscapes." https://cwelwnp.usu.edu/westernnativeplants/
