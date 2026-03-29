import { query } from "@/lib/dolt";
import type { DoltLogEntry } from "@/lib/queries/history";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    const entries = await query<DoltLogEntry>(
      "SELECT commit_hash, committer, date, message FROM dolt_log ORDER BY date DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    return Response.json(entries);
  } catch (error) {
    console.error("GET /api/dolt/log error:", error);
    return Response.json({ error: "Failed to fetch log" }, { status: 500 });
  }
}
