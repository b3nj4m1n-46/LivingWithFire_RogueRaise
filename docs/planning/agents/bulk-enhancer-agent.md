# Bulk Enhancer Agent

**Genkit Flow:** `bulkEnhanceFlow` | **Source:** `genkit/src/flows/bulkEnhanceFlow.ts`
**Priority:** P0 — Core data pipeline
**Status:** Implemented
**Model:** None — pure data transformation, no LLM calls

## Role

Executes an approved schema mapping by creating warrants for each matched plant. This is primarily a **data operation** — the intelligence was in the Schema Mapper (mapping) and Matcher (plant linking). The Bulk Enhancer writes the warrants, then hands off to the Conflict Classifier for review.

**Does:**
- Take an approved schema mapping and matched plant list
- Create warrant records for each plant+attribute+value combination
- Apply crosswalk transformations (source values → production values)
- Track source provenance for every warrant
- Trigger conflict detection after warrant creation

**Does NOT:**
- Decide mappings (Schema Mapper does that)
- Match plants (Matcher does that)
- Resolve conflicts (Specialist agents + human do that)
- Make quality judgments — it faithfully represents what the source says

## System Prompt

```
You are a data pipeline agent. Your job is to create warrant records from a source dataset based on an approved schema mapping and plant matching results.

For each source row:
1. Look up the matched production plant_id
2. For each mapped column, create a warrant with:
   - The production attribute_id
   - The value (transformed via crosswalk if applicable)
   - The original source value (preserved as source_value)
   - Full provenance (source dataset, source row, source column)
3. Skip rows with no plant match (match_type = NONE)
4. For AMBIGUOUS matches, create warrants but flag them for human review
5. For GENUS_ONLY matches, note the scope limitation in the warrant metadata

RULES:
- Never modify source values silently. If a crosswalk transforms "A" to "Very High", keep both.
- If a source value doesn't fit the crosswalk, create the warrant anyway with the raw value and flag it.
- Count everything. Report exactly how many warrants were created, skipped, and flagged.
```

## Tools

| Tool / Utility | Description |
|------|-------------|
| `parseCSV` (util) | Reads source CSV rows via `genkit/src/utils/csv.ts` |
| `queryDolt` | Retrieves approved mapping and match results; batch-inserts warrants (chunks of 500) |

Note: This flow reads mapping and match results directly from DoltgreSQL rather than calling other flows. Crosswalk transformations are applied inline.

## Input Schema

```typescript
const BulkEnhanceInput = z.object({
  sourceDataset: z.string(),
  mappingId: z.string(), // reference to approved schema mapping
  matchBatchId: z.string(), // reference to matcher results
  dryRun: z.boolean().default(false), // preview without writing
});
```

## Output Schema

```typescript
const BulkEnhanceOutput = z.object({
  warrantsCreated: z.number(),
  warrantsSkipped: z.number(), // no plant match
  warrantsFlagged: z.number(), // ambiguous match or unmapped value
  attributesCovered: z.array(z.string()), // which production attributes got new warrants
  plantsCovered: z.number(), // how many production plants got new data
  newPlantCandidates: z.number(), // unmatched source plants
  errors: z.array(z.object({
    sourceRow: z.string(),
    error: z.string(),
  })),
});
```

## Domain Knowledge

- Approved schema mapping (from Schema Mapper → human review)
- Plant match results (from Matcher)
- Source CSV data
- `LivingWithFire-DB/api-reference/ATTRIBUTE-REGISTRY.md` — Target attributes with UUIDs and allowed values
- `LivingWithFire-DB/api-reference/SOURCE-REGISTRY.md` — Check if source already exists before creating
- `LivingWithFire-DB/api-reference/EAV-QUERY-PATTERNS.md` — SQL patterns for inserting values

## Failure Modes

| Failure | Handling |
|---------|----------|
| Crosswalk doesn't cover a source value | Create warrant with raw value, flag for review |
| Plant match is AMBIGUOUS | Create warrant linked to best candidate, flag for human confirmation |
| Source row has missing/null values | Skip that column for that row, don't create empty warrants |
| Duplicate warrant (same plant+attribute+source) | Check for existing warrant, skip if identical, flag if different value |
