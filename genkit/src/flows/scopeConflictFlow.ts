import { z } from 'zod';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ai, MODELS } from '../config.js';
import { getDatasetContext } from '../tools/datasetContext.js';
import { searchDocumentIndex } from '../tools/searchDocumentIndex.js';
import { doltPool } from '../tools/dolt.js';
import { extractJSON } from '../utils/extractJSON.js';
import { specialistInput, type SpecialistInput } from './ratingConflictFlow.js';

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
const OVERLAP_ASSESSMENTS = ['disjoint', 'partial_overlap', 'same_region', 'unknown'] as const;

const scopeOutput = z.object({
  verdict: z.enum(VERDICTS),
  recommendation: z.enum(RECOMMENDATIONS),
  analysis: z.string(),
  confidence: z.number(),
  regionAnalysis: z.object({
    regionA: z.string().nullable(),
    regionB: z.string().nullable(),
    overlapAssessment: z.enum(OVERLAP_ASSESSMENTS),
    applicability: z.string(),
  }).nullable(),
});

export type ScopeOutput = z.infer<typeof scopeOutput>;

// --- Helpers ---

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


// --- Prompt ---

function buildScopePrompt(
  input: SpecialistInput,
  contextA: { dataDictionary: string; readme: string } | null,
  contextB: { dataDictionary: string; readme: string } | null,
  kbResults: Array<{ sectionTitle: string; sectionSummary: string }>,
): string {
  const kbSection = kbResults.length > 0
    ? kbResults.map((r) => `### ${r.sectionTitle}\n${r.sectionSummary}`).join('\n\n')
    : 'No relevant knowledge base entries found.';

  return `You are a plant attribute specialist analyzing a geographic scope conflict between two data sources. The target region for this plant selection tool is the Pacific West (Oregon, California, Washington).

## Conflict Details
- Plant: ${input.plantName}
- Attribute: ${input.attributeName}
- Source A (${input.sourceA}): "${input.valueA}"
- Source B (${input.sourceB}): "${input.valueB}"
- Classifier noted: ${input.classifierExplanation}

## Source A Context (${input.sourceA} — ${input.sourceDatasetA})
Methodology: ${input.sourceMethodologyA ?? 'Unknown'}
Region: ${input.sourceRegionA ?? 'Not specified'}

${contextA?.dataDictionary ? `### Data Dictionary\n${contextA.dataDictionary.slice(0, 3000)}` : 'No data dictionary available.'}

${contextA?.readme ? `### README\n${contextA.readme.slice(0, 2000)}` : ''}

## Source B Context (${input.sourceB} — ${input.sourceDatasetB})
Methodology: ${input.sourceMethodologyB ?? 'Unknown'}
Region: ${input.sourceRegionB ?? 'Not specified'}

${contextB?.dataDictionary ? `### Data Dictionary\n${contextB.dataDictionary.slice(0, 3000)}` : 'No data dictionary available.'}

${contextB?.readme ? `### README\n${contextB.readme.slice(0, 2000)}` : ''}

## Knowledge Base Research
${kbSection}

## Your Task
This conflict was classified as a SCOPE_DIFFERENCE — the values may apply to different geographic or climatic contexts.

Analyze this scope conflict and determine:

1. **Verdict**: Is this conflict REAL, APPARENT, or NUANCED?
   - REAL: Sources genuinely disagree even within the same geographic context
   - APPARENT: The difference is entirely explained by geographic/climatic scope — both values are correct for their respective regions
   - NUANCED: Some genuine disagreement exists, but regional context explains part of the difference

2. **Recommendation**: What action should be taken?
   - PREFER_A: Source A's value is more applicable to the Pacific West
   - PREFER_B: Source B's value is more applicable to the Pacific West
   - KEEP_BOTH: Both values are valid and applicable
   - KEEP_BOTH_WITH_CONTEXT: Keep both but annotate with regional applicability
   - NEEDS_RESEARCH: Insufficient regional information to decide
   - HUMAN_DECIDE: Too complex for automated resolution

3. **Analysis**: 2-4 sentences explaining your reasoning, specifically addressing regional applicability.

4. **Confidence**: 0.0-1.0 reflecting certainty.

5. **Region Analysis**:
   - Do these source regions overlap geographically?
   - Is regional variation expected for this attribute in this plant species?
   - Which value(s) apply to the Pacific West target region?

Respond with ONLY valid JSON (no markdown fencing):
{
  "verdict": "APPARENT",
  "recommendation": "PREFER_A",
  "analysis": "...",
  "confidence": 0.8,
  "regionAnalysis": {
    "regionA": "Southern California",
    "regionB": "New Jersey",
    "overlapAssessment": "disjoint",
    "applicability": "Source A covers the Pacific West directly; Source B's data from the Northeast is not applicable to this region."
  }
}`;
}

// --- Flow ---

export const scopeConflictFlow = ai.defineFlow(
  {
    name: 'scopeConflictFlow',
    inputSchema: specialistInput,
    outputSchema: scopeOutput,
  },
  async (input) => {
    console.log(`[scopeConflictFlow] Analyzing conflict ${input.conflictId}: ${input.plantName} / ${input.attributeName}`);

    // Step 1: Resolve dataset folders and load context
    const [folderA, folderB] = await Promise.all([
      resolveDatasetFolder(input.sourceDatasetA),
      resolveDatasetFolder(input.sourceDatasetB),
    ]);

    const [contextA, contextB] = await Promise.all([
      folderA ? getDatasetContext({ datasetFolder: folderA }) : null,
      folderB ? getDatasetContext({ datasetFolder: folderB }) : null,
    ]);

    // Step 2: Search knowledge base (include region terms)
    const regionTerms = [
      input.sourceRegionA,
      input.sourceRegionB,
      'geographic range',
    ].filter(Boolean).join(' ');

    const { results: kbResults } = await searchDocumentIndex({
      query: `${input.plantName} ${input.attributeName} ${regionTerms}`,
      maxResults: 5,
    });

    // Step 3: LLM analysis
    const prompt = buildScopePrompt(input, contextA, contextB, kbResults);
    const { text } = await ai.generate({ model: MODELS.quality, prompt });

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJSON(text) as Record<string, unknown>;
    } catch {
      const { text: retryText } = await ai.generate({
        model: MODELS.quality,
        prompt:
          'Your previous response was not valid JSON. Please respond with ONLY a JSON object ' +
          '(no markdown fencing) matching this schema: { verdict, recommendation, analysis, confidence, regionAnalysis }. ' +
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

    // Parse region analysis
    let regionAnalysis: ScopeOutput['regionAnalysis'] = null;
    const ra = parsed.regionAnalysis as Record<string, unknown> | null;
    if (ra && typeof ra === 'object') {
      const overlap = OVERLAP_ASSESSMENTS.includes(ra.overlapAssessment as typeof OVERLAP_ASSESSMENTS[number])
        ? (ra.overlapAssessment as typeof OVERLAP_ASSESSMENTS[number])
        : 'unknown';

      regionAnalysis = {
        regionA: typeof ra.regionA === 'string' ? ra.regionA : input.sourceRegionA,
        regionB: typeof ra.regionB === 'string' ? ra.regionB : input.sourceRegionB,
        overlapAssessment: overlap,
        applicability: typeof ra.applicability === 'string' ? ra.applicability : '',
      };
    }

    const result: ScopeOutput = { verdict, recommendation, analysis, confidence, regionAnalysis };

    // Step 4: Write results to DB (store regionAnalysis in specialist_analysis as JSON)
    const fullAnalysis = regionAnalysis
      ? `${analysis}\n\n---\nRegion Analysis: ${JSON.stringify(regionAnalysis)}`
      : analysis;

    try {
      await doltPool.query(
        `UPDATE conflicts
         SET specialist_verdict = $1, specialist_analysis = $2,
             specialist_recommendation = $3, status = 'annotated', annotated_at = NOW()
         WHERE id = $4`,
        [result.verdict, fullAnalysis, result.recommendation, input.conflictId],
      );
      console.log(`[scopeConflictFlow] Wrote verdict ${result.verdict} for conflict ${input.conflictId}`);
    } catch (err) {
      console.error(`[scopeConflictFlow] Failed to write verdict for ${input.conflictId}:`, err);
    }

    return result;
  },
);
