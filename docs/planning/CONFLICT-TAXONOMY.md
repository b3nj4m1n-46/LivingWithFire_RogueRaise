# Conflict Taxonomy: Types of Data Conflicts

## Why Conflicts Happen

When multiple sources describe the same plant, disagreements are not necessarily errors. They arise from legitimate differences in methodology, scope, region, and purpose. Understanding *why* sources conflict is as important as detecting that they do.

---

## Conflict Types

### 1. Rating Disagreement (severity: critical)

Sources directly contradict each other on the same trait.

**Example:** Source A says "fire-resistant" (FIRE-01: Firewise rating 1), Source B says "highly flammable" (FIRE-04: High flammability in experimental testing).

**Common causes:**
- Different methodologies (literature review vs. controlled burn testing)
- Different definitions ("fire-resistant" means different things to different sources)
- Different conditions tested (well-watered landscape plant vs. drought-stressed wild plant)

**Detection:** Same plant_id + same attribute_id + semantically opposing values from different source_ids.

**Agent strategy:** Compare the DATA-DICTIONARY.md definitions for both sources' rating systems. Call Claude to determine if the values are truly contradictory or just use different scales.

---

### 2. Scale Mismatch (severity: moderate)

Sources use incompatible rating scales that can't be directly compared.

**Example:**
- FIRE-01: numeric 1-4 (1=best, 4=worst)
- FIRE-02: narrative ("Highly Resistant", "Moderately Resistant", "Not Recommended")
- FIRE-04: 3-level ("Low", "Moderate", "High" flammability)

**Common causes:** Each organization developed its own rating system. There is no universal standard for fire resistance, deer resistance, or water use.

**Detection:** Same plant + same attribute category + values from scales that don't directly map.

**Agent strategy:** Consult both DATA-DICTIONARY.md files for scale definitions. Use the crosswalk tables in DATASET-MAPPINGS.md. If ambiguous, flag for human review with both scales shown side-by-side.

---

### 3. Scope Difference (severity: moderate)

A value is technically correct but applies to a different geographic or climatic context than the production database serves.

**Example:** Rutgers (NJ) rates a plant as "Frequently Severely Damaged" by deer, but the production DB serves Southern Oregon where deer pressure is different.

**Common causes:**
- Regional datasets (Rutgers=NJ, CSU=CO, WUCOLS=CA) applied outside their geographic context
- Climate zone differences affect plant behavior
- Deer populations, fire regimes, and rainfall patterns are location-specific

**Detection:** Check the source's README.md or DATA-DICTIONARY.md for geographic scope. Flag when a source's region doesn't match the production DB's target region (OR/CA/WA).

**Agent strategy:** Note the scope difference in the proposal. Don't auto-reject — regional data can still be informative. Let the human decide if the data transfers.

---

### 4. Temporal Conflict (severity: minor)

Sources from different years may reflect outdated information.

**Example:**
- A 1997 publication lists a plant as non-invasive
- A 2024 Cal-IPC inventory rates it as "High" invasive
- The plant became invasive in the intervening 27 years

**Common causes:**
- Taxonomy reclassification (Mahonia aquifolium → Berberis aquifolium)
- Invasive status changes over time
- Newer research supersedes older findings
- Climate change shifts plant behavior

**Detection:** Compare source publication years (from DATA-PROVENANCE.md and README.md). Flag when sources are >10 years apart on fast-changing attributes (invasiveness, climate vulnerability).

**Agent strategy:** Prefer newer sources for invasiveness and climate data. For stable attributes (basic morphology, native range), older sources may be equally valid.

---

### 5. Methodology Difference (severity: varies)

Sources used fundamentally different approaches to arrive at their ratings.

**Example:**
- FIRE-04 (NIST): Controlled laboratory burn testing with calorimetry — measured actual heat release rate
- FIRE-01 (SREF): Literature-based rating compiled from multiple published guides
- FIRE-07 (Diablo): Plants appearing in 3+ of 57 published fire-resistant plant lists

**Common causes:** The hierarchy of evidence quality:
1. Controlled experimental testing (most rigorous)
2. Observational field studies
3. Literature meta-analysis (aggregating others' findings)
4. Expert opinion / extension service recommendations
5. Anecdotal / traditional knowledge (least rigorous but still valuable)

**Detection:** Read the DATA-DICTIONARY.md and README.md for each source to identify methodology. Compare methodology types.

**Agent strategy:** Note the methodology for each claim. Higher-evidence sources should carry more weight, but don't auto-override — sometimes a local expert opinion outperforms a generic experimental result for a specific region.

---

### 6. Granularity Mismatch (severity: minor)

Sources provide data at different levels of specificity.

**Example:**
- Source A has data for "Acer spp." (genus level — all maples)
- Source B has data for "Acer macrophyllum" (species level — bigleaf maple)
- Source C has data for "Acer macrophyllum 'Seattle Sentinel'" (cultivar level)

**Common causes:** Some databases track genus-level generalizations; others track individual species or cultivars.

**Detection:** Check the `species` field: "spp." = genus-level. Check `subspecies_varieties` for cultivar specificity.

**Agent strategy:** Species-level data is preferred over genus-level. Flag genus-level proposals as lower confidence. Don't apply genus-level data to specific species without flagging.

---

### 7. Definition Conflict (severity: moderate)

Sources define the same concept differently.

**Example:**
- "Drought tolerant" in WUCOLS = survives on 0-30% ET0 (quantified)
- "Drought tolerant" in OSU = survives Western Oregon summers without irrigation (qualitative)
- "Drought tolerant" in UtahCWEL = survives Intermountain West conditions (different climate entirely)

**Common causes:** No universal definitions for terms like "drought tolerant," "fire resistant," "deer resistant," "low water." Each source defines these within its own context.

**Detection:** Compare the DATA-DICTIONARY.md definitions for same-named attributes across sources.

**Agent strategy:** Always include the source's definition context when presenting a value. Two sources can both say "drought tolerant" and both be correct within their own definitions while meaning very different things.

---

### 8. Completeness Conflict (severity: minor)

One source provides data that another source explicitly omits or marks as "unknown."

**Example:**
- WUCOLS marks a plant's Region 5 water use as "Unknown"
- UtahCWEL provides a water use value for the same plant in a similar climate zone

**Detection:** One source has NULL/empty/Unknown for an attribute that another source provides.

**Agent strategy:** This isn't a conflict — it's an enhancement opportunity. Propose the non-null value as a `new_value` proposal, noting that the primary source didn't have this data.

---

## Severity Matrix

| Severity | Definition | Action |
|----------|-----------|--------|
| **Critical** | Direct contradiction on same attribute — can't both be true | Must resolve before pushing to production |
| **Moderate** | Disagreement that may be explainable by context (region, methodology, scale) | Should resolve, but can defer with notes |
| **Minor** | Difference that's informational, not contradictory | Can accept both values with provenance, or defer |

## Conflict Priority for Resolution Queue

1. **Critical** internal conflicts (already in production — data quality issue)
2. **Critical** external conflicts (blocks enhancement)
3. **Moderate** internal conflicts
4. **Moderate** external conflicts
5. **Minor** conflicts (batch-process or defer)
6. **Cross-source** conflicts (informational — helps understand source reliability)

---

## Integration with Claim/Warrant Model

### Conflicts Are Between Warrants, Not Values

In the Claim/Warrant model, conflicts link pairs of **warrants** (source evidence), not raw values. This means:

- Each warrant carries full provenance (source, methodology, region, year)
- A single warrant can be in multiple conflicts (e.g., it conflicts with Warrant B on rating and Warrant C on scope)
- Resolving a conflict doesn't delete warrants — it annotates them so the admin can curate

### Specialist Agent Routing

The Conflict Classifier detects the conflict and routes to the appropriate specialist:

| Conflict Type | Specialist Agent | Genkit Flow |
|--------------|-----------------|-------------|
| Rating Disagreement | Rating Conflict Agent | `ratingConflictFlow` |
| Scale Mismatch | Rating Conflict Agent | `ratingConflictFlow` |
| Scope Difference | Scope Agent | `scopeConflictFlow` |
| Temporal Conflict | Temporal Agent | `temporalConflictFlow` |
| Methodology Difference | Methodology Agent | `methodologyConflictFlow` |
| Granularity Mismatch | Taxonomy Agent | `taxonomyConflictFlow` |
| Definition Conflict | Definition Agent | `definitionConflictFlow` |
| Completeness Conflict | *(no specialist needed)* | Auto-flag as enhancement opportunity |

### Specialist Output Feeds Curation UI

Each specialist annotates the conflict with:
- **Verdict type:** REAL, APPARENT, or NUANCED
- **Analysis:** Why the warrants disagree
- **Recommendation:** PREFER_A, PREFER_B, KEEP_BOTH, KEEP_BOTH_WITH_CONTEXT, NEEDS_RESEARCH, HUMAN_DECIDE

The admin sees this analysis alongside the warrant cards and makes the final curation decision. The Synthesis Agent then merges selected warrants into a production claim.

### Non-Conflicts Are Valuable Too

When the Classifier finds warrants that **agree** or **complement** each other, these are marked as:
- **Corroboration** — multiple sources say the same thing (increases confidence)
- **Complementary** — one source adds detail the other lacks (enhancement)

Both are surfaced in the curation UI as supporting evidence. Corroborating warrants strengthen claims. Complementary warrants enrich them.
