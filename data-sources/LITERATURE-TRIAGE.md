# Literature Reference Triage

*Updated: March 26, 2026*

## Summary

| Status | Count | Notes |
|--------|-------|-------|
| **Standalone documents in `knowledge-base/`** | 52 | PDFs and HTML files procured and saved |
| **Contained in UC FPL compilation** | 89 | All 57 Diablo/UCF references confirmed present in the 181-page UC Forest Products Lab document |
| **Bethke meta-references** | 12 | Source list citations (methodology docs, not plant data) |
| **Data already captured** | 1 | NCSU deer-resistant tag (data in NCSU_DeerResistant dataset) |
| **Total accounted for** | 182 / 195 | **93.3% coverage** |
| **Truly missing** | 13 | 12 Bethke meta-refs + 1 NCSU webpage |

---

## Where the Pamphlets Live

Many of the original 195 references were 1970s-90s California municipal fire department pamphlets that were never digitized as standalone PDFs. Through cross-referencing, we confirmed that **all 57 source references** from the Diablo Firesafe Council and UC Forest Products Lab compilations are cited and their plant data aggregated within:

**`knowledge-base/UC-ForestProductsLab_Defensible-Space-Landscaping-WUI_1997.pdf`** (181 pages)

This document, prepared by the University of California Forest Products Laboratory in Richmond, CA (July 1997), is the master compilation that reviewed all 57 sources and produced the fire-resistant and fire-prone plant lists. It includes:

- Full bibliographic citations for all 57 sources (pages 140-181)
- Methodology notes describing how each source defines fire resistance
- The aggregated plant lists derived from cross-referencing plants that appeared in 3+ sources
- Reference numbers (1-57) that match our `DiabloFiresafe/references.csv` and `UCForestProductsLab/references.csv`

### Pamphlet-to-Compilation Reference Map

The following municipal/local documents exist only as citations within the UC FPL compilation. Their plant data is captured in our `UCForestProductsLab` and `DiabloFiresafe` datasets:

| Ref # | Author/Org | Title | Status |
|-------|-----------|-------|--------|
| 1 | CA Dept of Forestry | Fire Safe: Inside and Out | Also found standalone (pineforestoa.org) |
| 2 | Gaidula, Peter | Wildland Fuel Management | Contained in compilation |
| 3 | Tarbes, J.A. | Physical Characteristics of Chamise | Contained in compilation |
| 4 | Sunset Magazine | Big Job #1: Landscape to Fight Fire (1992) | Contained in compilation |
| 5 | Sunset Magazine | Brush Clearing (1968) | Contained in compilation |
| 6 | CA State Fire Marshal | Landscape for Home Fire Safety (1989) | Contained in compilation |
| 7 | City of Los Angeles | Green Belts for Brush Fire Protection | Contained in compilation |
| 8 | East Bay MUD | Firescape (1995) | Also found standalone (ebmud.com) |
| 9 | Brende & Shapiro | Tree and Shrub Care Fire List | Contained in compilation |
| 10 | Gilmer, Maureen | California Wildfire Landscaping (1994) | Contained in compilation (book) |
| 11 | CA Dept of Forestry | Fire-Safe Demonstration Garden | Contained in compilation |
| 12 | Berkeley Hort Nursery | Fire Resistant Plants (1991) | Contained in compilation |
| 13 | Maire, Richard | Landscape to Reduce Fire Hazard (1962) | Contained in compilation |
| 14 | Northeast Hills HOA | Final Habitat Restoration (1990) | Contained in compilation |
| 15 | D'Alcamo / CNPS | Appropriate Landscaping | Contained in compilation |
| 16 | Red Shingle & King | The Green Belt (1988) | Contained in compilation |
| 17 | Phoenix Team | After the Vision Fire (1996) | Also found standalone (nps.gov) |
| 18 | Morris | Design and Planting | Contained in compilation |
| 19 | Brush Fire Safety Committee | Make it Safe | Contained in compilation |
| 20 | Radtke, Klaus | A Homeowner's Guide (1993) | Also found standalone (firesafetyus.com) |
| 21 | Radtke, Klaus | Living More Safely | Also found standalone (firesafetyus.com) |
| 22 | Maire, Richard | Landscape for Firesafe (1969) | Contained in compilation |
| 23 | Grounds Maintenance | Flirting With Fire (1988) | Contained in compilation |
| 24 | County of LA | Fire Retardant Plants (1970) | Also found standalone (fs.usda.gov) |
| 25 | Santa Barbara FD | Firescape Demonstration Garden | Also found standalone (santabarbaraca.gov) |
| 26 | Coate, Barrie | Water-Conserving Plants (1990) | Contained in compilation |
| 27 | Rice, Carol | Effects of Drought on Paint Fire (1991) | Contained in compilation |
| 28 | City of San Carlos | Fire Resistive Plants (1996) | Contained in compilation |
| 29 | Beatty, Russell | Designing Gardens for Fire Safety (1991) | Contained in compilation |
| 30 | Harlass | How to Firescape (1993) | Contained in compilation |
| 31 | Orinda Fire Protection | Protect Your Home | Contained in compilation |
| 32 | CA Dept of Forestry | Fire Safe, California! | Contained in compilation |
| 33 | City of Santa Barbara FD | Demonstration Garden | Contained in compilation |
| 34 | Bowker, Mike | High Danger This Year (1995) | Contained in compilation |
| 35 | South County Fire Authority | Protecting Your Home | Contained in compilation |
| 36 | Sunset Magazine | Protecting Your Home (1983) | Contained in compilation |
| 37 | Dept of Water Resources | Plants for CA Landscapes (1979) | Also found standalone (ucdavis.edu) |
| 38 | LeMay, David | Recommended Plants, LA County (1978) | Contained in compilation |
| 39 | Martin-Richardson | SLO County Homeowners Guide | Contained in compilation |
| 40 | Moritz, Ray; Svihra, Pavel | Pyrophytic vs. Fire Retardant (1996) | Also found standalone (firesafemarin.org) |
| 41 | Moritz, Ray | Pyrophytic vs. Fire Retardant (1995) | Same as above (earlier version) |
| 42 | Perry, Bob | Trees and Shrubs for Dry CA (1989) | Contained in compilation (book) |
| 43 | Ellefson | Xeriscape Gardening (1992) | Contained in compilation (book) |
| 44 | Brenzel | Sunset Western Garden Book (1995) | Contained in compilation (book) |
| 45 | USDA Soil Conservation | Plant Materials Study (1976) | Contained in compilation |
| 46 | Deering, Robert | A Study of Drought Resistant Ornamentals (1955) | Contained in compilation |
| 47 | Int'l Erosion Control Assoc | Proceedings (1977) | Contained in compilation |
| 48 | Edmuson | Plant Materials for Erosion Control (1976) | Contained in compilation |
| 49 | Resource Conservation District | Windbreaks (1988) | Contained in compilation |
| 50 | Lenz & Dourley | California Native Trees and Shrubs (1981) | Contained in compilation (book) |
| 51 | Nehrling | Easy Gardening (1975) | Contained in compilation (book) |
| 52 | Hazlewood | A Handbook of Fire Retardant Plants (1968) | Contained in compilation |
| 53 | Orange County FD | Report of WUI Task Force (1994) | Also found standalone (occonservation.org) |
| 54 | Perry, Bob | Landscape Plants for Western Regions (1992) | Contained in compilation (book) |
| 55 | Hickman | The Jepson Manual (1993) | Contained in compilation (reference book) |
| 56 | Hortus Third | Hortus Third (1976) | Contained in compilation (reference book) |
| 57 | Costello, L.R. | Water Use Classification (1994) | Contained in compilation |

---

## Knowledge Base Inventory (52 documents)

### Fire Resistance — Plant Lists (31)

| Filename | Source | Region |
|----------|--------|--------|
| UC-ForestProductsLab_Defensible-Space-Landscaping-WUI_1997.pdf | UC Forest Products Lab | CA statewide (master compilation) |
| OSU_PNW590-Fire-Resistant-Plants-Home-Landscapes_2023.pdf | Oregon State University | OR/WA |
| Moritz-Svihra_Pyrophytic-vs-Fire-Resistant-Plants_1998.pdf | FireSafe Marin / UCCE | CA (Bay Area) |
| Bethke-UCCE_Literature-Review-Plant-Flammability-Fire-Resistant-Lists_2016.pdf | UCCE San Diego | CA statewide (meta-analysis) |
| FireSafeMarin_Fire-Resistant-Plants-Marin-County_2019.pdf | FireSafe Marin | CA (Marin) |
| FireSafeSanDiego_Comprehensive-Fire-Resistant-Plant-List_2017.pdf | Fire Safe Council San Diego | CA (San Diego) |
| DiabloFiresafe_Fire-Resistant-Flammable-Plant-Lists.pdf | Diablo Firesafe Council | CA (East Bay) |
| FireSafeMonterey_Fire-Resistant-Fire-Prone-Plant-Lists_1997.html | FireSafe Monterey | CA (Monterey) |
| RCD-CNPS_Fire-Resistant-Plants-List_2018.pdf | RCD + CNPS chapters | CA (Santa Cruz, Sonoma, So. CA) |
| VenturaCountyFire_Guideline-417-Plant-Reference-Guide_2024.pdf | Ventura County Fire Dept | CA (Ventura) |
| SantaBarbara_Fire-Wise-Water-Wise-Landscaping.pdf | City of Santa Barbara | CA (Santa Barbara) |
| SantaBarbara_Guidelines-Landscaping-High-Fire-Hazard-Zone.pdf | City of Santa Barbara | CA (Santa Barbara) |
| TownOfRoss_UC-CoopExt-Acceptable-Fire-Resistant-Plant-List.pdf | Town of Ross / UCCE | CA (Marin) |
| WA-DNR_Fire-Resistant-Plants-Eastern-Washington.pdf | WA Dept Natural Resources | WA (Eastern) |
| WSU_Fire-Resistant-Plants-Chelan-Douglas-County_2017.pdf | Washington State University | WA (Central) |
| BainbridgeIsland_Fire-Resistant-Plants-Home-Landscapes-PNW590.pdf | Bainbridge Island Fire Dept | WA (Western) |
| FlorenceOR_Fire-Resistant-Plants-Home-Landscapes_2024.pdf | City of Florence, OR | OR (Coast) |
| JacksonSWCD_Fire-Resistant-Shrubs-Trees-Southern-OR.pdf | Jackson SWCD | **OR (Southern — target area)** |
| IdahoFirewise_Garden-Plant-Database_2026.pdf | Idaho Firewise | ID |
| IdahoFirewise_Garden-Signage.pdf | Idaho Firewise | ID |
| IdahoFirewise_Trifold-Guide_2021.pdf | Idaho Firewise | ID |
| Ganteaume_Quantifying-Flammability-Ornamental-Shrubs_2020.pdf | USDA Forest Service | SE US (experimental) |
| UCRiverside_Landscaping-For-Fire-Protection.pdf | UC Riverside | CA (Southern) |
| MCSTOPPP_Go-Native-Fire-Resistant-Plants-Bay-Area_2013.pdf | MCSTOPPP | CA (Bay Area) |
| MarinCounty_Fire-Protection-Standard-220A-VMP_2024.pdf | Marin County | CA (Marin) |
| NPS_After-The-Vision-Fire-Phoenix-Team-Report_1996.pdf | National Park Service | CA (Point Reyes) |
| SREF_Fire-Performance-Plant-Selector-Full-List.html | Southern Regional Extension Forestry | SE US |
| SREF_Home-Ignition-Zones-Fire-Performance.html | Southern Regional Extension Forestry | SE US |
| UF-IFAS_Firewise-Shrubs-Reduce-Wildfire-Risk.pdf | UF/IFAS Extension | SE US |
| UF-IFAS_Selecting-Firewise-Shrubs-WUI.pdf | UF/IFAS Extension | SE US |
| UF-IFAS_Selecting-Maintaining-Firewise-Plants-WUI.pdf | UF/IFAS Extension | SE US |

### WUI / Defensible Space (7)

| Filename | Source | Region |
|----------|--------|--------|
| FireSafeMarin_Ecologically-Sound-Practices-Defensible-Space_2021.pdf | FireSafe Marin | CA (Marin) |
| RCDSMM_Wildfire-Resilience-Defensible-Space-Booklet_2023.pdf | RCDSMM | CA (Santa Monica Mtns) |
| Radtke_Basic-WUI-Firestorm-Safety-Concepts.pdf | Klaus Radtke | CA |
| Slaughter_I-Zone-WUI-Fire-Prevention-Mitigation_1996.pdf | Slaughter | National |
| Radtke_Homeowners-Guide-Fire-Watershed-Management_1993.pdf | Klaus Radtke | CA (Chaparral) |
| Radtke_Living-More-Safely-Chaparral-Urban-Interface.pdf | Klaus Radtke | CA (Chaparral) |
| ABAG_Home-Hardening-Defensible-Space-Resource-Guide.pdf | Assoc. of Bay Area Govts | CA (Bay Area) |

### Deer Resistance (2)

| Filename | Source | Region |
|----------|--------|--------|
| MissouriBotanical_Native-Plants-Deer-Resistant-Garden.pdf | Missouri Botanical Garden | MO |
| WSU_Deer-Resistant-Plants-Eastern-WA.pdf | Washington State University | WA |

### Invasiveness (1)

| Filename | Source |
|----------|--------|
| USDA-APHIS_Federal-Noxious-Weed-List.pdf | USDA APHIS |

### General / Multi-topic (11)

| Filename | Source | Region | Notes |
|----------|--------|--------|-------|
| JacksonSWCD_Natural-Resource-Stewardship-Handbook_2020.pdf | Jackson SWCD | **OR (Southern)** | 107 pages |
| OrangeCounty_Wildland-Fire-Management-Plan-Vol1.pdf | OC Conservation | CA (Orange) | 256 pages |
| EastBayMUD_Fire-Management-Plan.pdf | East Bay MUD | CA (East Bay) | Fire mgmt plan |
| MarinCounty_Vegetation-Management-Plan-Standard_2024.pdf | Marin County | CA (Marin) | VMP standard |
| StopWaste_Bay-Friendly-Landscape-Guidelines_2010.pdf | StopWaste.org | CA (Bay Area) | 72 pages, cites Moritz/Svihra |
| Radtke_Wildland-Plantings-Urban-Forestry-LA-County_1978.pdf | USFS / LA County | CA (LA) | 91 pages |
| UCDavis_California-Plant-Information-Systems.pdf | UC Davis | CA | Plant database overview |
| UCDavis_Site-Appropriate-CA-Residential-Landscaping_2009.pdf | UC Davis | CA | Fire resistant plant list |
| UC_SAFE-Landscapes-Southern-CA-Guidebook_2009.pdf | UC | CA (Southern) | Fire-safe guide |
| SanRafael_Guidelines-Development-Riparian-Watershed-Areas.pdf | City of San Rafael | CA (Marin) | Fire safe plant list |
| HarborBay_Alameda-Plant-Guidelines_2011.pdf | Harbor Bay HOA | CA (Alameda) | Plant guidelines |

---

## Remaining 13 References

| ID | Description | Status |
|----|-------------|--------|
| BETHKE-SRC-1 through 12 | Bethke et al. 2016 plant list source citations | Meta-references describing the 53 source lists. Not plant data. The methodology is documented in the Bethke PDF we have. |
| DEER-02 | NCSU Extension Gardener deer-resistant tag | Data already captured in `NCSU_DeerResistant` dataset (727 plants). Webpage not saved as document. |

---

## Search Tool

Open `knowledge-base/SEARCH-LITERATURE.html` in a browser for an interactive search page with clickable Google Scholar, Google, Wayback Machine, and WorldCat links for any remaining references you want to pursue.
