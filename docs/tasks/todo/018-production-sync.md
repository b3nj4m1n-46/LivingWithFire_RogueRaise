# Production Sync — Push Approved Claims to Neon PostgreSQL

> **Status:** TODO
> **Priority:** P2 (normal)
> **Depends on:** 015-synthesis-agent (claims must exist to sync), 016-dolt-version-control-ui (commit tracking), 017-extract-agent-prompts
> **Blocks:** None

## Problem

The staging database (DoltgreSQL) is where all curation happens, but the public-facing app reads from the production database (Neon PostgreSQL at `lwf-api.vercel.app`). Approved claims in Dolt need to be pushed to production. Currently there's no mechanism for this — approved claims sit in Dolt with no path to the live app.

The sync must be:
- **Preview-first** — show exactly what will change before pushing
- **Auditable** — log every sync event
- **Incremental** — only sync changes since the last sync, not a full dump

## Current Implementation

### What Exists
- Production database schema documented in `LivingWithFire-DB/DATA-DICTIONARY.md` (13 tables, EAV model)
- Production API reference in `LivingWithFire-DB/api-reference/`
- `claims` table in DoltgreSQL with `status` field: draft → approved → pushed
- `claim_warrants` junction table linking claims to evidence
- Dolt commit history tracking all changes
- Production connection info in `LivingWithFire-DB/README.md`

### What Does NOT Exist Yet
- Sync script or utility
- Push to Production UI
- Sync event logging
- Production connection from the admin portal

## Proposed Changes

### 1. Sync Script

`genkit/src/scripts/sync-to-production.ts`:

A script that reads approved claims from Dolt, generates the equivalent production upserts, and optionally executes them.

```typescript
// Usage: tsx src/scripts/sync-to-production.ts [--dry-run] [--since <commitHash>]
// --dry-run: preview changes without writing to production
// --since: only sync claims approved after this commit (default: last sync point)
```

#### Sync Logic:

1. **Find approved claims** not yet pushed:
   ```sql
   SELECT c.*, p.scientific_name, a.name as attribute_name
   FROM claims c
   JOIN plants p ON c.plant_id = p.id
   JOIN attributes a ON c.attribute_id = a.id
   WHERE c.status = 'approved' AND (c.pushed_to_production IS NULL OR c.pushed_to_production = false);
   ```

2. **Generate production upserts** — for each claim, create the equivalent `values` table upsert:
   ```sql
   -- Production EAV model: values(id, plant_id, attribute_id, value, source_value, source_id)
   INSERT INTO "values" (id, plant_id, attribute_id, value, source_value, source_id)
   VALUES ($1, $2, $3, $4, $5, $6)
   ON CONFLICT (plant_id, attribute_id, source_id) DO UPDATE
   SET value = $4, source_value = $5;
   ```

3. **Preview** — in dry-run mode, print the SQL statements without executing
4. **Execute** — connect to Neon, run upserts in a transaction
5. **Mark as pushed** — update claims in Dolt:
   ```sql
   UPDATE claims SET status = 'pushed', pushed_to_production = true, pushed_at = NOW()
   WHERE id = ANY($1);
   ```
6. **Dolt commit** — `SELECT dolt_commit('-m', 'sync: pushed N claims to production');`

### 2. Push to Production UI

`admin/src/app/api/sync/preview/route.ts`:
- GET — returns list of approved-but-not-pushed claims with their production upsert previews
- Response: `{ claims: Array<{ id, plantName, attributeName, oldValue, newValue }>, totalChanges: number }`

`admin/src/app/api/sync/push/route.ts`:
- POST — executes the sync (calls sync script logic)
- Response: `{ pushed: number, commitHash: string }`

Add a "Push to Production" section to the dashboard or as a dedicated page:
- Shows count of approved claims ready to push
- "Preview Changes" button → displays table of what will change (old → new values)
- "Push to Production" button with confirmation dialog
- After push: show success message with commit hash

### 3. Sync Event Logging

Add a `sync_events` table or use `analysis_batches` with `batch_type = 'production_sync'`:

```sql
INSERT INTO analysis_batches (id, source_dataset, batch_type, status, started_at, notes)
VALUES ($1, 'production', 'production_sync', 'completed', NOW(), 'Pushed N claims');
```

Sync events visible in the dashboard batches table and history page.

### What Does NOT Change

- Production database schema — uses existing EAV tables as-is
- Dolt staging schema — no new tables (reuse analysis_batches for logging)
- Genkit flows — sync is a data operation, no LLM calls
- Claim curation UI — approval workflow is unchanged

## Migration Strategy

1. Add production Neon connection config to `admin/.env.local` (or `genkit/.env`)
2. Implement `genkit/src/scripts/sync-to-production.ts` with dry-run support
3. Create preview API route (`/api/sync/preview`)
4. Create push API route (`/api/sync/push`)
5. Add Push to Production UI (dashboard section or dedicated page)
6. Test dry-run: approve a claim → preview sync → verify correct SQL generated
7. Test real push: push to production → verify value updated in Neon → verify claim marked as pushed

## Files Modified

### New Files
- `genkit/src/scripts/sync-to-production.ts` — sync script with dry-run
- `admin/src/app/api/sync/preview/route.ts` — preview pending sync
- `admin/src/app/api/sync/push/route.ts` — execute sync
- `admin/src/lib/queries/sync.ts` — sync-related queries

### Modified Files
- `admin/src/app/page.tsx` — add "Push to Production" section to dashboard (or link to sync page)
- `admin/.env.local` — add production Neon connection string

## Verification

1. **Dry-run shows correct preview:**
   - Approve a claim for a known plant+attribute
   - Run `tsx src/scripts/sync-to-production.ts --dry-run`
   - Verify output shows the correct upsert SQL with right values

2. **Preview API returns pending claims:**
   - GET `/api/sync/preview` → returns approved-but-not-pushed claims
   - Count matches: `SELECT COUNT(*) FROM claims WHERE status = 'approved' AND pushed_to_production IS NOT true;`

3. **Push updates production:**
   - Push via UI or script
   - Query production Neon: verify the value was upserted
   - Query Dolt: verify claim status changed to 'pushed'

4. **Sync event logged:**
   ```sql
   SELECT * FROM analysis_batches WHERE batch_type = 'production_sync' ORDER BY started_at DESC LIMIT 1;
   -- Should show the sync event with claim count
   ```

5. **Idempotent:** Run push again with no new approved claims → 0 changes, no error
