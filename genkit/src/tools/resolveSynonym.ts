import { z } from 'zod';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import { ai } from '../config.js';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');

const DB_PATHS = {
  USDA_PLANTS: resolve(REPO_ROOT, 'database-sources/taxonomy/USDA_PLANTS/plants.db'),
  POWO_WCVP: resolve(REPO_ROOT, 'database-sources/taxonomy/POWO_WCVP/plants.db'),
  WorldFloraOnline: resolve(REPO_ROOT, 'database-sources/taxonomy/WorldFloraOnline/plants.db'),
} as const;

type BackboneSource = keyof typeof DB_PATHS;

// Lazy-loaded singleton connections
const _dbs: Partial<Record<BackboneSource, Database.Database>> = {};

function isLfsPointer(filePath: string): boolean {
  try {
    const buf = readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    return buf.slice(0, 30).startsWith('version https://git-lfs');
  } catch {
    return true; // treat missing/unreadable as unavailable
  }
}

function getDb(source: BackboneSource): Database.Database | null {
  if (_dbs[source] !== undefined) return _dbs[source]!;

  const dbPath = DB_PATHS[source];
  if (!existsSync(dbPath) || isLfsPointer(dbPath)) {
    return null;
  }

  const db = new Database(dbPath, { readonly: true });
  _dbs[source] = db;
  return db;
}

function parseGenusSpecies(scientificNameFull: string): {
  genus: string;
  species: string;
  authority: string;
} {
  const parts = scientificNameFull.trim().split(/\s+/);
  const genus = parts[0] || '';
  const species = parts.length > 1 ? parts[1] : '';
  // Everything after genus+species is authority
  const authority = parts.slice(2).join(' ');
  return { genus, species, authority };
}

const outputSchema = z.object({
  acceptedName: z
    .object({
      genus: z.string(),
      species: z.string(),
      authority: z.string(),
    })
    .nullable(),
  synonymOf: z.string().nullable(),
  source: z.enum(['USDA_PLANTS', 'POWO_WCVP', 'WorldFloraOnline']).nullable(),
  confidence: z.number(),
});

export const resolveSynonym = ai.defineTool(
  {
    name: 'resolveSynonym',
    description:
      'Checks taxonomy backbone databases (USDA_PLANTS, POWO_WCVP, WorldFloraOnline) ' +
      'to determine if a scientific name is accepted or a synonym. ' +
      'Returns the accepted name and which backbone matched. ' +
      'USDA_PLANTS has full synonym resolution; POWO/WFO validate accepted names when available (requires git lfs pull).',
    inputSchema: z.object({
      scientificName: z
        .string()
        .describe('Scientific name to resolve, e.g. "Berberis aquifolium" or "Mahonia aquifolium"'),
    }),
    outputSchema,
  },
  async (input) => {
    const nameToSearch = input.scientificName.trim();

    // Strategy 1: USDA_PLANTS — the only backbone with synonym records
    const usdaResult = resolveViaUsda(nameToSearch);
    if (usdaResult) return usdaResult;

    // Strategy 2: POWO_WCVP — validate as accepted name (when LFS is pulled)
    const powoResult = resolveViaPowo(nameToSearch);
    if (powoResult) return powoResult;

    // Strategy 3: WorldFloraOnline — cross-validate (when LFS is pulled)
    const wfoResult = resolveViaWfo(nameToSearch);
    if (wfoResult) return wfoResult;

    return { acceptedName: null, synonymOf: null, source: null, confidence: 0 };
  },
);

function resolveViaUsda(name: string): z.infer<typeof outputSchema> | null {
  const db = getDb('USDA_PLANTS');
  if (!db) return null;

  // Try exact prefix match (USDA stores author citations after binomial)
  const row = db
    .prepare(
      `SELECT symbol, synonym_symbol, scientific_name_full, common_name, is_synonym
       FROM plants
       WHERE LOWER(scientific_name_full) LIKE LOWER(?) || '%'
       ORDER BY is_synonym ASC
       LIMIT 1`,
    )
    .get(name) as
    | {
        symbol: string;
        synonym_symbol: string | null;
        scientific_name_full: string;
        common_name: string | null;
        is_synonym: number;
      }
    | undefined;

  if (!row) return null;

  if (!row.is_synonym) {
    // Name is already accepted in USDA
    const parsed = parseGenusSpecies(row.scientific_name_full);
    return {
      acceptedName: parsed,
      synonymOf: null,
      source: 'USDA_PLANTS',
      confidence: 1.0,
    };
  }

  // It's a synonym — follow symbol to find accepted name
  const accepted = db
    .prepare(
      `SELECT scientific_name_full, common_name
       FROM plants
       WHERE symbol = ? AND is_synonym = 0
       LIMIT 1`,
    )
    .get(row.symbol) as
    | { scientific_name_full: string; common_name: string | null }
    | undefined;

  if (!accepted) return null;

  const parsed = parseGenusSpecies(accepted.scientific_name_full);
  return {
    acceptedName: parsed,
    synonymOf: accepted.scientific_name_full,
    source: 'USDA_PLANTS',
    confidence: 0.95,
  };
}

function resolveViaPowo(name: string): z.infer<typeof outputSchema> | null {
  const db = getDb('POWO_WCVP');
  if (!db) return null;

  // POWO is pre-filtered to accepted names only
  const row = db
    .prepare(
      `SELECT scientific_name, genus, species, authors
       FROM plants
       WHERE LOWER(scientific_name) = LOWER(?)
       LIMIT 1`,
    )
    .get(name) as
    | { scientific_name: string; genus: string; species: string; authors: string }
    | undefined;

  if (!row) return null;

  return {
    acceptedName: {
      genus: row.genus,
      species: row.species,
      authority: row.authors || '',
    },
    synonymOf: null,
    source: 'POWO_WCVP',
    confidence: 1.0,
  };
}

function resolveViaWfo(name: string): z.infer<typeof outputSchema> | null {
  const db = getDb('WorldFloraOnline');
  if (!db) return null;

  // WFO is pre-filtered to accepted names only
  const row = db
    .prepare(
      `SELECT scientific_name, family, genus, specific_epithet
       FROM plants
       WHERE LOWER(scientific_name) = LOWER(?)
       LIMIT 1`,
    )
    .get(name) as
    | { scientific_name: string; family: string; genus: string; specific_epithet: string }
    | undefined;

  if (!row) return null;

  return {
    acceptedName: {
      genus: row.genus,
      species: row.specific_epithet || '',
      authority: '',
    },
    synonymOf: null,
    source: 'WorldFloraOnline',
    confidence: 1.0,
  };
}
