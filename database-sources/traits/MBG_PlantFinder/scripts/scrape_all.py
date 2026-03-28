"""
Scrape Missouri Botanical Garden Plant Finder - all A-Z letter pages.

Uses requests + BeautifulSoup to fetch each letter page and extract
taxon_id, scientific_name, common_name from the plant list links.
"""

import csv
import json
import os
import re
import sqlite3
import time

import requests
from bs4 import BeautifulSoup

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
BASE_URL = "https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderListResults.aspx?letter={}"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}


def scrape_letter(letter):
    """Scrape all plants for a given letter."""
    url = BASE_URL.format(letter)
    print(f"  Fetching {letter}...", end=" ", flush=True)
    resp = requests.get(url, headers=HEADERS, timeout=60)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    plants = []

    for link in soup.find_all("a", href=re.compile(r"PlantFinderDetails")):
        href = link.get("href", "")
        m = re.search(r"taxonid=(\d+)", href)
        taxon_id = m.group(1) if m else ""
        sci_name = link.get_text(strip=True)

        # Common name is in adjacent text within the parent element
        parent = link.parent
        if parent:
            full_text = parent.get_text(strip=True)
            common = full_text.replace(sci_name, "").strip()
            common = re.sub(r"^[\s\-–—]+", "", common).strip()
        else:
            common = ""

        if taxon_id and sci_name:
            plants.append({
                "taxon_id": taxon_id,
                "scientific_name": sci_name,
                "common_name": common,
            })

    print(f"{len(plants)} plants")
    return plants


def main():
    all_plants = []
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    print(f"Scraping MBG Plant Finder ({len(letters)} letters)...")
    for letter in letters:
        plants = scrape_letter(letter)
        all_plants.extend(plants)
        time.sleep(1)  # Be polite

    print(f"\nTotal plants: {len(all_plants)}")

    # Deduplicate by taxon_id
    seen = set()
    unique = []
    for p in all_plants:
        if p["taxon_id"] not in seen:
            seen.add(p["taxon_id"])
            unique.append(p)
    print(f"Unique plants: {len(unique)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["taxon_id", "scientific_name", "common_name"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in unique:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Missouri Botanical Garden Plant Finder",
            "url": "https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderSearch.aspx",
            "note": "Plant list only (scientific name, common name, taxon ID). Detail pages with full horticultural data (zones, sun, water, etc.) require individual page scraping.",
            "detail_url_pattern": "https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?taxonid={taxon_id}&isprofile=0",
            "plants": unique,
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE plants (
            taxon_id TEXT PRIMARY KEY,
            scientific_name TEXT,
            common_name TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    for p in unique:
        cur.execute("INSERT INTO plants (taxon_id, scientific_name, common_name) VALUES (?, ?, ?)",
                    (p["taxon_id"], p["scientific_name"], p["common_name"]))
    conn.commit()
    conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
