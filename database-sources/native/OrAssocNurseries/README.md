# Oregon Association of Nurseries - Nursery Guide Database

**Source:** Oregon Association of Nurseries (OAN), Nursery Guide
**URL:** https://www.nurseryguide.com/Find_Companies
**Date Scraped:** March 2026
**Companies:** 833 nurseries and suppliers affiliated with OAN

## About

The Oregon Association of Nurseries maintains a directory of nurseries, growers, suppliers, and allied service providers. This dataset was scraped from their public Nursery Guide to identify commercial sources for plants in Oregon and the Pacific Northwest.

## Citation

Oregon Association of Nurseries. Nursery Guide: Find Companies. https://www.nurseryguide.com/Find_Companies. Accessed March 2026.

## Data Fields

| Field | Description |
|-------|-------------|
| name | Company name |
| business_type | Business classification (e.g., Allied Service or Supplier, Re-Wholesaler/Broker) |
| company_type | Company category (e.g., Transportation Logistics, Sales) |
| ships_to | Shipping regions (e.g., Northeast, Pacific Northwest, Canada) |
| mailing_address | Mailing address |
| city | City |
| state | State |
| zip | ZIP code |
| phone | Phone number |
| fax | Fax number |
| email | Email address |
| website | Company website URL |
| description | Company description |
| supply_categories | Products/services offered (semicolon-separated) |
| slug | URL slug from source site |

## Output Formats

- `nurseries.csv` - Flat CSV (833 rows). Multi-value fields are comma or semicolon-separated.
- `nurseries.json` - JSON array with multi-value fields as proper arrays.
- `nurseries.db` - SQLite database.

## Scripts

- `scripts/scrape_nurseries.py` - Main scraper (paginates listing pages, parses detail pages)
- `scripts/export_csv.py` - Exports SQLite to CSV
- `scripts/export_json.py` - Exports SQLite to JSON with array conversion
- `scripts/fix_categories.py` - Re-scrapes supply categories to fix initial extraction issues

## Sources

Provenance documentation is in the `Sources/` subfolder:

- `SOURCE.md` - Data source URL, publisher, scrape date, and citation
