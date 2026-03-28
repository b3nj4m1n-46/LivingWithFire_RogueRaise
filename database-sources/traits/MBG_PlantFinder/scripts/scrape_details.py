"""
Scrape MBG Plant Finder detail pages for all 8,840 plants.

Each detail page contains: zones, sun, water, height, spread,
bloom color, bloom time, maintenance, problems, suggested uses,
native range, garden merit, wildlife value, and cultural notes.

Outputs enriched plants.csv with all detail fields.
"""

import csv
import json
import os
import re
import sqlite3
import sys
import time

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
DETAIL_URL = "https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?taxonid={}&isprofile=0"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# Fields we want to extract from detail pages
DETAIL_FIELDS = [
    "type", "family", "native_range", "zone", "height", "spread",
    "bloom_time", "bloom_description", "flower", "sun", "water",
    "maintenance", "suggested_use", "tolerate", "garden_merit",
    "notable_characteristics", "problems", "garden_uses",
    "companion_plants", "culture", "noteworthy_characteristics",
]


def scrape_detail(taxon_id):
    """Scrape a single plant detail page."""
    url = DETAIL_URL.format(taxon_id)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        return {"error": str(e)}

    soup = BeautifulSoup(resp.text, "html.parser")
    data = {}

    # The MBG detail pages use labeled sections
    # Look for dt/dd pairs, table rows, or labeled divs

    # Try finding all text content and parse key-value pairs
    # MBG uses a specific structure with labels

    # Method 1: Look for specific class patterns
    for div in soup.find_all(["div", "span", "p", "td", "dt", "dd", "li"]):
        text = div.get_text(strip=True)
        if not text:
            continue

        # Match "Label: Value" patterns
        for field_label, field_key in [
            ("Type:", "type"),
            ("Family:", "family"),
            ("Native Range:", "native_range"),
            ("Zone:", "zone"),
            ("Height:", "height"),
            ("Spread:", "spread"),
            ("Bloom Time:", "bloom_time"),
            ("Bloom Description:", "bloom_description"),
            ("Flower:", "flower"),
            ("Sun:", "sun"),
            ("Water:", "water"),
            ("Maintenance:", "maintenance"),
            ("Suggested Use:", "suggested_use"),
            ("Tolerate:", "tolerate"),
            ("Notable Characteristics:", "notable_characteristics"),
            ("Noteworthy Characteristics:", "noteworthy_characteristics"),
            ("Problems:", "problems"),
            ("Garden Uses:", "garden_uses"),
            ("Culture:", "culture"),
        ]:
            if field_label.lower() in text.lower():
                # Extract value after the label
                idx = text.lower().find(field_label.lower())
                if idx >= 0:
                    val = text[idx + len(field_label):].strip()
                    if val and field_key not in data:
                        data[field_key] = val

    # Method 2: Look for the specific MBG HTML structure
    # They often use <span class="annotitle"> for labels
    for span in soup.find_all("span"):
        cls = span.get("class", [])
        text = span.get_text(strip=True)
        if not text:
            continue
        # Check if this is a label followed by a value
        next_sib = span.next_sibling
        if next_sib:
            val = ""
            if hasattr(next_sib, "get_text"):
                val = next_sib.get_text(strip=True)
            elif isinstance(next_sib, str):
                val = next_sib.strip()

            text_lower = text.lower().rstrip(":")
            for key in ["type", "family", "zone", "height", "spread",
                        "bloom time", "flower", "sun", "water",
                        "maintenance", "tolerate", "native range",
                        "suggested use", "problems", "culture"]:
                if key in text_lower and val:
                    field_key = key.replace(" ", "_")
                    if field_key not in data:
                        data[field_key] = val

    # Method 3: Get all text and try regex
    full_text = soup.get_text()
    for pattern, key in [
        (r"(?:Hardiness\s*)?Zone[s]?\s*[:]\s*(.+?)(?:\n|$)", "zone"),
        (r"Height\s*[:]\s*(.+?)(?:\n|$)", "height"),
        (r"Spread\s*[:]\s*(.+?)(?:\n|$)", "spread"),
        (r"Bloom Time\s*[:]\s*(.+?)(?:\n|$)", "bloom_time"),
        (r"Sun\s*[:]\s*(.+?)(?:\n|$)", "sun"),
        (r"Water\s*[:]\s*(.+?)(?:\n|$)", "water"),
        (r"Maintenance\s*[:]\s*(.+?)(?:\n|$)", "maintenance"),
        (r"Flower\s*[:]\s*(.+?)(?:\n|$)", "flower"),
        (r"Tolerate[s]?\s*[:]\s*(.+?)(?:\n|$)", "tolerate"),
    ]:
        if key not in data:
            m = re.search(pattern, full_text, re.IGNORECASE)
            if m:
                data[key] = m.group(1).strip()

    return data


def main():
    # Load plant list
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    plants = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            plants.append(row)

    print(f"Total plants to scrape: {len(plants)}")

    # Check for existing progress file
    progress_path = os.path.join(DATA_DIR, "scrape_progress.json")
    scraped = {}
    if os.path.exists(progress_path):
        with open(progress_path, "r", encoding="utf-8") as f:
            scraped = json.load(f)
        print(f"Resuming from {len(scraped)} already scraped")

    # Scrape details
    total = len(plants)
    for i, plant in enumerate(plants):
        tid = plant["taxon_id"]
        if tid in scraped:
            continue

        detail = scrape_detail(tid)
        scraped[tid] = detail

        if (i + 1) % 50 == 0 or i == total - 1:
            # Save progress
            with open(progress_path, "w", encoding="utf-8") as f:
                json.dump(scraped, f, ensure_ascii=False)
            pct = (i + 1) / total * 100
            print(f"  [{i+1}/{total}] ({pct:.1f}%) - {plant['scientific_name']}: {len(detail)} fields")

        time.sleep(0.5)  # 500ms delay - polite but faster

    print(f"\nScraped {len(scraped)} detail pages")

    # Merge details into plant records
    detail_fields = set()
    for tid, detail in scraped.items():
        detail_fields.update(detail.keys())
    detail_fields.discard("error")
    detail_fields = sorted(detail_fields)

    print(f"Detail fields found: {detail_fields}")

    # Write enriched CSV
    enriched_path = os.path.join(DATA_DIR, "plants_enriched.csv")
    base_fields = ["taxon_id", "scientific_name", "common_name"]
    all_fields = base_fields + detail_fields

    with open(enriched_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=all_fields, extrasaction="ignore")
        writer.writeheader()
        for plant in plants:
            tid = plant["taxon_id"]
            row = dict(plant)
            if tid in scraped:
                row.update(scraped[tid])
            writer.writerow(row)
    print(f"Wrote {enriched_path}")

    # Write enriched SQLite
    db_path = os.path.join(DATA_DIR, "plants_enriched.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cols = ", ".join(f'"{f}" TEXT' for f in all_fields)
    cur.execute(f"CREATE TABLE plants ({cols})")
    cur.execute("CREATE INDEX idx_taxon ON plants(taxon_id)")
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")

    placeholders = ", ".join(["?"] * len(all_fields))
    for plant in plants:
        tid = plant["taxon_id"]
        row = dict(plant)
        if tid in scraped:
            row.update(scraped[tid])
        vals = [row.get(f, "") for f in all_fields]
        cur.execute(f"INSERT INTO plants VALUES ({placeholders})", vals)

    conn.commit()

    # Stats
    for field in detail_fields[:10]:
        cur.execute(f'SELECT COUNT(*) FROM plants WHERE "{field}" != "" AND "{field}" IS NOT NULL')
        count = cur.fetchone()[0]
        print(f"  {field}: {count} plants have data")

    conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
