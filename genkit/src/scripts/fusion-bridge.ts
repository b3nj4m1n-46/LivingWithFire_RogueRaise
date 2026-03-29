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

type BridgeInput = MapInput | PreviewInput | ExecuteInput;

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
