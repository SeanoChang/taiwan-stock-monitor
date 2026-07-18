# Design — Tree navigation experience（多按鈕縮放，非線性）

Supersedes the linear chapter storyboard as the *information architecture*;
the Apple scroll grammar (phase 01) survives as the **guided tour spine**.

## Core model

- **Zoom views** (containment): 資料中心 → 機櫃 → 運算托盤 → GPU 封裝 →
  GPU 內部 / HBM 堆疊, plus side-zooms (交換托盤, 電源櫃, 光傳輸). Each view
  is one camera "shot" of the 3D scene with **2–6 zoom buttons** anchored on
  child components (Apple-style callout chips with a ⊕).
- **Flow overlays** (cross-cutting): 資料流 / 電力流 / 熱流 toggle chips.
  Selecting one draws the animated path across the current view (e.g. 電力:
  busbar → PDB → VRM glow) and re-labels callouts with flow specs
  (bandwidths, volts, °C) from the verified dataset.
- **Breadcrumb + mini-map**: breadcrumb (資料中心 / 機櫃 / 托盤 / …) top-left;
  a collapsible mini-map drawer renders the whole tree (from
  `tree-website-navigation-map.md` data) with the current node highlighted —
  click any node to fly there. URL = `/#/rack/tray/gpu-package`.
- **Guided tour** = a curated ordered walk through ~8 of these views with
  scroll-scrub between them (reuses phase-01 timeline). Exiting the tour at
  any point leaves you at that tree node in free mode.
- Every callout keeps phase-03 behavior (companies + live quotes) and
  phase-04 hover branches.

## Data contract

`lib/data/stack-tree.ts`: `StackNode { id, name: LStr, blurb: LStr,
parent, children[], zoomable, flows: {data?, power?, heat?}: FlowSpec,
specs: VerifiedSpec[] (value + unit + confidence + sourceUrl),
categoryId?, companyIds?, partId? }`. Confidence enum: 'verified' | 'sourced'
| 'gap' — the UI renders a small ✓/※ marker; gaps render as 「待查證」 nodes
(honest UI = research roadmap visible in-product).

## Scene implication

The part registry (phase 01/02) gains per-view camera poses and LOD groups;
switch trays/power shelves/optics get their own modeled sub-scenes over
time — ship views incrementally (a node without a model yet renders as
diagram card view, same data).

## Acceptance

Tree nav reaches every node in ≤3 clicks from anywhere; URL-addressable;
breadcrumb/mini-map/flows keyboard-accessible; zh/en complete; every spec
shown carries its confidence marker and source link in the info panel.
