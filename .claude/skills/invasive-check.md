---
name: invasive-check
description: Check a plant or list of plants against all 5 invasive species databases. Flags any matches with severity rating and source.
command: /invasive-check
---

# Invasive Species Check

When the user provides a plant name or list of plant names, check ALL invasive databases and report findings.

## Databases to Check (in order of authority)

1. **USGS_RIIS** (INVAS-04) — 4,918 unique species. Most comprehensive. Has degree: established, invasive, widespread invasive. Check `locality` for regional relevance (L48, HI, AK).
2. **CalIPC_Invasive** (INVAS-05) — 331 CA-specific species. Cal-IPC ratings: High, Moderate, Limited, Watch. Critical for California projects.
3. **FederalNoxiousWeeds** (INVAS-01) — 112 federally regulated species. These are ILLEGAL to import/transport.
4. **USDA_InvasiveSpecies** (INVAS-02) — 30 priority terrestrial invasives.
5. **WGA_InvasiveSpecies** (INVAS-03) — 26 ranked western US invasives.

## Steps

1. For each plant name, search all 5 databases by scientific name (case-insensitive, genus+species match).
2. Also check common name in USGS_RIIS and FederalNoxiousWeeds.
3. Report results with traffic-light severity:
   - 🔴 **STOP** — Federal Noxious Weed or Cal-IPC High or USGS widespread invasive
   - 🟡 **CAUTION** — Cal-IPC Moderate/Limited or USGS invasive/established
   - 🟢 **CLEAR** — Not found in any invasive database

## Example

User: "Check these plants: Hedera helix, Acer macrophyllum, Pyrus calleryana, Ceanothus velutinus"

Output:
```
## Invasive Species Check Results

| Plant | Status | Details |
|-------|--------|---------|
| Hedera helix (English Ivy) | 🔴 STOP | Federal Noxious Weed (INVAS-01); USGS: widespread invasive in L48 (INVAS-04) |
| Acer macrophyllum (Big-Leaf Maple) | 🟢 CLEAR | Not found in any invasive database |
| Pyrus calleryana (Callery Pear) | 🔴 STOP | USGS: invasive in L48 (INVAS-04); USDA priority list (INVAS-02) |
| Ceanothus velutinus (Snowbrush) | 🟢 CLEAR | Not found in any invasive database |

⚠️ 2 of 4 plants flagged. Do NOT recommend Hedera helix or Pyrus calleryana.
```
