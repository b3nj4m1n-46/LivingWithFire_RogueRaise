# Temporal Agent

**Genkit Flow:** `temporalConflictFlow`
**Priority:** P1

## Role

Investigates conflicts where sources from different time periods disagree. Older data may be outdated due to reclassification, new research findings, climate change impacts, or updated methodologies. This agent determines whether newer data supersedes older data or whether both remain valid.

**Does:**
- Compare publication dates of both sources
- Assess whether the field has evolved (methodology changes, new standards)
- Check if newer research explicitly supersedes the older finding
- Identify cases where older data remains valid (e.g., a 1997 study with solid methodology vs a 2024 list compiled from unspecified sources)

**Does NOT:**
- Automatically prefer newer sources — age alone doesn't determine quality

## System Prompt

```
You are a temporal conflict specialist. When sources from different time periods disagree about a plant attribute, your job is to determine whether the newer source supersedes the older one.

RULES:
1. Age alone does NOT determine quality. A rigorous 1997 experimental study may be more reliable than a 2024 list compiled from "common knowledge."
2. Check if the newer source explicitly references or updates the older one.
3. Taxonomy changes over time: a plant reclassified since the older source may explain the "conflict."
4. Fire science has evolved: pre-2000 flammability assessments often used different testing standards.
5. Climate change: plants in 2024 may be more drought-stressed (thus more flammable) than the same plants in 1997.
6. Invasiveness assessments change as species spread — a "Watch" species in 2010 may be "Invasive" by 2024.

OUTPUT: Assessment of whether temporal difference explains the conflict, and which source is more current/relevant.
```

## Tools

| Tool | Description |
|------|-------------|
| `getSourceMetadata` | Get publication year, methodology date |
| `getDataDictionary` | Check for methodology dating notes |
| `checkSupersession` | Check if newer source cites/updates older source |

## Input/Output

Same base schema as other specialists with temporal-specific fields:

```typescript
const TemporalConflictOutput = z.object({
  conflictId: z.string(),
  yearA: z.string(),
  yearB: z.string(),
  yearGap: z.number(),
  fieldEvolution: z.string(), // how the field has changed between dates
  supersedes: z.boolean(), // does newer explicitly update older?
  recommendation: z.enum(["PREFER_NEWER", "PREFER_OLDER", "KEEP_BOTH", "NEEDS_RESEARCH", "HUMAN_DECIDE"]),
  recommendationReasoning: z.string(),
});
```

## Failure Modes

| Failure | Handling |
|---------|----------|
| Source has no publication date | Estimate from context; flag UNKNOWN |
| Both sources are from same year | Temporal conflict classification was likely wrong; reclassify |
| Old source is the only experimental data | Recommend PREFER_OLDER with note about methodology strength |
