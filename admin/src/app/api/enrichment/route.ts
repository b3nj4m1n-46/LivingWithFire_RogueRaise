import { getEnrichmentSummary } from "@/lib/queries/enrichment";

export async function GET() {
  try {
    const data = await getEnrichmentSummary();
    return Response.json(data);
  } catch (error) {
    console.error("GET /api/enrichment error:", error);
    return Response.json(
      { error: "Failed to fetch enrichment summary" },
      { status: 500 }
    );
  }
}
