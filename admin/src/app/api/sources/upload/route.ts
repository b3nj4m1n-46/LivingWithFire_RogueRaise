import crypto from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No CSV file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return Response.json(
        { error: "Only .csv files are accepted" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

    if (lines.length < 2) {
      return Response.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 }
      );
    }

    const headers = parseCSVLine(lines[0]);
    const sampleRows = lines.slice(1, 11).map(parseCSVLine);
    const rowCount = lines.length - 1;

    const uploadId = crypto.randomUUID();
    const stagingDir = resolve(tmpdir(), "lwf-uploads");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(resolve(stagingDir, `${uploadId}.csv`), text, "utf-8");

    return Response.json({
      uploadId,
      headers,
      rowCount,
      sampleRows,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("POST /api/sources/upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}
