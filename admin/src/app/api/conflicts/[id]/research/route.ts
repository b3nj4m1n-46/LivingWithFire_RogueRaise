import { fetchConflictDetail, fetchConflictWarrants } from "@/lib/queries/conflicts";
import { getDatasetContexts, searchKnowledgeBase } from "@/lib/research";

export async function POST(
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

    const [datasetContexts, knowledgeBaseResults] = await Promise.all([
      getDatasetContexts(warrants),
      searchKnowledgeBase(conflict.plant_name, conflict.attribute_name),
    ]);

    return Response.json({ datasetContexts, knowledgeBaseResults });
  } catch (error) {
    console.error("POST /api/conflicts/[id]/research error:", error);
    return Response.json(
      { error: "Failed to fetch research context" },
      { status: 500 }
    );
  }
}
