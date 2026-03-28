# Agent Profiles

This folder contains the specification for each AI agent in the Living With Fire Data Fusion system. Each profile defines the agent's role, system prompt, tools, input/output schemas, and domain knowledge.

## Agent Inventory

### Data Pipeline Agents
| Agent | Genkit Flow | Purpose |
|-------|------------|---------|
| [Matcher](matcher-agent.md) | `matchPlantFlow` | Match source plants to production plants via taxonomy resolution |
| [Schema Mapper](schema-mapper-agent.md) | `mapSchemaFlow` | Auto-suggest column mappings from source to production schema |
| [Bulk Enhancer](bulk-enhancer-agent.md) | `bulkEnhanceFlow` | Add new columns/attributes from source datasets to production |

### Conflict Detection & Classification
| Agent | Genkit Flow | Purpose |
|-------|------------|---------|
| [Conflict Classifier](conflict-classifier-agent.md) | `classifyConflictFlow` | Detect and classify conflicts by type, assign to specialist |

### Specialist Conflict Agents
| Agent | Genkit Flow | Conflict Type |
|-------|------------|---------------|
| [Rating Conflict](rating-conflict-agent.md) | `ratingConflictFlow` | Direct contradictions between rating scales |
| [Scope](scope-agent.md) | `scopeConflictFlow` | Geographic/regional applicability mismatches |
| [Temporal](temporal-agent.md) | `temporalConflictFlow` | Outdated vs current data |
| [Methodology](methodology-agent.md) | `methodologyConflictFlow` | Lab vs field vs literature review differences |
| [Definition](definition-agent.md) | `definitionConflictFlow` | Same term, different meanings across sources |
| [Taxonomy](taxonomy-agent.md) | `taxonomyConflictFlow` | Synonym/naming/reclassification issues |

### Synthesis & Research
| Agent | Genkit Flow | Purpose |
|-------|------------|---------|
| [Research](research-agent.md) | `researchConflictFlow` | Cross-reference DATA-DICTIONARY metadata for evidence (Phase 2: RAG over knowledge-base PDFs) |
| [Synthesis](synthesis-agent.md) | `synthesizeClaimFlow` | Merge selected warrants into a rich claim |

## Orchestration Flow

```
Source Dataset
    ↓
Schema Mapper → proposes column mappings → admin approves
    ↓
Matcher → links source plants to production plants
    ↓
Bulk Enhancer → creates warrants for new attribute values
    ↓
Conflict Classifier → detects & types each conflict
    ↓
Specialist Agent (dispatched by type) → researches & annotates
    ↓
Research Agent (if needed) → searches knowledge-base PDFs
    ↓
UI presents annotated warrants to admin
    ↓
Admin curates warrants → selects evidence
    ↓
Synthesis Agent → merges selected warrants into claim
    ↓
Admin finalizes → Dolt commit → production sync
```

## Profile Doc Structure

Each agent profile follows this format:
1. **Role** — What this agent does and doesn't do
2. **System Prompt** — The actual prompt template
3. **Tools** — Genkit tools the agent has access to
4. **Input Schema** — TypeScript/Zod schema for flow input
5. **Output Schema** — TypeScript/Zod schema for flow output
6. **Domain Knowledge** — What files/data the agent needs loaded into context
7. **Example Interactions** — Worked input/output examples
8. **Failure Modes** — What can go wrong and how to handle it
