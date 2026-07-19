# Plan 006 · Phase E — Hover → supplier branches (Implementation)

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Bite-sized execution of **Phase E** of `plans/006-build-frontend-scroll-disassembly-and-multi-axis-tree.md`. Design: `apple-redesign/04-supplier-branches/*`.

**Goal:** Hover (desktop) / tap (mobile) a company chip on a Phase D hardware card → a radial **ego-network overlay** blooms in place: the company at center, its ≤8 supplier/customer *alters* fanned on branch lines labeled with the `rel` relationship, each an alter chip with a **live quote**. Hovering/clicking an alter **pivots** (it becomes the new ego; a breadcrumb trail preserves the path); Esc/backdrop closes; `在圖譜中檢視` deep-links to `/supply-chain?focus=`. Plus a bottom **tier ribbon** (9 chain tiers) that glows with the active chapter and with tiers touched by the open overlay.

**Architecture:** A pure `lib/data/adjacency.ts` (built from `rel` edges — layer hygiene: the explorer island must NOT import `components/graph/*`) provides `buildAdjacency`, `rankAlters` (TW→degree→alpha), and `layoutBranches` (polar fan). A `branch-overlay` island renders SVG branch lines + HTML alter chips (crisp text) with pivot/breadcrumb state and `useQuotes`. A `tier-ribbon` island reuses the stage palette. New `check:branches` gate (pure layout/rank tests).

**Tech Stack:** three.js-adjacent DOM overlays, Next 16/React 19, Tailwind v4, tsx, pnpm.

## Global Constraints

- pnpm; branch `feat/006-phases-e-f-g`, commit directly. Bilingual `LStr {en,zh}` zh-default; Apple tokens; 紅漲綠跌 via `upDownColor`; **≥44px** interactive targets; quotes via `useQuotes`/`normalizeCode`.
- **No `setState` from an rAF/scroll frame** (ribbon chapter-glow reads the progress ref; overlay is event-driven so React state is fine there).
- **Explore mode + the Phase C/D scrub/cards stay behavior-identical** — Phase E is additive UI on top.
- **Layer hygiene:** `lib/data/adjacency.ts` is the shared source; do NOT import from `components/graph/*` into the explorer.
- **Verify:** new `pnpm check:branches` (into `pnpm test`) + `pnpm build` + `pnpm lint`; overlay/pivot/ribbon via browser smoke (Task 5).

## Data (`lib/data/adjacency.ts`, pure)

```ts
import { COMPANIES, COMPANY_MAP } from '@/lib/data/supply-chain/derived'; // or barrel
import type { LStr } from '@/lib/i18n/config';
export interface Alter { id: string; label: LStr }
export function buildAdjacency(): Map<string, Alter[]> {
  const adj = new Map<string, Alter[]>();
  const push = (a: string, b: string, label: LStr) => {
    const arr = adj.get(a) ?? (adj.set(a, []), adj.get(a)!);
    if (!arr.some((x) => x.id === b)) arr.push({ id: b, label });
  };
  for (const c of COMPANIES) for (const r of c.rel ?? []) { push(c.id, r.to, r.label); push(r.to, c.id, r.label); }
  return adj;
}
export const ADJ = buildAdjacency();
const degree = (id: string) => ADJ.get(id)?.length ?? 0;
const isTW = (id: string) => { const c = COMPANY_MAP[id]; return !!c && (c.exch === 'TWSE' || c.exch === 'TPEx'); };
export function rankAlters(alters: Alter[], max = 8): Alter[] {
  return [...alters].sort((a, b) => Number(isTW(b.id)) - Number(isTW(a.id)) || degree(b.id) - degree(a.id) || a.id.localeCompare(b.id)).slice(0, max);
}
/** polar fan: 300° sweep, gap at bottom for the breadcrumb slot */
export function layoutBranches(n: number, r = 140): { x: number; y: number; side: 'l' | 'r' }[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (-150 + (300 / Math.max(1, n - 1)) * i) * (Math.PI / 180);
    return { x: Math.sin(a) * r, y: -Math.cos(a) * r, side: Math.sin(a) < 0 ? 'l' : 'r' };
  });
}
```

---

### Task 1: `adjacency.ts` + `check:branches` gate
**Files:** Create `lib/data/adjacency.ts`, `scripts/check-branches.ts`; Modify `package.json`.
- [ ] **Step 1** — create `adjacency.ts` (above). Resolve the `COMPANIES`/`COMPANY_MAP` import path against the real barrel (`lib/data/supply-chain`).
- [ ] **Step 2** — `scripts/check-branches.ts` + `"check:branches"`, added to `test`. Assert: `buildAdjacency()` non-empty and symmetric (if b∈adj(a) then a∈adj(b)); `rankAlters` orders TW-first then by degree (construct a case); `layoutBranches(8)` produces 8 points with **no two within 24px** (no overlap) and all within radius; `layoutBranches(1)` doesn't divide-by-zero. `process.exit(1)` on failure; print `✓ branches OK`.
- [ ] **Step 3** — `pnpm check:branches`+`test`+`build`+`lint`; commit `feat(data): supplier adjacency (ego) + check:branches gate`.

### Task 2: `branch-overlay.tsx`
**Files:** Create `components/explorer/branches/branch-overlay.tsx`
- [ ] Ego-network overlay (`'use client'`, portal into the stage layer): props `{ rootId: string; quotes; locale; onClose; onDeepLink(id) }`. State = `trail: string[]` (`trail.at(-1)` = current ego; `pivot(id)=setTrail(t=>[...t,id])`, `jumpBack(i)`). Render: ego chip center; `rankAlters(ADJ.get(ego)??[])` fanned via `layoutBranches`; **SVG** branch lines (crisp) from center to each alter with the `rel` `label`; each **alter chip** = zh/en name + ticker + live quote (`upDownColor`, 紅漲綠跌, blank-graceful); a `+N` chip if >8 alters (expands the tail). Hover/click alter → `pivot`; **breadcrumb** (奇鋐 → 台積電 → …) with `jumpBack`; `Esc`/backdrop click → `onClose`; `在圖譜中檢視` → `onDeepLink(ego)`. Keyboard: focusable chips, Enter=pivot, Esc=close; `aria-label`s bilingual; ≥44px chips. Motion: `fadeUp`/`--ease-apple`.
- [ ] Verify+commit `feat(explorer): ego-network branch overlay with pivot + live quotes`.

### Task 3: `tier-ribbon.tsx`
**Files:** Create `components/explorer/branches/tier-ribbon.tsx`
- [ ] Slim fixed bottom ribbon: the 9 tiers 材料→設備→晶圓→晶片→封測→板卡→子系統→系統→雲端 (reuse `GROUP_LABELS`/`PALETTE`/`STAGE_GROUP` values — but define them locally or in `lib/data/` for layer hygiene, do NOT import `components/graph/*`). Props `{ progressRef; activeStages?: Set<number>; onTier(group) }`. Chapter glow: a ref-driven rAF maps the current `p`→chapter→tier group(s) and toggles a `.glow` class (no per-frame setState). When an overlay is open, `activeStages` lights the tiers its visible branches touch. Click a tier → `onTier(group)` → deep-link `/supply-chain` group filter. ≥44px hit areas; bilingual `aria`.
- [ ] Verify+commit `feat(explorer): chain tier ribbon (chapter + overlay glow)`.

### Task 4: Integrate into cards + stage
**Files:** Modify `components/explorer/annotations/hardware-card.tsx`, `components/explorer/scrolly/scrolly-stage.tsx`
- [ ] Card company chips: hover (desktop) / tap (mobile) → open `<BranchOverlay rootId={company.id}>` (portal over the stage). Keep the existing chip deep-link as a secondary action. Mount `<TierRibbon progressRef … />` in the scrolly stage (fixed bottom, above canvas, below chrome); wire `onTier`/`onDeepLink` → `/supply-chain?focus=`/group filter. Overlay open → pass the touched stages to the ribbon.
- [ ] Verify+commit `feat(home): wire branch overlay + tier ribbon into the disassembly`.

### Task 5: Acceptance
- [ ] Gates green (`test` incl. `check:branches`, build, lint). Browser smoke (Playwright): hover a card chip → overlay blooms <100ms with real alters + live quotes; **4-hop pivot** with breadcrumb back-nav works; Esc/backdrop closes; keyboard focus/Enter/Esc; the tier ribbon glows with the chapter and lights the overlay's tiers; a tier click + `在圖譜中檢視` deep-link resolve; explore/scrub/cards still work; 0 console errors. Stop dev. Commit any fixes.

## Self-Review
- Coverage: adjacency+rank+layout+gate (04/code) = T1; overlay+pivot+breadcrumb+quotes (04/design+research) = T2; tier ribbon (04/design) = T3; integration = T4; 4-hop pivot + keyboard + ribbon acceptance = T5.
- Placeholders: adjacency + layout + gate fully specified; overlay/ribbon DOM authored against the design rules + existing card/quote patterns.
- Risk: layer hygiene (no `components/graph/*` import) — T1/T3 keep shared data in `lib/data/`; per-frame setState — ribbon uses ref/rAF; additive only — explore/scrub/cards untouched.

## Execution Handoff
Dynamic-workflow, Task 1 first.
