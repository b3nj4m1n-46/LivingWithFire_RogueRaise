# Data Dictionary: UtahCWEL

**Source ID:** `WATER-02`
**Description:** USU Center for Water Efficient Landscaping. 94 western native plants with rich narrative detail.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (94 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name(s)
- **Type:** text

### `height`
- **Definition:** Mature height range
- **Type:** text

### `spread`
- **Definition:** Mature width
- **Type:** text *(nullable)*

### `sun`
- **Definition:** Light requirements
- **Type:** text

### `soil`
- **Definition:** Soil preferences
- **Type:** text

### `water`
- **Definition:** Water/irrigation needs (narrative)
- **Type:** text

### `bloom`
- **Definition:** Bloom period and flower description
- **Type:** text

### `wildlife`
- **Definition:** Wildlife value notes
- **Type:** text *(nullable)*

### `native_range`
- **Definition:** Native geographic range
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
