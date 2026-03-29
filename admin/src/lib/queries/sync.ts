import { query } from "@/lib/dolt";
import { queryProd } from "@/lib/production";

// Stable UUID for the curation pipeline source in production
export const CURATION_SOURCE_ID = "00000000-0000-0000-0000-curated000001";
export const CURATION_SOURCE_NAME = "LWF Curation Pipeline";

export interface SyncableClaim {
  id: string;
  plant_id: string;
  attribute_id: string;
  plant_name: string;
  attribute_name: string;
  new_value: string;
  confidence: string;
  approved_at: string;
}

export interface StaleWarrant {
  source: string;
  value: string;
  created_at: string;
}

export interface SyncPreviewRow {
  id: string;
  plantId: string;
  attributeId: string;
  plantName: string;
  attributeName: string;
  oldValue: string | null;
  newValue: string;
  confidence: string;
  stale: boolean;
  staleWarrants: StaleWarrant[];
}

export async function fetchSyncableClaims(): Promise<SyncableClaim[]> {
  return query<SyncableClaim>(
    `SELECT c.id, c.plant_id, c.attribute_id,
            c.plant_name, c.attribute_name,
            COALESCE(c.edited_value, c.categorical_value, c.synthesized_text) AS new_value,
            c.confidence, c.approved_at
     FROM claims c
     WHERE c.status = 'approved'
       AND (c.pushed_to_production IS NULL OR c.pushed_to_production = false)
     ORDER BY c.approved_at ASC`
  );
}

/**
 * Fetch current production values for a set of plant+attribute pairs.
 * Returns a map of "plantId:attributeId" → current value string.
 */
export async function fetchProductionValues(
  pairs: { plantId: string; attributeId: string }[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (pairs.length === 0) return result;

  // Build a WHERE clause with OR conditions for each pair
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const { plantId, attributeId } of pairs) {
    conditions.push(`(plant_id = $${idx} AND attribute_id = $${idx + 1})`);
    params.push(plantId, attributeId);
    idx += 2;
  }

  const rows = await queryProd<{
    plant_id: string;
    attribute_id: string;
    value: string;
  }>(
    `SELECT plant_id, attribute_id, "value"
     FROM "values"
     WHERE ${conditions.join(" OR ")}`,
    params
  );

  for (const row of rows) {
    const key = `${row.plant_id}:${row.attribute_id}`;
    // If multiple values exist, join them (shows all current values)
    const existing = result.get(key);
    if (existing) {
      result.set(key, `${existing}, ${row.value}`);
    } else {
      result.set(key, row.value);
    }
  }

  return result;
}

/**
 * Check whether approved claims have newer warrants (staleness).
 * Returns a map of claimId → stale warrants added after approval.
 */
async function checkStaleness(
  claims: SyncableClaim[]
): Promise<Map<string, StaleWarrant[]>> {
  const result = new Map<string, StaleWarrant[]>();

  // Run staleness queries in parallel
  const checks = claims.map(async (c) => {
    if (!c.approved_at) return;
    const rows = await query<{
      source_id_code: string | null;
      value: string;
      created_at: string;
    }>(
      `SELECT w.source_id_code, w."value", w.created_at
       FROM warrants w
       WHERE w.plant_id = $1
         AND w.attribute_id = $2
         AND w.created_at > $3
         AND w.status != 'excluded'`,
      [c.plant_id, c.attribute_id, c.approved_at]
    );
    if (rows.length > 0) {
      result.set(
        c.id,
        rows.map((r) => ({
          source: r.source_id_code ?? "unknown",
          value: r.value,
          created_at: r.created_at,
        }))
      );
    }
  });

  await Promise.all(checks);
  return result;
}

/**
 * Build a full preview: syncable claims enriched with current production values
 * and staleness information.
 */
export async function fetchSyncPreview(): Promise<{
  claims: SyncPreviewRow[];
  totalChanges: number;
}> {
  const syncable = await fetchSyncableClaims();
  if (syncable.length === 0) return { claims: [], totalChanges: 0 };

  const pairs = syncable.map((c) => ({
    plantId: c.plant_id,
    attributeId: c.attribute_id,
  }));

  const [currentValues, stalenessMap] = await Promise.all([
    fetchProductionValues(pairs),
    checkStaleness(syncable),
  ]);

  const claims: SyncPreviewRow[] = syncable.map((c) => {
    const staleWarrants = stalenessMap.get(c.id) ?? [];
    return {
      id: c.id,
      plantId: c.plant_id,
      attributeId: c.attribute_id,
      plantName: c.plant_name,
      attributeName: c.attribute_name,
      oldValue: currentValues.get(`${c.plant_id}:${c.attribute_id}`) ?? null,
      newValue: c.new_value,
      confidence: c.confidence,
      stale: staleWarrants.length > 0,
      staleWarrants,
    };
  });

  return { claims, totalChanges: claims.length };
}

/**
 * Mark claims as pushed in the Dolt staging database.
 */
export async function markClaimsAsPushed(claimIds: string[]): Promise<void> {
  if (claimIds.length === 0) return;
  await query(
    `UPDATE claims
     SET status = 'pushed', pushed_to_production = true, pushed_at = NOW()
     WHERE id = ANY($1::varchar[])`,
    [claimIds]
  );
}

/**
 * Log a sync event in the analysis_batches table.
 */
export async function logSyncBatch(
  batchId: string,
  claimCount: number,
  commitHash: string | null
): Promise<void> {
  await query(
    `INSERT INTO analysis_batches
       (id, source_dataset, source_id_code, batch_type, status, claims_generated, notes, dolt_commit_hash)
     VALUES ($1, 'production', 'SYNC', 'production_sync', 'completed', $2, $3, $4)`,
    [
      batchId,
      claimCount,
      `Pushed ${claimCount} claim(s) to production`,
      commitHash,
    ]
  );
}
