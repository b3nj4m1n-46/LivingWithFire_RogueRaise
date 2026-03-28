# Data Dictionary: USDA_PLANTS

**Source ID:** `TAXON-03`
**Description:** USDA PLANTS Database complete US checklist. 93,157 records (48,994 accepted + 44,163 synonyms). Includes OR and CA state lists.
**Primary Join Key:** `symbol`

**Primary File:** `plants.csv` (93,157 records)

## Column Definitions

### `symbol` **[JOIN KEY]**
- **Definition:** USDA PLANTS symbol (e.g. ACMA3 for Acer macrophyllum)
- **Type:** text

### `synonym_symbol`
- **Definition:** If this record is a synonym, the accepted name's symbol
- **Type:** text *(nullable)*

### `scientific_name_full`
- **Definition:** Full scientific name with author
- **Type:** text

### `common_name`
- **Definition:** Common plant name (from national list or state-specific)
- **Type:** text

### `family`
- **Definition:** Taxonomic family
- **Type:** text

### `is_synonym`
- **Definition:** Whether this record is a synonym pointing to another accepted name
- **Type:** boolean

## Merge Guidance

- **Join on:** `symbol`
- **USDA Symbol:** Use USDA_PLANTS as the bridge to convert symbols to scientific names for merging with other datasets.
