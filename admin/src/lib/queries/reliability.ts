import { query, queryOne } from "@/lib/dolt";

// ── Interfaces ──────────────────────────────────────────────────────────

export interface ReliabilityRow {
  source_id_code: string;
  methodology_type: string | null;
  peer_reviewed: boolean;
  sample_size: string | null;
  geographic_scope: string | null;
  geographic_specificity: string | null;
  temporal_currency: string | null;
  publication_year: number | null;
  reliability_score: number;
  reliability_reasoning: string | null;
  auto_score: number | null;
  updated_at: string;
  updated_by: string;
}

export interface ReliabilityUpdate {
  methodology_type?: string | null;
  peer_reviewed?: boolean;
  sample_size?: string | null;
  geographic_scope?: string | null;
  geographic_specificity?: string | null;
  temporal_currency?: string | null;
  publication_year?: number | null;
  reliability_score?: number;
  reliability_reasoning?: string | null;
}

// ── Scoring formula ─────────────────────────────────────────────────────

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

export function computeAutoScore(row: {
  methodology_type: string | null;
  peer_reviewed: boolean;
  sample_size: string | null;
  geographic_specificity: string | null;
  temporal_currency: string | null;
}): number {
  const methScore = METHODOLOGY_SCORES[row.methodology_type ?? ""] ?? 0.5;
  const peerScore = row.peer_reviewed ? 1.0 : 0.3;

  let sampleScore = 0.5;
  if (row.sample_size && row.sample_size !== "unknown") {
    const n = parseInt(row.sample_size.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(n)) {
      sampleScore = n > 1000 ? 1.0 : n >= 100 ? 0.7 : 0.4;
    }
  }

  const geoScore = SPECIFICITY_SCORES[row.geographic_specificity ?? ""] ?? 0.5;
  const tempScore = CURRENCY_SCORES[row.temporal_currency ?? ""] ?? 0.5;

  const score =
    0.3 * methScore +
    0.2 * peerScore +
    0.15 * sampleScore +
    0.2 * geoScore +
    0.15 * tempScore;

  return Math.round(score * 100) / 100;
}

// ── Query Functions ─────────────────────────────────────────────────────

export async function fetchAllReliability(): Promise<ReliabilityRow[]> {
  return query<ReliabilityRow>(
    `SELECT source_id_code, methodology_type, peer_reviewed, sample_size,
            geographic_scope, geographic_specificity, temporal_currency,
            publication_year, reliability_score, reliability_reasoning,
            auto_score, updated_at, updated_by
     FROM source_reliability
     ORDER BY source_id_code`
  );
}

export async function fetchReliability(
  sourceIdCode: string
): Promise<ReliabilityRow | null> {
  return queryOne<ReliabilityRow>(
    `SELECT source_id_code, methodology_type, peer_reviewed, sample_size,
            geographic_scope, geographic_specificity, temporal_currency,
            publication_year, reliability_score, reliability_reasoning,
            auto_score, updated_at, updated_by
     FROM source_reliability
     WHERE source_id_code = $1`,
    [sourceIdCode]
  );
}

export async function updateReliability(
  sourceIdCode: string,
  updates: ReliabilityUpdate
): Promise<ReliabilityRow | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (updates.methodology_type !== undefined) {
    fields.push(`methodology_type = $${idx++}`);
    params.push(updates.methodology_type);
  }
  if (updates.peer_reviewed !== undefined) {
    fields.push(`peer_reviewed = $${idx++}`);
    params.push(updates.peer_reviewed);
  }
  if (updates.sample_size !== undefined) {
    fields.push(`sample_size = $${idx++}`);
    params.push(updates.sample_size);
  }
  if (updates.geographic_scope !== undefined) {
    fields.push(`geographic_scope = $${idx++}`);
    params.push(updates.geographic_scope);
  }
  if (updates.geographic_specificity !== undefined) {
    fields.push(`geographic_specificity = $${idx++}`);
    params.push(updates.geographic_specificity);
  }
  if (updates.temporal_currency !== undefined) {
    fields.push(`temporal_currency = $${idx++}`);
    params.push(updates.temporal_currency);
  }
  if (updates.publication_year !== undefined) {
    fields.push(`publication_year = $${idx++}`);
    params.push(updates.publication_year);
  }
  if (updates.reliability_score !== undefined) {
    fields.push(`reliability_score = $${idx++}`);
    params.push(updates.reliability_score);
  }
  if (updates.reliability_reasoning !== undefined) {
    fields.push(`reliability_reasoning = $${idx++}`);
    params.push(updates.reliability_reasoning);
  }

  if (fields.length === 0) return fetchReliability(sourceIdCode);

  fields.push(`updated_at = NOW()`);
  fields.push(`updated_by = 'admin'`);

  params.push(sourceIdCode);

  const rows = await query<ReliabilityRow>(
    `UPDATE source_reliability
     SET ${fields.join(", ")}
     WHERE source_id_code = $${idx}
     RETURNING source_id_code, methodology_type, peer_reviewed, sample_size,
               geographic_scope, geographic_specificity, temporal_currency,
               publication_year, reliability_score, reliability_reasoning,
               auto_score, updated_at, updated_by`,
    params
  );

  return rows[0] ?? null;
}

export async function updateAutoScore(
  sourceIdCode: string
): Promise<ReliabilityRow | null> {
  const row = await fetchReliability(sourceIdCode);
  if (!row) return null;

  const score = computeAutoScore({
    methodology_type: row.methodology_type,
    peer_reviewed: row.peer_reviewed,
    sample_size: row.sample_size,
    geographic_specificity: row.geographic_specificity,
    temporal_currency: row.temporal_currency,
  });

  const rows = await query<ReliabilityRow>(
    `UPDATE source_reliability
     SET auto_score = $1, updated_at = NOW()
     WHERE source_id_code = $2
     RETURNING source_id_code, methodology_type, peer_reviewed, sample_size,
               geographic_scope, geographic_specificity, temporal_currency,
               publication_year, reliability_score, reliability_reasoning,
               auto_score, updated_at, updated_by`,
    [score, sourceIdCode]
  );

  return rows[0] ?? null;
}

export async function batchUpdateAutoScores(): Promise<number> {
  const all = await fetchAllReliability();
  let updated = 0;

  for (const row of all) {
    const score = computeAutoScore({
      methodology_type: row.methodology_type,
      peer_reviewed: row.peer_reviewed,
      sample_size: row.sample_size,
      geographic_specificity: row.geographic_specificity,
      temporal_currency: row.temporal_currency,
    });

    await query(
      `UPDATE source_reliability
       SET auto_score = $1, updated_at = NOW()
       WHERE source_id_code = $2`,
      [score, row.source_id_code]
    );
    updated++;
  }

  return updated;
}

/** Fetch reliability scores for a list of source_id_codes (for synthesis prompt) */
export async function fetchReliabilityForSources(
  sourceIdCodes: string[]
): Promise<ReliabilityRow[]> {
  if (sourceIdCodes.length === 0) return [];

  const placeholders = sourceIdCodes.map((_, i) => `$${i + 1}`).join(", ");
  return query<ReliabilityRow>(
    `SELECT source_id_code, methodology_type, peer_reviewed, sample_size,
            geographic_scope, geographic_specificity, temporal_currency,
            publication_year, reliability_score, reliability_reasoning,
            auto_score, updated_at, updated_by
     FROM source_reliability
     WHERE source_id_code IN (${placeholders})`,
    sourceIdCodes
  );
}
