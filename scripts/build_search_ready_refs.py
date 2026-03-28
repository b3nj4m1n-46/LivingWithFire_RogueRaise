"""
Build search-ready literature references with pre-built search URLs
and triage classification (likely findable online vs needs outreach).
"""

import csv, json, os, sys, re
from urllib.parse import quote_plus

sys.stdout.reconfigure(encoding="utf-8")
BASE = r"C:\Users\bd\Desktop\LivinWitFire"

# Read existing references
refs = []
with open(os.path.join(BASE, "LITERATURE-REFERENCES.csv"), "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        refs.append(dict(row))

print(f"Total references: {len(refs)}")
print(f"Already have: {sum(1 for r in refs if r.get('have_it') == 'Yes')}")
print(f"Missing: {sum(1 for r in refs if r.get('have_it') != 'Yes')}")

# Build search URLs and triage for missing references
for ref in refs:
    if ref.get("have_it") == "Yes":
        ref["triage"] = "HAVE_IT"
        ref["triage_reason"] = "Already in our collection"
        ref["google_scholar_url"] = ""
        ref["wayback_url"] = ""
        ref["worldcat_url"] = ""
        ref["google_search_url"] = ""
        continue

    author = ref.get("author", "")
    title = ref.get("title", "")
    year = ref.get("year", "")
    publisher = ref.get("publisher", "")
    desc = ref.get("description", "")
    ref_type = ref.get("type", "")

    # Build search query
    query_parts = []
    if author:
        query_parts.append(author.split(",")[0].strip())  # First author last name
    if title:
        query_parts.append(title)
    if year and year.isdigit():
        query_parts.append(year)
    query = " ".join(query_parts)[:200]

    # Google Scholar
    ref["google_scholar_url"] = f"https://scholar.google.com/scholar?q={quote_plus(query)}" if query else ""

    # Wayback Machine (search for the title)
    ref["wayback_url"] = f"https://web.archive.org/web/*/{quote_plus(title[:80])}" if title else ""

    # WorldCat (for books)
    ref["worldcat_url"] = f"https://search.worldcat.org/search?q={quote_plus(query)}" if query else ""

    # General Google search
    ref["google_search_url"] = f"https://www.google.com/search?q={quote_plus(query + ' filetype:pdf')}" if query else ""

    # --- TRIAGE ---
    triage = "UNKNOWN"
    reason = ""

    # Check indicators for findability
    desc_lower = (desc + " " + title + " " + publisher).lower()

    # Academic papers - likely findable
    if any(kw in desc_lower for kw in ["journal", "proceedings", "thesis", "university",
                                        "usda", "forest service", "extension", "bulletin",
                                        "research", "study", "doi"]):
        triage = "LIKELY_ONLINE"
        reason = "Academic/government publication — search Google Scholar or agency archives"

    # Books - check Open Library / WorldCat
    elif any(kw in desc_lower for kw in ["book", "press", "publishing", "macmillan",
                                          "timber press", "claremont"]):
        triage = "CHECK_LIBRARIES"
        reason = "Published book — check WorldCat, Open Library, Internet Archive"

    # Magazine articles
    elif any(kw in desc_lower for kw in ["sunset", "magazine", "grounds maintenance"]):
        triage = "CHECK_ARCHIVES"
        reason = "Magazine article — check publication archives or Google Books"

    # Government/extension docs
    elif any(kw in desc_lower for kw in ["department", "city of", "county", "fire",
                                          "state", "california", "forestry"]):
        triage = "LIKELY_ONLINE"
        reason = "Government/municipal document — try Wayback Machine or agency website"

    # Municipal pamphlets / local guides
    elif any(kw in desc_lower for kw in ["nursery", "garden", "protect your",
                                          "homeowner", "green belt"]):
        triage = "NEEDS_OUTREACH"
        reason = "Local pamphlet/guide — likely need to contact issuing organization"

    # Trait codes (we already have the definitions)
    elif ref_type == "trait_code":
        triage = "LOW_PRIORITY"
        reason = "Trait code definition — data already captured in BethkeUCCE2016"

    # Datasets we already processed
    elif ref_type == "dataset":
        triage = "HAVE_IT"
        reason = "This is one of our processed datasets"

    # Fallback
    else:
        triage = "TRY_ONLINE"
        reason = "Unknown type — try Google Scholar and general search first"

    ref["triage"] = triage
    ref["triage_reason"] = reason

# Write search-ready CSV
csv_path = os.path.join(BASE, "LITERATURE-REFERENCES-SEARCH.csv")
fields = ["id", "author", "title", "year", "publisher", "description",
          "category", "type", "from_dataset", "have_it", "filename", "file_location",
          "triage", "triage_reason",
          "google_scholar_url", "google_search_url", "wayback_url", "worldcat_url"]
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    for r in refs:
        w.writerow(r)
print(f"\nWrote {csv_path}")

# Write JSON (RAG-ready with search URLs)
json_path = os.path.join(BASE, "LITERATURE-REFERENCES-SEARCH.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump({
        "description": "Search-ready literature references with pre-built URLs and triage classification.",
        "total": len(refs),
        "triage_categories": {
            "HAVE_IT": "Already in our collection",
            "LIKELY_ONLINE": "Academic/government doc — high chance of finding online",
            "CHECK_LIBRARIES": "Published book — check WorldCat, Open Library, Internet Archive",
            "CHECK_ARCHIVES": "Magazine/periodical — check publication archives",
            "TRY_ONLINE": "Unknown — try online search first",
            "NEEDS_OUTREACH": "Local pamphlet — likely need to contact organization",
            "LOW_PRIORITY": "Data already captured, original doc is nice-to-have",
        },
        "references": refs,
    }, f, indent=2, ensure_ascii=False)
print(f"Wrote {json_path}")

# Triage summary
print("\n=== TRIAGE SUMMARY ===")
triage_counts = {}
for r in refs:
    t = r.get("triage", "UNKNOWN")
    triage_counts[t] = triage_counts.get(t, 0) + 1
for t, c in sorted(triage_counts.items(), key=lambda x: -x[1]):
    print(f"  {t:20s} {c:4d}")

# Print the missing ones grouped by triage
print("\n=== LIKELY FINDABLE ONLINE ===")
for r in refs:
    if r["triage"] == "LIKELY_ONLINE":
        print(f"  [{r['id']}] {r['author'][:30]} — {r['title'][:50]} ({r['year']})")

print("\n=== CHECK LIBRARIES (books) ===")
for r in refs:
    if r["triage"] == "CHECK_LIBRARIES":
        print(f"  [{r['id']}] {r['author'][:30]} — {r['title'][:50]} ({r['year']})")

print("\n=== CHECK ARCHIVES (magazines) ===")
for r in refs:
    if r["triage"] == "CHECK_ARCHIVES":
        print(f"  [{r['id']}] {r['author'][:30]} — {r['title'][:50]} ({r['year']})")

print("\n=== NEEDS OUTREACH (local/municipal) ===")
for r in refs:
    if r["triage"] == "NEEDS_OUTREACH":
        print(f"  [{r['id']}] {r['author'][:30]} — {r['title'][:50]} ({r['year']})")
