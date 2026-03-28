# UC Forest Products Laboratory - Fire-Safe and Fire-Unsafe Plant Lists

**Source:** Fire Safe Council for Monterey County (FSCMC)
**URL:** https://www.firesafemonterey.org/plant-lists.html
**Original Data:** University of California's Forest Products Laboratory (July 1997)
**Plants:** 164 species (147 fire-resistant, 17 highly flammable)
**References:** 57 published sources reviewed

## About

This dataset is a literature review compiled by the University of California's Forest Products Laboratory. Rather than experimental testing, plants were rated based on how many published references classified them as fire-resistant or highly flammable. Only plants cited in 3 or more references were included.

- **Table 1 (Fire-Resistant):** Plants recommended for use in fire-prone environments by at least 3 references, given high or moderate fire resistance ratings.
- **Table 2 (Highly Flammable):** Plants that are definitely not recommended for planting in high fire hazard zones, cited in 3+ references as flammable.

**Important caveats from the source:**
- A plant's fire performance can be seriously compromised if not maintained
- The text and tables were taken from other sources with little modification; accuracy has not been independently confirmed by FSCMC
- Some plants may be fire-resistant but have other negative characteristics (see invasive flag below)

## Invasive Species Flag (*!*)

Plants marked with `*!*` in the original data are considered **invasive or have other negative characteristics** that should be considered before selection, even if they are fire-resistant. These are captured in the `invasive` column (True/False). 14 plants are flagged:

- *Arctotheca calendula* (Silver spreader)
- *Atriplex semibaccata* (Saltbush)
- *Coprosma kirkii* (Creeping coprosma)
- *Gazania ringens leucolaena* (Trailing gazania)
- *Gazania uniflora* (Trailing gazania)
- *Ligustrum texanum* (Texas privet)
- *Malephora crocea* (Croceum ice plant)
- *Myoporum parvifolium prostrata* (Creeping boobyalla)
- *Nerium oleander* (Oleander)
- *Phyla nodiflora* (Lippia)
- *Pyracantha 'Santa Cruz'* (Firethorn)
- *Schinus molle* (Peruvian pepper tree)
- *Schinus terebinthifolius* (Brazilian pepper tree)
- *Vinca major* (Periwinkle)

## Data Fields

| Field | Description |
|-------|-------------|
| scientific_name | Binomial/taxonomic name (*!* invasive marker stripped; see `invasive` column) |
| common_name | Common plant name |
| plant_type | evergreen, deciduous, perennial, succulent, bulb |
| plant_form | shrub, groundcover, tree, vine, grass, creeper |
| fire_rating | Fire-Resistant or Highly Flammable |
| invasive | True if marked *!* in original source (invasive or other negative characteristics) |
| references | Comma-separated reference numbers (cross-reference with references.csv) |

## Distributions

### Fire Rating
| Rating | Count |
|--------|-------|
| Fire-Resistant | 147 |
| Highly Flammable | 17 |

### Plant Type
| Type | Count |
|------|-------|
| Evergreen | 78 |
| Perennial | 42 |
| Succulent | 27 |
| Deciduous | 11 |

### Plant Form
| Form | Count |
|------|-------|
| Shrub | 71 |
| Groundcover | 56 |
| Tree | 28 |
| Vine | 4 |
| Grass | 3 |

## Files

- `plants.csv` - All 164 plants with fire rating, invasive flag, and reference numbers
- `references.csv` - All 57 literature references with author, title, year, publisher, and summary of how each defines fire resistance
- `plants.json` - Combined JSON with both plants and references arrays
- `plants.db` - SQLite database with `plants` and `references_list` tables, indexed on scientific_name, fire_rating, and plant_type
- `scripts/parse_html.py` - Parser that extracts tables from the saved HTML

## Sources

Source HTML is stored in the `Sources/` subfolder:

- `firesafemonterey.org plant list.html` - Saved webpage from Fire Safe Council for Monterey County containing both plant tables and the full reference list

## Citation

Fire Safe Council for Monterey County. "Fire-Safe and Fire-Unsafe Plant Lists." https://www.firesafemonterey.org/plant-lists.html. Based on data from University of California Forest Products Laboratory, July 1997.
