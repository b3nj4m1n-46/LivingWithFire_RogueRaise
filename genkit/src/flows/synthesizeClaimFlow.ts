import { z } from 'zod';
import { ai, MODELS } from '../config.js';
import { doltPool } from '../tools/dolt.js';
import { searchDocumentIndex } from '../tools/searchDocumentIndex.js';
import { extractJSON } from '../utils/extractJSON.js';

// --- Schemas ---

const warrantInput = z.object({
  id: z.string(),
  value: z.string(),
  sourceValue: z.string().nullable(),
  valueContext: z.string().nullable(),
  sourceDataset: z.string().nullable(),
  sourceIdCode: z.string().nullable(),
  sourceMethodology: z.string().nullable(),
  sourceRegion: z.string().nullable(),
  sourceYear: z.string().nullable(),
  sourceReliability: z.string().nullable(),
  warrantType: z.string(),
  matchConfidence: z.number().nullable(),
});

const conflictInput = z.object({
  id: z.string(),
  conflictType: z.string(),
  severity: z.string(),
  status: z.string(),
  specialistVerdict: z.string().nullable(),
  specialistAnalysis: z.string().nullable(),
  specialistRecommendation: z.string().nullable(),
  valueA: z.string().nullable(),
  valueB: z.string().nullable(),
  sourceA: z.string().nullable(),
  sourceB: z.string().nullable(),
});

const synthesisInput = z.object({
  plantId: z.string(),
  plantName: z.string(),
  attributeId: z.string(),
  attributeName: z.string(),
  warrants: z.array(warrantInput),
  conflicts: z.array(conflictInput).default([]),
  productionValue: z.string().nullable().default(null),
});

export type SynthesisInput = z.infer<typeof synthesisInput>;

const warrantWeight = z.object({
  warrantId: z.string(),
  weight: z.enum(['primary', 'supporting', 'contextual']),
});

const CONFIDENCES = ['HIGH', 'MODERATE', 'LOW'] as const;

const synthesisOutput = z.object({
  synthesized_text: z.string(),
  categorical_value: z.string().nullable(),
  confidence: z.enum(CONFIDENCES),
  confidence_reasoning: z.string(),
  sources_cited: z.array(z.string()),
  warrant_weights: z.array(warrantWeight),
});

export type SynthesisOutput = z.infer<typeof synthesisOutput>;

// --- Helpers ---

interface AttributeMeta {
  valueType: string;
  valuesAllowed: string | null;
}

async function loadAttributeMeta(attributeId: string): Promise<AttributeMeta> {
  const result = await doltPool.query(
    `SELECT value_type AS "valueType", values_allowed AS "valuesAllowed"
     FROM attributes WHERE id = $1`,
    [attributeId],
  );
  if (result.rows.length === 0) {
    return { valueType: 'text', valuesAllowed: null };
  }
  const row = result.rows[0] as Record<string, unknown>;
  return {
    valueType: (row.valueType as string) ?? 'text',
    valuesAllowed: (row.valuesAllowed as string) ?? null,
  };
}

function parseAllowedValues(valuesAllowed: string | null): string[] | null {
  if (!valuesAllowed) return null;
  return valuesAllowed.split(',').map((v) => v.trim()).filter(Boolean);
}

function validateCategoricalValue(
  value: string | null | undefined,
  allowed: string[] | null,
): string | null {
  if (value == null) return null;
  if (!allowed) return value;
  if (allowed.some((a) => a.toLowerCase() === value.toLowerCase())) return value;
  return null;
}

// --- Prompt ---

function buildSynthesisPrompt(
  input: SynthesisInput,
  attrMeta: AttributeMeta,
  kbResults: Array<{ sectionTitle: string; sectionSummary: string }>,
): string {
  const warrantsSection = input.warrants
    .map(
      (w, i) => `### Warrant ${i + 1}: ${w.sourceIdCode ?? w.sourceDataset ?? 'Unknown'}
- Value: "${w.value}"${w.sourceValue && w.sourceValue !== w.value ? ` (original: "${w.sourceValue}")` : ''}
- Context: ${w.valueContext ?? 'none'}
- Type: ${w.warrantType}
- Methodology: ${w.sourceMethodology ?? 'Unknown'}
- Region: ${w.sourceRegion ?? 'Unknown'}
- Year: ${w.sourceYear ?? 'Unknown'}
- Reliability: ${w.sourceReliability ?? 'Unknown'}
- Match confidence: ${w.matchConfidence ?? 'N/A'}
- Warrant ID: ${w.id}`,
    )
    .join('\n\n');

  const conflictsSection =
    input.conflicts.length > 0
      ? input.conflicts
          .map(
            (c) => `- ${c.sourceA ?? '?'} ("${c.valueA}") vs ${c.sourceB ?? '?'} ("${c.valueB}")
  Type: ${c.conflictType}, Severity: ${c.severity}, Status: ${c.status}
  Verdict: ${c.specialistVerdict ?? 'pending'}
  Analysis: ${c.specialistAnalysis ?? 'none'}
  Recommendation: ${c.specialistRecommendation ?? 'none'}`,
          )
          .join('\n')
      : 'No conflicts detected between selected warrants.';

  const kbSection =
    kbResults.length > 0
      ? kbResults.map((r) => `### ${r.sectionTitle}\n${r.sectionSummary}`).join('\n\n')
      : 'No relevant knowledge base entries found.';

  const allowedValuesInstruction = attrMeta.valuesAllowed
    ? `The categorical_value MUST be one of these allowed values: ${attrMeta.valuesAllowed}. If none fit well, set categorical_value to null.`
    : 'Provide an appropriate free-text value for categorical_value.';

  return `You are a plant data synthesis specialist for a Pacific West (Oregon, California, Washington) plant selection tool. Your job is to synthesize multiple evidence sources (warrants) into a single production-ready claim.

## Plant
${input.plantName}

## Attribute: ${input.attributeName}
- Value type: ${attrMeta.valueType}
- Allowed values: ${attrMeta.valuesAllowed ?? 'free text'}
- Current production value: ${input.productionValue ?? 'none'}

## Warrants (Evidence Sources)
${warrantsSection}

## Conflicts & Specialist Verdicts
${conflictsSection}

## Knowledge Base Research
${kbSection}

## Instructions
Synthesize these warrants into a single production claim for "${input.attributeName}". Consider:
1. Source reliability and methodology rigor
2. Regional relevance to Pacific West (Oregon, California, Washington)
3. Recency of data (prefer more recent sources when relevant)
4. Conflict resolutions and specialist verdicts
5. Cross-source consensus (agreement across multiple independent sources)

${allowedValuesInstruction}

For warrant_weights, assign each warrant a weight of "primary" (key driver of the decision), "supporting" (corroborates but not primary), or "contextual" (provides background only).

Respond with ONLY valid JSON (no markdown fencing):
{
  "synthesized_text": "2-3 sentence synthesis explaining the chosen value with evidence citations",
  "categorical_value": "the chosen value or null if uncertain",
  "confidence": "HIGH or MODERATE or LOW",
  "confidence_reasoning": "1-2 sentences explaining confidence level",
  "sources_cited": ["SOURCE-ID-1", "SOURCE-ID-2"],
  "warrant_weights": [
    {"warrantId": "uuid-here", "weight": "primary"}
  ]
}`;
}

// --- Flow ---

export const synthesizeClaimFlow = ai.defineFlow(
  {
    name: 'synthesizeClaimFlow',
    inputSchema: synthesisInput,
    outputSchema: synthesisOutput,
  },
  async (input) => {
    console.log(
      `[synthesizeClaimFlow] Synthesizing ${input.plantName} / ${input.attributeName} with ${input.warrants.length} warrant(s)`,
    );

    // Step 1: Load attribute metadata
    const attrMeta = await loadAttributeMeta(input.attributeId);
    const allowedValues = parseAllowedValues(attrMeta.valuesAllowed);

    // Step 2: Search knowledge base for context
    let kbResults: Array<{ sectionTitle: string; sectionSummary: string }> = [];
    try {
      const kb = await searchDocumentIndex({
        query: `${input.plantName} ${input.attributeName}`,
        maxResults: 5,
      });
      kbResults = kb.results;
    } catch {
      console.log('[synthesizeClaimFlow] Knowledge base search unavailable, continuing without');
    }

    // Step 3: Build prompt and call LLM
    const prompt = buildSynthesisPrompt(input, attrMeta, kbResults);
    const { text } = await ai.generate({ model: MODELS.quality, prompt });

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJSON(text) as Record<string, unknown>;
    } catch {
      // Retry once with corrective prompt
      const { text: retryText } = await ai.generate({
        model: MODELS.quality,
        prompt:
          'Your previous response was not valid JSON. Please respond with ONLY a JSON object ' +
          '(no markdown fencing) matching this schema: { synthesized_text, categorical_value, ' +
          'confidence, confidence_reasoning, sources_cited, warrant_weights }. ' +
          'Here is what you tried:\n\n' +
          text.slice(0, 2000),
      });
      parsed = extractJSON(retryText) as Record<string, unknown>;
    }

    // Step 4: Validate and normalize
    const categoricalValue = validateCategoricalValue(
      parsed.categorical_value as string | null,
      allowedValues,
    );

    const confidence = CONFIDENCES.includes(parsed.confidence as typeof CONFIDENCES[number])
      ? (parsed.confidence as typeof CONFIDENCES[number])
      : 'MODERATE';

    const synthesizedText =
      typeof parsed.synthesized_text === 'string'
        ? parsed.synthesized_text
        : 'Synthesis could not be parsed.';

    const confidenceReasoning =
      typeof parsed.confidence_reasoning === 'string'
        ? parsed.confidence_reasoning
        : 'Confidence reasoning could not be parsed.';

    const sourcesCited = Array.isArray(parsed.sources_cited)
      ? (parsed.sources_cited as string[]).filter((s) => typeof s === 'string')
      : [];

    const warrantWeights = Array.isArray(parsed.warrant_weights)
      ? (parsed.warrant_weights as Array<Record<string, unknown>>)
          .filter((w) => typeof w.warrantId === 'string' && typeof w.weight === 'string')
          .map((w) => ({
            warrantId: w.warrantId as string,
            weight: (['primary', 'supporting', 'contextual'].includes(w.weight as string)
              ? w.weight
              : 'contextual') as 'primary' | 'supporting' | 'contextual',
          }))
      : [];

    const result: SynthesisOutput = {
      synthesized_text: synthesizedText,
      categorical_value: categoricalValue,
      confidence,
      confidence_reasoning: confidenceReasoning,
      sources_cited: sourcesCited,
      warrant_weights: warrantWeights,
    };

    console.log(
      `[synthesizeClaimFlow] Result: value="${categoricalValue}", confidence=${confidence}, ` +
        `${sourcesCited.length} source(s) cited, ${warrantWeights.length} weight(s)`,
    );

    return result;
  },
);
