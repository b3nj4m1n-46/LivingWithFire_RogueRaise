import { z } from 'zod';
import { distance } from 'fastest-levenshtein';
import { ai } from '../config.js';
import { doltPool } from './dolt.js';

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance(a, b) / maxLen;
}

export const fuzzyMatchPlant = ai.defineTool(
  {
    name: 'fuzzyMatchPlant',
    description:
      'Finds close matches for a plant name in the production database using Levenshtein distance. ' +
      'First tries exact genus match and compares species, then falls back to full-name comparison across all plants.',
    inputSchema: z.object({
      genus: z.string().describe('Plant genus, e.g. "Ceanothus"'),
      species: z.string().optional().describe('Plant species, e.g. "velutinus"'),
      limit: z.number().optional().describe('Max candidates to return (default 5)'),
    }),
    outputSchema: z.object({
      candidates: z.array(
        z.object({
          plantId: z.string(),
          genus: z.string(),
          species: z.string().nullable(),
          commonName: z.string().nullable(),
          similarity: z.number(),
          matchReason: z.string(),
        }),
      ),
    }),
  },
  async (input) => {
    const limit = input.limit ?? 5;
    const inputSpecies = (input.species ?? '').toLowerCase();
    const inputFull = `${input.genus} ${input.species ?? ''}`.trim().toLowerCase();

    type PlantRow = { id: string; genus: string; species: string | null; common_name: string | null };

    // Phase 1: Try exact genus match, rank by species similarity
    const genusResult = await doltPool.query(
      `SELECT id, genus, species, common_name FROM plants WHERE LOWER(genus) = LOWER($1)`,
      [input.genus],
    );

    if (genusResult.rows.length > 0 && inputSpecies) {
      const scored = (genusResult.rows as PlantRow[]).map((row) => {
        const rowSpecies = (row.species ?? '').toLowerCase();
        const sim = similarity(inputSpecies, rowSpecies);
        return {
          plantId: row.id,
          genus: row.genus,
          species: row.species,
          commonName: row.common_name,
          similarity: sim,
          matchReason: `genus exact, species ${sim === 1 ? 'exact' : `${Math.round(sim * 100)}% similar`}`,
        };
      });
      scored.sort((a, b) => b.similarity - a.similarity);
      return { candidates: scored.slice(0, limit) };
    }

    // Phase 2: Full-name comparison across all plants (only 1,361 records)
    const allResult = await doltPool.query(
      `SELECT id, genus, species, common_name FROM plants ORDER BY genus, species`,
    );

    const scored = (allResult.rows as PlantRow[]).map((row) => {
      const rowFull = `${row.genus} ${row.species ?? ''}`.trim().toLowerCase();
      const sim = similarity(inputFull, rowFull);
      return {
        plantId: row.id,
        genus: row.genus,
        species: row.species,
        commonName: row.common_name,
        similarity: sim,
        matchReason: `full name ${sim === 1 ? 'exact' : `${Math.round(sim * 100)}% similar`}`,
      };
    });
    scored.sort((a, b) => b.similarity - a.similarity);
    return { candidates: scored.slice(0, limit) };
  },
);
