import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { PDFParse } from 'pdf-parse';
import { ai } from '../config.js';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');
const KB_DIR = resolve(REPO_ROOT, 'knowledge-base');

export const readDocumentPages = ai.defineTool(
  {
    name: 'readDocumentPages',
    description:
      'Reads actual text content from a knowledge-base PDF for a specific page range. ' +
      'Use after searchDocumentIndex/navigateDocumentTree to read the original source material ' +
      'when the section summary is insufficient. Returns extracted text for the requested pages.',
    inputSchema: z.object({
      documentFile: z
        .string()
        .describe(
          'PDF filename from the knowledge-base, e.g. "Bethke-UCCE_Literature-Review_2016.pdf"',
        ),
      startPage: z
        .number()
        .int()
        .min(1)
        .describe('First page to read (1-indexed)'),
      endPage: z
        .number()
        .int()
        .min(1)
        .describe(
          'Last page to read (1-indexed, inclusive). Max 10 pages per call.',
        ),
    }),
    outputSchema: z.object({
      documentFile: z.string(),
      startPage: z.number(),
      endPage: z.number(),
      totalPages: z.number(),
      text: z.string(),
      truncated: z.boolean(),
    }),
  },
  async (input) => {
    // Security: prevent path traversal — only allow bare filenames
    const safe = basename(input.documentFile);
    if (safe !== input.documentFile || input.documentFile.includes('..')) {
      return {
        documentFile: input.documentFile,
        startPage: input.startPage,
        endPage: input.endPage,
        totalPages: 0,
        text: 'Error: invalid filename. Provide a bare PDF filename with no path separators.',
        truncated: false,
      };
    }

    const maxPages = 10;
    const effectiveEnd = Math.min(
      input.endPage,
      input.startPage + maxPages - 1,
    );

    const pdfPath = resolve(KB_DIR, input.documentFile);

    try {
      const dataBuffer = await readFile(pdfPath);
      const pdf = new PDFParse({ data: new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength) });
      const result = await pdf.getText({
        first: input.startPage,
        last: effectiveEnd,
        pageJoiner: '\n\n--- Page Break ---\n',
      });

      const totalPages = result.total;
      let text = result.text.trim();

      const maxChars = 30_000;
      const truncated = text.length > maxChars;
      if (truncated) {
        text =
          text.slice(0, maxChars) + '\n\n[...truncated at 30,000 characters]';
      }

      await pdf.destroy();

      return {
        documentFile: input.documentFile,
        startPage: input.startPage,
        endPage: effectiveEnd,
        totalPages,
        text,
        truncated,
      };
    } catch (err) {
      return {
        documentFile: input.documentFile,
        startPage: input.startPage,
        endPage: effectiveEnd,
        totalPages: 0,
        text: `Error reading PDF: ${err instanceof Error ? err.message : String(err)}`,
        truncated: false,
      };
    }
  },
);
