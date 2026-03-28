# Data Dictionary: OaklandFireSafe

**Source ID:** `FIRE-08`
**Description:** Oakland Fire Safe Council plant lists. 212 plants with fire ratings and CA native flags.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (212 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `lifeform`
- **Definition:** Abbreviated lifeform (grnd covr, shrub, tree, vine, etc.)
- **Type:** text

### `category`
- **Definition:** Grouping: GROUND COVERS, SHRUBS, TREES, VINES
- **Type:** categorical

### `comments`
- **Definition:** Additional notes (seasonal behavior, characteristics)
- **Type:** text *(nullable)*

### `ca_native`
- **Definition:** Whether the plant is native to California
- **Type:** boolean
- **Values:**
  - `True` — California native
  - `False` — Not CA native

### `origin`
- **Definition:** Text origin description
- **Type:** text

### `fire_rating`
- **Definition:** Fire classification
- **Type:** categorical
- **Values:**
  - `Fire-Resistant` — Recommended for fire-safe landscaping
  - `Fire-Prone` — Not recommended — high flammability

### `recommendation`
- **Definition:** Additional recommendation (e.g. Remove, Avoid)
- **Type:** text *(nullable)*

### `pyrophytic`
- **Definition:** Whether the plant actively promotes fire spread
- **Type:** boolean

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
