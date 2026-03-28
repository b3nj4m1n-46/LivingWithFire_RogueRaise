# Data Dictionary: OSU_DroughtTolerant

**Source ID:** `WATER-03`
**Description:** OSU Extension Top 5 Plants for Unirrigated Landscapes in Western Oregon. 24 cultivars from drought trials.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (24 records)

## Column Definitions

### `scientific_name` **[JOIN KEY]**
- **Definition:** Binomial Latin name with cultivar
- **Type:** text

### `common_name`
- **Definition:** Common plant name
- **Type:** text

### `group`
- **Definition:** Plant group from trial: Ceanothus, Cistus, Arctostaphylos, Grevillea, Groundcovers
- **Type:** categorical

### `height`
- **Definition:** Mature height
- **Type:** text

### `spread`
- **Definition:** Mature width
- **Type:** text

### `flower_color`
- **Definition:** Flower color
- **Type:** text

### `bloom`
- **Definition:** Bloom period
- **Type:** text

### `drought_tolerance`
- **Definition:** OSU trial rating
- **Type:** categorical
- **Values:**
  - `Excellent` — Survived without supplemental irrigation in Western OR trials

### `region`
- **Definition:** Geographic applicability
- **Type:** text

### `notes`
- **Definition:** Performance notes from trial
- **Type:** text

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
