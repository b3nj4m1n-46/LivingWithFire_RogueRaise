import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { query, queryOne } from "@/lib/dolt";
import { DB_SOURCES, parseDatasetMeta } from "@/lib/dataset-meta";

// --- Types ---

export interface SourceRegistryEntry {
  name: string;
  category: string;
  folder: string;
  sourceId: string;
  plantCount: number | null;
  hasDictionary: boolean;
  lastBatchId: string | null;
  lastBatchStatus: string | null;
  lastAnalyzedAt: string | null;
}

export interface PipelineStep {
  name: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
}

export interface PipelineProgress {
  batchId: string;
  status: string;
  sourceDataset: string;
  currentStep: string;
  steps: PipelineStep[];
  stats: {
    totalRecords?: number;
    plantsMatched?: number;
    plantsUnmatched?: number;
    warrantsCreated?: number;
    conflictsDetected?: number;
    commitHash?: string;
  };
}

// --- Helpers ---

const STEP_LABELS: Record<string, string> = {
  matching: "Match Plants",
  mapping: "Map Schema",
  enhancing: "Create Warrants",
  classifying: "Classify Conflicts",
  committing: "Commit to Dolt",
};

const STEP_ORDER = ["matching", "mapping", "enhancing", "classifying", "committing"];

// --- Query Functions ---

export async function fetchSourceRegistry(): Promise<SourceRegistryEntry[]> {
  const categories = await readdir(DB_SOURCES);
  const datasets: SourceRegistryEntry[] = [];

  for (const category of categories) {
    const catPath = resolve(DB_SOURCES, category);
    let entries: string[];
    try {
      entries = await readdir(catPath);
    } catch {
      continue;
    }

    for (const name of entries) {
      const folder = resolve(catPath, name);
      const hasReadme = await readFile(resolve(folder, "README.md"), "utf-8")
        .then(() => true)
        .catch(() => false);
      if (!hasReadme) continue;

      const meta = await parseDatasetMeta(folder);
      const hasDictionary = await readFile(
        resolve(folder, "DATA-DICTIONARY.md"),
        "utf-8"
      )
        .then(() => true)
        .catch(() => false);

      const relFolder = `database-sources/${category}/${name}`;

      datasets.push({
        name,
        category,
        folder: relFolder,
        sourceId: meta.sourceId,
        plantCount: meta.plantCount,
        hasDictionary,
        lastBatchId: null,
        lastBatchStatus: null,
        lastAnalyzedAt: null,
      });
    }
  }

  // Enrich with latest batch info (non-fatal — DB may be unavailable)
  try {
    const batches = await query<{
      source_dataset: string;
      id: string;
      status: string;
      completed_at: string | null;
    }>(
      `SELECT DISTINCT ON (source_dataset) source_dataset, id, status, completed_at
       FROM analysis_batches
       ORDER BY source_dataset, started_at DESC`
    );

    const batchMap = new Map(batches.map((b) => [b.source_dataset, b]));

    for (const ds of datasets) {
      const batch = batchMap.get(ds.name);
      if (batch) {
        ds.lastBatchId = batch.id;
        ds.lastBatchStatus = batch.status;
        ds.lastAnalyzedAt = batch.completed_at;
      }
    }
  } catch {
    // DB unavailable — return datasets without batch info
  }

  return datasets.sort((a, b) => a.category.localeCompare(b.category));
}

export async function fetchBatchProgress(
  batchId: string
): Promise<PipelineProgress | null> {
  const row = await queryOne<{
    id: string;
    status: string;
    source_dataset: string;
    total_source_records: number | null;
    plants_matched: number | null;
    plants_unmatched: number | null;
    warrants_created: number | null;
    conflicts_detected: number | null;
    dolt_commit_hash: string | null;
    notes: string | null;
  }>(
    `SELECT id, status, source_dataset, total_source_records,
            plants_matched, plants_unmatched, warrants_created,
            conflicts_detected, dolt_commit_hash, notes
     FROM analysis_batches WHERE id = $1`,
    [batchId]
  );

  if (!row) return null;

  // Parse step progress from notes JSON
  let currentStep = "pending";
  let stepData: Record<string, { status: string; detail?: string }> = {};

  if (row.notes) {
    try {
      const parsed = JSON.parse(row.notes);
      currentStep = parsed.currentStep ?? "pending";
      stepData = parsed.steps ?? {};
    } catch {
      // notes might not be JSON (e.g. plain text notes)
    }
  }

  const steps: PipelineStep[] = STEP_ORDER.map((name) => ({
    name,
    label: STEP_LABELS[name],
    status: (stepData[name]?.status as PipelineStep["status"]) ?? "pending",
    detail: stepData[name]?.detail,
  }));

  return {
    batchId: row.id,
    status: row.status,
    sourceDataset: row.source_dataset,
    currentStep,
    steps,
    stats: {
      totalRecords: row.total_source_records ?? undefined,
      plantsMatched: row.plants_matched ?? undefined,
      plantsUnmatched: row.plants_unmatched ?? undefined,
      warrantsCreated: row.warrants_created ?? undefined,
      conflictsDetected: row.conflicts_detected ?? undefined,
      commitHash: row.dolt_commit_hash ?? undefined,
    },
  };
}

export async function generateNextSourceId(
  category: string
): Promise<string> {
  const prefixMap: Record<string, string> = {
    fire: "FIRE",
    deer: "DEER",
    water: "WATER",
    pollinators: "POLL",
    birds: "BIRD",
    native: "NATIVE",
    invasive: "INVAS",
    traits: "TRAIT",
    taxonomy: "TAXON",
  };

  const prefix = prefixMap[category] ?? category.toUpperCase();
  const catPath = resolve(DB_SOURCES, category);

  let entries: string[];
  try {
    entries = await readdir(catPath);
  } catch {
    return `${prefix}-01`;
  }

  let maxNum = 0;
  for (const name of entries) {
    const folder = resolve(catPath, name);
    const meta = await parseDatasetMeta(folder);
    const match = /(\d+)$/.exec(meta.sourceId);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const next = String(maxNum + 1).padStart(2, "0");
  return `${prefix}-${next}`;
}
