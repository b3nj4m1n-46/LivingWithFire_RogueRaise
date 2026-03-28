"""
Parse the saved HTML from the Fire Performance Plant Selector (Wayback Machine archive)
and export to CSV, JSON, and SQLite.

Source: https://fire.sref.info/selector/plant-list (archived Sept 2025)
"""

import csv
import json
import os
import re
import sqlite3
from html.parser import HTMLParser

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
HTML_FILE = r"C:\Users\bd\Documents\GitHub\PRISM\docs\research\Plant List — Fire Performance Plant Selector.html"


class PlantTableParser(HTMLParser):
    """Extract plant rows from the #plantsList table."""

    def __init__(self):
        super().__init__()
        self.in_plants_table = False
        self.in_tbody = False
        self.in_row = False
        self.in_cell = False
        self.in_link = False
        self.current_row = []
        self.current_cell = ""
        self.current_slug = ""
        self.plants = []
        self.tbody_depth = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "table" and attrs_dict.get("id") == "plantsList":
            self.in_plants_table = True
        elif self.in_plants_table and tag == "tbody":
            self.in_tbody = True
            self.tbody_depth += 1
        elif self.in_tbody and tag == "tr":
            self.in_row = True
            self.current_row = []
            self.current_slug = ""
        elif self.in_row and tag == "td":
            self.in_cell = True
            self.current_cell = ""
        elif self.in_cell and tag == "a":
            self.in_link = True
            href = attrs_dict.get("href", "")
            # Extract slug from URL like .../plants/amelanchier-laevis
            match = re.search(r"/plants/([^/\"]+)", href)
            if match:
                self.current_slug = match.group(1)

    def handle_endtag(self, tag):
        if tag == "td" and self.in_cell:
            self.in_cell = False
            self.current_row.append(self.current_cell.strip())
        elif tag == "tr" and self.in_row:
            self.in_row = False
            if len(self.current_row) == 5:
                self.plants.append({
                    "common_name": self.current_row[0],
                    "scientific_name": self.current_row[1],
                    "size_feet": self.current_row[2],
                    "firewise_rating": self.current_row[3],
                    "landscape_zone": self.current_row[4],
                    "slug": self.current_slug,
                })
        elif tag == "a" and self.in_link:
            self.in_link = False
        elif tag == "tbody" and self.in_tbody:
            self.tbody_depth -= 1
            if self.tbody_depth == 0:
                self.in_tbody = False
        elif tag == "table" and self.in_plants_table:
            self.in_plants_table = False

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell += data


def parse_firewise_rating(rating_str):
    """Parse firewise rating into numeric code and label."""
    rating_str = rating_str.strip()
    mapping = {
        "Firewise (1)": (1, "Firewise"),
        "MODERATELY Firewise (2)": (2, "Moderately Firewise"),
        "AT RISK Firewise (3)": (3, "At Risk Firewise"),
        "NOT Firewise (4)": (4, "Not Firewise"),
    }
    if rating_str in mapping:
        return mapping[rating_str]
    # Handle edge cases like "13" for beaked hazelnut
    return (None, rating_str)


def main():
    print(f"Reading HTML from: {HTML_FILE}")
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        html_content = f.read()

    parser = PlantTableParser()
    parser.feed(html_content)
    plants = parser.plants

    print(f"Parsed {len(plants)} plants")

    # Enrich with parsed rating fields
    for p in plants:
        code, label = parse_firewise_rating(p["firewise_rating"])
        p["firewise_rating_code"] = code
        p["firewise_rating_label"] = label

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = [
        "common_name", "scientific_name", "size_feet",
        "firewise_rating", "firewise_rating_code", "firewise_rating_label",
        "landscape_zone", "slug",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in plants:
            writer.writerow({k: p[k] for k in fields})
    print(f"Wrote {csv_path} ({len(plants)} rows)")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(plants, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            common_name TEXT NOT NULL,
            scientific_name TEXT NOT NULL,
            size_feet TEXT,
            firewise_rating TEXT,
            firewise_rating_code INTEGER,
            firewise_rating_label TEXT,
            landscape_zone TEXT,
            slug TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_scientific_name ON plants(scientific_name)")
    cur.execute("CREATE INDEX idx_firewise_code ON plants(firewise_rating_code)")
    cur.execute("CREATE INDEX idx_landscape_zone ON plants(landscape_zone)")

    for p in plants:
        cur.execute(
            """INSERT INTO plants
               (common_name, scientific_name, size_feet, firewise_rating,
                firewise_rating_code, firewise_rating_label, landscape_zone, slug)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                p["common_name"], p["scientific_name"], p["size_feet"],
                p["firewise_rating"], p["firewise_rating_code"],
                p["firewise_rating_label"], p["landscape_zone"], p["slug"],
            ),
        )
    conn.commit()

    # Print summary stats
    cur.execute("SELECT firewise_rating_label, COUNT(*) FROM plants GROUP BY firewise_rating_label ORDER BY COUNT(*) DESC")
    print("\nFirewise Rating Distribution:")
    for label, count in cur.fetchall():
        print(f"  {label}: {count}")

    cur.execute("SELECT landscape_zone, COUNT(*) FROM plants GROUP BY landscape_zone ORDER BY landscape_zone")
    print("\nLandscape Zone Distribution:")
    for zone, count in cur.fetchall():
        print(f"  {zone}: {count}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
