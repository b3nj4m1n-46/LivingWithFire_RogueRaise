import { fetchBatchProgress } from "@/lib/queries/sources";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const progress = await fetchBatchProgress(batchId);

    if (!progress) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }

    return Response.json(progress);
  } catch (error) {
    console.error("GET /api/sources/[batchId]/status error:", error);
    return Response.json(
      { error: "Failed to fetch batch status" },
      { status: 500 }
    );
  }
}
