# Living With Fire API Reference

**Base URL:** `https://lwf-api.vercel.app`
**Authentication:** None required for GET endpoints
**OpenAPI Spec:** `/api/v2/docs-raw` (saved locally as `openapi-spec.json`)

## Endpoints

### Core Plant Data

| Endpoint | Description |
|----------|-------------|
| `GET /api/v2/plants` | Paginated plant list. Params: `?search=`, `?limit=`, `?offset=`, `?includeImages=true` |
| `GET /api/v2/plants/{id}` | Single plant with all resolved values and images |
| `GET /api/v2/plants/{id}/images` | Plant images (primary marked via `isPrimary`) |
| `GET /api/v2/plants/{id}/risk-reduction` | Fire risk score and best practices |

### Attributes & Filtering

| Endpoint | Description |
|----------|-------------|
| `GET /api/v2/attributes/hierarchical` | Full attribute tree with UUIDs, value types, and allowed values |
| `GET /api/v2/filter-presets` | Pre-built filter configurations for UI |
| `GET /api/v2/values/bulk` | Batch values. Params: `?attributeIds=`, `?plantIds=` |

### Supporting Data

| Endpoint | Description |
|----------|-------------|
| `GET /api/v2/sources` | 103 research sources with citations and URLs |
| `GET /api/v2/key-terms` | Fire glossary definitions |
| `GET /api/v2/nurseries` | Local nurseries (Southern Oregon) |
| `GET /api/v2/resources` | Educational resource links |
| `GET /api/v2/risk-reduction-snippets` | Zone-specific landscaping guidance |
| `GET /api/v2/status` | API health check |

### Documentation

| Endpoint | Description |
|----------|-------------|
| `GET /api/v2/docs` | Interactive Swagger UI |
| `GET /api/v2/docs-raw` | OpenAPI 3.0 JSON spec |
| `GET /plant-fields.json` | All fields, attributes, allowed values |
| `GET /plant-fields` | Human-readable field guide |
| `GET /api-reference` | Searchable docs |

## Plant Detail Response Shape

```json
{
  "data": {
    "id": "UUID",
    "genus": "Abelia",
    "species": "(syn Linnaea) spp.",
    "subspeciesVarieties": null,
    "commonName": "Abelia",
    "urls": null,
    "notes": null,
    "lastUpdated": "2025-05-17T01:46:30.677Z",
    "images": [],
    "values": [
      {
        "id": "UUID",
        "attributeId": "UUID",
        "attributeName": "Home Ignition Zone (HIZ)",
        "plantId": "UUID",
        "rawValue": "03",
        "resolved": {
          "id": "03",
          "value": "10-30",
          "raw": "03",
          "type": "enum"
        },
        "sourceId": null,
        "sourceValue": null,
        "urls": null,
        "notes": null,
        "metadata": null
      }
    ]
  }
}
```

### Value Resolution

Values are stored as codes (`rawValue`) and resolved to human-readable form (`resolved`):
- `rawValue: "03"` → `resolved.value: "10-30"` (HIZ in feet)
- `rawValue: "true"` → boolean attribute flag
- `rawValue: "02"` → `resolved.value: "Moderate"` (various scales)

### Provenance Gap

**Current state:** Most values have `sourceId: null` — no provenance tracking.

**After admin portal:** Every value will trace to one or more warrants, each linked to a source with full citation, methodology, and document references. This is the core problem the Claim/Warrant model solves.

## Cached Reference Files

All saved locally in `api-reference/` for offline agent access:

| File | Contents |
|------|----------|
| `attributes-hierarchical.json` | Full attribute tree (125 attributes with UUIDs) |
| `sources.json` | All 103 data sources |
| `filter-presets.json` | 19 filter configurations |
| `key-terms.json` | 34 glossary terms |
| `nurseries.json` | 13 local nurseries |
| `openapi-spec.json` | Full OpenAPI 3.0 specification |
| `plant-fields.json` | Field definitions and allowed values |
| `risk-reduction-snippets.json` | 14 zone guidance texts |
| `sample-plant-list.json` | Sample paginated response |
| `sample-plant-detail.json` | Sample single plant with all values |
