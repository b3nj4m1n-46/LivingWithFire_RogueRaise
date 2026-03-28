# Data Dictionary: FirePerformancePlants

**Source ID:** `FIRE-01`
**Description:** Southern Regional Extension Forestry fire performance ratings for 541 landscape plants.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (541 records)

## Column Definitions

### `common_name`
- **Definition:** Common/colloquial plant name
- **Type:** text

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name (genus + species)
- **Type:** text

### `size_feet`
- **Definition:** Mature height in feet (e.g. '25\'')
- **Type:** text

### `firewise_rating`
- **Definition:** Full firewise rating label with numeric code
- **Type:** categorical
- **Values:**
  - `Firewise (1)` — Firewise — low flammability, recommended near structures
  - `MODERATELY Firewise (2)` — Moderately Firewise — use with caution in defensible space
  - `AT RISK Firewise (3)` — At Risk — higher flammability, plant away from structures
  - `NOT Firewise (4)` — Not Firewise — high flammability, avoid in fire-prone areas

### `firewise_rating_code`
- **Definition:** Numeric rating: 1 (best) to 4 (worst)
- **Type:** integer
- **Values:**
  - `1` — Firewise
  - `2` — Moderately Firewise
  - `3` — At Risk
  - `4` — Not Firewise

### `firewise_rating_label`
- **Definition:** Text-only rating without numeric code
- **Type:** categorical

### `landscape_zone`
- **Definition:** Recommended landscape zone for fire-safe placement
- **Type:** categorical
- **Values:**
  - `LZ1` — Zone 1 — Lean, Clean, Green zone (0-5ft from structure)
  - `LZ2` — Zone 2 — Defensible space (5-30ft from structure)
  - `LZ3` — Zone 3 — Transition zone (30-100ft from structure)
  - `LZ4` — Zone 4 — Extended zone (100ft+ from structure)

### `slug`
- **Definition:** URL-safe identifier derived from scientific name
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
