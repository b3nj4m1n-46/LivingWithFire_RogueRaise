# Data Dictionary: NIST_USDA_Flammability

**Source ID:** `FIRE-04`
**Description:** 34 ornamental shrubs experimentally tested for flammability by USDA Forest Service.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (34 records)

## Column Definitions

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `authority`
- **Definition:** Taxonomic authority (author who named the species)
- **Type:** text *(nullable)*

### `cultivar`
- **Definition:** Named cultivar tested
- **Type:** text *(nullable)*

### `flammability_rank`
- **Definition:** Experimentally determined flammability category
- **Type:** categorical
- **Values:**
  - `Low` — Low flammability — 22 of 34 species. Safe for firewise landscaping.
  - `Moderate` — Moderate flammability — 8 of 34 species. Use cautiously.
  - `High` — High flammability — 4 of 34 species. Not recommended near structures.

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
