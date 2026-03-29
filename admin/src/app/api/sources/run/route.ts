import crypto from "node:crypto";
import { query } from "@/lib/dolt";
import { callFusionBridge } from "@/lib/fusion-bridge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { datasetFolder, sourceDataset, sourceId } = body;

    if (!datasetFolder || !sourceDataset || !sourceId) {
      return Response.json(
        { error: "datasetFolder, sourceDataset, and sourceId are required" },
        { status: 400 }
      );
    }

    const batchId = crypto.randomUUID();

    // Create batch record
    await query(
      `INSERT INTO analysis_batches
         (id, source_dataset, source_id_code, batch_type, status, dataset_folder)
       VALUES ($1, $2, $3, 'full_analysis', 'running', $4)`,
      [batchId, sourceDataset, sourceId, datasetFolder]
    );

    // Fire-and-forget: trigger full analysis pipeline
    callFusionBridge(
      "full-analysis",
      { sourceDataset, datasetFolder, batchId },
      1_800_000 // 30 min timeout for large datasets
    )
      .then(async () => {
        await query(
          `UPDATE analysis_batches SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [batchId]
        );
      })
      .catch(async (err) => {
        console.error(`Pipeline failed for batch ${batchId}:`, err);
        const errorNote = JSON.stringify({
          currentStep: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
        await query(
          `UPDATE analysis_batches SET status = 'failed', completed_at = CURRENT_TIMESTAMP, notes = $1 WHERE id = $2`,
          [errorNote, batchId]
        );
      });

    return Response.json({ batchId });
  } catch (error) {
    console.error("POST /api/sources/run error:", error);
    return Response.json(
      { error: "Failed to start pipeline" },
      { status: 500 }
    );
  }
}
