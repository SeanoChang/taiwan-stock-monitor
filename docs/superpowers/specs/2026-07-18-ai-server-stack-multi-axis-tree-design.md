# Design — AI-server stack multi-axis tree explorer

- **Date:** 2026-07-18
- **Status:** Approved in brainstorming; ready for implementation planning
- **Supersedes:** the single-parent `StackNode` (`parent` + `children[]`) sketched in
  `docs/superpowers/ai-server-stack/design-tree-navigation-experience.md` and the
  execution scope of `docs/superpowers/plans/004-stack-tree-expansion.md`
- **Workspace:** `docs/superpowers/ai-server-stack/`

## 1. Goal

Replace the linear four-level scroll (rack → server → package → die) with a
**multi-angle tree explorer**: the same set of hardware nodes, navigable from
several *directions* (axes), where every node still resolves to its Taiwan-listed
supplier(s) and a live stock quote. This is the product's thesis made
navigable — hardware you can explore, that always answers "who makes this, and
what's the stock doing."

## 2. Decisions (locked during brainstorming)

| # | Decision | Choice |
|---|----------|--------|
| 1 | **Primary spine** | Physical containment (rack → tray → package → die), reusing the Apple 3D disassembly scene |
| 2 | **Multi-angle model** | **True multi-parent** — a typed **edge graph**, not a tree. Re-root by picking an axis. |
| 3 | **v1 axes** | `containment` (default) · `flow:data` · `flow:power` · `flow:heat` · `subsystem` · `stage`. Company-ego, sole-source, and BOM-value axes → **v2**. |
| 4 | **Honesty posture** | Show all; per-node ✓/※/？ badge + source link; 待查證 nodes visible as the research roadmap; unverified links **quarantined** from any stock signal. |
| 5 | **Data approach** | New `lib/data/stack-tree.ts` whose nodes **reference existing `supply-chain.ts` ids** (company / category / stage) — zero duplication, live quotes for free. |

Every node surfaces its supplier + live quote through the containment spine's
`companyIds`, so the stock layer is present in v1 even though the *company
re-rooting axis* waits for v2.

## 3. Data model — `lib/data/stack-tree.ts`

A node's "parents on axis X" = whoever holds an edge to it tagged `X`. Re-rooting =
filter edges to one axis, then walk. **Provenance rides on the edge**, because the
same company can be a verified supplier on one axis and a 待查證 guess on another.

```ts
type Axis =
  | 'containment'
  | 'flow:data' | 'flow:power' | 'flow:heat'
  | 'subsystem'
  | 'stage'

type Confidence = 'verified' | 'sourced' | 'gap'   // ✓ / ※ / ？

interface StackEdge {
  to: StackNodeId
  axis: Axis
  confidence: Confidence
  sourceUrl?: string
  actionable: boolean                 // === (confidence === 'verified'); see §6
  flowSpec?: { value: number; unit: string; label: LStr }  // powers flow overlays
}

interface StackNode {
  id: StackNodeId                     // stable, URL-safe: 'gpu.substrate.tglass', 'up.litho'
  name: LStr; blurb: LStr
  edges: StackEdge[]                  // outgoing, multi-axis — this is the multi-parent graph
  companyIds?: CompanyId[]            // → supply-chain.ts (live quotes)
  categoryId?: CategoryId             // → supply-chain.ts
  stageId?: StageId                   // → supply-chain.ts (drives the stage axis)
  specs?: { value: string; unit?: string; confidence: Confidence; sourceUrl?: string }[]
  scene?: { modelId?: string; cameraPose?: Pose; lod?: LodGroup }  // optional 3D binding
}
```

- A **reverse index** (built once at load) maps `(axis, node) → parents` so the
  breadcrumb and mini-map can render any axis's tree.
- This model *generalizes* the existing supply-chain graph's `member` / `rel` /
  `feed` edges (add `axis` + provenance and the tree and the graph are the same
  structure viewed differently) — but v1 keeps the two files separate per
  Decision 5; unifying onto a generic graph core is a deferred north star.

## 4. Axes in v1

Containment is the default. The 2026-07-18 upstream expansion mostly deepens the
**containment**, **stage**, and **subsystem** axes rather than adding new ones.

| Axis | What it is | Seeded from |
|------|-----------|-------------|
| `containment` | rack → tray → package → die → **substrate → ABF materials** and the **upstream** fab/litho/etch/depo/CMP/BEOL/recycle sub-tree | `data-stack-tree-taxonomy.md`, `tree-website-navigation-map.md` |
| `flow:data` | GPU SM → HBM → CoWoS → NV-HBI → NVLink/NVSwitch → scale-out → storage | `research-verified-gpu-hbm-packaging-interconnect.md` |
| `flow:power` | grid 480Vac → 33kW shelf → ~50V busbar → PDB 48→12V → VRM → GPU 1400W | `research-verified-rack-power-cooling.md` |
| `flow:heat` | cold plate → QD → manifold → CDU → facility water (W45); 90% liquid / 10% air | `research-verified-rack-power-cooling.md` |
| `subsystem` | compute / memory / packaging / scale-up / scale-out+optics / power / cooling / management / **upstream-materials** | derived grouping over the node set |
| `stage` | the existing 10-stage ladder (materials → fabsupport → wafer → chip → package → board → subsystem → system → cloud), now richly populated by the upstream expansion | `supply-chain.ts` stage ids + the new upstream nodes |

**Cross-axis jump** is the signature interaction: sitting on `gpu.cowos` in
`containment`, switch to `stage` and you stay on CoWoS, now under
`package / foundry`. Same node, different parent context — "different angles"
made navigable.

## 5. Navigation & IA

- **Axis switcher** chip row: `[機構包含][資料][電力][熱][子系統][階段]`, default 機構包含.
- **Breadcrumb** reflects the path along the active axis.
- **Mini-map drawer** renders the active axis's tree (from the reverse index),
  current node lit, click-to-fly.
- **URL** carries the axis: `/#/containment/rack/tray/gpu-package`,
  `/#/flow-power/busbar/pdb`, `/#/stage/package/substrate` — every angle is a
  shareable link.
- **Guided tour** = the Apple scroll-scrub survives as a *curated ordered walk
  along the containment axis* (~8 views, reusing the phase-01 timeline). Exiting
  at any point drops you at that node in free mode. **Kept in v1.**
- **Acceptance:** ≤3 clicks to any node from anywhere; URL-addressable;
  breadcrumb / mini-map / flow toggles keyboard-accessible; zh/en complete.

## 6. Honesty / provenance

- Per-node marker ✓ verified / ※ sourced / ？待查證; the info panel shows each
  spec's value + source link and each supplier link's confidence.
- **Quarantine rule:** `actionable = (confidence === 'verified')`. Non-actionable
  links render dimmed + 待查證 and **must not** be summed by any stock-signal
  surface. v1 has no aggregation surface yet, but the flag is enforced from day
  one so v2 (BOM value, sole-source screener) inherits the guard.
- **The whole 2026-07-18 upstream/substrate/litho expansion is `sourced` or
  `gap` — none of it `verified`.** Its research runs had their adversarial-verify
  + ticker stages cut short by a model limit (`tree-website-navigation-map.md`
  lines 8–14; and the dataset-additions header). Map it as: TW-hooked upstream
  nodes → `sourced` (※); the structural no-Taiwan links in §E → `gap` (？) with a
  foreign anchor. Nothing in this expansion is `actionable` until the pass-2
  verification (`research-open-gaps-second-pass.md` item 8) promotes it. This is
  the intended "honest research roadmap in-product." *(The `verified` ✓ tier that
  exists in v1 is the rack / package / datapath spine from the earlier verified
  docs — not this expansion.)*

## 7. Data dependency — extend `supply-chain.ts` first (build step 0)

Because stack-tree nodes *reference* existing ids, the supplier data must be in
`supply-chain.ts` before the tree can point at it. The authoritative spec is
`data-dataset-additions-semiconductor-upstream.md` (§A–§E); **every ticker must be
re-confirmed against TWSE/TPEx/Goodinfo before writing** — its ticker
auto-recheck stage was cut short by a model limit.

- **New categories (§A):** `gas`, `pkgmat`, `testlab`, `recycle`, `glasspkg`.
  The doc offers an alternative layering — fold `recycle` into the existing
  `fabbuild` and `glasspkg` into the existing `equip`; pick one.
- **New companies (§B — 27 TWSE/TPEx names, have live quotes):** 健策3653,
  長華8070, 印能7734, 迅得6438, 頌勝7768, 台特化4772, 晶呈4768, 聯華實業控股1229,
  建榮5340, 德宏5475, 凱崴5498, 華洋精機6983, 家碩6953, 天虹6937, 閎康3587,
  宜特3289, 汎銓6830, 兆聯6944, 台肥1722, 山林水8473, 朋億6613, 千附實業8383,
  銳澤7703, 南寶4766, 蔚華科技3055, 采鈺6789, 公準精密3178. The *existing*
  `fabbuild` category gains 朋億6613 / 千附實業8383 / 銳澤7703. Secondary glass
  names (事證 C — 群創3481, 友達2409, 正達3149, 宸鴻3673, 友威科3580, 致茂2360,
  國精化學4722) are **watch-only — add no `rel` edges yet.**
- **Existing companies — role-deepening, NOT new (§D):** ~23 companies already in
  the dataset need updated role text + new `rel` edges (e.g. 尖點8021 → unimicron/
  zdt, 群翊6664 → nanyapcb/kinsus, 牧德3563 → ase, plus 光洋科1785, 中砂1560,
  新應材4749, 崇越5434, 家登3680, 長興1717, 由田3455, 信紘科6667, …), and the
  taxonomy's edge additions (nvidia↔liteon, tsmc↔foci). **This is load-bearing —
  step 0 is not just the new rows.**
- **Must NOT be added (§C):**
  - **Delisted:** 兆遠4944 (delisted 2023-11-01, share-swapped into GlobalWafers) —
    purge any residual reference.
  - **興櫃 / emerging board (no TWSE/TPEx quote):** 鈺祥7909, 宇川7887, 創鉅7918,
    科嶠4542 (+ unlisted 穩晟 / WaferChem / 上村 / 太陽油墨 / 長春) must stay off the
    market board. *Whether* to surface them as non-quoted watchlist nodes is an
    **open question** (`research-open-gaps-second-pass.md` item 10) — recommended:
    yes, as a `watchlist` tier carrying no quote.
- **Structural "no Taiwan hook" links (§E):** several links have no TW-listed play
  (多晶矽, 坩堝, EUV 光阻, CMP slurry, ABF 膜, T-glass, 超薄銅箔, 防焊, 鍍銅藥水,
  track, 曝光機, 光罩坯/檢測). Represent each as a foreign-anchor node + `gap`
  badge — never a forced TW proxy (open-gaps item 9).

## 8. Data integrity

Extend the existing integrity script to assert:
1. every `companyId` / `categoryId` / `stageId` on a `StackNode` resolves in
   `supply-chain.ts`;
2. every edge and every rendered spec carries a `confidence` and (for
   `verified`/`sourced`) a `sourceUrl`;
3. every edge satisfies `actionable === (confidence === 'verified')` — both
   directions, so a `verified` edge can't be silently left non-actionable;
4. no node references a delisted id; 興櫃 ids carry the non-main-board `exch` and
   never enter the market-board quote join.

Quotes reuse the existing TWSE/TPEx open-data join (`normalizeCode`), cached 5 min
— no new fetch path.

## 9. Build sequence

**v1**
0. **Extend `supply-chain.ts`** per §7 — new companies + categories, the §D
   existing-company role/`rel` deepening, and the 興櫃/delisted exclusions; update
   the integrity script. *(Dependency — everything else references these ids.)*
1. `stack-tree.ts` types + seed the **verified containment spine**
   (rack → tray → package → die, incl. CoWoS / HBM / the substrate top node) from
   the *verified* docs, with per-node/edge provenance.
2. Reverse-index + re-root/walk utilities (axis → tree projection).
3. Nav shell: axis switcher, breadcrumb, mini-map drawer, URL routing.
4. Node info panel: ✓/※/？ markers + source links + live quote (reuse).
5. Add **subsystem** + **stage** axes (edges referencing existing category/stage
   ids).
6. **Flow** axes (data/power/heat) with animated path overlay + `flowSpec`
   relabeling.
7. **Seed the sourced upstream / substrate-materials / glass sub-tree** (§7) as a
   distinct phase — all card-view (no 3D), every node ※/？ and non-actionable,
   staged *behind* the verified spine so v1 never hinges on unverified data. This
   is ~50–60 nodes; do it as its own step, not folded into step 1.
8. Guided tour = curated containment walk (reuse phase-01 scrub).
9. Extend integrity + provenance lint (§8).
10. Incremental 3D: nodes without a model render as diagram cards; add models over
    time.

**v2 (after pass-2 research)**
- Company-ego axis (reuse the force graph's `?focus` / `inboundRels` ego-tracing).
- Sole-source / bottleneck axis (pricing-power lens).
- BOM $-value node sizing (needs estimate-grade research).
- Verify the sourced/gap upstream, cooling, optics, and VRM sockets → promote to
  ✓ and flip `actionable`.

## 10. Out of scope (v1) · Constraints

- **YAGNI:** company / risk / value re-rooting axes; new quote sources; new 3D
  models beyond what exists (card fallback); BOM $ figures; the generic
  graph-core refactor.
- **Constraints:**
  - Implementation **must read the relevant guide in `node_modules/next/dist/docs/`
    before writing code** — this repo's Next.js has breaking changes vs. training
    data (AGENTS.md).
  - pnpm (project convention).
  - Bilingual `LStr {en, zh}` for all user-facing strings; zh-Hant default.
  - Keyboard-accessible navigation.

## 11. Data sources

Containment / substrate / upstream / litho structure and suppliers:
`data-stack-tree-taxonomy.md`, `tree-website-navigation-map.md`,
`research-verified-abf-substrate-materials-equipment.md`,
`research-verified-fab-process-steps.md`,
`research-verified-foundation-materials.md`,
`research-verified-packaging-beol-recycling.md`,
`data-dataset-additions-semiconductor-upstream.md`. Flows / datapath:
`research-verified-gpu-hbm-packaging-interconnect.md`,
`research-verified-rack-power-cooling.md`. Optics branch:
`research-optics-cpo-light-transmission.md`. Open gaps / pass-2 roadmap:
`research-open-gaps-second-pass.md`.

## 12. Open risks

- **Sparse-but-honest v1:** most upstream links are quarantined ※/？ nodes.
  Mitigated by phasing (§9 step 7 stages the whole upstream *behind* the verified
  spine), but the UI must still make the ※/？ roadmap read as intentional, not
  broken.
- **Subsystem axis is a curated grouping**, not sourced from a doc — its
  membership needs an explicit, reviewable mapping table.
- **id-slug churn:** the taxonomy calls its slugs "suggested"; final ids are
  assigned at implementation and must match `supply-chain.ts`.
- **興櫃/delisted leakage** into the quote join is the most likely concrete bug —
  §8 check 4 exists to catch it.
