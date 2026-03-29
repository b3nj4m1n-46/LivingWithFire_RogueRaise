import {
  fetchAllReliability,
  updateReliability,
} from "@/lib/queries/reliability";

export async function GET() {
  try {
    const rows = await fetchAllReliability();
    return Response.json(rows);
  } catch (error) {
    console.error("GET /api/sources/reliability error:", error);
    return Response.json(
      { error: "Failed to fetch reliability data" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { source_id_code, ...updates } = body;

    if (!source_id_code) {
      return Response.json(
        { error: "Missing source_id_code" },
        { status: 400 }
      );
    }

    const row = await updateReliability(source_id_code, updates);
    if (!row) {
      return Response.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    return Response.json(row);
  } catch (error) {
    console.error("PATCH /api/sources/reliability error:", error);
    return Response.json(
      { error: "Failed to update reliability" },
      { status: 500 }
    );
  }
}
