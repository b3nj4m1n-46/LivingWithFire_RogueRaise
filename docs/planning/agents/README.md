# Agent Profiles

This folder contains the specification for each AI agent in the Living With Fire Data Fusion system. Each profile defines the agent's role, system prompt, tools, input/output schemas, and domain knowledge.

## Agent Inventory

### Data Pipeline Agents
| Agent | Genkit Flow | Model | Purpose |
|-------|------------|-------|---------|
| [Matcher](matcher-agent.md) | `matchPlantFlow` | `MODELS.bulk` (haiku-4-5) | Match source plants to production plants via 6-step taxonomy pipeline |
| [Schema Mapper](schema-mapper-agent.md) | `mapSchemaFlow` | `MODELS.quality` (sonnet-4-6) | Auto-suggest column mappings from source to production schema |
| [Bulk Enhancer](bulk-enhancer-agent.md) | `bulkEnhanceFlow` | None (no LLM) | Add new columns/attributes from source datasets to production |

### Conflict Detection & Classification
| Agent | Genkit Flow | Model | Purpose |
|-------|------------|-------|---------|
| [Conflict Classifier](conflict-classifier-agent.md) | `classifyConflictFlow` | `MODELS.bulk` (haiku-4-5) | Detect and classify conflicts by type, dispatch to specialists |

### Specialist Conflict Agents
| Agent | Genkit Flow | Model | Status | Conflict Type |
|-------|------------|-------|--------|---------------|
| [Rating Conflict](rating-conflict-agent.md) | `ratingConflictFlow` | `MODELS.quality` (sonnet-4-6) | LLM | Direct contradictions between rating scales |
| [Scope](scope-agent.md) | `scopeConflictFlow` | `MODELS.quality` (sonnet-4-6) | LLM | Geographic/regional applicability mismatches |
| [Temporal](temporal-agent.md) | `temporalConflictFlow` | `MODELS.bulk` (haiku-4-5) | LLM | Outdated vs current data |
| [Methodology](methodology-agent.md) | `methodologyConflictFlow` | None | **Stub** | Lab vs field vs literature review differences |
| [Definition](definition-agent.md) | `definitionConflictFlow` | None | **Stub** | Same term, different meanings across sources |
| [Taxonomy](taxonomy-agent.md) | `taxonomyConflictFlow` | `MODELS.bulk` (haiku-4-5) | LLM | Synonym/naming/reclassification (`GRANULARITY_MISMATCH`) |

### Synthesis & Research
| Agent | Genkit Flow | Model | Purpose |
|-------|------------|-------|---------|
| [Research](research-agent.md) | `researchConflictFlow` | `MODELS.quality` (sonnet-4-6) | Cross-reference dataset metadata + knowledge-base document indexes for evidence |
| [Synthesis](synthesis-agent.md) | `synthesizeClaimFlow` | `MODELS.quality` (sonnet-4-6) | Merge selected warrants into a rich claim |

### Model Assignments (from `genkit/src/config.ts`)
| Constant | Model | Used By |
|----------|-------|---------|
| `MODELS.bulk` | `anthropic/claude-haiku-4-5` | Matcher, Classifier, Taxonomy, Temporal specialists |
| `MODELS.quality` | `anthropic/claude-sonnet-4-6` | Schema Mapper, Rating, Scope, Research, Synthesis |

### Shared Types
The Rating Conflict flow (`ratingConflictFlow.ts`) defines and exports the shared `specialistInput` Zod schema and `SpecialistInput`/`SpecialistOutput` types used as the common input schema by all specialist flows. Prompt templates live in `genkit/src/prompts/`.

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
