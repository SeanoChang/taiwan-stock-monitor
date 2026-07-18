# Plan 004 — AI-server stack tree expansion（取代四層線性）

Workspace: `docs/superpowers/ai-server-stack/`. Built from an adversarially
verified deep-research run (105 agents, 23 sources, 24 confirmed / 1 refuted
claims, 2026-07-17) + a sourced optics pass.

Execution (updates phase-01/03 scope of plan 003):

- [ ] `lib/data/stack-tree.ts` from `data-stack-tree-taxonomy.md` +
      `tree-website-navigation-map.md` (specs carry confidence + source)
- [ ] Tree navigation shell: breadcrumb, mini-map drawer, URL routing
      (`design-tree-navigation-experience.md`) — replaces linear-only nav
- [ ] Guided tour = curated spine over the tree (phase-01 scrub reused)
- [ ] Flow overlays 資料/電力/熱 (specs from verified docs)
- [ ] New zoom views incrementally: 交換托盤 → 電源櫃 → 光傳輸 → HBM/GPU 內部
- [ ] Second-pass research runs per `research-open-gaps-second-pass.md`
      (optics verification + Taiwan BOM first)

Rule: any spec rendered in UI must trace to a doc here with its confidence
tier; 「待查證」 nodes are allowed and visible.
