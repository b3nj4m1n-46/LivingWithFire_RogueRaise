# Data Dictionary: OSU_PNW590

**Source ID:** `FIRE-09`
**Description:** OSU PNW 590: Fire-Resistant Plants for Home Landscapes. 133 plants for Pacific NW.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (133 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name (NOTE: some entries have common name in this field)
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `category`
- **Definition:** Plant grouping from publication
- **Type:** categorical

### `page`
- **Definition:** Page number in PNW 590 publication
- **Type:** integer

### `height`
- **Definition:** Mature height range
- **Type:** text

### `spread`
- **Definition:** Mature width range
- **Type:** text

### `usda_zones`
- **Definition:** USDA hardiness zones
- **Type:** text

### `flower_color`
- **Definition:** Flower color description
- **Type:** text

### `bloom_time`
- **Definition:** Bloom period
- **Type:** text

### `water_use`
- **Definition:** Water requirements
- **Type:** text *(nullable)*

### `invasive_warning`
- **Definition:** Whether the publication flags this species as potentially invasive
- **Type:** boolean

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
