import {
  suggestPlants,
  lookupPlant,
} from "@/lib/queries/lookup";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Typeahead mode: ?suggest=Acer+mac
  const suggest = url.searchParams.get("suggest");
  if (suggest !== null) {
    const q = suggest.trim();
    if (q.length < 2) {
      return Response.json([]);
    }
    try {
      const suggestions = suggestPlants(q);
      return Response.json(suggestions);
    } catch (error) {
      console.error("GET /api/plants/lookup?suggest error:", error);
      return Response.json(
        { error: "Suggestion search failed" },
        { status: 500 }
      );
    }
  }

  // Full lookup mode: ?q=Acer+macrophyllum
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return Response.json(
      { error: "Query must be at least 3 characters" },
      { status: 400 }
    );
  }

  try {
    const result = await lookupPlant(q);
    return Response.json(result);
  } catch (error) {
    console.error("GET /api/plants/lookup?q error:", error);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
}
