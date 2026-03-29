import { fetchUncommittedCount } from "@/lib/queries/history";

export async function GET() {
  try {
    const changes = await fetchUncommittedCount();
    return Response.json({ changes });
  } catch (error) {
    console.error("GET /api/dolt/status error:", error);
    return Response.json({ changes: 0 });
  }
}
