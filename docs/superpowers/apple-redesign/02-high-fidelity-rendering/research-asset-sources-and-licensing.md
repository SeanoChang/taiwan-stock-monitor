# Research — 3D asset & texture sources, licensing rules

## Recommended sources (all verified license classes)

| Need                                                     | Source                                                              | License                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| Studio HDRI                                              | PolyHaven (studio_small_* class)                                    | CC0 — no attribution                      |
| PBR texture sets (brushed metal, plastics, PCB-adjacent) | ambientCG / PolyHaven                                               | CC0                                       |
| Reference-only photos (GB200 NVL72 rack, sleds, trays)   | NVIDIA press images, OCP spec drawings, Quanta/Wiwynn product pages | reference only — do NOT trace/copy assets |
| Optional found models                                    | Sketchfab (filter CC0/CC-BY)                                        | per-model — record attribution            |

## Rules

1. Every texture/HDRI/model lands in an **asset ledger**
   (`assets/LICENSES.md`): file → source URL → license → attribution text.
   PR check refuses new binary assets without a ledger row.
2. **Trade-dress caution**: model an "inspired-by" generic AI rack
   (fictional badge "SSX-72"), correct proportions from public photos, no
   NVIDIA logos/exact chassis clone. Same for Apple: copy grammar, not pages.
3. PCB textures: bake our own in Blender (procedural traces) — cleaner
   licensing than scraped board scans, and we control the normal maps.
4. Font note for Phase 05: SF Pro is licensed for Apple platforms — on web we
   use `-apple-system` (renders SF on Apple devices) + system fallbacks;
   do not self-host SF Pro woffs.
