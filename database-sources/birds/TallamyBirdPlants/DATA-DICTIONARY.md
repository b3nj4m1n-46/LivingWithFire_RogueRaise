# Data Dictionary: TallamyBirdPlants

**Source ID:** `BIRD-01`
**Description:** Tallamy's 20 most valuable native plant genera for bird-supporting biodiversity. Ranked by Lepidoptera species hosted.
**Primary Join Key:** `genus`

**Primary File:** `plants.csv` (42 records)

## Column Definitions

### `rank`
- **Definition:** Rank by number of Lepidoptera species supported (1 = most valuable)
- **Type:** integer

### `genus` **[JOIN KEY]**
- **Definition:** Plant genus name
- **Type:** text

### `common_name`
- **Definition:** Common name for the genus
- **Type:** text

### `lepidoptera_species`
- **Definition:** Number of Lepidoptera (moth + butterfly) species hosted
- **Type:** integer

### `type`
- **Definition:** Woody or Perennial
- **Type:** categorical

### `bird_value`
- **Definition:** Why this matters for birds
- **Type:** text

## Merge Guidance

- **Join on:** `genus`
- **NOTE:** This dataset is at genus level, not species. Join on genus name.
