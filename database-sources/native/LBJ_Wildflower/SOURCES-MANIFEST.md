# Sources Manifest — LBJ_Wildflower

This dataset was scraped directly from the LBJ Wildflower Center website.
No source files are archived — data is reproducible by running the scraper.

## Source URLs

| Collection | URL |
|-----------|-----|
| Oregon | `https://www.wildflower.org/collections/collection.php?collection=OR` |
| California | `https://www.wildflower.org/collections/collection.php?collection=California` |
| CA North | `https://www.wildflower.org/collections/collection.php?collection=CA_north` |
| CA South | `https://www.wildflower.org/collections/collection.php?collection=CA_south` |
| Washington | `https://www.wildflower.org/collections/collection.php?collection=WA` |

## Detail Page Pattern

Each plant's full profile: `https://www.wildflower.org/plants/result.php?id_plant={usda_symbol}`

## Reproduction

```bash
python scripts/scrape_lbj.py
# Scrapes all 5 collections + 593 detail pages
# ~10 minutes with 1-second delay between requests
```
