"""
Scrape all company data from nurseryguide.com/Find_Companies
into a local SQLite database.
"""

import re
import time
import sqlite3
import requests
from bs4 import BeautifulSoup

BASE = "https://nurseryguide.com"
LIST_URL = f"{BASE}/Find_Companies"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; research bot)"}
DB_PATH = "nurseries.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DROP TABLE IF EXISTS companies")
    c.execute("""
        CREATE TABLE companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE,
            name TEXT,
            business_type TEXT,
            company_type TEXT,
            ships_to TEXT,
            mailing_address TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            phone TEXT,
            fax TEXT,
            email TEXT,
            website TEXT,
            description TEXT,
            supply_categories TEXT
        )
    """)
    conn.commit()
    return conn


def get_company_slugs():
    """Collect all company detail slugs from paginated listing pages."""
    slugs = []
    page = 1
    while True:
        print(f"  Fetching listing page {page}...")
        resp = requests.get(LIST_URL, params={"page": page, "show": 80}, headers=HEADERS)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        links = soup.find_all("a", href=re.compile(r"/find_companies/detail/"))
        if not links:
            break

        for a in links:
            href = a["href"]
            match = re.search(r"/find_companies/detail/(.+)", href)
            if match:
                slug = match.group(1).rstrip("/")
                if slug not in slugs:
                    slugs.append(slug)

        if len(links) < 80:
            break

        page += 1
        time.sleep(0.5)

        if page > 20:
            break

    return slugs


def scrape_detail(slug):
    """Scrape a single company detail page."""
    url = f"{BASE}/find_companies/detail/{slug}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    data = {"slug": slug}

    # Company name from h2
    h2 = soup.find("h2")
    data["name"] = h2.get_text(strip=True) if h2 else ""

    # Ships To - inside div.shipsto with <b> tag
    ships_div = soup.find("div", class_="shipsto")
    if ships_div:
        text = ships_div.get_text(strip=True)
        data["ships_to"] = re.sub(r"^Ships To:\s*", "", text)
    else:
        data["ships_to"] = ""

    # Business Type - inside div.businesstypes with <b> tag
    biz_div = soup.find("div", class_="businesstypes")
    if biz_div:
        text = biz_div.get_text(strip=True)
        data["business_type"] = re.sub(r"^Business Type:\s*", "", text)
    else:
        data["business_type"] = ""

    # Company Type - inside div.companytypes with <b> tag
    comp_div = soup.find("div", class_="companytypes")
    if comp_div:
        text = comp_div.get_text(strip=True)
        data["company_type"] = re.sub(r"^Company Type:\s*", "", text)
    else:
        data["company_type"] = ""

    # Description - inside div.description
    desc_div = soup.find("div", class_="description")
    if desc_div:
        text = desc_div.get_text(strip=True)
        data["description"] = text
    else:
        data["description"] = ""

    # Mailing Address - inside <address> tag after <strong>Mailing Address:</strong>
    address_tag = soup.find("address")
    data["mailing_address"] = ""
    data["city"] = ""
    data["state"] = ""
    data["zip"] = ""
    if address_tag:
        strong = address_tag.find("strong", string=re.compile(r"Mailing Address"))
        if strong:
            # Get all text after the strong, joining <br> separated lines
            parts = []
            for elem in strong.next_siblings:
                if hasattr(elem, "name") and elem.name == "strong":
                    break  # hit next label
                if hasattr(elem, "name") and elem.name == "br":
                    continue
                text = elem.get_text(strip=True) if hasattr(elem, "get_text") else str(elem).strip()
                if text:
                    parts.append(text)
            full_addr = ", ".join(parts)
            data["mailing_address"] = full_addr

            # Parse city/state/zip from last line
            if parts:
                last = parts[-1]
                m = re.match(r"(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)", last)
                if m:
                    data["city"] = m.group(1).strip()
                    data["state"] = m.group(2)
                    data["zip"] = m.group(3)

    # Phone, Fax, Email, Website - inside <address> with <span class="block">
    data["phone"] = ""
    data["fax"] = ""
    data["email"] = ""
    data["website"] = ""

    for addr in soup.find_all("address"):
        for span in addr.find_all("span", class_="block"):
            strong = span.find("strong")
            if not strong:
                continue
            label = strong.get_text(strip=True)
            if label == "Phone":
                text = span.get_text(strip=True)
                data["phone"] = re.sub(r"^Phone\s*:\s*", "", text)
            elif label == "Fax":
                text = span.get_text(strip=True)
                data["fax"] = re.sub(r"^Fax\s*:\s*", "", text)
            elif label == "Email":
                a = span.find("a", href=re.compile(r"mailto:"))
                if a:
                    data["email"] = a.get_text(strip=True)
            elif label == "Website":
                a = span.find("a")
                if a:
                    data["website"] = a.get("href", "")

    # Supply categories - look for ul after a heading containing "Supply"
    categories = []
    for heading in soup.find_all(["h3", "h4", "b", "strong"]):
        if re.search(r"supply|categor|listing", heading.get_text(), re.I):
            ul = heading.find_next("ul")
            if ul:
                for li in ul.find_all("li"):
                    cat = li.get_text(strip=True)
                    if cat:
                        categories.append(cat)
                break
    data["supply_categories"] = "; ".join(categories)

    return data


def main():
    conn = init_db()
    cursor = conn.cursor()

    print("Step 1: Collecting company slugs from listing pages...")
    slugs = get_company_slugs()
    print(f"  Found {len(slugs)} companies.\n")

    print("Step 2: Scraping detail pages...")
    errors = []
    for i, slug in enumerate(slugs, 1):
        print(f"  [{i}/{len(slugs)}] {slug}")
        try:
            data = scrape_detail(slug)
            cursor.execute("""
                INSERT OR REPLACE INTO companies
                (slug, name, business_type, company_type, ships_to, mailing_address,
                 city, state, zip, phone, fax, email, website, description, supply_categories)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get("slug"), data.get("name"), data.get("business_type"),
                data.get("company_type"), data.get("ships_to"),
                data.get("mailing_address"), data.get("city"), data.get("state"),
                data.get("zip"), data.get("phone"), data.get("fax"),
                data.get("email"), data.get("website"), data.get("description"),
                data.get("supply_categories"),
            ))
            conn.commit()
        except Exception as e:
            print(f"    ERROR: {e}")
            errors.append((slug, str(e)))

        time.sleep(0.3)

    conn.close()
    print(f"\nDone! Database saved to {DB_PATH}")
    print(f"Total companies: {len(slugs)}, Errors: {len(errors)}")
    if errors:
        print("Failed slugs:")
        for s, e in errors:
            print(f"  {s}: {e}")


if __name__ == "__main__":
    main()
