# Data Dictionary: IdahoFirewise

**Source ID:** `FIRE-02`
**Description:** Idaho Firewise garden plant database. ~379 species with fire resistance ratings.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (379 records)

## Column Definitions

### `plant_type`
- **Definition:** Growth form category
- **Type:** categorical
- **Values:**
  - `Annual` — Annual plant
  - `Perennial` — Perennial plant
  - `Deciduous Shrub` — Shrub that drops leaves
  - `Evergreen Shrub` — Shrub retaining leaves
  - `Deciduous Tree` — Tree that drops leaves
  - `Evergreen Tree` — Tree retaining leaves
  - `Ornamental Grass` — Decorative grass
  - `Ground Cover` — Low-growing spreading plant
  - `Vine` — Climbing or trailing plant

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `cultivar`
- **Definition:** Named cultivar or variety (if applicable)
- **Type:** text *(nullable)*

### `botanical_name_raw`
- **Definition:** Full botanical name as it appeared in source
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `total_on_site`
- **Definition:** Number of specimens observed at Idaho demonstration garden
- **Type:** text

### `grower_source`
- **Definition:** Nursery or seed supplier
- **Type:** text *(nullable)*

### `comments`
- **Definition:** Additional notes from source
- **Type:** text *(nullable)*

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
