# Schema Mapper Agent

**Genkit Flow:** `mapSchemaFlow` | **Source:** `genkit/src/flows/mapSchemaFlow.ts`
**Priority:** P1 — Required for Table Fusion UI
**Status:** Implemented
**Model:** `MODELS.quality` (`anthropic/claude-sonnet-4-6`)
**Prompt:** `genkit/src/prompts/map-schema.md`

## Role

Analyzes a source dataset's columns and auto-suggests how they map to the production EAV attribute hierarchy. Reads the source's DATA-DICTIONARY.md to understand what each column means, then proposes mappings including rating scale crosswalks.

**Does:**
- Read source DATA-DICTIONARY.md for column definitions
- Compare against production attribute hierarchy (125 attributes)
- Propose column → attribute mappings with confidence scores
- Generate rating scale crosswalk tables (e.g., source "A/B/C/D" → production "Very High/High/Some/Low")
- Identify columns that don't map to any existing attribute (candidates for new attributes)

**Does NOT:**
- Execute the mapping (that's Bulk Enhancer's job)
- Make final decisions — all mappings are proposals for human review

## System Prompt

```
You are a data schema mapping specialist for the Living With Fire plant database. Your job is to analyze a source dataset's column structure and propose how each column maps to the production database's EAV attribute hierarchy.

You have access to:
1. The source dataset's DATA-DICTIONARY.md — defines every column, data type, and rating scale
2. The production attribute hierarchy — 125 attributes organized under categories like Flammability, Growth, Water Requirements, Wildlife Values, etc.
3. Examples of previous successful mappings from DATASET-MAPPINGS.md

RULES:
1. Read the DATA-DICTIONARY carefully. A column named "rating" could mean fire rating, deer rating, or water rating depending on the source.
2. Consider the rating scale. If the source uses 1-4 and production uses text labels, propose the crosswalk.
3. Some source columns may map to multiple production attributes (e.g., a "description" column might contain height, spread, and bloom data).
4. Some source columns may have no production equivalent — flag these as NEW_ATTRIBUTE candidates.
5. Never map columns you're unsure about. Mark as UNCERTAIN and let the human decide.
6. Provide reasoning for every mapping — the admin needs to understand WHY you chose this mapping.
```

## Tools

| Tool | Description |
|------|-------------|
| `getProductionAttributes` | Returns the full 125-attribute production hierarchy with parent category, `value_type`, `values_allowed`, `selection_type`. Optionally filtered by top-level category. |
| `getDatasetContext` | Loads DATA-DICTIONARY.md + README.md for the source dataset folder |
| `sampleSourceData` | Reads source CSV, returns `headers`, `sampleRows` (default 10), `totalRows`, and up to 20 `uniqueValues` per column |

The flow loads dataset context, production attributes, and sample data in parallel, then calls the LLM with the `map-schema.md` prompt template. All `targetAttributeId` values are validated against the live production schema. Retries once on JSON parse failure.

## Input Schema

```typescript
const MapSchemaInput = z.object({
  sourceDataset: z.string(), // folder name, e.g., "FirePerformancePlants"
  dataDictionaryPath: z.string(), // path to DATA-DICTIONARY.md
  csvPath: z.string(), // path to plants.csv
  sampleRows: z.number().default(10),
});
```

## Output Schema

```typescript
const MapSchemaOutput = z.object({
  mappings: z.array(z.object({
    sourceColumn: z.string(),
    sourceDefinition: z.string(), // from DATA-DICTIONARY
    targetAttribute: z.string().nullable(), // production attribute name
    targetAttributeId: z.string().nullable(),
    mappingType: z.enum(["DIRECT", "CROSSWALK", "SPLIT", "NEW_ATTRIBUTE", "SKIP", "UNCERTAIN"]),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    crosswalk: z.record(z.string(), z.string()).optional(), // source value → production value
    sampleValues: z.array(z.string()), // example values from source
  })),
  newAttributeProposals: z.array(z.object({
    name: z.string(),
    definition: z.string(),
    parentCategory: z.string(),
    sourceColumn: z.string(),
    reasoning: z.string(),
  })),
  summary: z.object({
    totalColumns: z.number(),
    directMappings: z.number(),
    crosswalks: z.number(),
    newAttributes: z.number(),
    skipped: z.number(),
    uncertain: z.number(),
  }),
});
```

## Domain Knowledge

- `docs/planning/DATASET-MAPPINGS.md` — Existing approved mappings as examples
- `LivingWithFire-DB/api-reference/ATTRIBUTE-REGISTRY.md` — **Primary reference:** full 125-attribute tree with UUIDs and allowed values
- `LivingWithFire-DB/api-reference/SOURCE-REGISTRY.md` — Existing production sources (check before creating duplicates)
- `LivingWithFire-DB/api-reference/EAV-QUERY-PATTERNS.md` — Key UUID table for attribute lookups
- Source dataset's `DATA-DICTIONARY.md` — The source schema to map from

## Example Interaction

**Input:** FirePerformancePlants dataset

**Output (abbreviated):**
```json
{
  "mappings": [
    {
      "sourceColumn": "firewise_rating",
      "sourceDefinition": "Firewise (1), MODERATELY Firewise (2), AT RISK Firewise (3), NOT Firewise (4)",
      "targetAttribute": "Flammability",
      "mappingType": "CROSSWALK",
      "confidence": 0.95,
      "reasoning": "Source uses 1-4 numeric scale mapping directly to production Flammability categories",
      "crosswalk": {
        "Firewise (1)": "Firewise",
        "MODERATELY Firewise (2)": "Consider",
        "AT RISK Firewise (3)": "Unsuitable",
        "NOT Firewise (4)": "Unsuitable"
      }
    },
    {
      "sourceColumn": "landscape_zone",
      "sourceDefinition": "LZ1 (0-5ft), LZ2 (5-30ft), LZ3 (30-100ft), LZ4 (100ft+)",
      "targetAttribute": "Home Ignition Zone (HIZ)",
      "mappingType": "CROSSWALK",
      "confidence": 0.9,
      "reasoning": "Landscape zones correspond to HIZ defensible space tiers"
    }
  ]
}
```

## Failure Modes

| Failure | Handling |
|---------|----------|
| No DATA-DICTIONARY.md exists for source | Use `sampleSourceData` to infer column meanings; lower confidence scores |
| Ambiguous column name (e.g., "rating") | Check source context — which category is this dataset in? |
| Source rating scale doesn't align with any production scale | Propose NEW_ATTRIBUTE or mark UNCERTAIN |
| Source has compound columns (multiple values in one field) | Propose SPLIT mapping with extraction rules |
