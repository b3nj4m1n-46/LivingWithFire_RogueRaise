"""Generate ATTRIBUTE-REGISTRY.md from the hierarchical attributes API response."""

import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT = os.path.join(BASE, "api-reference", "attributes-hierarchical.json")
OUTPUT = os.path.join(BASE, "api-reference", "ATTRIBUTE-REGISTRY.md")

with open(INPUT, "r", encoding="utf-8") as f:
    raw = json.load(f)

attrs = raw["data"] if isinstance(raw, dict) and "data" in raw else raw

lines = [
    "# Production Attribute Registry",
    "",
    "Complete attribute hierarchy for the Living With Fire production database.",
    "Each attribute has a UUID, value type, allowed values, and position in the tree.",
    "",
    "**Use this document to:** map source dataset columns to production attributes,",
    "validate values before import, understand the EAV schema.",
    "",
    f"**Total root categories:** {len(attrs)}",
    "",
    "---",
    "",
]


def render_attr(attr, depth=0):
    indent = "  " * depth
    hashes = "#" * min(depth + 2, 6)
    name = attr["name"]
    uid = attr["id"]
    vtype = attr.get("valueType", "text")
    selection = attr.get("selectionType", "")
    units = attr.get("valueUnits", "")
    calculated = attr.get("isCalculated", False)
    notes = attr.get("notes", "")
    allowed = attr.get("valuesAllowed", None)

    lines.append(f"{indent}{hashes} {name}")
    lines.append(f"{indent}- **UUID:** `{uid}`")
    type_str = vtype
    if selection:
        type_str += f" ({selection})"
    lines.append(f"{indent}- **Type:** {type_str}")
    if units:
        lines.append(f"{indent}- **Units:** {units}")
    if calculated:
        lines.append(f"{indent}- **Calculated:** Yes")
    if notes:
        lines.append(f"{indent}- **Notes:** {notes}")
    if allowed:
        if isinstance(allowed, list):
            vals = []
            for v in allowed:
                if isinstance(v, dict):
                    vals.append(f"`{v.get('value', v.get('id', '?'))}`")
                else:
                    vals.append(f"`{v}`")
            lines.append(f"{indent}- **Allowed Values:** {', '.join(vals[:25])}")
            if len(vals) > 25:
                lines.append(f"{indent}  *(+{len(vals) - 25} more)*")
    lines.append("")

    for child in attr.get("children", []):
        render_attr(child, depth + 1)


total_attrs = 0
for attr in attrs:
    render_attr(attr, 0)


with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Wrote {OUTPUT} ({len(lines)} lines)")
