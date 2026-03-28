---
name: plant-lookup
description: Look up everything we know about a plant species across all 40 databases. Returns fire rating, deer resistance, water use, pollinator value, invasive status, native range, and growing requirements — all with source IDs for provenance.
command: /plant-lookup
---

# Plant Lookup

When the user asks about a specific plant (by scientific name or common name), search across ALL databases in the LivinWitFire collection and return a comprehensive profile.

## Steps

1. **Resolve the name.** If the user gives a common name, search USDA_PLANTS/plants.csv or MBG_PlantFinder/plants.csv to find the scientific name. Check USDA_PLANTS for synonyms.

2. **Search all databases.** For the scientific name (and any synonyms), query each database's plants.csv or plants.db. Match on genus+species (case-insensitive, ignore authors/cultivar suffixes).

3. **Report findings by category.** For each match, include the source_id from DATA-PROVENANCE.md:

   - 🔥 **Fire Resistance**: Check FirePerformancePlants, IdahoFirewise, NIST_USDA_Flammability, UCForestProductsLab, DiabloFiresafe, OaklandFireSafe, OSU_PNW590
   - 🦌 **Deer Resistance**: Check RutgersDeerResistance, NCSU_DeerResistant, MissouriBotanicalDeer, WSU_DeerResistant, CSU_DeerDamage, CornellDeerResistance
   - 💧 **Water/Drought**: Check WUCOLS (all 6 CA regions), UtahCWEL, OSU_DroughtTolerant
   - 🐝 **Pollinators**: Check XercesPollinator, PollinatorPartnership, NRCS_Pollinator
   - 🐦 **Birds**: Check TallamyBirdPlants (genus-level match)
   - 🌿 **Native Status**: Check USDA_PLANTS (plants_oregon.csv, plants_california.csv), LBJ_Wildflower, PlantNativeORWA, OregonFlora
   - ⚠️ **Invasive Status**: Check USGS_RIIS, CalIPC_Invasive, FederalNoxiousWeeds, USDA_InvasiveSpecies, WGA_InvasiveSpecies
   - 🌱 **Growing Requirements**: Check MBG_PlantFinder (plants_enriched.csv if available, else plants.csv), NCSU database

4. **Format the output** as a clean summary with sections. Flag any warnings (invasive, highly flammable, deer-preferred).

## Example Output

```
## Acer macrophyllum (Big-Leaf Maple)

### 🔥 Fire Resistance
- Firewise (1) — FIRE-01 (FirePerformancePlants)

### 🦌 Deer Resistance
- Not found in deer databases

### 💧 Water Use
- Moderate (Region 4 South Coastal) — WATER-01 (WUCOLS)
- Medium — TRAIT-01 (MBG)

### 🐝 Pollinators
- Listed in Pacific Lowland guide — POLL-01 (XercesPollinator)

### 🐦 Bird Value
- Genus Acer: 297 Lepidoptera species (Exceptional) — BIRD-01 (Tallamy)

### 🌿 Native Status
- ✅ Native to Oregon (USDA_PLANTS OR list)
- ✅ Native to California (USDA_PLANTS CA list)
- Listed in LBJ Wildflower OR + WA + CA collections

### ⚠️ Invasive Status
- ✅ Not found in any invasive database

### 🌱 Growing Requirements (TRAIT-01)
- Type: Tree
- Zones: 5-9
- Height: 30-100'
- Sun: Full sun to part shade
- Water: Medium
- Maintenance: Low
```

## Important Notes
- Always match on scientific name, never common name alone
- Check synonyms via USDA_PLANTS if initial search returns no results
- For genus-level data (Tallamy), match on genus only
- Report the source_id for every data point
