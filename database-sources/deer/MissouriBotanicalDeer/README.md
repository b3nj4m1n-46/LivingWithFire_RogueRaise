# Missouri Botanical Garden / Shaw Nature Reserve - Deer Resistant Native Plants

**Source:** Shaw Nature Reserve, Missouri Botanical Garden
**Plants:** 112 native species
**Region:** Wildwood, Missouri (heavy deer over-population)
**Methodology:** Three-year observational study

## About

This dataset documents actual deer browsing behavior observed over a three-year study conducted at Shaw Nature Reserve in Wildwood, Missouri, an area with heavy deer over-population. Unlike opinion-based lists, this data reflects real-world browsing patterns on native plants.

## Browse Scale (6 levels)

| Category | Count | Description |
|----------|-------|-------------|
| No Browse | 37 | Deer do not eat this plant |
| Very Light Browse (Tasted) | 18 | Deer taste but do not consume |
| Light Browse | 22 | Minor/occasional browsing |
| Medium Browse | 11 | Moderate browsing damage |
| Heavy Browse | 6 | Significant browsing |
| Complete Browse | 18 | Deer consume plant entirely |

## Data Fields

| Field | Description |
|-------|-------------|
| scientific_name | Binomial name |
| common_name | Common plant name |
| deer_browse | Browse category (6-level scale) |

## Files

- `plants.csv` - All 112 plants with browse ratings
- `plants.json` - JSON with metadata and scale definitions
- `plants.db` - SQLite database
- `scripts/parse_pdf.py` - Parser using pdfplumber

## Sources

- `Sources/MissouriBotanical_DeerBrowse.pdf` - Original handout

## Citation

Shaw Nature Reserve. "Native Plants for a Deer Resistant Garden." Missouri Botanical Garden, Wildwood, Missouri.
