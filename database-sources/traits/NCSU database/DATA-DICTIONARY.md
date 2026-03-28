# Data Dictionary: NCSU database

**Source ID:** `TRAIT-01`
**Description:** NC State Extension Gardener Plant Toolbox. 5,028 plants with 78 horticultural fields.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (5,028 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_names`
- **Definition:** Common plant name(s)
- **Type:** text

### `family`
- **Definition:** Taxonomic family
- **Type:** text

### `plant_type`
- **Definition:** Growth form (Shrub, Tree, Perennial, Annual, etc.)
- **Type:** categorical

### `growth_rate`
- **Definition:** Growth speed: Slow, Medium, Fast
- **Type:** categorical

### `maintenance`
- **Definition:** Maintenance level: Low, Medium, High
- **Type:** categorical

### `usda_zones`
- **Definition:** USDA hardiness zones (e.g. '7a, 7b, 8a, 8b, 9a, 9b')
- **Type:** text

### `light`
- **Definition:** Light requirements (Full sun, Partial sun, Shade)
- **Type:** text

### `soil_texture`
- **Definition:** Preferred soil types
- **Type:** text

### `soil_drainage`
- **Definition:** Drainage preference
- **Type:** text

### `flower_color`
- **Definition:** Flower color(s)
- **Type:** text

### `flower_bloom_time`
- **Definition:** Bloom season(s)
- **Type:** text

### `attracts`
- **Definition:** Wildlife attracted (Butterflies, Hummingbirds, Pollinators)
- **Type:** text

### `resistance`
- **Definition:** Pest/disease resistance notes
- **Type:** text *(nullable)*

### `wildlife_value`
- **Definition:** Ecological value description
- **Type:** text *(nullable)*

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
