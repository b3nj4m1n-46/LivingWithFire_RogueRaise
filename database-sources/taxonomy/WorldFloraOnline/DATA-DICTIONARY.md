# Data Dictionary: WorldFloraOnline

**Source ID:** `TAXON-02`
**Description:** World Flora Online DwC backbone. 381,467 accepted species. Independent taxonomic cross-validation.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (381,467 records)

## Column Definitions

### `taxonID`
- **Definition:** WFO unique identifier (e.g. wfo-0001302010)
- **Type:** text

### `scientific_name` **[JOIN KEY]**
- **Definition:** Full binomial with infraspecific ranks
- **Type:** text

### `taxon_rank`
- **Definition:** species, variety, subspecies, genus, family, etc.
- **Type:** categorical

### `taxonomic_status`
- **Definition:** Accepted, Synonym, or Unchecked
- **Type:** categorical

### `family`
- **Definition:** Taxonomic family
- **Type:** text

### `genus`
- **Definition:** Genus name
- **Type:** text

### `specific_epithet`
- **Definition:** Species epithet
- **Type:** text

### `major_group`
- **Definition:** Major plant group
- **Type:** categorical
- **Values:**
  - `A` — Angiosperms (flowering plants)
  - `Bryophyta` — Mosses
  - `Polypodiophyta` — Ferns
  - `Pinophyta` — Conifers
  - `Marchantiophyta` — Liverworts
  - `Lycopodiophyta` — Club mosses

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
