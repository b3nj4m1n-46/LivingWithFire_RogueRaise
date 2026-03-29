import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const REPO_ROOT = resolve(process.cwd(), "..");
const DB_SOURCES = resolve(REPO_ROOT, "database-sources");

const CATEGORIES = [
  "fire", "deer", "traits", "taxonomy", "water",
  "pollinators", "birds", "native", "invasive",
];

async function findDatasetFolder(sourceIdCode: string): Promise<string | null> {
  for (const cat of CATEGORIES) {
    const catPath = resolve(DB_SOURCES, cat);
    let entries: string[];
    try {
      const { readdir } = await import("node:fs/promises");
      entries = await readdir(catPath);
    } catch {
      continue;
    }

    for (const name of entries) {
      const folder = resolve(catPath, name);
      const readme = await readFile(resolve(folder, "README.md"), "utf-8").catch(() => "");
      const dd = await readFile(resolve(folder, "DATA-DICTIONARY.md"), "utf-8").catch(() => "");
      const combined = readme + dd;
      if (combined.includes(sourceIdCode)) {
        return folder;
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { sourceIdCode } = await request.json();

    if (!sourceIdCode) {
      return Response.json(
        { error: "Missing sourceIdCode" },
        { status: 400 }
      );
    }

    const folder = await findDatasetFolder(sourceIdCode);
    if (!folder) {
      return Response.json(
        { error: `Could not find dataset folder for ${sourceIdCode}` },
        { status: 404 }
      );
    }

    const readme = await readFile(resolve(folder, "README.md"), "utf-8").catch(() => "");
    const dd = await readFile(resolve(folder, "DATA-DICTIONARY.md"), "utf-8").catch(() => "");

    const prompt = `You are analyzing a plant data source to assess its reliability. Based on the README and DATA-DICTIONARY below, determine:

1. methodology_type: One of: meta_analysis, experimental, field_observation, literature_review, modeling, expert_opinion
2. peer_reviewed: true or false
3. sample_size: A rough number or "unknown"
4. geographic_scope: Brief description (e.g., "Idaho", "Pacific Northwest", "National")
5. geographic_specificity: One of: local, regional, national, global
6. temporal_currency: One of: current (data ≤5 years old), recent (5-15 years), dated (>15 years)
7. publication_year: The year the data was published (integer or null)

Source ID: ${sourceIdCode}

## README
${readme.slice(0, 3000)}

## DATA-DICTIONARY
${dd.slice(0, 3000)}

Respond with ONLY valid JSON (no markdown fencing):
{
  "methodology_type": "...",
  "peer_reviewed": false,
  "sample_size": "...",
  "geographic_scope": "...",
  "geographic_specificity": "...",
  "temporal_currency": "...",
  "publication_year": null
}`;

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    let suggestions: Record<string, unknown>;
    try {
      suggestions = JSON.parse(text);
    } catch {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        suggestions = JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } else {
        return Response.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }
    }

    return Response.json({ suggestions });
  } catch (error) {
    console.error("POST /api/sources/reliability/ai-suggest error:", error);
    return Response.json(
      { error: "Failed to generate AI suggestions" },
      { status: 500 }
    );
  }
}
