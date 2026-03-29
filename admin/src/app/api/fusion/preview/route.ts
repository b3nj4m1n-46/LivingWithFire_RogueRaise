import { callFusionBridge } from "@/lib/fusion-bridge";
import {
  fetchMappingBatch,
  updateMappingConfig,
  type MappingConfig,
} from "@/lib/queries/fusion";

interface PreviewResult {
  totalSourceRecords: number;
  matchSummary: Record<string, number>;
  warrantsEstimated: number;
  warrantsSkipped: number;
  warrantsFlagged: number;
  plantsCovered: number;
  attributesCovered: number;
  errors: Array<{ row: number; error: string }>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { batchId, mappings } = body;

    if (!batchId) {
      return Response.json({ error: "batchId is required" }, { status: 400 });
    }

    const batch = await fetchMappingBatch(batchId);
    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }

    // Save edited mappings if provided
    if (mappings && batch.mapping_config) {
      const updated: MappingConfig = { ...batch.mapping_config, mappings };
      await updateMappingConfig(batchId, updated);
      batch.mapping_config = updated;
    }

    const result = await callFusionBridge<PreviewResult>("match-and-preview", {
      sourceDataset: batch.source_dataset,
      datasetFolder: batch.dataset_folder,
      mappingConfig: batch.mapping_config,
      batchId,
    });

    return Response.json(result);
  } catch (error) {
    console.error("POST /api/fusion/preview error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Preview failed" },
      { status: 500 }
    );
  }
}
