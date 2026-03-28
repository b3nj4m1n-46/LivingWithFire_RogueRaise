# Claim/Warrant Data Model

## Overview

Five tables extend the production EAV schema to support the evidence curation workflow:

1. **warrants** — Source evidence for plant attributes (the raw claims from each source)
2. **conflicts** — Detected disagreements between warrants
3. **claims** — Finalized production values synthesized from curated warrants
4. **claim_warrants** — Junction table linking claims to their supporting warrants
5. **analysis_batches** — Tracking which datasets have been analyzed

These tables live in Dolt alongside the mirrored production tables.

### Conceptual Model

```
Source Dataset → Warrants (raw evidence from each source)
                    ↓
              Conflict Classifier (detects disagreements)
                    ↓
              Specialist Agents (annotate conflicts)
                    ↓
              Admin curates warrants (selects evidence)
                    ↓
              Synthesis Agent (merges selected warrants)
                    ↓
              Claim (finalized production value)
                    ↓
              Production values table (via Dolt commit)
```

---

## Table: `warrants`

A warrant is a single piece of evidence from a single source about a single plant+attribute. Every data point that enters the system starts as a warrant, whether it comes from an existing production value or a new source dataset.

```sql
CREATE TABLE warrants (
  id                    VARCHAR(36) PRIMARY KEY,
  warrant_type          ENUM('existing', 'external', 'research') NOT NULL,
  status                ENUM('unreviewed', 'included', 'excluded', 'flagged') DEFAULT 'unreviewed',

  -- What plant+attribute this warrant is about
  plant_id              VARCHAR(36) NOT NULL,        -- FK to plants.id
  plant_genus           VARCHAR(255),                -- denormalized for display
  plant_species         VARCHAR(255),
  attribute_id          VARCHAR(36) NOT NULL,        -- FK to attributes.id
  attribute_name        VARCHAR(255),                -- denormalized for display

  -- The evidence
  value                 TEXT NOT NULL,               -- normalized value for comparison
  source_value          TEXT,                        -- original value as it appeared in source
  value_context         TEXT,                        -- additional qualifiers (e.g., "with proper maintenance")

  -- Source provenance
  source_id             VARCHAR(36),                 -- FK to sources.id (for existing production values)
  source_dataset        VARCHAR(100),                -- folder name: 'FirePerformancePlants'
  source_id_code        VARCHAR(20),                 -- source ID: 'FIRE-01'
  source_file           VARCHAR(255),                -- 'plants.csv'
  source_row            INT,                         -- row number in source file
  source_column         VARCHAR(100),                -- column name in source file

  -- Source metadata (cached from DATA-DICTIONARY.md for display)
  source_methodology    TEXT,                        -- how this source determined the value
  source_region         VARCHAR(255),                -- geographic scope
  source_year           VARCHAR(10),                 -- publication year
  source_reliability    VARCHAR(50),                 -- methodology tier (experimental, field, literature, etc.)

  -- Taxonomy match (how we linked to production plant)
  match_method          ENUM('exact', 'synonym', 'cultivar', 'genus_only', 'fuzzy') DEFAULT 'exact',
  match_confidence      DECIMAL(3,2),

  -- Agent annotations (populated by specialist agents)
  conflict_ids          TEXT,                        -- JSON array of conflict IDs this warrant is involved in
  specialist_notes      TEXT,                        -- annotations from conflict specialist agents
  research_findings     TEXT,                        -- findings from Research Agent
  research_citations    TEXT,                        -- knowledge-base document references

  -- Admin curation
  admin_notes           TEXT,                        -- admin's notes on this warrant
  curated_by            VARCHAR(100),
  curated_at            TIMESTAMP,

  -- Tracking
  batch_id              VARCHAR(36),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_plant (plant_id),
  INDEX idx_attribute (attribute_id),
  INDEX idx_dataset (source_dataset),
  INDEX idx_plant_attr (plant_id, attribute_id)
);
```

### Warrant Types

| Type | Origin | Example |
|------|--------|---------|
| `existing` | Already in production `values` table | "Flammability: Consider" from City of Ashland |
| `external` | From a LivinWitFire source dataset | "Firewise (1)" from FirePerformancePlants |
| `research` | Found by Research Agent in knowledge-base | "Moderate flammability under controlled conditions" from a PDF |

---

## Table: `conflicts`

Links pairs of warrants that disagree. A single warrant can be in multiple conflicts (e.g., Warrant A conflicts with both Warrant B and Warrant C).

```sql
CREATE TABLE conflicts (
  id                    VARCHAR(36) PRIMARY KEY,
  conflict_type         VARCHAR(50) NOT NULL,        -- from CONFLICT-TAXONOMY.md
  conflict_mode         ENUM('internal', 'external', 'cross_source') NOT NULL,
  severity              ENUM('critical', 'moderate', 'minor') DEFAULT 'moderate',
  status                ENUM('pending', 'annotated', 'resolved', 'dismissed') DEFAULT 'pending',

  -- The disagreeing warrants
  warrant_a_id          VARCHAR(36) NOT NULL,        -- FK to warrants.id
  warrant_b_id          VARCHAR(36) NOT NULL,        -- FK to warrants.id

  -- Context (denormalized for display)
  plant_id              VARCHAR(36) NOT NULL,
  plant_name            VARCHAR(255),
  attribute_name        VARCHAR(255),
  value_a               TEXT,
  value_b               TEXT,
  source_a              VARCHAR(255),
  source_b              VARCHAR(255),

  -- Classifier output
  classifier_explanation TEXT,                       -- from Conflict Classifier Agent

  -- Specialist output (populated when specialist reviews)
  specialist_agent      VARCHAR(50),                 -- which specialist flow processed this
  specialist_verdict    ENUM('REAL', 'APPARENT', 'NUANCED'),
  specialist_analysis   TEXT,                        -- full specialist explanation
  specialist_recommendation ENUM('PREFER_A', 'PREFER_B', 'KEEP_BOTH', 'KEEP_BOTH_WITH_CONTEXT', 'NEEDS_RESEARCH', 'HUMAN_DECIDE'),

  -- Tracking
  batch_id              VARCHAR(36),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  annotated_at          TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_plant (plant_id),
  INDEX idx_severity (severity),
  INDEX idx_type (conflict_type),
  INDEX idx_warrant_a (warrant_a_id),
  INDEX idx_warrant_b (warrant_b_id)
);
```

### Conflict Modes

| Mode | Warrant A | Warrant B |
|------|-----------|-----------|
| `internal` | Existing production value | Another existing production value |
| `external` | Existing production value | New warrant from LivinWitFire dataset |
| `cross_source` | Warrant from dataset X | Warrant from dataset Y |

---

## Table: `claims`

A claim is the finalized production value — the result of curating warrants and synthesizing them into a single authoritative data point.

```sql
CREATE TABLE claims (
  id                    VARCHAR(36) PRIMARY KEY,
  status                ENUM('draft', 'approved', 'pushed', 'reverted') DEFAULT 'draft',

  -- What this claim is about
  plant_id              VARCHAR(36) NOT NULL,
  attribute_id          VARCHAR(36) NOT NULL,
  plant_name            VARCHAR(255),
  attribute_name        VARCHAR(255),

  -- The synthesized value
  categorical_value     TEXT,                        -- if attribute expects a category
  synthesized_text      TEXT NOT NULL,               -- full synthesis with citations
  suggested_notes       TEXT,                        -- additional context for production notes
  confidence            ENUM('HIGH', 'MODERATE', 'LOW') NOT NULL,
  confidence_reasoning  TEXT,

  -- What it replaces (if updating existing)
  previous_value        TEXT,                        -- existing production value
  previous_source       VARCHAR(255),
  changes_description   TEXT,                        -- human-readable diff

  -- Synthesis provenance
  synthesis_prompt       TEXT,                       -- the prompt sent to Synthesis Agent
  synthesis_model        VARCHAR(50),                -- which model generated this
  warrant_count          INT,                        -- how many warrants were included

  -- Admin review
  approved_by           VARCHAR(100),
  approved_at           TIMESTAMP,
  approval_notes        TEXT,
  edited_value          TEXT,                        -- if admin modified the synthesis

  -- Dolt tracking
  dolt_commit_hash      VARCHAR(64),                 -- commit when approved
  pushed_to_production  BOOLEAN DEFAULT FALSE,
  pushed_at             TIMESTAMP,

  -- Tracking
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_plant (plant_id),
  INDEX idx_attribute (attribute_id),
  INDEX idx_plant_attr (plant_id, attribute_id)
);
```

---

## Table: `claim_warrants`

Junction table linking claims to the warrants that support them. Preserves the complete evidence chain.

```sql
CREATE TABLE claim_warrants (
  id                    VARCHAR(36) PRIMARY KEY,
  claim_id              VARCHAR(36) NOT NULL,        -- FK to claims.id
  warrant_id            VARCHAR(36) NOT NULL,        -- FK to warrants.id
  inclusion_reason      TEXT,                        -- why admin included this warrant

  INDEX idx_claim (claim_id),
  INDEX idx_warrant (warrant_id),
  UNIQUE KEY uq_claim_warrant (claim_id, warrant_id)
);
```

---

## Table: `analysis_batches`

Tracks each analysis run for auditability.

```sql
CREATE TABLE analysis_batches (
  id                    VARCHAR(36) PRIMARY KEY,
  source_dataset        VARCHAR(100) NOT NULL,
  source_id_code        VARCHAR(20) NOT NULL,
  batch_type            ENUM('internal_scan', 'external_analysis', 'cross_source', 'bulk_enhance') NOT NULL,

  -- Progress
  started_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at          TIMESTAMP,
  status                ENUM('running', 'completed', 'failed') DEFAULT 'running',

  -- Results
  total_source_records  INT,
  plants_matched        INT,
  plants_unmatched      INT,
  warrants_created      INT,
  conflicts_detected    INT,
  claims_generated      INT,

  -- Agent metadata
  agent_model           VARCHAR(50),
  agent_flows_used      TEXT,                        -- JSON array of which Genkit flows ran
  taxonomy_stats        TEXT,                        -- JSON: match method distribution
  notes                 TEXT,
  dolt_commit_hash      VARCHAR(64),

  INDEX idx_dataset (source_dataset),
  INDEX idx_status (status)
);
```

---

## Example: Full Claim/Warrant Lifecycle

### Step 1: Warrants Created (from Bulk Enhance + Existing)

Three warrants exist for Ceanothus velutinus + Flammability:

```json
[
  {
    "id": "w-001",
    "warrant_type": "existing",
    "value": "Consider",
    "source_dataset": "CityOfAshland",
    "source_methodology": "Municipal fire zone guidelines",
    "source_region": "Ashland, OR"
  },
  {
    "id": "w-002",
    "warrant_type": "external",
    "value": "Firewise (1)",
    "source_dataset": "FirePerformancePlants",
    "source_id_code": "FIRE-01",
    "source_methodology": "Literature-based rating, SREF",
    "source_region": "Southeast US"
  },
  {
    "id": "w-003",
    "warrant_type": "external",
    "value": "Moderately Resistant, 50ft setback",
    "source_dataset": "IdahoFirewise",
    "source_id_code": "FIRE-02",
    "source_methodology": "Regional practitioner guide",
    "source_region": "Idaho/Intermountain West"
  }
]
```

### Step 2: Conflict Detected

Conflict Classifier finds w-001 ("Consider") vs w-002 ("Firewise (1)") — different scales, potential disagreement.

```json
{
  "id": "c-001",
  "conflict_type": "SCALE_MISMATCH",
  "severity": "moderate",
  "warrant_a_id": "w-001",
  "warrant_b_id": "w-002",
  "classifier_explanation": "Different rating scales. Ashland uses Consider/Unsuitable, SREF uses 1-4 numeric."
}
```

### Step 3: Specialist Annotates

Rating Conflict Agent analyzes and updates the conflict:

```json
{
  "specialist_verdict": "APPARENT",
  "specialist_analysis": "After crosswalk normalization, both support fire-resistance. Ashland 'Consider' = appropriate for zones 2-3. SREF 'Firewise (1)' = highest fire resistance. Idaho 'Moderately Resistant' adds setback guidance. All three are compatible when scope is considered.",
  "specialist_recommendation": "KEEP_BOTH_WITH_CONTEXT"
}
```

### Step 4: Admin Curates Warrants

Admin reviews all three warrants and selects all of them for inclusion:
- w-001 ✅ (local Ashland data — most regionally specific)
- w-002 ✅ (highest rating — adds confidence)
- w-003 ✅ (adds actionable setback guidance)

### Step 5: Synthesis Agent Produces Claim

```json
{
  "id": "claim-001",
  "categorical_value": "Firewise",
  "synthesized_text": "Fire-resistant (high confidence, 3 sources). City of Ashland guidelines rate as 'Consider' for fire zones 2-3. SREF Fire Performance database gives highest fire resistance rating (Firewise 1). Idaho Firewise rates as Moderately Resistant with recommended 50ft setback from structures. All sources agree on favorable fire performance with appropriate spacing and maintenance.",
  "confidence": "HIGH",
  "confidence_reasoning": "Three independent sources from different regions and methodologies all support fire-resistant classification.",
  "warrant_count": 3
}
```

### Step 6: Admin Approves → Dolt Commit → Production Push

The claim becomes the production value for Ceanothus velutinus + Flammability, with full provenance tracing back through claim_warrants → warrants → source datasets.

---

## Example: New Plant Proposal

When a source has a plant not in production, it enters as warrants without a plant_id match. The admin flow is:

1. Matcher reports `match_method: 'new'` → warrant created with `plant_id = NULL`
2. Admin reviews → confirms new plant should be added
3. Plant created in production → warrant updated with new plant_id
4. Warrant becomes the first evidence for this plant's attributes
5. Subsequent sources matched to this plant add more warrants

```json
{
  "id": "w-100",
  "warrant_type": "external",
  "plant_id": null,
  "plant_genus": "Salvia",
  "plant_species": "apiana",
  "attribute_name": "Water Requirements",
  "value": "Very Low",
  "source_dataset": "WUCOLS",
  "source_id_code": "WATER-01",
  "match_method": "new",
  "match_confidence": 0.0,
  "specialist_notes": "Not in production. Found in 3 source datasets: WUCOLS (water), XercesPollinator (pollinator value), CalIPC (not listed = not invasive). Strong candidate for addition."
}
```
