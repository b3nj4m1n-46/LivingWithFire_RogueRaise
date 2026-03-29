/**
 * Sync to Production — Push approved claims from Dolt to Neon PostgreSQL.
 *
 * Usage: npx tsx src/scripts/sync-to-production.ts [--dry-run] [--since <commitHash>]
 *
 * --dry-run   Preview changes without writing to production
 * --since     Only sync claims approved after this Dolt commit (default: all pending)
 *
 * Requires:
 *   - DoltgreSQL running on port 5433 with lwf_staging database
 *   - NEON_DATABASE_URL environment variable set
 */
import crypto from "node:crypto";
import { Pool } from "pg";
import { doltPool } from "../tools/index.js";

// Stable source ID for curation pipeline in production
const CURATION_SOURCE_ID = "00000000-0000-0000-0000-curated000001";
const CURATION_SOURCE_NAME = "LWF Curation Pipeline";

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sinceIndex = args.indexOf("--since");
const sinceHash = sinceIndex >= 0 ? args[sinceIndex + 1] : null;

if (sinceIndex >= 0 && !sinceHash) {
  console.error("Error: --since requires a commit hash argument");
  process.exit(1);
}

// Production pool
const neonUrl = process.env.NEON_DATABASE_URL;
if (!neonUrl && !dryRun) {
  console.error("Error: NEON_DATABASE_URL environment variable is required (or use --dry-run)");
  process.exit(1);
}

const prodPool = neonUrl
  ? new Pool({ connectionString: neonUrl, ssl: true })
  : null;

async function main() {
  const doltClient = await doltPool.connect();
  const batchId = crypto.randomUUID();

  console.log("\n=== Sync to Production ===\n");
  console.log(`Mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE"}`);
  if (sinceHash) console.log(`Since commit: ${sinceHash}`);
  console.log(`Batch ID: ${batchId}\n`);

  try {
    // 1. Find approved claims not yet pushed
    let sinceCondition = "";
    const params: unknown[] = [];

    if (sinceHash) {
      sinceCondition = " AND c.dolt_commit_hash > $1";
      params.push(sinceHash);
    }

    const { rows: claims } = await doltClient.query(
      `SELECT c.id, c.plant_id, c.attribute_id,
              c.plant_name, c.attribute_name,
              COALESCE(c.edited_value, c.categorical_value, c.synthesized_text) AS new_value,
              c.confidence, c.approved_at
       FROM claims c
       WHERE c.status = 'approved'
         AND (c.pushed_to_production IS NULL OR c.pushed_to_production = false)
         ${sinceCondition}
       ORDER BY c.approved_at ASC`,
      params
    );

    if (claims.length === 0) {
      console.log("No approved claims pending sync. Nothing to do.");
      return;
    }

    console.log(`Found ${claims.length} approved claim(s) to sync.\n`);

    // 2. Fetch current production values for comparison
    const pairs = claims.map((c: { plant_id: string; attribute_id: string }) => ({
      plantId: c.plant_id,
      attributeId: c.attribute_id,
    }));

    const currentValues = new Map<string, string>();
    if (prodPool) {
      const conditions: string[] = [];
      const prodParams: unknown[] = [];
      let idx = 1;
      for (const { plantId, attributeId } of pairs) {
        conditions.push(`(plant_id = $${idx} AND attribute_id = $${idx + 1})`);
        prodParams.push(plantId, attributeId);
        idx += 2;
      }

      const { rows: prodRows } = await prodPool.query(
        `SELECT plant_id, attribute_id, "value"
         FROM "values"
         WHERE ${conditions.join(" OR ")}`,
        prodParams
      );

      for (const row of prodRows) {
        const key = `${row.plant_id}:${row.attribute_id}`;
        const existing = currentValues.get(key);
        currentValues.set(key, existing ? `${existing}, ${row.value}` : row.value);
      }
    }

    // 3. Print preview table
    console.log("┌─────────────────────────────────┬──────────────────────┬────────────────┬────────────────┬────────────┐");
    console.log("│ Plant                           │ Attribute            │ Current Value  │ New Value      │ Confidence │");
    console.log("├─────────────────────────────────┼──────────────────────┼────────────────┼────────────────┼────────────┤");

    for (const claim of claims) {
      const key = `${claim.plant_id}:${claim.attribute_id}`;
      const oldVal = currentValues.get(key) ?? "(none)";
      const plant = (claim.plant_name || "Unknown").slice(0, 31).padEnd(31);
      const attr = (claim.attribute_name || "Unknown").slice(0, 20).padEnd(20);
      const old = oldVal.slice(0, 14).padEnd(14);
      const newVal = (claim.new_value || "").slice(0, 14).padEnd(14);
      const conf = (claim.confidence || "").slice(0, 10).padEnd(10);
      console.log(`│ ${plant} │ ${attr} │ ${old} │ ${newVal} │ ${conf} │`);
    }

    console.log("└─────────────────────────────────┴──────────────────────┴────────────────┴────────────────┴────────────┘");
    console.log(`\nTotal changes: ${claims.length}`);

    if (dryRun) {
      console.log("\n[DRY RUN] No changes written. Re-run without --dry-run to push.\n");
      return;
    }

    // 4. Execute production writes
    if (!prodPool) throw new Error("Production pool not available");
    const prodClient = await prodPool.connect();

    try {
      await prodClient.query("BEGIN");

      // Ensure curation source exists
      await prodClient.query(
        `INSERT INTO sources (id, name, notes)
         VALUES ($1, $2, 'Values pushed from staging curation system')
         ON CONFLICT (id) DO NOTHING`,
        [CURATION_SOURCE_ID, CURATION_SOURCE_NAME]
      );

      let updated = 0;
      let inserted = 0;

      for (const claim of claims) {
        const result = await prodClient.query(
          `UPDATE "values"
           SET "value" = $1, source_value = $1, source_id = $2
           WHERE id = (
             SELECT id FROM "values"
             WHERE plant_id = $3 AND attribute_id = $4
             LIMIT 1
           )`,
          [claim.new_value, CURATION_SOURCE_ID, claim.plant_id, claim.attribute_id]
        );

        if (result.rowCount === 0) {
          const valueId = crypto.randomUUID();
          await prodClient.query(
            `INSERT INTO "values" (id, plant_id, attribute_id, "value", source_value, source_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [valueId, claim.plant_id, claim.attribute_id, claim.new_value, claim.new_value, CURATION_SOURCE_ID]
          );
          inserted++;
        } else {
          updated++;
        }
      }

      await prodClient.query("COMMIT");
      console.log(`\nProduction writes committed: ${updated} updated, ${inserted} inserted.`);

      prodClient.release();
    } catch (err) {
      await prodClient.query("ROLLBACK");
      prodClient.release();
      throw err;
    }

    // 5. Mark claims as pushed in Dolt
    const claimIds = claims.map((c: { id: string }) => c.id);
    await doltClient.query(
      `UPDATE claims
       SET status = 'pushed', pushed_to_production = true, pushed_at = NOW()
       WHERE id = ANY($1::varchar[])`,
      [claimIds]
    );

    // 6. Log sync batch
    await doltClient.query(
      `INSERT INTO analysis_batches
         (id, source_dataset, source_id_code, batch_type, status, claims_generated, notes)
       VALUES ($1, 'production', 'SYNC', 'production_sync', 'completed', $2, $3)`,
      [batchId, claims.length, `Pushed ${claims.length} claim(s) to production`]
    );

    // 7. Dolt commit
    console.log("Creating Dolt commit...");
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

    console.log(`Dolt commit: ${commitHash}`);

    // 8. Verification
    console.log("\n=== Verification ===\n");

    const pushedCount = await doltClient.query(
      `SELECT COUNT(*) AS cnt FROM claims WHERE status = 'pushed'`
    );
    console.log(`Total pushed claims: ${pushedCount.rows[0].cnt}`);

    const pendingCount = await doltClient.query(
      `SELECT COUNT(*) AS cnt FROM claims WHERE status = 'approved' AND (pushed_to_production IS NULL OR pushed_to_production = false)`
    );
    console.log(`Remaining pending claims: ${pendingCount.rows[0].cnt}`);

    const batchRecord = await doltClient.query(
      `SELECT status, claims_generated, notes FROM analysis_batches WHERE id = $1`,
      [batchId]
    );
    console.log("Sync batch:", batchRecord.rows[0]);

    console.log("\n=== Sync Complete ===\n");
  } catch (err) {
    console.error("\nSync FAILED.");
    console.error(err);

    // Reset Dolt working state
    try {
      await doltClient.query(`SELECT dolt_checkout('.')`);
    } catch {
      // Ignore cleanup errors
    }

    process.exitCode = 1;
  } finally {
    doltClient.release();
    await doltPool.end();
    if (prodPool) await prodPool.end();
  }
}

main();
