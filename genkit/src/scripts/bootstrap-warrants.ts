/**
 * Bootstrap Warrants — Convert all production values to warrants.
 *
 * Reads 94,903 values from the staging DB, inserts them as warrants with
 * warrant_type='existing', tracks the run in analysis_batches, and creates
 * a Dolt commit.
 *
 * Usage: npx tsx src/scripts/bootstrap-warrants.ts
 * Requires: DoltgreSQL running on port 5433 with lwf_staging database.
 */
import crypto from 'node:crypto';
import { doltPool } from '../tools/index.js';

const BATCH_SIZE = 1000;

async function main() {
  const client = await doltPool.connect();
  const batchId = crypto.randomUUID();

  console.log('\n=== Bootstrap Warrants ===\n');
  console.log(`Batch ID: ${batchId}`);

  try {
    await client.query('BEGIN');

    // 1. Clear any previous bootstrap run
    await client.query(`DELETE FROM warrants WHERE warrant_type = 'existing'`);
    await client.query(`DELETE FROM analysis_batches WHERE source_id_code = 'PRODUCTION'`);

    // 2. Create analysis_batches record
    console.log('Cleared previous bootstrap data.');
    await client.query(
      `INSERT INTO analysis_batches (id, source_dataset, source_id_code, batch_type, status)
       VALUES ($1, 'LivingWithFire-DB', 'PRODUCTION', 'internal_scan', 'running')`,
      [batchId],
    );
    console.log('Created analysis_batches record.');

    // 3. Build source lookup map (avoids LEFT JOIN which triggers DoltgreSQL panic)
    console.log('Loading sources...');
    const sourcesResult = await client.query(
      `SELECT id, name, notes, region FROM sources`,
    );
    const sourceMap = new Map<string, { name: string; notes: string | null; region: string | null }>();
    for (const s of sourcesResult.rows) {
      sourceMap.set(s.id, { name: s.name, notes: s.notes, region: s.region });
    }
    console.log(`Loaded ${sourceMap.size} sources.`);

    // 4. Read all values with plant + attribute joins
    //    COALESCE ensures source_value ('x' markers) is used when value is NULL
    console.log('Reading all values with plant/attribute joins...');
    const { rows } = await client.query(`
      SELECT
        v.id AS value_id,
        v.plant_id,
        p.genus AS plant_genus,
        p.species AS plant_species,
        v.attribute_id,
        a.name AS attribute_name,
        COALESCE(v."value", v.source_value) AS "value",
        v.source_value,
        v.notes AS value_context,
        v.source_id
      FROM "values" v
      JOIN plants p ON p.id = v.plant_id
      JOIN attributes a ON a.id = v.attribute_id
    `);

    const totalValues = rows.length;
    console.log(`Fetched ${totalValues} values.`);

    // 5. Batch-insert warrants
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const placeholders: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      for (const row of batch) {
        const warrantId = crypto.randomUUID();
        const source = row.source_id ? sourceMap.get(row.source_id) : undefined;
        placeholders.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
        );
        params.push(
          warrantId,                          // id
          'existing',                         // warrant_type
          'unreviewed',                       // status
          row.plant_id,                       // plant_id
          row.plant_genus,                    // plant_genus
          row.plant_species,                  // plant_species
          row.attribute_id,                   // attribute_id
          row.attribute_name,                 // attribute_name
          row.value,                          // value
          row.source_value,                   // source_value
          row.value_context,                  // value_context
          row.source_id,                      // source_id
          'LivingWithFire-DB',                // source_dataset
          'PRODUCTION',                       // source_id_code
          source?.notes ?? null,              // source_methodology
          source?.region ?? null,             // source_region
          'exact',                            // match_method
          1.0,                                // match_confidence
        );
      }

      await client.query(
        `INSERT INTO warrants (
          id, warrant_type, status,
          plant_id, plant_genus, plant_species,
          attribute_id, attribute_name,
          "value", source_value, value_context,
          source_id, source_dataset, source_id_code,
          source_methodology, source_region,
          match_method, match_confidence
        ) VALUES ${placeholders.join(', ')}`,
        params,
      );

      inserted += batch.length;
      if (inserted % 10000 === 0 || inserted === totalValues) {
        console.log(`  Inserted ${inserted} / ${totalValues} warrants`);
      }
    }

    // 6. Count distinct matched plants
    const plantCountResult = await client.query(
      `SELECT COUNT(DISTINCT plant_id) AS cnt FROM warrants WHERE batch_id IS NULL`,
    );
    const plantsMatched = Number(plantCountResult.rows[0].cnt);

    // 7. Update analysis_batches with results
    await client.query(
      `UPDATE analysis_batches SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        total_source_records = $1,  -- non-null values only
        plants_matched = $2,
        warrants_created = $3,
        notes = $4
      WHERE id = $5`,
      [
        totalValues,
        plantsMatched,
        inserted,
        `Bootstrap: converted ${inserted} production values to warrants`,
        batchId,
      ],
    );

    // 8. Set batch_id on all bootstrapped warrants
    await client.query(
      `UPDATE warrants SET batch_id = $1 WHERE batch_id IS NULL AND warrant_type = 'existing'`,
      [batchId],
    );

    await client.query('COMMIT');
    console.log('\nTransaction committed.');

    // 9. Dolt commit
    console.log('Creating Dolt commit...');
    await client.query(`SELECT dolt_add('.')`);
    await client.query(
      `SELECT dolt_commit('-m', $1)`,
      [`bootstrap: ${inserted} production values converted to warrants`],
    );
    console.log('Dolt commit created.');

    // 10. Verification
    console.log('\n=== Verification ===\n');

    const warrantCount = await client.query('SELECT COUNT(*) AS cnt FROM warrants');
    const valueCount = await client.query('SELECT COUNT(*) AS cnt FROM "values"');
    console.log(
      `Warrant count: ${warrantCount.rows[0].cnt}  (values: ${valueCount.rows[0].cnt})`,
    );

    const nullCheck = await client.query(
      `SELECT COUNT(*) AS cnt FROM warrants
       WHERE plant_id IS NULL OR attribute_id IS NULL OR "value" IS NULL`,
    );
    console.log(`Warrants with NULL required fields: ${nullCheck.rows[0].cnt}`);

    const genusNull = await client.query(
      'SELECT COUNT(*) AS cnt FROM warrants WHERE plant_genus IS NULL',
    );
    console.log(`Warrants with NULL plant_genus: ${genusNull.rows[0].cnt}`);

    const attrNull = await client.query(
      'SELECT COUNT(*) AS cnt FROM warrants WHERE attribute_name IS NULL',
    );
    console.log(`Warrants with NULL attribute_name: ${attrNull.rows[0].cnt}`);

    const spotCheck = await client.query(
      `SELECT attribute_name, "value", warrant_type
       FROM warrants
       WHERE plant_genus = 'Ceanothus' AND plant_species = 'velutinus'
       ORDER BY attribute_name
       LIMIT 5`,
    );
    console.log(`\nSpot check — Ceanothus velutinus (${spotCheck.rowCount} shown):`);
    for (const r of spotCheck.rows) {
      console.log(`  ${r.attribute_name}: ${r.value} [${r.warrant_type}]`);
    }

    const batchRecord = await client.query(
      'SELECT status, total_source_records, plants_matched, warrants_created FROM analysis_batches WHERE id = $1',
      [batchId],
    );
    console.log('\nAnalysis batch:', batchRecord.rows[0]);

    const doltLog = await client.query(
      'SELECT message FROM dolt_log ORDER BY date DESC LIMIT 1',
    );
    console.log(`Latest Dolt commit: "${doltLog.rows[0].message}"`);

    const conflicts = await client.query(
      `SELECT plant_genus, plant_species, attribute_name, COUNT(*) AS warrant_count
       FROM warrants
       GROUP BY plant_id, attribute_id, plant_genus, plant_species, attribute_name
       HAVING COUNT(*) > 1
       ORDER BY warrant_count DESC
       LIMIT 10`,
    );
    console.log(`\nInternal conflict candidates (top 10):`);
    for (const r of conflicts.rows) {
      console.log(`  ${r.plant_genus} ${r.plant_species} — ${r.attribute_name}: ${r.warrant_count} warrants`);
    }

    console.log('\n=== Bootstrap Complete ===\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nBootstrap FAILED — transaction rolled back.');
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await doltPool.end();
  }
}

main();
