# Matcher Agent

**Genkit Flow:** `matchPlantFlow`
**Priority:** P0 — Required for all operations

## Role

Matches plants from a source dataset to plants in the production database. This is the foundational step — nothing else works without reliable plant matching. The agent resolves taxonomic synonyms, handles genus-level vs species-level entries, and flags ambiguous matches for human review.

**Does:**
- Match by scientific name (genus + species)
- Resolve synonyms using POWO/WCVP and WorldFloraOnline taxonomy backbones
- Handle cultivar/variety variations (e.g., source has `Acer palmatum 'Bloodgood'`, production has `Acer palmatum`)
- Flag ambiguous matches (multiple candidates, genus-only matches)
- Identify unmatched source plants as candidates for new plant proposals

**Does NOT:**
- Match on common name alone (too unreliable)
- Make judgment calls about data quality
- Create warrants (that's the Bulk Enhancer's job)

## System Prompt

```
You are a plant taxonomy matching specialist. Your job is to match plants from a source dataset to the production Living With Fire database.

RULES:
1. Always match on scientific name (genus + species). Never match on common name alone.
2. If the source uses a synonym, resolve it using the POWO/WCVP or WorldFloraOnline taxonomy backbones.
3. Match confidence levels:
   - EXACT: genus + species match exactly
   - SYNONYM: matched via taxonomy backbone synonym resolution
   - GENUS_ONLY: source has genus-level entry (e.g., "Quercus spp."), production has species-level entries
   - CULTIVAR: source has cultivar, production has the base species (or vice versa)
   - AMBIGUOUS: multiple possible matches, needs human review
   - NONE: no match found — candidate for new plant proposal
4. For GENUS_ONLY matches, list all production species under that genus.
5. Never force a match. If uncertain, mark as AMBIGUOUS.
```

## Tools

| Tool | Description |
|------|-------------|
| `lookupProductionPlant` | Search production plants table by genus, species, or common name |
| `resolveSynonym` | Query POWO_WCVP and WorldFloraOnline for accepted name of a given scientific name |
| `fuzzyMatchName` | Levenshtein/phonetic matching for misspelled scientific names |

## Input Schema

```typescript
const MatchPlantInput = z.object({
  sourcePlants: z.array(z.object({
    sourceRowId: z.string(),
    scientificName: z.string(),
    commonName: z.string().optional(),
    sourceDataset: z.string(),
  })),
  batchSize: z.number().default(50),
});
```

## Output Schema

```typescript
const MatchPlantOutput = z.object({
  matches: z.array(z.object({
    sourceRowId: z.string(),
    sourceScientificName: z.string(),
    matchType: z.enum(["EXACT", "SYNONYM", "GENUS_ONLY", "CULTIVAR", "AMBIGUOUS", "NONE"]),
    productionPlantId: z.string().nullable(),
    productionName: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    synonymResolution: z.string().optional(), // e.g., "Source name X is a synonym of accepted name Y per POWO"
    alternativeCandidates: z.array(z.object({
      plantId: z.string(),
      name: z.string(),
      reason: z.string(),
    })).optional(),
  })),
  summary: z.object({
    total: z.number(),
    exact: z.number(),
    synonym: z.number(),
    genusOnly: z.number(),
    cultivar: z.number(),
    ambiguous: z.number(),
    none: z.number(),
  }),
});
```

## Domain Knowledge

- `POWO_WCVP/plants.csv` — 362,739 accepted species with synonyms
- `WorldFloraOnline/plants.csv` — 381,467 accepted species for cross-validation
- `USDA_PLANTS/plants.csv` — 93,157 US names with USDA symbols
- `LivingWithFire-DB/plants.csv` — the 1,361 target plants (genus + species)
- `LivingWithFire-DB/api-reference/EAV-QUERY-PATTERNS.md` — SQL patterns for querying plants

## Example Interaction

**Input:**
```json
{
  "sourcePlants": [
    {"sourceRowId": "FP-001", "scientificName": "Juniperus virginiana", "commonName": "Eastern red cedar", "sourceDataset": "FirePerformancePlants"},
    {"sourceRowId": "FP-002", "scientificName": "Arctostaphylos uva-ursi", "commonName": "Bearberry", "sourceDataset": "FirePerformancePlants"},
    {"sourceRowId": "FP-003", "scientificName": "Ceanothus spp.", "commonName": "California lilac", "sourceDataset": "FirePerformancePlants"}
  ]
}
```

**Output:**
```json
{
  "matches": [
    {
      "sourceRowId": "FP-001",
      "sourceScientificName": "Juniperus virginiana",
      "matchType": "EXACT",
      "productionPlantId": "abc-123",
      "productionName": "Juniperus virginiana",
      "confidence": 1.0
    },
    {
      "sourceRowId": "FP-002",
      "sourceScientificName": "Arctostaphylos uva-ursi",
      "matchType": "EXACT",
      "productionPlantId": "def-456",
      "productionName": "Arctostaphylos uva-ursi",
      "confidence": 1.0
    },
    {
      "sourceRowId": "FP-003",
      "sourceScientificName": "Ceanothus spp.",
      "matchType": "GENUS_ONLY",
      "productionPlantId": null,
      "productionName": null,
      "confidence": 0.6,
      "alternativeCandidates": [
        {"plantId": "ghi-789", "name": "Ceanothus velutinus", "reason": "Species under genus Ceanothus"},
        {"plantId": "jkl-012", "name": "Ceanothus sanguineus", "reason": "Species under genus Ceanothus"},
        {"plantId": "mno-345", "name": "Ceanothus cuneatus", "reason": "Species under genus Ceanothus"}
      ]
    }
  ]
}
```

## Failure Modes

| Failure | Handling |
|---------|----------|
| Source name has typo | `fuzzyMatchName` tool suggests corrections; flag as AMBIGUOUS |
| Genus reclassified since source publication | Taxonomy backbone resolves; note in `synonymResolution` |
| Source uses cultivar name not in production | Match to base species; mark as CULTIVAR |
| Production has duplicate entries for same species | Flag all candidates as AMBIGUOUS for human review |
