# Oregon Flora Project - Supplement Data

**Source:** Oregon Flora Project, Oregon State University
**URL:** https://oregonflora.org/pages/flora-of-oregon.php
**Data:** 355 accepted taxa (supplements) + 59 taxonomic changes
**Full Flora:** ~4,380 taxa in Volumes 1 & 2 (not available as downloadable dataset)

## About

The Flora of Oregon is a multi-volume taxonomic treatment of all vascular plants in Oregon. The full checklist (~4,380 taxa) is available only through the printed volumes and the oregonflora.org web portal (which blocks automated access). These CSVs are official supplements:

- **AcceptedTaxa_NotTreatedInFlora.csv** — 355 taxa from Volumes 1 & 2 that are accepted but not included in the printed Flora
- **Flora_ChangeSincePublication.csv** — 59 taxonomic changes since the volumes were published

## Origin Distribution (Accepted Taxa)

| Origin | Count |
|--------|-------|
| Exotic, not naturalized | 311 |
| Native | 24 |
| Uncertain | 11 |
| Exotic, naturalized | 9 |

## Files

- `plants.csv` - 355 supplemental accepted taxa
- `taxonomic_changes.csv` - 59 changes since publication
- `plants.json` - Combined JSON
- `plants.db` - SQLite with `accepted_taxa` and `taxonomic_changes` tables
- `scripts/build_data.py`

## Sources

- `Sources/AcceptedTaxa_NotTreatedInFlora.csv`
- `Sources/Flora_ChangeSincePublication.csv`
- `Sources/terms-used-in-oregonflora-org-publications-pages.pdf` - Glossary

## Citation

Oregon Flora Project. "Flora of Oregon." Oregon State University. https://oregonflora.org/
