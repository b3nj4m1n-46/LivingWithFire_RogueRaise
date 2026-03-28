"""Generate SOURCE-REGISTRY.md from the sources API response."""

import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT = os.path.join(BASE, "api-reference", "sources.json")
OUTPUT = os.path.join(BASE, "api-reference", "SOURCE-REGISTRY.md")

with open(INPUT, "r", encoding="utf-8") as f:
    raw = json.load(f)

sources = raw["data"] if isinstance(raw, dict) and "data" in raw else raw

lines = [
    "# Production Sources Registry",
    "",
    f"**{len(sources)} data sources** currently in the Living With Fire production database.",
    "Each source has a UUID used as `sourceId` in the values table.",
    "",
    "**Use this document to:** check if a source already exists before creating duplicates,",
    "find the UUID for a known source when creating warrants, understand provenance coverage.",
    "",
    "---",
    "",
]

# Summary table
lines.append("| # | Name | URL | Notes |")
lines.append("|---|------|-----|-------|")

for i, s in enumerate(sources, 1):
    name = (s.get("name", "?") or "?")[:60]
    url = (s.get("url", "") or "")[:60]
    notes = (s.get("notes", "") or "")[:80].replace("\n", " ")
    lines.append(f"| {i} | {name} | {url} | {notes} |")

lines.append("")
lines.append("## Full Source Detail")
lines.append("")

for s in sources:
    name = s.get("name", "Unknown")
    lines.append(f"### {name}")
    lines.append(f"- **UUID:** `{s['id']}`")
    if s.get("url"):
        lines.append(f"- **URL:** {s['url']}")
    if s.get("citation"):
        lines.append(f"- **Citation:** {s['citation']}")
    if s.get("author"):
        lines.append(f"- **Author:** {s['author']}")
    if s.get("year"):
        lines.append(f"- **Year:** {s['year']}")
    if s.get("sourceType"):
        lines.append(f"- **Type:** {s['sourceType']}")
    fire_region = s.get("fireRegion") or s.get("fire_region")
    if fire_region:
        lines.append(f"- **Fire Region:** {fire_region}")
    if s.get("reliability"):
        lines.append(f"- **Reliability:** {s['reliability']}")
    if s.get("notes"):
        lines.append(f"- **Notes:** {s['notes'][:200]}")
    lines.append("")

output = "\n".join(lines)
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(output)

print(f"Wrote {OUTPUT} ({len(lines)} lines, {len(sources)} sources)")
