# Data Dictionary: CornellDeerResistance

**Source ID:** `DEER-06`
**Description:** Cornell Cooperative Extension deer-resistant plants. 211 plants with 4-level scale.
**Primary Join Key:** `common_name`

**Primary File:** `plants.csv` (211 records)

## Column Definitions

### `common_name` **[JOIN KEY]**
- **Definition:** Common plant name (NOTE: no scientific names in this dataset)
- **Type:** text

### `plant_type`
- **Definition:** Category
- **Type:** categorical
- **Values:**
  - `Woody Ornamental` — Trees and shrubs
  - `Perennial` — Herbaceous perennials
  - `Annual` — Annual plants
  - `Herb` — Culinary/medicinal herbs
  - `Bulb` — Bulbs and tubers
  - `Fern` — Ferns
  - `Ornamental Grass` — Decorative grasses
  - `Groundcover` — Low-growing plants

### `deer_rating`
- **Definition:** Deer damage frequency
- **Type:** categorical
- **Values:**
  - `Rarely Damaged` — Very high resistance
  - `Seldom Damaged` — High resistance
  - `Occasionally Damaged` — Some resistance
  - `Frequently Damaged` — Low resistance

## Merge Guidance

- **Join on:** `common_name`
- **WARNING:** This dataset only has common names. Cross-reference with NCSU or MBG to get scientific names before merging.
