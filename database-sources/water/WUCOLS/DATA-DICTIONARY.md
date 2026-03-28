# Data Dictionary: WUCOLS

**Source ID:** `WATER-01`
**Description:** UC Davis WUCOLS: Water Use Classification of Landscape Species. 4,103 plants across 6 CA climate regions.
**Primary Join Key:** `botanical_name`

**Primary File:** `plants.csv` (4,103 records)

## Column Definitions

### `type`
- **Definition:** Plant form: Tree, Shrub, Groundcover, Vine, Perennial, Palm, Succulent, Grass
- **Type:** categorical

### `botanical_name` **[JOIN KEY]**
- **Definition:** Full botanical name (may include synonyms in parentheses)
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

## Repeated Column Pattern

**Pattern:** Region N Water Use / Region N ET0 / Region N Plant Factor (for N = 1-6)

**Water Use Values:**
- `Very Low` — Minimal irrigation needed once established
- `Low` — Low supplemental water
- `Moderate` — Regular moderate irrigation
- `High` — Frequent irrigation required
- `Unknown` — Not enough data
- `Not Appropriate for this Region` — Species not suited to this climate zone

**Regions:**
- `Region 1` — North-Central Coastal (San Francisco, Monterey)
- `Region 2` — Central Valley (Sacramento, Fresno)
- `Region 3` — South Coastal (Los Angeles, San Diego)
- `Region 4` — South Inland (Riverside, inland valleys)
- `Region 5` — Low Desert (Palm Springs, Imperial Valley)
- `Region 6` — High Desert (Lancaster, high elevation desert)

## Merge Guidance

- **Join on:** `botanical_name`
- **NOTE:** Botanical name may include synonyms in parentheses. Strip parenthetical text before matching.
