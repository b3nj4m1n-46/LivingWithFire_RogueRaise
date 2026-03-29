# 030b — Coverage Dashboard UI

> **Status:** TODO
> **Priority:** P1 (important)
> **Depends on:** 030a (coverage & enrichment backend)
> **Blocks:** None

## Problem

Task 030a builds the backend APIs for coverage gap analysis and enrichment suggestions. This task adds the admin portal UI so users can visually explore which attributes have low coverage, which plants are least complete, and which source databases can fill the gaps — all without writing queries by hand.

## Current Implementation

### APIs available (built in 030a)
- `GET /api/coverage` — per-attribute coverage percentages
- `GET /api/coverage/:attributeId` — plants missing a specific attribute
- `GET /api/coverage/plants` — per-plant completeness scores
- `GET /api/enrichment` — enrichment summary (gaps + which sources can fill them)
- `GET /api/enrichment/:attributeId` — enrichment candidates for one attribute

### Existing UI patterns
- Dashboard at `admin/src/app/page.tsx` with summary cards (`admin/src/components/summary-cards.tsx`)
- Client components follow `*-client.tsx` naming pattern (e.g., `matrix-client.tsx`, `conflicts-client.tsx`)
- Server pages wrap client components with `page.tsx`
- UI uses shadcn/ui + base-ui component library

### What Does NOT Exist
- No coverage dashboard page
- No visual attribute coverage table
- No plant completeness view
- No enrichment opportunity browser
- No dashboard card for coverage gaps

## Proposed Changes

### New page: `admin/src/app/coverage/page.tsx` + `coverage-client.tsx`

Dashboard page with three views, switchable via tabs:

**Tab 1: Attribute Coverage**
- Table with columns: attribute name, category, coverage bar (% populated), plants with value, plants missing, enrichable count
- Sort by coverage % (worst first by default), also sortable by name or category
- Click row to expand/drill into that attribute's gap list (plants missing it)
- Color coding: <50% red, 50-80% yellow, >80% green
- Data source: `GET /api/coverage` + `GET /api/enrichment`

**Tab 2: Plant Completeness**
- Table with columns: plant name (genus + species), common name, completeness score (X/15), progress bar, missing attributes as tags/chips
- Sort by completeness (least complete first by default)
- Click row to see that plant's full attribute profile + which sources could enrich it
- Search/filter by plant name
- Data source: `GET /api/coverage/plants`

**Tab 3: Enrichment Opportunities**
- Grouped by source database: "FIRE-08 (OaklandFireSafe) could fill 31 flammability gaps"
- Each source card shows: source ID, source name, matched plant count, which attributes it covers
- Priority ranking: safety-critical attributes (flammability, deer resistance, water) ranked higher
- Expandable to see individual plant matches with source values
- Data source: `GET /api/enrichment`

### Dashboard integration

Modify `admin/src/app/page.tsx` to add a "Coverage Gaps" summary card:
- Show: "X attributes below 50% coverage"
- Show: "Y plants enrichable from existing sources"
- Link to `/coverage` page

### Navigation

Add "Coverage" item to sidebar/nav (wherever other pages like Sources, Claims, Conflicts are listed).

### What Does NOT Change

- All backend APIs (built in 030a) — consumed as-is
- Internal audit UI and workflows
- Existing dashboard cards (additive only)
- No auto-ingestion — enrichment view is informational, ingestion goes through existing fusion pipeline
- Existing page layouts and component patterns

## Migration Strategy

1. **Create coverage page shell** — `page.tsx` server component + `coverage-client.tsx` client component with tab layout
2. **Build Attribute Coverage tab** — table fetching from `/api/coverage`, with coverage bars and row expansion for gap drill-down
3. **Build Plant Completeness tab** — table fetching from `/api/coverage/plants`, with search and completeness bars
4. **Build Enrichment Opportunities tab** — grouped cards fetching from `/api/enrichment`, with expandable plant lists
5. **Add dashboard summary card** — coverage gap counts on main dashboard
6. **Add nav item** — "Coverage" link in sidebar

## Files Modified

### New Files
- `admin/src/app/coverage/page.tsx` — coverage dashboard server component
- `admin/src/app/coverage/coverage-client.tsx` — coverage dashboard client component (tabs, tables, cards)

### Modified Files
- `admin/src/app/page.tsx` — add coverage gap summary card to dashboard
- Sidebar/nav component — add "Coverage" nav item

## Verification

1. `/coverage` page loads without errors and shows three tabs
2. **Attribute Coverage tab**: table shows all non-calculated attributes sorted by lowest coverage; clicking a row shows the list of plants missing that attribute
3. **Plant Completeness tab**: table shows plants sorted by least complete; search filters by plant name; completeness scores match API response
4. **Enrichment Opportunities tab**: shows source databases grouped with match counts; expanding a source shows individual plant matches with source values
5. Dashboard card on `/` shows correct gap counts and links to `/coverage`
6. "Coverage" appears in sidebar nav and navigates correctly
