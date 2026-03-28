# Missouri Botanical Garden - Plant Finder

**Source:** Missouri Botanical Garden Kemper Center for Home Gardening
**URL:** https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderSearch.aspx
**Plants:** 8,840 unique species/cultivars
**Scraped:** All A-Z letter pages

## About

The Missouri Botanical Garden Plant Finder is one of the most comprehensive horticultural reference databases in the US, covering plants currently or previously grown in the Kemper Center gardens. Each plant has a detailed profile page with growing requirements, cultural notes, and landscape uses.

## Output vs. Source

The **output files** contain the plant list extracted from all 26 alphabetical letter pages: taxon ID, scientific name, and common name. The **detail pages** on the MBG website contain extensive horticultural data per species (zones, sun, water, height, spread, bloom, maintenance, problems, etc.) — a future enhancement could scrape those for structured trait data using the taxon IDs in this dataset.

## Letter Distribution

| Letter | Count | | Letter | Count |
|--------|-------|---|--------|-------|
| A | 946 | | N | 206 |
| B | 328 | | O | 98 |
| C | 1,041 | | P | 939 |
| D | 306 | | Q | 48 |
| E | 383 | | R | 496 |
| F | 163 | | S | 670 |
| G | 224 | | T | 345 |
| H | 961 | | U | 19 |
| I | 276 | | V | 284 |
| J | 108 | | W | 49 |
| K | 63 | | X | 11 |
| L | 470 | | Y | 10 |
| M | 349 | | Z | 47 |

## Data Fields

| Field | Description |
|-------|-------------|
| taxon_id | MBG internal identifier (links to detail page) |
| scientific_name | Full botanical name including cultivar |
| common_name | Common plant name |

## Detail Page Access

Each plant's full profile is available at:
`https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?taxonid={taxon_id}&isprofile=0`

Detail pages include: hardiness zones, sun exposure, water needs, height, spread, bloom color/time, maintenance level, suggested uses, problems, native range, and cultural notes.

## Files

- `plants.csv` - All 8,840 plants with taxon IDs
- `plants.json` - JSON with metadata and detail URL pattern
- `plants.db` - SQLite database with indexes
- `scripts/scrape_all.py` - Scraper using requests + BeautifulSoup

## Citation

Missouri Botanical Garden. "Plant Finder." Kemper Center for Home Gardening. https://www.missouribotanicalgarden.org/PlantFinder/
