# Cornell Cooperative Extension (Dutchess County) - Deer Resistant Plants

**Source:** Cornell Cooperative Extension of Dutchess County
**URL:** https://ccedutchess.org/gardening/deer-resistant-plants
**Plants:** 211 entries (common names only)
**Region:** Hudson Valley, New York

## About

This Cornell Cooperative Extension resource provides deer resistance ratings for landscape plants in the Hudson Valley region. The rating scale matches Rutgers (4 levels), making cross-validation straightforward.

**Important limitation:** This source provides **common names only** — no scientific/Latin names. Cross-referencing with other databases requires name matching.

## Rating Scale (4 levels, matches Rutgers)

| Rating | Count | Description |
|--------|-------|-------------|
| Rarely Damaged | 106 | Plants not preferred by deer |
| Seldom Severely Damaged | 22 | Minor damage occasionally |
| Occasionally Damaged | 54 | Moderate damage in some conditions |
| Frequently Severely Damaged | 29 | Deer strongly prefer these |

## Plant Type Distribution

| Type | Count |
|------|-------|
| Perennial | 97 |
| Woody Ornamental | 87 |
| Annual/Biennial | 27 |

## Data Fields

| Field | Description |
|-------|-------------|
| common_name | Common plant name (NO scientific names in source) |
| plant_type | Woody Ornamental, Perennial, or Annual/Biennial |
| deer_rating | 4-level rating |

## Files

- `plants.csv` - All 211 plants with ratings
- `plants.json` - JSON with metadata
- `plants.db` - SQLite database
- `scripts/build_data.py` - Data builder (embedded from web scrape)

## Citation

Cornell Cooperative Extension of Dutchess County. "Deer Resistant Plants." https://ccedutchess.org/gardening/deer-resistant-plants
