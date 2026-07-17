# Research — Ego-network visualization (the academic name for "branches")

## Findings

- What we're building is an **ego network** (ego = hovered company, alters =
  its vendors/customers). Long research lineage: egoComp (IEEE TVCG) on
  comparing ego-networks; a 2024 ScienceDirect study ("Me! Me! Me!") compares
  ego representations — **radial/node-link layouts win for ≤2 rings and
  small alter counts**, which is exactly our case (≤8 branches + expand ring).
- Radial layout is a first-class pattern in graph libs (AntV G6 `radial`
  docs) — center-out rings by hop distance. Our scale (≤9 nodes/ring) needs
  no library: a polar fan with a reserved gap (breadcrumb slot) suffices.
- Interaction patterns worth copying: **pivot** (click an alter → it becomes
  the new ego; breadcrumb trail preserves the path — same mental model as
  Obsidian's local graph / LinkedIn "how you're connected"); cap visible
  alters and fold the tail behind a "+N" expander to avoid hairballs.

## Design implications

Hover = quick look (one ring, ranked), click = pivot, deep dive stays on
`/supply-chain` (full force graph). Rank alters: TW-listed → degree →
alphabetical. Never auto-expand 2nd degree in the overlay.

## Sources

- egoComp (Information Visualization / IEEE): https://journals.sagepub.com/doi/abs/10.1177/1473871616667632
- Ego representations comparison study: https://www.sciencedirect.com/science/article/pii/S0097849324002589
- Egocentric analysis primer (representations chapter): https://raffaelevacca.github.io/egocentric-r-book/represent.html
- AntV G6 radial layout: https://g6.antv.antgroup.com/en/manual/layout/radial-layout
