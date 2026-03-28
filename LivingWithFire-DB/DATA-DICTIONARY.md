# Data Dictionary: LivingWithFire-DB

**Description:** Production database for the Living With Fire plant selection application. Uses an Entity-Attribute-Value (EAV) schema with 1,361 plants, 125 attributes, and 94,903 values linked to 103 sources.
**Primary Join Key:** `id` (UUID) on plants table; `plant_id` in values table

## Core Tables

### `plants` (1,361 records)

| Column | Type | Definition |
|--------|------|-----------|
| `id` | UUID | **[PRIMARY KEY]** Unique plant identifier |
| `genus` | text | Genus name (e.g. "Acer", "Quercus") |
| `species` | text | Species epithet or "spp." for genus-level entries |
| `subspecies_varieties` | text | Subspecies, varieties, or cultivar notes *(nullable)* |
| `common_name` | text | Common plant name |
| `notes` | text | General notes *(nullable)* |
| `last_updated` | timestamp | ISO 8601 timestamp of last modification |
| `urls` | JSON text | Pipe-delimited `label\|url` pairs for external references *(nullable)* |

### `values` (94,903 records)

The main data table — links plants to attributes with values and source provenance.

| Column | Type | Definition |
|--------|------|-----------|
| `id` | UUID | **[PRIMARY KEY]** Unique value identifier |
| `attribute_id` | UUID | **[FK → attributes.id]** Which trait this value describes |
| `plant_id` | UUID | **[FK → plants.id]** Which plant this value belongs to |
| `value` | text | The actual value (rating, measurement, text, etc.) |
| `source_id` | UUID | **[FK → sources.id]** Which source provided this value *(nullable)* |
| `notes` | text | Additional context *(nullable)* |
| `source_value` | text | Original value as it appeared in the source (before normalization) *(nullable)* |
| `metadata` | JSON text | Additional structured data *(nullable)* |
| `urls` | text | Supporting URLs *(nullable)* |

### `attributes` (125 records)

Defines the trait taxonomy — hierarchical, with parent-child relationships.

| Column | Type | Definition |
|--------|------|-----------|
| `id` | UUID | **[PRIMARY KEY]** Unique attribute identifier |
| `name` | text | Attribute display name (e.g. "Flammability", "Water Needs") |
| `parent_attribute_id` | UUID | **[FK → attributes.id]** Parent in hierarchy *(nullable = top-level)* |
| `value_type` | text | Data type: "text", "number", "boolean" |
| `values_allowed` | JSON | Enumerated allowed values *(nullable)* |
| `value_units` | text | Units of measurement *(nullable)* |
| `notes` | text | Definition or methodology notes *(nullable)* |
| `display_type` | text | UI display hint: "multi", "single", etc. *(nullable)* |

#### Attribute Hierarchy (Top-Level Categories)

| Top-Level Attribute | Child Attributes | Description |
|--------------------|--------------------|-------------|
| **Flammability** | Character Score, Home Ignition Zone (HIZ), Restrictions, Flammability Notes, Risk Reduction Notes, Idaho Database planting distance | Fire resistance ratings and zone placement |
| **Growth** | Plant Size (Height, Width), Plant Structure, Bloom & Flower | Physical growth characteristics |
| **Water Requirements** | Water Needs (Amount, Season), Drought Tolerant | Irrigation and drought tolerance |
| **Environmental Requirements** | Light Needs, Hardiness Zone | Growing conditions |
| **Plant Materials** | Ease of Growth, Availability, Nurseries | Practical sourcing info |
| **Nativeness** | Native Status, Oregon Native | Native/non-native classification |
| **Invasiveness** | Invasive, Invasive Qualities, Invasive (Calculated) | Invasiveness flags and details |
| **Wildlife Values** | Benefits, Deer Resistance, Wildlife Sum | Ecological value |
| **Utility** | Landscape Use, Erosion Control, Border & Screening, Lawn Replace | Landscaping applications |
| **Edibility** | Edible Plant | Edible parts |
| **Climate** | Climate Vulnerable | Climate resilience |
| **Soils** | Improves Soil Health | Soil interactions |
| **Relative Value Matrix** | Has Flammability/Water/Drought/Native/Deer/etc. ratings | Completeness flags for filtering |

### `sources` (103 records)

| Column | Type | Definition |
|--------|------|-----------|
| `id` | UUID | **[PRIMARY KEY]** Unique source identifier |
| `name` | text | Source organization or publication name |
| `url` | text | Primary URL *(nullable)* |
| `source_type` | text | Type classification *(nullable)* |
| `fire_region` | text | Geographic region for fire data *(nullable)* |
| `notes` | text | Methodology or scope notes *(nullable)* |
| `citation` | text | Full citation *(nullable)* |
| `year` | text | Publication year *(nullable)* |
| `author` | text | Author(s) *(nullable)* |
| `publisher` | text | Publisher *(nullable)* |
| `reliability` | text | Data quality assessment *(nullable)* |
| `metadata` | JSON text | Additional structured info *(nullable)* |

## Supporting Tables

### `nurseries` (13 records)

Local nurseries (Southern Oregon focus) with contact info.

| Column | Definition |
|--------|-----------|
| `id` | UUID primary key |
| `name` | Nursery name |
| `address` | Street address |
| `phone` | Phone number |
| `url` | Website URL |
| `notes` | Specialties or hours |

### `plant_images` (4,709 records)

Plant photo URLs from external APIs (Trefle, PlantNet).

| Column | Definition |
|--------|-----------|
| `id` | UUID primary key |
| `plant_id` | FK → plants.id |
| `source` | Image source ("trefle", "plantnet", etc.) |
| `source_id` | External API identifier |
| `image_url` | Direct URL to image |

### `plant_research` (91 records)

Research article links per plant.

### `filter_presets` (19 records)

Saved filter configurations for the UI (e.g. "HIZ: 50-100 ft - Consider").

### `key_terms` (34 records)

Glossary of fire landscaping terminology.

### `resource_sections` (16 records)

Educational content sections for the app.

### `risk_reduction_snippets` (14 records)

Zone-specific landscaping guidance text.

## Query Examples

### Get all flammability ratings for a plant
```sql
SELECT p.genus, p.species, p.common_name, a.name, v.value, s.name as source
FROM plants p
JOIN "values" v ON v.plant_id = p.id
JOIN attributes a ON a.id = v.attribute_id
LEFT JOIN sources s ON s.id = v.source_id
WHERE p.genus = 'Ceanothus'
  AND a.name = 'Flammability'
```

### Get all attributes for a specific plant
```sql
SELECT a.name, v.value, s.name as source
FROM "values" v
JOIN attributes a ON a.id = v.attribute_id
LEFT JOIN sources s ON s.id = v.source_id
WHERE v.plant_id = (SELECT id FROM plants WHERE genus = 'Acer' AND species = 'macrophyllum')
ORDER BY a.name
```

### Find plants with specific traits
```sql
SELECT DISTINCT p.genus, p.species, p.common_name
FROM plants p
JOIN "values" v ON v.plant_id = p.id
JOIN attributes a ON a.id = v.attribute_id
WHERE a.name = 'Oregon Native' AND v.value = 'true'
```

## Merge Guidance

- **Join to LivinWitFire datasets on:** `genus || ' ' || species` matches `scientific_name` in other datasets
- **This database already aggregates** data from 103 sources — check `sources` table to avoid double-counting when merging with our raw datasets
- **The EAV structure** means you query attribute values through JOINs, not direct column access
- **UUIDs are internal** — don't use them for cross-dataset matching; use genus+species text matching instead
