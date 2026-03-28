# NCSU Extension Gardener Plant Toolbox - Deer Resistant Plants

**Source:** North Carolina State University Extension Gardener Plant Toolbox
**URL:** https://plants.ces.ncsu.edu/find_a_plant/?tag=deer-resistant
**Total Plants:** 727 unique species (from ~1,346 entries including cultivars across 29 pages)
**Rating Type:** Binary tag ("deer-resistant") — no severity scale
**Status:** COMPLETE — all 29 pages scraped and deduplicated

## About

The NCSU Extension Gardener Plant Toolbox is a comprehensive horticultural database with detailed plant profiles including growing conditions, attributes, and tags. Plants tagged "deer-resistant" span the full database and include many cultivar-level entries.

## Data Quality Notes

- This is a **binary tag** — no resistance rating scale (unlike Rutgers A-D or Missouri browse levels)
- Many entries are **cultivar-level** (e.g., 32 Acer palmatum cultivars) rather than species-level
- Very high cultivar density means the 1,346 count represents far fewer unique species
- The NCSU database contains rich metadata per plant (zones, soil, light, etc.) beyond the deer tag

## Extraction Status

**COMPLETE** — All 29 pages scraped. Cultivar entries consolidated to species level where possible, yielding 727 unique entries from the original ~1,346.

## Files

- `plants.csv` - All 727 plants with deer-resistant tag
- `plants.json` - JSON with metadata
- `plants.db` - SQLite database
- `scripts/build_data.py` - Parser with embedded scraped data

## Citation

North Carolina State University Extension. "Extension Gardener Plant Toolbox." NC State University. https://plants.ces.ncsu.edu/
