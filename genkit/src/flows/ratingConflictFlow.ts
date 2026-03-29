import { z } from 'zod';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ai, MODELS } from '../config.js';
import { getDatasetContext } from '../tools/datasetContext.js';
import { searchDocumentIndex } from '../tools/searchDocumentIndex.js';
import { doltPool } from '../tools/dolt.js';

// Repo root is three levels up from genkit/src/flows/
const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');

const CATEGORIES = [
  'fire', 'deer', 'traits', 'taxonomy', 'water',
  'pollinators', 'birds', 'native', 'invasive',
];

// --- Types ---

const VERDICTS = ['REAL', 'APPARENT', 'NUANCED'] as const;
const RECOMMENDATIONS = [
  'PREFER_A', 'PREFER_B', 'KEEP_BOTH', 'KEEP_BOTH_WITH_CONTEXT',
  'NEEDS_RESEARCH', 'HUMAN_DECIDE',
] as const;

export const specialistInput = z.object({
  conflictId: z.string(),
  plantName: z.string(),
  attributeName: z.string(),
  valueA: z.string(),
  valueB: z.string(),
  sourceA: z.string(),
  sourceB: z.string(),
  sourceDatasetA: z.string(),
  sourceDatasetB: z.string(),
  sourceMethodologyA: z.string().nullable(),
  sourceMethodologyB: z.string().nullable(),
  sourceRegionA: z.string().nullable(),
  sourceRegionB: z.string().nullable(),
  classifierExplanation: z.string(),
  conflictType: z.string(),
});

export type SpecialistInput = z.infer<typeof specialistInput>;

const specialistOutput = z.object({
  verdict: z.enum(VERDICTS),
  recommendation: z.enum(RECOMMENDATIONS),
  analysis: z.string(),
  confidence: z.number(),
});

export type SpecialistOutput = z.infer<typeof specialistOutput>;

// --- Helpers ---

/** Resolve a dataset folder name to its full relative path under database-sources/. */
async function resolveDatasetFolder(sourceDataset: string): Promise<string | null> {
  for (const cat of CATEGORIES) {
    const relPath = `database-sources/${cat}/${sourceDataset}`;
    const absPath = resolve(REPO_ROOT, relPath, 'DATA-DICTIONARY.md');
    try {
      await access(absPath);
      return relPath;
    } catch {
      // continue
    }
  }
  return null;
}

/** Extract JSON from LLM text that may include markdown fencing or preamble. */
function extractJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // continue
    }
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  throw new Error(`Could not extract JSON from LLM response:\n${text.slice(0, 500)}`);
}

// --- Prompt ---

function buildRatingPrompt(
  input: SpecialistInput,
  contextA: { dataDictionary: string; readme: string } | null,
  contextB: { dataDictionary: string; readme: string } | null,
  kbResults: Array<{ sectionTitle: string; sectionSummary: string }>,
): string {
  const kbSection = kbResults.length > 0
    ? kbResults.map((r) => `### ${r.sectionTitle}\n${r.sectionSummary}`).join('\n\n')
    : 'No relevant knowledge base entries found.';

  const scaleNote = input.conflictType === 'SCALE_MISMATCH'
    ? '\n\nThis conflict was classified as a SCALE_MISMATCH. Pay special attention to whether the two sources use incompatible rating scales. If so, attempt to map both values to a common scale and assess whether the conflict is real or an artifact of scale differences.'
    : '';

  return `You are a plant attribute specialist analyzing a rating conflict between two data sources for the Pacific West (Oregon, California, Washington) plant selection tool.

## Conflict Details
- Plant: ${input.plantName}
- Attribute: ${input.attributeName}
- Source A (${input.sourceA}): "${input.valueA}"
- Source B (${input.sourceB}): "${input.valueB}"
- Classifier noted: ${input.classifierExplanation}${scaleNote}

## Source A Context (${input.sourceA} — ${input.sourceDatasetA})
Methodology: ${input.sourceMethodologyA ?? 'Unknown'}
Region: ${input.sourceRegionA ?? 'Unknown'}

${contextA?.dataDictionary ? `### Data Dictionary\n${contextA.dataDictionary.slice(0, 3000)}` : 'No data dictionary available.'}

${contextA?.readme ? `### README\n${contextA.readme.slice(0, 2000)}` : ''}

## Source B Context (${input.sourceB} — ${input.sourceDatasetB})
Methodology: ${input.sourceMethodologyB ?? 'Unknown'}
Region: ${input.sourceRegionB ?? 'Unknown'}

${contextB?.dataDictionary ? `### Data Dictionary\n${contextB.dataDictionary.slice(0, 3000)}` : 'No data dictionary available.'}

${contextB?.readme ? `### README\n${contextB.readme.slice(0, 2000)}` : ''}

## Knowledge Base Research
${kbSection}

## Your Task
Analyze this rating conflict and determine:

1. **Verdict**: Is this conflict REAL, APPARENT, or NUANCED?
   - REAL: Sources genuinely disagree about this plant's rating for this attribute
   - APPARENT: The conflict is due to different rating scales, definitions, or methodologies that can be reconciled
   - NUANCED: Partially real — there is genuine disagreement but context explains part of the difference

2. **Recommendation**: What action should be taken?
   - PREFER_A: Source A's value is more reliable or current
   - PREFER_B: Source B's value is more reliable or current
   - KEEP_BOTH: Both values are valid in different contexts
   - KEEP_BOTH_WITH_CONTEXT: Keep both but add qualifying context
   - NEEDS_RESEARCH: Insufficient information to decide
   - HUMAN_DECIDE: Too complex for automated resolution

3. **Analysis**: 2-4 sentences explaining your reasoning, referencing specific methodology or scale differences.

4. **Confidence**: 0.0-1.0 reflecting certainty.

Respond with ONLY valid JSON (no markdown fencing):
{
  "verdict": "REAL",
  "recommendation": "PREFER_A",
  "analysis": "...",
  "confidence": 0.85
}`;
}

// --- Flow ---

export const ratingConflictFlow = ai.defineFlow(
  {
    name: 'ratingConflictFlow',
    inputSchema: specialistInput,
    outputSchema: specialistOutput,
  },
  async (input) => {
    console.log(`[ratingConflictFlow] Analyzing conflict ${input.conflictId}: ${input.plantName} / ${input.attributeName}`);

    // Step 1: Resolve dataset folders and load context
    const [folderA, folderB] = await Promise.all([
      resolveDatasetFolder(input.sourceDatasetA),
      resolveDatasetFolder(input.sourceDatasetB),
    ]);

    const [contextA, contextB] = await Promise.all([
      folderA ? getDatasetContext({ datasetFolder: folderA }) : null,
      folderB ? getDatasetContext({ datasetFolder: folderB }) : null,
    ]);

    // Step 2: Search knowledge base
    const { results: kbResults } = await searchDocumentIndex({
      query: `${input.plantName} ${input.attributeName}`,
      maxResults: 5,
    });

    // Step 3: LLM analysis
    const prompt = buildRatingPrompt(input, contextA, contextB, kbResults);
    const { text } = await ai.generate({ model: MODELS.quality, prompt });

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJSON(text) as Record<string, unknown>;
    } catch {
      // Retry once
      const { text: retryText } = await ai.generate({
        model: MODELS.quality,
        prompt:
          'Your previous response was not valid JSON. Please respond with ONLY a JSON object ' +
          '(no markdown fencing) matching this schema: { verdict, recommendation, analysis, confidence }. ' +
          'Here is what you tried:\n\n' + text.slice(0, 2000),
      });
      parsed = extractJSON(retryText) as Record<string, unknown>;
    }

    // Validate and normalize
    const verdict = VERDICTS.includes(parsed.verdict as typeof VERDICTS[number])
      ? (parsed.verdict as typeof VERDICTS[number])
      : 'NUANCED';

    const recommendation = RECOMMENDATIONS.includes(parsed.recommendation as typeof RECOMMENDATIONS[number])
      ? (parsed.recommendation as typeof RECOMMENDATIONS[number])
      : 'HUMAN_DECIDE';

    const analysis = typeof parsed.analysis === 'string'
      ? parsed.analysis
      : 'Specialist analysis could not be parsed.';

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

    const result: SpecialistOutput = { verdict, recommendation, analysis, confidence };

    // Step 4: Write results to DB
    try {
      await doltPool.query(
        `UPDATE conflicts
         SET specialist_verdict = $1, specialist_analysis = $2,
             specialist_recommendation = $3, status = 'annotated', annotated_at = NOW()
         WHERE id = $4`,
        [result.verdict, result.analysis, result.recommendation, input.conflictId],
      );
      console.log(`[ratingConflictFlow] Wrote verdict ${result.verdict} for conflict ${input.conflictId}`);
    } catch (err) {
      console.error(`[ratingConflictFlow] Failed to write verdict for ${input.conflictId}:`, err);
    }

    return result;
  },
);
