# Synthesis Agent

**Genkit Flow:** `synthesizeClaimFlow` | **Source:** `genkit/src/flows/synthesizeClaimFlow.ts`
**Priority:** P0 — Core of the Claim/Warrant model
**Status:** Implemented
**Model:** `MODELS.quality` (`anthropic/claude-sonnet-4-6`)

## Role

The final agent in the pipeline. Takes the admin's curated warrants (the evidence they've selected) and synthesizes them into a single rich production claim. This is where multiple source perspectives become one authoritative, nuanced data point.

**Does:**
- Take N selected warrants for a plant+attribute
- Synthesize a merged value/description that incorporates all selected evidence
- Cite each warrant in the synthesis so provenance is traceable
- Handle conflicting warrants gracefully (note the disagreement and conditions)
- Produce output that fits the production EAV schema

**Does NOT:**
- Select warrants (admin does that)
- Research evidence (Research Agent does that)
- Override admin selections — if the admin selected conflicting warrants, the synthesis should reflect both perspectives

## System Prompt

```
You are a plant data synthesis specialist. An admin has curated a set of warrants (evidence from multiple sources) for a specific plant attribute. Your job is to synthesize them into a single production claim.

RULES:
1. Include ALL selected warrants in your synthesis. Don't drop any.
2. When warrants agree, strengthen the claim with "multiple sources confirm."
3. When warrants conflict, present both perspectives with conditions: "Source A rates as fire-resistant for landscape use; Source B found moderate flammability under controlled burn conditions."
4. Cite sources by name, not by ID: "per OSU Extension PNW590" not "per FIRE-09."
5. Be concise but complete. The production claim should be usable by a homeowner.
6. Structure the output to fit the production attribute's value_type:
   - If the attribute expects a categorical value (e.g., "Firewise", "Consider", "Unsuitable"), provide one
   - If the attribute expects text, provide a descriptive synthesis
   - If both, provide the categorical value PLUS a notes field with the synthesis
7. When warrants provide quantitative data (e.g., "30ft setback", "plant factor 0.3"), preserve the numbers.
8. End with a confidence assessment: how well-supported is this claim?

TONE: Authoritative but honest about uncertainty. This data guides homeowners making fire-safety decisions.
```

## Tools

| Tool | Description |
|------|-------------|
| `getProductionAttributes` | Returns attribute metadata including `value_type` and `values_allowed` for validation |
| `getWarrantGroups` | Retrieves warrant details for the plant+attribute combination |
| `searchDocumentIndex` | Searches knowledge-base indexes for additional context |

The flow loads attribute metadata (value type + allowed values), searches the knowledge base, then calls the LLM with an inline prompt. Validates `categorical_value` against `valuesAllowed`. Assigns `warrant_weights` (`primary`/`supporting`/`contextual`).

## Input Schema

```typescript
const SynthesizeInput = z.object({
  plantId: z.string(),
  plantName: z.string(),
  attribute: z.string(),
  attributeId: z.string(),
  selectedWarrants: z.array(z.object({
    id: z.string(),
    value: z.string(),
    sourceValue: z.string(), // original before normalization
    sourceName: z.string(),
    sourceDataset: z.string(),
    methodology: z.string().optional(),
    region: z.string().optional(),
    year: z.string().optional(),
    specialistNotes: z.string().optional(), // annotations from conflict specialists
  })),
  existingProductionValue: z.string().optional(), // current claim, if any
  researchFindings: z.string().optional(), // from Research Agent, if available
});
```

## Output Schema

```typescript
const SynthesizeOutput = z.object({
  synthesized_text: z.string(), // full synthesis with citations
  categorical_value: z.string().optional(), // validated against attribute's valuesAllowed
  confidence: z.enum(["HIGH", "MODERATE", "LOW"]),
  confidence_reasoning: z.string(),
  sources_cited: z.array(z.string()), // source names used
  warrant_weights: z.record(z.string(), z.enum(["primary", "supporting", "contextual"])), // warrant_id → weight
});
```

## Example

**Input:**
- Plant: Ceanothus velutinus (Snowbrush)
- Attribute: Flammability
- Selected warrants:
  1. FIRE-01 (SREF): "AT RISK Firewise (3)" — literature compilation
  2. FIRE-02 (Idaho): "Moderately Resistant, 50ft setback" — practitioner guide
  3. FIRE-09 (OSU PNW590): "Fire-resistant" — PNW-specific literature review
  4. Research finding: "Nitrogen-fixing ability promotes vigorous growth; needs pruning"

**Output:**
```json
{
  "categoricalValue": "Consider",
  "synthesizedText": "Ceanothus velutinus has mixed fire performance ratings across sources. OSU Extension PNW590 classifies it as fire-resistant for Pacific Northwest landscapes. Idaho Firewise rates it as Moderately Resistant with a recommended 50ft setback from structures. SREF rates the genus as AT RISK (3) based on broader literature review. The variation likely reflects regional differences and maintenance assumptions — Ceanothus is a nitrogen-fixer that produces vigorous growth, which can increase fuel loading if not regularly pruned. With proper maintenance (annual pruning, adequate spacing), suitable for zones 30-100ft from structures in PNW climates.",
  "confidence": "MODERATE",
  "confidenceReasoning": "Three sources with two agreeing on fire-resistance with conditions, one rating as at-risk. Regional PNW sources more applicable to target area. No controlled burn data available for this species.",
  "warrantsCited": ["w-001", "w-002", "w-003"],
  "changesFromCurrent": "Previous value was unrated. New claim adds flammability assessment from 3 sources.",
  "suggestedNotes": "Maintain by pruning annually to reduce fuel loading. 50ft setback recommended per Idaho Firewise."
}
```

## Failure Modes

| Failure | Handling |
|---------|----------|
| Only one warrant selected | Still synthesize — note "single source, limited corroboration" |
| All warrants conflict with no agreement | Present all perspectives; set confidence LOW; note irreconcilable |
| Attribute expects numeric value but warrants are qualitative | Map to nearest allowed value; note the approximation |
| Warrant has no source name | Use dataset name as fallback |
| Admin selected a warrant the specialist recommended excluding | Respect admin choice — include it with the specialist's caveat |
