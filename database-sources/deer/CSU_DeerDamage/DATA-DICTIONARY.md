# Data Dictionary: CSU_DeerDamage

**Source ID:** `DEER-05`
**Description:** Colorado State University deer damage prevention guide. 55 plants with 3-level browse scale.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (55 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `plant_type`
- **Definition:** Category: Flowers, Vines, Trees and Shrubs
- **Type:** categorical

### `deer_resistance`
- **Definition:** Browse frequency
- **Type:** categorical
- **Values:**
  - `Rarely browsed` — Very high deer resistance
  - `Sometimes browsed` — Some deer resistance
  - `Often browsed` — Low deer resistance — frequently eaten by deer

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
