# Synthesis Agent — Merge Warrants into Production Claims

> **Status:** TODO
> **Priority:** P0 (critical)
> **Depends on:** 012-warrant-claim-curation (claim view UI + synthesis stub exists)
> **Blocks:** None, but completes the core curation workflow end-to-end

## Problem

The claim curation UI (012) lets data stewards select warrants and approve claims, but the "Synthesize Claim" button is currently stubbed. The synthesis agent is the AI-powered step that reads the selected warrants—including their values, source methodologies, specialist verdicts, and conflict analyses—and produces a merged production-ready claim with a categorical value, synthesized text, and confidence assessment.

This is the final piece of the core Claim/Warrant model: warrants (evidence) → synthesis (AI merge) → claim (production value).

## Current Implementation

### What Exists
- Claim view UI at `/claims/[plantId]/[attributeId]` with warrant cards and selection checkboxes
- Synthesis stub at `admin/src/app/api/synthesize/route.ts` — returns placeholder response with shape: `{ synthesized_text, categorical_value, confidence, confidence_reasoning }`
- Claim approval API at `admin/src/app/api/claims/approve/route.ts` — writes to `claims` + `claim_warrants` + Dolt commit
- `claim-view-client.tsx` already calls `/api/synthesize` and displays results in editable textarea
- Genkit config with `MODELS.quality = 'anthropic/claude-sonnet-4-6'`
- Research tools for additional context
- `warrants` table with all evidence data
- `conflicts` table with specialist verdicts (when available from 014)

### What Does NOT Exist Yet
- `synthesizeClaimFlow` Genkit flow
- Real AI synthesis — the stub returns a placeholder string

## Proposed Changes

### 1. Synthesize Claim Flow

`genkit/src/flows/synthesizeClaimFlow.ts`:

```typescript
// Genkit flow: synthesizeClaimFlow
// Model: MODELS.quality (Sonnet 4.6) — needs nuanced reasoning for evidence synthesis
// Input: {
//   plantId: string,
//   plantName: string,           // "Juniperus scopulorum"
//   attributeId: string,
//   attributeName: string,       // "Flammability"
//   warrants: Array<{
//     id: string,
//     value: string,
//     sourceValue: string | null,
//     sourceDataset: string,
//     sourceIdCode: string,
//     sourceMethodology: string | null,
//     sourceRegion: string | null,
//     matchConfidence: number,
//     warrantType: 'existing' | 'external'
//   }>,
//   conflicts?: Array<{          // conflicts involving selected warrants
//     conflictType: string,
//     severity: string,
//     specialistVerdict: string | null,
//     specialistRecommendation: string | null
//   }>,
//   productionValue?: string | null  // current value in production, if any
// }
// Output: {
//   synthesized_text: string,      // human-readable merged description
//   categorical_value: string,     // the production value to set
//   confidence: 'HIGH' | 'MODERATE' | 'LOW',
//   confidence_reasoning: string,  // why this confidence level
//   sources_cited: string[],       // source_id_codes used
//   warrant_weights: Array<{ warrantId: string, weight: 'primary' | 'supporting' | 'contextual' }>
// }
```

#### Flow Steps:

1. **Gather context** — load attribute metadata (allowed values from production attribute registry)
2. **Load conflict context** — if any conflicts exist between selected warrants, include specialist verdicts
3. **LLM synthesis** — prompt Sonnet with:
   - All selected warrant values, sources, methodologies, regions
   - Conflict analyses and specialist verdicts (if any)
   - Current production value (if any)
   - Attribute's allowed values (from ATTRIBUTE-REGISTRY.md)
   - Instructions: "Synthesize these warrants into a single production value. Choose from the allowed values. Explain your reasoning, cite sources, and assess confidence."
4. **Parse and validate** — ensure `categorical_value` is from the attribute's allowed values list
5. **Return** structured synthesis result

### 2. Wire Synthesis API Route

Update `admin/src/app/api/synthesize/route.ts`:
- Replace stub with real call to `synthesizeClaimFlow`
- Load warrant details from DB for the given `warrantIds`
- Load any conflicts involving those warrants
- Load current production value
- Call the Genkit flow
- Return synthesis result in the same response shape the UI already expects

### 3. Test Script

`genkit/src/scripts/test-synthesis.ts`:

A runnable script for testing synthesis without the portal:

```typescript
// Usage: tsx src/scripts/test-synthesis.ts <plantId> <attributeId>
// Loads all warrants for that plant+attribute, runs synthesis, prints result
```

### What Does NOT Change

- Claim view UI (`claim-view-client.tsx`) — already handles synthesis response shape
- Claim approval API — unchanged (approves whatever the user finalizes)
- Warrant data — read-only
- DoltgreSQL schema — no table changes
- Other Genkit flows — unchanged

## Migration Strategy

1. Implement `genkit/src/flows/synthesizeClaimFlow.ts`
2. Create `genkit/src/scripts/test-synthesis.ts` for standalone testing
3. Update `admin/src/app/api/synthesize/route.ts` — replace stub with real flow call
4. Test with a multi-warrant example (e.g., a plant with 3+ warrants for Flammability from different sources)
5. Test with a conflicting warrant set (warrants that have associated conflicts)
6. Verify the UI round-trip: select warrants → Synthesize → edit → Approve → Dolt commit

## Files Modified

### New Files
- `genkit/src/flows/synthesizeClaimFlow.ts` — warrant synthesis flow
- `genkit/src/scripts/test-synthesis.ts` — standalone test script

### Modified Files
- `admin/src/app/api/synthesize/route.ts` — replace stub with real flow call

## Verification

1. **Synthesis produces valid output:**
   - Run test script on a plant with multiple warrants
   - Verify `categorical_value` is from the attribute's allowed values
   - Verify `synthesized_text` references the source datasets
   - Verify `confidence` is set with reasoning

2. **Conflict-aware synthesis:**
   - Run on a plant+attribute that has conflicts with specialist verdicts
   - Verify synthesis text references the conflict and specialist analysis

3. **UI round-trip works:**
   - Open a claim view → select 3+ warrants → click "Synthesize Claim"
   - Verify AI-generated text appears in the editable textarea
   - Edit the text → click "Approve"
   - Verify claim record + claim_warrants + Dolt commit created

4. **Stub replacement is seamless:**
   - The response shape matches what `claim-view-client.tsx` expects:
     `{ synthesized_text, categorical_value, confidence, confidence_reasoning }`
