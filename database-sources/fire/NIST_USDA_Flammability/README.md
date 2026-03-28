# NIST/USDA/Forest Service Experimental Flammability Studies

**Source:** Long, A.J., Behm, A., Zipperer, W.C., Hermansen, A., Maranghides, A., and Mell, W. 2006. "Quantifying and Ranking the Flammability of Ornamental Shrubs in the Southern United States." Pages 13-17 in 2006 Fire Ecology and Management Congress Proceedings.
**Paper URL:** https://www.srs.fs.usda.gov/pubs/ja/ja_long004.pdf
**Plants:** 34 commonly used ornamental shrubs in the Southern US, tested under controlled laboratory conditions

## About

This study is notable for using **large-scale calorimetry at the NIST Building and Fire Research Laboratory** (Gaithersburg, MD) to measure whole-plant flammability under controlled conditions — eliminating environmental variables like wind and relative humidity that confound field studies. This is one of the few studies that tested entire shrubs rather than just leaf or branch samples.

The researchers measured four components of flammability:

- **Ignitability** — time to ignition after exposure to a flame
- **Combustibility** — peak heat release rate (Peak HRR), total energy released, and maximum flame height
- **Sustainability** — total mass loss during combustion
- **Consumability** — canopy volume loss estimated from before/after photographs

Additional plant measurements included height, crown width, foliar moisture content, and foliar energy content (via oxygen combustion calorimetry).

Plants were grouped into flammability categories using **principal component analysis and cluster analysis** of all measured flammability characteristics.

## Flammability Rank Distribution

| Rank | Count | Guidance |
|------|-------|----------|
| Low | 22 | Appropriate for firewise lists and planting near homes |
| Moderate | 8 | Should be cautiously planted in defensible space |
| High | 4 | Can ignite quickly and release large quantities of heat even when healthy and well-watered; not recommended near homes |

**High flammability species:** Gallberry (*Ilex glabra*), Dwarf yaupon (*Ilex vomitoria*), Chinese juniper (*Juniperus chinensis*), Mountain laurel (*Kalmia latifolia*)

**Important note:** Even low-flammability firewise plants may be more flammable during droughts or extreme fire conditions. It is never advised to plant shrubs — even those with low flammability — directly against structures.

## Key Findings from Companion Publications

- Flammability is most influenced by **foliar moisture content** and the **quantity of foliar biomass**
- Leaf characteristics that increase flammability: small/needle-like leaves, low moisture content, volatile oils/resins, retention of dead material
- Leaf characteristics that decrease flammability: thick/succulent leaves, high moisture content, large/flat leaf shape
- Plant structure matters: dense branching increases flammability; open/loose branching decreases it
- Self-pruning trees (which shed dead lower branches) are less flammable than those retaining dead branches
- Deciduous plants are generally less flammable than evergreens
- Shrubs are particularly susceptible to ignition because most leaves are less than 6 feet from the ground

## Data Fields

| Field | Description |
|-------|-------------|
| common_name | Common plant name(s), semicolon-separated if multiple |
| scientific_name | Binomial/taxonomic name |
| authority | Taxonomic authority |
| cultivar | Cultivar tested (if applicable) |
| flammability_rank | High, Moderate, or Low (determined by cluster analysis of all flammability measurements) |

## Files

- `plants.csv` - Flat CSV with all 34 shrubs
- `plants.json` - JSON array of plant objects
- `plants.db` - SQLite database with indexes on scientific_name and flammability_rank
- `scripts/parse_pdf.py` - Data extraction script (data hardcoded from Table 1 due to complex PDF layout)

## Sources

All source PDFs are stored in the `Sources/` subfolder:

- `Quantifying and ranking the Flammability of Ornamental Shrubs in the Sourthern United States.pdf` - The primary research paper (Long et al. 2006) with Table 1 containing the 34 shrub flammability rankings. This is the data source.
- `Fire in Wildland-Urban Interface Selecting and Maintaining Firewise Plants for Landscaping.pdf` - UF/IFAS Circular 1445 (Doran et al. 2023). Companion guidance on plant flammability characteristics, defensible space, and maintenance practices.
- `Fire in Wildland-Urban Interface Selecting Firewise Shrubs to Reduce Wildfire Risk.pdf` - UF/IFAS FOR272 (Hermansen-Baez et al. 2023). Companion fact sheet summarizing the 34-shrub study results for homeowners, with guidance on shrub selection and maintenance.
