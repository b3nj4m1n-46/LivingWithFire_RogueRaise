# Data Dictionary: RutgersDeerResistance

**Source ID:** `DEER-01`
**Description:** Rutgers E271: 326 landscape plants rated by deer resistance. 4-level A-D scale.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (326 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `plant_type`
- **Definition:** Plant category
- **Type:** categorical
- **Values:**
  - `Bulbs` — Bulbs and tubers
  - `Groundcovers` — Low-growing spreading plants
  - `Ornamental Grasses` — Decorative grasses
  - `Perennials` — Herbaceous perennials
  - `Shrubs` — Woody shrubs
  - `Trees` — Woody trees

### `deer_rating`
- **Definition:** Deer damage rating (full text)
- **Type:** categorical
- **Values:**
  - `Rarely Damaged` — Very high deer resistance — deer almost never eat this
  - `Seldom Severely Damaged` — High deer resistance — occasional light browsing
  - `Occasionally Severely Damaged` — Some deer resistance — moderate browsing damage
  - `Frequently Severely Damaged` — Low deer resistance — deer heavily browse this

### `deer_rating_code`
- **Definition:** Single-letter rating code
- **Type:** categorical
- **Values:**
  - `A` — Rarely Damaged (very high resistance)
  - `B` — Seldom Severely Damaged (high)
  - `C` — Occasionally Severely Damaged (some)
  - `D` — Frequently Severely Damaged (low)

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
