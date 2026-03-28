# Cal-IPC Invasive Plant Inventory - California

**Source:** California Invasive Plant Council (Cal-IPC)
**URL:** https://www.cal-ipc.org/plants/inventory/
**Plants:** 331 invasive species rated for California
**Columns:** 133 fields (full assessment data including question-level scores)

## About

The Cal-IPC Inventory is California's authoritative list of invasive plants that threaten the state's natural ecosystems. Each species receives a rating based on detailed ecological impact, invasiveness, and distribution assessments. This is critical data for landscaping in California — these are plants to **avoid**.

## Rating Definitions

| Rating | Count | Description |
|--------|-------|-------------|
| **High** | 44 | Severe ecological impacts on physical processes, plant/animal communities, and vegetation structure. Moderate to high dispersal rates. Most are widely distributed. |
| **Moderate** | 93 | Substantial but generally not severe ecological impacts. Moderate to high dispersal, but establishment generally dependent on disturbance. Distribution ranges from limited to widespread. |
| **Limited** | 89 | Invasive but minor statewide ecological impacts, or insufficient information for higher score. Low to moderate invasiveness. Generally limited distribution but may be locally persistent. |
| **Watch** | 105 | Not yet invasive in California but assessed as posing high risk of becoming invasive in the future. |
| **Alert** | — | Listed on species with High or Moderate impacts that have limited CA distribution but potential to spread much further. |

## Assessment Methodology

The Cal-IPC Inventory evaluates ~200 invasive species out of roughly 1,800 non-native plants growing wild in California. The assessment focuses on **ecological impact** rather than economic or management factors.

### Evaluation Framework (13 criteria in 3 sections)

**Section 1: Ecological Impacts** (4 criteria)
- 1.1 Impact on abiotic ecosystem processes (e.g., fire regime, hydrology, nutrient cycling)
- 1.2 Impact on plant community composition, structure, and interactions
- 1.3 Impact on higher trophic levels (animals dependent on the plant community)
- 1.4 Impact on genetic integrity of native species (hybridization)

**Section 2: Invasive Potential** (7 criteria)
- 2.1 Ability to establish in undisturbed natural areas
- 2.2 Local rate of spread with no management
- 2.3 Recent trend in distribution (increasing, stable, declining)
- 2.4 Innate reproductive potential (seed production, vegetative reproduction)
- 2.5 Potential for human-caused dispersal
- 2.6 Potential for natural long-distance dispersal
- 2.7 Other attributes contributing to invasiveness

**Section 3: Distribution** (2 criteria)
- 3.1 Ecological amplitude / range of habitats invaded
- 3.2 Intensity of infestation within occupied habitats

### Scoring Scale

Evaluators assign scores from **A** (severe/high) to **D** (no impact/low), with **U** for unknown. The documentation score reflects evidence quality: peer-reviewed publications (highest) through anecdotal reports (lowest).

### Assessment Process

Expert committees draft assessments incorporating land manager input and literature review, followed by public comment periods before finalization. The original 2006 Inventory reviewed 238 species between 2002-2005.

*Full methodology documentation: `Sources/about-the-inventory.html`*

## Data Fields

### Key columns (`plants.csv`)
| Field | Description |
|-------|-------------|
| Latin binomial | Scientific name |
| Common Names | Common name(s) |
| Rating | High, Moderate, Limited, or Watch |
| Alert | Alert flag |
| Impact Score | Ecological impact assessment score |
| Invasiveness Score | Invasiveness assessment score |
| Distribution Score | Distribution assessment score |
| Documentation Score | Quality of supporting documentation |
| CDFA Rating | California Dept. of Food & Agriculture rating (A, B, C, D, Q) |

### Full dataset (`plants_full.csv`)
Contains all 133 columns from the Cal-IPC Plant Assessment Form including:
- Question-by-question scores (1.1-3.2) with documentation
- Evaluator information
- Committee review dates
- Detailed habitat and distribution data
- Worksheet scores

## Files

- `plants.csv` - 331 plants with key rating columns
- `plants_full.csv` - 331 plants with all 133 assessment columns
- `plants.json` - JSON with rating definitions and full data
- `plants.db` - SQLite with all columns
- `scripts/build_data.py`

## Sources

- `Sources/cal-ipc-inventory.csv` - Original Cal-IPC download (1.6 MB, 133 columns)
- `Sources/about-the-inventory.html` - Full methodology and scoring documentation

## Citation

California Invasive Plant Council. "Cal-IPC Inventory." https://www.cal-ipc.org/plants/inventory/
