import crypto from "node:crypto";
import { query, queryOne } from "@/lib/dolt";
import { callFusionBridge } from "@/lib/fusion-bridge";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      plantIds,
      attributeFilter,
      limit = 50,
    } = body as {
      plantIds?: string[];
      attributeFilter?: string;
      limit?: number;
    };

    // Mark stale "running" batches as failed (crashed process never updated status)
    await query(
      `UPDATE analysis_batches
       SET status = 'failed', completed_at = CURRENT_TIMESTAMP,
           notes = 'Marked as failed: process did not complete within 20 minutes'
       WHERE batch_type = 'bulk_synthesize' AND status = 'running'
         AND started_at < CURRENT_TIMESTAMP - INTERVAL '20 MINUTES'`
    );

    // Guard: check if already running
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM analysis_batches
       WHERE batch_type = 'bulk_synthesize' AND status = 'running'
       LIMIT 1`
    );
    if (existing) {
      return Response.json(
        { error: "A synthesis operation is already running", batch_id: existing.id },
        { status: 409 }
      );
    }

    const batchId = crypto.randomUUID();

    await query(
      `INSERT INTO analysis_batches
         (id, source_dataset, source_id_code, batch_type, status)
       VALUES ($1, 'production', 'AGENT_OPS', 'bulk_synthesize', 'running')`,
      [batchId]
    );

    // Fire-and-forget: run bridge in background
    callFusionBridge(
      "bulk-synthesize",
      { batchId, plantIds, attributeFilter, limit },
      900_000
    )
      .then(async (result) => {
        const r = result as { claimsGenerated?: number };
        await query(
          `UPDATE analysis_batches
           SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
               claims_generated = $1
           WHERE id = $2`,
          [r.claimsGenerated ?? 0, batchId]
        );
      })
      .catch(async (err) => {
        console.error("bulk-synthesize bridge error:", err);
        try {
          await query(
            `UPDATE analysis_batches
             SET status = 'failed', completed_at = CURRENT_TIMESTAMP,
                 notes = $1
             WHERE id = $2`,
            [err instanceof Error ? err.message : String(err), batchId]
          );
        } catch {
          // ignore
        }
      });

    return Response.json({ batch_id: batchId }, { status: 202 });
  } catch (error) {
    console.error("POST /api/agents/synthesize error:", error);
    return Response.json({ error: "Failed to start synthesis" }, { status: 500 });
  }
}
