import {
  fetchAllReliability,
  updateAutoScore,
  batchUpdateAutoScores,
} from "@/lib/queries/reliability";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sourceIds: string[] | undefined = body.sourceIds;

    if (sourceIds && sourceIds.length > 0) {
      // Score specific sources
      const results = [];
      for (const id of sourceIds) {
        const row = await updateAutoScore(id);
        if (row) results.push(row);
      }
      return Response.json({ updated: results.length, results });
    }

    // Score all
    const updated = await batchUpdateAutoScores();
    const all = await fetchAllReliability();
    return Response.json({ updated, results: all });
  } catch (error) {
    console.error("POST /api/sources/reliability/auto-score error:", error);
    return Response.json(
      { error: "Failed to compute auto-scores" },
      { status: 500 }
    );
  }
}
