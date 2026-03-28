# Data Dictionary: XercesPollinator

**Source ID:** `POLL-01`
**Description:** Xerces Society + Pollinator Partnership regional guides. 428 pollinator-supporting plants across 4 Pacific West regions.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (428 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name (may be genus-level with 'spp.')
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `region`
- **Definition:** Ecoregion the plant list applies to
- **Type:** categorical
- **Values:**
  - `Maritime Northwest` — OR/WA coast (from Xerces)
  - `CA Coastal Chaparral` — Southern CA coast
  - `CA Coastal Steppe/Redwood` — Northern CA coast
  - `Sierran Steppe` — Sierra Nevada foothills and mountains

### `source`
- **Definition:** Which organization published the guide
- **Type:** categorical

### `flower_color`
- **Definition:** Primary flower color(s)
- **Type:** text *(nullable)*

### `height`
- **Definition:** Mature height range (in feet, e.g. '< 30' or '0.1 - 1')
- **Type:** text *(nullable)*

### `bloom`
- **Definition:** Bloom season (e.g. 'March - June')
- **Type:** text *(nullable)*

### `sun`
- **Definition:** Light requirements (sun, partial shade, shade)
- **Type:** text *(nullable)*

### `soil`
- **Definition:** Soil preference (moist, dry, well drained, etc.)
- **Type:** text *(nullable)*

### `pollinators`
- **Definition:** Which pollinator types visit (bees, butterflies, hummingbirds, etc.)
- **Type:** text *(nullable)*

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
