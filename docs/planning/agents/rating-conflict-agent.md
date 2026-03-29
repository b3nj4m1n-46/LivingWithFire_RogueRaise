# Rating Conflict Agent

**Genkit Flow:** `ratingConflictFlow` | **Source:** `genkit/src/flows/ratingConflictFlow.ts`
**Priority:** P0 — Most common conflict type
**Status:** Implemented
**Model:** `MODELS.quality` (`anthropic/claude-sonnet-4-6`)

> **Note:** This flow defines and exports the shared `specialistInput` Zod schema and `SpecialistInput`/`SpecialistOutput` types used as the common input schema by all other specialist flows.

## Role

Investigates direct contradictions between rating values for the same plant+attribute. Uses rating scale crosswalks from DATASET-MAPPINGS.md and DATA-DICTIONARY.md files to determine whether the conflict is a true disagreement or a scale translation issue.

**Does:**
- Load both sources' rating scale definitions
- Determine if values are actually contradictory when normalized to the same scale
- Assess which source is more reliable for this specific claim (experimental data > literature review > expert opinion)
- Annotate the warrant pair with its analysis
- Recommend which warrant(s) the admin should consider

**Does NOT:**
- Make the final decision (admin does)
- Research external documents (Research Agent does that if needed)

## System Prompt

```
You are a rating conflict specialist for plant data. When two sources give different ratings for the same plant attribute, your job is to analyze whether they truly disagree and why.

APPROACH:
1. Load the DATA-DICTIONARY definitions for both sources' rating scales
2. Normalize both values to a common scale if possible
3. Determine if the conflict is:
   a. REAL — values are genuinely contradictory even after normalization
   b. APPARENT — values seem different but map to the same meaning on different scales
   c. NUANCED — both are partially correct (e.g., one rates the genus, the other rates a specific species)

4. For REAL conflicts, assess source reliability:
   - Experimental/lab data (highest reliability for measurable traits)
   - Field observation with defined methodology
   - Literature review / meta-analysis
   - Expert opinion / practitioner guide
   - Unspecified methodology (lowest)

5. Consider sample size: a study testing 34 shrubs > a list compiled from "common knowledge"
6. Consider recency: newer methodology may supersede older ratings
7. Consider regional specificity: a rating for Southern Oregon > a rating for "the Southeast US"

OUTPUT: Clear explanation of whether the conflict is real, why sources disagree, and which warrant(s) carry more weight for this specific use case.
```

## Tools

| Tool | Description |
|------|-------------|
| `getDatasetContext` | Loads DATA-DICTIONARY.md + README.md for both source dataset folders. Extracts Source ID via regex. |
| `searchDocumentIndex` | Searches 45+ knowledge-base document indexes for corroborating evidence (5 results) |

The flow resolves dataset folder paths from source names, loads context for both sources, searches the knowledge base, then calls the LLM with a detailed inline prompt. Handles `SCALE_MISMATCH` conflicts with an extra scale-reconciliation instruction. Validates verdict/recommendation enums, clamps confidence to [0,1], retries JSON parse once, and writes result to DB.

## Input Schema

```typescript
const RatingConflictInput = z.object({
  conflictId: z.string(),
  plantId: z.string(),
  attribute: z.string(),
  warrantA: z.object({
    id: z.string(),
    value: z.string(),
    sourceId: z.string(),
    sourceDataset: z.string(),
    sourceValue: z.string(), // original before crosswalk
  }),
  warrantB: z.object({
    id: z.string(),
    value: z.string(),
    sourceId: z.string(),
    sourceDataset: z.string(),
    sourceValue: z.string(),
  }),
});
```

## Output Schema

```typescript
const RatingConflictOutput = z.object({
  conflictId: z.string(),
  verdictType: z.enum(["REAL", "APPARENT", "NUANCED"]),
  explanation: z.string(), // human-readable analysis
  sourceAReliability: z.object({
    score: z.number().min(1).max(5),
    methodology: z.string(),
    reasoning: z.string(),
  }),
  sourceBReliability: z.object({
    score: z.number().min(1).max(5),
    methodology: z.string(),
    reasoning: z.string(),
  }),
  recommendation: z.enum(["PREFER_A", "PREFER_B", "KEEP_BOTH", "KEEP_BOTH_WITH_CONTEXT", "NEEDS_RESEARCH", "HUMAN_DECIDE"]),
  recommendationReasoning: z.string(),
  normalizedComparison: z.object({
    scaleUsed: z.string(),
    valueA: z.string(),
    valueB: z.string(),
  }).optional(),
});
```

## Domain Knowledge

- `docs/planning/DATASET-MAPPINGS.md` — Rating scale crosswalks
- `LivingWithFire-DB/api-reference/ATTRIBUTE-REGISTRY.md` — Production attribute allowed values (the target scales)
- All source dataset `DATA-DICTIONARY.md` files — Source-specific rating definitions
- `docs/planning/CONFLICT-TAXONOMY.md` — Classification criteria

## Example Interaction

**Conflict:** Juniperus scopulorum — Flammability
- Warrant A (FIRE-01): "NOT Firewise (4)" — SREF Fire Performance Plants
- Warrant B (FIRE-02): "Moderately Resistant" — Idaho Firewise

**Analysis:**
```json
{
  "verdictType": "NUANCED",
  "explanation": "SREF rates ALL Juniperus species as NOT Firewise (4) as a genus-level blanket rating based on the high volatile oil content common to junipers. Idaho Firewise provides a species-specific rating for J. scopulorum acknowledging that with proper maintenance (30ft setback, lower branches pruned, irrigation in drought), it performs moderately well in Intermountain West landscapes. Both ratings are methodologically valid but apply at different levels of specificity and assume different maintenance regimes.",
  "sourceAReliability": {
    "score": 3,
    "methodology": "Literature review, genus-level rating",
    "reasoning": "Comprehensive database but uses genus-level generalizations for conifers"
  },
  "sourceBReliability": {
    "score": 4,
    "methodology": "Regional practitioner guide, species-specific",
    "reasoning": "Idaho-specific, species-level assessment with maintenance conditions specified"
  },
  "recommendation": "KEEP_BOTH",
  "recommendationReasoning": "Both warrants provide valuable context. The SREF rating warns about inherent juniper flammability. The Idaho rating provides actionable guidance for property owners who already have J. scopulorum. The synthesized claim should reflect both: inherently flammable genus, but manageable with proper setback and maintenance in appropriate climates."
}
```

## Failure Modes

| Failure | Handling |
|---------|----------|
| Can't find DATA-DICTIONARY for one source | Use source metadata only; lower confidence; flag NEEDS_RESEARCH |
| Rating scales are completely incomparable | Flag as SCALE_MISMATCH; recommend HUMAN_DECIDE |
| Both sources have identical methodology | Likely a data error; flag for human review |
