import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const KNOWLEDGE_BASE_DIR = resolve(process.cwd(), "..", "knowledge-base");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No PDF file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json(
        { error: "Only .pdf files are accepted" },
        { status: 400 }
      );
    }

    // Prevent path traversal
    const filename = file.name.replace(/[/\\]/g, "_");
    const destPath = resolve(KNOWLEDGE_BASE_DIR, filename);

    // Ensure destination is within knowledge-base/
    if (!destPath.startsWith(KNOWLEDGE_BASE_DIR)) {
      return Response.json({ error: "Invalid filename" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(destPath, buffer);

    return Response.json({
      filename,
      size: buffer.length,
    });
  } catch (error) {
    console.error("POST /api/sources/documents/upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
