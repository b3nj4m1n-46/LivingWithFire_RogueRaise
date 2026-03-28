# Data Dictionary: PollinatorPartnership

**Source ID:** `POLL-03`
**Description:** Pollinator Partnership Pacific Lowland Mixed Forest guide — plants that attract pollinators in OR/WA. 28 species with growing conditions and pollinator associations.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (28 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name (may be genus-level with "spp.")
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `plant_type`
- **Definition:** Growth form
- **Type:** categorical
- **Values:** `Tree/Shrub`, `Perennial`, `Vine`

### `flower_color`
- **Definition:** Flower color description
- **Type:** text
- **Examples:** "greenish white to red", "white", "blue to purple", "yellow"

### `height_ft`
- **Definition:** Mature height in feet (may use ranges or < notation)
- **Type:** text
- **Examples:** "<30", "0.1 - 1", "1 - 5"

### `bloom`
- **Definition:** Bloom period expressed as month ranges
- **Type:** text
- **Examples:** "March-June", "April-July", "July-October"

### `sun`
- **Definition:** Light requirements
- **Type:** text
- **Values:** "sun", "sun to partial shade", "sun to shade", "partial shade to shade", "shade"

### `soil`
- **Definition:** Soil and moisture preferences
- **Type:** text
- **Values include:** "moist, well drained", "dry", "dry to moist", "moist", "dry, well drained"

### `pollinators`
- **Definition:** Which pollinator types visit this plant
- **Type:** text
- **Values include:** "bees", "hummingbirds", "bees, flies", "bees, butterflies, beetles, wasps"

### `host_plant`
- **Definition:** Whether this plant also serves as a host plant for pollinator larvae (caterpillars, etc.)
- **Type:** boolean
- **Values:**
  - `True` — Serves as a larval host plant (marked with X in source)
  - `False` or empty — Not noted as a host plant

## Merge Guidance

- **Join on:** `scientific_name`
- **Genus-level entries** (e.g. "Acer spp.") match multiple species — expand via POWO_WCVP when merging
- **The `pollinators` field** is complementary to XercesPollinator and NRCS_Pollinator data
- **The `host_plant` flag** is especially valuable — it identifies plants that support the full pollinator lifecycle, not just nectar/pollen
