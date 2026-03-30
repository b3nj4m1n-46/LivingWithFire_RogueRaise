import crypto from "node:crypto";
import { query, queryOne } from "@/lib/dolt";
import { callFusionBridge } from "@/lib/fusion-bridge";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      mode = "internal",
      plantIds,
      attributeFilter,
      runSpecialists = false,
    } = body as {
      mode?: "internal" | "cross_source";
      plantIds?: string[];
      attributeFilter?: string;
      runSpecialists?: boolean;
    };

    // Mark stale "running" batches as failed (crashed process never updated status)
    await query(
      `UPDATE analysis_batches
       SET status = 'failed', completed_at = CURRENT_TIMESTAMP,
           notes = 'Marked as failed: process did not complete within 20 minutes'
       WHERE batch_type = 'classify_existing' AND status = 'running'
         AND started_at < CURRENT_TIMESTAMP - INTERVAL '20 MINUTES'`
    );

    // Guard: check if already running
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM analysis_batches
       WHERE batch_type = 'classify_existing' AND status = 'running'
       LIMIT 1`
    );
    if (existing) {
      return Response.json(
        { error: "A classification operation is already running", batch_id: existing.id },
        { status: 409 }
      );
    }

    const batchId = crypto.randomUUID();

    await query(
      `INSERT INTO analysis_batches
         (id, source_dataset, source_id_code, batch_type, status)
       VALUES ($1, 'production', 'AGENT_OPS', 'classify_existing', 'running')`,
      [batchId]
    );

    // Fire-and-forget: run bridge in background
    callFusionBridge(
      "classify-existing",
      { batchId, mode, plantIds, attributeFilter, runSpecialists },
      600_000
    )
      .then(async (result) => {
        const r = result as { conflictsDetected?: number };
        await query(
          `UPDATE analysis_batches
           SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
               conflicts_detected = $1
           WHERE id = $2`,
          [r.conflictsDetected ?? 0, batchId]
        );
      })
      .catch(async (err) => {
        console.error("classify-existing bridge error:", err);
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
    console.error("POST /api/agents/classify error:", error);
    return Response.json({ error: "Failed to start classification" }, { status: 500 });
  }
}
