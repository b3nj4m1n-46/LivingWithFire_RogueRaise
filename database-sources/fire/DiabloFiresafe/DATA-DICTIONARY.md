# Data Dictionary: DiabloFiresafe

**Source ID:** `FIRE-07`
**Description:** Diablo Firesafe Council fire plant lists. Same UC Forest Products Lab 1997 methodology.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (140 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `plant_type`
- **Definition:** Evergreen, deciduous, perennial, succulent, bulb
- **Type:** text

### `plant_form`
- **Definition:** Shrub, groundcover, tree, vine, grass, creeper
- **Type:** text

### `fire_rating`
- **Definition:** Fire performance classification
- **Type:** categorical
- **Values:**
  - `Fire-Resistant` — 3+ favorable references
  - `Highly Flammable` — 3+ unfavorable references

### `references`
- **Definition:** Comma-separated reference numbers (see references.csv for the 57 sources)
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
