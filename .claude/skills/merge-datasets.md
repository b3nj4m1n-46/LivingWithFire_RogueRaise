---
name: merge-datasets
description: Create a merged/fused plant table from multiple databases with specific criteria (fire-safe + deer-resistant + low-water, etc.). Handles cross-referencing, taxonomy resolution, and provenance tagging.
command: /merge-datasets
---

# Merge Datasets

When the user wants to create a combined plant list matching multiple criteria across databases, build a merged table with full provenance.

## Steps

1. **Clarify criteria.** Ask the user what they want:
   - Which attributes? (fire-safe, deer-resistant, low-water, pollinator-friendly, native, non-invasive)
   - Which region? (Oregon, California, Pacific West, national)
   - Any filters? (trees only, shrubs only, specific height, specific zone)

2. **Query each relevant database.** Use SQLite for speed. Match on scientific_name (genus + species, case-insensitive).

3. **Resolve taxonomy.** Different databases may use different names for the same plant:
   - Check USDA_PLANTS for synonyms (records where `synonym_symbol` is populated)
   - Normalize to genus + species (strip cultivar names, authors, variety/subspecies)

4. **Merge with provenance.** Every attribute gets a source_id column:

```python
merged = {
    'scientific_name': 'Ceanothus velutinus',
    'common_name': 'Snowbrush',
    'fire_rating': 'Firewise',
    'fire_source': 'FIRE-01',
    'deer_rating': None,
    'deer_source': None,
    'water_use': 'Low',
    'water_source': 'WATER-01',
    'pollinator_value': 'Listed',
    'pollinator_source': 'POLL-01',
    'bird_value': None,
    'bird_source': None,
    'invasive_status': 'CLEAR',
    'invasive_source': 'checked INVAS-01 thru INVAS-05',
    'native_to_OR': True,
    'native_source': 'TAXON-03',
}
```

5. **Run invasive check.** Always check the merged list against all 5 invasive databases. Flag and remove any invasive species from recommendations.

6. **Output.** Write the merged table as CSV with source_id columns. Include a summary of how many plants matched each criterion.

## Example

User: "Find me fire-safe, deer-resistant, low-water native plants for Southern Oregon"

```
Criteria:
  Fire: Firewise (1) or MODERATELY Firewise (2) from FIRE-01
  Deer: Rating A or B from DEER-01
  Water: Very Low or Low from WATER-01 (Region 6)
  Native: Present in USDA_PLANTS Oregon state list (TAXON-03)
  Invasive: Not in any INVAS database

Cross-referencing 5 databases...
  Fire-safe plants: 287
  Deer-resistant (A or B): 196
  Low-water (CA Region 6): 1,676
  Native to Oregon: 7,132

  Intersection: 23 plants match ALL criteria
  After invasive check: 23 plants (0 removed)
```

## Important Notes
- Always normalize scientific names before matching (lowercase, strip authors/cultivars)
- Keep BOTH ratings when a plant appears in multiple sources for the same attribute
- Never average or combine ratings from different scales — report them separately with source IDs
- Always run the invasive check as the final step
- Note geographic applicability limitations in the output (e.g., "Rutgers deer data is from NJ")
