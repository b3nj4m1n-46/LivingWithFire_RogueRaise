import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const KNOWLEDGE_BASE_DIR = resolve(process.cwd(), "..", "knowledge-base");
const INDEX_DIR = resolve(KNOWLEDGE_BASE_DIR, "indexes");

export const dynamic = "force-dynamic";

interface ManifestEntry {
  file: string;
  doc_name: string;
  top_level_sections: number;
  size_bytes: number;
}

interface Manifest {
  total: number;
  indexes: ManifestEntry[];
}

export async function GET() {
  try {
    // Load manifest for indexed document metadata
    let manifest: Manifest = { total: 0, indexes: [] };
    try {
      const raw = await readFile(resolve(INDEX_DIR, "manifest.json"), "utf-8");
      manifest = JSON.parse(raw);
    } catch {
      // No manifest yet — that's fine
    }

    // Build a lookup of indexed docs by PDF filename
    const indexedMap = new Map<
      string,
      { sections: number; sizeBytes: number; indexFile: string }
    >();
    for (const entry of manifest.indexes) {
      indexedMap.set(entry.doc_name, {
        sections: entry.top_level_sections,
        sizeBytes: entry.size_bytes,
        indexFile: entry.file,
      });
    }

    // List all PDFs in knowledge-base/
    const files = await readdir(KNOWLEDGE_BASE_DIR);
    const pdfs = files
      .filter((f) => f.toLowerCase().endsWith(".pdf"))
      .sort();

    const documents = pdfs.map((filename) => {
      const indexed = indexedMap.get(filename);
      return {
        filename,
        indexed: !!indexed,
        sections: indexed?.sections ?? null,
        sizeBytes: indexed?.sizeBytes ?? null,
        indexFile: indexed?.indexFile ?? null,
      };
    });

    return Response.json({
      total: documents.length,
      indexed: documents.filter((d) => d.indexed).length,
      documents,
    });
  } catch (error) {
    console.error("GET /api/sources/documents/status error:", error);
    return Response.json(
      { error: "Failed to load document status" },
      { status: 500 }
    );
  }
}
