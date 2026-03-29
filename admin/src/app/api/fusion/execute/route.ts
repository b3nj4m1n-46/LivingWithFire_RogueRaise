import { callFusionBridge } from "@/lib/fusion-bridge";
import {
  fetchMappingBatch,
  updateMappingConfig,
  updateBatchStatus,
  type MappingConfig,
} from "@/lib/queries/fusion";

interface ExecuteResult {
  totalSourceRecords: number;
  plantsMatched: number;
  plantsUnmatched: number;
  warrantsCreated: number;
  warrantsSkipped: number;
  warrantsFlagged: number;
  plantsCovered: number;
  attributesCovered: number;
  conflictsDetected: number;
  conflictSummary: Record<string, unknown>;
  commitHash: string;
}

export async function POST(request: Request) {
  let batchId: string | undefined;
  try {
    const body = await request.json();
    batchId = body.batchId;
    const { mappings } = body;

    if (!batchId) {
      return Response.json({ error: "batchId is required" }, { status: 400 });
    }

    const batch = await fetchMappingBatch(batchId);
    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }

    // Save final mappings if provided
    if (mappings && batch.mapping_config) {
      const updated: MappingConfig = { ...batch.mapping_config, mappings };
      await updateMappingConfig(batchId, updated);
      batch.mapping_config = updated;
    }

    await updateBatchStatus(batchId, "executing");

    const result = await callFusionBridge<ExecuteResult>("execute", {
      sourceDataset: batch.source_dataset,
      datasetFolder: batch.dataset_folder,
      mappingConfig: batch.mapping_config,
      batchId,
    });

    await updateBatchStatus(batchId, "completed", {
      plantsMatched: result.plantsMatched,
      plantsUnmatched: result.plantsUnmatched,
      warrantsCreated: result.warrantsCreated,
      conflictsDetected: result.conflictsDetected,
      commitHash: result.commitHash,
    });

    return Response.json({
      warrantsCreated: result.warrantsCreated,
      conflictsDetected: result.conflictsDetected,
      commitHash: result.commitHash,
    });
  } catch (error) {
    console.error("POST /api/fusion/execute error:", error);

    if (batchId) {
      await updateBatchStatus(batchId, "failed").catch(() => {});
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Execution failed" },
      { status: 500 }
    );
  }
}
