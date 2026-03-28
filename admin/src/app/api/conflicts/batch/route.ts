import {
  batchUpdateConflictStatus,
  isValidConflictStatus,
} from "@/lib/queries/conflicts";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return Response.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!body.status || !isValidConflictStatus(body.status)) {
      return Response.json(
        {
          error:
            "Invalid status. Must be one of: pending, annotated, resolved, dismissed",
        },
        { status: 400 }
      );
    }

    const updated = await batchUpdateConflictStatus(body.ids, body.status);
    return Response.json({ updated });
  } catch (error) {
    console.error("POST /api/conflicts/batch error:", error);
    return Response.json(
      { error: "Failed to batch update conflicts" },
      { status: 500 }
    );
  }
}
