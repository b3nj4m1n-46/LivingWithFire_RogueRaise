"""Build an interactive HTML search page for finding literature references."""

import csv
import os

BASE = r"C:\Users\bd\Desktop\LivinWitFire"
KB = os.path.join(BASE, "knowledge-base")
os.makedirs(KB, exist_ok=True)

path = os.path.join(BASE, "data-sources", "LITERATURE-REFERENCES-SEARCH.csv")
with open(path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

to_find = [r for r in rows if r.get("have_it") != "Yes"]

html_parts = []
html_parts.append("""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>LivinWitFire Literature Search</title>
<style>
body { font-family: -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
h1 { color: #d35400; }
h2 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 30px; }
table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
th { background: #2c3e50; color: white; padding: 8px 12px; text-align: left; }
td { padding: 6px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
tr:hover { background: #f5f5f5; }
a { color: #2980b9; }
.found td { background: #d5f5e3 !important; }
.triage-likely { border-left: 4px solid #27ae60; }
.triage-check { border-left: 4px solid #f39c12; }
.triage-try { border-left: 4px solid #e74c3c; }
.triage-archive { border-left: 4px solid #8e44ad; }
.search-links a { margin-right: 12px; font-size: 13px; }
input[type=checkbox] { transform: scale(1.3); margin-right: 8px; }
.stats { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 15px; }
</style>
<script>
function markFound(id) {
  var row = document.getElementById(id);
  if (row) row.classList.toggle('found');
  updateCount();
}
function updateCount() {
  var found = document.querySelectorAll('.found').length;
  document.getElementById('found-count').textContent = found;
}
</script>
</head><body>
<h1>LivinWitFire Literature Search</h1>
<div class="stats">
<b>Total to find:</b> """ + str(len(to_find)) + """ |
<b>Found so far:</b> <span id="found-count">0</span> |
<b>Instructions:</b> Click search links to find each document. Check the box when you save the PDF to the knowledge-base folder.
</div>
""")

groups = {
    "LIKELY_ONLINE": "Priority 1: Likely Online - Government/Academic",
    "TRY_ONLINE": "Priority 2: Try Online - Unknown Format",
    "CHECK_LIBRARIES": "Priority 3: Check Libraries - Books",
    "CHECK_ARCHIVES": "Priority 4: Check Archives - Magazine Articles",
    "NEEDS_OUTREACH": "Priority 5: Needs Outreach",
}

triage_classes = {
    "LIKELY_ONLINE": "likely",
    "TRY_ONLINE": "try",
    "CHECK_LIBRARIES": "check",
    "CHECK_ARCHIVES": "archive",
    "NEEDS_OUTREACH": "try",
}

for triage_key, group_title in groups.items():
    group_refs = [r for r in to_find if r.get("triage") == triage_key]
    if not group_refs:
        continue

    badge = triage_classes.get(triage_key, "try")

    html_parts.append(f'<h2>{group_title} ({len(group_refs)} documents)</h2>')
    html_parts.append(
        "<table><tr><th width='50'>Found?</th><th width='120'>ID</th>"
        "<th width='200'>Author</th><th>Title</th><th width='50'>Year</th>"
        "<th width='280'>Search Links</th></tr>"
    )

    for r in group_refs:
        rid = r.get("id", "").replace('"', "")
        author = r.get("author", "")[:40].replace('"', "&quot;")
        title = r.get("title", "")[:60].replace('"', "&quot;")
        year = r.get("year", "")
        gs_url = r.get("google_scholar_url", "")
        gg_url = r.get("google_search_url", "")
        wb_url = r.get("wayback_url", "")
        wc_url = r.get("worldcat_url", "")

        tc = f"triage-{badge}"

        cb = f"markFound('{rid}')"
        row_html = f'<tr id="{rid}" class="{tc}">'
        row_html += f'<td><input type="checkbox" onclick="{cb}"></td>'
        row_html += f"<td>{rid}</td><td>{author}</td><td>{title}</td><td>{year}</td>"
        row_html += '<td class="search-links">'
        if gs_url:
            row_html += f'<a href="{gs_url}" target="_blank">Scholar</a>'
        if gg_url:
            row_html += f'<a href="{gg_url}" target="_blank">Google+PDF</a>'
        if wb_url:
            row_html += f'<a href="{wb_url}" target="_blank">Wayback</a>'
        if wc_url:
            row_html += f'<a href="{wc_url}" target="_blank">WorldCat</a>'
        row_html += "</td></tr>"
        html_parts.append(row_html)

    html_parts.append("</table>")

html_parts.append("""
<h2>Save Instructions</h2>
<p>When you find a PDF, save it to: <code>C:\\Users\\bd\\Desktop\\LivinWitFire\\knowledge-base\\</code></p>
<p>Suggested naming: <code>UCF-REF-40_Moritz_Pyrophytic_1996.pdf</code></p>
<p>Use the reference ID as prefix so we can match files back to the search CSV.</p>
</body></html>""")

html_path = os.path.join(KB, "SEARCH-LITERATURE.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("\n".join(html_parts))

print(f"Wrote {html_path}")
print(f"Total references to find: {len(to_find)}")
