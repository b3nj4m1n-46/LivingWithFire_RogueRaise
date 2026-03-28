# Bootstrap Warrants — Convert Production Values to Warrants

> **Status:** COMPLETED
> **Priority:** P0 (critical)
> **Depends on:** 001-dolt-setup (staging DB with production data), 002-genkit-setup (Genkit tools for DB access)
> **Blocks:** All Phase 2 tasks (internal conflict scan, external analysis, specialist agents)
> **Commit:** `820b50b` — Bootstrap 94,903 production values as warrants (003-bootstrap-warrants)

## Problem

The Claim/Warrant model requires that **all data points exist as warrants** before conflicts can be detected. The production database has 94,903 values across 1,361 plants — these must be converted into warrants with `warrant_type: 'existing'` so the Conflict Classifier can compare them against each other (internal conflicts) and against new source data (external conflicts).

Without this bootstrap step, the internal conflict scan (the first demo-worthy result) is impossible.

## Current Implementation

### Production Values (in DoltgreSQL staging)

After 001-dolt-setup, the `values` table contains 94,903 rows:

```sql
-- Example row from values table
SELECT v.id, v.plant_id, v.attribute_id, v.value, v.source_id, v.source_value, v.notes
FROM values v
LIMIT 1;
```

Each value has:
- `plant_id` → links to `plants` (genus, species, common_name)
- `attribute_id` → links to `attributes` (name, hierarchy)
- `source_id` → links to `sources` (name, url, methodology)
- `value` → the normalized value
- `source_value` → original value from source (may be null)

### The Warrants Table (empty)

Created in 001-dolt-setup, the `warrants` table exists but has 0 rows. Full schema in `docs/planning/PROPOSALS-SCHEMA.md`.

### What Does NOT Exist Yet

- Any warrant records
- Any mapping logic from values → warrants
- The analysis_batches record for this bootstrap operation

## Proposed Changes

### 1. Bootstrap Script

Write `genkit/src/scripts/bootstrap-warrants.ts` that:

1. Creates an `analysis_batches` record for this run:
   ```sql
   INSERT INTO analysis_batches (id, source_dataset, source_id_code, batch_type, status)
   VALUES (uuid, 'LivingWithFire-DB', 'PRODUCTION', 'internal_scan', 'running');
   ```

2. Reads all values with denormalized plant + attribute + source info:
   ```sql
   SELECT
     v.id AS value_id,
     v.plant_id,
     p.genus AS plant_genus,
     p.species AS plant_species,
     v.attribute_id,
     a.name AS attribute_name,
     v.value,
     v.source_value,
     v.notes AS value_context,
     v.source_id,
     s.name AS source_name,
     s.source_type AS source_methodology,
     s.fire_region AS source_region
   FROM values v
   JOIN plants p ON p.id = v.plant_id
   JOIN attributes a ON a.id = v.attribute_id
   LEFT JOIN sources s ON s.id = v.source_id;
   ```

3. For each value, inserts a warrant:
   ```sql
   INSERT INTO warrants (
     id, warrant_type, status,
     plant_id, plant_genus, plant_species,
     attribute_id, attribute_name,
     value, source_value, value_context,
     source_id, source_dataset, source_id_code,
     source_methodology, source_region,
     match_method, match_confidence,
     batch_id, created_at
   ) VALUES (
     new_uuid, 'existing', 'unreviewed',
     v.plant_id, p.genus, p.species,
     v.attribute_id, a.name,
     v.value, v.source_value, v.notes,
     v.source_id, 'LivingWithFire-DB', 'PRODUCTION',
     s.source_type, s.fire_region,
     'exact', 1.00,
     batch_id, NOW()
   );
   ```

4. Updates the analysis_batches record with results:
   ```sql
   UPDATE analysis_batches SET
     status = 'completed',
     completed_at = NOW(),
     total_source_records = 94903,
     plants_matched = 1361,
     warrants_created = 94903,
     notes = 'Bootstrap: converted all production values to warrants'
   WHERE id = batch_id;
   ```

5. Commits to Dolt:
   ```sql
   SELECT dolt_add('.');
   SELECT dolt_commit('-m', 'bootstrap: 94,903 production values converted to warrants');
   ```

### Implementation Notes

- **UUID generation:** Use `crypto.randomUUID()` (Node.js built-in)
- **Batch inserts:** Insert in batches of 1,000 rows for performance (94,903 rows total)
- **Transaction safety:** Wrap the entire operation in a transaction; rollback on any failure
- **source_dataset:** Set to `'LivingWithFire-DB'` for all bootstrapped warrants (distinguishes them from external warrants which will reference dataset folder names like `'FirePerformancePlants'`)
- **source_id_code:** Set to `'PRODUCTION'` (not a standard source ID — signals this came from the existing production DB)
- **match_method/confidence:** Set to `'exact'` / `1.00` since these are already in production (no matching needed)

### What Does NOT Change

- The `values` table — read-only, warrants are a separate copy
- The `plants`, `attributes`, `sources` tables — read-only
- No agent flows are called — this is a pure data transformation script
- No files in `database-sources/` or `LivingWithFire-DB/` are modified

## Migration Strategy

1. Write the bootstrap script at `genkit/src/scripts/bootstrap-warrants.ts`
2. Run the script against the live DoltgreSQL staging database
3. Verify warrant count matches value count (94,903)
4. Verify the analysis_batches record shows correct stats
5. Verify the Dolt commit exists in history

## Files Modified

### New Files
- `genkit/src/scripts/bootstrap-warrants.ts` — the bootstrap script

### Modified Files
- None

### Unchanged
- `LivingWithFire-DB/` — read-only source
- `database-sources/` — not touched
- DoltgreSQL schema — no table structure changes (only data inserted)

## Verification

1. **Warrant count matches values:**
   ```sql
   SELECT
     (SELECT COUNT(*) FROM values) AS value_count,
     (SELECT COUNT(*) FROM warrants) AS warrant_count,
     (SELECT COUNT(*) FROM warrants WHERE warrant_type = 'existing') AS existing_warrants;
   -- Expected: all three = 94,903
   ```

2. **All warrants have required fields populated:**
   ```sql
   SELECT COUNT(*) FROM warrants
   WHERE plant_id IS NULL
      OR attribute_id IS NULL
      OR value IS NULL
      OR warrant_type IS NULL;
   -- Expected: 0
   ```

3. **Denormalized fields are populated:**
   ```sql
   SELECT COUNT(*) FROM warrants WHERE plant_genus IS NULL;
   -- Expected: 0
   SELECT COUNT(*) FROM warrants WHERE attribute_name IS NULL;
   -- Expected: 0
   ```

4. **Sample spot check — Ceanothus velutinus:**
   ```sql
   SELECT w.attribute_name, w.value, w.source_id, w.warrant_type
   FROM warrants w
   WHERE w.plant_genus = 'Ceanothus' AND w.plant_species = 'velutinus'
   ORDER BY w.attribute_name;
   -- Should return multiple warrants across different attributes
   -- All should have warrant_type = 'existing'
   ```

5. **Analysis batch record:**
   ```sql
   SELECT * FROM analysis_batches WHERE source_id_code = 'PRODUCTION';
   -- status = 'completed', warrants_created = 94903
   ```

6. **Dolt commit exists:**
   ```sql
   SELECT * FROM dolt_log ORDER BY date DESC LIMIT 1;
   -- Message should contain 'bootstrap' and '94,903'
   ```

7. **Internal conflict detection is now possible:**
   ```sql
   -- This query should return plants with 2+ warrants for the same attribute
   -- (these are candidates for the Conflict Classifier in Phase 2)
   SELECT plant_genus, plant_species, attribute_name, COUNT(*) AS warrant_count
   FROM warrants
   GROUP BY plant_id, attribute_id, plant_genus, plant_species, attribute_name
   HAVING COUNT(*) > 1
   ORDER BY warrant_count DESC
   LIMIT 10;
   -- Should return results — these are the internal conflicts waiting to be classified
   ```

## Implementation Notes

> **Completed:** 2026-03-28
> **Implemented by:** Claude Code

### Deviations from Spec

1. **COALESCE for NULL values (data discovery):** The spec assumed all 94,903 values had a non-NULL `value` column. In reality, 26,889 values (28%) had `value = NULL` with `source_value = 'x'`. Investigation revealed these are boolean presence markers on **parent category attributes** in the EAV hierarchy (e.g., a row on "Bloom & Flower" with `source_value = 'x'` means "this plant has bloom data" — the actual detail lives in child attributes like "Flower Color", "Bloom Time"). Rather than silently dropping 28% of evidence, the script uses `COALESCE(v."value", v.source_value)` so these `'x'` markers are preserved as warrants. The mirrored production `"values"` table is not modified.

2. **Source table column names differ from spec:** The spec referenced `s.source_type` and `s.fire_region` — these columns don't exist. The actual `sources` table has `notes` and `region`. The script maps:
   - `sources.notes` → warrant `source_methodology`
   - `sources.region` → warrant `source_region`

3. **No LEFT JOIN to sources (DoltgreSQL bug workaround):** The spec used `LEFT JOIN sources s ON s.id = v.source_id`. DoltgreSQL panics with `interface conversion: interface {} is nil` when LEFT JOINing on nullable FK columns. The script works around this by pre-loading all 103 sources into an in-memory `Map<id, {name, notes, region}>` and looking up source metadata per-row during insert.

4. **`batch_id` not set during INSERT (spec gap):** The spec's INSERT statement included `batch_id` as a column, but the script inserts warrants without `batch_id` first (for simplicity in the batch INSERT builder), then backfills with `UPDATE warrants SET batch_id = $1 WHERE batch_id IS NULL AND warrant_type = 'existing'`. End result is the same — all warrants are linked to their batch.

5. **Idempotent re-run (added beyond spec):** The script DELETEs previous `warrant_type = 'existing'` warrants and `source_id_code = 'PRODUCTION'` batch records before inserting. This was not in the spec but was added so the script can be safely re-run without duplicating data.

6. **`genkit/package.json` modified (not in spec):** Added `"bootstrap": "tsx src/scripts/bootstrap-warrants.ts"` npm script for convenience. The spec only listed the new script file.

7. **`batch_id` set inline vs. during INSERT:** The spec showed `batch_id` as part of the INSERT VALUES. The implementation sets it via a separate UPDATE after all inserts complete (step 8 in the script). Functionally equivalent.

8. **Stale comment in UPDATE query:** Line 139 has `-- non-null values only` which is now inaccurate after the COALESCE change — `total_source_records` is all 94,903. Minor, does not affect behavior.

### Files Created/Modified
- **NEW:** `genkit/src/scripts/bootstrap-warrants.ts` — bootstrap script (244 lines)
- **MODIFIED:** `genkit/package.json` — added `"bootstrap"` npm script
- **MOVED:** `docs/tasks/todo/003-bootstrap-warrants.md` → `docs/tasks/completed/`
- **MODIFIED:** `docs/planning/TASKS.md` — updated T12-T13 status references

### Verification Results (actual)
- Warrant count: **94,903** (1:1 match with values)
- NULL required fields (plant_id, attribute_id, value): **0**
- NULL plant_genus: **0**
- NULL attribute_name: **0**
- Ceanothus velutinus: multiple warrants confirmed, all `warrant_type = 'existing'`
- Analysis batch: `status = 'completed'`, `warrants_created = 94903`, `plants_matched = 1361`
- Dolt commit: `"bootstrap: 94903 production values converted to warrants"`
- Internal conflict candidates: Mahonia aquifolium (18 warrants for Flammability), Penstemon spp. (15 for Flammability), many plants with 13-15 warrants per attribute
