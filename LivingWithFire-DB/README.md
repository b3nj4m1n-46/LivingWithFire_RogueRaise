# LivingWithFire-DB — Production Application Database

**Source:** Living With Fire web application (Neon PostgreSQL)
**Plants:** 1,361
**Attribute Values:** 94,903 (plant-trait-source linkages)
**Sources:** 103 data sources
**Attributes:** 125 trait definitions

## About

This is the production database for the Living With Fire plant selection tool. It uses an **Entity-Attribute-Value (EAV)** schema where:

- **Plants** are the entities (genus, species, common name)
- **Attributes** define the trait categories (Flammability, Water Requirements, Wildlife Values, etc.)
- **Values** link plants to attributes with specific values, optionally tagged with source provenance
- **Sources** track where each data point came from

This design allows unlimited plant traits without schema changes, and supports multiple values per trait (e.g., a plant can have fire ratings from different sources).

## Schema Overview

```
plants (1,361)
  └── values (94,903) ──► attributes (125)
          │                    └── attribute_sources (39)
          └──► sources (103)

nurseries (13)
  └── plant_nurseries (3)

plant_images (4,709)
plant_research (91)
filter_presets (19)
key_terms (34)
resource_sections (16)
risk_reduction_snippets (14)
```

## Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `plants` | 1,361 | Plant entities: genus, species, common name |
| `values` | 94,903 | Plant-attribute linkages with values and source provenance |
| `attributes` | 125 | Trait definitions (Flammability, Growth, Water, Wildlife, etc.) |
| `sources` | 103 | Data source citations with URLs |
| `attribute_sources` | 39 | Which sources provide which attributes |
| `nurseries` | 13 | Local nurseries (Southern Oregon focus) |
| `plant_nurseries` | 3 | Plant-nursery availability linkages |
| `plant_images` | 4,709 | Plant photo URLs (Trefle, PlantNet, etc.) |
| `plant_research` | 91 | Research links per plant |
| `filter_presets` | 19 | Saved filter configurations (HIZ zones, etc.) |
| `key_terms` | 34 | Glossary definitions |
| `resource_sections` | 16 | Educational resource content |
| `risk_reduction_snippets` | 14 | Zone-specific landscaping guidance |

## Connection

```
postgresql://living-with-fire_owner:***@ep-square-tooth-a614a88u-pooler.us-west-2.aws.neon.tech/living-with-fire?sslmode=require
```

## Files

- `plants.csv` — Main plants table (1,361 records)
- `values.csv` — All 94,903 attribute values
- `attributes.csv`, `sources.csv`, etc. — All 13 tables as individual CSVs
- `plants.db` — SQLite database with all tables and indexes
- `plants.json` — JSON with metadata and small table data
- `Sources/living-with-fire-dump.sql` — Full PostgreSQL dump (17MB)
- `scripts/extract_tables.py` — Extracts CSVs from the SQL dump
- `scripts/build_sqlite.py` — Builds SQLite and JSON from CSVs

## API Reference (Critical for Coding Agents)

The `api-reference/` folder contains cached REST API data and reference documentation:

| File | What It Is | When to Use |
|------|-----------|-------------|
| `API-REFERENCE.md` | All endpoints, response shapes, auth notes | Calling the production API |
| `ATTRIBUTE-REGISTRY.md` | Full 125-attribute tree with UUIDs and allowed values | Mapping source columns to production attributes |
| `SOURCE-REGISTRY.md` | All 50 production sources with UUIDs | Checking provenance, avoiding duplicate sources |
| `EAV-QUERY-PATTERNS.md` | SQL recipes, key UUID table, important notes | Writing queries against Dolt/SQLite |
| `openapi-spec.json` | Full OpenAPI 3.0 specification | Code generation, endpoint validation |
| `plant-fields.json` | All fields with descriptions and allowed values | Understanding the full data model |
| `sample-plant-detail.json` | Example single-plant API response | Understanding response shapes |

**Production API:** `https://lwf-api.vercel.app` (no auth for GET endpoints)

## Rebuilding

```bash
cd LivingWithFire-DB
python scripts/extract_tables.py   # SQL dump -> CSVs
python scripts/build_sqlite.py     # CSVs -> SQLite + JSON
```

To re-dump from Neon:
```bash
pg_dump "postgresql://...@ep-square-tooth-a614a88u-pooler.us-west-2.aws.neon.tech/living-with-fire?sslmode=require" --format=plain --no-owner --no-acl -f Sources/living-with-fire-dump.sql
```
