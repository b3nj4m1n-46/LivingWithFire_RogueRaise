# AI Collaboration Process — Spec-Driven Development

> How LivinWitFire uses structured task documents to drive reliable AI-assisted implementation.

## The Process

LivinWitFire development follows a two-phase workflow where **design and implementation are separated into distinct sessions**, connected by a task document (MD file) that serves as the handoff artifact.

### Phase 1: Design (Conversational Terminal)

A human-AI design session explores the problem space:

1. **Discuss** the feature, refactor, or fix — goals, constraints, tradeoffs
2. **Research** the existing codebase — read current implementations, identify patterns, surface dependencies
3. **Iterate** on the approach — debate alternatives, resolve edge cases, lock in decisions
4. **Write the task doc** — capture the agreed-upon design as a structured MD file in `docs/tasks/todo/`
5. **Review and refine** — read the doc together, fix inconsistencies, ensure completeness
6. **Commit** — the task doc enters version control as a first-class artifact

The design session is **divergent** — exploring options, questioning assumptions, changing direction. The task doc is the convergence point where ambiguity is resolved before any code is written.

### Phase 2: Implementation (Plan Mode Terminal)

A separate AI session executes the task doc:

1. **Read the task doc** — the agent ingests the full spec as its primary instruction
2. **Enter plan mode** — the agent reviews the codebase against the spec, produces an implementation plan
3. **Implement** — the agent writes code, following the spec's file plan, props interfaces, and architectural decisions
4. **Verify** — the agent checks its work against the spec's verification criteria
5. **Review and update the task doc** — the agent reconciles the doc against what was actually built, adds commit references
6. **Move to completed** — `docs/tasks/todo/` → `docs/tasks/completed/` with implementation details appended

### Phase 3: Accumulation

Completed task docs remain in the repository as permanent records. Over time, they form:

- **Decision history** — why specific choices were made, with commit receipts
- **Pattern precedent** — recurring approaches that future work should follow
- **Failure context** — what was tried and abandoned (stored separately in `docs/legacy/`)

## Why It Works

### 1. The task doc eliminates ambiguity at the point of execution

When an AI agent implements from casual conversation, it works from a lossy summary of intent — inferring meaning from conversational fragments. The task doc is an explicit, reviewed specification. Design debates have already happened. Edge cases are already resolved. The implementing agent isn't making design decisions — it's executing agreed-upon ones.

### 2. Forced reading before writing

Handing the agent a spec that references specific files, line counts, prop interfaces, and CSS classes forces it to read the codebase against the spec before writing code. Casual conversation tends to skip this — the agent starts writing based on assumptions before understanding current state. The spec anchors the agent to reality.

### 3. Bounded scope prevents drift

Casual conversation drifts. "Can you also..." and "while you're at it..." compound into sprawling change sets where the agent loses track of what it's doing. The task doc has a fixed scope — files to modify, verification criteria, explicit non-goals. The agent knows when it's done.

### 4. Two-phase thinking matches how good engineering works

Design and implementation are different cognitive modes. Design is divergent — exploring options, debating tradeoffs. Implementation is convergent — executing a known plan. Mixing them in one session produces half-designed, half-built results. Separating them into distinct sessions with a written handoff mirrors how experienced engineering teams operate.

### 5. The spec survives context window limits

In a long casual chat, early decisions get compressed or lost as the AI's context window fills. The task doc is a file on disk — the implementation agent reads it fresh, with every detail intact. Nothing is forgotten or summarized away.

### 6. The review cycle catches implementation drift

After implementing, the agent must reconcile the task doc against what it actually built. If it deviated — took a shortcut, missed a section, made a different architectural choice — that shows up in the review pass. The task doc becomes a test assertion for the implementation. Moving to `/completed` is the agent signing off that spec matches reality, with commit receipts.

## Why Completed Docs Compound in Value

### Decision provenance

Code tells you *what* was built. Git history tells you *when*. Completed task docs tell you *why specific design choices were made*. When a future agent suggests an approach that was already considered and rejected, the completed doc explains exactly why — anchored to a specific commit where the alternative was implemented instead.

### Pattern precedent prevents re-litigation

When designing a new workspace, agents reference how existing workspaces were built. Completed docs are the precedent. They turn individual decisions into institutional decisions — "we standardized on this pattern, here's why, here are the 3 workspaces already using it."

### Project-specific design language

Every completed doc is a worked example of how *this project* makes decisions. The more completed docs accumulate, the more context future agents have about project preferences — scope boundaries, component patterns, naming conventions, what gets lifted to workspace state vs. kept local. It's not generic best practices, it's LivinWitFire's best practices, derived from actual implementation experience.

### CLAUDE.md stays clean

The project guide (`CLAUDE.md`) stays at summary level. Completed task docs carry the full decision trees. Agents can go deep when they need context, skim when they don't. This creates a tiered knowledge system — summary in CLAUDE.md, detail in completed docs, cautionary history quarantined in legacy.

## Document Lifecycle

```
docs/tasks/todo/          ← Active specs, ready for implementation
docs/tasks/future/        ← Acknowledged but deferred — revisit when relevant
docs/tasks/completed/     ← Implemented, reviewed, with commit references
docs/legacy/              ← Deprecated approaches, failures, abandoned ideas
                            (excluded from AI context to prevent poisoning)
```

### Why Legacy Is Quarantined

Legacy docs exist for human reference when needed, but agents don't read them by default. An agent seeing an old approach in context can weight it as "this is how things are done here" even if it was explicitly abandoned. Active rules derived from failures (e.g., "never install torch-directml") live in `CLAUDE.md` or memory files — the constraint survives even though the backstory is quarantined.

## Task Doc Structure

A good task doc includes:

| Section | Purpose |
|---------|---------|
| **Status / Priority / Dependencies** | Sequencing and scope |
| **Problem** | Why this work exists |
| **Current Implementation** | What exists today (anchors to reality) |
| **Proposed Changes** | What to build, with specifics (file names, props, patterns) |
| **Migration Strategy** | Ordered steps to get from current → proposed |
| **Verification** | How to confirm it works (the agent's "definition of done") |
| **Reference** | Pointers to related docs and pattern templates |

The specificity matters. "Refactor the sidebar" is a conversation starter. "Extract `renderLeftSidebar()` (lines 1147-1208) to `modes/CanvasLeftSidebar.tsx`, using `.leftSidebar` from `WorkbenchWorkspace.module.css`, with these props: ..." is an executable specification.

## Task Doc Template

Copy this into `docs/tasks/todo/YOUR_TASK_NAME.md` and fill in:

````markdown
# Title — Brief Descriptive Subtitle

> **Status:** TODO | PLANNING | IN PROGRESS
> **Priority:** P0 (critical) | P1 (important) | P2 (normal) | P3 (polish)
> **Depends on:** What must be done first (or "None")
> **Blocks:** What can't start until this is done (or "None")

## Problem

Why this work exists. What's broken, missing, or suboptimal. Include specific symptoms — file paths, line numbers, error messages — not just vibes.

## Current Implementation

What exists today, anchored to real code. Reference specific files, line counts, function names, data shapes. This section forces the implementing agent to read before writing.

## Proposed Changes

What to build. Be specific: file names, prop interfaces, state ownership, data flow. Use tables for multi-file changes. Use code blocks for interfaces and data shapes. Call out architectural decisions that were debated and resolved.

### What Does NOT Change

Explicit scope boundary. Prevents the implementing agent from "improving" adjacent code.

## Migration Strategy

Ordered steps from current → proposed. Number them. Call out risk level per step. Group into logical PRs if the task is large.

## Files Modified

### New Files
- `path/to/new/File.tsx` — purpose (~estimated lines)

### Modified Files
- `path/to/existing/File.tsx` — what changes

### Unchanged
- `path/to/adjacent/File.tsx` — explicitly note files that should NOT be touched

## Verification

How to confirm it works. Concrete steps the implementing agent can follow — not "it should work" but "click X, observe Y, check Z in the log."
````

Adapt the template to the task. Small bug fixes don't need a Migration Strategy section. Large refactors may need per-phase subsections (see `TRANSCRIBER_CANVAS_ALIGNMENT.md` for a 5-phase example). The goal is specificity, not ceremony — every section should contain information the implementing agent can't derive from the code alone.

## Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|--------------|
| Implementing from conversation alone | Ambiguity at execution time, scope drift, context loss |
| Writing the spec but not reviewing it | Inconsistencies propagate to implementation |
| Skipping the post-implementation review | Spec-reality divergence goes undetected |
| Storing failure context alongside active specs | Context poisoning — agent treats deprecated approaches as current |
| Over-engineering the process | The workflow works because it's lightweight. Adding ceremony makes people stop using it |

## Summary

The task doc serves triple duty: it is the **implementation spec**, the **verification checklist**, and the **historical record**. One artifact does the work of three, and each phase of its lifecycle adds value to the next conversation.
