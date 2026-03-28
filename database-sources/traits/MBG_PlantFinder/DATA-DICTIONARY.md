# Data Dictionary: MBG_PlantFinder

**Source ID:** `TRAIT-02`
**Description:** Missouri Botanical Garden Plant Finder. 8,840 plants with 14 enriched horticultural fields.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (9,494 records)

## Column Definitions

### `taxon_id`
- **Definition:** MBG internal identifier
- **Type:** integer

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name (may include cultivar)
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `type`
- **Definition:** Growth form (Deciduous shrub, Evergreen tree, Perennial, etc.)
- **Type:** text

### `family`
- **Definition:** Taxonomic family
- **Type:** text

### `zone`
- **Definition:** USDA hardiness zone range (e.g. '5 to 9')
- **Type:** text

### `height`
- **Definition:** Mature height range in feet (e.g. '5.00 to 8.00 feet')
- **Type:** text

### `spread`
- **Definition:** Mature width range in feet
- **Type:** text

### `bloom_time`
- **Definition:** Bloom period (e.g. 'July to September')
- **Type:** text

### `bloom_description`
- **Definition:** Detailed bloom characteristics
- **Type:** text

### `flower`
- **Definition:** Flower attributes (Showy, Fragrant, etc.)
- **Type:** text

### `sun`
- **Definition:** Light requirements (Full sun, Part shade, Full shade)
- **Type:** text

### `water`
- **Definition:** Water needs (Low, Medium, High)
- **Type:** text

### `maintenance`
- **Definition:** Maintenance level (Low, Medium, High)
- **Type:** text

### `tolerate`
- **Definition:** Conditions tolerated (Rabbit, Deer, Drought, Clay, etc.)
- **Type:** text *(nullable)*

### `suggested_use`
- **Definition:** Landscape use recommendations
- **Type:** text *(nullable)*

### `native_range`
- **Definition:** Native geographic origin
- **Type:** text *(nullable)*

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
