# Plan 006 · Phase D — Depth-gated hardware cards (Implementation)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`. Bite-sized execution of **Phase D** of `plans/006-build-frontend-scroll-disassembly-and-multi-axis-tree.md`. Design: `apple-redesign/03-component-annotations/*`.

**Goal:** As the disassembly scrubs, anchor **hardware cards** to parts — each showing the part name, a blurb, and its supplier companies with **live stock quotes** — depth-gated by chapter, occlusion-faded, density-capped, with SVG leader lines. Cards deep-link to `/supply-chain?focus=<companyId>`.

**Architecture:** A pure `lib/data/hardware-map.ts` maps each **registered `PartId`** → an existing `categoryId` (+ optional explicit `companyIds`); the card's company list derives from that category's members (TW-listed first) so it always resolves. The scene exposes `projectPart(id, anchor)` (world→screen projection + throttled occlusion raycast — it owns camera + graph); a React `callout-layer` island reads it per frame (ref-driven, never per-frame setState) to position `hardware-card`s via a deterministic left/right slot layout. Quotes reuse `useQuotes()`. Explore-mode hotspots are unchanged (reusing this data in explore is a documented follow-up).

**Tech Stack:** three.js, Next 16/React 19, Tailwind v4, tsx, pnpm.

## Global Constraints

- **pnpm only.** Branch `feat/006-phase-d-hardware-cards`, commit directly.
- **Never `setState` from an rAF/scroll frame** — the callout layer positions/fades cards via `el.style.*` from a ref-driven rAF (like `copy-panel.tsx`). React state only for card *open/expanded* toggles (user events).
- **Explore mode + the Phase C scrub stay behavior-identical** — `projectPart` is additive; the disassembly timeline/`evaluate(p)` is untouched.
- Bilingual `LStr {en,zh}` via `l()`, zh default; Apple grammar tokens; 紅漲綠跌 by locale via `upDownColor`; ≥44px touch targets on card/chip controls (Phase C precedent).
- **Verification harness:** new `pnpm check:hardware` (headless, into `pnpm test`) + `pnpm build` + `pnpm lint`; `pnpm test` stays green. Card/quote/occlusion behavior via a browser smoke (Task 6).
- **Scope:** cards for the **scrolly disassembly** (ch1–6). Explore-mode hotspot replacement + full mobile-drawer polish are documented follow-ups.

## Data model & seed (registered PartIds only)

`HardwarePart { id: PartId; name: LStr; blurb: LStr; categoryId: string; companyIds?: string[]; chapters: [number,number]; anchor: [number,number,number]; priority: number }`.

Map to the **29 registered** PartIds (from `ALL_PART_IDS`). Suggested coverage (~22, ch1–6), each `categoryId` an EXISTING category:

| PartId | categoryId | chapters |
|---|---|---|
| rack | mech | [1,4] |
| sled | mech | [2,4] |
| lid | mech | [3,4] |
| fanWall | thermal | [3,4] |
| psu0, psu1 | power | [3,4] |
| board | pcb | [3,4] |
| gpuTray | mech | [4,5] |
| heatsink | thermal | [4,5] |
| gpuModule0 (representative) | odm | [4,5] |
| interposer | foundry | [5,6] |
| substrate | substrate | [5,6] |
| die | foundry | [5,6] |
| hbm0 (representative) | memchip | [5,6] |
| fins | euv | [6,6] |

(These categories all exist in `lib/data/supply-chain/categories.ts`. `companyIds` optional — only include ids you grep-confirm resolve, e.g. `tsmc`, `unimicron`, `kinsus`, `avc`, `auras`, `delta`, `liteon`, `skhynix`, `micron`, `gudeng`, `globalwafers`. Anchors: use each part's registered base offset — start `[0,0,0]` local; tune later.)

---

### Task 1: `hardware-map.ts` + company resolver + `check:hardware` gate

**Files:** Create `lib/data/hardware-map.ts`, `scripts/check-hardware.ts`; Modify `package.json`.

- [ ] **Step 1: `lib/data/hardware-map.ts`** — the `HardwarePart` interface, the `HARDWARE_PARTS: HardwarePart[]` seed (table above, bilingual `name`/`blurb`), and a pure resolver:
```ts
import { COMPANIES } from '@/lib/data/supply-chain/companies';
import type { SCCompany } from '@/lib/data/supply-chain/types';
const twFirst = (a: SCCompany, b: SCCompany) => {
  const tw = (c: SCCompany) => (c.exch === 'TWSE' || c.exch === 'TPEx' ? 0 : 1);
  return tw(a) - tw(b);
};
/** Companies for a part: explicit companyIds first (in order), then the rest of the
 *  category's members, TW-listed first. */
export function companiesForPart(part: HardwarePart): SCCompany[] {
  const inCat = COMPANIES.filter((c) => c.cat === part.categoryId);
  const explicit = (part.companyIds ?? [])
    .map((id) => inCat.find((c) => c.id === id))
    .filter(Boolean) as SCCompany[];
  const rest = inCat.filter((c) => !explicit.includes(c)).sort(twFirst);
  return [...explicit, ...rest];
}
```

- [ ] **Step 2: `scripts/check-hardware.ts`** + `package.json`: `"check:hardware": "tsx scripts/check-hardware.ts"`, and `test` = `pnpm check:data && pnpm check:parts && pnpm check:timeline && pnpm check:hardware`. The gate (pure): every `part.id` ∈ `ALL_PART_IDS`; every `categoryId` ∈ `CATEGORY_MAP`; every explicit `companyId` ∈ the dataset AND belongs to `categoryId`; `companiesForPart(part)` non-empty for every part; `chapters` within [0,7] and `p0<=p1`; ids unique. `process.exit(1)` on any failure; print `✓ hardware-map OK — N parts, all categories/companies resolve`.

- [ ] **Step 3: Verify + commit** — `pnpm check:hardware`, `pnpm test`, `pnpm build`, `pnpm lint`.
```bash
git add lib/data/hardware-map.ts scripts/check-hardware.ts package.json
git commit -m "feat(data): hardware-map (part→category→companies) + check:hardware gate"
```

---

### Task 2: Scene `projectPart(id, anchor)` — projection + throttled occlusion

**Files:** Modify `lib/scene/silicon-stack-scene.ts`, `lib/scene/types.ts`

- [ ] **Step 1: Add to `SceneApi`** `projectPart: (id: PartId, anchor?: [number,number,number]) => { x: number; y: number; onScreen: boolean; occluded: boolean } | null;`

- [ ] **Step 2: Implement in `createScene`** — a module `THREE.Raycaster` + a small per-id occlusion cache refreshed on a ~150ms throttle. `projectPart(id, anchor=[0,0,0])`: get the part via `parts.get(id)`; if absent/`!visible`, return null. Compute world anchor: `obj.updateWorldMatrix(true,false); const w = obj.localToWorld(new THREE.Vector3(...anchor))`. Project to px exactly like `projectHotspots` (reuse the same `W/H` + NDC→px math). `onScreen = v.z<=1 && x/y within container`. Occlusion (throttled): raycast from `camera` toward `w`; if the first intersect with the active level's meshes is meaningfully closer than `|w-cam|`, `occluded=true` (cache result per id for 150ms). Return `{x,y,onScreen,occluded}`. Do NOT alter the frame loop / explore projection.

- [ ] **Step 3: Verify + commit** — `pnpm test`+`build`+`lint`; explore/scrub unaffected.
```bash
git add lib/scene/silicon-stack-scene.ts lib/scene/types.ts
git commit -m "feat(scene): projectPart() — anchor projection + throttled occlusion"
```

---

### Task 3: `hardware-card.tsx`

**Files:** Create `components/explorer/annotations/hardware-card.tsx`

- [ ] **Step 1** — Props `{ part: HardwarePart; quotes: ClientQuotesPayload | null; locale }`. Render (Apple-clean card, `.ss-veil`/hairline/`--radius-lg`): part `name`, `blurb`, then the **top-2** `companiesForPart(part)` as chips — each `{zh/en name} {ticker} NT${close} {±%}` colored via `upDownColor(changePct, locale)` (紅漲綠跌), quote via `quotes.quotes[normalizeCode(ticker)]` (gracefully blank if absent/offline). A `更多 →` control expands the full list (React state, user-triggered — OK). Each company chip is a link to `/supply-chain?focus=<companyId>` (≥44px hit area). Reuse the quote-chip pattern from `components/graph/node-panel.tsx`.

- [ ] **Step 2: Verify + commit** — `build`+`lint`.
```bash
git add components/explorer/annotations/hardware-card.tsx
git commit -m "feat(explorer): hardware card with live supplier quotes"
```

---

### Task 4: `callout-layer.tsx` — projection, slots, fade, leader lines

**Files:** Create `components/explorer/annotations/callout-layer.tsx`

- [ ] **Step 1** — `'use client'`. Props: `{ api: SceneApi; progressRef; locale; quotes }`. For the **active chapter** (derive from `progressRef` via `CHAPTERS`/`activeLevelFor`), select the `HARDWARE_PARTS` whose `chapters` range includes it, cap to **5 desktop / 2 mobile** by `priority` (container-query/media). An rAF loop each frame: `api.projectPart(id, part.anchor)` → for on-screen, non-occluded parts, place its card via a **deterministic slot layout** — split into left/right columns by projected x, sort each column by projected y, stack with fixed vertical gaps (never overlap), and draw an **SVG leader line** (full-viewport, `pointer-events:none`) from the projected anchor px to the card edge. Opacity = chapter fade (`curve(p, ch.p0, ch.p1-ch.p0)`) × (occluded ? 0.25 : 1). **All positioning via `el.style.*` from the rAF — no per-frame setState.** Render one `<HardwareCard>` per candidate part (mount/unmount only when the active-chapter set changes — that set change may use state, it's not per-frame).

- [ ] **Step 2: Verify + commit** — `build`+`lint`.
```bash
git add components/explorer/annotations/callout-layer.tsx
git commit -m "feat(explorer): depth-gated callout layer (slots + leader lines + occlusion)"
```

---

### Task 5: Integrate into the scrolly stage + mobile drawer

**Files:** Modify `components/explorer/scrolly/scrolly-stage.tsx`; Create `components/explorer/annotations/callout-drawer.tsx`

- [ ] **Step 1** — In `scrolly-stage.tsx`, once the scene `api` + `progressRef` exist, mount `<CalloutLayer api progressRef locale quotes={useQuotes(initial)} />` over the stage (above the canvas, below chrome). Seed `useQuotes` with the server payload if the page provides one (else it fetches). Do not disturb the pin/scrub or handoff.

- [ ] **Step 2** — `callout-drawer.tsx`: on `≤sm` (container query), replace anchored cards with **numbered dots** on the parts + a bottom drawer listing the active chapter's components (name + top company + quote). Wire the layer to render dots+drawer instead of full cards at that width.

- [ ] **Step 3: Verify + commit** — `pnpm test`+`build`+`lint`; `pnpm dev` → callouts appear per chapter with live quotes.
```bash
git add components/explorer/scrolly/scrolly-stage.tsx components/explorer/annotations/callout-drawer.tsx
git commit -m "feat(home): wire hardware callouts into the disassembly (desktop cards + mobile drawer)"
```

---

### Task 6: Acceptance

**Files:** none (verification; browser smoke).

- [ ] **Step 1: Gates** — `pnpm test` (data+parts+timeline+hardware), `pnpm build`, `pnpm lint` green.
- [ ] **Step 2: Browser smoke** (Playwright/Chrome MCP; `PORT=3137 pnpm dev`): scrub through ch2→ch6; confirm cards appear anchored to parts, show **real companies with live quotes** (紅漲綠跌 correct), **no card overlap** in per-chapter screenshots, density cap respected (≤5), leader lines don't cross cards, occluded anchors fade; a company chip deep-links to `/supply-chain?focus=<id>`; quotes blank-gracefully if offline. Emulate `≤sm` → numbered dots + bottom drawer. No console errors; explore mode + scrub still work. Stop dev.
- [ ] **Step 3: Commit any acceptance fixes** — `git add -A && git commit -m "chore(home): Phase D acceptance"`.

## Self-Review
- **Spec coverage:** part→category→companies contract + validation (03/data) = Task 1; projection+occlusion (03/research) = Task 2; card anatomy + quotes + deep-link (03/design) = Task 3; density/slots/leader-lines/fade (03/design+research) = Task 4; scrolly integration + mobile drawer = Task 5; ≥22 parts resolve + no-overlap + graceful-offline acceptance = Task 6.
- **Placeholder scan:** data contract, resolver, check:hardware, and projectPart are fully specified; card/callout DOM + slot layout are authored against the concrete design rules + current `node-panel`/`hotspots` patterns.
- **Risk:** (1) per-frame setState — Task 4 mandates ref/`style.*` positioning, active-set change is the only state. (2) explore/scrub regression — projectPart is additive; Task 6 verifies. (3) unresolved ids — category-driven design + check:hardware make it structurally safe.

## Execution Handoff
Dynamic-workflow / subagent-driven, Task 1 first. Anchor-position + density tuning is a documented visual follow-up.
