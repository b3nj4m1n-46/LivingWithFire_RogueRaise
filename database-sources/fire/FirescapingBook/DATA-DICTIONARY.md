# Data Dictionary: FirescapingBook

**Source ID:** `FIRE-08`
**Description:** Edwards & Schleiger 2023 "Firescaping Your Home" — extracted plant swap lists. Bad/noxious plants paired with fire-safe replacements.
**Primary Join Key:** `scientific_name`

## Files

### `bad_plants.csv` (180 records)

Plants identified as bad choices for fire-prone areas.

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

#### `common_name`
- **Definition:** Common plant name (UPPERCASE in source)
- **Type:** text

#### `swap_type`
- **Definition:** Why this plant is flagged
- **Type:** categorical
- **Values:**
  - `BAD OR NOXIOUS` — High flammability, invasive, or otherwise undesirable in fire-prone landscapes

#### `notes`
- **Definition:** Additional context from the book
- **Type:** text *(nullable)*

#### `categories`
- **Definition:** Plant size/form category from the book's organization
- **Type:** text
- **Examples:** "Medium Evergreen to Semi-Evergreen Trees", "Small Trees / Large Shrubs", "Groundcovers"

---

### `replacement_plants.csv` (424 records)

Recommended fire-safe replacement plants.

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name
- **Type:** text

#### `common_name`
- **Definition:** Common plant name (UPPERCASE in source)
- **Type:** text

#### `notes`
- **Definition:** Additional planting notes
- **Type:** text *(nullable)*

#### `categories`
- **Definition:** Plant size/form category
- **Type:** text

---

### `plant_swaps.csv` (999 records)

Complete swap pairings: each row maps a bad plant to its recommended replacement.

#### `page`
- **Definition:** Page number in the book
- **Type:** integer

#### `category`
- **Definition:** Section heading / plant size category
- **Type:** text

#### `swap_type`
- **Definition:** Type of bad plant being swapped out
- **Type:** categorical

#### `bad_scientific` / `bad_common` / `bad_notes`
- **Definition:** The plant being replaced (scientific name, common name, notes)
- **Type:** text

#### `replacement_scientific` / `replacement_common` / `replacement_notes`
- **Definition:** The recommended fire-safe replacement (scientific name, common name, notes)
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name` (in bad_plants.csv and replacement_plants.csv)
- **Unique value:** This dataset provides **plant swap recommendations** — not just ratings but specific alternatives. Cross-reference `bad_plants` against invasive databases and `replacement_plants` against native plant databases.
- **Normalization:** Common names are UPPERCASE — lowercase before matching with other datasets.
