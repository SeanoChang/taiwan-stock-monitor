# Plans archive (consolidated)

Individual plan files 001–007 were consolidated into this document during the 2026-07 simplification, in which the `/market` quote board, the `/stack` multi-axis tree explorer, and the scroll-disassembly home mode were removed. The app now has two surfaces: the free-navigation 3D explorer at `/` and the `/supply-chain` force graph. Full originals of every plan are in git history before this consolidation.

## 001 — Sync v3, first push, repo cleanup

**Status:** superseded — one-time bootstrap fully executed; its `/market` verification target was removed in the 2026-07 cleanup, but the repo, `docs/superpowers` workspace, and quotes API it established persist.

Goal: bring the repo from a Cowork-synced v2 state up to v3 via a git bundle, make the first push to the empty GitHub main, and clean sandbox leftovers.

Shipped:

- Applied `silicon-stack-v3.bundle` (fast-forward fe59033 → 5b9e865) via `git fetch` + `reset --hard FETCH_HEAD`.
- Committed the Cowork-added `docs/` tree — origin of `docs/superpowers/plans`.
- First push to origin main (6 commits); deleted the bundles, `_to_delete/`, and stale `.git` lock/tmp pack files.
- Verified npm install/lint/build/dev with `/market` showing live TWSE/TPEx quotes.

Key decisions:

- Bundle transfer because the sandbox could not push directly; GitHub main started empty.
- `docs/superpowers` committed as the plans/specs home; acceptance keyed on all three routes rendering plus clean git status and green lint/build.

## 002 — Roadmap candidates (unscheduled backlog)

**Status:** partially surviving backlog — items 1/2/6 are moot or need rework after `/market`'s removal (only the explorer-sparkline and graph-pinning aspects still apply); items 3–5 (data verification, tests, CI/CD) remain relevant, with `check:data` now serving as the dataset gate.

Goal: a backlog of six unscheduled feature candidates, each to get its own spec in `docs/superpowers/specs/` before pickup — not an implementation plan; nothing shipped from it directly.

Items:

- Price history/charts: TWSE STOCK_DAY per-ticker monthly OHLC; sparkline/candlestick in panels and a `/market/[code]` detail page; real 30-day closes replacing the seeded explorer sparkline.
- Client-side watchlist (localStorage) on `/market` and as pinned graph nodes, with export/import.
- Data verification script cross-checking every ticker/name in `lib/data/supply-chain.ts` against TWSE/TPEx feeds.
- Tests: vitest for `lib/server/quotes.ts` normalization and graph-model integrity; Playwright route smoke.
- CI/CD: GitHub Actions lint+build+tests on PR; Vercel deploy (quotes route needs Node runtime, not edge).
- Refresh UX: countdown/refresh control; possible mis.twse.com.tw intraday endpoint for watchlist tickers only.

Key decisions:

- Items must be promoted to individual specs before implementation.
- Quotes API requires Node runtime; intraday use limited to selected watchlist tickers to bound request volume.

## 003 — Apple-style front-end redesign (master)

**Status:** partially surviving — tokens/chrome and 3D fidelity survive via Plan 006 Phases A/F; the scroll-disassembly home, hardware cards, and supplier-branch/tier-ribbon overlays were removed in the 2026-07 cleanup.

Goal: master index coordinating five sub-workstreams (tokens/chrome, scroll disassembly, 3D fidelity, hardware cards, branch overlay) in `docs/superpowers/apple-redesign/`; the doc itself was a 17-line checklist recording no completed outcomes.

Shipped (as planning structure):

- Execution order 05 → 01 → (02 ∥ 03) → 04: tokens per `tokens-silicon-stack-apple-grammar.md`, scrub skeleton per `tech-scrub-architecture-and-timeline.md`, fidelity Tier 1 (procedural + HDRI + post) then Tier 2 (authored glTF), hardware cards per `data-part-to-company-mapping.md`, overlay + tier ribbon last.
- Workspace convention: `research-`/`design-`/`tech-`/`pipeline-`/`code-`/`data-`/`tokens-` prefixes; `design-*` files carry acceptance criteria.
- Phases were ultimately executed under Plan 006 phase labels.

Key decisions:

- Tokens first, overlay last; two-tier 3D fidelity (procedural before authored glTF).
- One PR per phase with screenshots; prerequisite was the Plan 001 push; legacy first-draft `spec.md`/`plan.md`/`example-code.md` declared superseded.

## 004 — AI-server stack tree expansion

**Status:** removed in 2026-07 cleanup — the `/stack` tree explorer this plan drove was deleted; the surviving `/supply-chain` graph uses the Plan 005 dataset, not this plan's `stack-tree.ts`.

Goal: replace the four-layer linear navigation with a taxonomy-driven AI-server stack tree built from the adversarially verified research corpus in `docs/superpowers/ai-server-stack/`.

Planned (checkboxes unchecked in doc):

- `lib/data/stack-tree.ts` derived from `data-stack-tree-taxonomy.md` + `tree-website-navigation-map.md`, specs carrying confidence tier + source.
- Tree navigation shell (breadcrumb, mini-map drawer, URL routing); guided tour as a curated spine reusing Plan 003 phase-01 scrub.
- Flow overlays for 資料/電力/熱; incremental zoom views (switch tray, power cabinet, optical transport, HBM/GPU internals).
- Second-pass research runs per `research-open-gaps-second-pass.md` (optics verification + Taiwan BOM first).

Key decisions:

- Amends Plan 003 phase-01/03 scope rather than standing alone.
- Provenance rule: every UI-rendered spec traces to a workspace doc with its confidence tier; 待查證 nodes allowed and visibly marked.
- Grounded in a verified deep-research run (105 agents, 23 sources, 24 confirmed / 1 refuted claims, 2026-07-17) plus a sourced optics pass.

## 005 — Supply-chain upstream expansion

**Status:** surviving — the `lib/data/supply-chain` dataset and its `check:data` gate remain core assets feeding both surviving surfaces; the `/market` smoke test was only a verification step, not a deliverable.

Goal: extend `lib/data/supply-chain` with the 2026-07-18 semiconductor-upstream / ABF-substrate / lithography research — 5 new categories, ~27 new Taiwan-listed companies, role/rel deepening for ~25 existing ones — behind a new data-integrity gate. Pure data; no UI/route work.

Shipped:

- `scripts/check-supply-chain.ts` gate (`pnpm check:data` via tsx): unique company/category ids, stage/feeds/cat/rel.to resolution, delisted-ticker ban (4944), 興櫃 tickers (7909/7887/7918/4542) barred from TWSE/TPEx exch.
- `Emerging` (興櫃) added to the `SCCompany.exch` union in `lib/data/supply-chain/types.ts`, excluded from the quote join.
- 5 new categories (gas, pkgmat, testlab, glasspkg, recycle) with a stage remap; ~27 new companies across `companies/{materials,fab-support,wafer,package-test,board}.ts` (e.g. sungsheng7768, baoteck5340, dehong5475, innotech7734, hwahong6983, megaunion6944, tsc4772, jentech3653, istgroup3289, weihua3055, kaiwai5498).
- §D role/rel deepening for ~25 existing companies (8021 尖點, 6664 群翊, 2383 台光電 sole-M9-for-Rubin, 8358 金居 HVLP3/4, 1560 中砂, 4749 新應材, 8028 昇陽半, 1717 長興, 8091 翔名, etc.).

Key decisions:

- Gate-first: `check:data` built and proven red (bogus rel target) before any data edits; rel edges with unresolvable targets omitted, never invented.
- Bilingual `l(en, zh)` with zh-Hant-TW authoritative; every ticker re-confirmed against TWSE/TPEx.
- 興櫃 companies deliberately excluded here; company id convention romanized-name+ticker (sas5483, psi8028); edge confidence/sourceUrl, actionable biconditional, and gap/foreign-anchor nodes deferred to the stack-tree follow-up.

## 006 — Frontend rebuild

**Status:** partially surviving — Phases A (tokens/chrome), B (part registry), and F (hi-fi rendering) survive in the free-navigation explorer at `/`; Phases C/D/E (scrolly, hardware cards, branch overlays) and G (`/stack`) were removed in the 2026-07 cleanup along with `/market`.

Goal: sequence the approved design docs into phases building one shared 3D scene serving both an Apple-style scroll-disassembly hero on `/` and a multi-axis tree explorer, both bound to the same PartId registry and `lib/data/supply-chain` dataset.

Master key decisions:

- One scene, two views: the tree's containment-axis 3D is the disassembly scene; Phase B's PartId registry is the linchpin blocking C/D/E/F/G.
- Pure `evaluate(p)` timeline: poses derive from progress, never accumulate — drift-free bidirectional scrub.
- Tree nodes reference supply-chain ids (zero duplication, quotes for free); `actionable === (confidence === 'verified')`; 興櫃/delisted ids never enter the quote join.
- Server page shells + client islands; `LStr {en, zh}` zh-Hant-TW default; perf gates 60fps desktop / 30fps mid-mobile, Lighthouse ≥80 on `/`.
- Next.js 16.2.10 breaking changes: read `node_modules/next/dist/docs/` before route code; pnpm only.

### Phase A — Apple design tokens + chrome restyle

**Status:** partially surviving — token layer, Reveal, product-bar nav, `/supply-chain` chrome, and UI-primitive alignment survive; the `/market` restyle (Task 4) died with `/market`.

Goal: restyle the app to Apple's design grammar via a shared Tailwind v4 token layer plus a product-bar nav and a Reveal primitive — style only, no IA or logic changes.

Shipped:

- `app/globals.css` as single token source: `@theme inline` + `:root` vars (`--background` #0b0d10, `--surface-1`, `--card`, navy #0d1b2a retired to `--stage-bg` only, amber `--primary` #ffb703, `--up`/`--down` for 紅漲綠跌, `--ease-apple`, `--radius` 1.25rem) and type-ramp utilities (`.text-display` … `.ss-hairline`); zh headlines one weight lighter.
- `components/site/reveal.tsx`: IntersectionObserver `<Reveal>` (24px rise + fade once; reduced-motion renders visible).
- Sticky 44px frosted product-bar in `app/layout.tsx` + `components/site/{nav-links,brand,locale-toggle}.tsx`.
- `/market` and `/supply-chain` chrome restyles; `components/ui/{button,card,badge,input,select,table}.tsx` aligned to token radii/hairlines/ring, no API changes.
- Acceptance: navy grep audit (survives only as `--stage-bg`), contrast ≥4.5:1, screenshots per locale.

Key decisions:

- Apple near-black page surfaces; amber sole accent (never body text); Geist mono tabular quote numerals.
- Strictly styling-only; verification via build/lint/`check:data` + screenshots (no UI test runner); usable ≥320px, ≥44px touch targets, dvh/svh + safe-area.

### Phase B — Part-registry refactor of the scene

**Status:** surviving — the registry lives inside the free explorer's silicon-stack-scene; its downstream C/D consumers were removed, but the registry remains part of the surviving scene.

Goal: make individual scene parts addressable via a PartId registry with `applyPose()`, without changing the existing 4-level explorer — the contract underpinning Phases C/D/G.

Shipped:

- `lib/scene/parts.ts` — `createPartRegistry()`: PartId → THREE.Object3D with register/get/has/ids/applyPose/reset, base-transform capture, lazy per-part material isolation (clone on first opacity use) so fades never bleed through shared materials.
- `lib/scene/types.ts` — PartId union (28 ids: rack, sled, lid, fanWall, gpuTray, board, heatsink, interposer, substrate, die, fins, psu0-1, gpuModule0-7, hbm0-7), Pose, PartRegistry; SceneApi gains `applyPose`/`getPart`.
- `scripts/check-parts.ts` + `pnpm check:parts` headless gate (id uniqueness, transform+reset round-trip, opacity no-bleed, unregistered-id no-op).
- Registry threaded through `createScene` in `lib/scene/silicon-stack-scene.ts` with a dev-only completeness warning; level builders (`rack.ts`, `server.ts`, `package.ts`, `die.ts`) register parts, incl. a new thin lid mesh.

Key decisions:

- Parts are additive handles into existing meshes; Level/goLevel, hotspots, camera, transitions untouched.
- Opacity edits clone shared materials (isolated materials stop tracking setAccent — accepted for exploded/faded parts).
- Zero-offset wrapper groups preserve world positions; registry math tested headlessly (Object3D needs no WebGL).

### Phase C — Scroll-disassembly hero

**Status:** feature removed in 2026-07 cleanup; the Phase B registry and Phase A tokens it built on survive in the free explorer.

Goal: turn `/` into a ~900vh pinned scrollytelling hero scrubbing an 8-chapter rack→die disassembly through the part registry, with copy overlays, a chapter rail, CTA outro, reduced-motion fallback, and a 自由探索 handoff to explore mode on the same scene.

Shipped:

- `lib/scene/scroll-math.ts` + `lib/scene/disassembly-timeline.ts` (pure `evaluate(p)`/`evalCamera(p)`, CHAPTERS ×8, base-relative delta keyframes, CAMERA_TRACK anchored to level cam specs).
- `scripts/check-timeline.ts` headless gate (purity/zero-drift, camera coverage of [0,1], chapter contiguity), added to `pnpm test`.
- Scene `scrolly` mode in `silicon-stack-scene.ts` (`setMode`/`setScrollProgress`, `applyPoseFromBase`); explore mode unchanged as default.
- `components/explorer/scrolly/` (use-scroll-progress with ScrollTrigger pin + scrub 0.5, scrolly-stage, chapter-rail, copy-panel, scrolly-home); `app/page.tsx` server shell; `/#ch-N` deep links; CTA outro + handoff without reload.

Key decisions:

- GSAP ScrollTrigger supplies only progress and pinning; the pure unit-tested `evaluate(p)` owns all part+camera animation — zero-drift by construction.
- Never setState from rAF: progress lives in a ref; copy/rail styles are ref-driven.
- Deltas from registered base poses keep explore mode byte-identical; cinematic polish deferred as a follow-up, not a gate.

### Phase D — Depth-gated hardware cards

**Status:** feature removed in 2026-07 cleanup — the card/callout UI and hardware-map dataset served the removed scrolly surface; the `projectPart` scene addition lived in `silicon-stack-scene.ts`, which survives.

Goal: anchor hardware cards to parts during the scrub — part name, blurb, supplier companies with live quotes — depth-gated by chapter, occlusion-faded, density-capped, with SVG leader lines and deep-links to `/supply-chain?focus=<companyId>`.

Shipped:

- `lib/data/hardware-map.ts` — ~22 of 29 PartIds mapped to supply-chain categories; pure `companiesForPart()` (explicit companyIds first, then category members TW-listed first).
- `scripts/check-hardware.ts` + `pnpm check:hardware` gate (registration, resolution, non-empty companies, valid chapter ranges).
- `SceneApi.projectPart(id, anchor)`: world→screen projection reusing hotspot math + ~150ms-throttled per-id occlusion raycast.
- `components/explorer/annotations/{hardware-card,callout-layer,callout-drawer}.tsx`: top-2 supplier chips with live quotes (useQuotes, 紅漲綠跌), priority cap 5 desktop / 2 mobile, deterministic left/right slot layout, SVG leaders, mobile numbered-dot drawer.

Key decisions:

- Part→category→companies indirection so every part resolves; explicit companyIds only when grep-confirmed.
- Scene owns projection; the React callout layer reads it per frame ref-driven — hard rule against setState from rAF/scroll frames.
- Deterministic slot layout instead of collision-solving; occlusion via throttled raycast cache.

### Phase E — Hover supplier branches (ego-network + tier ribbon)

**Status:** feature removed in 2026-07 cleanup with the scrolly home; the `/supply-chain` graph and dataset it deep-linked to survive.

Goal: hovering/tapping a company chip on a hardware card blooms a radial ego-network overlay (≤8 supplier/customer alters on rel-labeled branches with live quotes, pivot + breadcrumb, deep-link to `/supply-chain?focus=`), plus a fixed bottom 9-tier chain ribbon glowing with the active chapter.

Shipped:

- `lib/data/adjacency.ts` (pure): `buildAdjacency` (symmetric), `rankAlters` (TW-exchange-first → degree → alpha, max 8), `layoutBranches` (polar fan, 300° sweep).
- `scripts/check-branches.ts` + `pnpm check:branches` gate (symmetry, ranking order, no-overlap ≥24px, n=1 safety).
- `components/explorer/branches/branch-overlay.tsx`: portal overlay, trail-based pivot/breadcrumb, SVG lines + HTML chips, +N expander, Esc/backdrop close, ≥44px keyboard-accessible chips.
- `components/explorer/branches/tier-ribbon.tsx`: 材料→設備→晶圓→晶片→封測→板卡→子系統→系統→雲端, ref/rAF chapter glow, tier click → `/supply-chain` group filter.

Key decisions:

- Layer hygiene: shared adjacency data in `lib/data/`; explorer never imports `components/graph/*`; tier labels/palette duplicated locally.
- Overlay is event-driven React state; ribbon glow reads the scroll-progress ref in rAF.
- Strictly additive: explore mode and Phase C/D stay behavior-identical.

### Phase F — High-fidelity rendering

**Status:** surviving in the free explorer (IBL/PBR/post stack); the scrolly per-chapter exposure track is moot. Later hardened by Plan 007 Part D (e6be286, 2c11a6b).

Goal: lift the scene from toyish primitives toward "photographed, not computed" via image-based lighting, a PBR material pass, a subtle post stack, and a per-chapter exposure track — zero behavior change to explore/scrub/cards, no new npm dependency.

Shipped:

- IBL: `PMREMGenerator.fromScene(new RoomEnvironment(), 0.04)` → `scene.environment` in `silicon-stack-scene.ts` (procedural studio env, no .hdr asset; three pinned ^0.152.2).
- PBR in `lib/scene/materials.ts`: envMapIntensity ~1.0–1.2 on all `std()` materials; steel/silver/frame upgraded to MeshPhysicalMaterial metalness:1 + anisotropy; AccentRegistry/applyAccent preserved.
- Post: EffectComposer (HalfFloatType) with RenderPass + subtle UnrealBloomPass (0.25/0.4/0.85) + SMAAPass + OutputPass (ACES + sRGB), all from three/examples/jsm; gated behind `?fx=0` / low-device-tier fallback.
- `EXPOSURE_TRACK` + `evalExposure(p)` in `disassembly-timeline.ts`, clamped ~[0.8,1.4], driven in scrolly mode (explore keeps fixed 1.06); `check-timeline` extended.

Key decisions:

- Asset-free, dep-free: RoomEnvironment + three's own EffectComposer instead of external HDRI + pmndrs postprocessing/n8ao (version risk vs three 0.152); real HDRI, n8ao, and Blender→glTF explicitly deferred.
- Post stack never a hard dependency: `?fx=0` restores the exact prior render path; DPR clamped min(dpr,2); composer resizes with container.
- Render-path-only change: DOM hotspots/callouts and goLevel/`evaluate(p)` untouched; the timeline owns exposure via a pure, gate-validated track.

### Phase G — Multi-axis tree explorer (/stack)

**Status:** feature removed in 2026-07 cleanup — `/stack` was deleted; the supply-chain dataset it referenced survives.

Goal: new `/stack` route — a multi-parent, axis-tagged tree navigable along six axes (containment default, flow:data/power/heat, subsystem, stage), each node resolving to Taiwan suppliers with live quotes and honest ✓/※/？ confidence badges. Card-view first; 3D deferred.

Shipped:

- `lib/data/stack-tree.ts` — StackNode/StackEdge model (Axis, Confidence, flowSpec, specs with sourceUrl) seeded ~40–60 nodes; edges reference existing supply-chain ids.
- `lib/data/stack-tree-nav.ts` — pure per-axis indexes (parentsOf/childrenOf/rootsOf/pathTo/treeFor; re-root = childrenOf).
- `scripts/check-tree.ts` + `pnpm check:tree` gate (id resolution, `actionable === (confidence === 'verified')` invariant, unique ids, containment reachability, no self-edges).
- `app/stack/page.tsx` + `components/stack/{stack-explorer,axis-switcher,breadcrumb,mini-map,node-panel,flow-overlay}.tsx`; hash URL (`/#/<axis>/<path>`) as single navigation source of truth; flow axes render ordered diagrams with per-hop flowSpec labels (bandwidth/volt/°C); node panel with per-spec source links and supplier quote chips.

Key decisions:

- Zero data duplication: only supply-chain company/category ids referenced; quotes free via useQuotes.
- Honesty invariant gate-enforced; the entire 2026-07-18 upstream expansion is sourced/gap, never verified; non-actionable links dimmed + 待查證 and excluded from aggregation.
- Additive and isolated (new route/files only); multi-parent DAG per axis via a reverse index built once; guided-tour reuse and 3D binding deferred.

## 007 — Modernize the server: Rubin gen, GPU internals, chip set, 3D fidelity

**Status:** partially surviving — Part D scene-fidelity commits (e6be286, 2c11a6b) survive in the free explorer; the stack-tree data additions (337211e, eb9db5e, 9779d4d) landed but became moot when `/stack` was removed; the anpec rel fix in the surviving supply-chain dataset persists.

Goal: bring `/stack` up to the Vera Rubin generation, give the GB300 GPU a real on-die microarchitecture sub-tree, add the missing board silicon mapped to existing dataset companies, and modestly raise 3D geometric fidelity.

Shipped:

- Part B: replaced the two-node `gpu.internal.*` stub in `lib/data/stack-tree.ts` with a 10-node GB300 die hierarchy (gpu.die → GPC ×8 → TPC (160 SM) → SM → warp schedulers / register file / L1-shared / 5th-gen tensor → TMEM, + die-level L2); new nodes tiered `sourced` via SRC_LATEST.
- Part A: Vera Rubin NVL72 as a data-only delta layer — 13 nodes (rack.rubin under dc: R200 GPU, HBM4, Vera CPU, NVLink6/NVSwitch6, CX-9, BF-4, SOCAMM, + gap-tier CPX/Ultra/Feynman).
- Part C: `rack.tray.power` group (DrMOS/VRM/PMIC/e-fuse → upi6719/gmt/anpec/silergy, commit 337211e) + 9 more tray chips (retimer/NOR flash/PCIe switch/TPM-RoT/CPLD/SSD/timing/monitor/mgmt PHY → parade/winbond/macronix/nuvoton/phison/txc/realtek); foreign-only nodes carry no companyIds.
- Axis wiring onto SUBSYSTEM_MEMBERS/STAGE_MEMBERS (eb9db5e); anpec→nvidia DrMOS rel in `lib/data/supply-chain/companies/chip.ts` + 茂達 ticker fix 6552→6138 in the research doc (9779d4d).
- Part D: `lib/scene/geometry.ts` cylinder segments 24→48 + RoundedBoxGeometry edges (e6be286); `silicon-stack-scene.ts` `resize()` re-applies clamped min(dpr,2) pixel ratio to renderer + composer (2c11a6b).

Key decisions:

- Rubin modeled as a data-only delta subtree under dc, not a new `gen` axis — rejected a GB300↔Rubin toggle.
- Codebase verification overturned two draft assumptions: zero new companies needed (茂達 Anpec already present as `anpec`, ticker 6138 not 6552), and no DPR bug existed (canvas was exact 2× retina) — the "low-res" complaint was low-poly geometry, so the fix was a fidelity bump + DPR-change hardening, deferring the glTF pipeline.
- Honesty invariant preserved by construction (`edgeTo()` reads NODE_TIER; new nodes `sourced`/`gap`, never `verified`); Silicon Motion kept blurb-only (US-ADR, no TW quote); deferred: flow:data threading L1→L2→memctrl, glTF/PBR asset pipeline, gen axis.
