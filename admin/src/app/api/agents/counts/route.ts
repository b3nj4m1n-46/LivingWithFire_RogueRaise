import { query, queryOne } from "@/lib/dolt";

interface AuditSummary {
  batchId: string;
  completedAt: string;
  warrantsCreated: number;
  conflictsDetected: number;
  notes: string | null;
}

export async function GET() {
  try {
    const [pendingResult, unsynthResult, lastAuditRow] = await Promise.all([
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM conflicts WHERE status = 'pending'`
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM (
          SELECT w.plant_id, w.attribute_id
          FROM warrants w
          LEFT JOIN claims c ON c.plant_id = w.plant_id AND c.attribute_id = w.attribute_id
          WHERE c.id IS NULL
            AND w.status != 'rejected'
          GROUP BY w.plant_id, w.attribute_id
          HAVING COUNT(*) >= 2
        ) sub`
      ),
      queryOne<{
        id: string;
        completed_at: string;
        warrants_created: number;
        conflicts_detected: number;
        notes: string | null;
      }>(
        `SELECT id, completed_at, warrants_created, conflicts_detected, notes
         FROM analysis_batches
         WHERE batch_type = 'internal_audit' AND status = 'completed'
         ORDER BY completed_at DESC
         LIMIT 1`
      ),
    ]);

    let lastAudit: AuditSummary | null = null;
    if (lastAuditRow) {
      lastAudit = {
        batchId: lastAuditRow.id,
        completedAt: lastAuditRow.completed_at,
        warrantsCreated: lastAuditRow.warrants_created ?? 0,
        conflictsDetected: lastAuditRow.conflicts_detected ?? 0,
        notes: lastAuditRow.notes,
      };
    }

    return Response.json({
      pendingConflicts: Number(pendingResult?.count ?? 0),
      unsynthesizedPairs: Number(unsynthResult?.count ?? 0),
      lastAudit,
    });
  } catch (error) {
    console.error("GET /api/agents/counts error:", error);
    return Response.json({ error: "Failed to fetch agent counts" }, { status: 500 });
  }
}
