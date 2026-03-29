import { resolve } from "node:path";
import { access } from "node:fs/promises";
import { callIndexBridge } from "@/lib/index-bridge";

const KNOWLEDGE_BASE_DIR = resolve(process.cwd(), "..", "knowledge-base");

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();

    if (!filename || typeof filename !== "string") {
      return Response.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }

    // Prevent path traversal
    const safeName = filename.replace(/[/\\]/g, "_");
    const pdfPath = resolve(KNOWLEDGE_BASE_DIR, safeName);
    if (!pdfPath.startsWith(KNOWLEDGE_BASE_DIR)) {
      return Response.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Verify PDF exists
    try {
      await access(pdfPath);
    } catch {
      return Response.json(
        { error: `PDF not found: ${safeName}` },
        { status: 404 }
      );
    }

    // Fire-and-forget: trigger indexing via bridge
    callIndexBridge("index-pdf", {
      pdfPath: `knowledge-base/${safeName}`,
    }).catch((err) => {
      console.error(`Indexing failed for ${safeName}:`, err);
    });

    return Response.json({ status: "indexing", filename: safeName });
  } catch (error) {
    console.error("POST /api/sources/documents/index error:", error);
    return Response.json({ error: "Failed to start indexing" }, { status: 500 });
  }
}
