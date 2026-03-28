# USDA NRCS PLANTS Database - Complete Checklist

**Source:** USDA Natural Resources Conservation Service
**URL:** https://plants.sc.egov.usda.gov/downloads
**Records:** 93,157 (48,994 accepted names + 44,163 synonyms)
**Families:** 548
**Scope:** All vascular plants, mosses, liverworts, hornworts, and lichens of the US and territories

## About

The USDA PLANTS Database is the authoritative federal reference for US plant taxonomy. This is the complete checklist download — every plant symbol, scientific name, common name, and family classification in the database.

This serves as the **US-specific taxonomy backbone** for cross-referencing all other datasets in the LivinWitFire project. The USDA plant symbols are used across federal and state land management programs.

## Output vs. Source

The **output files** contain ALL 93,157 records as-is from the USDA download, with an added `is_synonym` flag to distinguish accepted names from synonyms (records with a `synonym_symbol` value are synonyms pointing to the accepted name in the `symbol` field).

## Top Families (accepted names)

| Family | Count |
|--------|-------|
| Asteraceae | 4,891 |
| Fabaceae | 3,809 |
| Poaceae | 3,072 |
| Rosaceae | 1,519 |
| Cyperaceae | 1,432 |
| Scrophulariaceae | 1,384 |
| Brassicaceae | 1,266 |

## Data Fields

| Field | Description |
|-------|-------------|
| symbol | USDA plant symbol (unique identifier) |
| synonym_symbol | If populated, this name is a synonym; value is the accepted symbol |
| scientific_name_full | Full scientific name with authority |
| common_name | National common name |
| family | Plant family |
| is_synonym | True if this record is a synonym |

## State Lists

| State | Total Records | Accepted | Synonyms |
|-------|-------------|----------|----------|
| Oregon | 17,890 | 7,132 | 10,758 |
| California | 25,790 | 11,828 | 13,962 |

## Files

- `plants.csv` - All 93,157 national records
- `plants_oregon.csv` - 17,890 Oregon state records
- `plants_california.csv` - 25,790 California state records
- `plants.db` - SQLite with `plants`, `plants_oregon`, `plants_california` tables
- *JSON skipped — dataset too large*

## Sources

- `Sources/USDA_PLANTS-Checklist.txt` - Complete national checklist (6.6 MB)
- `Sources/Oregon_NRCS_csv.txt` - Oregon state list
- `Sources/California_NRCS_csv.txt` - California state list

## Citation

USDA, NRCS. 2025. The PLANTS Database. National Plant Data Team, Greensboro, NC USA. https://plants.usda.gov
