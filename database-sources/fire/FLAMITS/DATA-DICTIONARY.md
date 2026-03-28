# Data Dictionary: FLAMITS

**Source ID:** `FIRE-03`
**Description:** FLAMITS (FLAMmability — an Integrated Trait database for global vegetation) — Global plant flammability traits. 40 measured variables across 4 flammability dimensions.
**Primary Join Key:** N/A (this is a variable definition file; the main data is in Sources/)

## Files

### `variables.csv` (40 records)

Defines the 40 flammability trait variables used in the FLAMITS database.

#### `var_name`
- **Definition:** Name of the measured flammability variable
- **Type:** text
- **Examples:** `ignition frequency (%)`, `time to ignition (s)`, `flame height (cm)`, `mass loss (%)`

#### `unit`
- **Definition:** Unit of measurement
- **Type:** text
- **Values:** percent, seconds, cm, degrees C, kW/m2, g, etc.

#### `flam_dimension`
- **Definition:** Which of the 4 flammability dimensions this variable measures
- **Type:** categorical
- **Values:**
  - `Ignitability` — How easily the plant catches fire (time to ignition, ignition frequency)
  - `Sustainability` — How long the plant sustains combustion (flame duration, burn time)
  - `Combustibility` — How intensely the plant burns (flame height, heat release, temperature)
  - `Consumability` — How completely the plant is consumed (mass loss, residual mass)

#### `definition`
- **Definition:** Full text description of what is measured and how
- **Type:** text

## Main Dataset

The actual flammability measurements are in `Sources/FLAMITS_data.csv` (the raw Dryad download). That file contains species-level measurements for the 40 variables above, collected from published experimental studies worldwide.

## Merge Guidance

- **Match on:** scientific name in the main FLAMITS data file
- **Use case:** Cross-reference with our fire-resistance datasets (which use subjective ratings) to get **quantitative flammability measurements**
- **Note:** FLAMITS is global — many species won't overlap with our Pacific West focus, but those that do provide objective experimental data to validate or complement the rating-based datasets
