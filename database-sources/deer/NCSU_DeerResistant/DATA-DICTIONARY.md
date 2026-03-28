# Data Dictionary: NCSU_DeerResistant

**Source ID:** `DEER-02`
**Description:** NC State Extension Gardener Toolbox deer-resistant tag. 727 plants. Binary: tagged = deer-resistant.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (727 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name (may include cultivar)
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `deer_resistant`
- **Definition:** Whether plant is tagged deer-resistant
- **Type:** boolean
- **Values:**
  - `True` — Tagged as deer-resistant in NCSU database

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
