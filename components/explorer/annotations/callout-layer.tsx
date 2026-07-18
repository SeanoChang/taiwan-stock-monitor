'use client';

// Depth-gated callout layer — projects hardware cards onto disassembling
// parts, live over the scroll-disassembly stage (Plan 006 Phase D, Task 4).
// Wires together:
//   - lib/data/hardware-map.ts's HARDWARE_PARTS (Task 1) — which registered
//     part maps to which card, and in which CHAPTERS window it's a candidate;
//   - the scene's projectPart() (Task 2, lib/scene/silicon-stack-scene.ts) —
//     world→screen projection + throttled occlusion for an arbitrary anchor;
//   - <HardwareCard> (Task 3) — the card itself, purely presentational and
//     position-agnostic (it never touches its own placement).
//
// Two very different update cadences live in this one component, mirroring
// chapter-rail.tsx (chapter index) / copy-panel.tsx (per-frame style writes):
//
//   1. WHICH parts are candidates — the active CHAPTERS entry — changes only
//      a handful of times across the whole ~900vh scroll. This is the one
//      thing this component ever calls `setState` for: mounting/unmounting
//      <HardwareCard>s as that candidate set changes (keyed by part id, so a
//      part that stays active across a chapter boundary is never remounted).
//
//   2. WHERE each candidate's card sits, its leader line, and its opacity —
//      recomputed every animation frame from `progressRef` + `projectPart()`.
//      Exactly copy-panel.tsx's rule: this is written straight to each
//      element's own style/attributes from a ref-driven rAF loop, never
//      through React state, so scrubbing back and forth can never drift or
//      pile up renders. See docs/superpowers/apple-redesign/
//      03-component-annotations/research-3d-labeling-and-occlusion.md for the
//      slot-layout + occlusion-fade rules this loop implements.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { HARDWARE_PARTS } from '@/lib/data/hardware-map';
import type { HardwarePart } from '@/lib/data/hardware-map';
import { CHAPTERS } from '@/lib/scene/disassembly-timeline';
import { curve } from '@/lib/scene/scroll-math';
import type { SceneApi } from '@/lib/scene/silicon-stack-scene';
import type { PartId } from '@/lib/scene/types';
import { HardwareCard } from '@/components/explorer/annotations/hardware-card';
import type { Locale } from '@/lib/i18n/config';
import type { ClientQuotesPayload } from '@/lib/quotes-client';

export interface CalloutLayerProps {
  api: SceneApi;
  /** p ∈ [0,1]; written by useScrollProgress's GSAP/rAF source, read here via
   * this component's own rAF loop (never passed through as React state) —
   * same contract as copy-panel.tsx / chapter-rail.tsx. */
  progressRef: RefObject<number>;
  locale: Locale;
  /** Shared with every other quote-consuming island — see hardware-card.tsx's
   * module doc for why this is passed in rather than fetched per card. */
  quotes: ClientQuotesPayload | null;
}

const DESKTOP_CAP = 5;
const MOBILE_CAP = 2;
// Tailwind's `sm` breakpoint — same desktop/mobile split chapter-rail.tsx's
// `sm:flex`/`sm:hidden` pair uses.
const DESKTOP_QUERY = '(min-width: 640px)';

const MARGIN_X = 28; // column inset from its screen edge
const MARGIN_TOP = 96; // clear of ScrollyStage's 自由探索 button / header chrome
const MARGIN_BOTTOM = 96; // clear of the reduced-motion chapter strip / chapter-rail
const GAP_Y = 14; // vertical gap enforced between stacked cards in a column
const VISIBLE_OPACITY_THRESHOLD = 0.03; // matches copy-panel.tsx's own cutoff
// Used only until a card's real size is measured (first frame after mount) —
// close to HardwareCard's `w-64` (256px) collapsed (no "更多" expansion) height.
const FALLBACK_SIZE = { w: 256, h: 112 };

// copy-panel.tsx's chapter-copy overlay shares this same `fixed inset-0`
// screen space during the same active chapter's window (its panel is
// `md:top-1/2 -translate-y-1/2`, up to `min(400px,36vw)` wide, on the same
// edge this component's own `chapterId % 2` parity would put it, per
// copy-panel.tsx's `alignRight = i % 2 === 1`). Two coordinations keep the
// two overlays from fighting once a future task co-mounts both: hardware
// cards paint at a strictly higher z-index than copy's `z-[8]` (deterministic
// paint order, not an accidental DOM-order tie), and the column on
// `copyPanelSide` (below) steers its own cards' vertical slots around this
// approximate band rather than stacking through it. The band is a viewport-
// height fraction, not a fixed px count, since the real panel's height is
// content-driven.
const COPY_PANEL_BAND = { top: 0.32, bottom: 0.68 };

/** The CHAPTERS entry whose [p0,p1) window contains p — duplicated (not
 * exported), same as chapter-rail.tsx's and scrolly-stage.tsx's own copies of
 * this arithmetic: a few lines over the shared table, not worth sharing. */
function chapterIndexFor(p: number): number {
  const clamped = p < 0 ? 0 : p > 1 ? 1 : p;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (clamped >= CHAPTERS[i].p0) return i;
  }
  return 0;
}

/** HARDWARE_PARTS active in chapter `chapterId` (inclusive `chapters` range),
 * capped to `cap` by priority (highest first). Pure and deterministic —
 * called only when the active chapter id or the density cap changes, never
 * per frame. */
function activePartsFor(chapterId: number, cap: number): HardwarePart[] {
  return HARDWARE_PARTS.filter((p) => chapterId >= p.chapters[0] && chapterId <= p.chapters[1])
    .sort((a, b) => b.priority - a.priority)
    .slice(0, cap);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Side = 'left' | 'right';
interface Candidate {
  part: HardwarePart;
  x: number;
  y: number;
  occluded: boolean;
  size: { w: number; h: number };
}

// Per-candidate leader-line/card slots, each its own component rather than
// an inline `.map()` closure. React detaches/reattaches a callback `ref`
// whenever the *function identity* passed to it changes between renders of
// the same fiber — even when the underlying DOM node (matched by
// `key={part.id}` where these are rendered) never actually remounts. A
// `(el) => setLineEl(id, el)` / `(el) => setCardEl(id, el)` arrow built
// inline inside CalloutLayer's own `.map()` would be a fresh closure on
// every one of CalloutLayer's re-renders — every chapter transition, every
// desktop/mobile breakpoint crossing, every useQuotes() TTL refresh (a new
// `quotes` object each cycle) — tearing down and rebuilding every currently-
// mounted card's ResizeObserver each time and dropping its measured size
// back to FALLBACK_SIZE until the observer's next (async) callback fires,
// even though the card never left the DOM. Hoisting each ref callback into
// its own component lets `useCallback` do the memoizing instead: for a
// `part.id` that persists across a CalloutLayer re-render, React reuses this
// *same* component instance (by `key`), so `id` and `setLineEl`/`setCardEl`
// (themselves already `[]`-stable) are unchanged deps and `useCallback`
// returns the identical closure — no detach/reattach, no ResizeObserver
// churn. (This also sidesteps ever reading a ref's `.current` during
// render, which plain per-id memoization via a `useRef`-backed cache would
// require.)
function LeaderLineSlot({
  id,
  setLineEl,
}: {
  id: PartId;
  setLineEl: (id: PartId, el: SVGLineElement | null) => void;
}) {
  const ref = useCallback((el: SVGLineElement | null) => setLineEl(id, el), [id, setLineEl]);
  return (
    <line
      ref={ref}
      className="invisible opacity-0"
      stroke="var(--foreground)"
      strokeOpacity={0.32}
      strokeWidth={1}
    />
  );
}

function HardwareCardSlot({
  id,
  setCardEl,
  children,
}: {
  id: PartId;
  setCardEl: (id: PartId, el: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  const ref = useCallback((el: HTMLDivElement | null) => setCardEl(id, el), [id, setCardEl]);
  return (
    <div
      ref={ref}
      className="pointer-events-auto invisible absolute top-0 left-0 opacity-0"
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </div>
  );
}

export function CalloutLayer({ api, progressRef, locale, quotes }: CalloutLayerProps) {
  const [desktop, setDesktop] = useState(true);
  const [chapterId, setChapterId] = useState(0);
  const lastChapter = useRef(0);

  // Reactive desktop/mobile density cap — same matchMedia pattern as
  // use-scroll-progress.ts's prefers-reduced-motion listener.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesktop(mq.matches);
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Active-chapter tracking: read progressRef every frame via its own rAF
  // loop, but only ever setState when the resolved chapter id changes — the
  // same "light rAF-driven state throttle" chapter-rail.tsx uses (a handful
  // of transitions across the whole scroll, never once per frame).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const idx = chapterIndexFor(progressRef.current);
      if (idx !== lastChapter.current) {
        lastChapter.current = idx;
        setChapterId(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  const cap = desktop ? DESKTOP_CAP : MOBILE_CAP;
  // Only recomputed — and only mounts/unmounts <HardwareCard>s — when the
  // active chapter or density cap changes. This is the "active-chapter-set
  // change" the brief allows React state for; the per-frame layout effect
  // below never touches it. Parts that stay active across a chapter boundary
  // keep the same `part.id` key below, so React doesn't remount them.
  const parts = useMemo(() => activePartsFor(chapterId, cap), [chapterId, cap]);
  const chapter = CHAPTERS[chapterId];
  // Mirrors copy-panel.tsx's own `alignRight = i % 2 === 1`, using this
  // component's own resolved chapter index — the edge a co-mounted copy
  // panel would render on for the currently active chapter, so the layout
  // loop below knows which column to steer around COPY_PANEL_BAND.
  const copyPanelSide: Side = chapterId % 2 === 1 ? 'right' : 'left';

  // Per-part DOM refs + measured sizes, keyed by PartId. Plain mutable state
  // (never React state) — populated/cleared as cards mount/unmount via the
  // callback refs below, read every frame by the layout effect.
  const cardEls = useRef(new Map<PartId, HTMLDivElement>());
  const lineEls = useRef(new Map<PartId, SVGLineElement>());
  const sizes = useRef(new Map<PartId, { w: number; h: number }>());
  const resizeObservers = useRef(new Map<PartId, ResizeObserver>());

  // A card's on-screen size only changes when its content does (mount, or
  // the user toggling "更多"/"收合") — not every frame — so it's measured via
  // ResizeObserver rather than a `getBoundingClientRect()` read inside the
  // rAF loop, which would force a synchronous layout every frame for no
  // benefit.
  const setCardEl = useCallback((id: PartId, el: HTMLDivElement | null) => {
    resizeObservers.current.get(id)?.disconnect();
    resizeObservers.current.delete(id);
    if (el) {
      cardEls.current.set(id, el);
      const ro = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (rect) sizes.current.set(id, { w: rect.width, h: rect.height });
      });
      ro.observe(el);
      resizeObservers.current.set(id, ro);
    } else {
      cardEls.current.delete(id);
      sizes.current.delete(id);
    }
  }, []);

  const setLineEl = useCallback((id: PartId, el: SVGLineElement | null) => {
    if (el) lineEls.current.set(id, el);
    else lineEls.current.delete(id);
  }, []);

  // The per-frame layout loop: projects every current candidate, splits into
  // left/right columns by projected x, stacks each column top-to-bottom by
  // projected y with a fixed minimum gap (so cards can never overlap), and
  // writes position/opacity straight to each card's `style` and each leader
  // line's endpoint attributes. Restarts only when the candidate set changes
  // (parts/chapter) or the scene api/progress source changes — never
  // recreated per frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = progressRef.current;
      const fade = curve(p, chapter.p0, chapter.p1 - chapter.p0);
      const W = window.innerWidth;
      const H = window.innerHeight;

      const left: Candidate[] = [];
      const right: Candidate[] = [];

      for (const part of parts) {
        const proj = api.projectPart(part.id, part.anchor);
        const cardEl = cardEls.current.get(part.id);
        const lineEl = lineEls.current.get(part.id);
        // Off-scene (part not registered/visible) or fully off-screen: hide
        // outright rather than trying to place it — it isn't a candidate for
        // this frame's slot layout at all.
        if (!proj || !proj.onScreen) {
          if (cardEl) {
            cardEl.style.opacity = '0';
            cardEl.style.visibility = 'hidden';
          }
          if (lineEl) {
            lineEl.style.opacity = '0';
            lineEl.style.visibility = 'hidden';
          }
          continue;
        }
        const size = sizes.current.get(part.id) ?? FALLBACK_SIZE;
        (proj.x < W / 2 ? left : right).push({
          part,
          x: proj.x,
          y: proj.y,
          occluded: proj.occluded,
          size,
        });
      }

      const layoutColumn = (entries: Candidate[], side: Side) => {
        entries.sort((a, b) => a.y - b.y);
        // Only the column on copy-panel.tsx's own current-chapter side needs
        // to dodge its footprint — the opposite column never has a visible
        // copy panel to collide with (see COPY_PANEL_BAND above).
        const avoidBand = side === copyPanelSide;
        const bandTop = H * COPY_PANEL_BAND.top;
        const bandBottom = H * COPY_PANEL_BAND.bottom;
        let cursor = MARGIN_TOP;
        for (const entry of entries) {
          let top = entry.y - entry.size.h / 2;
          if (top < cursor) top = cursor;
          top = clamp(top, MARGIN_TOP, H - MARGIN_BOTTOM - entry.size.h);
          // The clamp above can pull `top` back above `cursor` when the
          // column has run out of vertical room — re-pin to `cursor` so
          // slots still never overlap, at the cost of overflowing past
          // MARGIN_BOTTOM in that (rare, ≤5-card) edge case.
          if (top < cursor) top = cursor;
          if (avoidBand && top < bandBottom && top + entry.size.h > bandTop) {
            // This slot would land inside copy-panel.tsx's active-chapter
            // text footprint on this side — push it below the band first
            // (this column's natural top-to-bottom stacking order), falling
            // back above the band only when there's no room below. If
            // neither fits, leave `top` as computed: the same accepted
            // overlap trade-off as the cursor-overflow case above.
            const below = clamp(Math.max(top, bandBottom), cursor, H - MARGIN_BOTTOM - entry.size.h);
            if (below >= bandBottom) {
              top = below;
            } else {
              const above = bandTop - entry.size.h;
              if (above >= cursor) top = above;
            }
          }
          cursor = top + entry.size.h + GAP_Y;

          const cardEl = cardEls.current.get(entry.part.id);
          const lineEl = lineEls.current.get(entry.part.id);
          const cardX = side === 'left' ? MARGIN_X : W - MARGIN_X - entry.size.w;
          const opacity = fade * (entry.occluded ? 0.25 : 1);
          const visible = opacity > VISIBLE_OPACITY_THRESHOLD;

          if (cardEl) {
            cardEl.style.opacity = opacity.toFixed(3);
            cardEl.style.visibility = visible ? 'visible' : 'hidden';
            cardEl.style.transform = `translate3d(${cardX.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
          }
          if (lineEl) {
            const edgeX = side === 'left' ? cardX + entry.size.w : cardX;
            const edgeY = top + entry.size.h / 2;
            lineEl.setAttribute('x1', entry.x.toFixed(1));
            lineEl.setAttribute('y1', entry.y.toFixed(1));
            lineEl.setAttribute('x2', edgeX.toFixed(1));
            lineEl.setAttribute('y2', edgeY.toFixed(1));
            lineEl.style.opacity = opacity.toFixed(3);
            lineEl.style.visibility = visible ? 'visible' : 'hidden';
          }
        }
      };

      layoutColumn(left, 'left');
      layoutColumn(right, 'right');

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [api, progressRef, parts, chapter, copyPanelSide]);

  return (
    <>
      {/* Leader lines — full-viewport SVG overlay, never intercepts input.
       * One <line> per current candidate; endpoints are written every frame
       * by the layout effect above via setAttribute, never React state. */}
      <svg
        className="pointer-events-none fixed inset-0 z-[7] h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        {parts.map((part) => (
          <LeaderLineSlot key={part.id} id={part.id} setLineEl={setLineEl} />
        ))}
      </svg>

      {/* Hardware cards — one per current candidate. Mount/unmount only when
       * `parts` changes identity (chapter or density-cap change); position,
       * opacity and visibility are all owned by the layout effect above.
       * z-[9] — strictly above copy-panel.tsx's chapter-copy overlay
       * (z-[8]), which shares this same fixed-inset-0 space: interactive,
       * pointer-events-auto cards should reliably paint over static copy
       * text rather than relying on DOM/mount order at an equal z-index.
       * See COPY_PANEL_BAND above for the complementary spatial nudge. */}
      <div className="pointer-events-none fixed inset-0 z-[9]">
        {parts.map((part) => (
          <HardwareCardSlot key={part.id} id={part.id} setCardEl={setCardEl}>
            <HardwareCard part={part} quotes={quotes} locale={locale} />
          </HardwareCardSlot>
        ))}
      </div>
    </>
  );
}
