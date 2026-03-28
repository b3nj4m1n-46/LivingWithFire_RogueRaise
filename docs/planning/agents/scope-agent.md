# Scope Agent

**Genkit Flow:** `scopeConflictFlow`
**Priority:** P0 — Critical for Pacific West focus

## Role

Investigates conflicts where the disagreement stems from geographic, climatic, or ecological scope differences. A plant rated "fire-resistant" in the Southeast may behave differently in Southern Oregon. This agent determines whether a source's data is applicable to the target region.

**Does:**
- Assess each source's geographic scope (from README.md and DATA-DICTIONARY.md)
- Determine overlap with the target region (Pacific West: OR, CA, WA)
- Check if the plant's native range includes the target region (via POWO/WCVP)
- Evaluate whether fire/climate conditions differ enough to invalidate ratings
- Annotate warrants with scope applicability assessment

**Does NOT:**
- Override ratings from regional sources — a source being "out of scope" doesn't make it wrong
- Make final decisions on data inclusion

## System Prompt

```
You are a geographic scope specialist. When plant data comes from different regions, your job is to assess whether each source's findings are applicable to the Pacific West (Oregon, California, Washington).

CONSIDER:
1. Climate zone: Mediterranean (dry summer) vs humid subtropical vs continental
2. Fire regime: PNW fires behave differently than Southeast or Intermountain fires
3. Precipitation patterns: summer drought in OR/CA changes plant flammability dynamics
4. Native range: a plant native to SE may perform differently when grown in OR
5. Hardiness zones: sources from zones 3-5 may not apply to zones 7-9

REGIONAL CONTEXT:
- Southern Oregon (Rogue Valley): USDA zones 7b-8a, Mediterranean climate, summer fire season
- Northern California: zones 7-9, varied from coastal to inland
- Western Oregon: zones 7b-9a, maritime influence
- Eastern Oregon: zones 5-7, continental, colder winters

RULES:
- Data from Pacific West sources is highest applicability
- Data from Mediterranean climates (parts of CA, Australia, S. Europe) may transfer well
- Data from humid Southeast or cold Northeast should be flagged — plants behave differently in dry-summer climates
- Genus-level data from any region is generally more transferable than species-level data from a mismatched region
- A scope difference doesn't mean the data is wrong — it means it needs context
```

## Tools

| Tool | Description |
|------|-------------|
| `getSourceRegion` | Returns the geographic scope of a source dataset |
| `getPlantNativeRange` | Queries POWO/WCVP for native distribution |
| `getClimateZone` | Returns USDA hardiness zone for a location |
| `getDataDictionary` | Load source's geographic scope notes |

## Input/Output Schema

Same structure as Rating Conflict Agent but with scope-specific fields:

```typescript
const ScopeConflictOutput = z.object({
  conflictId: z.string(),
  warrantAScope: z.object({
    region: z.string(),
    climateType: z.string(),
    applicabilityToTarget: z.enum(["HIGH", "MODERATE", "LOW", "UNKNOWN"]),
    reasoning: z.string(),
  }),
  warrantBScope: z.object({
    region: z.string(),
    climateType: z.string(),
    applicabilityToTarget: z.enum(["HIGH", "MODERATE", "LOW", "UNKNOWN"]),
    reasoning: z.string(),
  }),
  plantNativeRange: z.string(),
  recommendation: z.enum(["PREFER_A", "PREFER_B", "KEEP_BOTH_WITH_CONTEXT", "NEEDS_RESEARCH", "HUMAN_DECIDE"]),
  recommendationReasoning: z.string(),
});
```

## Example

**Conflict:** Rhododendron catawbiense — Flammability
- Warrant A (FIRE-01, SREF Southeast): "AT RISK Firewise (3)"
- Warrant B (FIRE-09, OSU PNW590): "Considered fire-resistant"

**Analysis:** "SREF rates from a Southeast US perspective where Rhododendron grows in humid understory conditions. OSU PNW590 evaluates for Western Oregon landscapes where the same plant experiences summer drought stress, changing its moisture content and fire behavior. The PNW590 rating is more applicable to the target region. Recommend: PREFER_B with Warrant A retained as context for non-PNW plantings."

## Failure Modes

| Failure | Handling |
|---------|----------|
| Source has no regional info | Check source README; infer from plant selection; flag UNKNOWN |
| Plant is non-native to both regions | Note this; non-native plants may have unpredictable fire behavior outside native range |
| Multiple climate zones in target region | Assess for the specific sub-region (e.g., Rogue Valley vs coast) |
