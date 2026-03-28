# Data Dictionary: USDA_InvasiveSpecies

**Source ID:** `INVAS-03`
**Description:** USDA National Invasive Species Information Center terrestrial plant list.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (30 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
