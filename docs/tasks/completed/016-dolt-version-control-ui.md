# Dolt Version Control UI — History, Diffs, and Undo

> **Status:** COMPLETED
> **Priority:** P1 (important)
> **Depends on:** 010-portal-scaffold (Next.js app + DB connection)
> **Blocks:** None, but essential for demo (shows Dolt's version control value)
> **Commit:** `e503784` — Add Dolt version control UI (016) with history, diffs, save, and undo

## Problem

Dolt's version control is a key differentiator of this system — every warrant creation, conflict detection, and claim approval is tracked as a commit. But the History page is currently a placeholder, and there's no way for data stewards to see what changed, when, or to undo a mistake. Without this UI, the version control capability is invisible.

The goal: data stewards should never need to touch the CLI. All Dolt operations (commit, view history, view diffs, revert) happen through the portal.

## Current Implementation

### What Exists
- DoltgreSQL running on port 5433 with multiple commits from bootstrap, internal scan, FIRE-01, WATER-01 analyses, and claim approvals
- History page placeholder at `admin/src/app/history/page.tsx` — shows "Dolt version history browser coming in a future task"
- `lib/dolt.ts` connection utility
- Claim approval API already creates Dolt commits via `SELECT dolt_commit(...)`
- Dolt system tables accessible via SQL:
  - `dolt_log` — commit history (hash, committer, date, message)
  - `dolt_diff_<table>` — row-level diffs between commits
  - `dolt_commit_diff_<table>` — diffs between any two commits

### What Does NOT Exist Yet
- History page with real commit log
- Diff viewer for any commit
- Save Changes (manual commit) button
- Undo/Revert functionality

## Proposed Changes

### 1. History Page

Replace `admin/src/app/history/page.tsx`:

Display `dolt_log` as a timeline/table:

| Column | Source | Notes |
|--------|--------|-------|
| Commit Hash | `commit_hash` (first 8 chars) | Monospace font |
| Message | `message` | Full commit message |
| Date | `date` | Relative time ("2 hours ago") + absolute on hover |
| Committer | `committer` | |
| Actions | — | "View Changes" button, "Undo" button |

```sql
SELECT commit_hash, committer, date, message
FROM dolt_log
ORDER BY date DESC
LIMIT 50;
```

Paginated — load more on scroll or "Load more" button.

### 2. View Changes (Diff Viewer)

When "View Changes" is clicked on a history entry, show a human-readable diff.

`admin/src/app/history/[commitHash]/page.tsx`:

For each table that changed in that commit, show:
- Table name
- Rows added / modified / deleted counts
- Expandable row-level details

Query approach — diff between the commit and its parent:
```sql
-- For warrants table:
SELECT diff_type,
       COALESCE(to_id, from_id) as id,
       from_value, to_value,
       from_source_id_code, to_source_id_code
FROM dolt_commit_diff_warrants
WHERE to_commit = $1 AND from_commit = $2;
```

Tables to check for diffs: `warrants`, `conflicts`, `claims`, `claim_warrants`, `analysis_batches`.

Display format:
- **Added rows** — green highlight, show new values
- **Modified rows** — yellow highlight, show old → new for changed columns
- **Deleted rows** — red highlight, show removed values

### 3. Save Changes Button

A global "Save Changes" button in the portal header/toolbar (visible when there are uncommitted changes).

**Detection:** Check for uncommitted changes:
```sql
SELECT COUNT(*) as changes FROM dolt_status;
```

If changes > 0, show the button. When clicked:
- Show a dialog with auto-generated commit message (editable)
- On confirm: `SELECT dolt_add('.'); SELECT dolt_commit('-m', $1);`
- Refresh history

API route: `admin/src/app/api/dolt/commit/route.ts`
- POST — `{ message: string }` → commits all staged changes

### 4. Undo Button

Per-commit "Undo" button with confirmation dialog.

When clicked:
- Show confirmation dialog: "This will revert all changes from commit [hash]: [message]. This creates a new commit."
- On confirm: `SELECT dolt_revert($commitHash);`
- Refresh history to show the revert commit

API route: `admin/src/app/api/dolt/revert/route.ts`
- POST — `{ commitHash: string }` → reverts that commit

**Safety:** Only allow revert on the most recent N commits (e.g., last 5). Older commits may have dependencies that make revert unsafe. Show a warning for commits older than the most recent.

### What Does NOT Change

- Genkit flows — not involved
- Claim/conflict/warrant APIs — their existing Dolt commit logic is unchanged
- DoltgreSQL schema — no table changes (uses built-in system tables)
- Dashboard — independent (could link to history page but not required)

## Migration Strategy

1. Write query functions in `admin/src/lib/queries/history.ts` — log, diff, status, commit, revert
2. Build history timeline component
3. Build diff viewer page with table-level and row-level details
4. Build save changes button with uncommitted changes detection
5. Build undo button with confirmation dialog
6. Create API routes: commit, revert, diff
7. Replace history page placeholder
8. Test: make a change → Save Changes → view in history → View Changes → Undo → verify revert

## Files Modified

### New Files
- `admin/src/lib/queries/history.ts` — Dolt history/diff query functions
- `admin/src/app/history/page.tsx` — history timeline (replace placeholder)
- `admin/src/app/history/[commitHash]/page.tsx` — commit diff viewer
- `admin/src/app/api/dolt/commit/route.ts` — manual commit API
- `admin/src/app/api/dolt/revert/route.ts` — revert API
- `admin/src/components/save-changes-button.tsx` — global save button

### Modified Files
- `admin/src/app/layout.tsx` — add Save Changes button to header/toolbar

## Verification

1. **History page shows real commits:**
   ```sql
   SELECT COUNT(*) FROM dolt_log;
   ```
   UI should show same number of entries (paginated)

2. **Commit messages match:** Compare UI display with `dolt_log` output

3. **Diff viewer shows correct changes:**
   - Click "View Changes" on the FIRE-01 analysis commit
   - Should show warrants added (green), conflicts added (green)
   - Row counts should match what the analysis script reported

4. **Save Changes works:**
   - Make a warrant status change via the claim view
   - Verify Save Changes button appears
   - Click → enter message → commit
   - Verify new commit appears in history

5. **Undo works:**
   - Click Undo on the most recent commit
   - Confirm dialog appears with correct commit info
   - Confirm → verify revert commit created
   - Verify the reverted changes are actually undone (query the affected table)
