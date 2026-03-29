import {
  fetchMappingBatch,
  updateMappingConfig,
  type MappingConfig,
} from "@/lib/queries/fusion";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const body = await request.json();
    const { mappings } = body;

    if (!mappings || !Array.isArray(mappings)) {
      return Response.json(
        { error: "mappings array is required" },
        { status: 400 }
      );
    }

    const batch = await fetchMappingBatch(batchId);
    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }
    if (!batch.mapping_config) {
      return Response.json(
        { error: "Batch has no mapping config" },
        { status: 400 }
      );
    }

    const updated: MappingConfig = { ...batch.mapping_config, mappings };
    await updateMappingConfig(batchId, updated);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/fusion/[batchId] error:", error);
    return Response.json(
      { error: "Failed to save mapping edits" },
      { status: 500 }
    );
  }
}
