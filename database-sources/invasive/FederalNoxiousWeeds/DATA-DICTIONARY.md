# Data Dictionary: FederalNoxiousWeeds

**Source ID:** `INVAS-01`
**Description:** USDA APHIS Federal Noxious Weed List. 112 species regulated at the federal level.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (112 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `category`
- **Definition:** Habitat type
- **Type:** categorical
- **Values:**
  - `Aquatic` — Aquatic/wetland invasive
  - `Parasitic` — Parasitic plant
  - `Terrestrial` — Land-based invasive

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
