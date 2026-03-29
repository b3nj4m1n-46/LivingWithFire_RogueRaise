import {
  fetchMatrixData,
  type MatrixFilters,
} from "@/lib/queries/conflict-matrix";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: MatrixFilters = {
      status: searchParams.get("status") || undefined,
      severity: searchParams.get("severity") || undefined,
      conflictType: searchParams.get("conflictType") || undefined,
    };

    const data = await fetchMatrixData(filters);
    return Response.json(data);
  } catch (error) {
    console.error("GET /api/matrix error:", error);
    return Response.json(
      { error: "Failed to fetch matrix data" },
      { status: 500 }
    );
  }
}
