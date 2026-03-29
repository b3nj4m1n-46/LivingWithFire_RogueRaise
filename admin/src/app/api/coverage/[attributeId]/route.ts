import { getPlantsGap } from "@/lib/queries/coverage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attributeId: string }> }
) {
  try {
    const { attributeId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
    );
    const offset = Math.max(
      0,
      parseInt(searchParams.get("offset") ?? "0", 10)
    );

    const data = await getPlantsGap(attributeId, limit, offset);
    return Response.json(data);
  } catch (error) {
    console.error("GET /api/coverage/[attributeId] error:", error);
    return Response.json(
      { error: "Failed to fetch gap plants" },
      { status: 500 }
    );
  }
}
