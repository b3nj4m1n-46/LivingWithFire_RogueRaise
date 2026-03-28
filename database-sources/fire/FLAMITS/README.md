# FLAMITS - Global Plant Flammability Traits Database

**Source:** Ocampo-Zuleta, K., Pausas, J. G. & Paula, S. (2023). FLAMITS: A global database of plant flammability traits. *Global Ecology and Biogeography*. https://doi.org/10.1111/geb.13799
**Download:** https://datadryad.org/dataset/doi:10.5061/dryad.h18931zr3
**Data Collection Period:** 1961 to May 2023 (62.5 years of compiled research)
**Scope:** 1,790 plant taxa from 187 families, 884 genera across 39 countries and 12 biomes
**Records:** 19,972 flammability trait measurements from 295 studies

## About

FLAMITS is a comprehensive global database compiling experimentally measured plant flammability traits from published scientific literature. Each record consists of a flammability trait measurement for a given taxon, obtained from a specific study, location, and sampling period.

Flammability traits are organized into four dimensions plus an integrated measure:

| Dimension | Description | Records |
|-----------|-------------|---------|
| **Ignitability** | How easily a plant ignites (ignition frequency, time to flaming, temperature at flaming) | 6,997 |
| **Combustibility** | How intensely it burns (calorific value, flame height, temperature, energy release) | 7,103 |
| **Sustainability** | How long it burns (burning duration, flaming duration, rate of spread) | 4,110 |
| **Consumability** | How much biomass is consumed (burnt biomass %, total heat release) | 1,659 |
| **Integrated** | Composite flammability index combining multiple dimensions | 103 |

## Top Flammability Variables Measured

| Variable | Records |
|----------|---------|
| Time to flaming (s) | 4,140 |
| Calorific value (kcal/kg) | 2,048 |
| Burning duration (s) | 1,623 |
| Flaming duration (s) | 1,471 |
| Maximum flame temperature | 923 |
| Flame height (cm) | 899 |
| Ignition frequency (%) | 881 |
| Burnt biomass (%) | 864 |
| Maximum sample temperature | 813 |

## Growth Form Distribution

| Growth Form | Taxa |
|-------------|------|
| Tree | 912 |
| Shrub | 500 |
| Graminoid | 163 |
| Forb | 144 |
| Climber | 47 |
| Other (palm, moss, bamboo, lichen, epiphyte) | 17 |

## Database Structure

The dataset consists of 5 relational CSV files (semicolon-delimited, Latin-1 encoding):

- **data_file.csv** (19,972 rows, 33 cols) - Main flammability measurements. Each row = one trait measurement for one taxon from one study. Includes experimental details (burning device, ignition source, plant part, fuel type, moisture).
- **taxon_file.csv** (1,791 rows, 16 cols) - Taxonomic and ecological info per taxon (family, genus, species, lifespan, growth form, woodiness, leaf phenology, native distribution).
- **site_file.csv** (481 rows, 11 cols) - Study site details (country, lat/lon, biome, ecoregion, fire frequency).
- **source_file.csv** (396 rows, 4 cols) - Bibliographic references for each study.
- **synonymy_file.csv** (247 rows, 3 cols) - Maps original taxon names to standardized names.

Tables are linked by: `taxon_ID` (data <-> taxon), `source_ID` (data <-> source), `site_ID` (data <-> site), `original_name` (data <-> synonymy).

## Files

- `flamits.db` - SQLite database with all 5 source tables + variables lookup, indexed (taxon_name, var_name, flam_dimension, family, genus, species)
- `variables.csv` - Lookup table of all 40 flammability variables with units, dimension, and definitions (also loaded into flamits.db as the `variables` table)
- `scripts/build_db.py` - Script to import the source CSVs into SQLite
- `Sources/` - Original dataset files:
  - `doi_10_5061_dryad_h18931zr3__v20231222.zip` - Original downloaded archive
  - `data_file.csv`, `taxon_file.csv`, `site_file.csv`, `source_file.csv`, `synonymy__file.csv` - Extracted CSVs
  - `README.md` - Original dataset documentation with full variable definitions

## Citation

Ocampo-Zuleta, Korina; Pausas, Juli G.; Paula, Susana (2023). FLAMITS: FLAMmability plant traiTS database [Dataset]. Dryad. https://doi.org/10.5061/dryad.h18931zr3
