# Design — Responsive: mobile + iPad (cross-cutting)

- **Date:** 2026-07-18
- **Status:** Ready for Claude Code execution
- **Applies to:** every phase of `plans/006-*` and every existing route
  (`/`, `/supply-chain`, `/market`) + the new tree route. **Not a phase — a
  constraint on all of them.** Responsive is designed in from the first commit of
  each surface, never retrofitted.
- **Why its own doc:** this app is unusually hostile to naïve responsive — it
  leans on **hover**, **scroll-scrub 3D**, and **pan/zoom canvas**, none of which
  translate to touch for free. The rules below are the translation.

## 1. Device targets & breakpoints

Support floor: **iPhone SE (375 × 667 CSS px)**. No horizontal scroll anywhere
above 320px.

| Tier | Width (CSS px) | Representative devices | Input |
|------|----------------|------------------------|-------|
| `phone` | < 768 | iPhone SE → 15 Pro Max, small Android | coarse touch, **no hover** |
| `tablet` | 768 – 1023 | iPad mini/Air/Pro **portrait** (768/834), split-view panes | coarse touch (+ Pencil/trackpad = fine) |
| `desktop` | ≥ 1024 | iPad **landscape** (1024/1194/1366), laptops, desktops | fine pointer + hover (iPad landscape still touch) |

- Align tokens with Tailwind defaults: `sm 640 / md 768 / lg 1024 / xl 1280`.
  Semantic tiers above map to `<md` / `md..<lg` / `≥lg`.
- **iPad is not "desktop that's narrow."** It is **touch-first at every width**,
  and it can be **any width** (Split View / Slide Over / Stage Manager). ⇒ never
  gate behavior on viewport width alone; combine with input media queries (§2) and
  **container queries** for islands that can be resized independently (§8).
- Viewport units: use **`dvh`/`svh`/`lvh`**, never bare `vh` (iOS URL bar). Sticky
  scrolly stage height = `100svh`. Honor `env(safe-area-inset-*)` (notch/home bar).

## 2. Input model (the core rule)

Drive behavior off **capability**, not width:

```css
@media (hover: hover) and (pointer: fine)  { /* desktop-like: hover affordances */ }
@media (hover: none)                       { /* touch: tap/long-press equivalents */ }
@media (pointer: coarse)                   { /* enlarge hit targets to ≥44px */ }
```

- **Every hover interaction MUST have a tap equivalent.** No feature may be
  reachable by hover only (iPad + phone would lose it).
- Hit targets **≥ 44 × 44 px** on coarse pointers (Apple HIG). Larger padding, not
  larger glyphs.
- Kill the 300ms tap delay (`touch-action: manipulation`); set explicit
  `touch-action` on scrubbed/panned surfaces so the browser doesn't steal the gesture.
- Prevent pull-to-refresh / overscroll from hijacking the scrollytelling and the
  canvas (`overscroll-behavior: contain` on the relevant containers).

## 3. Per-surface adaptation

### `/` Scroll disassembly (Phase C)
- Sticky stage is full-bleed at every tier; height `100svh`.
- **Chapter copy:** desktop = side rail; **phone = bottom sheet** (~40% height,
  above safe-area) synced to the active chapter; **iPad portrait = bottom or
  narrow side depending on orientation** (container query, not width).
- **Scrub input:** GSAP ScrollTrigger already uses real scroll → works with touch
  momentum. Verify: no jank on fling; `scrub` catch-up still feels right; tab-hidden
  pause; `prefers-reduced-motion` → stepped chapters (no continuous scrub).
- **Rendering** is tier-gated — see §4.

### Hardware callout cards (Phase D)
- Desktop: anchored callouts projected onto the 3D part.
- **Phone: do NOT render tiny anchored labels over a small canvas.** Replace with a
  **swipeable bottom-sheet carousel** of the current chapter's parts; tapping a
  part hotspot opens/advances the sheet; the 3D highlights the selected part.
- iPad: anchored callouts allowed in landscape; sheet in portrait if density is high.
- Cards show live quote (reuse `useQuotes()` + `normalizeCode`), TW-listed first;
  full-width, thumb-reachable on phone.

### Supplier-branch overlay (Phase E)
- Hover → **tap-to-pin** on touch: tap a part/card pins its ego-network overlay;
  tap backdrop dismisses. Long-press = peek (optional).
- Radial overlay sized to viewport (never wider than `100vw − insets`); on phone it
  becomes a scrollable list-with-tiers if the radial can't fit legibly.

### Multi-axis tree route (Phase G)
- **Axis switcher** chip row → horizontally scrollable / segmented on phone; keep
  all 6 axes reachable (no hidden-behind-hover).
- **Breadcrumb** → truncate the middle (`rack › … › substrate`) on narrow widths;
  full trail in the mini-map.
- **Mini-map drawer:** desktop = side drawer; **phone = full-screen sheet**
  toggled by a button; iPad = side drawer in landscape, sheet in portrait.
- **Node info panel:** desktop = side panel; **phone = bottom sheet**; iPad = side
  panel (landscape) / sheet (portrait). Hash routing unchanged across tiers.
- Containment 3D uses the same tier gating as `/`.

### `/supply-chain` force graph
- Touch gestures: **one-finger pan, pinch-zoom, tap-to-select** (replace hover
  tooltip with tap → node panel). Enlarge node hit radius on coarse pointers.
- Reduce label density and disable expensive gl/glow on low tier (§4).
- Provide a "fit graph" / reset-view button (no scroll-wheel on touch).

### `/market` board
- Table → on phone, either **card rows** (code · name · price · %chg · vol) or a
  horizontally scrollable table with a **sticky first column** (code+name). Pick
  card rows for readability.
- Toolbar (search + sort) wraps; sort becomes a segmented control / native select.
- Keep 紅漲綠跌 (zh) / western (en) coloring at all tiers.

### Chrome / nav (Phase A)
- Header condenses on phone; nav links + locale toggle collapse into a menu
  (sheet or dropdown). Brand shrinks. Respect top safe-area.

## 4. Performance tiers (the make-or-break for 3D on phones)

A `useDeviceTier()` hook resolves **`high | mid | low`** from a capability probe at
mount — `navigator.deviceMemory`, `hardwareConcurrency`, `devicePixelRatio`, a one-
frame GPU timing sample, plus `prefers-reduced-motion` and `navigator.connection.saveData`.

| Tier | Typical | DPR cap | Post-processing | 3D disassembly |
|------|---------|---------|-----------------|----------------|
| high | desktop, iPad Pro/Air, iPhone 15 Pro | 2.0 | on (HDRI + n8ao + subtle bloom) | full real-time |
| mid | most phones, iPad mini, split-view | 1.5 | reduced (env only, no AO) | real-time, fewer parts animated at once |
| low | old/low-mem phones, saveData, reduced-motion | 1.0 | off | **fallback: stepped chapter cards (or optional pre-rendered flipbook)** |

- A frame-rate **governor** watches rolling FPS and drops a tier (or DPR) if it
  can't hold **60fps desktop / iPad, 30fps phone**.
- Pause the render loop when the tab/section is hidden (`IntersectionObserver` +
  `visibilitychange`) — critical for battery/thermals on mobile.
- **Decision (recommended, confirm before Phase F):** phones get **capability-tiered
  real-time 3D with an automatic non-3D fallback** on `low` — *not* a mandatory
  pre-rendered flipbook for all phones. Rationale: keeps hover→branch and part
  interactivity (D-001) on capable phones; the flipbook stays the optional `low`
  fallback only. Alternative if you'd rather guarantee smoothness everywhere:
  phones always get the lightweight stepped-card scrolly (no canvas) — cheaper, but
  loses the 3D "wow" on mobile. **Flag which you want; the spec assumes the tiered
  approach.**

## 5. iPad specifics
- **Orientation:** design portrait AND landscape; layout switches on orientation +
  container width, not a fixed breakpoint. iPad Pro 12.9 landscape (1366) is
  desktop-class; iPad mini portrait (768) is tablet.
- **Split View / Slide Over / Stage Manager:** an island can be handed **any**
  width mid-session → use **container queries** on islands (stage, panels, cards,
  toolbar), so a component in a 350px Slide Over pane lays out like phone even
  though the device is an iPad.
- **Mixed input:** iPad has coarse touch *and* can have a trackpad/Pencil (fine
  pointer) simultaneously — support both; never disable touch because a pointer is
  present.

## 6. Implementation approach
- Tailwind responsive prefixes for layout + **container queries** (`@container`)
  for resizable islands; `@media (hover)/(pointer)` for input affordances.
- `lib/hooks/use-device-tier.ts` (capability probe + governor) and
  `lib/hooks/use-pointer.ts` (`hover`/`coarse` flags) as shared primitives.
- CSS `dvh/svh/lvh` + `env(safe-area-inset-*)` throughout sticky/fixed elements.
- Keep everything **server-shell + client-island**; the tier/pointer hooks live in
  islands only (they need `window`), with an SSR-safe default (assume `high`
  desktop, hydrate to actual).
- **Next 16.2.10:** read `node_modules/next/dist/docs/` before touching routes
  (AGENTS.md) — same constraint as plan 006.

## 7. Acceptance / test matrix
Every route × these viewports × both locales (zh default, en):

- **Phones:** iPhone SE 375, iPhone 15 390, 15 Pro Max 430, a 360 Android.
- **iPad:** mini/Air portrait 768/834, landscape 1024/1194, Pro 12.9 1366, **one
  Split-View pane ~500px**.
- **Desktop:** 1280, 1440.

Pass conditions:
1. **No horizontal overflow** at any width ≥ 320px.
2. **Every interaction reachable by touch** (no hover-only path); hit targets ≥44px.
3. **60fps** desktop/iPad, **30fps** phone on the disassembly scrub; governor
   demotes gracefully; `low` tier shows the non-3D fallback, not a frozen canvas.
4. Sheets/drawers respect safe-area; no content under the notch/home bar.
5. `/market` readable without pinch; `/supply-chain` pan/zoom/tap works; tree
   axis-switch/breadcrumb/mini-map/panel all usable one-handed on phone.
6. **Lighthouse mobile** perf ≥ 80 on `/` (throttled); reduced-motion honored.
7. Before/after screenshots: **×3 routes × 2 locales × {phone, iPad-portrait,
   iPad-landscape, desktop}**.

## 8. Ties into plan 006
`plans/006-*` gets a cross-cutting responsive clause + a per-phase responsive
gate: A restyles chrome responsively; B/C bring the tier hook + touch scrub + copy
bottom-sheet; D brings the callout→carousel swap; E brings tap-to-pin; G brings the
drawer/sheet nav. No phase is "done" until it passes the matrix above at its tier.
