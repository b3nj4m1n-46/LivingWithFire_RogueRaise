# Data Dictionary: NRCS_Pollinator

**Source ID:** `POLL-02`
**Description:** USDA NRCS Pollinator Conservation plant lists. Three files covering wildflowers, trees/shrubs, and monarch-specific plants.
**Primary Join Key:** `scientific_name`

## Files

### `plants.csv` (32 records)

Wildflowers attractive to beneficial insects.

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

#### `common_name`
- **Definition:** Common plant name
- **Type:** text

#### `pollen_nectar`
- **Definition:** Whether the plant provides pollen (P), nectar (N), or both
- **Type:** categorical
- **Values:**
  - `P` — Pollen only
  - `N` — Nectar only
  - `P, N` — Both pollen and nectar

#### `attracts`
- **Definition:** Comma-separated list of beneficial insect types attracted
- **Type:** text
- **Values include:** lacewings, syrphid_flies, tachinid_flies, soldier_beetles, mason_potter_wasps, yellowjackets, braconid_wasps, ground_beetles, minute_pirate_bugs, parasitic_wasps, lady_beetles

#### `insect_count`
- **Definition:** Number of distinct beneficial insect types attracted
- **Type:** integer

---

### `trees_shrubs_pollinators.csv` (29 records)

Trees and shrubs that support pollinators.

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

#### `common_name`
- **Definition:** Common plant name
- **Type:** text

#### `type`
- **Definition:** Growth form
- **Type:** categorical
- **Values:** `Canopy Tree`, `Understory Tree`, `Shrub`

#### `color`
- **Definition:** Flower color
- **Type:** text

#### `moisture`
- **Definition:** Moisture preference (abbreviated)
- **Type:** categorical
- **Values:**
  - `d` — Dry
  - `m` — Moist
  - `w` — Wet
  - `d-m` — Dry to moist
  - `m-w` — Moist to wet

#### `height`
- **Definition:** Mature height (e.g. "to 95 ft")
- **Type:** text

#### `bloom`
- **Definition:** Bloom month(s) (abbreviated, e.g. "Apr", "May-Jun")
- **Type:** text

#### `pollinators`
- **Definition:** Primary pollinator types
- **Type:** text

#### `wasps` / `bees` / `other`
- **Definition:** Boolean flags for specific pollinator groups
- **Type:** boolean

---

### `monarch_plants.csv` (46 records)

Plants specifically supporting Monarch butterflies and their habitat.

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

#### `common_name`
- **Definition:** Common plant name (NOTE: may contain multiple names concatenated)
- **Type:** text

#### `category`
- **Definition:** Role in monarch conservation
- **Type:** categorical
- **Values:**
  - `Monarch Butterfly` — Milkweed and nectar plants for monarchs

## Merge Guidance

- **Join on:** `scientific_name`
- **Unique value:** This dataset provides **specific insect-plant associations** — which insects visit which plants
- **The `attracts` field is mergeable** with XercesPollinator's `pollinators` field, though terminology differs
