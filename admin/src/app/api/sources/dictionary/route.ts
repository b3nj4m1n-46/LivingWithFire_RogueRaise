import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const REPO_ROOT = resolve(process.cwd(), "..");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { datasetFolder, sourceId } = body;

    if (!datasetFolder || !sourceId) {
      return Response.json(
        { error: "datasetFolder and sourceId are required" },
        { status: 400 }
      );
    }

    const absFolder = resolve(REPO_ROOT, datasetFolder);
    const csvPath = resolve(absFolder, "plants.csv");

    let csvContent: string;
    try {
      csvContent = await readFile(csvPath, "utf-8");
    } catch {
      return Response.json(
        { error: "plants.csv not found in dataset folder" },
        { status: 404 }
      );
    }

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim() !== "");
    const headers = lines[0];
    const sampleLines = lines.slice(1, 11).join("\n");
    const rowCount = lines.length - 1;
    const datasetName = datasetFolder.split("/").pop() ?? "Unknown";

    const prompt = `You are a data documentation specialist. Analyze this CSV dataset and generate a DATA-DICTIONARY.md file.

**Dataset:** ${datasetName}
**Source ID:** ${sourceId}
**Total Records:** ${rowCount}

**CSV Headers:**
${headers}

**Sample Rows (up to 10):**
${sampleLines}

Generate a DATA-DICTIONARY.md following this exact format:

\`\`\`markdown
# Data Dictionary: ${datasetName}

**Source ID:** \`${sourceId}\`
**Description:** [One sentence describing this dataset based on the data]
**Primary Join Key:** \`scientific_name\` (or whichever column best represents the plant's scientific/botanical name)

**Primary File:** \`plants.csv\` (${rowCount.toLocaleString()} records)

## Column Definitions

### \`column_name\`
- **Definition:** [What this column represents]
- **Type:** text | integer | float | categorical | boolean
- **Values:** (only for categorical columns)
  - \`value1\` --- description
  - \`value2\` --- description
\`\`\`

Rules:
- Identify the column most likely to be the scientific/botanical plant name and mark it as **[JOIN KEY]**
- For categorical columns, list all unique values you can see in the sample data with descriptions
- For rating/scale columns, describe the scale range and meaning
- Be specific about data types
- Output ONLY the markdown content, no code fences around the entire output`;

    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const dictionary =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Write DATA-DICTIONARY.md
    await writeFile(resolve(absFolder, "DATA-DICTIONARY.md"), dictionary, "utf-8");

    return Response.json({ dictionary });
  } catch (error) {
    console.error("POST /api/sources/dictionary error:", error);
    return Response.json(
      { error: "Failed to generate data dictionary" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { datasetFolder, content } = body;

    if (!datasetFolder || !content) {
      return Response.json(
        { error: "datasetFolder and content are required" },
        { status: 400 }
      );
    }

    const absFolder = resolve(REPO_ROOT, datasetFolder);
    await writeFile(resolve(absFolder, "DATA-DICTIONARY.md"), content, "utf-8");

    return Response.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/sources/dictionary error:", error);
    return Response.json(
      { error: "Failed to save data dictionary" },
      { status: 500 }
    );
  }
}
