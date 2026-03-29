# Research Agent

**Genkit Flow:** `researchConflictFlow` | **Source:** `genkit/src/flows/researchConflictFlow.ts`
**Priority:** P0 — Required for evidence-informed conflict resolution
**Model:** `MODELS.quality` (`anthropic/claude-sonnet-4-6`)
**Prompt:** `genkit/src/prompts/research-conflict.md`

## Role

Gathers evidence to help admins understand why sources agree or disagree about a plant+attribute. Uses two complementary sources:

1. **Structured metadata** — DATA-DICTIONARY.md and README.md per dataset (rating scales, methodology, geographic scope)
2. **Document intelligence** — PageIndex JSON trees for 47 knowledge-base documents (navigates to relevant sections, reads summaries of methodology, appendices, plant lists)

**Does:**
- Read DATA-DICTIONARY.md files to understand rating scales, methodology, and geographic scope
- Read README.md files to understand source citations, data quality notes, and limitations
- Navigate PageIndex trees to find relevant sections in the 47 indexed knowledge-base PDFs
- Cross-reference the production ATTRIBUTE-REGISTRY.md and SOURCE-REGISTRY.md for context
- Provide structured evidence reports that help the admin make informed curation decisions
- Find evidence that supports or contradicts specific warrants

**Does NOT:**
- Make curation decisions
- Rank warrants (specialists do that)
- Synthesize claims (Synthesis Agent does that)

## System Prompt

```
You are a research agent with access to structured metadata for 40+ plant datasets AND navigable document indexes for 47 knowledge-base PDFs. When a specialist agent or admin needs evidence to evaluate a conflict, you search both sources and return findings.

YOUR APPROACH:
1. Identify which source datasets are involved in the conflict
2. Read each dataset's DATA-DICTIONARY.md for rating scale definitions, column meanings, and merge guidance
3. Read each dataset's README.md for source citation, methodology, geographic scope, and data quality notes
4. Search the PageIndex manifest for relevant documents (fire resistance papers, deer studies, extension guides)
5. Navigate relevant PageIndex trees to find sections about the plant, attribute, or methodology in question
6. Compare methodologies: was this rating from lab testing, literature review, field observation, or expert opinion?
7. Assess geographic applicability: does this source cover the target region?
8. Note temporal context: when was this data published? Is it superseded?
9. Return a structured evidence report combining metadata AND document findings

RULES:
- Always cite the specific dataset AND document section. Never present a finding without attribution.
- When citing PageIndex findings, include the document name, section title, and node_id for traceability.
- If no relevant metadata or documents exist, say so clearly. Don't fabricate context.
- Distinguish between empirical findings and expert opinion.
- Note when a rating scale definition is ambiguous or undefined.
- PageIndex summaries are AI-generated from the original PDFs — note this provenance.
```

## Tools

| Tool | Description |
|------|-------------|
| `getDatasetContext` | Loads DATA-DICTIONARY.md + README.md for a specified dataset folder. Returns rating scales, methodology, geographic scope. |
| `searchDocumentIndex` | **PageIndex search.** Loads `knowledge-base/indexes/manifest.json`, finds relevant documents by keyword match on doc_name and section titles/summaries. Returns matching sections with summaries. |
| `navigateDocumentTree` | **PageIndex deep read.** Given a specific document index file and node_id, returns that section's full summary and all children. Used to drill into a specific part of a document. |


The flow resolves dataset folders, loads context for both sources, searches the document index (5 hits), then navigates the top 3 hits deeper via `navigateDocumentTree`. Returns structured `datasetFindings` and `documentFindings` arrays in addition to the standard verdict/recommendation/analysis/confidence. Appends findings JSON to `specialist_analysis` in DB.

### PageIndex Tool Details

**`searchDocumentIndex`** implementation:
```typescript
// 1. Load manifest.json → list of 47 indexed documents
// 2. For each document, load its _structure.json
// 3. Search section titles and summaries for keywords
//    (plant name, attribute name, methodology terms)
// 4. Return top N matching sections with:
//    - doc_name, section title, node_id, page range, summary
// 5. Agent can then call navigateDocumentTree for deeper exploration
```

**`navigateDocumentTree`** implementation:
```typescript
// 1. Load specific _structure.json file
// 2. Find node by node_id
// 3. Return: title, summary, page range, and all children summaries
// This lets the agent "drill down" into an appendix or subsection
```

**PageIndex tree structure** (each `_structure.json`):
```json
{
  "doc_name": "Bethke-UCCE_...2016.pdf",
  "structure": [
    {
      "title": "California Fire-Resistant Plant List Database Sources",
      "start_index": 20,   // page 20
      "end_index": 30,     // page 30
      "node_id": "0011",
      "summary": "Appendix II: compilation of 53 publications...",
      "children": [...]    // nested subsections
    }
  ]
}
```

## Input Schema

```typescript
const ResearchInput = z.object({
  conflictId: z.string().optional(),
  plantName: z.string(),
  attribute: z.string(),
  question: z.string(), // e.g., "Why do FIRE-01 and FIRE-02 disagree about fire resistance?"
  warrantContext: z.array(z.object({
    sourceDataset: z.string(), // folder name, e.g., "FirePerformancePlants"
    sourceId: z.string(),      // e.g., "FIRE-01"
    value: z.string(),
    methodology: z.string().optional(),
  })).optional(),
});
```

## Output Schema

```typescript
const ResearchOutput = z.object({
  query: z.string(),

  // From DATA-DICTIONARY context
  datasetFindings: z.array(z.object({
    sourceDataset: z.string(),
    sourceId: z.string(),
    ratingScale: z.string(),
    methodology: z.string(),
    geographicScope: z.string(),
    publicationYear: z.string(),
    dataQualityNotes: z.string(),
    relevantExcerpt: z.string(),
  })),

  // From PageIndex document search
  documentFindings: z.array(z.object({
    documentName: z.string(),
    sectionTitle: z.string(),
    nodeId: z.string(),
    pageRange: z.string(),        // e.g., "pp. 20-30"
    finding: z.string(),          // summarized finding from section
    supportsWarrant: z.string().optional(), // "A", "B", "BOTH", "NEITHER"
    confidence: z.number().min(0).max(1),
  })),

  comparison: z.string(),       // why the sources disagree
  recommendation: z.string(),   // which source is likely more applicable and why
  evidenceGaps: z.array(z.string()),
});
```

## Domain Knowledge

- All dataset `DATA-DICTIONARY.md` files — rating scales, column definitions, methodology
- All dataset `README.md` files — source citations, geographic scope, data quality
- `knowledge-base/indexes/manifest.json` — index of 47 navigable document trees
- `knowledge-base/indexes/*_structure.json` — individual document trees
- `LivingWithFire-DB/api-reference/ATTRIBUTE-REGISTRY.md` — production attribute tree
- `LivingWithFire-DB/api-reference/SOURCE-REGISTRY.md` — production source metadata
- `data-sources/LITERATURE-REFERENCES-SEARCH.csv` — 195 cataloged references

## Example

**Query:** "Why do FIRE-01 and FIRE-02 disagree about Juniperus scopulorum fire resistance?"

**Output:**
```json
{
  "datasetFindings": [
    {
      "sourceDataset": "FirePerformancePlants",
      "sourceId": "FIRE-01",
      "ratingScale": "1-4: Firewise (1) to NOT Firewise (4)",
      "methodology": "Literature-based compilation by SREF",
      "geographicScope": "Southeastern US focus",
      "publicationYear": "~2010",
      "dataQualityNotes": "Broad scope, not field-validated",
      "relevantExcerpt": "Juniperus scopulorum rated NOT Firewise (4), LZ3"
    },
    {
      "sourceDataset": "IdahoFirewise",
      "sourceId": "FIRE-02",
      "ratingScale": "4-tier: Highly Resistant to Not Recommended",
      "methodology": "Practitioner guide, field observation",
      "geographicScope": "Idaho and Intermountain West",
      "publicationYear": "Updated periodically",
      "dataQualityNotes": "Includes planting distances",
      "relevantExcerpt": "Juniperus scopulorum: Not Recommended, 100+ ft setback"
    }
  ],
  "documentFindings": [
    {
      "documentName": "UC-ForestProductsLab_Defensible-Space-Landscaping-WUI_1997.pdf",
      "sectionTitle": "Fire-Prone Plant Lists",
      "nodeId": "0005",
      "pageRange": "pp. 8-12",
      "finding": "Junipers generally classified as highly flammable due to volatile oils and dense foliage. Multiple references cite junipers as fire hazards in WUI settings.",
      "supportsWarrant": "BOTH",
      "confidence": 0.9
    },
    {
      "documentName": "Bethke-UCCE_Literature-Review-Plant-Flammability-Fire-Resistant-Lists_2016.pdf",
      "sectionTitle": "Appendix II: California Fire-Resistant Plant Lists Database Sources",
      "nodeId": "0011",
      "pageRange": "pp. 20-30",
      "finding": "Multiple California plant lists (refs 7, 24, 37) consistently exclude or flag junipers. Methodology varies but consensus is clear.",
      "supportsWarrant": "BOTH",
      "confidence": 0.85
    }
  ],
  "comparison": "Both sources AGREE — Juniperus scopulorum is NOT fire-resistant. The apparent disagreement is actually different scales expressing the same conclusion. FIRE-01 gives the lowest rating (4=NOT Firewise) and FIRE-02 says Not Recommended with 100ft setback. Document evidence from UC Forest Products Lab and Bethke confirms junipers are consistently flagged as fire hazards across 53 California sources.",
  "recommendation": "No true conflict. Both sources and independent document evidence consistently rate Juniperus scopulorum as fire-hazardous. FIRE-02 adds the actionable 100ft planting distance.",
  "evidenceGaps": ["No experimental flammability data (NIST tested 34 shrubs but not this species)"]
}
```

## Failure Modes

| Failure | Handling |
|---------|----------|
| No DATA-DICTIONARY.md for a source | Report methodology undocumented; lower confidence |
| Rating scale not defined in dictionary | Report ambiguity; flag for admin |
| No PageIndex match for plant/attribute | Report only dataset findings; note document gap |
| PageIndex summary is vague/unhelpful | Note low confidence; recommend admin check original PDF |
| Multiple datasets map to same source_id | Cross-reference all and report combined context |
| Index tree has no relevant sections | Search broader terms (genus instead of species, category instead of specific attribute) |
