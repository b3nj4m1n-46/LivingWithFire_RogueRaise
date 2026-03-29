import { callFusionBridge } from "@/lib/fusion-bridge";
import {
  createMappingBatch,
  type MappingConfig,
} from "@/lib/queries/fusion";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { datasetFolder, sourceDataset } = body;

    if (!datasetFolder || !sourceDataset) {
      return Response.json(
        { error: "datasetFolder and sourceDataset are required" },
        { status: 400 }
      );
    }

    const mappingResult = await callFusionBridge<MappingConfig>("map", {
      sourceDataset,
      datasetFolder,
    });

    const batchId = await createMappingBatch(
      sourceDataset,
      mappingResult.sourceIdCode,
      datasetFolder,
      mappingResult
    );

    return Response.json({
      batchId,
      mappings: mappingResult.mappings,
      summary: mappingResult.summary,
    });
  } catch (error) {
    console.error("POST /api/fusion/map error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to map schema" },
      { status: 500 }
    );
  }
}
