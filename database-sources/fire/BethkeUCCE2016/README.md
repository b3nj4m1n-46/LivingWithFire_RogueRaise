# Bethke et al. 2016 - UCCE San Diego Literature Review

**Source:** Bethke, J.A., Bell, C.E., Gonzales, J.G., Lima, L.L., Long, A.J., and McDonald, C.J. 2016. "Research Literature Review of Plant Flammability Testing, Fire-Resistant Plant Lists and Relevance of a Plant Flammability Key for Ornamental Landscape Plants in the Western States." University of California Cooperative Extension, County of San Diego.
**URL:** https://ucanr.edu/sites/SaratogaHort/files/235710.pdf
**Funding:** Saratoga Horticulture Research Endowment Award
**Project Duration:** June 2014 - December 2015

## About

This is a comprehensive literature review of plant flammability research, testing methods, and fire-resistant plant lists in California and the Western United States. The paper:

1. Reviews 20 years of plant flammability research and testing methodologies
2. Analyzes the state of fire-resistant plant lists in California
3. Compiled **53 plant lists** from **85 sources** into a cumulative database of **2,572 plant records**
4. Identified **50 trait codes** used across the various plant lists
5. Found that existing lists lack standardization, scientific definitions, and consistency

### Key Findings

- No standardized test or decision key exists for determining plant flammability in California or the western US
- Plant flammability has four components: **ignitability**, **combustibility**, **consumability**, and **sustainability**
- Flammability is influenced by both physical structure (branch size, leaf size/shape, dead material retention) and physiological elements (volatile oils/resins, moisture content, mineral content)
- Of the 2,572 plants in their database, many recommended as "fire-resistant" have never been evaluated for combustion characteristics
- Common names used without scientific names made cross-referencing difficult
- Most lists failed to provide adequate data on criteria used or source materials

## Appendix I: Plant Database (NOT YET LOCATED)

The paper references an accompanying Excel file: **"Appx I_California Fire-Resistant Plant Lists Database.xlsx"** containing 2,572 plant records compiled from 53 California fire-resistant plant lists. This file is referenced on page 19 of the PDF but has not been located as a standalone download.

**If this Excel file can be found, it would be a highly valuable dataset** — it cross-references plant species across 53 different fire-resistant plant lists with trait codes and source attributions.

## Data Extracted

### Trait Codes (Appendix IV)
50 trait codes used in the plant lists database, covering:
- Sun/shade preferences (FS, FS-PS, FSh)
- Water use levels (VLWU, LWU, MWU)
- Wildlife value (BF = butterflies, B = birds)
- Deer resistance (DR)
- Regional suitability (C = Coast, D = Desert, I = Inland, M = Mountain)
- Growth characteristics, erosion control, and more

### Plant List Sources (Appendix II)
Citations and notes for the 53+ plant lists reviewed, including how each source defines "fire-resistant" or "fire-retardant" — valuable for understanding the inconsistencies across lists.

## Data Fields

### trait_codes.csv
| Field | Description |
|-------|-------------|
| code | Abbreviation used in the plant database |
| trait | Full description of what the code means |
| list_source | Which plant list(s) use this code |

### plant_list_sources.csv
| Field | Description |
|-------|-------------|
| citation | Publication citation(s) |
| notes | How the source defines fire resistance and other methodology notes |

## Files

- `trait_codes.csv` - 50 trait codes with descriptions and source attribution
- `plant_list_sources.csv` - Plant list source citations with methodology notes
- `data.json` - Combined JSON with trait codes and sources
- `data.db` - SQLite database with `trait_codes` and `plant_list_sources` tables
- `appendices_text.txt` - Raw extracted text from Appendix II-IV pages
- `scripts/parse_pdf.py` - Parser that extracts structured data from the PDF

## Sources

Source PDF is stored in the `Sources/` subfolder:

- `Research Literature Review of Plant Flammability Testing, Fire-resistant plant lists and relevance of a plant flammability key for ornamental landscape plants in the Western States.pdf` - The full 33-page paper

## Citation

Bethke, J.A., Bell, C.E., Gonzales, J.G., Lima, L.L., Long, A.J., and McDonald, C.J. 2016. Research Literature Review of Plant Flammability Testing, Fire-Resistant Plant Lists and Relevance of a Plant Flammability Key for Ornamental Landscape Plants in the Western States. Final Report. University of California Cooperative Extension, County of San Diego. https://ucanr.edu/sites/SaratogaHort/files/235710.pdf
