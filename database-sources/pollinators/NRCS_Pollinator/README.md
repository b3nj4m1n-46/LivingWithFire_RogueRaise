# NRCS / Heather Holm - Pollinator & Beneficial Insect Plant Resources

**Source:** NRCS + Heather Holm (pollinatorsnativeplants.com) + Marion County SWCD
**URL:** https://www.pollinatorsnativeplants.com/resources.html
**Extracted Data:** 32 wildflower species + 29 trees/shrubs + 46 monarch plants
**Source PDFs:** 10 documents covering pollinator plants, soil-specific recommendations, and monarch habitat

## About

This collection combines multiple pollinator-focused plant resources linked from the NRCS pollinator conservation page. The primary data comes from Heather Holm's research and publications on native plants for pollinators.

## Extracted Datasets

### 1. Wildflowers for Beneficial Insects (32 plants)
**File:** `plants.csv`
**Source PDF:** `marioncountyswcd-wildflowers-for-beneficial-insects.pdf`
**Data:** Scientific name, common name, pollen/nectar type, and a matrix of 13 beneficial insect types attracted (lacewings, syrphid flies, tachinid flies, soldier beetles, wasps, bees, etc.)

### 2. Native Trees & Shrubs for Pollinators (29 plants)
**File:** `trees_shrubs_pollinators.csv`
**Source PDF:** `treesshrubs1.pdf`
**Data:** Scientific name, common name, plant type (canopy tree/tall tree/shrub), flower color, moisture, height, bloom period, and pollinator types

### 3. Monarch Butterfly Plants (46 plants)
**File:** `monarch_plants.csv`
**Source PDF:** `monarchbutterfly_1.pdf`
**Data:** Nectar plants and host plants (milkweeds) for monarch butterflies. Extraction from text layer — some common name pairing is imperfect.

## Image-Only Posters (Not Yet Extracted)

These PDFs are visual posters with plant names embedded as images. They contain valuable soil-specific native plant recommendations but require OCR or manual transcription:

| PDF | Content |
|-----|---------|
| `clay_1.pdf` | Native plants for clay soil (10 species extracted from text layer) |
| `sand_1.pdf` | Native plants for sandy soil (image only) |
| `shade_1.pdf` | Native plants for shade (image only) |
| `moist_1.pdf` | Native plants for moist conditions (image only) |
| `loam_1.pdf` | Native plants for loam soil (image only) |
| `bumblebeeplantlist.pdf` | Bumble bee banquet plant list (image only) |

## Files

- `plants.csv` - 32 wildflowers for beneficial insects
- `trees_shrubs_pollinators.csv` - 29 native trees/shrubs for pollinators
- `monarch_plants.csv` - 46 monarch butterfly plants
- `plants.db` - SQLite with `plants` and `trees_shrubs_pollinators` tables
- `scripts/build_treesshrubs.py` - Trees/shrubs data builder

## Sources (10 PDFs)

All in `Sources/` folder — see file listing above.

## Citation

Holm, H. "Native Trees & Shrubs for Pollinators." pollinatorsnativeplants.com.
Marion County Soil & Water Conservation District. "Wildflowers for Beneficial Insects."
USDA NRCS. "Resources to Help Pollinators." https://www.nrcs.usda.gov/resources/guides-and-instructions/resources-to-help-pollinators
