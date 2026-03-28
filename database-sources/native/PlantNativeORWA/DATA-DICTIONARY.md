# Data Dictionary: PlantNativeORWA

**Source ID:** `NATIVE-03`
**Description:** PlantNative.org recommended native plant list for Western Oregon and Western Washington. 59 species with basic growing conditions.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (59 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `plant_type`
- **Definition:** Growth form
- **Type:** categorical
- **Values:** `Tree`, `Shrub`, `Perennial`, `Fern`, `Groundcover`, `Grass`

### `sun`
- **Definition:** Light requirements (abbreviated codes)
- **Type:** categorical
- **Values:**
  - `F` — Full sun
  - `S` — Shade
  - `F-S` — Full sun to shade (adaptable)
  - `F-P` — Full sun to partial shade

### `moisture`
- **Definition:** Soil moisture preference (abbreviated codes)
- **Type:** categorical
- **Values:**
  - `D` — Dry
  - `A` — Average/medium
  - `W` — Wet
  - `A-D` — Average to dry
  - `A-W` — Average to wet
  - `D-W` — Dry to wet (very adaptable)

### `height`
- **Definition:** Mature height (e.g. "25'", "3-6'")
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **All plants in this list are native to Western OR/WA** — presence = native confirmation
- **The `sun` and `moisture` codes** need translation before merging with datasets that use full text (e.g. "Full sun to partial shade")
- **Small but curated list** — useful as a "recommended native" flag when filtering larger datasets
