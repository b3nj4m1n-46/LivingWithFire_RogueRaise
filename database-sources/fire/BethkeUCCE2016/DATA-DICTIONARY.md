# Data Dictionary: BethkeUCCE2016

**Source ID:** `FIRE-06`
**Description:** Bethke et al. 2016 UCCE San Diego meta-analysis of 53 California fire-resistant plant lists from 85 sources. This is a reference/methodology dataset, not a direct plant list.
**Primary Join Key:** N/A (reference data, not plant records)

## Files

### `plant_list_sources.csv` (12 records)

Sources referenced in the 53-list compilation.

#### `citation`
- **Definition:** Full bibliographic citation of a source list
- **Type:** text

#### `notes`
- **Definition:** Methodology notes — how the source defines fire resistance
- **Type:** text

---

### `trait_codes.csv` (50 records)

Standardized trait codes used across all 53 plant lists for tagging plant characteristics.

#### `code`
- **Definition:** Short code used in the database (e.g. FS, PS, DT)
- **Type:** text
- **Values (examples):**
  - `FS` — Prefers full sun (6+ hours)
  - `PS` — Prefers partial shade
  - `DT` — Drought tolerant
  - `DR` — Deer resistant
  - `CA` — California native
  - `FH` — Fire hazard/not recommended
  - `FR` — Fire resistant/recommended

#### `trait`
- **Definition:** Full text description of what the code means
- **Type:** text

#### `list_source`
- **Definition:** Which of the 53 lists this code originated from
- **Type:** text

## Merge Guidance

- This dataset is a **meta-reference**, not a plant list. It tells you how to interpret other fire-resistance datasets.
- The trait codes can serve as a **standardized vocabulary** when merging fire datasets.
- The missing Appendix I Excel would have contained 2,572 plant records cross-referenced across all 53 sources.
