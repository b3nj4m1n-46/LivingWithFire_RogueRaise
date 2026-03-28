#!/usr/bin/env python3
"""
NCSU Extension Gardener Plant Toolbox Scraper
Scrapes ~4,678 plants from https://plants.ces.ncsu.edu/
Outputs: JSON, CSV, SQLite
"""

import csv
import json
import re
import sqlite3
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://plants.ces.ncsu.edu"
SITEMAP_URL = f"{BASE_URL}/sitemap.xml"
OUTPUT_DIR = Path(__file__).parent / "output"
PROGRESS_FILE = OUTPUT_DIR / "progress.json"
DELAY_SECONDS = 1.5
MAX_RETRIES = 3
SAVE_EVERY = 50

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "NCSU-Plant-Scraper/1.0 (Educational/Research Use)"
})


def fetch_sitemap():
    """Parse sitemap.xml and return list of plant URLs."""
    print("Fetching sitemap...")
    resp = SESSION.get(SITEMAP_URL, timeout=30)
    resp.raise_for_status()

    root = ET.fromstring(resp.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = []
    for loc in root.findall(".//sm:loc", ns):
        url = (loc.text or "").strip()
        # Only keep plant detail pages
        if re.match(r"https://plants\.ces\.ncsu\.edu/plants/[^/]+/$", url):
            urls.append(url)

    print(f"Found {len(urls)} plant URLs in sitemap")
    return sorted(urls)


def fetch_page(url):
    """Fetch a page with retries and exponential backoff."""
    for attempt in range(MAX_RETRIES):
        try:
            resp = SESSION.get(url, timeout=30)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            wait = 2 ** (attempt + 1)
            print(f"  Error fetching {url}: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    print(f"  FAILED after {MAX_RETRIES} attempts: {url}")
    return None


def get_dt_dd_map(soup):
    """Extract all DT->DD mappings from all DL elements on the page.
    Returns a dict mapping normalized DT text -> list of DD text values.
    """
    mapping = {}
    for dl in soup.find_all("dl"):
        current_dt = None
        for child in dl.children:
            if child.name == "dt":
                current_dt = child.get_text(strip=True).rstrip(":")
            elif child.name == "dd" and current_dt:
                # Skip tags dd and print-only dd
                classes = child.get("class", [])
                if "tags" in classes or "d-none" in classes:
                    continue
                if "garden_callout" in classes:
                    continue
                text = child.get_text(strip=True)
                if text:
                    mapping.setdefault(current_dt, []).append(text)
    return mapping


def extract_plant_data(html, url):
    """Parse a plant page and return a dict of all fields."""
    soup = BeautifulSoup(html, "lxml")
    data = {"url": url}

    # Scientific name
    h1 = soup.find("h1")
    data["scientific_name"] = h1.get_text(strip=True) if h1 else ""

    # Slug from URL
    data["slug"] = url.rstrip("/").split("/")[-1]

    # Common names
    cn_heading = soup.find("h2", class_="cn_heading")
    common_names = []
    if cn_heading:
        ul = cn_heading.find_next_sibling("ul")
        if ul:
            common_names = [li.get_text(strip=True) for li in ul.find_all("li")]
    data["common_names"] = common_names

    # Synonyms ("Previously known as")
    syn_heading = soup.find("h3", class_="synonym_heading")
    synonyms = []
    if syn_heading:
        ul = syn_heading.find_next_sibling("ul")
        if ul:
            synonyms = [li.get_text(strip=True) for li in ul.find_all("li")]
    data["synonyms"] = synonyms

    # Cultivars
    cultivars = []
    for li in soup.select("li.detail_cultivar"):
        name = li.get_text(strip=True)
        cultivars.append(name)
    data["cultivars"] = cultivars

    # Tags
    tags = []
    for dd in soup.select("dd.tags"):
        for a in dd.find_all("a", class_="badge"):
            tag = a.get_text(strip=True).lstrip("#")
            if tag:
                tags.append(tag)
    data["tags"] = tags

    # Image URLs
    images = []
    for img in soup.select("img.img-thumbnail"):
        src = img.get("src", "")
        if src:
            images.append(src)
    data["image_urls"] = images

    # Height & Width — in <span class="detail_display_attribute"> under "Dimensions:" DT
    for span in soup.select("span.detail_display_attribute"):
        text = span.get_text(strip=True)
        if text.startswith("Height:"):
            data["height"] = text.replace("Height:", "").strip()
        elif text.startswith("Width:"):
            data["width"] = text.replace("Width:", "").strip()

    # All DT/DD fields
    dd_map = get_dt_dd_map(soup)

    # Map DT labels to our field names
    field_mapping = {
        # Basic info
        "Phonetic Spelling": "phonetic_spelling",
        "Description": "description",
        # Taxonomy
        "Genus": "genus",
        "Species": "species",
        "Family": "family",
        # Attributes
        "Life Cycle": "life_cycle",
        "Origin": "origin",
        "Propagation Strategy": "propagation_strategy",
        "Wildlife Value": "wildlife_value",
        "Play Value": "play_value",
        "Edibility": "edibility",
        "Resistance": "resistance",
        # Growth characteristics
        "Plant Type": "plant_type",
        "Woody Plant Leaf Characteristics": "woody_leaf_characteristics",
        "Habit/Form": "habit_form",
        "Growth Rate": "growth_rate",
        "Maintenance": "maintenance",
        "Texture": "texture",
        # Growing conditions
        "Light": "light",
        "Soil Texture": "soil_texture",
        "Soil pH": "soil_ph",
        "Soil Drainage": "soil_drainage",
        "Available Space To Plant": "available_space",
        "NC Region": "nc_region",
        "USDA Plant Hardiness Zone": "usda_zones",
        # Dimensions
        "Height": "height",
        "Width": "width",
        # Fruit
        "Fruit Color": "fruit_color",
        "Fruit Value To Gardener": "fruit_value",
        "Display/Harvest Time": "fruit_harvest_time",
        "Fruit Type": "fruit_type",
        "Fruit Length": "fruit_length",
        "Fruit Width": "fruit_width",
        "Fruit Description": "fruit_description",
        # Flowers
        "Flower Color": "flower_color",
        "Flower Value To Gardener": "flower_value",
        "Flower Bloom Time": "flower_bloom_time",
        "Flower Shape": "flower_shape",
        "Flower Petals": "flower_petals",
        "Flower Size": "flower_size",
        "Flower Description": "flower_description",
        "Flower Inflorescence": "flower_inflorescence",
        # Leaves
        "Leaf Color": "leaf_color",
        "Leaf Value To Gardener": "leaf_value",
        "Deciduous Leaf Fall Color": "fall_color",
        "Fall Color": "fall_color",
        "Leaf Type": "leaf_type",
        "Leaf Arrangement": "leaf_arrangement",
        "Leaf Shape": "leaf_shape",
        "Leaf Margin": "leaf_margin",
        "Leaf Length": "leaf_length",
        "Leaf Width": "leaf_width",
        "Leaf Description": "leaf_description",
        "Hairs Present": "hairs_present",
        # Bark
        "Bark Color": "bark_color",
        "Bark Attachment": "bark_attachment",
        "Surface/Attachment": "bark_surface",
        "Bark Description": "bark_description",
        # Stem
        "Stem Color": "stem_color",
        "Stem Is Aromatic": "stem_aromatic",
        "Stem Form": "stem_form",
        "Stem Surface": "stem_surface",
        "Stem Description": "stem_description",
        # Landscape
        "Landscape Location": "landscape_location",
        "Landscape Theme": "landscape_theme",
        "Design Feature": "design_feature",
        "Attracts": "attracts",
        "Problems": "problems",
        "Poison Severity": "poison_severity",
        "Poison Symptoms": "poison_symptoms",
        "Poison Toxic Principle": "poison_toxic_principle",
    }

    for dt_label, field_name in field_mapping.items():
        values = dd_map.get(dt_label, [])
        if field_name not in data:
            if len(values) == 1:
                data[field_name] = values[0]
            elif len(values) > 1:
                data[field_name] = values
            else:
                data[field_name] = ""

    return data


def load_progress():
    """Load set of already-scraped URLs."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()


def save_progress(scraped_urls):
    """Save set of scraped URLs for resume capability."""
    with open(PROGRESS_FILE, "w") as f:
        json.dump(sorted(scraped_urls), f)


def save_json(plants):
    """Save all plant data as JSON."""
    path = OUTPUT_DIR / "plants.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(plants, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(plants)} plants to {path}")


def save_csv(plants):
    """Save plant data as flattened CSV."""
    if not plants:
        return

    path = OUTPUT_DIR / "plants.csv"

    # Collect all possible field names
    all_keys = set()
    for p in plants:
        all_keys.update(p.keys())

    # Define column order — important fields first
    priority_cols = [
        "scientific_name", "slug", "common_names", "synonyms", "phonetic_spelling",
        "description", "genus", "species", "family",
        "life_cycle", "origin", "plant_type", "habit_form",
        "growth_rate", "maintenance", "height", "width",
        "light", "soil_texture", "soil_drainage", "soil_ph",
        "usda_zones", "nc_region",
        "flower_color", "flower_bloom_time", "flower_description",
        "fruit_color", "fruit_type", "fruit_description",
        "leaf_color", "fall_color", "leaf_type", "leaf_description",
        "bark_color", "bark_description",
        "landscape_location", "landscape_theme", "design_feature",
        "wildlife_value", "attracts", "resistance", "problems",
        "cultivars", "tags", "image_urls", "url",
    ]
    remaining = sorted(all_keys - set(priority_cols))
    fieldnames = [c for c in priority_cols if c in all_keys] + remaining

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for plant in plants:
            row = {}
            for key in fieldnames:
                val = plant.get(key, "")
                if isinstance(val, list):
                    val = " | ".join(str(v) for v in val)
                row[key] = val
            writer.writerow(row)

    print(f"Saved {len(plants)} plants to {path}")


def save_sqlite(plants):
    """Save plant data to SQLite with normalized tables."""
    path = OUTPUT_DIR / "plants.db"
    if path.exists():
        path.unlink()

    conn = sqlite3.connect(str(path))
    cur = conn.cursor()

    # Main plants table — text fields only, lists get their own tables
    list_fields = {"common_names", "synonyms", "cultivars", "tags", "image_urls"}
    # Also handle fields that can be either string or list
    # Determine which fields are always scalar
    scalar_fields = set()
    multi_fields = set()
    all_keys = set()
    for p in plants:
        all_keys.update(p.keys())
    for key in all_keys:
        for p in plants:
            if isinstance(p.get(key), list):
                multi_fields.add(key)
                break
        else:
            scalar_fields.add(key)

    # Always treat these as multi-value
    multi_fields.update(list_fields)
    scalar_fields -= list_fields

    scalar_cols = sorted(scalar_fields)

    # Create plants table
    col_defs = ", ".join(f'"{c}" TEXT' for c in scalar_cols)
    cur.execute(f"""
        CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            {col_defs}
        )
    """)

    # Create multi-value table
    cur.execute("""
        CREATE TABLE plant_attributes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plant_id INTEGER NOT NULL,
            field TEXT NOT NULL,
            value TEXT NOT NULL,
            FOREIGN KEY (plant_id) REFERENCES plants(id)
        )
    """)

    for plant in plants:
        # Insert scalar values
        vals = []
        for c in scalar_cols:
            v = plant.get(c, "")
            if isinstance(v, list):
                v = " | ".join(str(x) for x in v)
            vals.append(str(v) if v else "")

        placeholders = ", ".join("?" for _ in scalar_cols)
        col_names = ", ".join(f'"{c}"' for c in scalar_cols)
        cur.execute(f"INSERT INTO plants ({col_names}) VALUES ({placeholders})", vals)
        plant_id = cur.lastrowid

        # Insert multi-value fields
        for field in multi_fields:
            values = plant.get(field, [])
            if isinstance(values, str):
                values = [values] if values else []
            for v in values:
                cur.execute(
                    "INSERT INTO plant_attributes (plant_id, field, value) VALUES (?, ?, ?)",
                    (plant_id, field, str(v))
                )

    # Create indexes
    cur.execute('CREATE INDEX idx_plants_scientific ON plants("scientific_name")')
    cur.execute('CREATE INDEX idx_plants_genus ON plants("genus")')
    cur.execute('CREATE INDEX idx_plants_family ON plants("family")')
    cur.execute("CREATE INDEX idx_attrs_plant ON plant_attributes(plant_id)")
    cur.execute("CREATE INDEX idx_attrs_field ON plant_attributes(field)")

    conn.commit()
    conn.close()
    print(f"Saved {len(plants)} plants to {path}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Get all plant URLs from sitemap
    plant_urls = fetch_sitemap()
    if not plant_urls:
        print("No plant URLs found. Exiting.")
        sys.exit(1)

    # Load progress for resume
    scraped_urls = load_progress()
    if scraped_urls:
        print(f"Resuming — {len(scraped_urls)} plants already scraped")

    # Load existing data if resuming
    json_path = OUTPUT_DIR / "plants.json"
    if json_path.exists() and scraped_urls:
        with open(json_path) as f:
            all_plants = json.load(f)
        print(f"Loaded {len(all_plants)} existing plants from JSON")
    else:
        all_plants = []

    # Filter to remaining URLs
    remaining = [u for u in plant_urls if u not in scraped_urls]
    total = len(plant_urls)
    done = len(scraped_urls)

    print(f"\nScraping {len(remaining)} remaining plants (of {total} total)...\n")

    try:
        for i, url in enumerate(remaining, start=1):
            count = done + i
            slug = url.rstrip("/").split("/")[-1]
            print(f"[{count}/{total}] {slug}...", end=" ", flush=True)

            html = fetch_page(url)
            if html is None:
                print("SKIPPED")
                continue

            plant = extract_plant_data(html, url)
            all_plants.append(plant)
            scraped_urls.add(url)
            print("OK")

            # Periodic save
            if count % SAVE_EVERY == 0:
                print(f"  Saving progress ({count} plants)...")
                save_json(all_plants)
                save_progress(scraped_urls)

            time.sleep(DELAY_SECONDS)

    except KeyboardInterrupt:
        print("\n\nInterrupted! Saving progress...")

    # Final save
    print(f"\nSaving all {len(all_plants)} plants...")
    save_json(all_plants)
    save_csv(all_plants)
    save_sqlite(all_plants)
    save_progress(scraped_urls)

    print("\nDone!")
    print(f"  JSON:   {OUTPUT_DIR / 'plants.json'}")
    print(f"  CSV:    {OUTPUT_DIR / 'plants.csv'}")
    print(f"  SQLite: {OUTPUT_DIR / 'plants.db'}")


if __name__ == "__main__":
    main()
