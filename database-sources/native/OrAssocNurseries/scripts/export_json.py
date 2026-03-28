"""Export the nurseries database to JSON."""

import json
import sqlite3

DB_PATH = "../nurseries.db"
JSON_PATH = "../nurseries.json"


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT name, business_type, company_type, ships_to,
               mailing_address, city, state, zip,
               phone, fax, email, website,
               description, supply_categories, slug
        FROM companies
        WHERE name != ''
        ORDER BY name
    """)

    companies = [dict(row) for row in c.fetchall()]

    # Convert pipe-separated fields to arrays where appropriate
    for co in companies:
        if co.get("supply_categories"):
            co["supply_categories"] = [s.strip() for s in co["supply_categories"].split(";")]
        else:
            co["supply_categories"] = []
        if co.get("ships_to"):
            co["ships_to"] = [s.strip() for s in co["ships_to"].split(",")]
        else:
            co["ships_to"] = []
        if co.get("business_type"):
            co["business_type"] = [s.strip() for s in co["business_type"].split(",")]
        else:
            co["business_type"] = []
        if co.get("company_type"):
            co["company_type"] = [s.strip() for s in co["company_type"].split(",")]
        else:
            co["company_type"] = []

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(companies, f, indent=2, ensure_ascii=False)

    conn.close()
    print(f"Exported {len(companies)} companies to {JSON_PATH}")


if __name__ == "__main__":
    main()
