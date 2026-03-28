# Dataset-to-Production Mapping Framework

## How Mapping Works

Every source dataset has columns that must map to the production EAV schema's 125 attributes. The mapping is **DATA-DICTIONARY.md-driven** — agents read each dataset's dictionary to understand what columns mean, then map them to production attributes.

**Key Reference Files:**
- `LivingWithFire-DB/api-reference/ATTRIBUTE-REGISTRY.md` — the complete production attribute tree with UUIDs and allowed values (the **target schema** for all mappings)
- `LivingWithFire-DB/api-reference/SOURCE-REGISTRY.md` — existing production sources (check before creating duplicates)
- `LivingWithFire-DB/api-reference/EAV-QUERY-PATTERNS.md` — SQL recipes and key UUID lookup table
- Each source dataset's `DATA-DICTIONARY.md` — the **source schema** to map from

### The Mapping Pipeline

```
Source CSV column
    ↓
DATA-DICTIONARY.md (defines meaning, type, scale)
    ↓
Mapping Agent (Claude API: "which production attribute does this map to?")
    ↓
Production attribute_id + value transformation
    ↓
Proposal record with full provenance
```

### Generic Mapping Config Structure

For each source dataset, a mapping specifies:

```
{
  "source_dataset": "FirePerformancePlants",
  "source_id_code": "FIRE-01",
  "mappings": [
    {
      "source_column": "firewise_rating_code",
      "source_type": "integer (1-4)",
      "source_definition": "1=Firewise, 2=Moderately Firewise, 3=At Risk, 4=Not Firewise",
      "target_attribute": "Flammability",
      "target_attribute_id": "a8b73bcb-...",
      "transform": "map 1→'Firewise (1)', 2→'Moderately Firewise (2)', 3→'At Risk Firewise (3)', 4→'Not Firewise (4)'"
    },
    {
      "source_column": "landscape_zone",
      "source_type": "categorical (LZ1-LZ4)",
      "source_definition": "LZ1=0-5ft, LZ2=5-30ft, LZ3=30-100ft, LZ4=100ft+",
      "target_attribute": "Home Ignition Zone (HIZ)",
      "target_attribute_id": "...",
      "transform": "map LZ1→'0-5', LZ2→'5-30', LZ3→'30-100', LZ4→'100+'"
    }
  ]
}
```

---

## Production Attribute Hierarchy (Target Schema)

These are the 125 production attributes organized by top-level category. When mapping source columns, match to the most specific attribute in the hierarchy.

### Flammability
| Attribute | Expected Values | Notes |
|-----------|----------------|-------|
| Flammability (top-level) | — | Parent category |
| Character Score | 1-20+ numeric | Maps to planting distance rules |
| Home Ignition Zone (HIZ) | 0-5, 5-10, 10-30, 30-100, 50-100 ft | Distance from structure |
| List Choice | Unsuitable, Consider, Charisse's list, Conflict | Curated recommendation |
| Restrictions | Ashland (municipal) | Location-specific prohibitions |
| Flammability Notes | free text | Detailed reasoning |
| Risk Reduction Notes | free text | Best practices |
| Idaho planting distance | numeric (feet) | From IdahoFirewise |
| Idaho Zone Tier | calculated | Derived from distance |

### Growth
| Attribute | Expected Values | Notes |
|-----------|----------------|-------|
| Min Mature Height | numeric (feet) | |
| Max Mature Height | numeric (feet) | |
| Min Mature Width | numeric (feet) | |
| Max Mature Width | numeric (feet) | |
| Bloom Time | month names or seasons | |
| Flower Color | color names | |
| Flower Smell | text | |
| Plant Structure sub-types | boolean flags | Tree, Shrub, Vine, Groundcover, Perennial, Evergreen, Deciduous, etc. |

### Water Requirements
| Attribute | Expected Values | Notes |
|-----------|----------------|-------|
| Water Amount | Very Low, Low, Moderate, High | |
| Water Season | Winter, Spring, Summer, Fall | |
| Drought Tolerant | Low, Medium, High | Tolerance level |

### Environmental Requirements
| Attribute | Expected Values | Notes |
|-----------|----------------|-------|
| Light Needs | Full Sun, Part Sun/Shade, Shade | |
| Hardiness Zone | 4-9 numeric | USDA zones |

### Nativeness
| Attribute | Expected Values | Notes |
|-----------|----------------|-------|
| Native Status | Oregon, S. Oregon, Naturalized, Coastal OR, California | |
| Oregon Native | boolean + Conflict flag | |

### Invasiveness
| Attribute | Expected Values | Notes |
|-----------|----------------|-------|
| Invasive | Conflict, Agree invasive | |
| Invasive Qualities | Invasive, Noxious weed, Invades wetlands | |

### Wildlife Values
| Attribute | Expected Values | Notes |
|-----------|----------------|-------|
| Benefits | Pollinator friendly/host/food, Bird shelter/food, Bat | Multi-select |
| Deer Resistance | Some, High, Very High | |

### Utility
| Attribute | Expected Values | Notes |
|-----------|----------------|-------|
| Landscape Use | screen, border, groundcover, etc. | |
| Erosion Control | boolean | |
| Lawn Replace | boolean | |

---

## Rating Scale Crosswalks

### Fire Resistance

| Source | Scale | → Production Flammability |
|--------|-------|--------------------------|
| **FIRE-01** FirePerformancePlants | 1=Firewise, 2=Moderately, 3=At Risk, 4=Not Firewise | 1→Consider/Charisse's, 2→Consider, 3→Consider with caution, 4→Unsuitable |
| **FIRE-02** IdahoFirewise | Highly Resistant, Moderately Resistant, Least Desirable, Not Recommended | HR→Consider, MR→Consider with caution, LD→Unsuitable, NR→Unsuitable |
| **FIRE-04** NIST_USDA | Low, Moderate, High (experimental) | Low→Consider, Moderate→Consider with caution, High→Unsuitable |
| **FIRE-05** UCForestProductsLab | Fire-Resistant, Fire-Prone | FR→Consider, FP→Unsuitable |
| **FIRE-07** DiabloFiresafe | Fire-Resistant, Highly Flammable | FR→Consider, HF→Unsuitable |
| **FIRE-08** OaklandFireSafe | Fire-Resistant, Fire-Prone, Avoid, Remove | FR→Consider, FP/Avoid/Remove→Unsuitable |
| **FIRE-11** OSU_PNW590 | Yes, No, Conditional | Y→Consider, N→Unsuitable, C→Consider with caution |

**Note:** These crosswalks are starting points. The human admin should validate each mapping and may need to adjust based on the specific attribute sub-level (Flammability → List Choice vs. Flammability → Character Score).

### Deer Resistance

| Source | Scale | → Production Deer Resistance |
|--------|-------|------------------------------|
| **DEER-01** Rutgers | A=Rarely Damaged, B=Seldom Severely, C=Occasionally Severely, D=Frequently Severely | A→Very High, B→High, C→Some, D→(omit or Low) |
| **DEER-03** Missouri Botanical | No Browse, Very Light, Light, Medium, Heavy, Complete | NB→Very High, VL→Very High, L→High, M→Some, H→(Low), C→(omit) |
| **DEER-05** CSU | Rarely, Sometimes, Often browsed | R→Very High, S→Some, O→(Low) |
| **DEER-06** Cornell | Rarely, Seldom, Occasionally, Frequently damaged | Same as Rutgers scale |

### Water Use

| Source | Scale | → Production Water Amount |
|--------|-------|--------------------------|
| **WATER-01** WUCOLS | Very Low (<10% ET0), Low (10-30%), Moderate (40-60%), High (70-90%) | Direct map: VL→Very Low, L→Low, M→Moderate, H→High |
| **WATER-02** UtahCWEL | Narrative descriptions (no standard scale) | Agent interprets from text |
| **DROUGHT-01** OSU | "survives without summer irrigation" | → Drought Tolerant: High |

### Invasiveness

| Source | Scale | → Production Invasive / Invasive Qualities |
|--------|-------|-------------------------------------------|
| **INVAS-01** FederalNoxiousWeeds | Listed / Not Listed | Listed → Invasive Qualities: "Noxious weed" |
| **INVAS-04** USGS_RIIS | established (C3), invasive (D2), widespread invasive (E) | D2/E → Invasive: "Agree invasive" |
| **INVAS-05** Cal-IPC | High, Moderate, Limited, Watch | H/M → Invasive: "Agree invasive"; L/W → flag for review |

---

## Worked Examples: 5 Priority Datasets

### Example 1: FirePerformancePlants (FIRE-01)

**Source columns:** `common_name, scientific_name, size_feet, firewise_rating, firewise_rating_code, firewise_rating_label, landscape_zone`

| Source Column | → Production Attribute | Transform |
|--------------|----------------------|-----------|
| `scientific_name` | JOIN KEY (genus + species) | Split on space, strip cultivars |
| `firewise_rating_code` | Flammability → List Choice | 1→"Consider", 2→"Consider", 3→"Consider with caution", 4→"Unsuitable" |
| `landscape_zone` | Flammability → Home Ignition Zone | LZ1→"0-5", LZ2→"5-30", LZ3→"30-100", LZ4→"100+" |
| `size_feet` | Growth → Max Mature Height | Parse numeric, strip `'` suffix |
| `common_name` | plants.common_name | Update if production is empty |

### Example 2: WUCOLS (WATER-01)

**Source columns:** `plant_type, botanical_name, common_name, region_1_water_use, region_1_et0, region_1_plant_factor, [repeated for regions 2-6]`

| Source Column | → Production Attribute | Transform |
|--------------|----------------------|-----------|
| `botanical_name` | JOIN KEY | Strip parenthetical synonyms |
| `plant_type` | Growth → Plant Structure | "Shrub"→Shrub=true, "Tree"→Tree=true, etc. |
| `region_1_water_use` | Water Requirements → Water Amount | Direct: "Very Low", "Low", "Moderate", "High" |
| `common_name` | plants.common_name | Update if production is empty |

**Note:** WUCOLS has 6 regions. Map to the production attribute with metadata noting which CA region. For OR/WA plants, Region 1 (North-Central Coastal) is closest proxy.

### Example 3: RutgersDeerResistance (DEER-01)

**Source columns:** `scientific_name, common_name, plant_type, deer_rating, deer_rating_code`

| Source Column | → Production Attribute | Transform |
|--------------|----------------------|-----------|
| `scientific_name` | JOIN KEY | Standard normalization |
| `deer_rating_code` | Wildlife Values → Deer Resistance | A→"Very High", B→"High", C→"Some", D→skip (not resistant) |
| `plant_type` | Growth → Plant Structure | "Perennials"→Perennial=true, "Trees"→Tree=true, etc. |

### Example 4: MBG_PlantFinder (TRAIT-02)

**Source columns (enriched):** `scientific_name, common_name, type, family, zone, height, spread, bloom_time, bloom_description, flower, sun, water, maintenance, tolerate, suggested_use, native_range`

| Source Column | → Production Attribute | Transform |
|--------------|----------------------|-----------|
| `scientific_name` | JOIN KEY | Strip cultivar quotes |
| `zone` | Environmental → Hardiness Zone | Parse numeric range |
| `height` | Growth → Plant Height | Parse range "2-4 ft" → min=2, max=4 |
| `spread` | Growth → Plant Width | Parse range |
| `bloom_time` | Growth → Bloom Time | Direct |
| `flower` | Growth → Flower Color | Direct |
| `sun` | Environmental → Light Needs | Map: "Full Sun"→Full Sun, "Part Shade"→Part Sun/Shade |
| `water` | Water → Water Amount | Map: "Low"→Low, "Medium"→Moderate, "High"→High |
| `native_range` | Nativeness → Native Status | Check for "Oregon", "California" in text |
| `suggested_use` | Utility → Landscape Use | Parse for screening, border, groundcover keywords |

### Example 5: USGS_RIIS (INVAS-04)

**Source columns:** `locality, scientific_name, common_name, family, degree_of_establishment, pathway, habitat`

| Source Column | → Production Attribute | Transform |
|--------------|----------------------|-----------|
| `scientific_name` | JOIN KEY | Standard normalization |
| `degree_of_establishment` | Invasiveness → Invasive | "invasive (D2)"→"Agree invasive", "widespread invasive (E)"→"Agree invasive" |
| `degree_of_establishment` | Invasiveness → Invasive Qualities | "invasive"→"Invasive", check for wetland habitat→"Invades wetlands" |
| `locality` | metadata | Filter: "L48" for continental US relevance |

---

## How Agents Auto-Generate Mappings

For datasets not in the 5 examples above, the Mapping Agent:

1. Reads the source's DATA-DICTIONARY.md
2. Extracts column definitions, data types, and value examples
3. Reads the production attributes list (125 attributes with their hierarchy)
4. Calls Claude API with prompt:

```
Given this source column definition:
  Column: {column_name}
  Type: {data_type}
  Definition: {from DATA-DICTIONARY.md}
  Example values: {first 5 values from CSV}

And these production attributes:
  {list of 125 attributes with names, parent hierarchy, and expected values}

Which production attribute does this source column map to?
What value transformation is needed?
Confidence level (high/medium/low)?
```

5. Returns mapping with confidence score
6. High confidence (>0.8): auto-map
7. Medium confidence (0.5-0.8): suggest to admin for confirmation
8. Low confidence (<0.5): flag as unmapped, needs human review
