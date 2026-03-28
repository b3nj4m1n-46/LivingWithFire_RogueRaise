# Firescaping Your Home - Plant Swap Tables

**Source:** Edwards, Adrienne and Schleiger, Rachel. 2023. *Firescaping Your Home: A Manual for Readiness in Wildfire Country.* Timber Press, Portland, Oregon.
**Records:** 999 swap mappings (180 bad/noxious plants → 424 native replacements)
**Region:** Western US (California, Oregon, Washington)

## About

This dataset extracts the "BAD OR NOXIOUS PLANTS" / "PLANT INSTEAD" tables from throughout the book. These tables are organized by plant category (large trees, medium trees, small trees, shrubs, groundcovers, perennials, vines, grasses, ferns, succulents) and provide actionable swap recommendations: which invasive/noxious/problematic plants to remove and which native plants to replace them with.

The book covers the wildland-urban interface (WUI) in the western US, with a focus on California, Oregon, and Washington. The replacement plants are all native species selected for fire resilience and habitat value.

## Data Structure

### plant_swaps.csv (primary)
Each row is one bad→replacement mapping.

| Field | Description |
|-------|-------------|
| page | PDF page number |
| category | Plant category context (e.g., "Large Deciduous Trees") |
| swap_type | "BAD OR NOXIOUS" or "POOR" |
| bad_scientific | Scientific name of the plant to remove |
| bad_common | Common name of the plant to remove |
| bad_notes | Notes (e.g., "invasive in riparian areas", "seeds toxic to birds") |
| replacement_scientific | Scientific name of the native replacement |
| replacement_common | Common name of the native replacement |
| replacement_notes | Notes on the replacement |

### bad_plants.csv
Unique list of 180 plants identified as bad, noxious, or poor for fire-prone landscapes.

### replacement_plants.csv
Unique list of 424 native plants recommended as fire-resilient replacements.

## Key Insights

- Many bad plants are common ornamentals (Norway Maple, English Holly, Black Locust, etc.)
- Replacement plants are western US natives selected for both fire resilience AND habitat value
- Notes include important context: invasiveness, toxicity, fire risk factors
- One bad plant often maps to multiple replacement options, giving homeowners flexibility

## Data Quality Notes

- Category detection from PDF text parsing may not capture all chapter context accurately
- Some multi-plant cells may have parsing artifacts from line-break splitting
- Common names are in ALL CAPS in the source; preserved as-is for traceability

## Files

- `plant_swaps.csv` - All 999 bad→replacement mappings
- `bad_plants.csv` - 180 unique bad/noxious plants
- `replacement_plants.csv` - 424 unique native replacement plants
- `plant_swaps.json` - Combined JSON export
- `plant_swaps.db` - SQLite database with indexed queries
- `scripts/parse_pdf.py` - Parser using pdfplumber

## Sources

- `Sources/Firescaping_Your_Home_-_Adrienne_Edwards_Rachel_Schleiger.pdf` - Full 406-page book

## Citation

Edwards, A. and Schleiger, R. 2023. *Firescaping Your Home: A Manual for Readiness in Wildfire Country.* Timber Press, Portland, Oregon. ISBN 978-1-64326-136-2.
