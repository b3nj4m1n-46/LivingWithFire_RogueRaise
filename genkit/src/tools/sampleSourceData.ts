import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ai } from '../config.js';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');

/**
 * Minimal RFC 4180 CSV parser. Handles quoted fields with commas,
 * newlines, and escaped double-quotes. No external dependency needed.
 */
function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip UTF-8 BOM
  const text = content.replace(/^\uFEFF/, '');

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuote) {
      if (ch === '"') {
        // Escaped quote ("") or end of quoted field
        if (text[i + 1] === '"') {
          field += '"';
          i++; // skip next quote
        } else {
          inQuote = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
      } else if (ch === '\n') {
        row.push(field.trim());
        field = '';
        if (row.length > 0 && row.some((f) => f !== '')) {
          rows.push(row);
        }
        row = [];
      } else if (ch === '\r') {
        // skip carriage return, newline will follow
      } else {
        field += ch;
      }
    }
  }

  // Flush last field/row
  if (field || row.length > 0) {
    row.push(field.trim());
    if (row.some((f) => f !== '')) {
      rows.push(row);
    }
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0];
  const dataRows = rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = r[i] ?? '';
    }
    return obj;
  });

  return { headers, rows: dataRows };
}

export const sampleSourceData = ai.defineTool(
  {
    name: 'sampleSourceData',
    description:
      'Reads a source CSV file and returns headers, sample rows, total row count, ' +
      'and per-column unique values (up to 20 each). Use this to understand the actual ' +
      'data distribution before mapping columns to production attributes.',
    inputSchema: z.object({
      csvPath: z
        .string()
        .describe('Relative path from repo root, e.g. "database-sources/fire/FirePerformancePlants/plants.csv"'),
      sampleSize: z.number().optional().describe('Number of sample rows to return (default 10)'),
    }),
    outputSchema: z.object({
      headers: z.array(z.string()),
      sampleRows: z.array(z.record(z.string(), z.string())),
      totalRows: z.number(),
      uniqueValues: z.record(z.string(), z.array(z.string())),
    }),
  },
  async (input) => {
    const fullPath = resolve(REPO_ROOT, input.csvPath);
    const content = await readFile(fullPath, 'utf-8');
    const parsed = parseCSV(content);

    const sampleSize = input.sampleSize ?? 10;
    const sampleRows = parsed.rows.slice(0, sampleSize);

    // Collect unique values per column (up to 20 each)
    const uniqueValues: Record<string, string[]> = {};
    for (const header of parsed.headers) {
      const seen = new Set<string>();
      for (const row of parsed.rows) {
        const val = row[header];
        if (val !== undefined && val !== '') {
          seen.add(val);
          if (seen.size >= 20) break;
        }
      }
      uniqueValues[header] = [...seen];
    }

    return {
      headers: parsed.headers,
      sampleRows,
      totalRows: parsed.rows.length,
      uniqueValues,
    };
  },
);
