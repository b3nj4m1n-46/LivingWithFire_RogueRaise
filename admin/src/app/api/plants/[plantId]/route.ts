import { fetchPlantDetail } from "@/lib/queries/plants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ plantId: string }> }
) {
  try {
    const { plantId } = await params;
    const data = await fetchPlantDetail(plantId);

    if (!data) {
      return Response.json({ error: "Plant not found" }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("GET /api/plants/[plantId] error:", error);
    return Response.json(
      { error: "Failed to fetch plant detail" },
      { status: 500 }
    );
  }
}
