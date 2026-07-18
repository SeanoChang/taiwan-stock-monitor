# Plan 006 · Phase C — Scroll disassembly hero (Implementation)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`. Bite-sized execution of **Phase C** of `plans/006-build-frontend-scroll-disassembly-and-multi-axis-tree.md`. Design: `apple-redesign/01-scroll-disassembly/*` (storyboard, code-scroll-progress, tech-scrub-architecture, research-scroll-tech).

**Goal:** Turn `/` into a ~900vh scrollytelling hero: a pinned full-viewport 3D stage that scrubs an 8-chapter rack→die disassembly by driving the Phase B part registry via `applyPose`, with copy overlays, a chapter rail, a CTA outro, `prefers-reduced-motion` fallback, and a `自由探索` handoff to the existing free-explore mode on the same scene.

**Architecture (decision D-002):** GSAP ScrollTrigger supplies progress `p ∈ [0,1]` + pinning ONLY. A pure, unit-tested `evaluate(p)` timeline (`lib/scene/disassembly-timeline.ts`) owns all part + camera animation — no GSAP tweens ever touch three objects. The scene gains a `scrolly` mode: each frame it reads a `scrollProgress` and applies `evaluate(p)` poses (via the Phase B registry) + camera; `explore` mode is the existing orbit/goLevel behavior, unchanged. React islands own the scroll source and the DOM (copy/rail/CTA).

**Tech Stack:** three.js, gsap (new dep, ScrollTrigger only), Next 16 / React 19, Tailwind v4, tsx, pnpm.

## Global Constraints

- **pnpm only.** Branch `feat/006-phase-c-scroll-disassembly`, commit directly.
- **Next 16:** before editing `app/page.tsx` (server component) read the relevant `node_modules/next/dist/docs/` guide (AGENTS.md). Server page shell + client islands — never make the whole page client.
- **Never `setState` from rAF.** Progress is a `ref`. Poses derive from `p` only (drift-free).
- **Explore mode must remain byte-behavior-identical** — `goLevel`, orbit, hotspots, tour still work; the existing `SiliconStackExplorer` is the handoff target.
- Bilingual `LStr {en,zh}` via `l()`, zh default; Apple grammar (`.text-eyebrow/.text-headline/.text-body`, `.ss-veil`, hairlines) from Phase A. `svh` for sticky height (iOS). Amber accent; 紅漲綠跌 untouched.
- **Verification harness:** new `pnpm check:timeline` (headless, added to `pnpm test`) + `pnpm build` + `pnpm lint`; `pnpm test` stays green (data + parts + timeline). Scrub/visual behavior via a browser smoke (Task 6).
- **Scope note:** the keyframe TIMELINE here is a coherent FIRST PASS (parts visibly separate per the storyboard). Exact cinematic pose/camera tuning is a documented follow-up (needs in-browser iteration), not a Phase C gate.

## Storyboard (p → chapter → active level)

| Ch | p | active level | marquee move |
|---|---|---|---|
| 0 hero | 0–.08 | rack (0) | assembled, slow dolly-in |
| 1 rack | .08–.20 | rack (0) | orbit toward hero cabinet |
| 2 sled out | .20–.32 | server (1) | sled/chassis slides forward on +z |
| 3 lid off | .32–.44 | server (1) | `lid` becomes visible + lifts +y; internals revealed |
| 4 board explode | .44–.62 | server (1) | `fanWall`+z, `psu0/1`−x, `gpuTray`+y, `board`−y separate (staggered) |
| 5 package | .62–.80 | package (2) | `hbm0-7` up/out, `interposer`−y, `substrate`−y, `die` lifts |
| 6 die | .80–.94 | die (3) | camera dive to `fins`; fins fan slightly |
| 7 outro | .94–1 | rack (0) | fast reassemble (poses → base) + CTA row |

Active-level thresholds: `[0,.20)→0 · [.20,.62)→1 · [.62,.80)→2 · [.80,.94)→3 · [.94,1]→0`.

---

### Task 1: GSAP dep + pure scroll/timeline engine + `check:timeline` gate

**Files:**
- Modify: `package.json` (add `gsap`; add `check:timeline`; extend `test`)
- Create: `lib/scene/scroll-math.ts`, `lib/scene/disassembly-timeline.ts`, `scripts/check-timeline.ts`

**Interfaces (produced):** `clamp01/range/curve/smooth`, `PartPose`, `CamPose`, `evaluate(p)`, `evalCamera(p)`, `CHAPTERS`, `activeLevelFor(p)`.

- [ ] **Step 1: `pnpm add gsap`** (then confirm `pnpm install --frozen-lockfile` still resolves; gsap has no build script so no `allowBuilds` change needed — verify).

- [ ] **Step 2: `lib/scene/scroll-math.ts`** (drei-style helpers, copied math)
```ts
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 0→1 across [start, start+length] of total progress */
export const range = (p: number, start: number, length: number) => clamp01((p - start) / length);
/** 0→1→0 across the range (copy fades, glow pulses) */
export const curve = (p: number, start: number, length: number) =>
  Math.sin(range(p, start, length) * Math.PI);
/** smoothstep */
export const smooth = (t: number) => t * t * (3 - 2 * t);
```

- [ ] **Step 3: `lib/scene/disassembly-timeline.ts`** (pure data + evaluators)

Define `PartPose = { position?: [n,n,n]; rotation?: [n,n,n]; scale?: number; opacity?: number }` and `CamPose = { target: [n,n,n]; r: number; theta: number; phi: number }`. Import `PartId` from `types`, `range`/`smooth` from `scroll-math`. Implement:
- `lerpPose(from, to, t)` — component-wise lerp (missing fields fall back to identity: pos [0,0,0]-relative → use `to`/`from` presence; treat absent position as the part's base, i.e. omit so the scene leaves it — simplest: only emit fields present in both from/to).
- `interface Keyframe { part: PartId; t0: number; t1: number; from: PartPose; to: PartPose; ease?: (t:number)=>number }`
- `evaluate(p: number): Map<PartId, PartPose>` over the module `TIMELINE`, using `lerpPose(k.from, k.to, (k.ease ?? smooth)(range(p, k.t0, k.t1 - k.t0)))`; later tracks override earlier for the same part.
- `interface CamKey { t0:number; t1:number; from: CamPose; to: CamPose }` and `evalCamera(p): CamPose` over `CAMERA_TRACK` (find the segment containing p; lerp).
- `CHAPTERS: { id:number; p0:number; p1:number; level:number; eyebrow: LStr; headline: LStr; body: LStr }[]` (8 rows from the storyboard, bilingual copy).
- `activeLevelFor(p): number` per the thresholds above.
- `TIMELINE: Keyframe[]` — first-pass choreography implementing the marquee moves in the storyboard table (sled +z on ch2; lid +y ch3; fanWall/psu/gpuTray/board separate ch4; hbm/interposer/substrate/die ch5; fins ch6; a reassemble segment ch7 returning parts to base via `to` = base). Positions are relative offsets added to base — the scene applies them as *deltas* from each part's registered base (see Task 2). Keep offsets modest and readable; this is the tunable first pass.
- `CAMERA_TRACK: CamKey[]` — dolly-in (ch0), orbit (ch1), pull to server (ch2-4), dive to package (ch5), dive to die/fins (ch6), pull back (ch7). Reuse the levels' existing cam specs as anchor values (rack r≈7.2, server r≈2.9, package r≈4.2, die r≈5.4).

- [ ] **Step 4: `scripts/check-timeline.ts` + scripts**

`package.json`: `"check:timeline": "tsx scripts/check-timeline.ts"`, and `"test": "pnpm check:data && pnpm check:parts && pnpm check:timeline"`. The script (pure, no WebGL):
```ts
import { clamp01, range, curve } from '../lib/scene/scroll-math';
import { evaluate, evalCamera, CHAPTERS, activeLevelFor } from '../lib/scene/disassembly-timeline';
const errors: string[] = []; const err = (m: string) => errors.push(m);
// range/curve/clamp sanity
if (range(0.5, 0.4, 0.2) !== 0.5) err('range midpoint wrong');
if (clamp01(2) !== 1 || clamp01(-1) !== 0) err('clamp01 wrong');
if (Math.abs(curve(0.5, 0, 1) - 1) > 1e-9) err('curve peak != 1 at mid');
// determinism / zero-drift: evaluate(0.3) is identical whether or not evaluate(1) ran first
const a = JSON.stringify([...evaluate(0.3)]);
evaluate(1); evaluate(0);
const b = JSON.stringify([...evaluate(0.3)]);
if (a !== b) err('evaluate is not a pure function of p (drift!)');
// camera defined across [0,1]
for (const p of [0, 0.25, 0.5, 0.75, 1]) { const c = evalCamera(p); if (!c || typeof c.r !== 'number') err(`evalCamera(${p}) invalid`); }
// chapters contiguous cover [0,1]; activeLevel in 0..3
let prev = 0;
for (const ch of CHAPTERS) { if (Math.abs(ch.p0 - prev) > 1e-9) err(`chapter gap at ${ch.p0}`); prev = ch.p1; }
if (Math.abs(prev - 1) > 1e-9) err('chapters do not end at 1');
for (const p of [0, 0.3, 0.7, 0.9, 1]) { const lv = activeLevelFor(p); if (lv < 0 || lv > 3) err(`activeLevelFor(${p})=${lv} out of range`); }
if (errors.length) { console.error(`✗ timeline: ${errors.length} problem(s)`); errors.forEach(e=>console.error('  - '+e)); process.exit(1); }
console.log(`✓ timeline OK — ${CHAPTERS.length} chapters, evaluate() pure/drift-free`);
```

- [ ] **Step 5: Verify + commit** — `pnpm check:timeline` (`✓ timeline OK — 8 chapters …`), `pnpm test`, `pnpm build`, `pnpm lint` green.
```bash
git add package.json pnpm-lock.yaml lib/scene/scroll-math.ts lib/scene/disassembly-timeline.ts scripts/check-timeline.ts
git commit -m "feat(scene): pure disassembly timeline + scroll math + check:timeline gate"
```

---

### Task 2: Scene `scrolly` mode — drive parts + camera from `p`

**Files:** Modify `lib/scene/silicon-stack-scene.ts`, `lib/scene/types.ts`, `lib/scene/parts.ts` (add `applyPoseDelta` helper if needed)

- [ ] **Step 1: Registry base-relative pose**

The timeline emits *deltas* from base. Add to `PartRegistry`/`parts.ts` a `applyPoseFromBase(id, pose)` that positions = base.pos + (pose.position ?? 0), rotation = base.euler + (pose.rotation ?? 0), scale = base.scale * (pose.scale ?? 1), opacity as before. (Reuse the captured `base` map.) Export the type on `PartRegistry`.

- [ ] **Step 2: `scrolly` mode in `createScene`**

Add `let mode: 'explore' | 'scrolly' = 'explore'; let scrollP = 0;`. Add `api.setMode(m)` and `api.setScrollProgress(p)`. Import `evaluate, evalCamera, activeLevelFor` + `CHAPTERS`. Add `applyDisassembly(p)`:
- `const lv = activeLevelFor(p)` → set level visibility (`levels[k].group.visible = k===lv`; hide all `lv.dom`); set fog from that level.
- show `lid` (`parts.get('lid')!.visible = true`) during server chapters (p in [.32,.62)); hidden otherwise.
- `for (const [id, pose] of evaluate(p)) parts.applyPoseFromBase(id, pose)`.
- camera: `const c = evalCamera(p); ctl.target.copy(...); ctl.r = ctl.dR = c.r; ctl.theta = c.theta; ctl.phi = c.phi;` (drive the existing orbit-control state so the same render path applies it).
In `frame()`: `if (mode==='scrolly') applyDisassembly(scrollP); else controls.update(camera);` then render. Only project hotspots in explore mode.
`setMode('explore')`: reset every registered part (`parts.ids().forEach(parts.reset)`), `parts.get('lid')!.visible=false`, re-apply current level via `applyLevel`, resume controls. `setMode('scrolly')`: disable auto-rotate, mark animating off.

- [ ] **Step 3: Verify + commit** — `pnpm check:timeline`+`build`+`lint`; explore mode still works (`/` unchanged when mode stays 'explore', the default).
```bash
git add lib/scene/silicon-stack-scene.ts lib/scene/types.ts lib/scene/parts.ts
git commit -m "feat(scene): scrolly mode — evaluate(p) drives parts + camera"
```

---

### Task 3: Scroll-scrub hook + scrolly stage island

**Files:** Create `components/explorer/scrolly/use-scroll-progress.ts`, `components/explorer/scrolly/scrolly-stage.tsx`

- [ ] **Step 1: `use-scroll-progress.ts`** — GSAP ScrollTrigger (pin `.scrolly-stage`, `scrub:0.5`, `onUpdate → progressRef.current = self.progress`), `ScrollTrigger.refresh()` after mount; native rAF + `getBoundingClientRect` fallback if reduced-motion. Return `progressRef` + `scrollToChapter(i)` (smooth-scroll to the chapter's scroll offset).

- [ ] **Step 2: `scrolly-stage.tsx`** (`'use client'`) — mounts the scene (reuse a trimmed variant of `use-scene` OR call `createScene` directly), `api.setMode('scrolly')`, and an rAF loop pushing `api.setScrollProgress(progressRef.current)` each frame (smooth regardless of onUpdate cadence). Renders the pinned `<div className="scrolly-stage">` with the canvas + hotspot layer. Exposes `onHandoff` (switch to explore). Reduced-motion: skip GSAP, use stepped chapter buttons that set discrete `p`.

- [ ] **Step 3: Verify + commit** — `build`+`lint`.
```bash
git add components/explorer/scrolly/
git commit -m "feat(explorer): scroll-scrub hook + pinned scrolly stage island"
```

---

### Task 4: Chapter rail + copy panels

**Files:** Create `components/explorer/scrolly/chapter-rail.tsx`, `components/explorer/scrolly/copy-panel.tsx`

- [ ] **Step 1: `chapter-rail.tsx`** — right-edge dot per chapter (from `CHAPTERS`), active by current `p` (subscribe via a light rAF-driven state throttle or an IntersectionObserver per chapter section — do NOT setState every frame), click → `scrollToChapter(i)`; hidden ≤sm or moved to a slim bottom strip.

- [ ] **Step 2: `copy-panel.tsx`** — for each chapter: eyebrow+headline+body (Apple grammar), positioned alternating left/right on desktop, bottom-sheet ≤md; opacity driven by `curve(p, ch.p0, ch.p1-ch.p0)` read from the progress ref via rAF (ref-driven style, not React state). Bilingual copy from `CHAPTERS`.

- [ ] **Step 3: Verify + commit** — `build`+`lint`.
```bash
git add components/explorer/scrolly/chapter-rail.tsx components/explorer/scrolly/copy-panel.tsx
git commit -m "feat(explorer): chapter rail + scroll copy panels"
```

---

### Task 5: `/` page integration + CTA outro + explore handoff + reduced-motion

**Files:** Modify `app/page.tsx`; Create `components/explorer/scrolly/scrolly-home.tsx` (client orchestrator)

- [ ] **Step 1: `scrolly-home.tsx`** (`'use client'`) — the ~900vh wrapper: a scroll spacer (`height: 800vh` etc.) + the pinned `<ScrollyStage>` + `<CopyPanels>` + `<ChapterRail>` + a ch7 CTA row (圖譜 `/supply-chain`, 行情 `/market`, 自由探索). `自由探索` (and a persistent toggle) → `handoff`: swap to `<SiliconStackExplorer>` (explore mode) mounted over the same viewport (or call the stage's `setMode('explore')` and reveal explorer chrome) — no reload. `prefers-reduced-motion` → render stepped chapters (static poses via discrete `p`, prev/next buttons), no pin/scrub.

- [ ] **Step 2: `app/page.tsx`** — keep it a server component; render the site chrome slots (Brand/LocaleToggle/NavLinks/Badge as today) + `<ScrollyHome locale copy … />`. Deep link: honor `/#ch-N` on load (scroll to that chapter). Keep the `<Metadata>`.

- [ ] **Step 3: Verify + commit** — `pnpm test`+`build`+`lint`; `pnpm dev` → `/` scrubs; 自由探索 hands off to the orbit explorer.
```bash
git add app/page.tsx components/explorer/scrolly/scrolly-home.tsx
git commit -m "feat(home): scroll-disassembly hero on / with explore handoff"
```

---

### Task 6: Acceptance — scrub, drift, deep-link, reduced-motion, handoff

**Files:** none (verification; browser smoke).

- [ ] **Step 1: Gates** — `pnpm test` (data+parts+timeline), `pnpm build`, `pnpm lint` green.

- [ ] **Step 2: Browser smoke** (Playwright/Chrome MCP; `PORT=3135 pnpm dev`):
  - Scrub the page 0→bottom: parts visibly separate per chapter, camera moves through levels, copy panels fade in/out, no console errors.
  - **Bidirectional zero-drift:** scroll to bottom (p→1) then back to ~30% — the scene state matches a fresh load scrolled to 30% (poses are p-pure; confirm no stuck/exploded parts).
  - Deep link `/#ch-5` lands on the package chapter.
  - `自由探索` CTA → orbit explorer takes over on the same scene (no reload); goLevel/hotspots work.
  - `prefers-reduced-motion` (emulate) → stepped chapters + prev/next, no pinning.
  - Stop dev.

- [ ] **Step 3: Commit any acceptance fixes**
```bash
git add -A && git commit -m "chore(home): Phase C acceptance — scrub/drift/deep-link/reduced-motion/handoff"
```

## Self-Review

- **Spec coverage:** GSAP-progress-only + pure evaluate (D-002) = Task 1; scene scrolly mode driving registry+camera = Task 2; scrub hook + pinned stage = Task 3; rail + copy = Task 4; ~900vh page + CTA + handoff + reduced-motion (storyboard rules) = Task 5; scrub/drift/deep-link/reduced-motion/handoff acceptance = Task 6. `check:timeline` encodes the zero-drift gate.
- **Placeholder scan:** scroll-math, evaluate skeleton, check-timeline, and the timeline/registry contracts are fully specified; the TIMELINE choreography values + the DOM/island wiring are authored by the implementer against the concrete storyboard + current files (first-pass, tunable).
- **Risk:** (1) never setState per frame — copy/rail read the progress ref via rAF, flagged in Tasks 3–4. (2) explore-mode regression — Task 2 keeps `mode` defaulting to 'explore' and resets parts on handoff; Task 6 verifies. (3) exact cinematic polish is out of scope (documented) — the gate is "visibly correct + drift-free", not pixel-final.

## Execution Handoff

Dynamic-workflow / subagent-driven, Task 1 first (pure engine + gate). Cinematic pose tuning is a follow-up after this lands and can be seen on a Vercel preview.
