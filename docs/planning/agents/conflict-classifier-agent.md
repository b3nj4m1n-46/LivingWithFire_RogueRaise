# Conflict Classifier Agent

**Genkit Flow:** `classifyConflictFlow` | **Source:** `genkit/src/flows/classifyConflictFlow.ts`
**Priority:** P0 — Required for conflict detection
**Model:** `MODELS.bulk` (`anthropic/claude-haiku-4-5`)
**Prompt:** `genkit/src/prompts/classify-conflict.md`

## Role

The dispatcher. Scans warrants for a given plant (or batch of plants) and detects where warrants disagree. Classifies each conflict by type using CONFLICT-TAXONOMY.md, assigns severity, and routes to the appropriate specialist agent.

Works in three modes:
1. **Internal scan** — Analyze existing production values for conflicts within the DB
2. **External scan** — Compare new warrants against existing production values
3. **Cross-source scan** — Compare warrants from different source datasets against each other

**Does:**
- Compare all warrants for the same plant+attribute
- Classify conflict type (rating, scope, temporal, methodology, definition, taxonomy)
- Assign severity (critical, moderate, minor)
- Route to the appropriate specialist agent
- Detect non-conflicts (warrants that agree or complement each other)

**Does NOT:**
- Resolve conflicts (specialists + human do that)
- Research evidence (Research Agent does that)
- Synthesize claims (Synthesis Agent does that)

## System Prompt

```
You are a conflict detection and classification agent. You analyze warrants (source evidence) for plant attributes and identify where sources disagree.

For each plant+attribute combination with multiple warrants:
1. Compare the warrant values
2. Determine if they conflict or complement each other
3. If they conflict, classify the type using these categories:
   - RATING_DISAGREEMENT: Direct contradiction (Source A says "resistant", Source B says "not resistant")
   - SCALE_MISMATCH: Incompatible rating systems that can't be directly compared
   - SCOPE_DIFFERENCE: Source applies to a different region/climate than target
   - TEMPORAL_CONFLICT: Older source contradicts newer source (methodology may have changed)
   - METHODOLOGY_DIFFERENCE: Lab testing vs field observation vs literature review
   - DEFINITION_CONFLICT: Sources use the same term but define it differently
   - GRANULARITY_MISMATCH: Different taxonomic levels (genus vs species vs cultivar)
   - COMPLETENESS_CONFLICT: One source has data the other lacks (deterministic — no specialist needed)

4. Assign severity:
   - CRITICAL: Direct contradiction on a safety-relevant attribute (flammability, invasiveness)
   - MODERATE: Meaningful disagreement that affects plant recommendations
   - MINOR: Trivial difference or complementary information

5. Route to the appropriate specialist agent based on conflict type.

RULES:
- Two warrants saying the same thing in different words is NOT a conflict. That's corroboration.
- A warrant with more detail than another is NOT a conflict. That's enhancement.
- Only flag actual disagreements where accepting one warrant would contradict another.
- For flammability and invasiveness, err on the side of flagging — false positives are safer than false negatives.
```

## Tools

| Tool | Description |
|------|-------------|
| `getWarrantGroups` | Returns groups of warrants sharing the same plant_id + attribute_id (conflict candidates). Supports mode filtering, pagination, and min group size. |
| `writeConflict` | Creates a single conflict record with status `pending` |
| `writeConflictsBatch` (non-tool) | Bulk-inserts multiple conflict records in a single multi-row INSERT |

**Processing pipeline:** Fetches warrant groups → runs deterministic pre-classification (corroboration, completeness) → batches remaining pairs through LLM (25 pairs/batch) → optionally dispatches all 6 specialist flows via `runSpecialists` flag.

## Input Schema

```typescript
const ClassifyConflictInput = z.object({
  mode: z.enum(["internal", "external", "cross_source"]),
  plantIds: z.array(z.string()).optional(), // specific plants, or null for full scan
  attributeFilter: z.string().optional(), // e.g., "Flammability" to focus on fire data
  sourceDataset: z.string().optional(), // for external mode: which new source to compare
  batchId: z.string().optional(), // groups conflicts for tracking
  dryRun: z.boolean().default(false), // preview without writing to DB
  runSpecialists: z.boolean().default(false), // dispatch specialist flows after classification
});
```

## Output Schema

```typescript
const ClassifyConflictOutput = z.object({
  conflicts: z.array(z.object({
    plantId: z.string(),
    plantName: z.string(),
    attribute: z.string(),
    conflictType: z.enum([
      "RATING_DISAGREEMENT", "SCALE_MISMATCH", "SCOPE_DIFFERENCE",
      "TEMPORAL_CONFLICT", "METHODOLOGY_DIFFERENCE", "DEFINITION_CONFLICT",
      "GRANULARITY_MISMATCH", "COMPLETENESS_CONFLICT"
    ]),
    severity: z.enum(["CRITICAL", "MODERATE", "MINOR"]),
    warrantA: z.object({ id: z.string(), value: z.string(), source: z.string() }),
    warrantB: z.object({ id: z.string(), value: z.string(), source: z.string() }),
    explanation: z.string(), // why the classifier thinks these conflict
    routeTo: z.string(), // specialist agent flow name
  })),
  complementary: z.number(), // warrants that enhance without conflicting
  corroborations: z.number(), // warrants that agree
  summary: z.object({
    totalPlantsScanned: z.number(),
    plantsWithConflicts: z.number(),
    critical: z.number(),
    moderate: z.number(),
    minor: z.number(),
    byType: z.record(z.string(), z.number()),
  }),
});
```

## Domain Knowledge

- `docs/planning/CONFLICT-TAXONOMY.md` — Full definitions of each conflict type
- `LivingWithFire-DB/api-reference/ATTRIBUTE-REGISTRY.md` — Production attribute tree to understand what "same attribute" means
- `LivingWithFire-DB/api-reference/EAV-QUERY-PATTERNS.md` — SQL for detecting conflicts (see "Detect internal conflicts" query)
- `LivingWithFire-DB/api-reference/SOURCE-REGISTRY.md` — Source metadata for regional scope and methodology assessment

## Example Interaction

**Input:** Internal scan of all Flammability values

**Output (one conflict):**
```json
{
  "conflicts": [{
    "plantId": "abc-123",
    "plantName": "Juniperus scopulorum",
    "attribute": "Flammability",
    "conflictType": "RATING_DISAGREEMENT",
    "severity": "CRITICAL",
    "warrantA": {
      "id": "w-001",
      "value": "NOT Firewise (4)",
      "source": "Fire Performance Plants Selector (SREF)"
    },
    "warrantB": {
      "id": "w-002",
      "value": "Moderately Resistant",
      "source": "Idaho Firewise Database"
    },
    "explanation": "SREF rates all junipers as NOT Firewise due to high oil content. Idaho Firewise rates Rocky Mountain juniper as Moderately Resistant in their regional context with proper maintenance. This is likely a SCOPE_DIFFERENCE (Southeast vs Intermountain West) combined with a METHODOLOGY_DIFFERENCE (blanket genus rating vs species-specific field assessment).",
    "routeTo": "ratingConflictFlow"
  }]
}
```

## Failure Modes

| Failure | Handling |
|---------|----------|
| Same value expressed differently (e.g., "Low" vs "low" vs "L") | Normalize before comparing; don't flag formatting differences |
| Attribute hierarchy ambiguity (child vs parent level) | Compare at the same hierarchy level; flag cross-level comparisons as SCALE_MISMATCH |
| Missing source metadata (can't determine scope/date) | Classify as UNCERTAIN and include in output for human review |
| Massive conflict count (>1000) | Batch and prioritize by severity; process CRITICAL first |
