import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { generateNextSourceId } from "@/lib/queries/sources";

const REPO_ROOT = resolve(process.cwd(), "..");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("suggestId");

    if (!category) {
      return Response.json({ error: "suggestId parameter required" }, { status: 400 });
    }

    const suggestedId = await generateNextSourceId(category);
    return Response.json({ suggestedId });
  } catch (error) {
    console.error("GET /api/sources/create error:", error);
    return Response.json({ suggestedId: null });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uploadId, name, sourceId, category, url, citation, notes } = body;

    if (!uploadId || !name || !sourceId || !category) {
      return Response.json(
        { error: "uploadId, name, sourceId, and category are required" },
        { status: 400 }
      );
    }

    const validCategories = [
      "fire", "deer", "water", "pollinators", "birds",
      "native", "invasive", "traits", "taxonomy",
    ];
    if (!validCategories.includes(category)) {
      return Response.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Read uploaded CSV from temp storage
    const stagingDir = resolve(tmpdir(), "lwf-uploads");
    const tempPath = resolve(stagingDir, `${uploadId}.csv`);
    let csvContent: string;
    try {
      csvContent = await readFile(tempPath, "utf-8");
    } catch {
      return Response.json(
        { error: "Upload not found. Please re-upload the CSV." },
        { status: 404 }
      );
    }

    const rowCount =
      csvContent.split(/\r?\n/).filter((l) => l.trim() !== "").length - 1;

    // Create dataset folder
    const datasetFolder = `database-sources/${category}/${name}`;
    const absFolder = resolve(REPO_ROOT, datasetFolder);
    await mkdir(absFolder, { recursive: true });

    // Write plants.csv
    await writeFile(resolve(absFolder, "plants.csv"), csvContent, "utf-8");

    // Generate README.md
    const readmeLines = [
      `# ${name}`,
      "",
      `**Source ID:** \`${sourceId}\``,
      `**Plants:** ${rowCount.toLocaleString()} records`,
    ];
    if (url) readmeLines.push(`**Source URL:** ${url}`);
    if (citation) readmeLines.push(`**Citation:** ${citation}`);
    if (notes) {
      readmeLines.push("", "## Notes", "", notes);
    }
    readmeLines.push("");

    await writeFile(
      resolve(absFolder, "README.md"),
      readmeLines.join("\n"),
      "utf-8"
    );

    // Clean up temp file
    await unlink(tempPath).catch(() => {});

    return Response.json({ datasetFolder, sourceId });
  } catch (error) {
    console.error("POST /api/sources/create error:", error);
    return Response.json({ error: "Failed to create dataset" }, { status: 500 });
  }
}
