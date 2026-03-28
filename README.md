# LivinWitFire — Plant Data Collection for Fire-Wise Landscaping

A curated collection of **40 plant databases** containing **866,000+ records** for building a fire-wise, wildlife-friendly, drought-tolerant plant selection tool for the Pacific West (Oregon, California, Washington).

## What Is This?

This folder contains raw and processed plant data harvested from federal agencies, universities, extension services, conservation organizations, and scientific databases. Each subfolder is a self-contained dataset with standardized outputs, original sources, and documentation.

The data spans **8 categories** relevant to fire-safe landscaping:

| Category | Datasets | Key Question Answered |
|----------|----------|----------------------|
| 🔥 Fire Resistance | 10 | Is this plant fire-resistant or flammable? |
| 🦌 Deer Resistance | 6 | Will deer eat this plant? |
| 🌱 Plant Traits & Taxonomy | 5 | What are its growing requirements? |
| 💧 Water Need & Drought | 4 | How much water does it need? |
| 🐝 Pollinators | 4 | Does it support bees, butterflies, hummingbirds? |
| 🐦 Birds & Wildlife | 1 | Does it support bird populations? |
| 🌿 Native Plants | 5 | Is it native to Oregon/California/Washington? |
| ⚠️ Invasiveness | 5 | Is it invasive or noxious? |

## How the Data Is Organized

### Folder Structure

All 40 source datasets live under `database-sources/`, organized by category:

```
database-sources/
├── fire/                  # 12 fire resistance datasets
├── deer/                  # 6 deer resistance datasets
├── traits/                # 2 plant trait datasets
├── taxonomy/              # 3 taxonomy backbones
├── water/                 # 3 water/drought datasets
├── pollinators/           # 3 pollinator datasets
├── birds/                 # 2 bird/wildlife datasets
├── native/                # 4 native plant datasets
└── invasive/              # 5 invasiveness datasets
```

Every individual dataset follows the same pattern:

```
database-sources/<category>/DatasetName/
├── README.md              # What it is, where it came from, field definitions
├── DATA-DICTIONARY.md     # Column definitions, rating scales, merge keys
├── plants.csv             # Primary output — flat CSV, UTF-8
├── plants.json            # JSON with metadata and scale definitions
├── plants.db              # SQLite database with indexes
├── scripts/               # Parser/builder scripts (Python, reproducible)
│   └── parse_pdf.py       # or build_data.py, scrape_all.py, etc.
└── Sources/               # Original source files (PDFs, XLSX, HTML)
    └── original_file.pdf
```

### Standard Output Formats

| Format | File | Use Case |
|--------|------|----------|
| **CSV** | `plants.csv` | Universal — opens in Excel, imports into any database, readable by any language |
| **JSON** | `plants.json` | Includes metadata (source URL, rating scale definitions, methodology notes) + plant data |
| **SQLite** | `plants.db` | Queryable database with indexes — fastest for cross-referencing and filtering |

### Large Datasets

Three datasets exceed 100K records and skip JSON output due to file size:
- `database-sources/taxonomy/POWO_WCVP` (362,739 species) — use CSV or SQLite
- `database-sources/taxonomy/WorldFloraOnline` (381,467 species) — use CSV or SQLite
- `database-sources/taxonomy/USDA_PLANTS` (93,157 records) — use CSV or SQLite

### Naming Conventions

- `plants.csv` — primary plant list output
- `plants_full.csv` — all columns when a simplified version also exists
- `plants_oregon.csv` / `plants_california.csv` — state-specific subsets
- `plants_enriched.csv` — plant list with detail page data merged in
- `references.csv` — source references (for literature-review datasets)
- `variables.csv` — variable/trait definitions (for scientific databases)
- `taxonomic_changes.csv` — nomenclatural updates

## Quick Start

### Find fire-resistant plants for Oregon

```sql
-- In any SQLite browser, open database-sources/fire/FirePerformancePlants/plants.db
SELECT scientific_name, common_name, firewise_rating, landscape_zone
FROM plants
WHERE firewise_rating = 'Firewise (1)'
ORDER BY common_name;
```

### Find plants that are fire-safe AND deer-resistant

```python
import sqlite3

fire_db = sqlite3.connect('database-sources/fire/FirePerformancePlants/plants.db')
deer_db = sqlite3.connect('database-sources/deer/RutgersDeerResistance/plants.db')

fire_plants = set(r[0].lower() for r in fire_db.execute(
    "SELECT scientific_name FROM plants WHERE firewise_rating LIKE '%Firewise (1)%'"))
deer_plants = set(r[0].lower() for r in deer_db.execute(
    "SELECT scientific_name FROM plants WHERE deer_rating_code = 'A'"))

both = fire_plants & deer_plants
print(f"Fire-safe AND rarely damaged by deer: {len(both)} species")
```

### Check if a plant is invasive

```sql
-- Check database-sources/invasive/USGS_RIIS/plants.db (most comprehensive — 4,918 species)
SELECT scientific_name, common_name, degree_of_establishment, locality
FROM plants
WHERE scientific_name LIKE '%Hedera%';
```

### Find low-water plants for California

```sql
-- database-sources/water/WUCOLS/plants.db — 4,103 plants with regional water ratings
SELECT scientific_name, common_name, plant_type,
       region_4_water_use AS south_coastal,
       region_6_water_use AS north_coastal_bay
FROM plants
WHERE region_4_water_use IN ('Very Low', 'Low')
ORDER BY scientific_name;
```

## Complete Dataset Inventory

| Folder | Records | Category | Source |
|--------|---------|----------|--------|
| `database-sources/fire/FirePerformancePlants` | 541 | 🔥 Fire | SREF Fire Performance Plants Selector |
| `database-sources/fire/IdahoFirewise` | 379 | 🔥 Fire | Idaho Firewise Garden Plant Database |
| `database-sources/fire/FLAMITS` | 40 vars | 🔥 Fire | Global Plant Flammability Traits Database |
| `database-sources/fire/NIST_USDA_Flammability` | 34 | 🔥 Fire | NIST/USDA/Forest Service (34 shrubs tested) |
| `database-sources/fire/UCForestProductsLab` | 164 | 🔥 Fire | UC Forest Products Lab 1997 (57 refs) |
| `database-sources/fire/BethkeUCCE2016` | 12 meta | 🔥 Fire | Bethke et al. UCCE Literature Review |
| `database-sources/fire/DiabloFiresafe` | 140 | 🔥 Fire | Diablo Firesafe Council |
| `database-sources/fire/OaklandFireSafe` | 212 | 🔥 Fire | Oakland Fire Safe Council |
| `database-sources/fire/SAFELandscapes` | — | 🔥 Fire | SAFE Landscapes So. CA (README only) |
| `database-sources/fire/FirescapingBook` | 180 | 🔥 Fire | Edwards & Schleiger 2023 |
| `database-sources/fire/OSU_PNW590` | 133 | 🔥 Fire | OSU PNW-590 Fire-Resistant Plants |
| `database-sources/fire/UF_IFAS_FirewiseShrubs` | — | 🔥 Fire | UF/IFAS Firewise Shrubs (ref to NIST) |
| `database-sources/deer/RutgersDeerResistance` | 326 | 🦌 Deer | Rutgers NJ Ag Experiment Station |
| `database-sources/deer/NCSU_DeerResistant` | 727 | 🦌 Deer | NC State Extension Gardener Toolbox |
| `database-sources/deer/MissouriBotanicalDeer` | 112 | 🦌 Deer | Missouri Botanical Garden / Shaw Reserve |
| `database-sources/deer/WSU_DeerResistant` | 82 | 🦌 Deer | Washington State University Extension |
| `database-sources/deer/CSU_DeerDamage` | 55 | 🦌 Deer | Colorado State University Extension |
| `database-sources/deer/CornellDeerResistance` | 211 | 🦌 Deer | Cornell Cooperative Extension |
| `database-sources/traits/MBG_PlantFinder` | 8,840 | 🌱 Traits | Missouri Botanical Garden (+ detail scraping) |
| `database-sources/traits/NCSU database` | 5,028 | 🌱 Traits | NC State Extension Gardener Plant Toolbox |
| `database-sources/taxonomy/POWO_WCVP` | 362,739 | 🌱 Taxonomy | Kew World Checklist of Vascular Plants |
| `database-sources/taxonomy/WorldFloraOnline` | 381,467 | 🌱 Taxonomy | World Flora Online Consortium |
| `database-sources/taxonomy/USDA_PLANTS` | 93,157 | 🌱 Taxonomy | USDA NRCS PLANTS Database (national + OR + CA) |
| `database-sources/water/WUCOLS` | 4,103 | 💧 Water | UC Davis Water Use Classification (6 CA regions) |
| `database-sources/water/UtahCWEL` | 94 | 💧 Water | Utah State CWEL Western Native Plants |
| `database-sources/water/OSU_DroughtTolerant` | 24 | 💧 Drought | OSU Extension Unirrigated Trials |
| `database-sources/pollinators/XercesPollinator` | 428 | 🐝 Pollinator | Xerces Society + Pollinator Partnership (4 regions) |
| `database-sources/pollinators/PollinatorPartnership` | 28 | 🐝 Pollinator | Pollinator Partnership Pacific Lowland Guide |
| `database-sources/pollinators/NRCS_Pollinator` | 107 | 🐝 Pollinator | NRCS / Heather Holm (wildflowers + trees/shrubs) |
| `database-sources/birds/TallamyBirdPlants` | 42 | 🐦 Birds | Tallamy — Plant genera ranked by bird food value |
| `database-sources/native/LBJ_Wildflower` | 1,000 | 🌿 Native | Lady Bird Johnson Wildflower Center (OR/WA/CA) |
| `database-sources/native/PlantNativeORWA` | 59 | 🌿 Native | PlantNative.org Western OR & WA |
| `database-sources/native/OregonFlora` | 355 | 🌿 Native | Oregon Flora Project (supplements) |
| `database-sources/native/OrAssocNurseries` | 833 | 🌿 Native | Oregon Association of Nurseries |
| `database-sources/invasive/FederalNoxiousWeeds` | 112 | ⚠️ Invasive | USDA APHIS Federal Noxious Weed List |
| `database-sources/invasive/USDA_InvasiveSpecies` | 30 | ⚠️ Invasive | USDA National Invasive Species Info Center |
| `database-sources/invasive/WGA_InvasiveSpecies` | 26 | ⚠️ Invasive | Western Governors Association Top 50 |
| `database-sources/invasive/USGS_RIIS` | 5,941 | ⚠️ Invasive | USGS Register of Introduced & Invasive Species |
| `database-sources/invasive/CalIPC_Invasive` | 331 | ⚠️ Invasive | Cal-IPC California Invasive Plant Inventory |
| `database-sources/birds/AudubonBirdPlants` | — | 🐦 Birds | Audubon (deferred — JS-heavy) |

## Taxonomy Backbones

Three datasets serve as **reference taxonomies** for resolving plant names across all other datasets:

| Dataset | Scope | Records | Use For |
|---------|-------|---------|---------|
| `database-sources/taxonomy/POWO_WCVP` | Global | 362,739 | Lifeform, climate zone, native distribution |
| `database-sources/taxonomy/WorldFloraOnline` | Global | 381,467 | Independent taxonomic cross-validation |
| `database-sources/taxonomy/USDA_PLANTS` | US | 93,157 | USDA symbols, US-specific common names, OR/CA state lists |

## Root Files

| File | Purpose |
|------|---------|
| `README.md` | This file |
| `CLAUDE.md` | AI assistant context — conventions, structure, common tasks |
| `HOW-TO-USE.md` | Practical guide for querying, merging, and using the data |
| `.gitattributes` | Git LFS tracking for files >100MB |

### `data-sources/` folder

| File | Purpose |
|------|---------|
| `Primary Sources for the Plant List Generator Project.docx` | Original requirements document |
| `DATA-PROVENANCE.md` | Source ID registry with full citations |
| `SOURCE-CROSSREF.md` | Maps original requirements doc to completed folders |
| `TODO-DataSources.md` | Tracking status of all data sources |
| `LITERATURE-TRIAGE.md` | 195 literature references — 93.3% accounted for (52 standalone + 89 in compilation) |
| `LITERATURE-REFERENCES-SEARCH.csv` | Search-ready reference list with Google Scholar/Wayback URLs |

### `knowledge-base/` folder

52 procured research documents (PDFs, HTML) from federal agencies, universities, fire safe councils, and conservation districts. Covers fire resistance, deer resistance, WUI defensible space, and regional plant guides for OR, WA, and CA. Files named as `Org_Descriptive-Title_Year.pdf`. Includes `SEARCH-LITERATURE.html` — an interactive tool for finding remaining references.

## Reproducibility

Every dataset includes the Python script that built it in the `scripts/` folder. To rebuild any dataset:

```bash
cd database-sources/<category>/DatasetName
python scripts/build_data.py    # or parse_pdf.py, scrape_all.py
```

Dependencies: `pdfplumber`, `openpyxl`, `requests`, `beautifulsoup4` (install via `pip install pdfplumber openpyxl requests beautifulsoup4`)

## What's Deferred

These sources require JavaScript rendering (Selenium/Playwright) or registration:

- **Calscape** (CA Native Plant Society) — JavaScript app
- **Audubon Native Plants** — JavaScript, no API
- **NWF Native Plant Finder** — SSL cert issues
- **TRY Plant Trait Database** — Academic registration required
- **Invasive Plant Atlas** — 403 blocked
- **RHS** (Royal Horticultural Society) — UK, low priority
