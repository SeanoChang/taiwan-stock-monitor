# Plan 006 — Build the front end: scroll disassembly + multi-axis tree

- **Date:** 2026-07-18
- **Status:** Ready for Claude Code execution
- **Role:** This is the **executable sequencing plan** over already-approved
  design docs. It does **not** restate them — it orders them into phases with
  concrete files and acceptance gates, and resolves the one thing the design
  docs don't: the two features **share a single 3D scene**, so build order matters.
- **Authoritative design inputs:**
  `docs/superpowers/apple-redesign/` (README + phases 01–05),
  `docs/superpowers/specs/2026-07-18-ai-server-stack-multi-axis-tree-design.md`,
  `docs/superpowers/ai-server-stack/*`.

## 0. Why one plan (the key insight)

The scroll disassembly and the tree explorer are **not two 3D builds** — they are
one scene viewed two ways:

- The tree's **default `containment` axis 3D = the disassembly scene.**
- The disassembly's **guided scrub survives as the tree's curated containment
  walk** (multi-axis design §5, "Guided tour").
- Both bind to the **same `PartId` registry** (tech-scrub-architecture) and the
  **same company data** (`lib/data/supply-chain/`, part→company map).

So: **build the scene + part registry once**, ship the disassembly as the visible
hero, then wrap the tree navigator around the same nodes. Building two scenes
would be the main way to waste this effort.

## 1. Givens (verified 2026-07-18)

- **Data "step 0" is DONE** — merged to `main` (`c9857dc`, PR #1). The modular
  dataset lives at `lib/data/supply-chain/` (`types.ts`, `companies/*.ts`,
  `categories.ts`, `derived.ts`, `stages.ts`); new categories/companies landed.
  ⚠️ Two follow-ups remain (see §Parallel data track).
- **Shipped routes today:** `/` (old 4-level explorer), `/supply-chain` (force
  graph), `/market`. No tree, no disassembly exist in code.
- **Reusable code:** `lib/scene/silicon-stack-scene.ts` (`createScene → SceneApi`,
  `lib/scene/types.ts`), `components/explorer/*` (use-scene, hud, panel),
  `components/graph/*` (graph-model, use-force-graph, `derived.inboundRels`),
  `lib/quotes-client.ts` (`useQuotes`), `lib/format.ts` (`normalizeCode`,
  `upDownColor`), `lib/i18n/config.ts` (`LStr`, `l()`, `pick()`).
- **Hard constraints:**
  - **Next.js 16.2.10 has breaking changes** — per `AGENTS.md`, Claude Code
    **must read the relevant guide in `node_modules/next/dist/docs/` before
    writing any route/server code.** Do not assume training-data Next APIs.
  - **pnpm** only. **`LStr {en,zh}`, zh-Hant-TW default** for every string.
  - **Server page shell + client islands** (never make the whole page client).
  - **Provenance quarantine** (multi-axis §6): `actionable === (confidence ===
    'verified')`; 興櫃/delisted ids **never** enter the quote join.
  - **Responsive is cross-cutting, not a phase** — see
    `apple-redesign/design-responsive-mobile-ipad.md`. Every surface ships
    mobile + iPad from its first commit: capability-tiered 3D (`useDeviceTier`),
    a tap equivalent for every hover, ≥44px touch targets, `dvh/svh` +
    safe-area, and **container queries** on islands (iPad Split View can hand any
    island any width). No phase passes its gate until it clears the responsive
    matrix (that doc §7) at its tier.

## 2. Critical path

```
A. tokens(05) ─┬─► B. part-registry ─► C. disassembly(01) ─► D. annotations(03) ─► E. branches(04)
               │            │                                        │
               │            └────────────────────────────► F. hi-fi render(02) ─┘  (F ∥ D)
               │
               └─► (chrome restyle of /market, /supply-chain — independent)

                                    C + B  ─────────────────────────► G. multi-axis tree (new route)
Parallel research track: pass-2 verify (open-gaps §8) promotes upstream ※→✓ ; gates tree "actionable".
```

Start order for maximum visible payoff at least cost: **A → B → C** (that alone
turns `/` from "toyish" into the Apple hero), then **D**, then **G**, with **F**
parallel to D and **E** after D.

## 3. Phases

### Phase A — Apple design tokens + chrome restyle  (design: `05-apple-design-language/*`)
- **Edit** `app/globals.css`: Apple token layer — SF-style font stack, 980px pill
  radii, easing `cubic-bezier(0.25,0.1,0.3,1)`, spacing/typographic scale. **Keep**
  amber accent, the CVD stage palette, 紅漲綠跌 (D-003).
- Restyle chrome that already exists: `components/site/*`, the `/market` and
  `/supply-chain` shells — no IA change.
- **Gate:** `/market` + `/supply-chain` visibly Apple-grammar; before/after
  screenshots ×2 locales; zero lint. Cheap, lifts everything.

### Phase B — Part-registry refactor of the scene  (tech: `01/tech-scrub-architecture-and-timeline.md`)
> **Linchpin — blocks every 3D phase (C, D, E, F, G-containment). Do it first and carefully.**
- **Edit** `lib/scene/silicon-stack-scene.ts` → split builders into addressable
  **named groups**; define the `PartId` union in `lib/scene/types.ts`:
  `rack, sled, lid, fanWall, psu[0..n], gpuTray, board, gpuModule, heatsink,
  hbm[0..7], interposer, substrate, die, fins`.
- **New** `lib/scene/parts.ts` — registry `PartId → Object3D` + `applyPose(part,
  pose)`. **Keep** the old `Level`/`goLevel` API so the current explorer keeps working.
- **Gate:** each `PartId` is addressable and `applyPose` moves it; existing `/`
  explorer unchanged; zero lint. `PartId` is the contract for Phases 02/03.

### Phase C — Scroll disassembly on `/`  (design: `01/design-storyboard-*`, `01/code-scroll-progress-*`)
- **New** `lib/scene/disassembly-timeline.ts` — tracks `{part,t0,t1,from,to,ease}`
  + camera track + chapter copy ranges; **pure `evaluate(p)` with unit tests**
  (poses derive from `p`, never accumulate → drift-free). 8 chapters per storyboard.
- **New** `components/explorer/scrolly/` — `scrolly-stage.tsx` (client island:
  GSAP ScrollTrigger `pin` + `scrub:0.5`, `progressRef` never React state, frame
  loop calls `applyPose`), `chapter-rail.tsx`, `copy-panel.tsx`, `use-scroll-progress.ts`.
- **Edit** `app/page.tsx` → **server shell** renders ~900vh wrapper + sticky stage
  island + copy overlays + CTA; `自由探索` handoff to orbit/explore on the same
  scene (no reload). `prefers-reduced-motion` → stepped chapters.
- **Dep:** `pnpm add gsap`. Use `svh` for sticky height (iOS).
- **Gate:** bidirectional scrub `0→1→0.3` zero drift; 60fps desktop / 30fps
  mid-mobile (DPR≤2); deep links `/#ch-5`; zero new lint. **← this is the "wow".**
- **Responsive gate:** touch fling scrub smooth; chapter copy = bottom sheet on
  phone; `100svh` + safe-area; `useDeviceTier` gates DPR/post; `low` tier shows
  stepped-card fallback, not a frozen canvas.

### Phase D — Depth-gated hardware cards  (data: `03/data-part-to-company-mapping.md`)
- **New** `lib/data/hardware-map.ts` — `HardwarePart[]` (~24): `PartId →
  categoryId → companyIds`, `chapters`, `anchor`, `priority`. Author all ~24 from
  the seed table; **validate every id against `lib/data/supply-chain/`.**
- **New** `components/explorer/annotations/` — `callout-layer.tsx` (project 3D
  anchors → DOM, depth-gated by chapter + occlusion), `hardware-card.tsx` (live
  quote via `useQuotes()` + `normalizeCode`, TW-listed first).
- **Extend** `scripts/check-supply-chain.ts` — every `HardwarePart`
  category/company id resolves; every `PartId` exists in the scene registry.
- **Gate:** cards resolve to **real companies with live quotes**; density/occlusion
  rules from `03/design-*`; zero lint.
- **Responsive gate:** phone swaps anchored callouts → swipeable bottom-sheet
  carousel synced to the chapter (no tiny occluded labels); tap-to-select.

### Phase F — High-fidelity rendering  (`02-high-fidelity-rendering/*`) — **∥ Phase D**
- Renderer upgrade in `lib/scene/`: HDRI env + PBR materials + `postprocessing`
  (n8ao/subtle bloom) + ACES tone mapping. Blender→glTF (Draco/KTX2) pipeline
  replaces primitives **incrementally** — parts without a model render as diagram
  cards (§10 incremental rule).
- **Dep:** `pnpm add postprocessing`; asset check `scripts/check-parts.mjs` in CI.
- **Gate:** Lighthouse perf **≥80** on `/`; clear fidelity lift vs. current
  "toyish" primitives; graceful fallback for un-modeled parts.

### Phase E — Hover → supplier branches  (`04-supplier-branches/*`)
- Hover a part/card → radial **ego-network** overlay + chain **tier ribbon**;
  reuse `components/graph/graph-model.ts` + `derived.inboundRels()` (the `?focus`
  ego logic already exists in the force graph).
- **New** `components/explorer/branches/*`.
- **Gate:** hovering a part shows its vendor/supplier branches with live quotes;
  keyboard-accessible; zero lint.
- **Responsive gate:** hover → **tap-to-pin** on touch; overlay fits `100vw −
  insets` or degrades to a tiered list; backdrop-tap dismiss.

### Phase G — Multi-axis tree explorer (new route)  (**authoritative:** `specs/2026-07-18-ai-server-stack-multi-axis-tree-design.md`)
> Build the design doc's §9 sequence. Reuses Phase B scene + Phase C scrub. Summary:
- **New** `lib/data/stack-tree.ts` — `StackNode`/`StackEdge`/`Axis`/`Confidence`
  (design §3); nodes **reference** `supply-chain` ids (zero duplication, quotes for
  free); reverse-index + re-root/walk utils. Seed order: **verified containment
  spine first**, then `subsystem`+`stage`, then `flow:data|power|heat`, then the
  **sourced upstream/substrate/litho sub-tree (~50–60 nodes, all ※/？,
  non-actionable, staged *behind* the verified spine)** as its own step.
- **New route** (`app/explore/` or `app/stack/`) — server shell + nav island: axis
  switcher `[機構包含][資料][電力][熱][子系統][階段]`, breadcrumb, mini-map drawer,
  node info panel (✓/※/？ + source link + live quote). Hash routing
  `/#/containment/rack/tray/gpu-package`.
- **Reuse** Phase B scene for containment 3D (card fallback for node-only nodes);
  guided tour = curated containment walk reusing the Phase C scrub.
- **Extend integrity** (design §8): every edge/spec has `confidence` (+`sourceUrl`
  for verified/sourced); `actionable === (confidence==='verified')`; no delisted
  id; 興櫃 ids never in the quote join.
- **Gate:** ≤3 clicks to any node; URL-addressable; breadcrumb/mini-map/flow
  toggles keyboard-accessible; zh/en complete; quarantine enforced from day one.
- **Responsive gate:** axis chips horizontally scrollable; breadcrumb middle-
  truncates; mini-map + node panel = full-screen sheet on phone / side drawer on
  iPad landscape (container-query driven); usable one-handed.

## 4. Parallel data track (Cowork/research, not front-end)

Two things still owed on the data layer before the tree can mark upstream nodes
`actionable`:
1. **Confirm §D landed + re-check new tickers.** The dataset-additions §D
   role/`rel` deepening and the 27 new tickers had their auto-recheck cut short by
   a model limit (`data-dataset-additions-…` header). Re-confirm against
   TWSE/TPEx/Goodinfo.
2. **Pass-2 verification** (`research-open-gaps-second-pass.md` item 8) — re-run
   the adversarial-verify + ticker stages (research is cached → cheap resume) to
   promote the sourced upstream ※ → ✓ and flip `actionable`. Until then, upstream
   tree nodes stay ※/？ and quarantined — which is the intended "honest research
   roadmap in-product," not a bug.

*This track is the Cowork job and can run in parallel with Phases A–F.*

## 5. Risks
- **Phase B is the linchpin** — a sloppy part-registry refactor breaks C/D/E/F/G.
  Land it with the old explorer still green before moving on.
- **Next 16 breaking changes** — read `node_modules/next/dist/docs/` first (AGENTS.md).
- **Perf budget** — sticky 3D + DOM callouts must hold 60/30fps and Lighthouse ≥80.
- **Sparse-but-honest tree v1** — most upstream links are quarantined ※/？; the UI
  must read those as an intentional roadmap (design §12).
- **興櫃/delisted leakage** into the quote join is the most likely concrete bug —
  integrity check §8.4 guards it.

## 6. Definition of done (project — from apple README)
≥6 scrubbed chapters rack→die at 60fps desktop / 30fps mobile with reduced-motion
fallback; every callout resolves to real dataset companies with live quotes; hover
shows supplier branches; the tree is URL-addressable with ✓/※/？ provenance;
Lighthouse perf ≥80 on `/`; zero lint. **Responsive DoD** (per
`apple-redesign/design-responsive-mobile-ipad.md` §7): passes the full device
matrix — no horizontal overflow ≥320px, every interaction touch-reachable
(≥44px), 60fps desktop/iPad · 30fps phone with graceful tier demotion, safe-area
respected, iPad Split-View via container queries — with before/after screenshots
**×3 routes × 2 locales × {phone, iPad-portrait, iPad-landscape, desktop}**.
