# Data Dictionary: UCForestProductsLab

**Source ID:** `FIRE-05`
**Description:** UC Forest Products Lab 1997 compilation of fire-resistant and fire-prone plants from 57 published sources.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (164 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `plant_type`
- **Definition:** Evergreen, deciduous, perennial, succulent, etc.
- **Type:** text

### `plant_form`
- **Definition:** Shrub, groundcover, tree, vine, grass
- **Type:** text

### `fire_rating`
- **Definition:** Fire performance classification
- **Type:** categorical
- **Values:**
  - `Fire-Resistant` — Recommended — appeared in 3+ sources as fire-resistant
  - `Highly Flammable` — Not recommended — appeared in 3+ sources as flammable

### `references`
- **Definition:** Comma-separated reference numbers (see references.csv)
- **Type:** text

### `invasive`
- **Definition:** Marked with *!* if potentially invasive
- **Type:** boolean *(nullable)*

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
