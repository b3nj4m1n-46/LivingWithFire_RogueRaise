import { synthesizeClaimFlow, type SynthesisInput } from '../flows/synthesizeClaimFlow.js';
import { doltPool } from '../tools/dolt.js';

async function main() {
  console.log('=== Synthesis Agent Test ===\n');

  // Find a plant+attribute with 3+ warrants
  const groupResult = await doltPool.query(`
    SELECT w.plant_id, w.attribute_id,
           w.plant_genus, w.plant_species, w.attribute_name,
           COUNT(*)::int AS cnt
    FROM warrants w
    GROUP BY w.plant_id, w.attribute_id, w.plant_genus, w.plant_species, w.attribute_name
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `);

  if (groupResult.rows.length === 0) {
    console.log('No plant+attribute found with 3+ warrants. Try with fewer warrants.');
    // Fallback: find any group with 2+
    const fallback = await doltPool.query(`
      SELECT w.plant_id, w.attribute_id,
             w.plant_genus, w.plant_species, w.attribute_name,
             COUNT(*)::int AS cnt
      FROM warrants w
      GROUP BY w.plant_id, w.attribute_id, w.plant_genus, w.plant_species, w.attribute_name
      HAVING COUNT(*) >= 2
      ORDER BY COUNT(*) DESC
      LIMIT 1
    `);
    if (fallback.rows.length === 0) {
      console.log('No warrant groups found at all. Ensure warrants are bootstrapped.');
      await doltPool.end();
      return;
    }
    groupResult.rows = fallback.rows;
  }

  const group = groupResult.rows[0] as Record<string, unknown>;
  const plantId = group.plant_id as string;
  const attributeId = group.attribute_id as string;
  const plantName = `${group.plant_genus} ${group.plant_species ?? ''}`.trim();
  const attributeName = group.attribute_name as string;

  console.log(`Test case: ${plantName} / ${attributeName} (${group.cnt} warrants)\n`);

  // Load warrants
  const warrantResult = await doltPool.query(
    `SELECT id, "value", source_value AS "sourceValue", value_context AS "valueContext",
            source_dataset AS "sourceDataset", source_id_code AS "sourceIdCode",
            source_methodology AS "sourceMethodology", source_region AS "sourceRegion",
            source_year AS "sourceYear", source_reliability AS "sourceReliability",
            warrant_type AS "warrantType", match_confidence AS "matchConfidence"
     FROM warrants
     WHERE plant_id = $1 AND attribute_id = $2
     ORDER BY source_dataset`,
    [plantId, attributeId],
  );

  const warrants = warrantResult.rows as SynthesisInput['warrants'];
  console.log(`Loaded ${warrants.length} warrants:`);
  for (const w of warrants) {
    console.log(`  ${w.sourceIdCode ?? w.sourceDataset}: "${w.value}" (${w.warrantType})`);
  }

  // Load conflicts
  const conflictResult = await doltPool.query(
    `SELECT c.id, c.conflict_type AS "conflictType", c.severity, c.status,
            c.specialist_verdict AS "specialistVerdict",
            c.specialist_analysis AS "specialistAnalysis",
            c.specialist_recommendation AS "specialistRecommendation",
            c.value_a AS "valueA", c.value_b AS "valueB",
            c.source_a AS "sourceA", c.source_b AS "sourceB"
     FROM conflicts c
     WHERE c.plant_id = $1
       AND c.attribute_name = $2`,
    [plantId, attributeName],
  );

  const conflicts = conflictResult.rows as SynthesisInput['conflicts'];
  console.log(`\nLoaded ${conflicts.length} conflict(s)`);
  for (const c of conflicts) {
    console.log(`  ${c.conflictType}: ${c.sourceA} vs ${c.sourceB} (${c.severity})`);
  }

  // Load production value
  const prodResult = await doltPool.query(
    `SELECT "value" FROM "values" WHERE plant_id = $1 AND attribute_id = $2 LIMIT 1`,
    [plantId, attributeId],
  );
  const productionValue = prodResult.rows.length > 0
    ? (prodResult.rows[0] as Record<string, unknown>).value as string
    : null;
  console.log(`\nCurrent production value: ${productionValue ?? 'none'}`);

  // Run synthesis
  console.log('\n--- Running synthesizeClaimFlow... ---\n');
  const startTime = Date.now();

  const result = await synthesizeClaimFlow({
    plantId,
    plantName,
    attributeId,
    attributeName,
    warrants,
    conflicts,
    productionValue,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`=== SYNTHESIS RESULT (${elapsed}s) ===\n`);
  console.log(`Categorical Value: ${result.categorical_value ?? '(null)'}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`\nSynthesized Text:\n  ${result.synthesized_text}`);
  console.log(`\nConfidence Reasoning:\n  ${result.confidence_reasoning}`);
  console.log(`\nSources Cited: ${result.sources_cited.join(', ') || '(none)'}`);
  console.log(`\nWarrant Weights:`);
  for (const ww of result.warrant_weights) {
    console.log(`  ${ww.warrantId.slice(0, 8)}... → ${ww.weight}`);
  }

  await doltPool.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  doltPool.end();
  process.exit(1);
});
