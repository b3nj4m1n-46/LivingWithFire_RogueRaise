# EAV Query Patterns — Living With Fire Database

The production database uses an **Entity-Attribute-Value (EAV)** schema. This document explains how to query it via the REST API and via direct SQL (Dolt/SQLite).

## The EAV Model

```
plants (entity)      → genus, species, commonName
attributes (schema)  → name, valueType, valuesAllowed, parent hierarchy
values (data)        → links plant_id + attribute_id + value + source_id
sources (provenance) → name, url, citation
```

A plant doesn't have a `flammability` column. Instead, there's a row in `values` that says:
- plant_id = {plant UUID}
- attribute_id = {Flammability UUID}
- value = "Consider"
- source_id = {source UUID}

## REST API Patterns

### Get all data for one plant
```
GET /api/v2/plants/{id}
```
Returns the plant with all `values` pre-resolved. Each value includes:
- `attributeName` — human-readable name
- `rawValue` — stored code
- `resolved.value` — human-readable resolved value
- `sourceId` — provenance (often null in current data)

### Get specific attribute values across plants
```
GET /api/v2/values/bulk?attributeIds={uuid1},{uuid2}
```
Returns all values for those attributes across all plants.

### Filter by attribute
```
GET /api/v2/values/bulk?attributeIds={uuid}&plantIds={uuid1},{uuid2}
```

### Get the attribute tree
```
GET /api/v2/attributes/hierarchical
```
Returns the full tree with UUIDs. Use ATTRIBUTE-REGISTRY.md for a readable version.

## SQL Query Patterns (Dolt / SQLite)

### All values for a plant
```sql
SELECT a.name AS attribute, v.value, s.name AS source
FROM "values" v
JOIN attributes a ON a.id = v.attribute_id
LEFT JOIN sources s ON s.id = v.source_id
WHERE v.plant_id = '{plant_uuid}'
ORDER BY a.name;
```

### Find plants by attribute value
```sql
SELECT p.genus, p.species, p.common_name, v.value
FROM plants p
JOIN "values" v ON v.plant_id = p.id
WHERE v.attribute_id = '{attribute_uuid}'
  AND v.value = '{value}';
```

### Find all flammability data
```sql
-- First get the Flammability attribute UUID and all children
WITH RECURSIVE flame_tree AS (
    SELECT id, name FROM attributes WHERE name = 'Flammability'
    UNION ALL
    SELECT a.id, a.name FROM attributes a
    JOIN flame_tree ft ON a.parent_attribute_id = ft.id
)
SELECT p.genus, p.species, ft.name AS attribute, v.value, s.name AS source
FROM plants p
JOIN "values" v ON v.plant_id = p.id
JOIN flame_tree ft ON ft.id = v.attribute_id
LEFT JOIN sources s ON s.id = v.source_id
WHERE p.genus = 'Ceanothus'
ORDER BY ft.name;
```

### Count values per attribute (data coverage)
```sql
SELECT a.name, COUNT(*) AS value_count,
       COUNT(DISTINCT v.plant_id) AS plants_with_data
FROM "values" v
JOIN attributes a ON a.id = v.attribute_id
GROUP BY a.name
ORDER BY value_count DESC;
```

### Find plants missing a specific attribute
```sql
SELECT p.genus, p.species, p.common_name
FROM plants p
WHERE p.id NOT IN (
    SELECT DISTINCT plant_id FROM "values"
    WHERE attribute_id = '{attribute_uuid}'
);
```

### Detect internal conflicts (same plant + same attribute, different values)
```sql
SELECT p.genus, p.species, a.name AS attribute,
       GROUP_CONCAT(DISTINCT v.value) AS conflicting_values,
       COUNT(DISTINCT v.value) AS num_values
FROM "values" v
JOIN plants p ON p.id = v.plant_id
JOIN attributes a ON a.id = v.attribute_id
GROUP BY v.plant_id, v.attribute_id
HAVING COUNT(DISTINCT v.value) > 1
ORDER BY num_values DESC;
```

## Key UUIDs (Frequently Used)

| Attribute | UUID |
|-----------|------|
| Flammability | `a8b73bcb-a997-4778-8415-13493a61b40d` |
| Home Ignition Zone (HIZ) | `b908b170-70c9-454d-a2ed-d86f98cb3de1` |
| List Choice (Flammability) | `d996587c-383b-4dc6-a23c-239b7de7e47b` |
| Water Requirements | `51f22544-c94b-4f8d-80a4-a249cf9cd281` |
| Water Amount | `d9174148-6563-4f92-9673-01feb6a529ce` |
| Drought Tolerant | `af3e70d2-dc9c-4027-a09f-15d7d8b0dd10` |
| Deer Resistance | `ff4c4d0e-35d5-4804-aea3-2a6334ef8cb5` |
| Native Status | `716f3d8f-195f-4d16-824b-6dd1e88767a6` |
| Oregon Native | `d5fb9f61-41dd-4e4e-bc5e-47eb24ecab46` |
| Wildlife Benefits | `ff75e529-5b5c-4461-8191-0382e33a4bd5` |
| Invasive | `284b2037-fef8-4b88-abd4-5387a4901109` |
| Invasive Qualities | `a0900c7f-3bb3-4757-9dec-075f718c8f3e` |
| Light Needs | `7096a9cc-3435-4e14-a1c4-eb9e95f0850f` |
| Hardiness Zone | `f0b45dc9-ee00-479a-8181-b4fda01f5233` |
| Max Mature Height | `7692e4d8-9e4d-42b2-bdf3-5b386feeecfb` |
| Max Mature Width | `75fdd111-5a66-4319-94b0-1461f7114834` |
| Bloom Time | `ca684872-8841-420e-a85b-b6d247b5b96e` |
| Flower Color | `86a95833-886a-42bf-b149-c3754e9d913a` |
| Character Score | `70dcbd81-352d-4678-8d8a-f3bd51f1bab6` |
| Plant Structure | `b2150aec-75ac-4b4b-aeb1-c339c5da563c` |
| Availability | `94a1c46e-8d0c-4a8b-b951-09ee6b04a43e` |

## Important Notes for Agents

1. **Always quote "values"** in SQL — it's a reserved word in most SQL dialects
2. **Values are strings** — even numeric scores are stored as text. Cast when comparing: `CAST(v.value AS INTEGER)`
3. **Multiple values per plant+attribute is normal** — a plant can have HIZ values of "03", "04", "05" meaning it's suitable for zones 10-30ft, 30-100ft, and 50-100ft
4. **Source provenance is sparse** — most existing values have `source_id = NULL`. The admin portal's Claim/Warrant model will fix this
5. **Calculated attributes** (marked `isCalculated: true`) are derived from other attributes — don't write to them directly
6. **The attribute tree has 4 levels** — root → category → subcategory → leaf. Most values are on leaf attributes
