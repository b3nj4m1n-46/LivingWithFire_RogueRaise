import crypto from "node:crypto";
import { query } from "@/lib/dolt";
import { runInternalAudit } from "@/lib/queries/audit";

export async function POST() {
  const batchId = crypto.randomUUID();

  try {
    // Create batch record
    await query(
      `INSERT INTO analysis_batches
         (id, source_dataset, source_id_code, batch_type, status)
       VALUES ($1, 'production', 'INTERNAL_AUDIT', 'internal_audit', 'running')`,
      [batchId]
    );

    const results = await runInternalAudit(batchId);

    // Mark batch completed
    await query(
      `UPDATE analysis_batches
       SET status = 'completed',
           completed_at = CURRENT_TIMESTAMP,
           warrants_created = $1,
           conflicts_detected = $2,
           notes = $3
       WHERE id = $4`,
      [
        results.warrants_created,
        results.conflicts_created,
        JSON.stringify(results),
        batchId,
      ]
    );

    return Response.json({ batch_id: batchId, ...results });
  } catch (error) {
    console.error("POST /api/audit/internal error:", error);
    // Try to mark batch as failed
    try {
      await query(
        `UPDATE analysis_batches SET status = 'failed', completed_at = CURRENT_TIMESTAMP, notes = $1 WHERE id = $2`,
        [error instanceof Error ? error.message : String(error), batchId]
      );
    } catch {
      // ignore — batch may not have been created
    }
    return Response.json(
      { error: "Internal audit failed" },
      { status: 500 }
    );
  }
}
