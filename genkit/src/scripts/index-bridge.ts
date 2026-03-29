/**
 * Index Bridge — JSON stdin/stdout interface for document indexing.
 *
 * Reads a JSON command from stdin, executes the requested action, and
 * writes the JSON result to stdout. Used by the admin portal to trigger
 * PDF indexing without cross-package imports.
 *
 * Actions:
 *   index-pdf        — Index a single PDF into a hierarchical JSON structure
 *   reindex-all      — Batch-index all unindexed PDFs
 *   update-manifest  — Regenerate manifest.json from existing index files
 *
 * Usage: echo '{"action":"index-pdf","pdfPath":"knowledge-base/SomeDoc.pdf"}' | npx tsx src/scripts/index-bridge.ts
 */
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const SCRIPTS_DIR = resolve(REPO_ROOT, 'scripts');
const INDEX_DIR = resolve(REPO_ROOT, 'knowledge-base', 'indexes');

// --- Read stdin ---

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// --- Actions ---

interface IndexPdfInput {
  action: 'index-pdf';
  pdfPath: string;
  outputDir?: string;
}

interface ReindexAllInput {
  action: 'reindex-all';
  pdfDir?: string;
  outputDir?: string;
  parallelism?: number;
}

interface UpdateManifestInput {
  action: 'update-manifest';
  outputDir?: string;
}

type BridgeInput = IndexPdfInput | ReindexAllInput | UpdateManifestInput;

function runPython(args: string[], timeoutMs = 600_000): Promise<string> {
  return new Promise((res, rej) => {
    const child = execFile(
      'python',
      args,
      {
        cwd: REPO_ROOT,
        timeout: timeoutMs,
        env: { ...process.env },
        maxBuffer: 10 * 1024 * 1024,
        shell: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          return rej(new Error(stderr || error.message));
        }
        res(stdout);
      }
    );
  });
}

function runBash(script: string, args: string[], timeoutMs = 1_800_000): Promise<string> {
  return new Promise((res, rej) => {
    const child = execFile(
      'bash',
      [script, ...args],
      {
        cwd: REPO_ROOT,
        timeout: timeoutMs,
        env: { ...process.env },
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          return rej(new Error(stderr || error.message));
        }
        res(stdout);
      }
    );
  });
}

async function handleIndexPdf(input: IndexPdfInput) {
  const pdfPath = resolve(REPO_ROOT, input.pdfPath);
  const args = [resolve(SCRIPTS_DIR, 'index_pdf.py'), '--pdf', pdfPath];
  if (input.outputDir) {
    args.push('--output', resolve(REPO_ROOT, input.outputDir));
  }
  const stdout = await runPython(args);
  // index_pdf.py prints JSON summary to stdout
  return JSON.parse(stdout.trim().split('\n').pop()!);
}

async function handleReindexAll(input: ReindexAllInput) {
  const pdfDir = input.pdfDir || 'knowledge-base';
  const outputDir = input.outputDir || 'knowledge-base/indexes';
  const parallelism = String(input.parallelism || 2);
  const script = resolve(SCRIPTS_DIR, 'index_all_pdfs.sh');
  const stdout = await runBash(script, [
    resolve(REPO_ROOT, pdfDir),
    resolve(REPO_ROOT, outputDir),
    parallelism,
  ]);
  return { output: stdout };
}

async function handleUpdateManifest(input: UpdateManifestInput) {
  const outputDir = input.outputDir
    ? resolve(REPO_ROOT, input.outputDir)
    : INDEX_DIR;

  const files = await readdir(outputDir);
  const indexFiles = files.filter(f => f.endsWith('_structure.json')).sort();

  const indexes: Array<{
    file: string;
    doc_name: string;
    top_level_sections: number;
    size_bytes: number;
  }> = [];

  for (const file of indexFiles) {
    try {
      const filePath = resolve(outputDir, file);
      const data = JSON.parse(await readFile(filePath, 'utf-8'));
      const stats = await stat(filePath);
      indexes.push({
        file,
        doc_name: data.doc_name || '',
        top_level_sections: Array.isArray(data.structure) ? data.structure.length : 0,
        size_bytes: stats.size,
      });
    } catch {
      // Skip invalid files
    }
  }

  const manifest = { total: indexes.length, indexes };
  const manifestPath = resolve(outputDir, 'manifest.json');
  const { writeFile } = await import('node:fs/promises');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return { total: indexes.length, manifestPath };
}

// --- Main ---

async function main() {
  let input: BridgeInput;
  try {
    const raw = await readStdin();
    input = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(JSON.stringify({ error: 'Invalid JSON on stdin' }));
    process.exit(1);
  }

  try {
    let result: unknown;
    switch (input.action) {
      case 'index-pdf':
        result = await handleIndexPdf(input);
        break;
      case 'reindex-all':
        result = await handleReindexAll(input);
        break;
      case 'update-manifest':
        result = await handleUpdateManifest(input);
        break;
      default:
        throw new Error(`Unknown action: ${(input as any).action}`);
    }
    process.stdout.write(JSON.stringify(result));
  } catch (e: any) {
    process.stderr.write(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
}

main();
