import {
  fetchConflictDetail,
  fetchConflictWarrants,
  updateConflictStatus,
  isValidConflictStatus,
} from "@/lib/queries/conflicts";
import { fetchReliabilityForSources } from "@/lib/queries/reliability";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conflict = await fetchConflictDetail(id);
    if (!conflict) {
      return Response.json({ error: "Conflict not found" }, { status: 404 });
    }

    const warrants = await fetchConflictWarrants(
      conflict.warrant_a_id,
      conflict.warrant_b_id
    );

    // Fetch reliability scores for the sources involved
    const sourceCodes = warrants
      .map((w) => w.source_id_code)
      .filter((code): code is string => code !== null);
    let reliability: Record<string, { score: number; methodology: string | null; peer_reviewed: boolean; scope: string | null }> = {};
    try {
      const rows = await fetchReliabilityForSources([...new Set(sourceCodes)]);
      for (const r of rows) {
        reliability[r.source_id_code] = {
          score: Number(r.reliability_score),
          methodology: r.methodology_type,
          peer_reviewed: r.peer_reviewed,
          scope: r.geographic_specificity,
        };
      }
    } catch {
      // Table may not exist yet
    }

    return Response.json({ conflict, warrants, reliability });
  } catch (error) {
    console.error("GET /api/conflicts/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch conflict" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status || !isValidConflictStatus(body.status)) {
      return Response.json(
        {
          error:
            "Invalid status. Must be one of: pending, annotated, resolved, dismissed",
        },
        { status: 400 }
      );
    }

    const result = await updateConflictStatus(id, body.status);
    if (!result) {
      return Response.json({ error: "Conflict not found" }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("PATCH /api/conflicts/[id] error:", error);
    return Response.json(
      { error: "Failed to update conflict" },
      { status: 500 }
    );
  }
}
