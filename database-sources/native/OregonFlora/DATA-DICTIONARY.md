# Data Dictionary: OregonFlora

**Source ID:** `NATIVE-02`
**Description:** Oregon Flora Project — Flora of Oregon supplementary data. 355 accepted taxa not in the printed Flora volumes + 59 taxonomic changes since publication.
**Primary Join Key:** `scientific_name`

## Files

### `plants.csv` (355 records)

Taxa accepted by Oregon Flora but not treated in the printed Flora of Oregon volumes.

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name (accepted name)
- **Type:** text

#### `family`
- **Definition:** Taxonomic family
- **Type:** text

#### `group`
- **Definition:** Major taxonomic group
- **Type:** categorical
- **Values:**
  - `Dicotyledons` — Dicots (two seed leaves)
  - `Monocotyledons` — Monocots (one seed leaf)
  - `Pteridophytes` — Ferns and fern allies

#### `origin`
- **Definition:** Whether native or exotic to Oregon
- **Type:** categorical
- **Values:**
  - `native` — Native to Oregon
  - `exotic, naturalized` — Non-native, established in Oregon
  - `exotic, not naturalized` — Non-native, not established
  - `exotic, waif` — Non-native, occasional/temporary

#### `comments`
- **Definition:** Taxonomic or distributional notes
- **Type:** text *(nullable)*

#### `source`
- **Definition:** Which supplementary file this record came from
- **Type:** categorical
- **Values:**
  - `AcceptedTaxa_NotTreatedInFlora` — Taxa not in printed volumes

---

### `taxonomic_changes.csv` (59 records)

Taxonomic revisions since Flora of Oregon publication.

#### `scientific_name` **[JOIN KEY]**
- **Definition:** Current/revised scientific name
- **Type:** text

#### `family`
- **Definition:** Taxonomic family
- **Type:** text

#### `group`
- **Definition:** Major taxonomic group
- **Type:** categorical

#### `was_status`
- **Definition:** Previous taxonomic status in Flora of Oregon
- **Type:** text

#### `now_status`
- **Definition:** Current revised status
- **Type:** text
- **Examples:** "misapplied to Acorus americanus", "synonym of Carex arcta", "Added to Oregon flora"

#### `flora_page`
- **Definition:** Page reference in Flora of Oregon volumes
- **Type:** text

#### `source`
- **Definition:** Always "Flora_ChangeSincePublication"
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **The `origin` field is key** — use it to flag which plants are native vs exotic in Oregon
- **The `taxonomic_changes.csv`** is useful for updating old names in other datasets — if a plant was "misapplied to X", the old name should be mapped to X
- **Cross-reference with:** USDA_PLANTS (plants_oregon.csv) for the full Oregon checklist; this dataset adds taxa that Oregon Flora accepts but USDA may not list
