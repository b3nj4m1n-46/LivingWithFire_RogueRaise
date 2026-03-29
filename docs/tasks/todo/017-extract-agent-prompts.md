# Extract Agent Prompts — Decouple system prompts from flow code

> **Status:** TODO
> **Priority:** P2 (normal)
> **Depends on:** None (all 4 flows already working)
> **Blocks:** Future specialist agent implementations (T41-T45) should follow this pattern

## Problem

All agent system prompts are hardcoded as inline template strings inside their flow files. This means:

1. **Discoverability** — Someone inheriting this codebase (e.g., a legacy product integration team) has no way to know what each agent "thinks" without reading TypeScript
2. **Editability** — Prompt tuning requires editing `.ts` files, rebuilding, and hoping you didn't break the code around the string
3. **Auditability** — No diff-friendly view of prompt changes separate from logic changes
4. **Consistency** — The 12 agent profile MDs in `docs/planning/agents/` describe intended behavior, but runtime prompts may have drifted from those specs with no easy way to compare

## Current Implementation

| Flow File | Prompt Location | Type |
|---|---|---|
| `genkit/src/flows/classifyConflictFlow.ts` | `buildClassificationPrompt()` (line ~184) | Multi-section template with conflict types, routing table, pair descriptions |
| `genkit/src/flows/matchPlantFlow.ts` | `resolveAmbiguous()` (line ~365) | Small tiebreaker prompt |
| `genkit/src/flows/mapSchemaFlow.ts` | Inline in flow body (line ~153) | Large template with schema context, instructions, output format |
| `genkit/src/flows/bulkEnhanceFlow.ts` | N/A | No LLM calls |

## Proposed Changes

Create a `genkit/src/prompts/` directory with one `.md` file per agent prompt. Each file contains the system prompt template with `{{variable}}` placeholders for dynamic content.

### Prompt files

- `genkit/src/prompts/classify-conflict.md` — Conflict types, routing table, instructions, output schema. Dynamic: `{{pairDescriptions}}`
- `genkit/src/prompts/map-schema.md` — Mapping types, rules, output schema. Dynamic: `{{sourceDataset}}`, `{{sourceId}}`, `{{dataDictionary}}`, `{{readme}}`, `{{attributesTable}}`, `{{totalRows}}`, `{{headers}}`, `{{sampleRows}}`, `{{uniqueValues}}`
- `genkit/src/prompts/match-tiebreaker.md` — Candidate selection instructions. Dynamic: `{{scientificName}}`, `{{commonName}}`, `{{candidateList}}`

### Loader utility

- `genkit/src/prompts/load.ts` — Simple function: read `.md` file, replace `{{placeholders}}` with provided values, return string. No framework, no dependencies.

### Flow changes

Each flow replaces its inline string with a call to the loader. Logic and schemas stay untouched.

### What Does NOT Change

- Flow logic, schemas, tools, DB writes — zero functional changes
- `docs/planning/agents/` profile MDs — those remain design specs
- `bulkEnhanceFlow.ts` — no LLM calls, nothing to extract

## Migration Strategy

1. Create `genkit/src/prompts/` directory
2. Write `load.ts` utility (read file + replace placeholders)
3. Extract `classifyConflictFlow` prompt into `classify-conflict.md`, wire up loader
4. Extract `mapSchemaFlow` prompt into `map-schema.md`, wire up loader
5. Extract `matchPlantFlow` tiebreaker prompt into `match-tiebreaker.md`, wire up loader
6. Verify all 3 flows produce identical output (run against FIRE-01 test case)
7. Add a `README.md` in `genkit/src/prompts/` explaining the pattern for future agents

## Files Modified

### New Files
- `genkit/src/prompts/classify-conflict.md` — Conflict classifier system prompt
- `genkit/src/prompts/map-schema.md` — Schema mapper system prompt
- `genkit/src/prompts/match-tiebreaker.md` — Matcher tiebreaker prompt
- `genkit/src/prompts/load.ts` — Template loader utility
- `genkit/src/prompts/README.md` — Pattern docs for future agents

### Modified Files
- `genkit/src/flows/classifyConflictFlow.ts` — Replace `buildClassificationPrompt()` body with loader call
- `genkit/src/flows/mapSchemaFlow.ts` — Replace inline prompt string with loader call
- `genkit/src/flows/matchPlantFlow.ts` — Replace `resolveAmbiguous()` prompt with loader call

## Verification

1. Run `npx tsx src/scripts/test-matcher.ts` — matcher results unchanged
2. Run classify conflict in dry-run mode against existing warrants — same conflict types/counts
3. Diff the extracted `.md` files against the inline strings — should be identical content minus the JS string escaping
4. Future specialist agents (T41-T45) should be created prompt-first in `genkit/src/prompts/` before writing the flow
