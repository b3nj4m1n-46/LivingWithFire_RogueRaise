# Unreviewed Warrant Indicators — Surface New Evidence on Plant Browser

> **Status:** TODO
> **Priority:** P1 (important)
> **Depends on:** 028a-plant-browser, 037-api-enrichment-pipeline
> **Blocks:** Efficient curation workflow after enrichment runs

## Problem

After running enrichment scripts (e.g., Trefle → 1,795 warrants across 823 plants), there is no way to tell which plants have new, unreviewed evidence available. The plant browser shows attribute counts and completeness but nothing about pending warrants needing attention.

A curator looking at `/plants` has to click into each plant individually and check for warrant badges — with 1,361 plants, this is impractical. They need to see at a glance: "these 823 plants have new data from Trefle that needs review."

## Current Implementation

### Plant Browser (`/plants`)
- **File:** `admin/src/app/plants/page.tsx`, `admin/src/lib/queries/plants.ts`
- Columns: Scientific Name, Common Name, Attribute Count, Completeness %, Last Updated
- Sortable and searchable
- No warrant or curation status information

### Plant Detail (`/plants/[plantId]`)
- Shows warrant count badges per attribute (from Dolt)
- Badges link to claims page for review
- But you have to navigate here first to see them

### Claims List (`/claims`)
- Groups by plant+attribute, shows warrant counts and conflict status
- Can filter by source dataset
- But doesn't show which plants have *new* (unreviewed) warrants vs already-reviewed ones

## Proposed Changes

### 1. Add Unreviewed Warrant Count to Plant Browser

Add a new column/badge to the plant list table showing the count of unreviewed warrants per plant.

**Query addition in `fetchPlantList`** (Dolt):
```sql
SELECT plant_id, COUNT(*)::int AS unreviewed_count
FROM warrants
WHERE status = 'unreviewed'
  AND (source_id_code IS NULL OR source_id_code != 'INTERNAL_AUDIT')
GROUP BY plant_id
```

**Display options:**
- New "New Evidence" column with count badge (e.g., `12 new`)
- Badge color: amber/yellow to indicate action needed
- Sortable — so curators can sort by most new evidence first
- Zero counts hidden (no badge)

### 2. Add Source Filter for Warrants

Allow filtering the plant list by warrant source:
- "Has Trefle warrants"
- "Has unreviewed warrants"
- "Needs review" (unreviewed > 0)

This lets a curator say "show me all plants that got new data from the Trefle enrichment run."

### 3. Optional: Enrichment Summary Banner

After an enrichment run, show a dismissable banner on the plants page:
> "Trefle enrichment added 1,795 warrants across 823 plants. [Review →]"

This provides immediate context after a batch operation.

### What Does NOT Change

- Plant detail page — already shows warrant badges per attribute
- Claims page — already supports filtering
- Warrant/claim data model — no schema changes
- Sync pipeline — unaffected

## Migration Strategy

1. Add Dolt query for unreviewed warrant counts per plant to `fetchPlantList`
2. Add `unreviewedWarrants` column to `PlantListRow` type
3. Display as badge/column in plant browser table
4. Add sort option for unreviewed warrant count (descending)
5. Add filter toggle: "Has unreviewed warrants"

## Files Modified

### Modified Files
- `admin/src/lib/queries/plants.ts` — add unreviewed warrant count to plant list query
- `admin/src/app/plants/page.tsx` — add column/badge and filter
- `admin/src/app/plants/plants-tabs.tsx` — if filtering lives here

## Verification

1. Run Trefle enrichment → 823 plants get warrants
2. Open `/plants` → see "New Evidence" column with counts
3. Sort by "New Evidence" descending → plants with most warrants appear first
4. Click into a plant → see warrant badges on attributes
5. Review and include/exclude warrants → unreviewed count decreases
6. After full review, plant shows 0 in the "New Evidence" column
