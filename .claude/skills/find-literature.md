---
name: find-literature
description: Search for and help procure missing literature references from the LITERATURE-REFERENCES-SEARCH.csv. Uses pre-built search URLs, triage classifications, and web search to locate documents.
command: /find-literature
---

# Find Literature

Help the user locate missing literature references from the LivinWitFire collection. The file `LITERATURE-REFERENCES-SEARCH.csv` contains 195 references with triage classifications and pre-built search URLs.

## When to Use

- User asks "what literature are we missing?"
- User asks "find me [specific reference]"
- User asks "help me procure the missing documents"
- User wants to prioritize which documents to hunt down

## Triage Categories

| Category | Count | Action |
|----------|-------|--------|
| `HAVE_IT` | 68 | Already in collection — no action needed |
| `LIKELY_ONLINE` | 90 | Search Google Scholar, agency websites, Wayback Machine |
| `CHECK_LIBRARIES` | 17 | Search WorldCat, Open Library, Internet Archive |
| `CHECK_ARCHIVES` | 4 | Search magazine/periodical archives |
| `TRY_ONLINE` | 14 | Try general web search first |
| `NEEDS_OUTREACH` | 2 | Contact the issuing organization directly |
| `LOW_PRIORITY` | 0 | Data already captured; original doc is nice-to-have |

## Steps for Finding a Specific Reference

1. **Read the reference** from `LITERATURE-REFERENCES-SEARCH.csv` by its ID
2. **Check the triage** classification and reason
3. **Try the pre-built URLs** in this order:
   - `google_scholar_url` — best for academic papers
   - `google_search_url` — includes `filetype:pdf` for direct downloads
   - `wayback_url` — for government/municipal docs that may have been taken down
   - `worldcat_url` — for books, find a library that has it
4. **Use WebSearch** if pre-built URLs don't work — try variations of the title
5. **Report results** to the user: found (with URL), not found online (suggest outreach), or found but paywalled

## Steps for Batch Processing

1. Read `LITERATURE-REFERENCES-SEARCH.csv`
2. Filter to `have_it = No`
3. Group by triage category
4. Start with `LIKELY_ONLINE` (highest success rate)
5. For each, try the search URLs and report what was found
6. Update `have_it`, `filename`, and `file_location` columns for any documents procured

## When a Document is Found

1. Download to the appropriate dataset's `Sources/` folder
2. Update `LITERATURE-REFERENCES-SEARCH.csv`:
   - Set `have_it` = "Yes"
   - Set `filename` = the downloaded filename
   - Set `file_location` = relative path (e.g., `DiabloFiresafe/Sources/filename.pdf`)
3. If the document contains extractable plant data, consider running `/add-datasource`

## Priority Order for Procurement

1. **Moritz & Svihra** (1995, 1996) — "Pyrophytic vs. Fire Resistant Plants" — direct experimental data
2. **Deering** (1955) — "A Study of Drought Resistant Ornamental Plants" — historic but foundational
3. **Radtke** (1993) — "A Homeowner's Guide to Fire and Watershed Management" — comprehensive guide
4. **Beatty** (1991) — "Designing Gardens for Fire Safety" UC Berkeley — academic rigor
5. **Maire** (1962, 1969) — earliest fire landscaping research
6. **County/City fire department lists** — may have plant-specific data not in the meta-analyses
