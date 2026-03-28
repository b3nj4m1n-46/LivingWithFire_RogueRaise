# Data Dictionary: MissouriBotanicalDeer

**Source ID:** `DEER-03`
**Description:** Shaw Nature Reserve 3-year deer browse study. 112 native plants with 6-level browse scale.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (112 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `deer_browse`
- **Definition:** Observed deer browse level over 3-year study
- **Type:** categorical
- **Values:**
  - `No Browse` — Deer do not eat this plant (very high resistance)
  - `Very Light Browse (Tasted)` — Deer tasted but did not consume (high resistance)
  - `Light Browse` — Minor/occasional browsing (high-moderate resistance)
  - `Medium Browse` — Moderate browsing damage (some resistance)
  - `Heavy Browse` — Significant browsing damage (low resistance)
  - `Complete Browse` — Deer consume entirely (no resistance)

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
