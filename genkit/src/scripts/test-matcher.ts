import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { matchPlantFlow } from '../flows/matchPlantFlow.js';
import { doltPool } from '../tools/dolt.js';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');
const CSV_PATH = resolve(REPO_ROOT, 'database-sources/fire/FirePerformancePlants/plants.csv');

async function main() {
  console.log('=== Matcher Agent Test: FIRE-01 (FirePerformancePlants) ===\n');

  // Read and parse CSV
  const csv = readFileSync(CSV_PATH, 'utf-8');
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',');
  const sciIdx = header.indexOf('scientific_name');
  const commonIdx = header.indexOf('common_name');

  const plants = lines.slice(1).map((line, i) => {
    const cols = line.split(',');
    return {
      sourceRowId: String(i + 1),
      scientificName: cols[sciIdx].trim(),
      commonName: cols[commonIdx].trim(),
      sourceDataset: 'FIRE-01',
    };
  });

  console.log(`Loaded ${plants.length} plants from FIRE-01\n`);
  console.log('Running matchPlantFlow...\n');

  const startTime = Date.now();
  const result = await matchPlantFlow({ plants });
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print summary
  console.log(`\n=== SUMMARY (${elapsed}s) ===`);
  console.log(`Total:      ${result.summary.total}`);
  console.log(`EXACT:      ${result.summary.exact}`);
  console.log(`SYNONYM:    ${result.summary.synonym}`);
  console.log(`CULTIVAR:   ${result.summary.cultivar}`);
  console.log(`GENUS_ONLY: ${result.summary.genusOnly}`);
  console.log(`FUZZY:      ${result.summary.fuzzy}`);
  console.log(`NONE:       ${result.summary.noMatch}`);

  const pctExact = ((result.summary.exact / result.summary.total) * 100).toFixed(1);
  console.log(`\nExact match rate: ${pctExact}%`);

  // Print examples of each match type
  const types = ['EXACT', 'SYNONYM', 'CULTIVAR', 'GENUS_ONLY', 'FUZZY', 'NONE'] as const;
  for (const type of types) {
    const examples = result.matches.filter((m) => m.matchType === type);
    if (examples.length === 0) continue;

    console.log(`\n--- ${type} examples (${examples.length} total) ---`);
    for (const ex of examples.slice(0, 3)) {
      console.log(`  "${ex.inputName}" → ${ex.productionGenus ?? '?'} ${ex.productionSpecies ?? '?'} [${ex.confidence.toFixed(2)}]`);
      console.log(`    ${ex.notes}`);
      if (ex.synonymResolution) {
        console.log(`    Synonym: ${ex.synonymResolution.originalName} → ${ex.synonymResolution.acceptedName} (${ex.synonymResolution.source})`);
      }
    }
  }

  // Print all NONE matches for manual review
  const noMatches = result.matches.filter((m) => m.matchType === 'NONE');
  if (noMatches.length > 0) {
    console.log(`\n--- ALL NONE matches (${noMatches.length}) ---`);
    for (const m of noMatches) {
      console.log(`  "${m.inputName}" — ${m.notes}`);
    }
  }

  await doltPool.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  doltPool.end();
  process.exit(1);
});
