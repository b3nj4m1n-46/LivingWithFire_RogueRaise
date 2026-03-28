"""
Generate DATA-DICTIONARY.md for every dataset folder in LivinWitFire.

Each dictionary documents:
- Every column header with definition
- Data types
- Categorical value enumerations
- Rating/scoring scales
- Nullability notes
- Merge guidance (join keys)
"""

import csv
import os
import re
import sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")

BASE = r"C:\Users\bd\Desktop\LivinWitFire"

# ── Dataset metadata: hand-curated definitions for each dataset ──────────────

DATASET_META = {
    "FirePerformancePlants": {
        "source_id": "FIRE-01",
        "description": "Southern Regional Extension Forestry fire performance ratings for 541 landscape plants.",
        "join_key": "scientific_name",
        "columns": {
            "common_name": {"def": "Common/colloquial plant name", "type": "text"},
            "scientific_name": {"def": "Binomial Latin name (genus + species)", "type": "text", "join": True},
            "size_feet": {"def": "Mature height in feet (e.g. '25\\'')", "type": "text"},
            "firewise_rating": {"def": "Full firewise rating label with numeric code", "type": "categorical",
                "values": {"Firewise (1)": "Firewise — low flammability, recommended near structures",
                           "MODERATELY Firewise (2)": "Moderately Firewise — use with caution in defensible space",
                           "AT RISK Firewise (3)": "At Risk — higher flammability, plant away from structures",
                           "NOT Firewise (4)": "Not Firewise — high flammability, avoid in fire-prone areas"}},
            "firewise_rating_code": {"def": "Numeric rating: 1 (best) to 4 (worst)", "type": "integer",
                "values": {"1": "Firewise", "2": "Moderately Firewise", "3": "At Risk", "4": "Not Firewise"}},
            "firewise_rating_label": {"def": "Text-only rating without numeric code", "type": "categorical"},
            "landscape_zone": {"def": "Recommended landscape zone for fire-safe placement", "type": "categorical",
                "values": {"LZ1": "Zone 1 — Lean, Clean, Green zone (0-5ft from structure)",
                           "LZ2": "Zone 2 — Defensible space (5-30ft from structure)",
                           "LZ3": "Zone 3 — Transition zone (30-100ft from structure)",
                           "LZ4": "Zone 4 — Extended zone (100ft+ from structure)"}},
            "slug": {"def": "URL-safe identifier derived from scientific name", "type": "text"},
        },
    },
    "IdahoFirewise": {
        "source_id": "FIRE-02",
        "description": "Idaho Firewise garden plant database. ~379 species with fire resistance ratings.",
        "join_key": "scientific_name",
        "columns": {
            "plant_type": {"def": "Growth form category", "type": "categorical",
                "values": {"Annual": "Annual plant", "Perennial": "Perennial plant",
                           "Deciduous Shrub": "Shrub that drops leaves", "Evergreen Shrub": "Shrub retaining leaves",
                           "Deciduous Tree": "Tree that drops leaves", "Evergreen Tree": "Tree retaining leaves",
                           "Ornamental Grass": "Decorative grass", "Ground Cover": "Low-growing spreading plant",
                           "Vine": "Climbing or trailing plant"}},
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "cultivar": {"def": "Named cultivar or variety (if applicable)", "type": "text", "nullable": True},
            "botanical_name_raw": {"def": "Full botanical name as it appeared in source", "type": "text"},
            "common_name": {"def": "Common plant name", "type": "text"},
            "total_on_site": {"def": "Number of specimens observed at Idaho demonstration garden", "type": "text"},
            "grower_source": {"def": "Nursery or seed supplier", "type": "text", "nullable": True},
            "comments": {"def": "Additional notes from source", "type": "text", "nullable": True},
        },
    },
    "NIST_USDA_Flammability": {
        "source_id": "FIRE-04",
        "description": "34 ornamental shrubs experimentally tested for flammability by USDA Forest Service.",
        "join_key": "scientific_name",
        "columns": {
            "common_name": {"def": "Common plant name", "type": "text"},
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "authority": {"def": "Taxonomic authority (author who named the species)", "type": "text", "nullable": True},
            "cultivar": {"def": "Named cultivar tested", "type": "text", "nullable": True},
            "flammability_rank": {"def": "Experimentally determined flammability category", "type": "categorical",
                "values": {"Low": "Low flammability — 22 of 34 species. Safe for firewise landscaping.",
                           "Moderate": "Moderate flammability — 8 of 34 species. Use cautiously.",
                           "High": "High flammability — 4 of 34 species. Not recommended near structures."}},
        },
    },
    "UCForestProductsLab": {
        "source_id": "FIRE-05",
        "description": "UC Forest Products Lab 1997 compilation of fire-resistant and fire-prone plants from 57 published sources.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "plant_type": {"def": "Evergreen, deciduous, perennial, succulent, etc.", "type": "text"},
            "plant_form": {"def": "Shrub, groundcover, tree, vine, grass", "type": "text"},
            "fire_rating": {"def": "Fire performance classification", "type": "categorical",
                "values": {"Fire-Resistant": "Recommended — appeared in 3+ sources as fire-resistant",
                           "Highly Flammable": "Not recommended — appeared in 3+ sources as flammable"}},
            "references": {"def": "Comma-separated reference numbers (see references.csv)", "type": "text"},
            "invasive": {"def": "Marked with *!* if potentially invasive", "type": "boolean", "nullable": True},
        },
    },
    "DiabloFiresafe": {
        "source_id": "FIRE-07",
        "description": "Diablo Firesafe Council fire plant lists. Same UC Forest Products Lab 1997 methodology.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "plant_type": {"def": "Evergreen, deciduous, perennial, succulent, bulb", "type": "text"},
            "plant_form": {"def": "Shrub, groundcover, tree, vine, grass, creeper", "type": "text"},
            "fire_rating": {"def": "Fire performance classification", "type": "categorical",
                "values": {"Fire-Resistant": "3+ favorable references", "Highly Flammable": "3+ unfavorable references"}},
            "references": {"def": "Comma-separated reference numbers (see references.csv for the 57 sources)", "type": "text"},
        },
    },
    "OaklandFireSafe": {
        "source_id": "FIRE-08",
        "description": "Oakland Fire Safe Council plant lists. 212 plants with fire ratings and CA native flags.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "lifeform": {"def": "Abbreviated lifeform (grnd covr, shrub, tree, vine, etc.)", "type": "text"},
            "category": {"def": "Grouping: GROUND COVERS, SHRUBS, TREES, VINES", "type": "categorical"},
            "comments": {"def": "Additional notes (seasonal behavior, characteristics)", "type": "text", "nullable": True},
            "ca_native": {"def": "Whether the plant is native to California", "type": "boolean",
                "values": {"True": "California native", "False": "Not CA native"}},
            "origin": {"def": "Text origin description", "type": "text"},
            "fire_rating": {"def": "Fire classification", "type": "categorical",
                "values": {"Fire-Resistant": "Recommended for fire-safe landscaping",
                           "Fire-Prone": "Not recommended — high flammability"}},
            "recommendation": {"def": "Additional recommendation (e.g. Remove, Avoid)", "type": "text", "nullable": True},
            "pyrophytic": {"def": "Whether the plant actively promotes fire spread", "type": "boolean"},
        },
    },
    "RutgersDeerResistance": {
        "source_id": "DEER-01",
        "description": "Rutgers E271: 326 landscape plants rated by deer resistance. 4-level A-D scale.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "plant_type": {"def": "Plant category", "type": "categorical",
                "values": {"Bulbs": "Bulbs and tubers", "Groundcovers": "Low-growing spreading plants",
                           "Ornamental Grasses": "Decorative grasses", "Perennials": "Herbaceous perennials",
                           "Shrubs": "Woody shrubs", "Trees": "Woody trees"}},
            "deer_rating": {"def": "Deer damage rating (full text)", "type": "categorical",
                "values": {"Rarely Damaged": "Very high deer resistance — deer almost never eat this",
                           "Seldom Severely Damaged": "High deer resistance — occasional light browsing",
                           "Occasionally Severely Damaged": "Some deer resistance — moderate browsing damage",
                           "Frequently Severely Damaged": "Low deer resistance — deer heavily browse this"}},
            "deer_rating_code": {"def": "Single-letter rating code", "type": "categorical",
                "values": {"A": "Rarely Damaged (very high resistance)", "B": "Seldom Severely Damaged (high)",
                           "C": "Occasionally Severely Damaged (some)", "D": "Frequently Severely Damaged (low)"}},
        },
    },
    "MissouriBotanicalDeer": {
        "source_id": "DEER-03",
        "description": "Shaw Nature Reserve 3-year deer browse study. 112 native plants with 6-level browse scale.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "deer_browse": {"def": "Observed deer browse level over 3-year study", "type": "categorical",
                "values": {"No Browse": "Deer do not eat this plant (very high resistance)",
                           "Very Light Browse (Tasted)": "Deer tasted but did not consume (high resistance)",
                           "Light Browse": "Minor/occasional browsing (high-moderate resistance)",
                           "Medium Browse": "Moderate browsing damage (some resistance)",
                           "Heavy Browse": "Significant browsing damage (low resistance)",
                           "Complete Browse": "Deer consume entirely (no resistance)"}},
        },
    },
    "CSU_DeerDamage": {
        "source_id": "DEER-05",
        "description": "Colorado State University deer damage prevention guide. 55 plants with 3-level browse scale.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "plant_type": {"def": "Category: Flowers, Vines, Trees and Shrubs", "type": "categorical"},
            "deer_resistance": {"def": "Browse frequency", "type": "categorical",
                "values": {"Rarely browsed": "Very high deer resistance",
                           "Sometimes browsed": "Some deer resistance",
                           "Often browsed": "Low deer resistance — frequently eaten by deer"}},
        },
    },
    "CornellDeerResistance": {
        "source_id": "DEER-06",
        "description": "Cornell Cooperative Extension deer-resistant plants. 211 plants with 4-level scale.",
        "join_key": "common_name",
        "columns": {
            "common_name": {"def": "Common plant name (NOTE: no scientific names in this dataset)", "type": "text", "join": True},
            "plant_type": {"def": "Category", "type": "categorical",
                "values": {"Woody Ornamental": "Trees and shrubs", "Perennial": "Herbaceous perennials",
                           "Annual": "Annual plants", "Herb": "Culinary/medicinal herbs",
                           "Bulb": "Bulbs and tubers", "Fern": "Ferns",
                           "Ornamental Grass": "Decorative grasses", "Groundcover": "Low-growing plants"}},
            "deer_rating": {"def": "Deer damage frequency", "type": "categorical",
                "values": {"Rarely Damaged": "Very high resistance", "Seldom Damaged": "High resistance",
                           "Occasionally Damaged": "Some resistance", "Frequently Damaged": "Low resistance"}},
        },
    },
    "WSU_DeerResistant": {
        "source_id": "DEER-04",
        "description": "Washington State University deer-resistant plant recommendations. 82 plants. Binary: listed = deer-resistant.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "plant_type": {"def": "Category from source", "type": "categorical",
                "values": {"Annuals/Biennials": "Annual or biennial plants",
                           "Evergreen Shrubs": "Shrubs retaining leaves year-round",
                           "Herbs and Vegetables": "Culinary herbs and vegetables",
                           "Perennials/Bulbs": "Herbaceous perennials and bulbs",
                           "Trees": "Deciduous or evergreen trees"}},
        },
    },
    "NCSU_DeerResistant": {
        "source_id": "DEER-02",
        "description": "NC State Extension Gardener Toolbox deer-resistant tag. 727 plants. Binary: tagged = deer-resistant.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name (may include cultivar)", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "deer_resistant": {"def": "Whether plant is tagged deer-resistant", "type": "boolean",
                "values": {"True": "Tagged as deer-resistant in NCSU database"}},
        },
    },
    "WUCOLS": {
        "source_id": "WATER-01",
        "description": "UC Davis WUCOLS: Water Use Classification of Landscape Species. 4,103 plants across 6 CA climate regions.",
        "join_key": "botanical_name",
        "columns": {
            "type": {"def": "Plant form: Tree, Shrub, Groundcover, Vine, Perennial, Palm, Succulent, Grass", "type": "categorical"},
            "botanical_name": {"def": "Full botanical name (may include synonyms in parentheses)", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
        },
        "repeated_columns": {
            "pattern": "Region N Water Use / Region N ET0 / Region N Plant Factor (for N = 1-6)",
            "water_use_values": {
                "Very Low": "Minimal irrigation needed once established",
                "Low": "Low supplemental water",
                "Moderate": "Regular moderate irrigation",
                "High": "Frequent irrigation required",
                "Unknown": "Not enough data",
                "Not Appropriate for this Region": "Species not suited to this climate zone",
            },
            "regions": {
                "Region 1": "North-Central Coastal (San Francisco, Monterey)",
                "Region 2": "Central Valley (Sacramento, Fresno)",
                "Region 3": "South Coastal (Los Angeles, San Diego)",
                "Region 4": "South Inland (Riverside, inland valleys)",
                "Region 5": "Low Desert (Palm Springs, Imperial Valley)",
                "Region 6": "High Desert (Lancaster, high elevation desert)",
            },
        },
    },
    "POWO_WCVP": {
        "source_id": "TAXON-01",
        "description": "World Checklist of Vascular Plants (WCVP) v14. 362,739 accepted species. Global taxonomy backbone.",
        "join_key": "scientific_name",
        "columns": {
            "plant_name_id": {"def": "Unique WCVP identifier", "type": "integer"},
            "family": {"def": "Taxonomic family", "type": "text"},
            "genus": {"def": "Genus name", "type": "text"},
            "species": {"def": "Species epithet", "type": "text"},
            "scientific_name": {"def": "Full binomial: genus + species", "type": "text", "join": True},
            "taxon_name": {"def": "Full taxon name including infraspecific ranks", "type": "text"},
            "authors": {"def": "Taxonomic authority", "type": "text"},
            "lifeform": {"def": "Growth form (tree, shrub, herb, climber, etc.)", "type": "text", "nullable": True},
            "climate": {"def": "Climate zone (tropical, temperate, subtropical, etc.)", "type": "text", "nullable": True},
            "geographic_area": {"def": "Native geographic area abbreviation(s)", "type": "text", "nullable": True},
            "native_to": {"def": "Countries/regions where species is native", "type": "text", "nullable": True},
            "introduced_to": {"def": "Countries/regions where species is introduced", "type": "text", "nullable": True},
            "powo_id": {"def": "POWO/IPNI identifier for linking to powo.science.kew.org", "type": "text"},
        },
    },
    "WorldFloraOnline": {
        "source_id": "TAXON-02",
        "description": "World Flora Online DwC backbone. 381,467 accepted species. Independent taxonomic cross-validation.",
        "join_key": "scientific_name",
        "columns": {
            "taxonID": {"def": "WFO unique identifier (e.g. wfo-0001302010)", "type": "text"},
            "scientific_name": {"def": "Full binomial with infraspecific ranks", "type": "text", "join": True},
            "taxon_rank": {"def": "species, variety, subspecies, genus, family, etc.", "type": "categorical"},
            "taxonomic_status": {"def": "Accepted, Synonym, or Unchecked", "type": "categorical"},
            "family": {"def": "Taxonomic family", "type": "text"},
            "genus": {"def": "Genus name", "type": "text"},
            "specific_epithet": {"def": "Species epithet", "type": "text"},
            "major_group": {"def": "Major plant group", "type": "categorical",
                "values": {"A": "Angiosperms (flowering plants)", "Bryophyta": "Mosses",
                           "Polypodiophyta": "Ferns", "Pinophyta": "Conifers",
                           "Marchantiophyta": "Liverworts", "Lycopodiophyta": "Club mosses"}},
        },
    },
    "USDA_PLANTS": {
        "source_id": "TAXON-03",
        "description": "USDA PLANTS Database complete US checklist. 93,157 records (48,994 accepted + 44,163 synonyms). Includes OR and CA state lists.",
        "join_key": "symbol",
        "columns": {
            "symbol": {"def": "USDA PLANTS symbol (e.g. ACMA3 for Acer macrophyllum)", "type": "text", "join": True},
            "synonym_symbol": {"def": "If this record is a synonym, the accepted name's symbol", "type": "text", "nullable": True},
            "scientific_name_full": {"def": "Full scientific name with author", "type": "text"},
            "common_name": {"def": "Common plant name (from national list or state-specific)", "type": "text"},
            "family": {"def": "Taxonomic family", "type": "text"},
            "is_synonym": {"def": "Whether this record is a synonym pointing to another accepted name", "type": "boolean"},
        },
    },
    "USGS_RIIS": {
        "source_id": "INVAS-04",
        "description": "US Register of Introduced and Invasive Species v2.0. 5,941 invasive plant records across AK, HI, and L48.",
        "join_key": "scientific_name",
        "columns": {
            "locality": {"def": "Geographic scope of the record", "type": "categorical",
                "values": {"L48": "Lower 48 contiguous US states", "AK": "Alaska", "HI": "Hawaii"}},
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common/vernacular name", "type": "text"},
            "family": {"def": "Taxonomic family", "type": "text"},
            "order": {"def": "Taxonomic order", "type": "text"},
            "degree_of_establishment": {"def": "Invasiveness severity", "type": "categorical",
                "values": {"established (category C3)": "Non-native with reproducing populations, not yet invasive",
                           "invasive (category D2)": "Spreading and causing ecological damage",
                           "widespread invasive (category E)": "Widely distributed and causing severe ecological damage"}},
            "establishment_means": {"def": "How it was introduced", "type": "text"},
            "pathway": {"def": "Introduction pathway (horticulture, agriculture, ballast water, etc.)", "type": "text", "nullable": True},
            "habitat": {"def": "Habitat types affected", "type": "text", "nullable": True},
            "is_hybrid": {"def": "Whether the species is a hybrid", "type": "boolean"},
            "intro_date": {"def": "Approximate date of introduction to US", "type": "text", "nullable": True},
            "gbif_key": {"def": "GBIF taxonomy key for linking to gbif.org", "type": "text"},
        },
    },
    "CalIPC_Invasive": {
        "source_id": "INVAS-05",
        "description": "California Invasive Plant Council inventory. 331 plants rated by ecological impact on CA wildlands.",
        "join_key": "scientific_name",
        "columns": {
            "Latin binomial": {"def": "Scientific name", "type": "text", "join": True},
            "Common Names": {"def": "Common plant name(s)", "type": "text"},
            "Rating": {"def": "Cal-IPC overall invasiveness rating", "type": "categorical",
                "values": {"High": "Severe ecological impacts; widespread or likely to become so",
                           "Moderate": "Substantial but not severe impacts; moderate dispersal",
                           "Limited": "Minor statewide impacts or insufficient data",
                           "Watch": "Not yet invasive in CA but high risk based on other regions",
                           "Alert": "New detection requiring rapid response"}},
            "Alert": {"def": "Whether this species is on Alert status", "type": "text", "nullable": True},
            "Impact Score": {"def": "Ecological impact score (A=severe, B=moderate, C=limited, D=none)", "type": "categorical"},
            "Invasiveness Score": {"def": "Invasive potential score (A-D scale)", "type": "categorical"},
            "Distribution Score": {"def": "Current distribution extent (A-D scale)", "type": "categorical"},
            "Documentation Score": {"def": "Quality of supporting evidence (numeric, higher = better documented)", "type": "float"},
            "CDFA Rating": {"def": "California Dept of Food & Agriculture weed rating", "type": "text", "nullable": True},
        },
    },
    "FederalNoxiousWeeds": {
        "source_id": "INVAS-01",
        "description": "USDA APHIS Federal Noxious Weed List. 112 species regulated at the federal level.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "category": {"def": "Habitat type", "type": "categorical",
                "values": {"Aquatic": "Aquatic/wetland invasive", "Parasitic": "Parasitic plant",
                           "Terrestrial": "Land-based invasive"}},
        },
    },
    "WGA_InvasiveSpecies": {
        "source_id": "INVAS-02",
        "description": "Western Governors Association top 25 terrestrial invasive plant species in the western US.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
        },
    },
    "USDA_InvasiveSpecies": {
        "source_id": "INVAS-03",
        "description": "USDA National Invasive Species Information Center terrestrial plant list.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
        },
    },
    "XercesPollinator": {
        "source_id": "POLL-01",
        "description": "Xerces Society + Pollinator Partnership regional guides. 428 pollinator-supporting plants across 4 Pacific West regions.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name (may be genus-level with 'spp.')", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "region": {"def": "Ecoregion the plant list applies to", "type": "categorical",
                "values": {"Maritime Northwest": "OR/WA coast (from Xerces)",
                           "CA Coastal Chaparral": "Southern CA coast",
                           "CA Coastal Steppe/Redwood": "Northern CA coast",
                           "Sierran Steppe": "Sierra Nevada foothills and mountains"}},
            "source": {"def": "Which organization published the guide", "type": "categorical"},
            "flower_color": {"def": "Primary flower color(s)", "type": "text", "nullable": True},
            "height": {"def": "Mature height range (in feet, e.g. '< 30' or '0.1 - 1')", "type": "text", "nullable": True},
            "bloom": {"def": "Bloom season (e.g. 'March - June')", "type": "text", "nullable": True},
            "sun": {"def": "Light requirements (sun, partial shade, shade)", "type": "text", "nullable": True},
            "soil": {"def": "Soil preference (moist, dry, well drained, etc.)", "type": "text", "nullable": True},
            "pollinators": {"def": "Which pollinator types visit (bees, butterflies, hummingbirds, etc.)", "type": "text", "nullable": True},
        },
    },
    "TallamyBirdPlants": {
        "source_id": "BIRD-01",
        "description": "Tallamy's 20 most valuable native plant genera for bird-supporting biodiversity. Ranked by Lepidoptera species hosted.",
        "join_key": "genus",
        "columns": {
            "rank": {"def": "Rank by number of Lepidoptera species supported (1 = most valuable)", "type": "integer"},
            "genus": {"def": "Plant genus name", "type": "text", "join": True},
            "common_name": {"def": "Common name for the genus", "type": "text"},
            "lepidoptera_species": {"def": "Number of Lepidoptera (moth + butterfly) species hosted", "type": "integer"},
            "type": {"def": "Woody or Perennial", "type": "categorical"},
            "bird_value": {"def": "Why this matters for birds", "type": "text"},
        },
    },
    "NCSU database": {
        "source_id": "TRAIT-01",
        "description": "NC State Extension Gardener Plant Toolbox. 5,028 plants with 78 horticultural fields.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_names": {"def": "Common plant name(s)", "type": "text"},
            "family": {"def": "Taxonomic family", "type": "text"},
            "plant_type": {"def": "Growth form (Shrub, Tree, Perennial, Annual, etc.)", "type": "categorical"},
            "growth_rate": {"def": "Growth speed: Slow, Medium, Fast", "type": "categorical"},
            "maintenance": {"def": "Maintenance level: Low, Medium, High", "type": "categorical"},
            "usda_zones": {"def": "USDA hardiness zones (e.g. '7a, 7b, 8a, 8b, 9a, 9b')", "type": "text"},
            "light": {"def": "Light requirements (Full sun, Partial sun, Shade)", "type": "text"},
            "soil_texture": {"def": "Preferred soil types", "type": "text"},
            "soil_drainage": {"def": "Drainage preference", "type": "text"},
            "flower_color": {"def": "Flower color(s)", "type": "text"},
            "flower_bloom_time": {"def": "Bloom season(s)", "type": "text"},
            "attracts": {"def": "Wildlife attracted (Butterflies, Hummingbirds, Pollinators)", "type": "text"},
            "resistance": {"def": "Pest/disease resistance notes", "type": "text", "nullable": True},
            "wildlife_value": {"def": "Ecological value description", "type": "text", "nullable": True},
        },
    },
    "MBG_PlantFinder": {
        "source_id": "TRAIT-02",
        "description": "Missouri Botanical Garden Plant Finder. 8,840 plants with 14 enriched horticultural fields.",
        "join_key": "scientific_name",
        "columns": {
            "taxon_id": {"def": "MBG internal identifier", "type": "integer"},
            "scientific_name": {"def": "Binomial Latin name (may include cultivar)", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "type": {"def": "Growth form (Deciduous shrub, Evergreen tree, Perennial, etc.)", "type": "text"},
            "family": {"def": "Taxonomic family", "type": "text"},
            "zone": {"def": "USDA hardiness zone range (e.g. '5 to 9')", "type": "text"},
            "height": {"def": "Mature height range in feet (e.g. '5.00 to 8.00 feet')", "type": "text"},
            "spread": {"def": "Mature width range in feet", "type": "text"},
            "bloom_time": {"def": "Bloom period (e.g. 'July to September')", "type": "text"},
            "bloom_description": {"def": "Detailed bloom characteristics", "type": "text"},
            "flower": {"def": "Flower attributes (Showy, Fragrant, etc.)", "type": "text"},
            "sun": {"def": "Light requirements (Full sun, Part shade, Full shade)", "type": "text"},
            "water": {"def": "Water needs (Low, Medium, High)", "type": "text"},
            "maintenance": {"def": "Maintenance level (Low, Medium, High)", "type": "text"},
            "tolerate": {"def": "Conditions tolerated (Rabbit, Deer, Drought, Clay, etc.)", "type": "text", "nullable": True},
            "suggested_use": {"def": "Landscape use recommendations", "type": "text", "nullable": True},
            "native_range": {"def": "Native geographic origin", "type": "text", "nullable": True},
        },
    },
    "OSU_PNW590": {
        "source_id": "FIRE-09",
        "description": "OSU PNW 590: Fire-Resistant Plants for Home Landscapes. 133 plants for Pacific NW.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name (NOTE: some entries have common name in this field)", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "category": {"def": "Plant grouping from publication", "type": "categorical"},
            "page": {"def": "Page number in PNW 590 publication", "type": "integer"},
            "height": {"def": "Mature height range", "type": "text"},
            "spread": {"def": "Mature width range", "type": "text"},
            "usda_zones": {"def": "USDA hardiness zones", "type": "text"},
            "flower_color": {"def": "Flower color description", "type": "text"},
            "bloom_time": {"def": "Bloom period", "type": "text"},
            "water_use": {"def": "Water requirements", "type": "text", "nullable": True},
            "invasive_warning": {"def": "Whether the publication flags this species as potentially invasive", "type": "boolean"},
        },
    },
    "OSU_DroughtTolerant": {
        "source_id": "WATER-03",
        "description": "OSU Extension Top 5 Plants for Unirrigated Landscapes in Western Oregon. 24 cultivars from drought trials.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name with cultivar", "type": "text", "join": True},
            "common_name": {"def": "Common plant name", "type": "text"},
            "group": {"def": "Plant group from trial: Ceanothus, Cistus, Arctostaphylos, Grevillea, Groundcovers", "type": "categorical"},
            "height": {"def": "Mature height", "type": "text"},
            "spread": {"def": "Mature width", "type": "text"},
            "flower_color": {"def": "Flower color", "type": "text"},
            "bloom": {"def": "Bloom period", "type": "text"},
            "drought_tolerance": {"def": "OSU trial rating", "type": "categorical",
                "values": {"Excellent": "Survived without supplemental irrigation in Western OR trials"}},
            "region": {"def": "Geographic applicability", "type": "text"},
            "notes": {"def": "Performance notes from trial", "type": "text"},
        },
    },
    "UtahCWEL": {
        "source_id": "WATER-02",
        "description": "USU Center for Water Efficient Landscaping. 94 western native plants with rich narrative detail.",
        "join_key": "scientific_name",
        "columns": {
            "scientific_name": {"def": "Binomial Latin name", "type": "text", "join": True},
            "common_name": {"def": "Common plant name(s)", "type": "text"},
            "height": {"def": "Mature height range", "type": "text"},
            "spread": {"def": "Mature width", "type": "text", "nullable": True},
            "sun": {"def": "Light requirements", "type": "text"},
            "soil": {"def": "Soil preferences", "type": "text"},
            "water": {"def": "Water/irrigation needs (narrative)", "type": "text"},
            "bloom": {"def": "Bloom period and flower description", "type": "text"},
            "wildlife": {"def": "Wildlife value notes", "type": "text", "nullable": True},
            "native_range": {"def": "Native geographic range", "type": "text"},
        },
    },
}


def get_unique_values(csv_path, col_name, max_vals=20):
    """Get unique values for a column from the CSV."""
    vals = Counter()
    try:
        with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                v = row.get(col_name, "").strip()
                if v:
                    vals[v] += 1
    except Exception:
        pass
    return vals.most_common(max_vals)


def generate_dictionary(folder, meta):
    """Generate DATA-DICTIONARY.md for a single dataset."""
    path = os.path.join(BASE, folder)
    if not os.path.isdir(path):
        return

    lines = []
    lines.append(f"# Data Dictionary: {folder}")
    lines.append("")
    lines.append(f"**Source ID:** `{meta.get('source_id', 'N/A')}`")
    lines.append(f"**Description:** {meta.get('description', '')}")
    lines.append(f"**Primary Join Key:** `{meta.get('join_key', 'scientific_name')}`")
    lines.append("")

    # Find the main CSV
    main_csv = None
    for fname in ["plants.csv", "plants_enriched.csv", "plants_oregon.csv"]:
        fpath = os.path.join(path, fname)
        if os.path.exists(fpath):
            main_csv = fpath
            break
    if not main_csv:
        for fname in os.listdir(path):
            if fname.endswith(".csv"):
                main_csv = os.path.join(path, fname)
                break

    if main_csv:
        with open(main_csv, "r", encoding="utf-8", errors="replace") as f:
            row_count = sum(1 for _ in f) - 1
        lines.append(f"**Primary File:** `{os.path.basename(main_csv)}` ({row_count:,} records)")
    lines.append("")

    # Column definitions
    lines.append("## Column Definitions")
    lines.append("")

    columns = meta.get("columns", {})
    for col_name, col_meta in columns.items():
        col_def = col_meta.get("def", "")
        col_type = col_meta.get("type", "text")
        is_join = col_meta.get("join", False)
        nullable = col_meta.get("nullable", False)

        join_badge = " **[JOIN KEY]**" if is_join else ""
        null_note = " *(nullable)*" if nullable else ""

        lines.append(f"### `{col_name}`{join_badge}")
        lines.append(f"- **Definition:** {col_def}")
        lines.append(f"- **Type:** {col_type}{null_note}")

        values = col_meta.get("values")
        if values:
            lines.append("- **Values:**")
            for val, desc in values.items():
                lines.append(f"  - `{val}` — {desc}")

        lines.append("")

    # Repeated column patterns (e.g. WUCOLS regions)
    repeated = meta.get("repeated_columns")
    if repeated:
        lines.append("## Repeated Column Pattern")
        lines.append("")
        lines.append(f"**Pattern:** {repeated.get('pattern', '')}")
        lines.append("")
        if "water_use_values" in repeated:
            lines.append("**Water Use Values:**")
            for val, desc in repeated["water_use_values"].items():
                lines.append(f"- `{val}` — {desc}")
            lines.append("")
        if "regions" in repeated:
            lines.append("**Regions:**")
            for reg, desc in repeated["regions"].items():
                lines.append(f"- `{reg}` — {desc}")
            lines.append("")

    # Merge guidance
    lines.append("## Merge Guidance")
    lines.append("")
    join_key = meta.get("join_key", "scientific_name")
    lines.append(f"- **Join on:** `{join_key}`")
    if join_key == "scientific_name":
        lines.append("- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names")
        lines.append("- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms")
    elif join_key == "common_name":
        lines.append("- **WARNING:** This dataset only has common names. Cross-reference with NCSU or MBG to get scientific names before merging.")
    elif join_key == "genus":
        lines.append("- **NOTE:** This dataset is at genus level, not species. Join on genus name.")
    elif join_key == "symbol":
        lines.append("- **USDA Symbol:** Use USDA_PLANTS as the bridge to convert symbols to scientific names for merging with other datasets.")
    elif join_key == "botanical_name":
        lines.append("- **NOTE:** Botanical name may include synonyms in parentheses. Strip parenthetical text before matching.")
    lines.append("")

    # Write file
    dict_path = os.path.join(path, "DATA-DICTIONARY.md")
    with open(dict_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"  Wrote {dict_path}")


def main():
    print("Generating DATA-DICTIONARY.md files...")
    print()

    for folder, meta in sorted(DATASET_META.items()):
        print(f"Processing {folder}...")
        generate_dictionary(folder, meta)

    # List folders without dictionaries
    all_folders = [d for d in os.listdir(BASE) if os.path.isdir(os.path.join(BASE, d)) and d not in ["data-sources", ".claude", "scripts"]]
    covered = set(DATASET_META.keys())
    uncovered = sorted(set(all_folders) - covered)
    if uncovered:
        print(f"\nFolders without curated dictionaries ({len(uncovered)}):")
        for f in uncovered:
            print(f"  {f}")


if __name__ == "__main__":
    main()
