# Definition Agent

**Genkit Flow:** `definitionConflictFlow` | **Source:** `genkit/src/flows/definitionConflictFlow.ts`
**Priority:** P1
**Model:** None — **STUB implementation** (no LLM call)

> **Implementation Status:** This flow is currently a stub. It loads DATA-DICTIONARY.md from both source datasets, builds a human-review analysis string, and writes a hardcoded `NUANCED / HUMAN_DECIDE / confidence: 0` verdict to the DB. Full LLM-powered analysis is planned but not yet implemented.

## Role

Investigates conflicts where sources use the same term but define it differently. "Drought tolerant" in WUCOLS (quantified as <40% ET0 plant factor) means something different from "drought tolerant" in a nursery catalog ("survives without summer watering"). This agent identifies semantic mismatches and proposes normalization.

**Does:**
- Compare term definitions across source DATA-DICTIONARYs
- Identify when the "conflict" is really just different definitions of the same word
- Propose how to represent both definitions in the production system
- Map qualitative terms to quantitative ranges where possible

**Does NOT:**
- Redefine terms — preserves source definitions as-is in warrants

## System Prompt

```
You are a semantic analysis specialist for plant data. Your job is to identify when apparent conflicts are actually definition mismatches — two sources using the same word to mean different things.

COMMON DEFINITION CONFLICTS IN PLANT DATA:
- "Fire-resistant" — ranges from "won't ignite under lab conditions" to "doesn't spread fire quickly" to "survived past fires in this region"
- "Drought tolerant" — ranges from "survives with no irrigation" to "needs less water than average" to "native to dry climates"
- "Native" — ranges from "present before European contact" to "naturally occurring in this state" to "not cultivated/hybridized"
- "Deer resistant" — ranges from "deer never eat it" to "deer prefer other plants" to "toxic to deer"
- "Low maintenance" — undefined in most sources
- "Invasive" — ranges from "spreads aggressively" to "non-native" to "listed on official invasive species registry"

APPROACH:
1. Load both sources' DATA-DICTIONARY.md definitions for the term in question
2. Identify the specific definition each source uses
3. Determine if the values would agree under a common definition
4. If so, this is an APPARENT conflict — annotate with both definitions
5. If values genuinely disagree even under the same definition, reclassify as RATING_DISAGREEMENT

OUTPUT: Clear explanation of the definitional difference, with both definitions preserved in the warrant annotations.
```

## Tools

| Tool | Description |
|------|-------------|
| `getDatasetContext` | Loads DATA-DICTIONARY.md + README.md for both source dataset folders |

## Input/Output

Uses shared `SpecialistInput` (from `ratingConflictFlow.ts`) as input.

**Current stub output** (hardcoded):
```typescript
{
  verdict: "NUANCED",
  recommendation: "HUMAN_DECIDE",
  analysis: string, // human-review analysis built from both DATA-DICTIONARYs
  confidence: 0,
}
```

**Planned output** (when LLM integration is added — schema below preserved as design target):
```typescript
const DefinitionConflictOutput = z.object({
  // ... shared specialist fields (verdict, recommendation, analysis, confidence) plus:
  term: z.string(),
  definitionA: z.object({
    source: z.string(),
    definition: z.string(),
    quantitative: z.boolean(),
    measure: z.string().optional(),
  }),
  definitionB: z.object({
    source: z.string(),
    definition: z.string(),
    quantitative: z.boolean(),
    measure: z.string().optional(),
  }),
  productionDefinition: z.string(),
  isRealConflict: z.boolean(),
});
```

## Example

**Conflict:** Arctostaphylos uva-ursi — Drought Tolerant
- Warrant A (WATER-01, WUCOLS): "Low water use" (plant factor 0.1-0.3)
- Warrant B (OSU DroughtTolerant): "Drought tolerant" (survived 3 years without irrigation in Corvallis)

**Analysis:** "These aren't conflicting — they're complementary definitions of the same phenomenon. WUCOLS quantifies water use relative to ET0 reference. OSU experimentally verified survival without irrigation. Both support 'drought tolerant' but from different evidentiary bases. Recommend KEEP_BOTH_WITH_CONTEXT — the synthesized claim should cite the quantitative WUCOLS measure AND the OSU experimental validation."

## Failure Modes

| Failure | Handling |
|---------|----------|
| Source doesn't define the term at all | Note "definition not provided"; compare values only |
| Production attribute has no clear definition | Flag as opportunity to improve production schema |
| Definition is embedded in prose, not a clean statement | Extract the operational definition from context |
