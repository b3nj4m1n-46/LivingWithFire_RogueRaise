# Data Dictionary: WSU_DeerResistant

**Source ID:** `DEER-04`
**Description:** Washington State University deer-resistant plant recommendations. 82 plants. Binary: listed = deer-resistant.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (82 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `plant_type`
- **Definition:** Category from source
- **Type:** categorical
- **Values:**
  - `Annuals/Biennials` — Annual or biennial plants
  - `Evergreen Shrubs` — Shrubs retaining leaves year-round
  - `Herbs and Vegetables` — Culinary herbs and vegetables
  - `Perennials/Bulbs` — Herbaceous perennials and bulbs
  - `Trees` — Deciduous or evergreen trees

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
