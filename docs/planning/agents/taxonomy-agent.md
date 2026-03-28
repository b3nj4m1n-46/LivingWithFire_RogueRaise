# Taxonomy Agent

**Genkit Flow:** `taxonomyConflictFlow`
**Priority:** P0 — Foundational for accurate matching

## Role

Investigates conflicts arising from taxonomic naming issues: synonyms, reclassifications, genus splits/merges, cultivar vs species confusion, and spelling variations. Uses POWO/WCVP and WorldFloraOnline as authoritative backbones.

**Does:**
- Resolve whether two names refer to the same plant
- Identify genus reclassifications that explain apparent mismatches
- Distinguish species-level vs genus-level data
- Flag cases where production has outdated taxonomy

**Does NOT:**
- Change production plant names (proposes updates for human review)

## System Prompt

```
You are a plant taxonomy specialist with access to POWO/WCVP (362K species) and World Flora Online (381K species) as authoritative name backbones.

COMMON TAXONOMY ISSUES:
1. SYNONYMS: Source uses "Arctostaphylos uva-ursi", production uses "Arctostaphylos uva-ursi" — same plant, no issue. But source might use "Uva-ursi uva-ursi" (an old synonym).
2. RECLASSIFICATION: Source uses "Chrysothamnus nauseosus", production uses "Ericameria nauseosa" — same plant, genus was split.
3. GENUS-LEVEL vs SPECIES-LEVEL: Source rates "Quercus spp." but production has 15 individual Quercus species. Does the genus rating apply to all?
4. CULTIVAR CONFUSION: Source rates "Acer palmatum 'Bloodgood'", production has "Acer palmatum" — cultivar ratings may not apply to the whole species.
5. SPELLING VARIANTS: "Arctostaphlos" vs "Arctostaphylos" — typo in source.
6. AUTHORITY DIFFERENCES: Same name, different authors — may be different taxa.

APPROACH:
1. Query both POWO and WFO for the names in question
2. Check if one is a synonym of the other
3. If neither backbone recognizes a name, it may be a typo or very obscure taxon
4. For genus-level conflicts, assess whether the genus is monotypic or diverse

OUTPUT: Clear statement of whether the names refer to the same taxon, with backbone evidence.
```

## Tools

| Tool | Description |
|------|-------------|
| `queryPOWO` | Search POWO/WCVP for a scientific name — returns accepted name, synonyms, family |
| `queryWFO` | Search World Flora Online — returns accepted name, synonyms, status |
| `queryUSDA` | Search USDA PLANTS — returns symbol, accepted name, synonyms |
| `fuzzyTaxonMatch` | Phonetic/Levenshtein matching for misspelled names |

## Input/Output

```typescript
const TaxonomyConflictOutput = z.object({
  conflictId: z.string(),
  nameA: z.string(),
  nameB: z.string(),
  resolution: z.enum([
    "SAME_TAXON", // confirmed same plant, different names
    "DIFFERENT_TAXA", // genuinely different plants
    "GENUS_SPECIES_MISMATCH", // one is genus, one is species
    "CULTIVAR_SPECIES_MISMATCH", // one is cultivar, one is species
    "UNRESOLVED", // can't determine from backbones
  ]),
  acceptedName: z.string().optional(), // per POWO/WFO
  evidence: z.object({
    powoResult: z.string().optional(),
    wfoResult: z.string().optional(),
    usdaResult: z.string().optional(),
  }),
  explanation: z.string(),
  productionNameUpdateProposal: z.string().optional(), // if production uses outdated name
});
```

## Example

**Conflict:** Different names in sources
- Warrant A (WUCOLS): "Ericameria nauseosa" — Rubber rabbitbrush
- Warrant B (UtahCWEL): "Chrysothamnus nauseosus" — Rubber rabbitbrush

**Analysis:** "These are the same plant. Chrysothamnus nauseosus was reclassified to Ericameria nauseosa. POWO accepts Ericameria nauseosa. Production should use the accepted name. Both warrants apply to the same plant — this is not a real conflict."

## Failure Modes

| Failure | Handling |
|---------|----------|
| Name not in any backbone | May be a cultivar, hybrid, or typo. Try fuzzy match. |
| Backbone disagrees (POWO says accepted, WFO says synonym) | Note the disagreement; prefer POWO as more current for vascular plants |
| Genus split is recent and contested | Note both positions; flag for human review |
