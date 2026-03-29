import pool from "@/lib/dolt";

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const { commitHash } = await request.json();
    if (!commitHash || typeof commitHash !== "string") {
      return Response.json(
        { error: "Commit hash required" },
        { status: 400 }
      );
    }

    // Only allow reverting the 5 most recent commits
    const recentResult = await client.query(
      "SELECT commit_hash FROM dolt_log ORDER BY date DESC LIMIT 5"
    );
    const recentHashes = recentResult.rows.map(
      (r: Record<string, unknown>) => r.commit_hash
    );
    if (!recentHashes.includes(commitHash)) {
      return Response.json(
        { error: "Can only revert one of the 5 most recent commits" },
        { status: 400 }
      );
    }

    // Revert the commit (creates working changes that reverse it)
    await client.query("SELECT dolt_revert($1)", [commitHash]);

    // Commit the revert
    await client.query("SELECT dolt_add('.')");
    const commitResult = await client.query(
      "SELECT dolt_commit('-m', $1)",
      [`Revert commit ${commitHash.slice(0, 8)}`]
    );

    const commitRow = commitResult.rows[0];
    const newHash =
      typeof commitRow === "object"
        ? Object.values(commitRow as Record<string, unknown>)[0]
        : String(commitRow);

    return Response.json({ commitHash: String(newHash) });
  } catch (error) {
    console.error("POST /api/dolt/revert error:", error);

    try {
      await client.query("SELECT dolt_checkout('.')");
    } catch {
      // Ignore cleanup errors
    }

    return Response.json(
      { error: "Failed to revert commit" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
