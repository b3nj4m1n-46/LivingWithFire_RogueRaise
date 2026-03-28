import { readFile } from "fs/promises";
import { join } from "path";
import { fetchConflictDetail, fetchConflictWarrants } from "@/lib/queries/conflicts";

interface DatasetContext {
  sourceIdCode: string;
  sourceDataset: string;
  dataDictionary: string | null;
  readme: string | null;
}

interface KBResult {
  documentTitle: string;
  sectionTitle: string;
  sectionSummary: string;
  nodeId: string;
}

// Resolve the repo root — admin/ is one level down from the repo root
const REPO_ROOT = process.env.REPO_ROOT || join(process.cwd(), "..");

async function readFileOrNull(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

// ── Dataset Context ─────────────────────────────────────────────────────

async function getDatasetContexts(
  warrants: { source_id_code: string | null; source_dataset: string | null }[]
): Promise<DatasetContext[]> {
  const seen = new Set<string>();
  const contexts: DatasetContext[] = [];

  for (const w of warrants) {
    const dataset = w.source_dataset;
    const code = w.source_id_code ?? dataset ?? "unknown";
    if (!dataset || seen.has(dataset)) continue;
    seen.add(dataset);

    // Search all category folders for the dataset
    const categories = [
      "fire", "deer", "traits", "taxonomy", "water",
      "pollinators", "birds", "native", "invasive",
    ];

    let dataDictionary: string | null = null;
    let readme: string | null = null;

    for (const cat of categories) {
      const base = join(REPO_ROOT, "database-sources", cat, dataset);
      const dd = await readFileOrNull(join(base, "DATA-DICTIONARY.md"));
      if (dd) {
        dataDictionary = dd;
        readme = await readFileOrNull(join(base, "README.md"));
        break;
      }
    }

    contexts.push({
      sourceIdCode: code,
      sourceDataset: dataset,
      dataDictionary,
      readme,
    });
  }

  return contexts;
}

// ── Knowledge Base Search ───────────────────────────────────────────────

interface ManifestEntry {
  file: string;
  doc_name: string;
  top_level_sections: number;
}

interface IndexNode {
  title: string;
  summary: string;
  node_id: string;
  nodes?: IndexNode[];
}

interface IndexFile {
  doc_name: string;
  structure: IndexNode[];
}

function searchNodes(
  nodes: IndexNode[],
  terms: string[],
  docTitle: string,
  results: KBResult[]
) {
  for (const node of nodes) {
    const text = `${node.title} ${node.summary}`.toLowerCase();
    const matchCount = terms.filter((t) => text.includes(t)).length;
    if (matchCount >= 2 || (terms.length === 1 && matchCount === 1)) {
      results.push({
        documentTitle: docTitle,
        sectionTitle: node.title,
        sectionSummary:
          node.summary.length > 500
            ? node.summary.slice(0, 500) + "..."
            : node.summary,
        nodeId: node.node_id,
      });
    }
    if (node.nodes) {
      searchNodes(node.nodes, terms, docTitle, results);
    }
  }
}

async function searchKnowledgeBase(
  plantName: string,
  attributeName: string
): Promise<KBResult[]> {
  const indexDir = join(REPO_ROOT, "knowledge-base", "indexes");
  const manifestPath = join(indexDir, "manifest.json");
  const manifestRaw = await readFileOrNull(manifestPath);
  if (!manifestRaw) return [];

  const manifest: { indexes: ManifestEntry[] } = JSON.parse(manifestRaw);

  // Build search terms from plant name and attribute
  const terms = [
    ...plantName.toLowerCase().split(/\s+/),
    ...attributeName.toLowerCase().replace(/_/g, " ").split(/\s+/),
  ].filter((t) => t.length > 2);

  const results: KBResult[] = [];

  // Search each index file
  for (const entry of manifest.indexes) {
    const raw = await readFileOrNull(join(indexDir, entry.file));
    if (!raw) continue;

    const index: IndexFile = JSON.parse(raw);
    searchNodes(index.structure, terms, index.doc_name, results);

    // Cap results to avoid huge responses
    if (results.length >= 10) break;
  }

  return results.slice(0, 10);
}

// ── Route Handler ───────────────────────────────────────────────────────

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conflict = await fetchConflictDetail(id);
    if (!conflict) {
      return Response.json({ error: "Conflict not found" }, { status: 404 });
    }

    const warrants = await fetchConflictWarrants(
      conflict.warrant_a_id,
      conflict.warrant_b_id
    );

    const [datasetContexts, knowledgeBaseResults] = await Promise.all([
      getDatasetContexts(warrants),
      searchKnowledgeBase(conflict.plant_name, conflict.attribute_name),
    ]);

    return Response.json({ datasetContexts, knowledgeBaseResults });
  } catch (error) {
    console.error("POST /api/conflicts/[id]/research error:", error);
    return Response.json(
      { error: "Failed to fetch research context" },
      { status: 500 }
    );
  }
}
