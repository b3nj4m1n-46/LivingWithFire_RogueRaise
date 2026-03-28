# Product Requirements Document: Living With Fire Data Fusion Admin Portal

## Problem Statement

The Living With Fire (LWF) application helps property owners in wildfire-prone areas select fire-resistant plants for landscaping. Its production database contains **1,361 plants** with **94,903 attribute values** drawn from **103 data sources**.

However, a parallel data collection effort has assembled **40 structured datasets** with **866,000+ plant records** from federal agencies, universities, extension services, and conservation organizations — covering fire resistance, deer resistance, water use, invasiveness, pollinators, native status, and taxonomy. These datasets overlap significantly with the production data but use **different schemas, different rating scales, and different methodologies**.

The core challenges:
1. **The production database has internal conflicts** — the same plant may have contradictory ratings from different sources already in the system, with no systematic way to detect or resolve them
2. **Enhancement data exists but can't be safely ingested** — without understanding how source schemas map to the production EAV structure, and without detecting where new data conflicts with existing data
3. **No audit trail** — when data changes, there's no record of who changed it, why, or what evidence supported the decision
4. **Unstructured research exists but isn't connected** — 52 research documents (PDFs, papers) in a knowledge base could inform conflict resolution but aren't queryable

## Product Overview

An admin portal that enables a data steward to systematically fuse disparate plant databases into the production LWF database through AI-assisted conflict detection, evidence curation, and version-controlled data management.

**This is the admin backend to the public-facing LWF app.** The refined database (the result of fusion, editing, and conflict resolution) and its staging area pushes to update the Neon production database that powers the public plant selector.

### The Claim/Warrant Model

The system uses an evidence-based reasoning framework inspired by argumentation theory:

- **Claim** = the final production database value for a plant+attribute (e.g., "Ceanothus velutinus is fire-resistant, suitable for HIZ 5-30ft"). This is what the public app displays.
- **Warrants** = individual source entries that support, contradict, or add nuance to the claim. Each warrant carries its own provenance: the source's value, methodology, geographic scope, and the original document.

The admin's job is **evidence curation** — they review all warrants for a claim, select which ones to include (even conflicting ones can coexist as context), and then AI synthesizes the selected warrants into a richer, more complete claim than any single source could provide.

This is fundamentally different from "pick A or B." A claim might draw from 4 warrants:
- Warrant 1 (FIRE-01): "Firewise (1)" — literature-based rating ✅ included
- Warrant 2 (FIRE-02): "Highly Resistant, plant 30ft from structures" — practitioner guide ✅ included
- Warrant 3 (FIRE-04): "Moderate flammability in controlled burn" — lab testing ✅ included (adds nuance)
- Warrant 4 (FIRE-07): "Fire-Resistant in 3+ sources" — meta-analysis ✅ included

**→ AI Synthesized Claim:** "Fire-resistant (high confidence, 4 sources). Lab testing showed moderate heat release under controlled conditions, but field sources consistently rate favorably for landscape use. Plant 30ft from structures per Idaho guidelines."

The provenance chain is complete: every word in the synthesized claim traces back to specific warrants, which trace back to specific sources, files, rows, and methodologies.

## User Persona

**Data Steward / Admin**
- Botanically knowledgeable but not necessarily a developer
- Responsible for data quality in the LWF database
- Needs to understand *why* data sources disagree, not just *that* they disagree
- Needs to make defensible decisions backed by evidence and provenance
- Needs to track their decisions for accountability

## User Stories

### Table Fusion
- As a data steward, I want to **view a source dataset's schema side-by-side with the production schema** so I can understand how they relate
- As a data steward, I want **AI to auto-suggest column mappings** based on DATA-DICTIONARY.md definitions so I don't have to manually interpret every field
- As a data steward, I want to **preview how records will merge** before committing them so I can catch problems early
- As a data steward, I want to **map source rating scales to production scales** with a visual crosswalk so ratings are comparable

### Conflict Detection
- As a data steward, I want to **scan the existing production database for internal conflicts** so I can clean up contradictions that already exist
- As a data steward, I want to **detect where new source data conflicts with production data** before ingesting it
- As a data steward, I want to **see conflicts between source datasets** to understand disagreements before any data touches production
- As a data steward, I want **conflicts prioritized by severity** (direct contradiction > scale mismatch > scope difference) so I focus on what matters most

### Fact Checking & Research
- As a data steward, I want **AI agents to research conflicts using the knowledge base** so I understand *why* sources disagree (methodology, region, date, definition)
- As a data steward, I want to **see the evidence trail for every claim** — which source, which page, which methodology — so I can evaluate reliability
- As a data steward, I want to **see what the DATA-DICTIONARY says about each source's rating system** so I understand the context behind a value

### Evidence Curation & Claim Resolution
- As a data steward, I want to **see all warrants for a claim** — every source that has something to say about a plant+attribute — so I have the full evidence picture
- As a data steward, I want to **select which warrants to include** in a claim, even when some conflict, because conflicting evidence can add nuance (e.g., "fire-resistant in landscape settings but moderate flammability under lab conditions")
- As a data steward, I want **AI to synthesize my selected warrants into a merged claim** that is richer and more detailed than any single source
- As a data steward, I want to **edit the AI-synthesized claim** before finalizing, because I may have domain knowledge the AI doesn't
- As a data steward, I want to **see which warrants support vs. contradict** the current production value so I can decide whether to update it
- As a data steward, I want **every finalized claim to trace back to its warrants** so the provenance chain is unbroken
- As a data steward, I want to **batch-curate similar claims** (e.g., process all fire ratings from a single source at once)
- As a data steward, I want **every curation decision tracked** with who decided, when, which warrants were included, and the AI synthesis prompt/output

### Source Collection
- As a data steward, I want to **add new data sources** through a guided workflow that creates the standard folder structure (Sources/, scripts/, README.md, DATA-DICTIONARY.md)
- As a data steward, I want **AI to draft DATA-DICTIONARY.md** from a new CSV so I don't have to manually document every column
- As a data steward, I want to **queue URLs for automated download and processing** so I can scale data collection

### Version Control & Audit
- As a data steward, I want **every change versioned in Dolt** so I can see the full history of the database
- As a data steward, I want to **revert bad changes** without losing the audit trail
- As a data steward, I want to **see who changed what and when** for any plant or attribute value
- As a data steward, I want **approved changes pushed to the production Neon database** only after explicit confirmation

## Feature Requirements

### P0 — Must Have for Hackathon Demo

1. **Internal Conflict Scanner** — Analyze the existing 94,903 values to find cases where the same plant has conflicting values for the same attribute from different sources. Display results with source provenance.

2. **Claim Curation Interface** — For each plant+attribute, show all warrants (source entries) as evidence cards. Admin selects/deselects warrants. AI synthesizes selected warrants into a merged claim. Admin can edit before finalizing. Full provenance chain preserved.

3. **External Enhancement Proposals** — For a given source dataset, match plants against production, identify new values, flag conflicts. Present as a reviewable queue.

4. **Dolt Versioning** — Every accepted change creates a Dolt commit. History viewable. Revert possible.

5. **Production Sync** — Push approved changes from Dolt staging to Neon production.

6. **Research Context Tools** — Agents read DATA-DICTIONARY.md per dataset + navigate 47 pre-indexed knowledge-base documents via PageIndex JSON trees. No vector store needed — keyword search over section titles/summaries with drill-down into specific sections.

### P1 — Should Have

6. **Table Fusion UI** — Visual schema mapping for new source datasets
7. **Batch Operations** — Accept/reject multiple similar conflicts at once
8. **Dashboard** — Overview of data quality: conflict counts, coverage gaps, pending proposals

### P2 — Nice to Have (Post-Hackathon)

9. **Source Collection Automation** — URL queue, auto-download, DATA-DICTIONARY generation
11. **Cross-Source Conflict Matrix** — Heatmap of which sources disagree most
12. **Confidence Scoring** — Weight source reliability based on methodology type
13. **Multi-User** — Authentication, role-based access, collaborative resolution

## Provenance Requirements

Every data point in the system must maintain an unbroken provenance chain:

| Stage | What's Tracked |
|-------|---------------|
| **Origin** | Source dataset, file, row, column |
| **Methodology** | How the value was determined (experimental, literature review, expert opinion) |
| **Processing** | Which agent processed it, which model, what reasoning |
| **Conflict** | What other sources say about the same claim |
| **Resolution** | Who decided, when, what evidence was cited, why |
| **Version** | Dolt commit hash, branch, timestamp |

## Success Criteria — Hackathon Demo

1. Show warrants gathered from multiple sources for a single plant+attribute
2. Show conflicting warrants highlighted with agent explanation of *why* they disagree
3. Show admin curating warrants — selecting which evidence to include
4. Show AI synthesizing selected warrants into a merged claim richer than any single source
5. Show the finalized claim committed to Dolt with a visible diff and full warrant provenance
6. Show the change pushed to production Neon database
7. Show the audit trail: claim → warrants → sources → original documents

## Relationship to Existing LWF App

```
Public Users → lwf-app.vercel.app → Neon PostgreSQL ← Dolt Staging ← Admin Portal
                                                                        ↑
                                                                   Data Steward
```

- The admin portal is a **separate application** from the public LWF app
- Both share the same **Neon PostgreSQL** production database
- The admin portal **never modifies production directly** — all changes go through Dolt staging first
- The public app is **read-only** from the database's perspective; the admin portal is the **write path**

## Extensibility

The framework is designed to extend to:
- **Other US regions** — add new source datasets for any state/bioregion
- **Additional hazard categories** — floods, wind, soil erosion — by adding new attributes to the EAV schema
- **Bioregion-specific demands** — different natural disaster profiles drive different data requirements
- **More source databases** — the DATA-DICTIONARY.md-driven mapping framework handles any new source without code changes
