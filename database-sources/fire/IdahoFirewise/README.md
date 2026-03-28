# Idaho Firewise Garden Plant Database

**Source:** Idaho Firewise (idahofirewise.org)
**Location:** 2355 N Old Penitentiary Rd., Boise, ID
**Last Updated:** January 2026
**Plants:** 379 species and cultivars evaluated for fire performance
**Partners:** State Farm Insurance, College of Western Idaho, Plant Select

## About

The Idaho Firewise Garden is a demonstration garden for Southern Idaho that evaluates landscape plants for fire performance. It showcases firewise plants and maintenance techniques that help protect homes from wildfire. Some species are duplicated to compare plant performance between different growers.

Unlike the Fire Performance Plants Selector (source #1), this database does not assign explicit fire ratings. Inclusion in the garden itself indicates a plant is being evaluated for firewise suitability.

## Firewise Plant Selection Criteria

The Idaho Firewise program identifies specific plant attributes that affect flammability:

### Attributes that DECREASE flammability
- High moisture content
- Low oil or resin content
- High soap, latex, or pectin content
- Compact growth form
- Green stems
- Drought tolerant
- Low growth form

### Attributes that INCREASE flammability
- High oil or resin content
- Low moisture content
- Tall growth form
- Open growth form
- Fine woody (twiggy) stems

### Fire Resistance by Plant Type (most to least resistant)
1. Succulents (most fire resistant)
2. Ground Covers
3. Turf Grasses
4. Annuals
5. Perennials
6. Deciduous Trees
7. Shrubs
8. Ornamental Grasses
9. Conifers (least fire resistant / most flammable)

## Landscaping Zones

The Idaho Firewise program defines three zones around a structure. Fire travels faster uphill, so distances should be increased on slopes.

- **Zone 1 (0-5 ft):** Non-combustible zone. Use firewise plants only. Use rock mulches. Nothing flammable against the structure.
- **Zone 2 (5-30 ft):** Reduce plant density. Use firewise plants only, avoid conifers. Integrate hardscape or rock mulch. Remove all dead plant material. Create manageable turf areas.
- **Zone 3 (30-100+ ft):** Thin existing plants. Prune tree limbs 6-10 feet high. Minimize overlap between trees and shrubs. Native plantings (including sagebrush) should be thinned and pruned. Sagebrush is flammable due to oil content and should not be in Zone 1 or 2.

## Key Firewise Landscaping Tips

- Avoid plants with volatile oils and resins (pine, spruce, juniper, arborvitae, sagebrush)
- Choose plants that use less water, are naturally smaller, and don't drop flammable material
- Use fire-resistant mulch (sand, gravel, decomposed granite) at 3" depth; create troughs at plant bases
- Fertilizers are not needed for firewise plants and are not used in the garden
- Many native plants have good fire resistance if watered appropriately during growing season
- Mowing turfgrass decreases flammability
- A well-maintained lawn can be a good firewise landscape choice
- Remove dead branches, plants, and weeds; prune back and thin trees, shrubs, and perennials
- Clean out gutters and rake up leaves

## Data Fields

| Field | Description |
|-------|-------------|
| plant_type | Category: Annual, Bulb, Grass, Groundcover, Perennial, Shrub, Shrub/Tree, Tree, Vine |
| scientific_name | Binomial name (genus + species), cultivar stripped out |
| cultivar | Cultivar name if present (extracted from quotes in botanical name) |
| botanical_name_raw | Original botanical name string as it appeared in the PDF |
| common_name | Common plant name |
| total_on_site | Number of specimens on site (may include "+" for established colonies) |
| grower_source | Nursery or source where the plant was obtained |
| comments | Notes on performance, planting location, or care |

## Plant Type Distribution

| Type | Count |
|------|-------|
| Perennial | 161 |
| Groundcover | 93 |
| Shrub | 69 |
| Bulb | 23 |
| Vine | 10 |
| Tree | 9 |
| Shrub/Tree | 7 |
| Grass | 6 |
| Annual | 1 |

## Files

- `plants.csv` - Flat CSV with all fields (379 rows)
- `plants.json` - JSON array of plant objects
- `plants.db` - SQLite database with indexes on scientific_name and plant_type
- `scripts/parse_pdf.py` - Parser that extracts table data from the PDF using pdfplumber

## Sources

All source PDFs are stored in the `Sources/` subfolder:

- `Idaho-Firewise-Garden-Plant-Database_Web_2026.pdf` - The main plant database (18 pages, 379 plants). Primary data source for the CSV/JSON/SQLite exports.
- `Trifold-Firewise-for-Idaho_V2021.pdf` - Two-page trifold brochure with firewise plant attributes, landscaping tips, and 18 featured plant cards with specific firewise traits (moisture content, soap/pectin content, drought tolerance, hardiness zones).
- `Idaho-Firewise-Garden-Signage.pdf` - 21-page document of garden signage including landscaping zone diagrams, fire resistance by plant type chart, mulch guidance, native plant recommendations, green roof information, and individual plant signs with firewise attributes.
