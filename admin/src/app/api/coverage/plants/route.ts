import { getPlantCompleteness } from "@/lib/queries/coverage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || undefined;
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
    );
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const offset = (page - 1) * limit;

    const data = await getPlantCompleteness(sort, limit, offset);
    return Response.json({ ...data, page, limit });
  } catch (error) {
    console.error("GET /api/coverage/plants error:", error);
    return Response.json(
      { error: "Failed to fetch plant completeness" },
      { status: 500 }
    );
  }
}
