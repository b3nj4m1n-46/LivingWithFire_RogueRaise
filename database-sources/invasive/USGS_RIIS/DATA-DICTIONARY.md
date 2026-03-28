# Data Dictionary: USGS_RIIS

**Source ID:** `INVAS-04`
**Description:** US Register of Introduced and Invasive Species v2.0. 5,941 invasive plant records across AK, HI, and L48.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (5,941 records)

## Column Definitions

### `locality`
- **Definition:** Geographic scope of the record
- **Type:** categorical
- **Values:**
  - `L48` — Lower 48 contiguous US states
  - `AK` — Alaska
  - `HI` — Hawaii

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common/vernacular name
- **Type:** text

### `family`
- **Definition:** Taxonomic family
- **Type:** text

### `order`
- **Definition:** Taxonomic order
- **Type:** text

### `degree_of_establishment`
- **Definition:** Invasiveness severity
- **Type:** categorical
- **Values:**
  - `established (category C3)` — Non-native with reproducing populations, not yet invasive
  - `invasive (category D2)` — Spreading and causing ecological damage
  - `widespread invasive (category E)` — Widely distributed and causing severe ecological damage

### `establishment_means`
- **Definition:** How it was introduced
- **Type:** text

### `pathway`
- **Definition:** Introduction pathway (horticulture, agriculture, ballast water, etc.)
- **Type:** text *(nullable)*

### `habitat`
- **Definition:** Habitat types affected
- **Type:** text *(nullable)*

### `is_hybrid`
- **Definition:** Whether the species is a hybrid
- **Type:** boolean

### `intro_date`
- **Definition:** Approximate date of introduction to US
- **Type:** text *(nullable)*

### `gbif_key`
- **Definition:** GBIF taxonomy key for linking to gbif.org
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
