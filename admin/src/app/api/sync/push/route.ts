import crypto from "node:crypto";
import doltPool from "@/lib/dolt";
import neonPool from "@/lib/production";
import {
  fetchSyncableClaims,
  markClaimsAsPushed,
  logSyncBatch,
  CURATION_SOURCE_ID,
  CURATION_SOURCE_NAME,
} from "@/lib/queries/sync";

export async function POST(request: Request) {
  // Accept optional claim ID filter from request body
  const body = await request.json().catch(() => ({}));
  const requestedIds: string[] | undefined = Array.isArray(body?.claimIds)
    ? body.claimIds
    : undefined;

  const allClaims = await fetchSyncableClaims();
  const claims = requestedIds?.length
    ? allClaims.filter((c) => requestedIds.includes(c.id))
    : allClaims;

  if (claims.length === 0) {
    return Response.json({ pushed: 0, commitHash: null });
  }

  const neonClient = await neonPool.connect();
  const doltClient = await doltPool.connect();
  const batchId = crypto.randomUUID();

  try {
    // --- Production writes (Neon) ---
    await neonClient.query("BEGIN");

    // Ensure curation pipeline source exists
    await neonClient.query(
      `INSERT INTO sources (id, name, notes)
       VALUES ($1, $2, 'Values pushed from staging curation system')
       ON CONFLICT (id) DO NOTHING`,
      [CURATION_SOURCE_ID, CURATION_SOURCE_NAME]
    );

    for (const claim of claims) {
      // Try UPDATE first: update the first existing row for this plant+attribute
      const updated = await neonClient.query(
        `UPDATE "values"
         SET "value" = $1, source_value = $1, source_id = $2
         WHERE id = (
           SELECT id FROM "values"
           WHERE plant_id = $3 AND attribute_id = $4
           LIMIT 1
         )`,
        [claim.new_value, CURATION_SOURCE_ID, claim.plant_id, claim.attribute_id]
      );

      // If no existing row, INSERT a new one
      if (updated.rowCount === 0) {
        const valueId = crypto.randomUUID();
        await neonClient.query(
          `INSERT INTO "values" (id, plant_id, attribute_id, "value", source_value, source_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            valueId,
            claim.plant_id,
            claim.attribute_id,
            claim.new_value,
            claim.new_value,
            CURATION_SOURCE_ID,
          ]
        );
      }
    }

    await neonClient.query("COMMIT");

    // --- Staging updates (Dolt) ---
    const claimIds = claims.map((c) => c.id);
    await markClaimsAsPushed(claimIds);

    // Dolt version control: stage and commit
    await doltClient.query(`SELECT dolt_add('.')`);
    const commitResult = await doltClient.query(
      `SELECT dolt_commit('-m', $1)`,
      [`sync: pushed ${claims.length} claim(s) to production`]
    );
    const commitRow = commitResult.rows[0];
    const commitHash =
      typeof commitRow === "object"
        ? String(Object.values(commitRow as Record<string, unknown>)[0])
        : String(commitRow);

    // Log the sync event
    await logSyncBatch(batchId, claims.length, commitHash);

    await doltClient.query(`SELECT dolt_add('.')`);
    await doltClient.query(`SELECT dolt_commit('-m', $1)`, [
      `sync: logged batch ${batchId}`,
    ]);

    return Response.json({ pushed: claims.length, commitHash });
  } catch (error) {
    console.error("POST /api/sync/push error:", error);

    // Rollback production
    try {
      await neonClient.query("ROLLBACK");
    } catch {
      // Ignore cleanup errors
    }

    // Reset Dolt working state
    try {
      await doltClient.query(`SELECT dolt_checkout('.')`);
    } catch {
      // Ignore cleanup errors
    }

    return Response.json({ error: "Failed to push to production" }, { status: 500 });
  } finally {
    neonClient.release();
    doltClient.release();
  }
}
