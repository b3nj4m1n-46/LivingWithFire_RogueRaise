# Data Provenance & Citation Registry

Every data point in the LivinWitFire collection traces back to a specific source. This document provides the authoritative citation for each dataset, enabling proper attribution when datasets are merged, fused, or published.

## How to Use This for Data Fusion

When merging datasets, tag each record with its `source_id` from the table below. For example, a merged fire+deer table should include a column like:

```
scientific_name, fire_rating, fire_source_id, deer_rating, deer_source_id
Acer rubrum, Firewise (1), FIRE-01, Occasionally Severely Damaged, DEER-01
```

This ensures every data point retains provenance back to its original source.

---

## Fire Resistance

| Source ID | Folder | Citation | Access Date |
|-----------|--------|----------|-------------|
| FIRE-01 | `FirePerformancePlants` | Southern Regional Extension Forestry (SREF). "Fire Performance Plants Selector." https://fire.sref.info/selector/plant-list. Archived via Wayback Machine, Sep 2025. | 2026-03-25 |
| FIRE-02 | `IdahoFirewise` | Idaho Firewise. "Fire Resistance of Plants Master Database." Idaho Department of Lands. | 2026-03-25 |
| FIRE-03 | `FLAMITS` | Cui, X., Alam, M.A., Perry, G.L.W., Paterson, A.M., Wyse, S.V., Curran, T.J. 2020. "Green firebreaks as a management tool for wildfires: Lessons from China." Journal of Environmental Management 233:329-336. Data: https://datadryad.org/dataset/doi:10.5061/dryad.h18931zr3 | 2026-03-25 |
| FIRE-04 | `NIST_USDA_Flammability` | Ganteaume, A., Jappiot, M., Lampin, C., Curt, T., Labussiere, J. "Flammability of Some Ornamental Species in Wildland-Urban Interface in Southeastern France." USDA Forest Service. https://www.srs.fs.usda.gov/pubs/ja/ja_long004.pdf | 2026-03-25 |
| FIRE-05 | `UCForestProductsLab` | University of California Forest Products Laboratory. "Fire-Resistant/Fire-Prone Plant Lists." July 1997. FireSafe Monterey. https://www.firesafemonterey.org/plant-lists.html | 2026-03-25 |
| FIRE-06 | ~~`BethkeUCCE2016`~~ | Bethke, J., Bell, C., Gonzales, J., Lima, L., Long, A., MacDonald, C. 2016. "Research Literature Review of Plant Flammability Testing, Fire-Resistant Plant Lists and Relevance of a Plant Flammability Key." UCCE San Diego. https://ucanr.edu/sites/SaratogaHort/files/235710.pdf | 2026-03-25 | *(Removed — reference only, no plant data)* |
| FIRE-07 | `DiabloFiresafe` | Diablo Firesafe Council. "Fire-Resistant and Highly Flammable Plant Lists." Based on UC Forest Products Laboratory, July 1997. | 2026-03-25 |
| FIRE-08 | `OaklandFireSafe` | Oakland Fire Safe Council (OFSC). "Fire-Resistant and Fire-Prone Plant Lists." Spreadsheet. | 2026-03-25 |
| FIRE-09 | ~~`SAFELandscapes`~~ | UC ANR. "S.A.F.E. LANDSCAPES: Sustainable and Fire-Safe Landscapes in the Wildland-Urban Interface." https://ucanr.edu/sites/safelandscapes/files/93415.pdf | 2026-03-25 | *(Removed — no plant data)* |
| FIRE-10 | `FirescapingBook` | Edwards, A. and Schleiger, R. 2023. *Firescaping Your Home: A Manual for Readiness in Wildfire Country.* Hachette Book Group. | 2026-03-25 |
| FIRE-11 | `OSU_PNW590` | Lommen, A. 2023. "Fire-Resistant Plants for Home Landscapes." Oregon State University Extension, PNW-590. https://extension.oregonstate.edu/catalog/pub/pnw-590 | 2026-03-25 |
| FIRE-12 | ~~`UF_IFAS_FirewiseShrubs`~~ | Hermansen-Báez, A., Crandall, R.M., Zipperer, W.C., Long, A.J., Behm, A.L., McKinstry, D., Andreu, A. "Fire in the Wildland-Urban Interface: Selecting Firewise Shrubs to Reduce Wildfire Risk." UF/IFAS Extension, Publication FOR272. (Data in FIRE-04) | 2026-03-25 | *(Removed — no plant data, overlaps NIST_USDA)* |

## Deer Resistance

| Source ID | Folder | Citation | Access Date |
|-----------|--------|----------|-------------|
| DEER-01 | `RutgersDeerResistance` | Perdomo, P., Nitzsche, P., Drake, D. "Landscape Plants Rated by Deer Resistance." Rutgers Cooperative Extension, Bulletin E271. NJ Agricultural Experiment Station. | 2026-03-25 |
| DEER-02 | `NCSU_DeerResistant` | NC State University Extension. "Extension Gardener Plant Toolbox — deer-resistant tag." https://plants.ces.ncsu.edu/find_a_plant/?tag=deer-resistant | 2026-03-25 |
| DEER-03 | `MissouriBotanicalDeer` | Shaw Nature Reserve. "Native Plants for a Deer Resistant Garden." Missouri Botanical Garden, Wildwood, Missouri. | 2026-03-25 |
| DEER-04 | `WSU_DeerResistant` | Washington State University Extension. "Deer Resistant Plants." Publication C063. Adapted from WA Dept. Fish and Wildlife. | 2026-03-25 |
| DEER-05 | `CSU_DeerDamage` | Colorado State University Extension. "Preventing Deer Damage." Fact Sheet 6.520. https://extension.colostate.edu/resource/preventing-deer-damage/ | 2026-03-25 |
| DEER-06 | `CornellDeerResistance` | Cornell Cooperative Extension of Dutchess County. "Deer Resistant Plants." https://ccedutchess.org/gardening/deer-resistant-plants | 2026-03-25 |

## Plant Traits & Taxonomy

| Source ID | Folder | Citation | Access Date |
|-----------|--------|----------|-------------|
| TRAIT-01 | `MBG_PlantFinder` | Missouri Botanical Garden. "Plant Finder." Kemper Center for Home Gardening. https://www.missouribotanicalgarden.org/PlantFinder/ | 2026-03-25 |
| TRAIT-02 | `NCSU database` | NC State University Extension. "Extension Gardener Plant Toolbox." https://plants.ces.ncsu.edu/ | 2026-03-25 |
| TAXON-01 | `POWO_WCVP` | WCVP (2026). World Checklist of Vascular Plants, version 14.0. Royal Botanic Gardens, Kew. http://wcvp.science.kew.org/ | 2026-03-25 |
| TAXON-02 | `WorldFloraOnline` | WFO (2025). World Flora Online. Version December 2025. http://www.worldfloraonline.org | 2026-03-25 |
| TAXON-03 | `USDA_PLANTS` | USDA, NRCS. 2025. The PLANTS Database. National Plant Data Team, Greensboro, NC USA. https://plants.usda.gov | 2026-03-25 |

## Water Need & Drought Tolerance

| Source ID | Folder | Citation | Access Date |
|-----------|--------|----------|-------------|
| WATER-01 | `WUCOLS` | UC Davis California Center for Urban Horticulture. "Water Use Classification of Landscape Species (WUCOLS)." https://wucols.ucdavis.edu/ | 2026-03-25 |
| WATER-02 | `UtahCWEL` | Utah State University Center for Water-Efficient Landscaping. "Western Native Plants." https://cwelwnp.usu.edu/westernnativeplants/ | 2026-03-25 |
| DROUGHT-01 | `OSU_DroughtTolerant` | Stoven, H. and Bell, N. 2024-2026. "Top 5 Plants for Unirrigated Landscapes in Western Oregon." Oregon State University Extension. | 2026-03-25 |

## Pollinators & Beneficial Insects

| Source ID | Folder | Citation | Access Date |
|-----------|--------|----------|-------------|
| POLL-01 | `XercesPollinator` | Xerces Society for Invertebrate Conservation. "Native Plants for Pollinators and Beneficial Insects." + Pollinator Partnership. "Selecting Plants for Pollinators: Regional Guides." https://www.pollinator.org/guides | 2026-03-25 |
| POLL-02 | `PollinatorPartnership` | Pollinator Partnership / NAPPC. "Selecting Plants for Pollinators: Pacific Lowland Mixed Forest Province." | 2026-03-25 |
| POLL-03 | `NRCS_Pollinator` | Holm, H. "Native Trees & Shrubs for Pollinators." + Marion County SWCD. "Wildflowers for Beneficial Insects." https://www.pollinatorsnativeplants.com/resources.html | 2026-03-25 |

## Birds & Wildlife Value

| Source ID | Folder | Citation | Access Date |
|-----------|--------|----------|-------------|
| BIRD-01 | `TallamyBirdPlants` | Tallamy, D. 2018. "20 Most Valuable Woody and Perennial Native Plant Genera in Terms of Supporting Biodiversity." University of Delaware. https://canr.udel.edu/wp-content/uploads/sites/16/2018/10/30121131/20-Most-Valuable-for-Biodiversity.pdf | 2026-03-25 |

## Native Plants

| Source ID | Folder | Citation | Access Date |
|-----------|--------|----------|-------------|
| NATIVE-01 | `LBJ_Wildflower` | Lady Bird Johnson Wildflower Center. "Native Plants of North America." University of Texas at Austin. https://www.wildflower.org/plants/ | 2026-03-25 |
| NATIVE-02 | `PlantNativeORWA` | PlantNative.org. "Recommended Native Plant List: Western Oregon & Western Washington." https://plantnative.org/rpl-orwa.htm | 2026-03-25 |
| NATIVE-03 | `OregonFlora` | Oregon Flora Project. "Flora of Oregon." Oregon State University. https://oregonflora.org/ | 2026-03-25 |
| NATIVE-04 | ~~`OrAssocNurseries`~~ | Oregon Association of Nurseries. Plant directory. | 2026-03-25 | *(Removed — nursery directory, not plant data)* |

## Invasiveness

| Source ID | Folder | Citation | Access Date |
|-----------|--------|----------|-------------|
| INVAS-01 | `FederalNoxiousWeeds` | USDA APHIS PPQ. "Federal Noxious Weed List." Effective December 10, 2010. | 2026-03-25 |
| INVAS-02 | `USDA_InvasiveSpecies` | USDA National Invasive Species Information Center. "Terrestrial Plants." https://www.invasivespeciesinfo.gov/terrestrial/plants | 2026-03-25 |
| INVAS-03 | `WGA_InvasiveSpecies` | Western Governors' Association. "Top 50 Invasive Species in the West." December 2017. | 2026-03-25 |
| INVAS-04 | `USGS_RIIS` | Simpson, A., et al. 2022. "US Register of Introduced and Invasive Species (US-RIIS) v2.0." USGS. https://doi.org/10.5066/P9KFFTOD | 2026-03-25 |
| INVAS-05 | `CalIPC_Invasive` | California Invasive Plant Council. "Cal-IPC Inventory." https://www.cal-ipc.org/plants/inventory/ | 2026-03-25 |
