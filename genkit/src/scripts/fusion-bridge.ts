/**
 * Fusion Bridge — JSON stdin/stdout interface for admin portal API routes.
 *
 * Reads a JSON command from stdin, executes the requested action, and
 * writes the JSON result to stdout. Used by the admin portal to call
 * Genkit flows without cross-package imports.
 *
 * Actions:
 *   map              — Run mapSchemaFlow on a dataset
 *   match-and-preview — Match plants + dry-run bulkEnhanceFlow (no DB writes)
 *   execute          — Full pipeline: match + enhance + classify (writes to DB)
 *
 * Usage: echo '{"action":"map",...}' | npx tsx src/scripts/fusion-bridge.ts
 */
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { doltPool } from '../tools/index.js';
import { getDatasetContext } from '../tools/datasetContext.js';
import { mapSchemaFlow } from '../flows/mapSchemaFlow.js';
import { matchPlantFlow } from '../flows/matchPlantFlow.js';
import { bulkEnhanceFlow } from '../flows/bulkEnhanceFlow.js';
import { classifyConflictFlow } from '../flows/classifyConflictFlow.js';
import { parseCSV } from '../utils/csv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

// --- Read stdin ---

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// --- Actions ---

interface MapInput {
  action: 'map';
  sourceDataset: string;
  datasetFolder: string;
  csvPath?: string;
}

interface PreviewInput {
  action: 'match-and-preview';
  sourceDataset: string;
  datasetFolder: string;
  mappingConfig: unknown;
  batchId: string;
}

interface ExecuteInput {
  action: 'execute';
  sourceDataset: string;
  datasetFolder: string;
  mappingConfig: unknown;
  batchId: string;
}

interface FullAnalysisInput {
  action: 'full-analysis';
  sourceDataset: string;
  datasetFolder: string;
  batchId: string;
}

type BridgeInput = MapInput | PreviewInput | ExecuteInput | FullAnalysisInput;

async function buildPlantInputs(datasetFolder: string, datasetName: string) {
  const csvPath = resolve(REPO_ROOT, datasetFolder, 'plants.csv');
  const content = await readFile(csvPath, 'utf-8');
  const parsed = parseCSV(content);
  return {
    totalRecords: parsed.rows.length,
    plantInputs: parsed.rows.map((row, idx) => ({
      sourceRowId: String(idx + 2),
      scientificName: row['scientific_name'] ?? '',
      commonName: row['common_name'],
      sourceDataset: datasetName,
    })),
  };
}

async function handleMap(input: MapInput) {
  const result = await mapSchemaFlow({
    sourceDataset: input.sourceDataset,
    datasetFolder: input.datasetFolder,
    csvPath: input.csvPath,
  });
  return result;
}

async function handlePreview(input: PreviewInput) {
  const { totalRecords, plantInputs } = await buildPlantInputs(
    input.datasetFolder,
    input.sourceDataset,
  );

  const matchResult = await matchPlantFlow({ plants: plantInputs });

  const enhanceResult = await bulkEnhanceFlow({
    sourceDataset: input.sourceDataset,
    datasetFolder: input.datasetFolder,
    matchResults: matchResult.matches,
    mappingConfig: input.mappingConfig as Parameters<typeof bulkEnhanceFlow>[0]['mappingConfig'],
    batchId: input.batchId,
    dryRun: true,
  });

  return {
    totalSourceRecords: totalRecords,
    matchSummary: matchResult.summary,
    warrantsEstimated: enhanceResult.warrantsCreated,
    warrantsSkipped: enhanceResult.warrantsSkipped,
    warrantsFlagged: enhanceResult.warrantsFlagged,
    plantsCovered: enhanceResult.plantsCovered,
    attributesCovered: enhanceResult.attributesCovered,
    errors: enhanceResult.errors.slice(0, 10),
  };
}

async function handleExecute(input: ExecuteInput) {
  const { totalRecords, plantInputs } = await buildPlantInputs(
    input.datasetFolder,
    input.sourceDataset,
  );

  // Step 1: Match
  const matchResult = await matchPlantFlow({ plants: plantInputs });
  const plantsMatched = matchResult.summary.total - matchResult.summary.noMatch;

  // Step 2: Create warrants
  const enhanceResult = await bulkEnhanceFlow({
    sourceDataset: input.sourceDataset,
    datasetFolder: input.datasetFolder,
    matchResults: matchResult.matches,
    mappingConfig: input.mappingConfig as Parameters<typeof bulkEnhanceFlow>[0]['mappingConfig'],
    batchId: input.batchId,
  });

  // Step 3: Classify conflicts
  const classifyResult = await classifyConflictFlow({
    mode: 'external',
    sourceDataset: input.sourceDataset,
    batchId: input.batchId,
  });

  // Step 4: Dolt commit
  const client = await doltPool.connect();
  let commitHash = '';
  try {
    const context = await getDatasetContext({ datasetFolder: input.datasetFolder });
    await client.query(`SELECT dolt_add('.')`);
    await client.query(
      `SELECT dolt_commit('-m', $1)`,
      [`fusion: ${context.sourceId} — ${enhanceResult.warrantsCreated} warrants, ${classifyResult.summary.total} conflicts`],
    );
    const logResult = await client.query(
      'SELECT commit_hash FROM dolt_log ORDER BY date DESC LIMIT 1',
    );
    commitHash = logResult.rows[0].commit_hash;
  } finally {
    client.release();
  }

  return {
    totalSourceRecords: totalRecords,
    plantsMatched,
    plantsUnmatched: matchResult.summary.noMatch,
    matchSummary: matchResult.summary,
    warrantsCreated: enhanceResult.warrantsCreated,
    warrantsSkipped: enhanceResult.warrantsSkipped,
    warrantsFlagged: enhanceResult.warrantsFlagged,
    plantsCovered: enhanceResult.plantsCovered,
    attributesCovered: enhanceResult.attributesCovered,
    conflictsDetected: classifyResult.summary.total,
    conflictSummary: classifyResult.summary,
    commitHash,
  };
}

async function updateStepProgress(
  batchId: string,
  currentStep: string,
  stepsStatus: Record<string, { status: string; detail?: string }>,
) {
  const progress = JSON.stringify({ currentStep, steps: stepsStatus });
  const client = await doltPool.connect();
  try {
    await client.query('UPDATE analysis_batches SET notes = $1 WHERE id = $2', [progress, batchId]);
  } finally {
    client.release();
  }
}

async function handleFullAnalysis(input: FullAnalysisInput) {
  const steps: Record<string, { status: string; detail?: string }> = {
    matching: { status: 'pending' },
    mapping: { status: 'pending' },
    enhancing: { status: 'pending' },
    classifying: { status: 'pending' },
    committing: { status: 'pending' },
  };

  const { totalRecords, plantInputs } = await buildPlantInputs(
    input.datasetFolder,
    input.sourceDataset,
  );

  // Update total records
  const client0 = await doltPool.connect();
  try {
    await client0.query(
      'UPDATE analysis_batches SET total_source_records = $1 WHERE id = $2',
      [totalRecords, input.batchId],
    );
  } finally {
    client0.release();
  }

  // Step 1: Match
  steps.matching.status = 'running';
  await updateStepProgress(input.batchId, 'matching', steps);

  const matchResult = await matchPlantFlow({ plants: plantInputs });
  const plantsMatched = matchResult.summary.total - matchResult.summary.noMatch;

  steps.matching = {
    status: 'completed',
    detail: `${plantsMatched} matched, ${matchResult.summary.noMatch} unmatched`,
  };
  await updateStepProgress(input.batchId, 'matching', steps);

  // Update batch with match stats
  const client1 = await doltPool.connect();
  try {
    await client1.query(
      'UPDATE analysis_batches SET plants_matched = $1, plants_unmatched = $2 WHERE id = $3',
      [plantsMatched, matchResult.summary.noMatch, input.batchId],
    );
  } finally {
    client1.release();
  }

  // Step 2: Map schema
  steps.mapping.status = 'running';
  await updateStepProgress(input.batchId, 'mapping', steps);

  const mapResult = await mapSchemaFlow({
    sourceDataset: input.sourceDataset,
    datasetFolder: input.datasetFolder,
  });

  steps.mapping = {
    status: 'completed',
    detail: `${mapResult.mappings.length} columns mapped`,
  };
  await updateStepProgress(input.batchId, 'mapping', steps);

  // Store mapping config
  const client2 = await doltPool.connect();
  try {
    await client2.query(
      'UPDATE analysis_batches SET mapping_config = $1 WHERE id = $2',
      [JSON.stringify(mapResult), input.batchId],
    );
  } finally {
    client2.release();
  }

  // Step 3: Enhance (create warrants)
  steps.enhancing.status = 'running';
  await updateStepProgress(input.batchId, 'enhancing', steps);

  const enhanceResult = await bulkEnhanceFlow({
    sourceDataset: input.sourceDataset,
    datasetFolder: input.datasetFolder,
    matchResults: matchResult.matches,
    mappingConfig: mapResult as Parameters<typeof bulkEnhanceFlow>[0]['mappingConfig'],
    batchId: input.batchId,
  });

  steps.enhancing = {
    status: 'completed',
    detail: `${enhanceResult.warrantsCreated} warrants created`,
  };
  await updateStepProgress(input.batchId, 'enhancing', steps);

  // Update batch with warrant stats
  const client3 = await doltPool.connect();
  try {
    await client3.query(
      'UPDATE analysis_batches SET warrants_created = $1 WHERE id = $2',
      [enhanceResult.warrantsCreated, input.batchId],
    );
  } finally {
    client3.release();
  }

  // Step 4: Classify conflicts
  steps.classifying.status = 'running';
  await updateStepProgress(input.batchId, 'classifying', steps);

  const classifyResult = await classifyConflictFlow({
    mode: 'external',
    sourceDataset: input.sourceDataset,
    batchId: input.batchId,
  });

  steps.classifying = {
    status: 'completed',
    detail: `${classifyResult.summary.total} conflicts detected`,
  };
  await updateStepProgress(input.batchId, 'classifying', steps);

  // Update batch with conflict stats
  const client4 = await doltPool.connect();
  try {
    await client4.query(
      'UPDATE analysis_batches SET conflicts_detected = $1 WHERE id = $2',
      [classifyResult.summary.total, input.batchId],
    );
  } finally {
    client4.release();
  }

  // Step 5: Dolt commit
  steps.committing.status = 'running';
  await updateStepProgress(input.batchId, 'committing', steps);

  const client5 = await doltPool.connect();
  let commitHash = '';
  try {
    const context = await getDatasetContext({ datasetFolder: input.datasetFolder });
    await client5.query(`SELECT dolt_add('.')`);
    await client5.query(
      `SELECT dolt_commit('-m', $1)`,
      [`full-analysis: ${context.sourceId} — ${enhanceResult.warrantsCreated} warrants, ${classifyResult.summary.total} conflicts`],
    );
    const logResult = await client5.query(
      'SELECT commit_hash FROM dolt_log ORDER BY date DESC LIMIT 1',
    );
    commitHash = logResult.rows[0].commit_hash;
  } finally {
    client5.release();
  }

  steps.committing = { status: 'completed', detail: commitHash.slice(0, 8) };
  await updateStepProgress(input.batchId, 'committing', steps);

  return {
    totalSourceRecords: totalRecords,
    plantsMatched,
    plantsUnmatched: matchResult.summary.noMatch,
    matchSummary: matchResult.summary,
    warrantsCreated: enhanceResult.warrantsCreated,
    warrantsSkipped: enhanceResult.warrantsSkipped,
    warrantsFlagged: enhanceResult.warrantsFlagged,
    plantsCovered: enhanceResult.plantsCovered,
    attributesCovered: enhanceResult.attributesCovered,
    conflictsDetected: classifyResult.summary.total,
    conflictSummary: classifyResult.summary,
    commitHash,
  };
}

// --- Main ---

async function main() {
  try {
    const raw = await readStdin();
    const input: BridgeInput = JSON.parse(raw);

    let result: unknown;
    switch (input.action) {
      case 'map':
        result = await handleMap(input);
        break;
      case 'match-and-preview':
        result = await handlePreview(input);
        break;
      case 'execute':
        result = await handleExecute(input);
        break;
      case 'full-analysis':
        result = await handleFullAnalysis(input);
        break;
      default:
        throw new Error(`Unknown action: ${(input as { action: string }).action}`);
    }

    process.stdout.write(JSON.stringify(result));
    process.exitCode = 0;
  } catch (err) {
    process.stderr.write(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }));
    process.exitCode = 1;
  } finally {
    await doltPool.end();
  }
}

main();
