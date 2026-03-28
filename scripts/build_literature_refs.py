"""
Build aggregated literature references from all LivinWitFire datasets.
Includes primary sources from meta-analyses, trait codes, and dataset citations.
Designed for RAG/vectorization.
"""

import csv, json, os, sys, glob

sys.stdout.reconfigure(encoding="utf-8")
BASE = r"C:\Users\bd\Desktop\LivinWitFire"

all_refs = []

# 1. DiabloFiresafe/references.csv (57 refs)
path = os.path.join(BASE, "DiabloFiresafe", "references.csv")
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            all_refs.append({
                "id": f"DIABLO-REF-{row.get('ref_number', '').strip()}",
                "author": row.get("author", "").strip(),
                "title": row.get("title", "").strip(),
                "year": row.get("year", "").strip(),
                "publisher": row.get("publisher", "").strip(),
                "description": row.get("summary", "").strip(),
                "category": "Fire Resistance - CA Plant Lists",
                "type": "primary_source",
                "from_dataset": "DiabloFiresafe (FIRE-07)",
                "have_it": "No",
                "filename": "",
                "file_location": "",
            })

# 2. UCForestProductsLab/references.csv
path = os.path.join(BASE, "UCForestProductsLab", "references.csv")
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            all_refs.append({
                "id": f"UCF-REF-{row.get('ref_number', '').strip()}",
                "author": row.get("author", "").strip(),
                "title": row.get("title", "").strip(),
                "year": row.get("year", "").strip(),
                "publisher": row.get("publisher", "").strip(),
                "description": row.get("summary", "").strip(),
                "category": "Fire Resistance - CA Plant Lists",
                "type": "primary_source",
                "from_dataset": "UCForestProductsLab (FIRE-05)",
                "have_it": "No",
                "filename": "",
                "file_location": "",
            })

# 3. BethkeUCCE2016 plant_list_sources
path = os.path.join(BASE, "BethkeUCCE2016", "plant_list_sources.csv")
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f)):
            desc = " | ".join(f"{k}: {v}" for k, v in row.items() if v and v.strip())
            all_refs.append({
                "id": f"BETHKE-SRC-{i+1}",
                "author": row.get("source_name", row.get("author", "")).strip(),
                "title": row.get("title", row.get("description", "")).strip(),
                "year": row.get("year", "").strip(),
                "publisher": row.get("publisher", row.get("organization", "")).strip(),
                "description": desc,
                "category": "Fire Resistance - Literature Review",
                "type": "primary_source",
                "from_dataset": "BethkeUCCE2016 (FIRE-06)",
                "have_it": "No",
                "filename": "",
                "file_location": "",
            })

# 4. BethkeUCCE2016 trait_codes
path = os.path.join(BASE, "BethkeUCCE2016", "trait_codes.csv")
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f)):
            desc = " | ".join(f"{k}: {v}" for k, v in row.items() if v and v.strip())
            all_refs.append({
                "id": f"BETHKE-TRAIT-{i+1}",
                "author": "Bethke et al. 2016",
                "title": desc[:100],
                "year": "2016",
                "publisher": "UCCE San Diego",
                "description": "Trait code definition used across 53 CA fire-resistant plant lists",
                "category": "Fire Resistance - Trait Definitions",
                "type": "trait_code",
                "from_dataset": "BethkeUCCE2016 (FIRE-06)",
                "have_it": "Yes",
                "filename": "trait_codes.csv",
                "file_location": "BethkeUCCE2016/trait_codes.csv",
            })

# 5. Our own dataset citations
our_datasets = [
    ("FIRE-01", "FirePerformancePlants", "Southern Regional Extension Forestry", "Fire Performance Plants Selector", "2010", "SREF", "541 plants rated Firewise (1) through NOT Firewise (4). Scraped from Wayback Machine archive.", "Fire Resistance"),
    ("FIRE-02", "IdahoFirewise", "Idaho Department of Lands", "Fire Resistance of Plants Master Database", "", "Idaho Firewise", "379 species rated for firewise landscaping.", "Fire Resistance"),
    ("FIRE-03", "FLAMITS", "Cui, X., Alam, M.A., Perry, G.L.W., et al.", "FLAMITS Global Plant Flammability Traits Database", "2020", "Dryad", "Global flammability trait database. DOI: 10.5061/dryad.h18931zr3", "Fire Resistance"),
    ("FIRE-04", "NIST_USDA_Flammability", "Ganteaume, A., Jappiot, M., et al.", "Flammability of Ornamental Shrubs", "", "USDA Forest Service / NIST", "34 shrubs experimentally tested. 22 low, 8 moderate, 4 high flammability.", "Fire Resistance"),
    ("FIRE-05", "UCForestProductsLab", "UC Forest Products Laboratory", "Fire-Resistant/Fire-Prone Plant Lists", "1997", "FireSafe Monterey", "164 plants from 57 published sources.", "Fire Resistance"),
    ("FIRE-06", "BethkeUCCE2016", "Bethke, J., Bell, C., et al.", "Research Literature Review of Plant Flammability", "2016", "UCCE San Diego", "Meta-analysis of 53 CA fire-resistant plant lists.", "Fire Resistance"),
    ("FIRE-07", "DiabloFiresafe", "Diablo Firesafe Council", "Fire-Resistant and Highly Flammable Plant Lists", "", "UC Forest Products Lab methodology", "140 plants, 57 references.", "Fire Resistance"),
    ("FIRE-08", "OaklandFireSafe", "Oakland Fire Safe Council", "Fire-Resistant and Fire-Prone Plant Lists", "", "OFSC", "212 plants with CA native flags.", "Fire Resistance"),
    ("FIRE-10", "FirescapingBook", "Edwards, A. and Schleiger, R.", "Firescaping Your Home", "2023", "Hachette Book Group", "Plants to avoid list from fire landscaping manual.", "Fire Resistance"),
    ("FIRE-11", "OSU_PNW590", "Lommen, A.", "Fire-Resistant Plants for Home Landscapes", "2023", "Oregon State University Extension, PNW-590", "133 plants rated for fire resistance. Literature-derived.", "Fire Resistance"),
    ("DEER-01", "RutgersDeerResistance", "Perdomo, P., Nitzsche, P., Drake, D.", "Landscape Plants Rated by Deer Resistance", "", "Rutgers Extension E271", "326 plants rated A-D.", "Deer Resistance"),
    ("DEER-02", "NCSU_DeerResistant", "NC State University Extension", "Extension Gardener Plant Toolbox deer-resistant tag", "", "NC State", "727 species tagged deer-resistant.", "Deer Resistance"),
    ("DEER-03", "MissouriBotanicalDeer", "Shaw Nature Reserve", "Native Plants for a Deer Resistant Garden", "", "Missouri Botanical Garden", "112 native plants, 3-year study, 6 browse levels.", "Deer Resistance"),
    ("WATER-01", "WUCOLS", "UC Davis CCUH", "Water Use Classification of Landscape Species (WUCOLS)", "2025", "UC Davis", "4,103 plants across 6 CA climate regions.", "Water Need"),
    ("TAXON-01", "POWO_WCVP", "Royal Botanic Gardens, Kew", "World Checklist of Vascular Plants v14.0", "2026", "Kew", "362,739 accepted species. Global taxonomy backbone.", "Taxonomy"),
    ("TAXON-02", "WorldFloraOnline", "WFO Consortium", "World Flora Online", "2025", "WFO", "381,467 accepted species. December 2025 release.", "Taxonomy"),
    ("TAXON-03", "USDA_PLANTS", "USDA NRCS", "The PLANTS Database", "2025", "USDA", "93,157 records. National + Oregon + California state lists.", "Taxonomy"),
    ("INVAS-04", "USGS_RIIS", "Simpson, A., et al.", "US Register of Introduced and Invasive Species v2.0", "2022", "USGS", "4,918 unique invasive plant species. DOI: 10.5066/P9KFFTOD", "Invasiveness"),
    ("INVAS-05", "CalIPC_Invasive", "California Invasive Plant Council", "Cal-IPC Inventory", "2024", "Cal-IPC", "331 CA invasives. High/Moderate/Limited/Watch ratings.", "Invasiveness"),
    ("BIRD-01", "TallamyBirdPlants", "Tallamy, D.", "20 Most Valuable Native Plant Genera for Biodiversity", "2018", "University of Delaware", "42 genera ranked by Lepidoptera species count.", "Birds/Wildlife"),
    ("POLL-01", "XercesPollinator", "Xerces Society + Pollinator Partnership", "Regional Pollinator Plant Lists", "2024", "Xerces/PP", "428 plants across 4 western regions.", "Pollinators"),
]

for sid, folder, author, title, year, publisher, desc, cat in our_datasets:
    # Check if we have files in Sources/
    sources_dir = os.path.join(BASE, folder, "Sources")
    have_files = os.path.isdir(sources_dir) and len(os.listdir(sources_dir)) > 0
    filenames = ", ".join(os.listdir(sources_dir)) if have_files else ""

    all_refs.append({
        "id": sid,
        "author": author,
        "title": title,
        "year": year,
        "publisher": publisher,
        "description": desc,
        "category": cat,
        "type": "dataset",
        "from_dataset": f"{folder} ({sid})",
        "have_it": "Yes" if have_files else "No",
        "filename": filenames[:200],
        "file_location": f"{folder}/Sources/" if have_files else "",
    })

print(f"Total references: {len(all_refs)}")

# Deduplicate by rough title match
seen = set()
unique = []
for r in all_refs:
    key = (r.get("title", "")[:30].lower(), r.get("author", "")[:20].lower())
    if key[0] and key in seen:
        continue
    seen.add(key)
    unique.append(r)

print(f"After dedup: {len(unique)}")

# Write CSV
csv_path = os.path.join(BASE, "LITERATURE-REFERENCES.csv")
fields = ["id", "author", "title", "year", "publisher", "description",
          "category", "type", "from_dataset", "have_it", "filename", "file_location"]
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    for r in unique:
        w.writerow(r)
print(f"Wrote {csv_path}")

# Write JSON (RAG-ready)
json_path = os.path.join(BASE, "LITERATURE-REFERENCES.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump({
        "description": "Aggregated literature references from all LivinWitFire datasets. Designed for RAG/vectorization.",
        "total_references": len(unique),
        "categories": sorted(set(r.get("category", "") for r in unique if r.get("category"))),
        "types": {
            "primary_source": "Original study/publication referenced by a meta-analysis dataset",
            "dataset": "A processed dataset in the LivinWitFire collection",
            "trait_code": "Trait/variable definition used across multiple plant lists",
        },
        "references": unique,
    }, f, indent=2, ensure_ascii=False)
print(f"Wrote {json_path}")

# Stats
cats = {}
for r in unique:
    c = r.get("category", "Unknown")
    cats[c] = cats.get(c, 0) + 1
print("\nBy category:")
for c, n in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {c}: {n}")

have = sum(1 for r in unique if r.get("have_it") == "Yes")
print(f"\nHave it: {have} / {len(unique)}")
