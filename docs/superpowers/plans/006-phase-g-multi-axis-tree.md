# Plan 006 · Phase G — Multi-axis tree explorer (Implementation)

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Bite-sized execution of **Phase G** — the centerpiece of `specs/2026-07-18-ai-server-stack-multi-axis-tree-design.md` (§3–§9). Data source for seeding: `docs/superpowers/ai-server-stack/data-stack-tree-taxonomy.md` (node→category→company table) + `tree-website-navigation-map.md` (containment tree + `[✓]/[s]/[?]` confidence tiers).

**Goal:** A new **`/stack`** route: a multi-parent, axis-tagged tree explorer. The same node set is navigable from several axes (containment default + flow:data/power/heat + subsystem + stage); every node resolves to its Taiwan supplier(s) with a live quote; confidence badges (✓/※/？) and the quarantine rule make it an honest research roadmap. **Card-view first** (3D deferred).

**Architecture (spec §3):** `lib/data/stack-tree.ts` holds `StackNode`s with axis-tagged, provenance-carrying `StackEdge`s that *reference* existing `supply-chain.ts` ids (zero duplication, quotes for free). A pure `stack-tree-nav.ts` builds a reverse index `(axis,node)→parents` and re-root/walk utilities. The `/stack` client island renders the active axis's tree with an axis switcher, breadcrumb, mini-map drawer, hash URL, and a node info panel with live quotes. A `check:tree` gate enforces id resolution + the `actionable===verified` invariant.

**Tech Stack:** Next 16/React 19, Tailwind v4, tsx, pnpm. Reuses `useQuotes`/`normalizeCode`, the Apple tokens, `l()/LStr`.

## Global Constraints
- pnpm; branch `feat/006-phases-e-f-g`, commit directly. Per AGENTS.md read `node_modules/next/dist/docs/` before route/server edits.
- Bilingual `LStr {en,zh}` zh-default; Apple grammar; 紅漲綠跌 via `upDownColor`; ≥44px targets; quotes via `useQuotes`.
- **Additive & isolated:** a NEW route + NEW data/util files. Do NOT change `/`, the disassembly, or `lib/data/supply-chain/*`. `stack-tree.ts` only *references* supply-chain ids.
- **Honesty (spec §6):** per-node ✓/※/？; `actionable === (confidence==='verified')`; non-actionable links render dimmed + 待查證 and are excluded from any aggregation. The whole 2026-07-18 upstream expansion is `sourced`/`gap`, never `verified`.
- **Verify:** new `pnpm check:tree` (into `pnpm test`) + `pnpm build` + `pnpm lint`; nav/panel via browser smoke (Task 6).

## Data model (spec §3)
```ts
export type Axis = 'containment' | 'flow:data' | 'flow:power' | 'flow:heat' | 'subsystem' | 'stage';
export type Confidence = 'verified' | 'sourced' | 'gap';
export interface StackEdge { to: string; axis: Axis; confidence: Confidence; sourceUrl?: string; actionable: boolean; flowSpec?: { value: number; unit: string; label: LStr }; }
export interface StackNode { id: string; name: LStr; blurb: LStr; edges: StackEdge[]; companyIds?: string[]; categoryId?: string; stageId?: string; specs?: { value: string; unit?: string; confidence: Confidence; sourceUrl?: string }[]; }
```
Invariant: `edge.actionable === (edge.confidence === 'verified')`.

---

### Task 1: `stack-tree.ts` — model + seed the node set
**Files:** Create `lib/data/stack-tree.ts`
- [ ] Author the types (above) + `STACK_NODES: StackNode[]` seeded from the two docs. Each **taxonomy row** → a `StackNode` (`id`, bilingual `name`, `categoryId` = its "category hook", `companyIds` = the listed companies **that grep-resolve** in `lib/data/supply-chain/`, `stageId` = the category's stage). **Containment edges** from the nav-map tree (parent→child), tagged `confidence` from the doc's `[✓]`→`verified` / `[s]`→`sourced` / `[?]`→`gap` tiers (per spec §6, ALL upstream/substrate/litho nodes are `sourced`/`gap`, never verified). Add **`subsystem`** edges (group nodes: compute/memory/packaging/scale-up/scale-out+optics/power/cooling/management/upstream-materials) and **`stage`** edges (from each node's `stageId`). Set `actionable = (confidence==='verified')` on every edge. Add `specs` with `sourceUrl` where the docs give a value. Cover the verified rack→package→datapath spine + the sourced upstream sub-tree (~40–60 nodes). `blurb` one-liners bilingual. **Only reference companyIds/categoryIds that resolve** (the gate enforces it).
- [ ] Verify (`pnpm build`+`lint`) + commit `feat(data): stack-tree multi-axis node model + seed`.

### Task 2: `stack-tree-nav.ts` re-root utils + `check:tree` gate
**Files:** Create `lib/data/stack-tree-nav.ts`, `scripts/check-tree.ts`; Modify `package.json`.
- [ ] `stack-tree-nav.ts` (pure): `NODE_MAP`; `parentsOf(axis,id)`/`childrenOf(axis,id)` (reverse + forward index built once per axis); `rootsOf(axis)` (nodes with no parent on that axis); `pathTo(axis,id)` (breadcrumb ancestors, first path); `treeFor(axis)` (nested structure for the mini-map). Re-root = `childrenOf(axis, currentId)`.
- [ ] `scripts/check-tree.ts` + `"check:tree"` in `test`: every `companyId`∈dataset, `categoryId`∈CATEGORIES, `stageId`∈StageId; every `edge.to`∈STACK_NODES; **`edge.actionable === (edge.confidence==='verified')`** for all edges; node ids unique; `containment` axis has ≥1 root and every node reachable from a root (no orphan); no self-edge. Print `✓ stack-tree OK — N nodes, M edges`.
- [ ] Verify + commit `feat(data): stack-tree reverse-index/re-root utils + check:tree gate`.

### Task 3: `/stack` route + nav shell
**Files:** Create `app/stack/page.tsx`, `components/stack/stack-explorer.tsx`, `components/stack/axis-switcher.tsx`, `components/stack/breadcrumb.tsx`, `components/stack/mini-map.tsx`; Modify `components/site/nav-links.tsx` (add 堆疊/Stack nav item).
- [ ] `app/stack/page.tsx` — server shell (metadata, site chrome slots, seed `useQuotes` payload) rendering `<StackExplorer>`. `stack-explorer.tsx` (`'use client'`): reads the URL **hash** `/#/<axis>/<...path>` (default `containment` + a root); axis switcher chips `[機構包含][資料][電力][熱][子系統][階段]` (each re-roots, updates hash); breadcrumb along the active axis (`pathTo`); a collapsible **mini-map drawer** (`treeFor(axis)`, current node lit, click-to-fly); the current node's **children as cards** (name + confidence badge + supplier count) to drill in. Hash is the single source of truth (back/forward works; shareable). **Cross-axis jump:** switching axis keeps the current node id, re-rooting under its parent on the new axis. Keyboard-accessible; ≤3 clicks to any node.
- [ ] Verify + commit `feat(stack): /stack route + axis switcher/breadcrumb/mini-map nav shell`.

### Task 4: node info panel
**Files:** Create `components/stack/node-panel.tsx`; Modify `components/stack/stack-explorer.tsx`
- [ ] Selecting a node opens a panel: `name`, `blurb`, the ✓/※/？ **confidence marker**; `specs` list (value+unit, per-spec source link + confidence); **supplier links** = `companyIds` resolved to companies with live quote chips (`useQuotes`, 紅漲綠跌, blank-graceful), each link showing its edge confidence — **non-actionable (※/？) links render dimmed + 待查證** and carry no actionability. A `在圖譜中檢視` deep-link → `/supply-chain?focus=<companyId>`. Reuse the `hardware-card`/`node-panel` quote-chip pattern. Keyboard/aria; ≥44px.
- [ ] Verify + commit `feat(stack): node info panel (confidence + specs + supplier quotes)`.

### Task 5: flow axes + overlay
**Files:** Modify `components/stack/stack-explorer.tsx`; Create `components/stack/flow-overlay.tsx`
- [ ] The `flow:data`/`flow:power`/`flow:heat` axes re-root like any axis, but their view also renders a **flow diagram**: the ordered path (from the flow edges) with each hop's `flowSpec` (bandwidth/volt/°C) as labels. A toggle chip set surfaces the three flows; selecting one shows its path + relabels. Pure data from the flow edges. Keyboard/aria.
- [ ] Verify + commit `feat(stack): data/power/heat flow axes + flow overlay`.

### Task 6: Acceptance
- [ ] Gates: `pnpm test` (all incl. check:tree), build, lint green. Browser smoke (`PORT=3141 pnpm dev`, `/stack`): every axis chip re-roots and updates the hash; breadcrumb + mini-map reflect the active axis; **cross-axis jump** keeps the node; a node panel shows real suppliers with **live quotes** and correct ✓/※/？ badges; **待查證 links render dimmed**; a flow axis shows its path + specs; a supplier deep-link resolves; **≤3 clicks to any node**; hash URLs are shareable (reload lands on the same node); keyboard-navigable; zh/en complete; `/` + disassembly unaffected; 0 console errors. Stop dev. Commit any fixes `chore(stack): Phase G acceptance`.

## Self-Review
- Coverage (spec §3–§6, §9 steps 1–8): model+seed = T1; reverse-index/re-root + gate (§8) = T2; nav shell / axis switcher / breadcrumb / mini-map / hash URL (§5) = T3; node panel + confidence + quotes + quarantine (§6) = T4; flow axes (§4) = T5; ≤3-clicks/URL/keyboard/zh-en acceptance (§5) = T6. Guided-tour reuse of the Phase C scrub + 3D binding are deferred (§9 steps 7,10) — noted; v1 is card-view.
- Placeholders: model/utils/gate fully specified; node seeding is authored from the two named docs (id/category/company/confidence all in the taxonomy table + nav-map tiers), gate-enforced to resolve.
- Risk: (1) data authoring volume — gate catches unresolved refs; keep to nodes whose companyIds resolve. (2) route/isolation — new files only; `/` and supply-chain untouched. (3) honesty invariant — gate asserts `actionable===verified`.

## Execution Handoff
Dynamic-workflow, Task 1 first (model + seed — the foundation everything else reads).
