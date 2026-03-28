# Primary Sources for the Plant List Generator Project - TODO

> Most databases contain plant traits beyond their primary category. We need to harvest **all** relevant data including water needs, light needs, drought tolerance, etc.

---

## Flammability / Fire Resistance

### Top Tier

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 1 | Fire Performance Plants Selector (2010) | https://fire.sref.info/firewise-zones | **Done** | `FirePerformancePlants` |
| 2 | Fire Resistance of Plants Master Database - Idaho Firewise (~400 species) | idahofirewise.org | **Done** | `IdahoFirewise` |
| 3 | FLAMITS - Global Plant Flammability Traits Database (downloadable) | https://datadryad.org/dataset/doi:10.5061/dryad.h18931zr3 | **Done** | `FLAMITS` |
| 4 | NIST/USDA/Forest Service Experimental Flammability Studies (34 ornamental shrubs) | https://www.srs.fs.usda.gov/pubs/ja/ja_long004.pdf | **Done** | `NIST_USDA_Flammability` |
| 5 | UC Forest Products Lab (July 1997) - literature review of fire ratings | https://www.firesafemonterey.org/plant-lists.html | **Done** | `UCForestProductsLab` |
| 6 | Bethke et al. 2016 UCCE San Diego - Research Literature Review | https://ucanr.edu/sites/SaratogaHort/files/235710.pdf | **Done** | `BethkeUCCE2016` |

> **Note on #6:** Appendix I references a "Fire Resistant Plant Lists Database" (2,572 plant records in an Excel file) that has not been located. The original hosting path (`ucanr.edu/sites/SaratogaHort/files/`) has been restructured and the Wayback Machine has no archived xlsx files from that directory.

| 6a | Oakland Fire Safe Council (OFSC) - Fire-Resistant & Fire-Prone Lists | *(downloaded xlsx)* | **Done** | `OaklandFireSafe` |

> **Note on #6a:** Discovered during search for Bethke Appendix I. Independent dataset from Bay Area fire safety orgs (City of Oakland, FireSafe Marin, Diablo FireSafe Council). 193 plants with CA native flags and Remove/Avoid recommendations.

| 6b | Diablo Firesafe Council - Fire-Resistant & Highly Flammable Lists | *(PDF)* | **Done** | `DiabloFiresafe` |

> **Note on #6b:** Same UC Forest Products Lab 1997 methodology as UCForestProductsLab (#5). 140 plants, 57 references (same numbering). Useful for cross-validation.

### Second Tier

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 7 | S.A.F.E. LANDSCAPES - Southern CA Guidebook (UC Coop Ext, 2009) | https://ucanr.edu/sites/safelandscapes/files/93415.pdf | **Done** *(no tables)* | `SAFELandscapes` |
| 8 | Firescaping Your Home - Edwards & Scheliger, Timber Press 2023 (BOOK) | https://sites.google.com/view/firescapingyourhome/book-overview | **Done** | `FirescapingBook` |
| 9 | Fire-resistant Plants for Home Landscapes - Oregon State Ext (PNW-590, Oct 2023) | https://extension.oregonstate.edu/pub/pnw-590 | **Done** | `OSU_PNW590` |
| 10 | Selecting Firewise Shrubs - UF IFAS / US Forest Service (2011) | https://www.srs.fs.usda.gov/factsheet/pdf/selecting_firewise_shrubs.pdf | **Skipped** *(server 302s; overlaps NIST_USDA)* | `UF_IFAS_FirewiseShrubs` |

---

## Deer Resistance

> Relative scale: some, high (usually), very high. If not scaled, assign as "Some". Reverse scales: "rarely damaged" = very high; "seldom severely damaged" = high; "occasionally severely damaged" = some.

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 11 | Rutgers NJ Agricultural Experiment Station | https://extension.rutgers.edu/deer-resistant-plants | **Done** | `RutgersDeerResistance` |
| 12 | NC Extension Gardener Toolbox - deer-resistant tag | https://plants.ces.ncsu.edu/find_a_plant/?tag=deer-resistant | **Done** | `NCSU_DeerResistant` |
| 13 | Missouri Botanical Garden - Deer Browse Handout | https://www.missouribotanicalgarden.org/Portals/0/Shaw%20Nature%20Reserve/PDFs/horticulture/Deer%20Browse%20Handout%206-15.pdf | **Done** | `MissouriBotanicalDeer` |
| 14 | Washington State University Ext. | WSU C063 (PDF recovered locally) | **Done** | `WSU_DeerResistant` |
| 15 | Colorado State University Ext. | https://extension.colostate.edu/resource/preventing-deer-damage/ | **Done** | `CSU_DeerDamage` |
| 16 | Cornell Cooperative Ext. | https://ccedutchess.org/gardening/deer-resistant-plants | **Done** | `CornellDeerResistance` |

---

## Plant Traits & Horticultural Parameters

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 17 | Missouri Botanical Garden - Plant Finder | https://www.missouribotanicalgarden.org/plantfinder/plantfindersearch.aspx | **Done** | `MBG_PlantFinder` |
| 18 | NC Extension Gardener Plant Toolbox | https://plants.ces.ncsu.edu/ | **Done** | `NCSU database` |
| 19 | Plants of the World Online / WCVP | https://powo.science.kew.org/ | **Done** | `POWO_WCVP` |

---

## Water Need

> Sort by: very low, low, low-moderate, moderate, moderate-high, high.

### Top Tier

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 20 | UC Davis WUCOLS - Water Use Classification of Landscape Species | https://wucols.ucdavis.edu/ | **Done** | `WUCOLS` |
| 21 | World Flora Online (WFO) - ~381,000 accepted species | https://zenodo.org/records/18007552 | **Done** | `WorldFloraOnline` |
| 22 | Utah State University CWEL Western Native Plants (~94 species) | https://cwelwnp.usu.edu/westernnativeplants/plantlist.php | **Done** | `UtahCWEL` |
| 23 | Royal Horticultural Society | https://www.rhs.org.uk/plants | Not Done | — |
| 24 | TRY Plant Trait Database | https://www.try-db.org/TryWeb/Home.php | Not Done | — |

### Second Tier

> Many sources indicate water needs. For Oregon and California natives, consult Calscape, Oregon Flora, and Calflora.

---

## Drought Tolerance

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 25 | UC Davis WUCOLS (also in Water Need) | https://wucols.ucdavis.edu/ | **Done** | `WUCOLS` |
| 26 | University of Utah CWEL (also in Water Need) | https://cwelwnp.usu.edu/westernnativeplants/ | **Done** | `UtahCWEL` |
| 27 | USDA NRCS Plants Database | https://plants.sc.egov.usda.gov/ | Not Done | — |
| 28 | Oregon State University Ext. - Drought-Tolerant Landscape Plants | https://extension.oregonstate.edu/collection/top-5-plants-unirrigated-landscapes-western-oregon | **Done** | `OSU_DroughtTolerant` |
| 29 | EPA Water-smart Landscapes | *(no URL provided)* | Not Done | — |
| 30 | Plants of the World Online - drought tolerant | https://powo.science.kew.org/ | Not Done | — |

---

## Wildlife Value - Pollinators

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 31 | Xerces Society + Pollinator Partnership - Regional Pollinator Lists | https://xerces.org/pollinator-conservation/pollinator-friendly-plant-lists | **Done** | `XercesPollinator` |
| 32 | California Native Plant Society / Calscape | https://calscape.org/ | Not Done | — |
| 33 | NRCS / Heather Holm Pollinator Resources | https://www.pollinatorsnativeplants.com/resources.html | **Done** | `NRCS_Pollinator` |
| 34 | Pollinator Partnerships - Regional Planting Guides | https://www.pollinator.org/guides | **Done** | `PollinatorPartnership` |
| 35 | Lady Bird Johnson Wildflower Center - Native Plant Database | https://www.wildflower.org/plants/ | **Done** | `LBJ_Wildflower` |

---

## Wildlife Value - Birds

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 36 | National Audubon Society - Bird-Friendly Plants | https://www.audubon.org/native-plants | **Deferred** (JS-heavy, no API) | — |
| 37 | Tallamy - Plant Genera Ranked by Bird/Wildlife Value | https://canr.udel.edu/wp-content/uploads/sites/16/2018/10/30121131/20-Most-Valuable-for-Biodiversity.pdf | **Done** | `TallamyBirdPlants` |
| 38 | National Wildlife Federation - Native Plant Finder | https://nativeplantfinder.nwf.org/Plants/1353 | **Deferred** (SSL cert error) | — |

---

## Native to Oregon / California

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 39 | Calscape / CA Native Plant Society (also in Pollinators) | https://calscape.org/ | Not Done | — |
| 40 | Firescaping book - Edwards & Schleiger 2023 (also in Fire Resistance, BOOK) | *(see #8)* | Not Done | — |
| 41 | Oregon Flora (supplement CSVs) | https://oregonflora.org/pages/flora-of-oregon.php | **Done** | `OregonFlora` |
| 42 | PlantNative.org - Native Plant List, Western OR & WA | https://plantnative.org/rpl-orwa.htm | **Done** | `PlantNativeORWA` |

---

## Invasiveness

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 43 | Federal Noxious Weed List | *(PDF)* | **Done** | `FederalNoxiousWeeds` |
| 44 | Western Governors Association - Top 50 Invasive Species in the West | https://westgov.org/images/editor/WGA_Top_50_Invasive_Species_List_1.pdf | **Done** | `WGA_InvasiveSpecies` |
| 45 | Invasive Plant Atlas of the US | https://www.invasiveplantatlas.org/ | Not Done | — |
| 46 | USDA National Invasive Species List - Terrestrial Plants | https://www.invasivespeciesinfo.gov/terrestrial/plants | **Done** | `USDA_InvasiveSpecies` |
| 47 | USGS US-RIIS Invasive Species Register (4,918 species) | https://www.sciencebase.gov/catalog/item/62d59ae5d34e87fffb2dda99 | **Done** | `USGS_RIIS` |
| 48 | EDDMapS | https://www.eddmaps.org/species/ | Not Done | — |
| 49 | Cal-IPC Plant Inventory | https://www.cal-ipc.org/plants/profile/cynara-cardunculus-profile/ | Not Done | — |

---

## Oregon Association of Nurseries

| # | Database / Source | URL | Status | Folder |
|---|---|---|---|---|
| 50 | Oregon Association of Nurseries | *(web-scraped)* | **Done** | `OrAssocNurseries` |

---

## Summary

- **Total sources from original requirements doc:** ~50 (some appear in multiple categories)
- **Done:** 40 datasets built (866,000+ records across all categories)
- **Deferred:** 5 (Calscape, Audubon, NWF, Invasive Plant Atlas, RHS — all require JavaScript rendering or registration)
- **Knowledge base:** 52 research documents procured in `knowledge-base/`
- **Literature references:** 182/195 accounted for (93.3%) — see `LITERATURE-TRIAGE.md`

### Completed datasets (40 folders)

| Category | Datasets |
|----------|----------|
| Fire Resistance | FirePerformancePlants, IdahoFirewise, FLAMITS, NIST_USDA_Flammability, UCForestProductsLab, BethkeUCCE2016, OaklandFireSafe, DiabloFiresafe, SAFELandscapes, FirescapingBook, OSU_PNW590, UF_IFAS_FirewiseShrubs |
| Deer Resistance | RutgersDeerResistance, NCSU_DeerResistant, MissouriBotanicalDeer, WSU_DeerResistant, CSU_DeerDamage, CornellDeerResistance |
| Plant Traits/Taxonomy | NCSU database, MBG_PlantFinder, POWO_WCVP, WorldFloraOnline, USDA_PLANTS |
| Water/Drought | WUCOLS, UtahCWEL, OSU_DroughtTolerant |
| Pollinators | XercesPollinator, PollinatorPartnership, NRCS_Pollinator |
| Birds/Wildlife | TallamyBirdPlants |
| Native Plants | LBJ_Wildflower, PlantNativeORWA, OregonFlora, OrAssocNurseries |
| Invasiveness | FederalNoxiousWeeds, USDA_InvasiveSpecies, WGA_InvasiveSpecies, USGS_RIIS, CalIPC_Invasive |
| Deferred | AudubonBirdPlants |
