"""Fix supply_categories for all companies in the database."""

import re
import time
import sqlite3
import requests
from bs4 import BeautifulSoup

BASE = "https://nurseryguide.com"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; research bot)"}
DB_PATH = "nurseries.db"


def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT slug FROM companies")
    slugs = [r[0] for r in c.fetchall()]
    print(f"Fixing categories for {len(slugs)} companies...")

    updated = 0
    for i, slug in enumerate(slugs, 1):
        url = f"{BASE}/find_companies/detail/{slug}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # Supply categories in <ul class="supplies">
            categories = []
            ul = soup.find("ul", class_="supplies")
            if ul:
                for li in ul.find_all("li"):
                    cat = li.get_text(strip=True)
                    if cat:
                        categories.append(cat)

            cats = "; ".join(categories)
            if cats:
                c.execute("UPDATE companies SET supply_categories = ? WHERE slug = ?", (cats, slug))
                updated += 1

            if i % 50 == 0:
                print(f"  [{i}/{len(slugs)}] updated {updated} so far")
                conn.commit()

        except Exception as e:
            if i % 100 == 0:
                print(f"  [{i}] error on {slug}: {e}")

        time.sleep(0.25)

    conn.commit()
    conn.close()
    print(f"\nDone! Updated {updated} companies with supply categories.")


if __name__ == "__main__":
    main()
