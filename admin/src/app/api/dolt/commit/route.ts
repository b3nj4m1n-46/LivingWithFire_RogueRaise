import pool from "@/lib/dolt";

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Commit message required" },
        { status: 400 }
      );
    }

    // Check there are actual changes to commit
    const statusResult = await client.query(
      "SELECT COUNT(*) as changes FROM dolt_status"
    );
    if (Number(statusResult.rows[0].changes) === 0) {
      return Response.json(
        { error: "No uncommitted changes" },
        { status: 400 }
      );
    }

    await client.query("SELECT dolt_add('.')");
    const commitResult = await client.query(
      "SELECT dolt_commit('-m', $1)",
      [message]
    );

    const commitRow = commitResult.rows[0];
    const commitHash =
      typeof commitRow === "object"
        ? Object.values(commitRow as Record<string, unknown>)[0]
        : String(commitRow);

    return Response.json({ commitHash: String(commitHash) });
  } catch (error) {
    console.error("POST /api/dolt/commit error:", error);

    try {
      await client.query("SELECT dolt_checkout('.')");
    } catch {
      // Ignore cleanup errors
    }

    return Response.json(
      { error: "Failed to commit changes" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
