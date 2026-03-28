"""Export the nurseries database to CSV."""

import csv
import sqlite3

DB_PATH = "nurseries.db"
CSV_PATH = "nurseries.csv"


def main():
    conn = sqlite3.connect(DB_PATH)
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

    rows = c.fetchall()
    headers = [
        "Name", "Business Type", "Company Type", "Ships To",
        "Mailing Address", "City", "State", "Zip",
        "Phone", "Fax", "Email", "Website",
        "Description", "Supply Categories", "Slug"
    ]

    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    conn.close()
    print(f"Exported {len(rows)} companies to {CSV_PATH}")


if __name__ == "__main__":
    main()
