/**
 * Internal Conflict Scan — Run classifyConflictFlow across all production warrants.
 *
 * Finds contradictions already present in the production data by comparing
 * warrant groups (plant + attribute combos with 2+ warrants). Creates an
 * analysis_batches record, writes conflicts to DB, creates a Dolt commit,
 * and outputs a summary report + JSON file.
 *
 * Usage: npx tsx src/scripts/internal-conflict-scan.ts
 * Requires: DoltgreSQL running on port 5433 with lwf_staging database
 *           and bootstrapped warrants (npm run bootstrap).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { doltPool } from '../tools/index.js';
import { classifyConflictFlow } from '../flows/classifyConflictFlow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'output');

async function main() {
  const client = await doltPool.connect();
  const batchId = crypto.randomUUID();
  const startTime = Date.now();

  console.log('\n=== Internal Conflict Scan ===\n');
  console.log(`Batch ID: ${batchId}`);

  try {
    // 1. Create analysis_batches record (commit immediately so flow writes can reference it)
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO analysis_batches (id, source_dataset, source_id_code, batch_type, status)
       VALUES ($1, 'LivingWithFire-DB', 'INTERNAL', 'internal_scan', 'running')`,
      [batchId],
    );
    await client.query('COMMIT');
    console.log('Created analysis_batches record.');

    // 2. Count warrant groups for the summary report
    const groupCountResult = await client.query(`
      SELECT COUNT(*) AS total FROM (
        SELECT plant_id, attribute_id
        FROM warrants
        WHERE warrant_type = 'existing' AND status != 'excluded'
        GROUP BY plant_id, attribute_id
        HAVING COUNT(*) >= 2
      ) AS grouped
    `);
    const totalWarrantGroups = Number(groupCountResult.rows[0].total);
    console.log(`Found ${totalWarrantGroups} warrant groups with 2+ warrants.\n`);

    // 3. Run the conflict classifier flow
    console.log('Running classifyConflictFlow in internal mode...\n');
    const result = await classifyConflictFlow({
      mode: 'internal',
      batchId,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nFlow completed in ${elapsed}s.`);

    // 4. Compute summary statistics from returned conflicts
    const uniquePlants = new Set(result.conflicts.map((c) => c.plantName)).size;

    const plantCounts = new Map<string, number>();
    const attrCounts = new Map<string, number>();
    for (const c of result.conflicts) {
      plantCounts.set(c.plantName, (plantCounts.get(c.plantName) ?? 0) + 1);
      attrCounts.set(c.attributeName, (attrCounts.get(c.attributeName) ?? 0) + 1);
    }

    const topPlants = [...plantCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topAttributes = [...attrCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // 5. Update analysis_batches with results
    const notesStr =
      `Internal scan: ${result.summary.total} conflicts across ${uniquePlants} plants ` +
      `(${result.summary.critical} critical, ${result.summary.moderate} moderate, ${result.summary.minor} minor). ` +
      `${result.corroborated} corroborated, ${result.complementary} complementary.`;

    await client.query('BEGIN');
    await client.query(
      `UPDATE analysis_batches SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        total_source_records = $1,
        warrants_created = 0,
        conflicts_detected = $2,
        agent_model = $3,
        agent_flows_used = $4,
        notes = $5
      WHERE id = $6`,
      [
        totalWarrantGroups,
        result.summary.total,
        'anthropic/claude-haiku-4-5',
        JSON.stringify(['classifyConflictFlow']),
        notesStr,
        batchId,
      ],
    );
    await client.query('COMMIT');
    console.log('Updated analysis_batches record.');

    // 6. Dolt commit
    console.log('Creating Dolt commit...');
    await client.query(`SELECT dolt_add('.')`);
    await client.query(
      `SELECT dolt_commit('-m', $1)`,
      [`internal scan: ${result.summary.total} conflicts detected across ${uniquePlants} plants`],
    );

    const logResult = await client.query(
      'SELECT commit_hash FROM dolt_log ORDER BY date DESC LIMIT 1',
    );
    const doltCommitHash: string = logResult.rows[0].commit_hash;

    // Update batch with commit hash
    await client.query(
      `UPDATE analysis_batches SET dolt_commit_hash = $1 WHERE id = $2`,
      [doltCommitHash, batchId],
    );
    console.log(`Dolt commit created: ${doltCommitHash}`);

    // 7. Print console summary report
    const { summary } = result;
    const pad = (label: string, width: number) => label.padEnd(width);
    const num = (n: number, width: number) => String(n).padStart(width);

    console.log(`
=== Internal Conflict Scan Complete ===

Warrant groups scanned:    ${num(totalWarrantGroups, 6)}
Corroborated (agreement):  ${num(result.corroborated, 6)}
Complementary (additions): ${num(result.complementary, 6)}
Conflicts detected:        ${num(summary.total, 6)}

By severity:
  Critical:  ${num(summary.critical, 6)}
  Moderate:  ${num(summary.moderate, 6)}
  Minor:     ${num(summary.minor, 6)}

By type:`);

    const sortedTypes = Object.entries(summary.byType).sort((a, b) => b[1] - a[1]);
    for (const [type, count] of sortedTypes) {
      console.log(`  ${pad(type, 28)} ${num(count, 6)}`);
    }

    console.log('\nTop conflicted plants:');
    topPlants.forEach(([name, count], i) => {
      console.log(`  ${String(i + 1).padStart(2)}. ${pad(name, 30)} — ${num(count, 4)} conflicts`);
    });

    console.log('\nTop conflicted attributes:');
    topAttributes.forEach(([name, count], i) => {
      console.log(`  ${String(i + 1).padStart(2)}. ${pad(name, 30)} — ${num(count, 4)} conflicts`);
    });

    console.log(`\nElapsed time: ${elapsed}s`);
    console.log(`Dolt commit:  ${doltCommitHash}`);

    // 8. Write JSON summary
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outputPath = path.join(OUTPUT_DIR, 'internal-scan-summary.json');

    const jsonSummary = {
      scanDate: new Date().toISOString(),
      batchId,
      doltCommitHash,
      totalWarrantGroups,
      corroborated: result.corroborated,
      complementary: result.complementary,
      totalConflicts: summary.total,
      bySeverity: {
        critical: summary.critical,
        moderate: summary.moderate,
        minor: summary.minor,
      },
      byType: summary.byType,
      topConflictedPlants: topPlants.map(([name, count]) => {
        const parts = name.split(' ');
        return {
          genus: parts[0],
          species: parts.slice(1).join(' ') || null,
          conflictCount: count,
        };
      }),
      topConflictedAttributes: topAttributes.map(([name, count]) => ({
        name,
        conflictCount: count,
      })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(jsonSummary, null, 2));
    console.log(`\nJSON summary written to: ${outputPath}`);

    // 9. Verification queries
    console.log('\n=== Verification ===\n');

    const conflictCount = await client.query('SELECT COUNT(*) AS cnt FROM conflicts');
    console.log(`Total conflicts in DB: ${conflictCount.rows[0].cnt}`);

    const byType = await client.query(
      'SELECT conflict_type, COUNT(*) AS cnt FROM conflicts GROUP BY conflict_type ORDER BY cnt DESC',
    );
    console.log('\nConflicts by type:');
    for (const r of byType.rows) {
      console.log(`  ${pad(r.conflict_type, 28)} ${num(Number(r.cnt), 6)}`);
    }

    const bySeverity = await client.query(
      'SELECT severity, COUNT(*) AS cnt FROM conflicts GROUP BY severity ORDER BY cnt DESC',
    );
    console.log('\nConflicts by severity:');
    for (const r of bySeverity.rows) {
      console.log(`  ${pad(r.severity, 12)} ${num(Number(r.cnt), 6)}`);
    }

    const invalidRefs = await client.query(`
      SELECT COUNT(*) AS cnt FROM conflicts c
      WHERE NOT EXISTS (SELECT 1 FROM warrants w WHERE w.id = c.warrant_a_id)
         OR NOT EXISTS (SELECT 1 FROM warrants w WHERE w.id = c.warrant_b_id)
    `);
    console.log(`\nConflicts with invalid warrant refs: ${invalidRefs.rows[0].cnt}`);

    const batchRecord = await client.query(
      'SELECT status, total_source_records, conflicts_detected, dolt_commit_hash FROM analysis_batches WHERE id = $1',
      [batchId],
    );
    console.log('\nAnalysis batch:', batchRecord.rows[0]);

    const latestCommit = await client.query(
      'SELECT message FROM dolt_log ORDER BY date DESC LIMIT 1',
    );
    console.log(`Latest Dolt commit: "${latestCommit.rows[0].message}"`);

    console.log('\n=== Internal Conflict Scan Complete ===\n');
  } catch (err) {
    // Update batch to failed
    try {
      await client.query(
        `UPDATE analysis_batches SET status = 'failed', completed_at = CURRENT_TIMESTAMP, notes = $1 WHERE id = $2`,
        [`Failed: ${err instanceof Error ? err.message : String(err)}`, batchId],
      );
    } catch {
      // Ignore update failure
    }

    console.error('\nInternal conflict scan FAILED.');
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await doltPool.end();
  }
}

main();
