import { query } from "@/lib/dolt";

const AGENT_BATCH_TYPES = ["internal_audit", "classify_existing", "bulk_synthesize"];

interface BatchRow {
  id: string;
  batch_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  warrants_created: number | null;
  conflicts_detected: number | null;
  claims_generated: number | null;
  dolt_commit_hash: string | null;
  notes: string | null;
}

export async function GET() {
  try {
    const running = await query<BatchRow>(
      `SELECT id, batch_type, status, started_at, completed_at,
              warrants_created, conflicts_detected, claims_generated,
              dolt_commit_hash, notes
       FROM analysis_batches
       WHERE status = 'running'
         AND batch_type IN ($1, $2, $3)
       ORDER BY started_at DESC`,
      AGENT_BATCH_TYPES
    );

    const recent = await query<BatchRow>(
      `SELECT id, batch_type, status, started_at, completed_at,
              warrants_created, conflicts_detected, claims_generated,
              dolt_commit_hash, notes
       FROM analysis_batches
       WHERE status IN ('completed', 'failed')
         AND batch_type IN ($1, $2, $3)
       ORDER BY completed_at DESC
       LIMIT 20`,
      AGENT_BATCH_TYPES
    );

    return Response.json({ running, recent });
  } catch (error) {
    console.error("GET /api/agents/status error:", error);
    return Response.json({ error: "Failed to fetch agent status" }, { status: 500 });
  }
}
