import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { DATABASE_SOURCES_ROOT } from "@/lib/source-registry";
import {
  getSourcesForAttribute,
  type SourceAttributeLink,
} from "@/lib/source-attribute-map";
import { getAttributeCoverage, getPlantsGap } from "@/lib/queries/coverage";

// --- Types ---

type SqliteRow = Record<string, unknown>;

export interface EnrichmentCandidate {
  plantId: string;
  genus: string;
  species: string;
  commonName: string | null;
  sourceId: string;
  sourceDisplayName: string;
  sourceColumn: string;
  sourceValue: string;
}

export interface SourceBreakdown {
  sourceId: string;
  displayName: string;
  candidateCount: number;
}

export interface EnrichmentSummaryRow {
  attributeId: string;
  attributeName: string;
  category: string;
  gapCount: number;
  enrichableCount: number;
  sourceBreakdown: SourceBreakdown[];
}

// --- SQLite Helpers (duplicated from lookup.ts to match existing style) ---

function querySqlite(
  dbPath: string,
  sql: string,
  params: unknown[]
): SqliteRow[] {
  if (!fs.existsSync(dbPath)) return [];
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return db.prepare(sql).all(...params) as SqliteRow[];
  } finally {
    db.close();
  }
}

function str(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

// --- Enrichment Helpers ---

/**
 * Load all non-null values for a given column from a source SQLite DB.
 * Returns a Map of lowercase scientific name → value string.
 */
function loadSourceValues(
  link: SourceAttributeLink
): Map<string, string> {
  const result = new Map<string, string>();
  if (!fs.existsSync(link.dbPath)) return result;

  const rows = querySqlite(
    link.dbPath,
    `SELECT "${link.nameColumn}", "${link.sourceColumn}"
     FROM "${link.tableName}"
     WHERE "${link.sourceColumn}" IS NOT NULL
       AND "${link.sourceColumn}" != ''`,
    []
  );

  for (const row of rows) {
    const name = str(row[link.nameColumn]);
    const value = str(row[link.sourceColumn]);
    if (name && value) {
      result.set(name.toLowerCase().trim(), value);
    }
  }

  return result;
}

// --- Enrichment Candidates for a Single Attribute ---

export async function findEnrichmentCandidates(
  attributeId: string,
  limit = 50,
  offset = 0
): Promise<{ candidates: EnrichmentCandidate[]; total: number }> {
  // Get all plants missing this attribute (no limit — we need all for matching)
  const { plants: gapPlants } = await getPlantsGap(attributeId);
  const sources = getSourcesForAttribute(attributeId);

  if (gapPlants.length === 0 || sources.length === 0) {
    return { candidates: [], total: 0 };
  }

  const allCandidates: EnrichmentCandidate[] = [];

  for (const link of sources) {
    const sourceValues = loadSourceValues(link);
    if (sourceValues.size === 0) continue;

    for (const plant of gapPlants) {
      const sciName = `${plant.genus} ${plant.species}`.toLowerCase().trim();
      const value = sourceValues.get(sciName);
      if (value) {
        allCandidates.push({
          plantId: plant.plantId,
          genus: plant.genus,
          species: plant.species,
          commonName: plant.commonName,
          sourceId: link.sourceId,
          sourceDisplayName: link.displayName,
          sourceColumn: link.sourceColumn,
          sourceValue: value,
        });
      }
    }
  }

  return {
    candidates: allCandidates.slice(offset, offset + limit),
    total: allCandidates.length,
  };
}

// --- Enrichment Summary Across All Attributes ---

export async function getEnrichmentSummary(): Promise<EnrichmentSummaryRow[]> {
  const coverage = await getAttributeCoverage();
  const results: EnrichmentSummaryRow[] = [];

  for (const attr of coverage) {
    if (attr.gapCount === 0) continue;

    const sources = getSourcesForAttribute(attr.attributeId);
    if (sources.length === 0) continue;

    // Get gap plants for this attribute
    const { plants: gapPlants } = await getPlantsGap(attr.attributeId);
    const gapNameSet = new Set(
      gapPlants.map((p) => `${p.genus} ${p.species}`.toLowerCase().trim())
    );

    const enrichablePlants = new Set<string>();
    const sourceBreakdown: SourceBreakdown[] = [];

    for (const link of sources) {
      const sourceValues = loadSourceValues(link);
      let count = 0;

      for (const name of gapNameSet) {
        if (sourceValues.has(name)) {
          enrichablePlants.add(name);
          count++;
        }
      }

      if (count > 0) {
        sourceBreakdown.push({
          sourceId: link.sourceId,
          displayName: link.displayName,
          candidateCount: count,
        });
      }
    }

    if (enrichablePlants.size > 0) {
      results.push({
        attributeId: attr.attributeId,
        attributeName: attr.attributeName,
        category: attr.category,
        gapCount: attr.gapCount,
        enrichableCount: enrichablePlants.size,
        sourceBreakdown,
      });
    }
  }

  // Sort by enrichable count descending (most impactful first)
  results.sort((a, b) => b.enrichableCount - a.enrichableCount);

  return results;
}
