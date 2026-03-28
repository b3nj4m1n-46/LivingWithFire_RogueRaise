---
name: add-datasource
description: Add a new data source to the LivinWitFire collection following the standard folder structure, formats, and documentation conventions.
command: /add-datasource
---

# Add New Data Source

When the user provides a new PDF, CSV, XLSX, or URL to add to the collection, follow this exact process.

## Steps

1. **Create folder structure:**
```
NewDatasetName/
├── Sources/
├── scripts/
```

2. **Copy source files** to `Sources/`. Keep original filenames.

3. **Examine the data.** Determine:
   - How many plants/records
   - What fields are available
   - What rating scales or categories exist
   - Geographic scope
   - Source methodology

4. **Write the parser script** in `scripts/`. Follow existing patterns:
   - For PDFs: use `pdfplumber`
   - For XLSX: use `openpyxl`
   - For web scraping: use `requests` + `beautifulsoup4`
   - For data already in the script: embed as Python dicts

5. **Generate standard outputs:**
   - `plants.csv` — primary output, UTF-8, comma-delimited
   - `plants.json` — include metadata (source, URL, rating definitions). Skip if >50K records.
   - `plants.db` — SQLite with `CREATE INDEX idx_sci ON plants(scientific_name)`

6. **Write README.md** with these sections:
   - Title with source name
   - Metadata block: Source, URL, Plants count, Region
   - ## About (what it is, methodology)
   - ## Output vs. Source (what's filtered/unfiltered)
   - ## Rating/Category Distribution table
   - ## Data Fields table (field name → description)
   - ## Files list
   - ## Sources list
   - ## Citation

7. **Assign a Source ID** in `DATA-PROVENANCE.md`:
   - Use the next available number in the appropriate category
   - Include: Source ID, Folder name, Full citation, Access date

8. **Update root documents:**
   - `SOURCE-CROSSREF.md` — if this source was in the original requirements doc
   - `README.md` — add row to the inventory table
   - `CLAUDE.md` — update counts if significant

## Naming Guidelines

- Folder: `PascalCase` or `UPPERCASE_Abbreviation` (match existing style)
- Avoid spaces in folder names
- Use descriptive names: `CalIPC_Invasive` not `dataset_50`

## Source ID Format

| Category | Prefix | Next Available |
|----------|--------|----------------|
| Fire Resistance | FIRE- | FIRE-13 |
| Deer Resistance | DEER- | DEER-07 |
| Plant Traits | TRAIT- | TRAIT-03 |
| Taxonomy | TAXON- | TAXON-04 |
| Water | WATER- | WATER-03 |
| Drought | DROUGHT- | DROUGHT-02 |
| Pollinators | POLL- | POLL-04 |
| Birds | BIRD- | BIRD-02 |
| Native Plants | NATIVE- | NATIVE-05 |
| Invasiveness | INVAS- | INVAS-06 |

## Quality Checks

Before marking complete, verify:
- [ ] `plants.csv` opens correctly in Excel/LibreOffice
- [ ] `plants.db` has indexes on `scientific_name`
- [ ] `README.md` has citation and field definitions
- [ ] Source ID assigned in `DATA-PROVENANCE.md`
- [ ] No sensitive data (API keys, passwords, personal emails) in outputs
