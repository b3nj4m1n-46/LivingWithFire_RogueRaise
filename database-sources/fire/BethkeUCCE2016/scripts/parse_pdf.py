"""
Parse the Bethke et al. 2016 UCCE San Diego paper.

Extracts:
- Appendix II: California Fire-Resistant Plant Lists Database Sources (53 lists from 85 sources)
- Appendix IV: Trait codes used in the plant lists database
- Literature references

Note: Appendix I (the actual plant database with 2,572 records) is a separate Excel file
("Appx I_California Fire-Resistant Plant Lists Database.xlsx") referenced in the PDF
but not embedded. That file has not been located.

Source: Bethke, J., Bell, C., Gonzales, J., Lima, L., Long, A., and MacDonald, C. 2016.
        UCCE San Diego. Research Literature Review of Plant Flammability Testing,
        Fire-Resistant Plant Lists and Relevance of a Plant Flammability Key for
        Ornamental Landscape Plants in the Western States.
        https://ucanr.edu/sites/SaratogaHort/files/235710.pdf
"""

import csv
import json
import os
import re
import sqlite3

import pdfplumber

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
PDF_FILE = os.path.join(
    DATA_DIR, "Sources",
    "Research  Literature Review of Plant Flammability Testing, Fire-resistant "
    "plant lists and relevance of a plant flammability key for ornamental "
    "landscape plants in the Western States.pdf"
)


def extract_trait_codes(pdf):
    """Extract trait codes from Appendix IV (pages 31-33)."""
    codes = []
    for i in range(30, len(pdf.pages)):
        tables = pdf.pages[i].extract_tables()
        for tbl in tables:
            for row in tbl:
                # First non-None cell is the code, then the trait, then the source
                cells = [c for c in row if c is not None]
                if len(cells) >= 3 and cells[0] != "Code/Abbreviation":
                    code = cells[0].strip()
                    trait = cells[1].replace("\n", " ").strip()
                    source = cells[2].replace("\n", " ").strip()
                    if code:
                        codes.append({
                            "code": code,
                            "trait": trait,
                            "list_source": source,
                        })
    return codes


def extract_appendix_ii_sources(pdf):
    """Extract publication citations from Appendix II (pages 20-30)."""
    sources = []
    for i in range(19, 30):
        text = pdf.pages[i].extract_text()
        if not text:
            continue
        # Each source starts with "Publication Citation" or a citation block
        # Parse line by line, collecting citation blocks
        lines = text.split("\n")
        current_citation = []
        current_notes = []
        in_notes = False

        for line in lines:
            line = line.strip()
            if line.startswith("Publication Citation") or line.startswith("Appendix"):
                if current_citation:
                    sources.append({
                        "citation": " ".join(current_citation),
                        "notes": " ".join(current_notes) if current_notes else "",
                    })
                    current_citation = []
                    current_notes = []
                    in_notes = False
                continue
            if line.startswith("Notes:"):
                in_notes = True
                note_text = line[6:].strip()
                if note_text:
                    current_notes.append(note_text)
                continue
            if in_notes:
                current_notes.append(line)
            elif line:
                current_citation.append(line)

        if current_citation:
            sources.append({
                "citation": " ".join(current_citation),
                "notes": " ".join(current_notes) if current_notes else "",
            })

    return sources


def main():
    print(f"Reading PDF: {PDF_FILE}")
    pdf = pdfplumber.open(PDF_FILE)
    print(f"Pages: {len(pdf.pages)}")

    # Extract trait codes
    trait_codes = extract_trait_codes(pdf)
    print(f"Trait codes extracted: {len(trait_codes)}")

    # Extract Appendix II sources
    sources = extract_appendix_ii_sources(pdf)
    print(f"Plant list sources extracted: {len(sources)}")

    # --- Trait Codes CSV ---
    tc_path = os.path.join(DATA_DIR, "trait_codes.csv")
    with open(tc_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["code", "trait", "list_source"])
        writer.writeheader()
        for tc in trait_codes:
            writer.writerow(tc)
    print(f"Wrote {tc_path}")

    # --- Sources CSV ---
    src_path = os.path.join(DATA_DIR, "plant_list_sources.csv")
    with open(src_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["citation", "notes"])
        writer.writeheader()
        for s in sources:
            writer.writerow(s)
    print(f"Wrote {src_path}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "trait_codes": trait_codes,
            "plant_list_sources": sources,
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "data.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE trait_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT,
            trait TEXT,
            list_source TEXT
        )
    """)
    for tc in trait_codes:
        cur.execute("INSERT INTO trait_codes (code, trait, list_source) VALUES (?, ?, ?)",
                    (tc["code"], tc["trait"], tc["list_source"]))

    cur.execute("""
        CREATE TABLE plant_list_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            citation TEXT,
            notes TEXT
        )
    """)
    for s in sources:
        cur.execute("INSERT INTO plant_list_sources (citation, notes) VALUES (?, ?)",
                    (s["citation"], s["notes"]))

    conn.commit()
    conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
