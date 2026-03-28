# Diablo Firesafe Council - Fire-Resistant & Highly Flammable Plant Lists

**Source:** Diablo Firesafe Council
**Based on:** University of California Forest Products Laboratory methodology (July 1997)
**Plants:** 140 extracted (106 fire-resistant, 34 highly flammable)
**References:** 57 published sources reviewed (same reference numbering as UCForestProductsLab/FireSafe Monterey)

## About

This document from the Diablo Firesafe Council contains two plant tables based on the UC Forest Products Laboratory's literature review methodology:

- **Table 1 (Fire-Resistant):** Plants recommended for use in fire-prone environments by at least 3 references, given high or moderate fire resistance ratings.
- **Table 2 (Highly Flammable):** Plants with unfavorable fire performance ratings in 3+ references. Not recommended for planting in high fire hazard zones.

The reference list (57 sources) uses the same numbering system as the FireSafe Monterey (UCForestProductsLab) dataset, confirming shared origins in the UC Forest Products Lab 1997 compilation.

**Important caveats from the source:**
- A plant's fire performance can be seriously compromised if not maintained
- Plants not properly irrigated, pruned, or planted in inappropriate climate zones will have increased fire risk
- Some plants may have invasive or other negative characteristics (the original document indicates these with a symbol that was lost in PDF extraction)

## Relationship to Other Datasets

This dataset shares methodology and reference numbering with:
- **UCForestProductsLab** (FireSafe Monterey) — same 57 references, same "3+ references" criteria, similar plant lists. The Monterey version includes `*!*` invasive markers that this version lacks.
- **OaklandFireSafe** — also references Diablo FireSafe Council as one of its sources

## Data Fields

| Field | Description |
|-------|-------------|
| scientific_name | Binomial/taxonomic name |
| common_name | Common plant name |
| plant_type | evergreen, deciduous, perennial, succulent, bulb |
| plant_form | shrub, groundcover, tree, vine, grass, creeper |
| fire_rating | Fire-Resistant or Highly Flammable |
| references | Comma-separated reference numbers (cross-reference with references.csv) |

## Data Quality Notes

- PDF table extraction produced some parsing artifacts (empty plant_form fields, duplicated form values) due to multi-line cell layouts in the original PDF
- The intro text references an invasive species symbol ("indicated as...") but the symbol was lost in PDF encoding — cross-reference with UCForestProductsLab dataset for invasive flags
- 140 plants extracted; the original may contain more that were lost to multi-line parsing issues

## Files

- `plants.csv` - All 140 plants with fire ratings and reference numbers
- `references.csv` - All 57 reference sources with author, title, year, publisher, and methodology summaries
- `plants.json` - Combined JSON with plants and references
- `plants.db` - SQLite database with `plants` and `references_list` tables
- `scripts/parse_pdf.py` - Parser using pdfplumber

## Sources

- `Sources/Diablo Firesafe Council List.pdf` - Full 21-page document

## Citation

Diablo Firesafe Council. Fire-Resistant and Highly Flammable Plant Lists. Based on University of California Forest Products Laboratory, July 1997.
