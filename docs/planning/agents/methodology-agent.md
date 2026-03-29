# Methodology Agent

**Genkit Flow:** `methodologyConflictFlow` | **Source:** `genkit/src/flows/methodologyConflictFlow.ts`
**Priority:** P1
**Model:** None — **STUB implementation** (no LLM call)

> **Implementation Status:** This flow is currently a stub. It loads DATA-DICTIONARY.md from both source datasets, surfaces methodology strings from `sourceMethodologyA`/`B`, and writes a hardcoded `NUANCED / HUMAN_DECIDE / confidence: 0` verdict to the DB. Full LLM-powered analysis is planned but not yet implemented.

## Role

Investigates conflicts where sources used different methodologies to arrive at different conclusions. A controlled burn test, a literature review, and a practitioner's field observation may all produce different ratings for the same plant — and all may be "correct" within their methodology.

**Does:**
- Identify the methodology behind each source's rating (from DATA-DICTIONARY.md)
- Assess methodology quality and applicability
- Determine whether the conflict is due to methodology limitations or genuine disagreement
- Explain how different test conditions produce different results

**Does NOT:**
- Dismiss any methodology entirely — even anecdotal data has value as a warrant

## System Prompt

```
You are a research methodology specialist. When plant data from different methodologies conflicts, your job is to explain why and assess the relative strengths.

METHODOLOGY HIERARCHY (general, not absolute):
1. Controlled experimental testing (cone calorimetry, ASTM standards) — most precise but narrow conditions
2. Field observation with defined protocol and sample size — ecologically valid but variable
3. Multi-source literature review / meta-analysis — broad but only as good as inputs
4. Regional expert consensus / extension service compilation — practical but may lack rigor
5. Practitioner guide / nursery recommendation — accessible but methodology often unstated
6. Unspecified / "common knowledge" — lowest evidentiary weight

IMPORTANT NUANCES:
- Lab tests measure flammability under controlled conditions. A plant "moderately flammable" in a cone calorimeter may still be "fire-resistant" in a well-maintained landscape with irrigation.
- Literature reviews aggregate many perspectives but can perpetuate errors from their sources.
- Field observations are highly context-dependent (soil, irrigation, maintenance, adjacent plants).
- Extension service compilations are often the most practical for homeowners but may simplify complex data.

OUTPUT: Explanation of how methodology differences explain the conflict, with assessment of which methodology is most applicable to the target use case (residential landscaping in Pacific West).
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
  analysis: string, // surfaces methodology strings from both DATA-DICTIONARYs
  confidence: 0,
}
```

**Planned output** (when LLM integration is added — schema below preserved as design target):
```typescript
const MethodologyConflictOutput = z.object({
  // ... shared specialist fields (verdict, recommendation, analysis, confidence) plus:
  methodologyA: z.object({
    type: z.string(),
    description: z.string(),
    strengths: z.array(z.string()),
    limitations: z.array(z.string()),
    applicabilityScore: z.number().min(1).max(5),
  }),
  methodologyB: z.object({
    type: z.string(),
    description: z.string(),
    strengths: z.array(z.string()),
    limitations: z.array(z.string()),
    applicabilityScore: z.number().min(1).max(5),
  }),
});
```

## Example

**Conflict:** Buxus sempervirens (Boxwood) — Flammability
- Warrant A (FIRE-04, NIST Experimental): "Low flammability" — cone calorimeter, 80% FMC
- Warrant B (FIRE-01, SREF): "AT RISK Firewise (3)" — literature compilation

**Analysis:** "NIST tested boxwood under controlled conditions at 80% fuel moisture content and found low heat release rates. SREF compiled fire ratings from multiple published sources where boxwood is frequently listed as problematic due to dense growth habit that accumulates dead material inside the canopy, creating fuel loading even when exterior foliage is healthy. Both are correct: boxwood's live tissue has low flammability, but its growth habit creates fire risk in unmaintained specimens. Recommend KEEP_BOTH — the synthesis should note inherently low flammability with maintenance caveat about interior dead material accumulation."

## Failure Modes

| Failure | Handling |
|---------|----------|
| Source methodology is unstated | Note "methodology unknown"; lower confidence; flag for research |
| Both sources use same methodology but disagree | Not a methodology conflict — reclassify as RATING_DISAGREEMENT |
| Methodology is described but ambiguous | Extract what you can; flag unclear aspects |
