# Data Dictionary: LBJ_Wildflower

**Source ID:** `NATIVE-01`
**Description:** Lady Bird Johnson Wildflower Center — Native Plants of North America. 593 plants native to OR, WA, and CA with full detail page data.
**Primary Join Key:** `scientific_name` or `usda_symbol`

## Column Definitions

#### `usda_symbol` **[JOIN KEY]**
- **Definition:** USDA PLANTS database symbol (e.g., ABGR for Abies grandis)
- **Type:** text
- **Nullable:** No
- **Note:** Links to USDA_PLANTS dataset and to LBJ detail page at `wildflower.org/plants/result.php?id_plant={usda_symbol}`

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text
- **Nullable:** No

#### `common_name`
- **Definition:** Common plant name
- **Type:** text
- **Nullable:** Yes — very sparse from collection pages; detail pages sometimes have it

#### `family`
- **Definition:** Botanical family (e.g., Aceraceae, Asteraceae)
- **Type:** text
- **Nullable:** Rare

#### `states`
- **Definition:** Which state collections this plant appears in
- **Type:** text (comma-separated)
- **Values:** `OR`, `CA`, `WA` (any combination)
- **Note:** A plant in both OR and WA would be "OR,WA"

#### `habit`
- **Definition:** Growth form
- **Type:** categorical
- **Values:** Tree, Shrub, Herb/Forb, Graminoid, Vine, Subshrub, Fern
- **Nullable:** Rare

#### `duration`
- **Definition:** Life cycle
- **Type:** categorical
- **Values:** Perennial, Annual, Biennial, or combinations (e.g., "Annual, Biennial")
- **Nullable:** Rare

#### `height`
- **Definition:** Mature height range
- **Type:** text (free form, e.g., "30-100 feet", "0.5-2 ft")
- **Nullable:** Yes (80% missing)
- **Note:** Inconsistent units — some in feet, some in inches

#### `spread`
- **Definition:** Mature width/spread
- **Type:** text (free form)
- **Nullable:** Yes (69% missing)

#### `light`
- **Definition:** Light requirements
- **Type:** text
- **Values:** Sun, Part Shade, Shade (or combinations like "Sun, Part Shade")
- **Nullable:** 3% missing

#### `water`
- **Definition:** Water use classification
- **Type:** text
- **Values:** Low, Medium, High (or combinations)
- **Nullable:** 40% missing

#### `soil_moisture`
- **Definition:** Preferred soil moisture conditions
- **Type:** text
- **Values:** Dry, Moist, Wet (or combinations)
- **Nullable:** 18% missing

#### `bloom_time`
- **Definition:** Months when plant blooms
- **Type:** text (comma-separated month names, e.g., "April, May, June")
- **Nullable:** 8% missing

#### `bloom_color`
- **Definition:** Flower color
- **Type:** text (e.g., "White", "Yellow", "Blue, Purple")
- **Nullable:** Rare

#### `leaf_retention`
- **Definition:** Evergreen or deciduous
- **Type:** categorical
- **Values:** Deciduous, Evergreen, Semi-evergreen
- **Nullable:** 53% missing

#### `native_status`
- **Definition:** USDA native status codes
- **Type:** text (e.g., "L48 (N), CAN (N)" meaning native to lower 48 and Canada)
- **Nullable:** No

#### `distribution`
- **Definition:** US states and Canadian provinces where found
- **Type:** text (comma-separated, e.g., "CA, OR, WA, ID, MT")
- **Nullable:** No

#### `habitat`
- **Definition:** Natural habitat description
- **Type:** text (free form, e.g., "Moist woods, stream banks below 5000 ft")
- **Nullable:** No

#### `wildlife`
- **Definition:** Wildlife value notes
- **Type:** text (free form)
- **Nullable:** 70% missing

#### `pollinator_value`
- **Definition:** Value to pollinators
- **Type:** text (e.g., "Special value to native bees")
- **Nullable:** Mostly missing

#### `propagation`
- **Definition:** How to propagate the plant
- **Type:** text (e.g., "Seeds, Softwood Cuttings")
- **Nullable:** 6% missing

## Merge Guidance

- **Join on:** `scientific_name` (primary) or `usda_symbol` (links to USDA_PLANTS)
- **Native status is positive-only:** Any plant in this dataset IS native to its listed states
- **Water/light map to production attributes:** `water` → "Water Amount", `light` → "Light Needs"
- **Bloom data maps to:** `bloom_time` → "Bloom Time", `bloom_color` → "Flower Color"
- **Habit maps to:** Plant Structure booleans (Tree, Shrub, Groundcover, Vine, etc.)
- **Height/spread are free-form text** — need parsing to extract numeric values for production "Min/Max Mature Height/Width"
- **Wildlife/pollinator data is sparse** — use as supplemental, not primary source

## Rating Scales

This dataset does not use rating scales — it provides factual trait data rather than ratings. All values are descriptive (categorical or free-form text).
