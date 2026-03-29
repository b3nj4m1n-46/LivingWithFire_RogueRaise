/**
 * Seed Source Reliability — Populate initial reliability records for all known sources.
 *
 * Reads distinct source_id_code values from warrants, applies the auto-scoring
 * formula based on cached source metadata, and inserts into source_reliability.
 *
 * Usage: npx tsx src/scripts/seed-reliability.ts
 * Requires: DoltgreSQL running on port 5433 with lwf_staging database.
 */
import { doltPool } from '../tools/index.js';

// ── Scoring formula weights ──────────────────────────────────────────

const METHODOLOGY_SCORES: Record<string, number> = {
  meta_analysis: 1.0,
  experimental: 0.9,
  field_observation: 0.7,
  literature_review: 0.6,
  modeling: 0.5,
  expert_opinion: 0.4,
};

const SPECIFICITY_SCORES: Record<string, number> = {
  local: 1.0,
  regional: 0.8,
  national: 0.5,
  global: 0.3,
};

const CURRENCY_SCORES: Record<string, number> = {
  current: 1.0,
  recent: 0.7,
  dated: 0.4,
};

function computeAutoScore(row: {
  methodology_type: string | null;
  peer_reviewed: boolean;
  sample_size: string | null;
  geographic_specificity: string | null;
  temporal_currency: string | null;
}): number {
  const methScore = METHODOLOGY_SCORES[row.methodology_type ?? ''] ?? 0.5;
  const peerScore = row.peer_reviewed ? 1.0 : 0.3;

  let sampleScore = 0.5;
  if (row.sample_size && row.sample_size !== 'unknown') {
    const n = parseInt(row.sample_size.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) {
      sampleScore = n > 1000 ? 1.0 : n >= 100 ? 0.7 : 0.4;
    }
  }

  const geoScore = SPECIFICITY_SCORES[row.geographic_specificity ?? ''] ?? 0.5;
  const tempScore = CURRENCY_SCORES[row.temporal_currency ?? ''] ?? 0.5;

  // Weighted formula from task spec
  const score =
    0.30 * methScore +
    0.20 * peerScore +
    0.15 * sampleScore +
    0.20 * geoScore +
    0.15 * tempScore;

  return Math.round(score * 100) / 100;
}

// ── Heuristic metadata from cached warrant fields ────────────────────

function inferMethodology(methodology: string | null): string | null {
  if (!methodology) return null;
  const lower = methodology.toLowerCase();
  if (lower.includes('meta-analysis') || lower.includes('meta analysis')) return 'meta_analysis';
  if (lower.includes('experiment') || lower.includes('lab') || lower.includes('test')) return 'experimental';
  if (lower.includes('field') || lower.includes('observation') || lower.includes('survey')) return 'field_observation';
  if (lower.includes('literature') || lower.includes('review') || lower.includes('compilation')) return 'literature_review';
  if (lower.includes('model') || lower.includes('simulation')) return 'modeling';
  if (lower.includes('expert') || lower.includes('opinion') || lower.includes('guide')) return 'expert_opinion';
  return null;
}

function inferSpecificity(region: string | null): string | null {
  if (!region) return null;
  const lower = region.toLowerCase();
  if (lower.includes('national') || lower.includes('united states') || lower.includes('us') || lower.includes('usa')) return 'national';
  if (lower.includes('global') || lower.includes('worldwide') || lower.includes('international')) return 'global';
  // State-level or sub-state = local; multi-state = regional
  const states = ['oregon', 'california', 'washington', 'idaho', 'nevada', 'montana'];
  const stateHits = states.filter(s => lower.includes(s));
  if (stateHits.length === 1) return 'local';
  if (stateHits.length > 1 || lower.includes('pacific') || lower.includes('northwest') || lower.includes('western') || lower.includes('intermountain')) return 'regional';
  return 'regional'; // default for unrecognized region strings
}

function inferCurrency(year: string | null): string | null {
  if (!year) return null;
  const y = parseInt(year, 10);
  if (isNaN(y)) return null;
  const currentYear = new Date().getFullYear();
  const age = currentYear - y;
  if (age <= 5) return 'current';
  if (age <= 15) return 'recent';
  return 'dated';
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Seed Source Reliability ===\n');

  // Get distinct sources with their cached metadata from warrants
  const sources = await doltPool.query(
    `SELECT DISTINCT ON (source_id_code)
       source_id_code,
       source_methodology,
       source_region,
       source_year,
       source_reliability
     FROM warrants
     WHERE source_id_code IS NOT NULL
     ORDER BY source_id_code, created_at DESC`
  );

  console.log(`Found ${sources.rows.length} distinct sources in warrants table.`);

  // Ensure table exists
  await doltPool.query(`
    CREATE TABLE IF NOT EXISTS source_reliability (
      source_id_code        VARCHAR(20) PRIMARY KEY,
      methodology_type      VARCHAR(50),
      peer_reviewed         BOOLEAN DEFAULT false,
      sample_size           VARCHAR(20),
      geographic_scope      VARCHAR(100),
      geographic_specificity VARCHAR(20),
      temporal_currency     VARCHAR(20),
      publication_year      INTEGER,
      reliability_score     NUMERIC(3,2) DEFAULT 0.50,
      reliability_reasoning TEXT,
      auto_score            NUMERIC(3,2),
      updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by            VARCHAR(100) DEFAULT 'system'
    )
  `);

  let inserted = 0;
  let skipped = 0;

  for (const row of sources.rows) {
    const code = row.source_id_code as string;

    // Skip if already exists
    const existing = await doltPool.query(
      'SELECT 1 FROM source_reliability WHERE source_id_code = $1',
      [code]
    );
    if (existing.rows.length > 0) {
      skipped++;
      continue;
    }

    const methodologyType = inferMethodology(row.source_methodology as string | null);
    const geoScope = row.source_region as string | null;
    const geoSpecificity = inferSpecificity(geoScope);
    const yearStr = row.source_year as string | null;
    const pubYear = yearStr ? parseInt(yearStr, 10) : null;
    const currency = inferCurrency(yearStr);

    const autoScore = computeAutoScore({
      methodology_type: methodologyType,
      peer_reviewed: false, // conservative default
      sample_size: 'unknown',
      geographic_specificity: geoSpecificity,
      temporal_currency: currency,
    });

    await doltPool.query(
      `INSERT INTO source_reliability
         (source_id_code, methodology_type, peer_reviewed, sample_size,
          geographic_scope, geographic_specificity, temporal_currency,
          publication_year, reliability_score, auto_score, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, 'seed-script')`,
      [
        code,
        methodologyType,
        false,
        'unknown',
        geoScope,
        geoSpecificity,
        currency,
        isNaN(pubYear as number) ? null : pubYear,
        autoScore,
      ]
    );
    inserted++;
    console.log(`  ${code}: score=${autoScore} method=${methodologyType ?? '?'} geo=${geoSpecificity ?? '?'} currency=${currency ?? '?'}`);
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped (already exist): ${skipped}`);

  await doltPool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
