# Agent Prompt Templates

System prompts for LLM agent flows, stored as Markdown files with `{{placeholder}}` tokens for dynamic content.

## How it works

Each `.md` file is a prompt template. The `loadPrompt()` function in `load.ts` reads the file and replaces `{{variableName}}` tokens with values you provide:

```ts
import { loadPrompt } from '../prompts/load.js';

const prompt = loadPrompt('classify-conflict.md', {
  pairDescriptions: buildPairDescriptions(pairs),
});
```

Missing variables throw an error immediately rather than producing a broken prompt.

## Adding a new prompt

1. Create `genkit/src/prompts/your-prompt.md` with `{{placeholders}}` for dynamic content
2. Import `loadPrompt` in your flow file
3. Call `loadPrompt('your-prompt.md', { key: value })` where you previously had an inline template string

Keep data-formatting logic (building tables, joining arrays) in the flow file. Pass the resulting strings as placeholder values.

## Current prompts

| File | Used by | Placeholders |
|---|---|---|
| `classify-conflict.md` | `classifyConflictFlow.ts` | `pairDescriptions` |
| `map-schema.md` | `mapSchemaFlow.ts` | `sourceDataset`, `sourceId`, `dataDictionary`, `readme`, `attributesTable`, `totalRows`, `headers`, `sampleRowCount`, `sampleRows`, `uniqueValues` |
| `match-tiebreaker.md` | `matchPlantFlow.ts` | `plantDescription`, `candidateList` |
