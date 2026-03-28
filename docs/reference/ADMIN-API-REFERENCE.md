# Admin Portal API Reference

**Base URL:** `http://localhost:3000` (development)
**Authentication:** None (local admin tool)
**Database:** DoltgreSQL (`lwf_staging`)

All endpoints are Next.js Route Handlers served from `admin/src/app/api/`.

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/api/warrants/{id}` | Update warrant curation status |
| `POST` | `/api/synthesize` | Generate claim synthesis from warrants (stub) |
| `POST` | `/api/claims/approve` | Approve a claim with Dolt version control |
| `GET` | `/api/conflicts/{id}` | Get conflict detail with both warrants |
| `PATCH` | `/api/conflicts/{id}` | Update conflict status |
| `POST` | `/api/conflicts/{id}/research` | Fetch research context for a conflict |
| `POST` | `/api/conflicts/batch` | Batch update conflict statuses |

---

## `PATCH /api/warrants/{id}`

Update the curation status of a single warrant. Used by the warrant card checkbox in the claim view UI.

**Source:** `admin/src/app/api/warrants/[id]/route.ts`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Warrant UUID |

### Request Body

```json
{
  "status": "included"
}
```

| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| `status` | `string` | Yes | `included`, `excluded`, `unreviewed`, `flagged` |

### Response — 200 OK

```json
{
  "id": "a1b2c3d4-...",
  "status": "included"
}
```

### Errors

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "error": "Invalid status..." }` | Status not in allowed values |
| `404` | `{ "error": "Warrant not found" }` | No warrant with that ID |
| `500` | `{ "error": "Failed to update warrant" }` | Database error |

### Side Effects

- Sets `warrants.curated_at = NOW()` on the updated row.

---

## `POST /api/synthesize`

Request AI synthesis of selected warrants into a claim. Currently returns a **stub response** — the real implementation will connect to the Genkit `synthesizeClaimFlow` in Phase 4.

**Source:** `admin/src/app/api/synthesize/route.ts`

### Request Body

```json
{
  "plantId": "uuid-string",
  "attributeId": "uuid-string",
  "warrantIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plantId` | `string` | Yes | Plant UUID |
| `attributeId` | `string` | Yes | Attribute UUID |
| `warrantIds` | `string[]` | Yes | UUIDs of warrants to synthesize |

### Response — 200 OK (Stub)

```json
{
  "synthesized_text": "Synthesis pending — 3 warrant(s) selected for uuid. Connect synthesizeClaimFlow in Phase 4 to generate AI synthesis.",
  "categorical_value": null,
  "confidence": "MODERATE",
  "confidence_reasoning": "Stub — AI synthesis not yet implemented. This placeholder will be replaced by the Genkit synthesizeClaimFlow."
}
```

### Future Response Shape (Phase 4)

When connected to the synthesis agent, the response will follow the same shape but with real AI-generated content:

| Field | Type | Description |
|-------|------|-------------|
| `synthesized_text` | `string` | Full synthesis with citations referencing warrant sources |
| `categorical_value` | `string \| null` | Normalized value if attribute expects a category |
| `confidence` | `string` | `HIGH`, `MODERATE`, or `LOW` |
| `confidence_reasoning` | `string` | Explanation of confidence assessment |

### Errors

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "error": "Missing required fields..." }` | Missing plantId, attributeId, or warrantIds |
| `500` | `{ "error": "Failed to process synthesis request" }` | Unexpected error |

---

## `POST /api/claims/approve`

Create an approved claim record, link it to selected warrants via `claim_warrants`, and commit the changes to Dolt version control. This is the final step in the curation workflow.

**Source:** `admin/src/app/api/claims/approve/route.ts`

### Request Body

```json
{
  "plantId": "uuid-string",
  "attributeId": "uuid-string",
  "plantName": "Arbutus menziesii",
  "attributeName": "Fire Resistance",
  "warrantIds": ["uuid-1", "uuid-2"],
  "synthesizedText": "Based on FIRE-01 and WATER-01...",
  "categoricalValue": "High",
  "confidence": "HIGH",
  "confidenceReasoning": "Two independent sources agree...",
  "approvalNotes": "Both sources are Oregon-specific",
  "editedValue": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plantId` | `string` | Yes | Plant UUID |
| `attributeId` | `string` | Yes | Attribute UUID |
| `plantName` | `string` | No | Display name (denormalized) |
| `attributeName` | `string` | No | Display name (denormalized) |
| `warrantIds` | `string[]` | Yes | Non-empty array of included warrant UUIDs |
| `synthesizedText` | `string` | No | AI or manual synthesis text. Defaults to `"Approved with N warrant(s)"` |
| `categoricalValue` | `string` | No | Normalized value if attribute expects a category |
| `confidence` | `string` | No | `HIGH`, `MODERATE`, or `LOW`. Defaults to `MODERATE` |
| `confidenceReasoning` | `string` | No | Explanation of confidence level |
| `approvalNotes` | `string` | No | Admin's notes on this approval |
| `editedValue` | `string` | No | Override value if admin modified the synthesis |

### Response — 200 OK

```json
{
  "claimId": "generated-uuid",
  "commitHash": "abc123def456..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `claimId` | `string` | UUID of the created claim record |
| `commitHash` | `string` | Dolt commit hash for the approval |

### Errors

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "error": "Missing required fields..." }` | Missing plantId, attributeId, or empty warrantIds |
| `500` | `{ "error": "Failed to approve claim" }` | Database or Dolt commit error |

### Side Effects

This endpoint performs a multi-step write operation on a single database connection:

1. **INSERT `claims`** — new record with `status = 'approved'`, `approved_by = 'admin'`
2. **INSERT `claim_warrants`** — one junction row per selected warrant
3. **Dolt commit** — `dolt_add('.')` + `dolt_commit(...)` with message `"Approve claim: {plant} / {attribute}"`
4. **UPDATE `claims`** — stores `dolt_commit_hash` on the claim record
5. **Second Dolt commit** — commits the hash update

On failure, the route attempts `dolt_checkout('.')` to reset the working state.

### Implementation Note

Uses `pool.connect()` directly (not the `query()` helper) to ensure all Dolt operations run on the **same database connection** — required because `dolt_add` and `dolt_commit` are connection-scoped in DoltgreSQL.

---

## `GET /api/conflicts/{id}`

Fetch a single conflict's full details along with both associated warrants. Used by the expandable conflict row in the queue UI.

**Source:** `admin/src/app/api/conflicts/[id]/route.ts`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Conflict UUID |

### Response — 200 OK

```json
{
  "conflict": {
    "id": "uuid",
    "conflict_type": "RATING_DISAGREEMENT",
    "conflict_mode": "external",
    "severity": "critical",
    "status": "pending",
    "plant_id": "uuid",
    "plant_name": "Arbutus menziesii",
    "attribute_name": "Fire Resistance",
    "value_a": "High",
    "value_b": "Moderate",
    "source_a": "FIRE-01",
    "source_b": "FIRE-03",
    "specialist_verdict": null,
    "specialist_recommendation": null,
    "warrant_a_id": "uuid",
    "warrant_b_id": "uuid",
    "classifier_explanation": "Direct disagreement on fire resistance rating...",
    "specialist_agent": null,
    "specialist_analysis": null,
    "batch_id": "uuid",
    "annotated_at": null,
    "created_at": "2026-03-27T..."
  },
  "warrants": [
    { "id": "uuid", "warrant_type": "existing", "value": "High", "...": "..." },
    { "id": "uuid", "warrant_type": "external", "value": "Moderate", "...": "..." }
  ]
}
```

### Errors

| Status | Body | Cause |
|--------|------|-------|
| `404` | `{ "error": "Conflict not found" }` | No conflict with that ID |
| `500` | `{ "error": "Failed to fetch conflict" }` | Database error |

---

## `PATCH /api/conflicts/{id}`

Update the status of a single conflict. Used by the Resolve/Dismiss buttons in the expanded conflict row.

**Source:** `admin/src/app/api/conflicts/[id]/route.ts`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Conflict UUID |

### Request Body

```json
{
  "status": "resolved"
}
```

| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| `status` | `string` | Yes | `pending`, `annotated`, `resolved`, `dismissed` |

### Response — 200 OK

```json
{
  "id": "uuid",
  "status": "resolved"
}
```

### Errors

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "error": "Invalid status..." }` | Status not in allowed values |
| `404` | `{ "error": "Conflict not found" }` | No conflict with that ID |
| `500` | `{ "error": "Failed to update conflict" }` | Database error |

---

## `POST /api/conflicts/{id}/research`

Fetch read-only research context for a conflict: source dataset documentation (DATA-DICTIONARY.md, README.md) and keyword-matched knowledge base sections. No database writes.

**Source:** `admin/src/app/api/conflicts/[id]/research/route.ts`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Conflict UUID |

### Request Body

None required — the route looks up the conflict and its warrants to determine sources and search terms.

### Response — 200 OK

```json
{
  "datasetContexts": [
    {
      "sourceIdCode": "FIRE-01",
      "sourceDataset": "FirePerformancePlants",
      "dataDictionary": "# DATA-DICTIONARY\n...",
      "readme": "# FirePerformancePlants\n..."
    }
  ],
  "knowledgeBaseResults": [
    {
      "documentTitle": "Bethke-UCCE_Literature-Review.pdf",
      "sectionTitle": "Fire Resistance Rating Scales",
      "sectionSummary": "This section compares...",
      "nodeId": "0042"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `datasetContexts` | `array` | DATA-DICTIONARY.md and README.md content per source |
| `knowledgeBaseResults` | `array` | Up to 10 matching sections from 47 indexed knowledge base documents |

### Errors

| Status | Body | Cause |
|--------|------|-------|
| `404` | `{ "error": "Conflict not found" }` | No conflict with that ID |
| `500` | `{ "error": "Failed to fetch research context" }` | File read or parse error |

### Implementation Note

Reads files directly from `database-sources/` and `knowledge-base/indexes/` on the filesystem. Searches category folders (`fire/`, `deer/`, etc.) to locate the dataset by folder name. Knowledge base search uses keyword matching against pre-indexed structure JSON files.

---

## `POST /api/conflicts/batch`

Batch update the status of multiple conflicts at once. Used by the batch toolbar when conflicts are selected with checkboxes.

**Source:** `admin/src/app/api/conflicts/batch/route.ts`

### Request Body

```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"],
  "status": "dismissed"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | `string[]` | Yes | Non-empty array of conflict UUIDs |
| `status` | `string` | Yes | `pending`, `annotated`, `resolved`, or `dismissed` |

### Response — 200 OK

```json
{
  "updated": 3
}
```

| Field | Type | Description |
|-------|------|-------------|
| `updated` | `number` | Number of conflicts actually updated |

### Errors

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "error": "ids must be a non-empty array" }` | Missing or empty ids |
| `400` | `{ "error": "Invalid status..." }` | Status not in allowed values |
| `500` | `{ "error": "Failed to batch update conflicts" }` | Database error |

---

## Database Tables Referenced

These endpoints read from and write to the following DoltgreSQL tables. Full schema definitions are in `scripts/create_warrant_tables.sql`.

| Table | Operations | Description |
|-------|-----------|-------------|
| `warrants` | Read, Update | Source evidence records |
| `claims` | Insert, Update | Synthesized/approved claim records |
| `claim_warrants` | Insert | Junction table linking claims to warrants |
| `plants` | Read | Plant master data (via claim view queries) |
| `attributes` | Read | Attribute definitions (via claim view queries) |
| `"values"` | Read | Current production values (quoted — reserved word) |
| `conflicts` | Read, Update | Warrant conflict pairs — queue, detail, status updates |

See also: `docs/planning/PROPOSALS-SCHEMA.md` for the full data model.
