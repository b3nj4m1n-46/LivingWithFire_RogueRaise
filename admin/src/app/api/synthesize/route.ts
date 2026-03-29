import Anthropic from "@anthropic-ai/sdk";
import { query, queryOne } from "@/lib/dolt";

interface WarrantRow {
  id: string;
  value: string;
  sourceValue: string | null;
  valueContext: string | null;
  sourceDataset: string | null;
  sourceIdCode: string | null;
  sourceMethodology: string | null;
  sourceRegion: string | null;
  sourceYear: string | null;
  sourceReliability: string | null;
  warrantType: string;
  matchConfidence: number | null;
  plantGenus: string;
  plantSpecies: string | null;
  attributeName: string;
}

interface ConflictRow {
  id: string;
  conflictType: string;
  severity: string;
  status: string;
  specialistVerdict: string | null;
  specialistAnalysis: string | null;
  specialistRecommendation: string | null;
  valueA: string | null;
  valueB: string | null;
  sourceA: string | null;
  sourceB: string | null;
}

interface AttributeRow {
  name: string;
  valueType: string;
  valuesAllowed: string | null;
}

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

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  throw new Error("Could not extract JSON from LLM response");
}

function validateCategoricalValue(
  value: string | null | undefined,
  valuesAllowed: string | null
): string | null {
  if (value == null) return null;
  if (!valuesAllowed) return value;
  const allowed = valuesAllowed
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (allowed.some((a) => a.toLowerCase() === value.toLowerCase())) return value;
  return null;
}

function buildPrompt(
  plantName: string,
  attributeName: string,
  attrMeta: AttributeRow,
  warrants: WarrantRow[],
  conflicts: ConflictRow[],
  productionValue: string | null
): string {
  const warrantsSection = warrants
    .map(
      (w, i) =>
        `### Warrant ${i + 1}: ${w.sourceIdCode ?? w.sourceDataset ?? "Unknown"}
- Value: "${w.value}"${w.sourceValue && w.sourceValue !== w.value ? ` (original: "${w.sourceValue}")` : ""}
- Context: ${w.valueContext ?? "none"}
- Type: ${w.warrantType}
- Methodology: ${w.sourceMethodology ?? "Unknown"}
- Region: ${w.sourceRegion ?? "Unknown"}
- Year: ${w.sourceYear ?? "Unknown"}
- Reliability: ${w.sourceReliability ?? "Unknown"}
- Match confidence: ${w.matchConfidence ?? "N/A"}
- Warrant ID: ${w.id}`
    )
    .join("\n\n");

  const conflictsSection =
    conflicts.length > 0
      ? conflicts
          .map(
            (c) => `- ${c.sourceA ?? "?"} ("${c.valueA}") vs ${c.sourceB ?? "?"} ("${c.valueB}")
  Type: ${c.conflictType}, Severity: ${c.severity}, Status: ${c.status}
  Verdict: ${c.specialistVerdict ?? "pending"}
  Analysis: ${c.specialistAnalysis ?? "none"}
  Recommendation: ${c.specialistRecommendation ?? "none"}`
          )
          .join("\n")
      : "No conflicts detected between selected warrants.";

  const allowedValuesInstruction = attrMeta.valuesAllowed
    ? `The categorical_value MUST be one of these allowed values: ${attrMeta.valuesAllowed}. If none fit well, set categorical_value to null.`
    : "Provide an appropriate free-text value for categorical_value.";

  return `You are a plant data synthesis specialist for a Pacific West (Oregon, California, Washington) plant selection tool. Your job is to synthesize multiple evidence sources (warrants) into a single production-ready claim.

## Plant
${plantName}

## Attribute: ${attributeName}
- Value type: ${attrMeta.valueType}
- Allowed values: ${attrMeta.valuesAllowed ?? "free text"}
- Current production value: ${productionValue ?? "none"}

## Warrants (Evidence Sources)
${warrantsSection}

## Conflicts & Specialist Verdicts
${conflictsSection}

## Instructions
Synthesize these warrants into a single production claim for "${attributeName}". Consider:
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

export async function POST(request: Request) {
  try {
    const { plantId, attributeId, warrantIds } = await request.json();

    if (!plantId || !attributeId || !Array.isArray(warrantIds) || warrantIds.length === 0) {
      return Response.json(
        { error: "Missing required fields: plantId, attributeId, warrantIds" },
        { status: 400 }
      );
    }

    // Load warrants by IDs
    const placeholders = warrantIds.map((_: string, i: number) => `$${i + 1}`).join(", ");
    const warrants = await query<WarrantRow>(
      `SELECT id, "value",
              source_value AS "sourceValue", value_context AS "valueContext",
              source_dataset AS "sourceDataset", source_id_code AS "sourceIdCode",
              source_methodology AS "sourceMethodology", source_region AS "sourceRegion",
              source_year AS "sourceYear", source_reliability AS "sourceReliability",
              warrant_type AS "warrantType", match_confidence AS "matchConfidence",
              plant_genus AS "plantGenus", plant_species AS "plantSpecies",
              attribute_name AS "attributeName"
       FROM warrants
       WHERE id IN (${placeholders})
       ORDER BY source_dataset`,
      warrantIds
    );

    if (warrants.length === 0) {
      return Response.json(
        { error: "No warrants found for the given IDs" },
        { status: 404 }
      );
    }

    // Derive plant name from warrants
    const plantName = `${warrants[0].plantGenus} ${warrants[0].plantSpecies ?? ""}`.trim();
    const attributeName = warrants[0].attributeName;

    // Load attribute metadata, production value, and conflicts in parallel
    const [attrMeta, prodVal, conflicts] = await Promise.all([
      queryOne<AttributeRow>(
        `SELECT name, value_type AS "valueType", values_allowed AS "valuesAllowed"
         FROM attributes WHERE id = $1`,
        [attributeId]
      ),
      queryOne<{ value: string }>(
        `SELECT "value" FROM "values" WHERE plant_id = $1 AND attribute_id = $2 LIMIT 1`,
        [plantId, attributeId]
      ),
      query<ConflictRow>(
        `SELECT c.id, c.conflict_type AS "conflictType", c.severity, c.status,
                c.specialist_verdict AS "specialistVerdict",
                c.specialist_analysis AS "specialistAnalysis",
                c.specialist_recommendation AS "specialistRecommendation",
                c.value_a AS "valueA", c.value_b AS "valueB",
                c.source_a AS "sourceA", c.source_b AS "sourceB"
         FROM conflicts c
         WHERE c.plant_id = $1
           AND c.attribute_name = $2`,
        [plantId, attributeName]
      ),
    ]);

    const attribute: AttributeRow = attrMeta ?? {
      name: attributeName,
      valueType: "text",
      valuesAllowed: null,
    };

    const prompt = buildPrompt(
      plantName,
      attribute.name,
      attribute,
      warrants,
      conflicts,
      prodVal?.value ?? null
    );

    // Call Anthropic API
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJSON(responseText) as Record<string, unknown>;
    } catch {
      // Retry once
      const retry = await anthropic.messages.create({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 2048,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: responseText },
          {
            role: "user",
            content:
              "Your response was not valid JSON. Please respond with ONLY a JSON object matching the schema requested.",
          },
        ],
      });
      const retryText =
        retry.content[0].type === "text" ? retry.content[0].text : "";
      parsed = extractJSON(retryText) as Record<string, unknown>;
    }

    // Validate
    const CONFIDENCES = ["HIGH", "MODERATE", "LOW"];
    const categoricalValue = validateCategoricalValue(
      parsed.categorical_value as string | null,
      attribute.valuesAllowed
    );
    const confidence = CONFIDENCES.includes(parsed.confidence as string)
      ? (parsed.confidence as string)
      : "MODERATE";

    return Response.json({
      synthesized_text:
        typeof parsed.synthesized_text === "string"
          ? parsed.synthesized_text
          : "Synthesis could not be generated.",
      categorical_value: categoricalValue,
      confidence,
      confidence_reasoning:
        typeof parsed.confidence_reasoning === "string"
          ? parsed.confidence_reasoning
          : null,
      sources_cited: Array.isArray(parsed.sources_cited)
        ? parsed.sources_cited
        : [],
      warrant_weights: Array.isArray(parsed.warrant_weights)
        ? parsed.warrant_weights
        : [],
    });
  } catch (error) {
    console.error("POST /api/synthesize error:", error);
    return Response.json(
      { error: "Failed to process synthesis request" },
      { status: 500 }
    );
  }
}
