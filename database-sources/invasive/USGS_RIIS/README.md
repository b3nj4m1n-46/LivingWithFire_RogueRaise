# USGS US Register of Introduced and Invasive Species (US-RIIS) v2.0

**Source:** USGS Biodiversity Informatics Program
**URL:** https://www.sciencebase.gov/catalog/item/62d59ae5d34e87fffb2dda99
**Plant Records:** 5,941 (4,918 unique species)
**Scope:** All non-native plant species with established populations in the US

## About

The US-RIIS is the authoritative federal register of non-native species established in the United States. This extraction contains only the plant (kingdom = Plantae) records. Each record includes taxonomy, invasiveness degree, introduction pathway, habitat, and introduction date.

This is **by far the most comprehensive invasive species dataset** in the LivinWitFire collection — 4,918 unique invasive plant species vs. 112 (Federal Noxious Weeds) or 30 (USDA Invasive) in our other datasets.

## Output vs. Source

The **raw source** (`Sources/`) contains the full US-RIIS v2.0 including animals, fungi, etc. The **output files** are filtered to `kingdom=Plantae` only. Records are NOT deduplicated — species may appear multiple times for different localities (AK, HI, L48).

## Locality Distribution

| Locality | Plant Records |
|----------|--------------|
| L48 (Lower 48 states) | 4,000 |
| HI (Hawaii) | 1,558 |
| AK (Alaska) | 383 |

## Degree of Establishment

| Category | Count | Description |
|----------|-------|-------------|
| Established (C3) | 3,019 | Reproducing population present |
| Invasive (D2) | 1,492 | Causing ecological/economic harm |
| Widespread Invasive (E) | 1,430 | Widely established and harmful |

## Top Invasive Plant Families

| Family | Unique Species |
|--------|---------------|
| Poaceae (grasses) | 577 |
| Asteraceae (daisies) | 451 |
| Fabaceae (legumes) | 432 |
| Rosaceae (roses) | 200 |
| Lamiaceae (mints) | 159 |

## Data Fields

| Field | Description |
|-------|-------------|
| locality | AK, HI, or L48 |
| scientific_name | Binomial name |
| common_name | Vernacular name |
| family | Plant family |
| order | Taxonomic order |
| degree_of_establishment | Established, Invasive, or Widespread Invasive |
| establishment_means | How introduced |
| pathway | Introduction pathway |
| habitat | Habitat type |
| is_hybrid | Hybrid status |
| intro_date | Date/year of introduction |
| gbif_key | GBIF taxon key for cross-referencing |

## Files

- `plants.csv` - 5,941 plant records (all localities)
- `plants.json` - JSON with first 100 records as sample
- `plants.db` - SQLite with indexes on scientific_name, locality, degree, family
- `scripts/` — (inline build)

## Sources

- `Sources/USRIISv2csvFormat.zip` - Original USGS download
- `Sources/USRIISv2_MasterList.csv` - Full master list (all kingdoms)
- `Sources/USRIISv2_AuthorityReferences.csv` - Source references
- `Sources/US-RIISv2_DataDictionary.csv` - Field definitions

## Citation

Simpson, A., Eyler, M.C., Sikes, D., Bowser, M., Sellers, E.A., Guala, G.F., Cannister, M., Libby, R., and Kozlowski, N. 2022. US Register of Introduced and Invasive Species (US-RIIS) v2.0. USGS. https://doi.org/10.5066/P9KFFTOD
