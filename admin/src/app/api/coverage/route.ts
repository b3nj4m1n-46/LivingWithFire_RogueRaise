import { getAttributeCoverage } from "@/lib/queries/coverage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || undefined;
    const category = searchParams.get("category") || undefined;

    const data = await getAttributeCoverage(sort, category);
    return Response.json(data);
  } catch (error) {
    console.error("GET /api/coverage error:", error);
    return Response.json(
      { error: "Failed to fetch coverage data" },
      { status: 500 }
    );
  }
}
