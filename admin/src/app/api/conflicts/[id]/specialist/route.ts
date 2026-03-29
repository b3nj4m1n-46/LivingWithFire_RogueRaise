import {
  fetchConflictDetail,
  fetchConflictWarrants,
  updateSpecialistVerdict,
} from "@/lib/queries/conflicts";
import {
  getDatasetContexts,
  searchKnowledgeBase,
  extractJSON,
  type DatasetContext,
  type KBResult,
} from "@/lib/research";
import type { ConflictDetail } from "@/lib/queries/conflicts";

// ── Types ───��────────────────────────���─────────────────────────────────

interface WarrantForContext {
  source_id_code: string | null;
  source_dataset: string | null;
  source_methodology: string | null;
  source_region: string | null;
}

interface SpecialistResult {
  verdict: string;
  recommendation: string;
  analysis: string;
  confidence: number;
  regionAnalysis?: {
    regionA: string | null;
    regionB: string | null;
    overlapAssessment: string;
    applicability: string;
  } | null;
}

// ── Constants ─────────────────���────────────────────────────────────────

const VALID_VERDICTS = ["REAL", "APPARENT", "NUANCED"];
const VALID_RECOMMENDATIONS = [
  "PREFER_A", "PREFER_B", "KEEP_BOTH", "KEEP_BOTH_WITH_CONTEXT",
  "NEEDS_RESEARCH", "HUMAN_DECIDE",
];

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const SPECIALIST_MODEL = "claude-sonnet-4-6-20250514";

// ── Prompt builders ────────────────────────────────────────────────────

function buildRatingPrompt(
  conflict: ConflictDetail,
  warrants: WarrantForContext[],
  contexts: DatasetContext[],
  kbResults: KBResult[]
): string {
  const warrantA = warrants[0];
  const warrantB = warrants[1];
  const ctxA = contexts.find((c) => c.sourceDataset === warrantA?.source_dataset);
  const ctxB = contexts.find((c) => c.sourceDataset === warrantB?.source_dataset);

  const kbSection = kbResults.length > 0
    ? kbResults.map((r) => `### ${r.sectionTitle}\n${r.sectionSummary}`).join("\n\n")
    : "No relevant knowledge base entries found.";

  const scaleNote = conflict.conflict_type === "SCALE_MISMATCH"
    ? "\n\nThis conflict was classified as a SCALE_MISMATCH. Pay special attention to whether the two sources use incompatible rating scales. If so, attempt to map both values to a common scale."
    : "";

  return `You are a plant attribute specialist analyzing a rating conflict between two data sources for the Pacific West (Oregon, California, Washington) plant selection tool.

## Conflict Details
- Plant: ${conflict.plant_name}
- Attribute: ${conflict.attribute_name}
- Source A (${conflict.source_a}): "${conflict.value_a}"
- Source B (${conflict.source_b}): "${conflict.value_b}"
- Classifier noted: ${conflict.classifier_explanation ?? "No explanation provided"}${scaleNote}

## Source A Context (${conflict.source_a})
Methodology: ${warrantA?.source_methodology ?? "Unknown"}
Region: ${warrantA?.source_region ?? "Unknown"}

${ctxA?.dataDictionary ? `### Data Dictionary\n${ctxA.dataDictionary.slice(0, 3000)}` : "No data dictionary available."}

${ctxA?.readme ? `### README\n${ctxA.readme.slice(0, 2000)}` : ""}

## Source B Context (${conflict.source_b})
Methodology: ${warrantB?.source_methodology ?? "Unknown"}
Region: ${warrantB?.source_region ?? "Unknown"}

${ctxB?.dataDictionary ? `### Data Dictionary\n${ctxB.dataDictionary.slice(0, 3000)}` : "No data dictionary available."}

${ctxB?.readme ? `### README\n${ctxB.readme.slice(0, 2000)}` : ""}

## Knowledge Base Research
${kbSection}

## Your Task
Analyze this rating conflict and determine:

1. **Verdict**: REAL, APPARENT, or NUANCED?
   - REAL: Sources genuinely disagree about this plant's rating
   - APPARENT: Conflict is due to different scales/definitions that can be reconciled
   - NUANCED: Partially real — genuine disagreement but context explains part of the difference

2. **Recommendation**: PREFER_A, PREFER_B, KEEP_BOTH, KEEP_BOTH_WITH_CONTEXT, NEEDS_RESEARCH, or HUMAN_DECIDE

3. **Analysis**: 2-4 sentences explaining your reasoning.

4. **Confidence**: 0.0-1.0

Respond with ONLY valid JSON (no markdown fencing):
{
  "verdict": "REAL",
  "recommendation": "PREFER_A",
  "analysis": "...",
  "confidence": 0.85
}`;
}

function buildScopePrompt(
  conflict: ConflictDetail,
  warrants: WarrantForContext[],
  contexts: DatasetContext[],
  kbResults: KBResult[]
): string {
  const warrantA = warrants[0];
  const warrantB = warrants[1];
  const ctxA = contexts.find((c) => c.sourceDataset === warrantA?.source_dataset);
  const ctxB = contexts.find((c) => c.sourceDataset === warrantB?.source_dataset);

  const kbSection = kbResults.length > 0
    ? kbResults.map((r) => `### ${r.sectionTitle}\n${r.sectionSummary}`).join("\n\n")
    : "No relevant knowledge base entries found.";

  return `You are a plant attribute specialist analyzing a geographic scope conflict between two data sources. The target region is the Pacific West (Oregon, California, Washington).

## Conflict Details
- Plant: ${conflict.plant_name}
- Attribute: ${conflict.attribute_name}
- Source A (${conflict.source_a}): "${conflict.value_a}"
- Source B (${conflict.source_b}): "${conflict.value_b}"
- Classifier noted: ${conflict.classifier_explanation ?? "No explanation provided"}

## Source A Context (${conflict.source_a})
Methodology: ${warrantA?.source_methodology ?? "Unknown"}
Region: ${warrantA?.source_region ?? "Not specified"}

${ctxA?.dataDictionary ? `### Data Dictionary\n${ctxA.dataDictionary.slice(0, 3000)}` : "No data dictionary available."}

${ctxA?.readme ? `### README\n${ctxA.readme.slice(0, 2000)}` : ""}

## Source B Context (${conflict.source_b})
Methodology: ${warrantB?.source_methodology ?? "Unknown"}
Region: ${warrantB?.source_region ?? "Not specified"}

${ctxB?.dataDictionary ? `### Data Dictionary\n${ctxB.dataDictionary.slice(0, 3000)}` : "No data dictionary available."}

${ctxB?.readme ? `### README\n${ctxB.readme.slice(0, 2000)}` : ""}

## Knowledge Base Research
${kbSection}

## Your Task
This conflict was classified as a SCOPE_DIFFERENCE — values may apply to different geographic/climatic contexts.

Analyze and determine:

1. **Verdict**: REAL, APPARENT, or NUANCED?
2. **Recommendation**: PREFER_A, PREFER_B, KEEP_BOTH, KEEP_BOTH_WITH_CONTEXT, NEEDS_RESEARCH, or HUMAN_DECIDE
3. **Analysis**: 2-4 sentences addressing regional applicability.
4. **Confidence**: 0.0-1.0
5. **Region Analysis**: Geographic overlap and applicability assessment.

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
    "applicability": "Source A covers the Pacific West directly; Source B is not applicable."
  }
}`;
}

// ── Anthropic API call ─────��───────────────────────────────────────────

async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: SPECIALIST_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

// ── Route Handler ──────────────────────────────────────────────────────

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch conflict
    const conflict = await fetchConflictDetail(id);
    if (!conflict) {
      return Response.json({ error: "Conflict not found" }, { status: 404 });
    }

    if (!conflict.specialist_agent) {
      return Response.json(
        { error: "No specialist agent assigned to this conflict" },
        { status: 400 }
      );
    }

    // Only rating and scope specialists are implemented
    if (
      conflict.specialist_agent !== "ratingConflictFlow" &&
      conflict.specialist_agent !== "scopeConflictFlow"
    ) {
      return Response.json(
        { error: `Specialist "${conflict.specialist_agent}" is not yet implemented` },
        { status: 400 }
      );
    }

    // 2. Fetch warrants
    const warrants = await fetchConflictWarrants(
      conflict.warrant_a_id,
      conflict.warrant_b_id
    );

    // 3. Load dataset contexts and search knowledge base
    const [datasetContexts, kbResults] = await Promise.all([
      getDatasetContexts(warrants),
      searchKnowledgeBase(conflict.plant_name, conflict.attribute_name),
    ]);

    // 4. Build prompt based on specialist type
    const prompt =
      conflict.specialist_agent === "scopeConflictFlow"
        ? buildScopePrompt(conflict, warrants, datasetContexts, kbResults)
        : buildRatingPrompt(conflict, warrants, datasetContexts, kbResults);

    // 5. Call Anthropic API
    const responseText = await callAnthropic(prompt);

    // 6. Parse response
    let parsed: Record<string, unknown>;
    try {
      parsed = extractJSON(responseText);
    } catch {
      // Retry once with correction prompt
      const retryText = await callAnthropic(
        "Your previous response was not valid JSON. Please respond with ONLY a JSON object " +
        "(no markdown fencing) matching this schema: { verdict, recommendation, analysis, confidence }. " +
        "Here is what you tried:\n\n" + responseText.slice(0, 2000)
      );
      parsed = extractJSON(retryText);
    }

    // 7. Validate
    const verdict = VALID_VERDICTS.includes(parsed.verdict as string)
      ? (parsed.verdict as string)
      : "NUANCED";

    const recommendation = VALID_RECOMMENDATIONS.includes(parsed.recommendation as string)
      ? (parsed.recommendation as string)
      : "HUMAN_DECIDE";

    const analysis = typeof parsed.analysis === "string"
      ? parsed.analysis
      : "Specialist analysis could not be parsed.";

    const confidence = typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

    // For scope conflicts, append region analysis to the stored analysis
    let fullAnalysis = analysis;
    const regionAnalysis = parsed.regionAnalysis as Record<string, unknown> | null;
    if (regionAnalysis && typeof regionAnalysis === "object") {
      fullAnalysis += `\n\n---\nRegion Analysis: ${JSON.stringify(regionAnalysis)}`;
    }

    // 8. Write results to DB
    await updateSpecialistVerdict(id, verdict, fullAnalysis, recommendation);

    // 9. Return result
    const result: SpecialistResult = {
      verdict,
      recommendation,
      analysis,
      confidence,
    };

    if (regionAnalysis && typeof regionAnalysis === "object") {
      result.regionAnalysis = {
        regionA: typeof regionAnalysis.regionA === "string" ? regionAnalysis.regionA : null,
        regionB: typeof regionAnalysis.regionB === "string" ? regionAnalysis.regionB : null,
        overlapAssessment: typeof regionAnalysis.overlapAssessment === "string"
          ? regionAnalysis.overlapAssessment : "unknown",
        applicability: typeof regionAnalysis.applicability === "string"
          ? regionAnalysis.applicability : "",
      };
    }

    return Response.json(result);
  } catch (error) {
    console.error("POST /api/conflicts/[id]/specialist error:", error);
    return Response.json(
      { error: "Failed to run specialist analysis" },
      { status: 500 }
    );
  }
}
