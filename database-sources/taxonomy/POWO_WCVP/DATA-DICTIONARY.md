# Data Dictionary: POWO_WCVP

**Source ID:** `TAXON-01`
**Description:** World Checklist of Vascular Plants (WCVP) v14. 362,739 accepted species. Global taxonomy backbone.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (362,739 records)

## Column Definitions

### `plant_name_id`
- **Definition:** Unique WCVP identifier
- **Type:** integer

### `family`
- **Definition:** Taxonomic family
- **Type:** text

### `genus`
- **Definition:** Genus name
- **Type:** text

### `species`
- **Definition:** Species epithet
- **Type:** text

### `scientific_name` **[JOIN KEY]**
- **Definition:** Full binomial: genus + species
- **Type:** text

### `taxon_name`
- **Definition:** Full taxon name including infraspecific ranks
- **Type:** text

### `authors`
- **Definition:** Taxonomic authority
- **Type:** text

### `lifeform`
- **Definition:** Growth form (tree, shrub, herb, climber, etc.)
- **Type:** text *(nullable)*

### `climate`
- **Definition:** Climate zone (tropical, temperate, subtropical, etc.)
- **Type:** text *(nullable)*

### `geographic_area`
- **Definition:** Native geographic area abbreviation(s)
- **Type:** text *(nullable)*

### `native_to`
- **Definition:** Countries/regions where species is native
- **Type:** text *(nullable)*

### `introduced_to`
- **Definition:** Countries/regions where species is introduced
- **Type:** text *(nullable)*

### `powo_id`
- **Definition:** POWO/IPNI identifier for linking to powo.science.kew.org
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
