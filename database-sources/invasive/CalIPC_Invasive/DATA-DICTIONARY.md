# Data Dictionary: CalIPC_Invasive

**Source ID:** `INVAS-05`
**Description:** California Invasive Plant Council inventory. 331 plants rated by ecological impact on CA wildlands.
**Primary Join Key:** `scientific_name`

**Primary File:** `plants.csv` (331 records)

## Column Definitions

### `Latin binomial` **[JOIN KEY]**
- **Definition:** Scientific name
- **Type:** text

### `Common Names`
- **Definition:** Common plant name(s)
- **Type:** text

### `Rating`
- **Definition:** Cal-IPC overall invasiveness rating
- **Type:** categorical
- **Values:**
  - `High` — Severe ecological impacts; widespread or likely to become so
  - `Moderate` — Substantial but not severe impacts; moderate dispersal
  - `Limited` — Minor statewide impacts or insufficient data
  - `Watch` — Not yet invasive in CA but high risk based on other regions
  - `Alert` — New detection requiring rapid response

### `Alert`
- **Definition:** Whether this species is on Alert status
- **Type:** text *(nullable)*

### `Impact Score`
- **Definition:** Ecological impact score (A=severe, B=moderate, C=limited, D=none)
- **Type:** categorical

### `Invasiveness Score`
- **Definition:** Invasive potential score (A-D scale)
- **Type:** categorical

### `Distribution Score`
- **Definition:** Current distribution extent (A-D scale)
- **Type:** categorical

### `Documentation Score`
- **Definition:** Quality of supporting evidence (numeric, higher = better documented)
- **Type:** float

### `CDFA Rating`
- **Definition:** California Dept of Food & Agriculture weed rating
- **Type:** text *(nullable)*

## Merge Guidance

- **Join on:** `scientific_name`
- **Normalization:** Lowercase, strip cultivar names in quotes, strip author names
- **Cross-reference with:** POWO_WCVP or WorldFloraOnline to resolve synonyms
