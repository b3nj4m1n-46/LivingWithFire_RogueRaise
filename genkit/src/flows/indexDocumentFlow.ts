/**
 * indexDocumentFlow — Genkit flow that indexes a PDF into a hierarchical
 * JSON structure by calling the Python PageIndex pipeline via subprocess.
 *
 * This flow wraps the Python indexer (scripts/index_pdf.py) using the same
 * bridge pattern as fusion-bridge.ts, keeping the heavy PDF processing in
 * Python while exposing it as a typed Genkit flow.
 */
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ai } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const indexDocumentInput = z.object({
  pdfPath: z.string().describe('Path to the PDF file (absolute or relative to repo root)'),
  outputDir: z.string().optional().describe('Output directory for index JSON (default: knowledge-base/indexes/)'),
});

const indexDocumentOutput = z.object({
  docName: z.string(),
  topLevelSections: z.number(),
  nodeCount: z.number(),
  indexFile: z.string(),
  manifestTotal: z.number(),
});

export const indexDocumentFlow = ai.defineFlow(
  {
    name: 'indexDocumentFlow',
    inputSchema: indexDocumentInput,
    outputSchema: indexDocumentOutput,
  },
  async (input) => {
    const pdfPath = resolve(REPO_ROOT, input.pdfPath);
    const args = [resolve(REPO_ROOT, 'scripts', 'index_pdf.py'), '--pdf', pdfPath];
    if (input.outputDir) {
      args.push('--output', resolve(REPO_ROOT, input.outputDir));
    }

    const result = await new Promise<string>((res, rej) => {
      execFile(
        'python',
        args,
        {
          cwd: REPO_ROOT,
          timeout: 600_000, // 10 min per PDF
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

    // index_pdf.py prints JSON summary as the last line of stdout
    const lastLine = result.trim().split('\n').pop()!;
    return JSON.parse(lastLine);
  }
);
