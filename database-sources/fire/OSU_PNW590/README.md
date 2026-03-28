# OSU Extension PNW-590: Fire-resistant Plants for Home Landscapes

**Source:** Oregon State University Extension Service
**Publication:** PNW 590 (Revised October 2023)
**URL:** https://extension.oregonstate.edu/pub/pnw-590
**Plants:** 133 fire-resistant species recommended for Oregon/PNW landscapes

## About

This publication from Oregon State University Extension provides a curated list of fire-resistant plants suitable for home landscapes in the Pacific Northwest, with a focus on Oregon. Each plant was selected based on fire-resistant characteristics and suitability for PNW growing conditions.

The guide organizes plants into five categories:
- **Groundcovers** (19 plants) — Low-growing perennials, generally 12" or less
- **Perennials** (55 plants) — Herbaceous plants that survive 2+ years
- **Broadleaf Evergreens** (11 plants) — Evergreen shrubs and groundcovers
- **Shrubs** (25 plants) — Woody plants with multiple stems
- **Trees** (23 plants) — Ornamental and shade trees

## Regional Relevance

This is one of the most important datasets for our project because it is **specifically curated for Oregon and the Pacific Northwest**. The authors include OSU Extension horticulturists and fire specialists who selected plants based on:
- Fire-resistant characteristics (high moisture content, low resin, minimal dead material)
- Suitability for PNW climate zones
- Availability in local nurseries
- Native species where possible

## Data Fields

| Field | Description |
|-------|-------------|
| scientific_name | Binomial name (genus, species, cultivar where applicable) |
| common_name | Common plant name |
| category | Groundcover, Perennial, Broadleaf Evergreen, Shrub, or Tree |
| page | Page reference in the PDF |
| height | Mature height (from page text, approximate) |
| spread | Mature spread (from page text, approximate) |
| usda_zones | USDA hardiness zones |
| flower_color | Flower colors |
| bloom_time | Bloom season |
| water_use | Low, Moderate, or High (from page icons) |
| invasive_warning | True if the page mentions invasive concerns |

## Data Quality Notes

- Plant names extracted from the PDF index (pages 54-55) which has clean, structured data
- Trait data (height, spread, zones) enriched from individual plant pages; assigned to first plant on each page so may not match exactly for pages with multiple plants
- The PDF uses a visual card layout with photos, making precise per-plant trait extraction challenging
- Water use indicators (L/M/H icons) are not always captured from the visual layout
- Some entries have genus-only scientific names (e.g., "Achillea", "Berberis") indicating multiple species/cultivars are recommended

## Authors

Detweiler, A.J., Fitzgerald, S., Cowan, A., et al. Oregon State University Extension Service.

## Files

- `plants.csv` - All 133 plants with traits
- `plants.json` - JSON with source metadata
- `plants.db` - SQLite database
- `scripts/parse_pdf.py` - Parser using pdfplumber

## Sources

- `Sources/OSU_PNW590_FireResistantPlants.pdf` - Full 56-page publication

## Citation

Detweiler, A.J., Fitzgerald, S., Cowan, A., et al. 2023. Fire-resistant Plants for Home Landscapes: Reduce Wildfire Risk with Proper Plant Selection and Placement. PNW 590. Oregon State University Extension Service. https://extension.oregonstate.edu/pub/pnw-590
