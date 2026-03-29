import { fetchSyncPreview } from "@/lib/queries/sync";

export async function GET() {
  try {
    const preview = await fetchSyncPreview();
    return Response.json(preview);
  } catch (error) {
    console.error("GET /api/sync/preview error:", error);
    return Response.json(
      { error: "Failed to fetch sync preview" },
      { status: 500 }
    );
  }
}
