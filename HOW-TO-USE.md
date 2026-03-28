# How to Use the LivinWitFire Data Collection

## Overview

This collection contains 40 plant databases in standardized formats. This guide covers:
1. How to query individual datasets
2. How to cross-reference and merge datasets
3. How the Source ID system works for data provenance
4. Common workflows

---

## 1. Querying Individual Datasets

### Using CSV (Excel, Google Sheets, any tool)
Open any `plants.csv` file directly. Every CSV uses UTF-8 encoding with standard comma delimiters.

### Using SQLite (recommended for cross-referencing)
Every folder contains a `plants.db` file. Open with any SQLite client:
- **DB Browser for SQLite** (free, GUI): https://sqlitebrowser.org
- **Python**: `import sqlite3; conn = sqlite3.connect('plants.db')`
- **R**: `library(RSQLite); con <- dbConnect(SQLite(), 'plants.db')`
- **Command line**: `sqlite3 plants.db`

### Using JSON
The `plants.json` files contain metadata (source URL, rating scale definitions, methodology notes) plus the plant data. Useful for understanding what each field means before querying the CSV/SQLite.

---

## 2. The Source ID System

### What It Is

Every dataset has a unique **Source ID** (e.g., `FIRE-01`, `DEER-03`, `INVAS-04`). These are defined in `data-sources/DATA-PROVENANCE.md` and map 1:1 to folders.

### Why It Matters

When you merge data from multiple sources into a single table, you lose track of where each data point came from unless you tag it. The Source ID solves this.

### How to Use It

**Step 1: When merging, add a source_id column for each attribute**

Bad (no provenance):
```csv
scientific_name,fire_rating,deer_rating,water_use
Acer rubrum,Firewise (1),Occasionally Damaged,Moderate
```

Good (with provenance):
```csv
scientific_name,fire_rating,fire_source,deer_rating,deer_source,water_use,water_source
Acer rubrum,Firewise (1),FIRE-01,Occasionally Damaged,DEER-01,Moderate,WATER-01
```

**Step 2: When a species appears in multiple sources for the same attribute, keep both**

```csv
scientific_name,fire_rating,fire_source
Acer rubrum,Firewise (1),FIRE-01
Acer rubrum,Firewise,FIRE-02
Acer rubrum,Low Flammability,FIRE-04
```

This lets you see agreement/disagreement across sources. Three sources calling a plant fire-resistant is stronger evidence than one.

**Step 3: Look up any Source ID in `data-sources/DATA-PROVENANCE.md` for the full citation**

`FIRE-01` → Southern Regional Extension Forestry (SREF). "Fire Performance Plants Selector."

### Source ID Reference (Quick Lookup)

| Prefix | Category | IDs |
|--------|----------|-----|
| `FIRE-` | Fire Resistance | FIRE-01 through FIRE-12 |
| `DEER-` | Deer Resistance | DEER-01 through DEER-06 |
| `TRAIT-` | Plant Traits | TRAIT-01, TRAIT-02 |
| `TAXON-` | Taxonomy Backbones | TAXON-01 through TAXON-03 |
| `WATER-` | Water Need | WATER-01, WATER-02 |
| `DROUGHT-` | Drought Tolerance | DROUGHT-01 |
| `POLL-` | Pollinators | POLL-01 through POLL-03 |
| `BIRD-` | Birds/Wildlife | BIRD-01 |
| `NATIVE-` | Native Plants | NATIVE-01 through NATIVE-04 |
| `INVAS-` | Invasiveness | INVAS-01 through INVAS-05 |

---

## 3. Common Workflows

### Find fire-safe plants for Southern Oregon

```sql
-- Open FirePerformancePlants/plants.db
SELECT scientific_name, common_name, firewise_rating, landscape_zone
FROM plants
WHERE firewise_rating IN ('Firewise (1)', 'MODERATELY Firewise (2)')
ORDER BY firewise_rating, common_name;
```

### Cross-reference fire safety with deer resistance

```python
import sqlite3

# Load both databases
fire = sqlite3.connect('FirePerformancePlants/plants.db')
deer = sqlite3.connect('RutgersDeerResistance/plants.db')

# Get fire-safe plants
fire_safe = {}
for row in fire.execute("SELECT scientific_name, firewise_rating FROM plants WHERE firewise_rating = 'Firewise (1)'"):
    fire_safe[row[0].lower().split()[0] + ' ' + row[0].lower().split()[1] if len(row[0].split()) > 1 else row[0].lower()] = row[1]

# Get deer-resistant plants
deer_resistant = {}
for row in deer.execute("SELECT scientific_name, deer_rating FROM plants WHERE deer_rating_code = 'A'"):
    deer_resistant[row[0].lower()] = row[1]

# Find overlap (genus+species level)
both = set(fire_safe.keys()) & set(deer_resistant.keys())
print(f"Fire-safe AND deer-resistant: {len(both)} species")
for name in sorted(both)[:20]:
    print(f"  {name}")
```

### Check if a plant is invasive before recommending it

```python
import sqlite3

plant = "Hedera helix"  # English ivy

# Check all invasive databases
for db_path, source_id in [
    ('USGS_RIIS/plants.db', 'INVAS-04'),
    ('CalIPC_Invasive/plants.db', 'INVAS-05'),
    ('FederalNoxiousWeeds/plants.db', 'INVAS-01'),
]:
    conn = sqlite3.connect(db_path)
    results = conn.execute(
        "SELECT * FROM plants WHERE scientific_name LIKE ?",
        (f"%{plant}%",)
    ).fetchall()
    if results:
        print(f"⚠️  {source_id}: {plant} IS listed ({len(results)} records)")
    else:
        print(f"✅ {source_id}: {plant} not found")
    conn.close()
```

### Find low-water native plants for California

```sql
-- Open WUCOLS/plants.db
SELECT scientific_name, common_name, plant_type,
       region_4_water_use AS south_coastal,
       region_6_water_use AS bay_area
FROM plants
WHERE plant_type LIKE '%California Native%'
  AND (region_4_water_use IN ('Very Low', 'Low')
       OR region_6_water_use IN ('Very Low', 'Low'))
ORDER BY scientific_name;
```

### Get the full profile for a plant from MBG

```sql
-- Open MBG_PlantFinder/plants_enriched.db
SELECT scientific_name, common_name, type, family, zone,
       height, spread, sun, water, maintenance,
       bloom_time, flower, native_range, tolerate
FROM plants
WHERE scientific_name LIKE '%Ceanothus%';
```

---

## 4. Data Dictionaries

Every dataset folder contains a `DATA-DICTIONARY.md` that documents:

- **Every column** with its definition and data type
- **Rating/scoring scales** with all possible values explained
- **Join keys** marked with `[JOIN KEY]` — the column to use when merging with other datasets
- **Nullable fields** — which columns can be empty and what that means
- **Merge guidance** — normalization steps and which taxonomy backbone to use for synonym resolution

**Before merging two datasets, always read both DATA-DICTIONARY.md files.** Rating scales are NOT standardized across sources:

| Dataset | Rating Column | Scale |
|---------|--------------|-------|
| FirePerformancePlants | `firewise_rating_code` | 1 (best) to 4 (worst) |
| IdahoFirewise | narrative in README | Highly Resistant → Not Recommended |
| NIST_USDA_Flammability | `flammability_rank` | Low / Moderate / High |
| RutgersDeerResistance | `deer_rating_code` | A (best) to D (worst) |
| MissouriBotanicalDeer | `deer_browse` | No Browse → Complete Browse (6 levels) |
| CSU_DeerDamage | `deer_resistance` | Rarely / Sometimes / Often browsed |
| WUCOLS | `Region N Water Use` | Very Low → High (per region) |

---

## 5. Taxonomy Resolution

Different databases use different names for the same plant. Use the taxonomy backbones to resolve:

| Problem | Solution |
|---------|----------|
| "Is *Mahonia aquifolium* the same as *Berberis aquifolium*?" | Check `USDA_PLANTS/plants.db` — synonym records link alternate names to accepted names |
| "What family is *Ceanothus* in?" | Query `POWO_WCVP/plants.db` by genus |
| "Is this plant native to Oregon?" | Check `USDA_PLANTS/plants_oregon.csv` — if present, it occurs in OR |
| "What's the current accepted name?" | Check `WorldFloraOnline/plants.db` for the most current taxonomy |

---

## 6. Data Quality Notes

- **Fire ratings are NOT standardized** across sources. FIRE-01 uses "Firewise (1)" through "NOT Firewise (4)"; FIRE-02 uses "Highly Resistant" through "Not Recommended"; FIRE-04 uses lab-measured flammability scores. Cross-referencing requires interpreting each source's scale.
- **Deer ratings vary similarly.** DEER-01 uses A-D letter grades; DEER-03 uses 6 browse levels; DEER-05 uses 3 simple categories.
- **Common names are inconsistent.** Always match on `scientific_name` when cross-referencing, never on common name alone.
- **Taxonomy changes over time.** A plant called *Eucephalus glabratus* in one source may now be *Doellingeria glabrata*. Use the taxonomy backbones to resolve.
- **Coverage varies by region.** WUCOLS covers California only. Rutgers covers New Jersey. CSU covers Colorado. Consider geographic applicability when using ratings from other regions.

---

## 7. Knowledge Base

The `knowledge-base/` folder contains 52 procured research documents — the original PDFs and HTML files that our structured datasets were extracted from. These are useful for:

- **RAG / vectorization** — embed the documents for AI-powered retrieval
- **Methodology context** — understanding how a rating was derived or what "fire-resistant" means in a specific source
- **Regional specificity** — guides from Jackson County OR, Marin County CA, Eastern WA, etc. have local plant recommendations
- **Citation** — proper attribution when using the data

### Key documents by region

| Region | Documents |
|--------|-----------|
| **Southern Oregon** | `JacksonSWCD_Fire-Resistant-Shrubs-Trees-Southern-OR.pdf`, `JacksonSWCD_Natural-Resource-Stewardship-Handbook_2020.pdf` |
| **Oregon Coast** | `FlorenceOR_Fire-Resistant-Plants-Home-Landscapes_2024.pdf` |
| **Oregon/Washington** | `OSU_PNW590-Fire-Resistant-Plants-Home-Landscapes_2023.pdf`, `BainbridgeIsland_Fire-Resistant-Plants-Home-Landscapes-PNW590.pdf` |
| **Washington** | `WA-DNR_Fire-Resistant-Plants-Eastern-Washington.pdf`, `WSU_Fire-Resistant-Plants-Chelan-Douglas-County_2017.pdf` |
| **California statewide** | `UC-ForestProductsLab_Defensible-Space-Landscaping-WUI_1997.pdf` (181-page master compilation of 57 sources) |
| **Bay Area** | `FireSafeMarin_*.pdf`, `StopWaste_Bay-Friendly-Landscape-Guidelines_2010.pdf`, `MCSTOPPP_Go-Native-*.pdf` |

### Literature triage

Of the 195 references identified across all datasets, 182 (93.3%) are accounted for — 93 as standalone documents and 89 as citations within the UC Forest Products Lab compilation. See `data-sources/LITERATURE-TRIAGE.md` for the full inventory and pamphlet-to-compilation reference map.
