# Dashboard — Add "Datasets Mapped" Summary Card

> **Status:** TODO
> **Priority:** P3 (polish)
> **Depends on:** 021-table-fusion-ui
> **Blocks:** None

## Problem

The dashboard summary cards show 5 metrics but none reflect fusion/schema mapping activity. A data steward returning to the portal has no at-a-glance indicator of how many source datasets have been mapped or are awaiting review.

## Current Implementation

`admin/src/components/summary-cards.tsx` renders 5 cards in a responsive grid:
- Total Warrants
- Pending Conflicts
- Claims Generated
- Datasets Processed (completed `external_analysis` batches)
- Pending Sync

`admin/src/lib/queries/dashboard.ts` fetches all metrics in `fetchDashboardData()`.

The fusion batch history is only visible on `/fusion`.

## Proposed Changes

Add a 6th summary card: **Datasets Mapped**

- Count: `SELECT COUNT(*) FROM analysis_batches WHERE batch_type = 'schema_mapping'`
- Breakdown badges: by status (`mapping_review`, `executing`, `completed`, `failed`)
- Link to `/fusion` page on click or via a small link

### What Does NOT Change

- Existing 5 cards remain unchanged
- Grid adjusts from 5-col to 6-col (or stays 5-col with wrapping)

## Files Modified

### Modified Files
- `admin/src/lib/queries/dashboard.ts` — add mapping batch count + status breakdown query
- `admin/src/components/summary-cards.tsx` — add "Datasets Mapped" card

## Verification

1. Dashboard shows 6th card with correct count of schema_mapping batches
2. Status breakdown badges match actual batch statuses in DB
3. Card links to `/fusion` page
