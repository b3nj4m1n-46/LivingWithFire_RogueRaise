# World Flora Online (WFO) - Plant List

**Source:** World Flora Online Consortium
**URL:** https://www.worldfloraonline.org/
**Download:** https://zenodo.org/records/18007552
**Version:** December 2025
**Species:** 381,467 accepted species (from 1,657,866 total records)

## About

World Flora Online is an international collaborative effort to compile a comprehensive, open-access online flora of all known plant species. It serves as the successor to The Plant List and provides the most current accepted taxonomy for global plant species.

This is a **complementary taxonomy backbone** alongside POWO/WCVP. WFO provides independent taxonomic opinions and WFO identifiers that cross-reference with other global databases.

## Output vs. Source

The **raw source** (`Sources/`) contains the full WFO dump: 1,657,866 records including synonyms (1,022,626), unchecked names (182,073), and infraspecific ranks (varieties, subspecies, forms). The **output files** (`plants.csv`, `plants.db`) are filtered to **accepted species-rank records only** (381,467 species). All fields for accepted species are preserved as-is from the source — no trait data was dropped.

## Major Groups

| Group | Species Count |
|-------|-------------|
| Angiosperms (flowering plants) | 346,481 |
| Polypodiophyta (ferns) | 12,717 |
| Bryophyta (mosses) | 11,985 |
| Marchantiophyta (liverworts) | 7,320 |
| Lycopodiophyta (clubmosses) | 1,517 |
| Pinophyta (conifers) | 836 |
| Cycadophyta (cycads) | 384 |
| Anthocerotophyta (hornworts) | 226 |
| Ginkgophyta (ginkgo) | 1 |

## Top Families

| Family | Species Count |
|--------|-------------|
| Asteraceae | 34,557 |
| Orchidaceae | 31,468 |
| Fabaceae | 23,032 |
| Rubiaceae | 14,175 |
| Poaceae | 12,352 |
| Lamiaceae | 8,091 |
| Rosaceae | 6,018 |

## Data Fields

| Field | Description |
|-------|-------------|
| wfo_id | WFO unique identifier (e.g., wfo-0001302010) |
| scientific_name | Full binomial name |
| family | Plant family |
| subfamily | Subfamily (where applicable) |
| tribe | Tribe (where applicable) |
| genus | Genus name |
| specific_epithet | Species epithet |
| authors | Taxonomic authority |
| major_group | Group code (A = Angiosperms, etc.) |
| major_group_name | Full group name |
| nomenclatural_status | Nomenclatural status flags |
| references | Source URL |

## Files

- `plants.csv` - All 381,467 accepted species (large file)
- `plants.db` - SQLite database with indexed columns (family, genus, scientific_name, major_group)
- `scripts/build_data.py` - Parser for raw DwC backbone
- *JSON skipped due to file size — use CSV or SQLite*

## Sources

- `Sources/_DwC_backbone_R.zip` - Darwin Core backbone (121MB)
- `Sources/wfo_plantlist_2025-12.zip` - Catalogue of Life Data Package (130MB, kept as backup)
- `Sources/classification.csv` - Extracted DwC backbone (~954MB)

## Citation

WFO (2025). World Flora Online. Published on the Internet; http://www.worldfloraonline.org. Version December 2025.
