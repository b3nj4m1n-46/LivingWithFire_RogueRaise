# Data Dictionary: LBJ_Wildflower

**Source ID:** `NATIVE-01`
**Description:** Lady Bird Johnson Wildflower Center — Native Plants of North America. 1,000 plants native to OR, WA, and CA.
**Primary Join Key:** `scientific_name`

## Files

### `plants_oregon.csv` (230 records)

Native plants of Oregon.

### `plants_ca_wa.csv` (230 WA + 540 CA records)

Native plants of Washington and California.

### Column Definitions (same across all files)

#### `usda_symbol` **[SECONDARY JOIN KEY]**
- **Definition:** USDA PLANTS database symbol (e.g. ACMA3 for Acer macrophyllum)
- **Type:** text
- **Note:** Can be used to join with USDA_PLANTS dataset

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

#### `common_name`
- **Definition:** Common plant name
- **Type:** text *(often empty — LBJ list pages don't always show common names)*

#### `state`
- **Definition:** State or region the plant is native to
- **Type:** categorical
- **Values:**
  - `OR` — Oregon (in plants_oregon.csv, implicit)
  - `WA` — Washington
  - `CA North` — Northern California
  - `CA South` — Southern California

## Merge Guidance

- **Join on:** `scientific_name` or `usda_symbol`
- **The `usda_symbol` bridges to USDA_PLANTS** for full taxonomy lookup
- **Native status:** Any plant appearing in this dataset IS native to the listed state — this is a positive-only list
- **Common names are sparse** — use MBG or NCSU to fill in common names when merging
- **Detail pages exist** on wildflower.org with rich data (height, spread, sun, soil, wildlife value, propagation) but were not scraped — could be a future enrichment
