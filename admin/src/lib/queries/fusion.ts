import { readdir, readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { query, queryOne } from "@/lib/dolt";
import crypto from "node:crypto";

// --- Types ---

export interface DatasetInfo {
  name: string;
  category: string;
  folder: string;
  sourceId: string;
  plantCount: number | null;
  lastBatchId: string | null;
  lastBatchStatus: string | null;
}

export interface FusionBatch {
  id: string;
  source_dataset: string;
  source_id_code: string;
  batch_type: string;
  status: string;
  dataset_folder: string | null;
  plants_matched: number | null;
  warrants_created: number | null;
  conflicts_detected: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface MappingBatch extends FusionBatch {
  mapping_config: MappingConfig | null;
}

export interface ColumnMapping {
  sourceColumn: string;
  sourceType: string;
  sourceDefinition: string;
  mappingType: string;
  targetAttributeId: string | null;
  targetAttributeName: string | null;
  confidence: number;
  reasoning: string;
  crosswalk: Record<string, string> | null;
  notes: string;
}

export interface MappingConfig {
  sourceDataset: string;
  sourceIdCode: string;
  mappings: ColumnMapping[];
  unmappedColumns: string[];
  summary: {
    total: number;
    direct: number;
    crosswalk: number;
    split: number;
    newAttribute: number;
    skip: number;
    uncertain: number;
  };
}

// --- Helpers ---

const REPO_ROOT = resolve(process.cwd(), "..");
const DB_SOURCES = resolve(REPO_ROOT, "database-sources");
const SOURCE_ID_RE = /\*\*Source ID:\*\*\s*`([^`]+)`/;
const PLANTS_RE = /\*\*Plants:\*\*\s*(\d[\d,]*)/;

async function parseDatasetMeta(
  folder: string
): Promise<{ sourceId: string; plantCount: number | null }> {
  const ddPath = resolve(folder, "DATA-DICTIONARY.md");
  const readmePath = resolve(folder, "README.md");

  const [dd, readme] = await Promise.all([
    readFile(ddPath, "utf-8").catch(() => ""),
    readFile(readmePath, "utf-8").catch(() => ""),
  ]);

  const idMatch = SOURCE_ID_RE.exec(dd) ?? SOURCE_ID_RE.exec(readme);
  const sourceId = idMatch?.[1] ?? "UNKNOWN";

  const countMatch = PLANTS_RE.exec(readme);
  const plantCount = countMatch
    ? parseInt(countMatch[1].replace(/,/g, ""), 10)
    : null;

  return { sourceId, plantCount };
}

// --- Query Functions ---

export async function fetchAvailableDatasets(): Promise<DatasetInfo[]> {
  const categories = await readdir(DB_SOURCES);
  const datasets: DatasetInfo[] = [];

  for (const category of categories) {
    const catPath = resolve(DB_SOURCES, category);
    let entries: string[];
    try {
      entries = await readdir(catPath);
    } catch {
      continue; // Skip non-directories
    }

    for (const name of entries) {
      const folder = resolve(catPath, name);
      // Check it's a dataset folder (has README.md or plants.csv)
      const hasReadme = await readFile(resolve(folder, "README.md"), "utf-8")
        .then(() => true)
        .catch(() => false);
      if (!hasReadme) continue;

      const meta = await parseDatasetMeta(folder);
      const relFolder = `database-sources/${category}/${name}`;

      datasets.push({
        name,
        category,
        folder: relFolder,
        sourceId: meta.sourceId,
        plantCount: meta.plantCount,
        lastBatchId: null,
        lastBatchStatus: null,
      });
    }
  }

  // Enrich with latest batch info
  const batches = await query<{
    source_dataset: string;
    id: string;
    status: string;
  }>(
    `SELECT DISTINCT ON (source_dataset) source_dataset, id, status
     FROM analysis_batches
     ORDER BY source_dataset, started_at DESC`
  );

  const batchMap = new Map(batches.map((b) => [b.source_dataset, b]));

  for (const ds of datasets) {
    const batch = batchMap.get(ds.name);
    if (batch) {
      ds.lastBatchId = batch.id;
      ds.lastBatchStatus = batch.status;
    }
  }

  return datasets.sort((a, b) => a.category.localeCompare(b.category));
}

export async function fetchFusionBatches(): Promise<FusionBatch[]> {
  return query<FusionBatch>(
    `SELECT id, source_dataset, source_id_code, batch_type, status,
            dataset_folder, plants_matched, warrants_created,
            conflicts_detected, started_at, completed_at
     FROM analysis_batches
     ORDER BY started_at DESC
     LIMIT 50`
  );
}

export async function fetchMappingBatch(
  batchId: string
): Promise<MappingBatch | null> {
  const row = await queryOne<{
    id: string;
    source_dataset: string;
    source_id_code: string;
    batch_type: string;
    status: string;
    dataset_folder: string | null;
    plants_matched: number | null;
    warrants_created: number | null;
    conflicts_detected: number | null;
    started_at: string;
    completed_at: string | null;
    mapping_config: string | null;
  }>(
    `SELECT id, source_dataset, source_id_code, batch_type, status,
            dataset_folder, plants_matched, warrants_created,
            conflicts_detected, started_at, completed_at, mapping_config
     FROM analysis_batches
     WHERE id = $1`,
    [batchId]
  );

  if (!row) return null;

  return {
    ...row,
    mapping_config: row.mapping_config
      ? (typeof row.mapping_config === "string"
          ? JSON.parse(row.mapping_config)
          : row.mapping_config)
      : null,
  };
}

export async function createMappingBatch(
  sourceDataset: string,
  sourceIdCode: string,
  datasetFolder: string,
  mappingConfig: MappingConfig
): Promise<string> {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO analysis_batches
       (id, source_dataset, source_id_code, batch_type, status, dataset_folder, mapping_config)
     VALUES ($1, $2, $3, 'schema_mapping', 'mapping_review', $4, $5)`,
    [id, sourceDataset, sourceIdCode, datasetFolder, JSON.stringify(mappingConfig)]
  );
  return id;
}

export async function updateMappingConfig(
  batchId: string,
  mappingConfig: MappingConfig
): Promise<void> {
  await query(
    `UPDATE analysis_batches SET mapping_config = $1 WHERE id = $2`,
    [JSON.stringify(mappingConfig), batchId]
  );
}

export async function updateBatchStatus(
  batchId: string,
  status: string,
  stats?: {
    plantsMatched?: number;
    plantsUnmatched?: number;
    warrantsCreated?: number;
    conflictsDetected?: number;
    commitHash?: string;
  }
): Promise<void> {
  const sets: string[] = ["status = $1", "completed_at = CURRENT_TIMESTAMP"];
  const params: unknown[] = [status];
  let idx = 2;

  if (stats?.plantsMatched != null) {
    sets.push(`plants_matched = $${idx++}`);
    params.push(stats.plantsMatched);
  }
  if (stats?.plantsUnmatched != null) {
    sets.push(`plants_unmatched = $${idx++}`);
    params.push(stats.plantsUnmatched);
  }
  if (stats?.warrantsCreated != null) {
    sets.push(`warrants_created = $${idx++}`);
    params.push(stats.warrantsCreated);
  }
  if (stats?.conflictsDetected != null) {
    sets.push(`conflicts_detected = $${idx++}`);
    params.push(stats.conflictsDetected);
  }
  if (stats?.commitHash != null) {
    sets.push(`dolt_commit_hash = $${idx++}`);
    params.push(stats.commitHash);
  }

  params.push(batchId);
  await query(
    `UPDATE analysis_batches SET ${sets.join(", ")} WHERE id = $${idx}`,
    params
  );
}
