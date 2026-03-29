import { readFile } from "fs/promises";
import { join } from "path";

// ── Interfaces ─────────────────────────────────────────────────────────

export interface DatasetContext {
  sourceIdCode: string;
  sourceDataset: string;
  dataDictionary: string | null;
  readme: string | null;
}

export interface KBResult {
  documentTitle: string;
  sectionTitle: string;
  sectionSummary: string;
  nodeId: string;
}

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

// ── Constants ──────────────────────────────────────────────────────────

// Resolve the repo root — admin/ is one level down from the repo root
export const REPO_ROOT = process.env.REPO_ROOT || join(process.cwd(), "..");

const CATEGORIES = [
  "fire", "deer", "traits", "taxonomy", "water",
  "pollinators", "birds", "native", "invasive",
];

// ── Helpers ────────────────────────────────────────────────────────────

export async function readFileOrNull(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

/** Extract JSON from LLM text that may include markdown fencing or preamble. */
export function extractJSON(text: string): Record<string, unknown> {
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

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(text.slice(firstBracket, lastBracket + 1));
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

  throw new Error(`Could not extract JSON from LLM response:\n${text.slice(0, 500)}`);
}

// ── Dataset Context ────────────────────────────────────────────────────

export async function getDatasetContexts(
  warrants: { source_id_code: string | null; source_dataset: string | null }[]
): Promise<DatasetContext[]> {
  const seen = new Set<string>();
  const contexts: DatasetContext[] = [];

  for (const w of warrants) {
    const dataset = w.source_dataset;
    const code = w.source_id_code ?? dataset ?? "unknown";
    if (!dataset || seen.has(dataset)) continue;
    seen.add(dataset);

    let dataDictionary: string | null = null;
    let readme: string | null = null;

    for (const cat of CATEGORIES) {
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

// ── Knowledge Base Search ──────────────────────────────────────────────

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

export async function searchKnowledgeBase(
  plantName: string,
  attributeName: string
): Promise<KBResult[]> {
  const indexDir = join(REPO_ROOT, "knowledge-base", "indexes");
  const manifestPath = join(indexDir, "manifest.json");
  const manifestRaw = await readFileOrNull(manifestPath);
  if (!manifestRaw) return [];

  const manifest: { indexes: ManifestEntry[] } = JSON.parse(manifestRaw);

  const terms = [
    ...plantName.toLowerCase().split(/\s+/),
    ...attributeName.toLowerCase().replace(/_/g, " ").split(/\s+/),
  ].filter((t) => t.length > 2);

  const results: KBResult[] = [];

  for (const entry of manifest.indexes) {
    const raw = await readFileOrNull(join(indexDir, entry.file));
    if (!raw) continue;

    const index: IndexFile = JSON.parse(raw);
    searchNodes(index.structure, terms, index.doc_name, results);

    if (results.length >= 10) break;
  }

  return results.slice(0, 10);
}
