'use client';

// Mobile (<sm) presentation for the depth-gated hardware callouts (Plan 006
// Phase D, Task 5). CalloutLayer (Task 4) anchors full HardwareCards +
// leader lines to each active part — great on desktop, but a 256px card
// pinned to a projected 3D anchor doesn't fit a phone viewport. Per the
// design doc (docs/superpowers/apple-redesign/03-component-annotations/
// design-hardware-cards-and-callout-density.md): "Mobile: numbered dots +
// bottom drawer listing the chapter's components." Positioned below the
// header rather than at the viewport's bottom edge — see the drawer JSX's
// own comment below for why (a live collision with copy-panel.tsx's own
// mobile bottom sheet, found during this task's browser-smoke verification).
//
// scrolly-stage.tsx mounts BOTH CalloutLayer and CalloutDrawer, permanently,
// and lets Tailwind's `sm:` breakpoint toggle which one is visible via a
// `display:none` ancestor (same technique chapter-rail.tsx already uses for
// its own desktop-rail/mobile-strip pair) — neither component needs to know
// about the other, and `display:none` on an ancestor drops a `position:
// fixed` subtree from rendering entirely, so the hidden one costs nothing
// visually or interactively.
//
// Same two-cadence split as CalloutLayer:
//   1. active-chapter tracking — polled every rAF frame off `progressRef`,
//      but setState only on an actual chapter-index change (a handful of
//      transitions across the whole scroll, the sanctioned "light rAF-driven
//      state throttle" chapter-rail.tsx/callout-layer.tsx already use).
//   2. per-frame dot position/opacity — written straight to each dot's
//      `el.style.*` from its own ref-driven rAF loop, never React state.
// The drawer list itself (name/top-company/quote rows) only re-renders when
// the active-chapter part set changes (step 1), never per frame.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import Link from 'next/link';
import { HARDWARE_PARTS, companiesForPart } from '@/lib/data/hardware-map';
import type { HardwarePart } from '@/lib/data/hardware-map';
import { CHAPTERS } from '@/lib/scene/disassembly-timeline';
import { curve } from '@/lib/scene/scroll-math';
import type { SceneApi } from '@/lib/scene/silicon-stack-scene';
import type { PartId } from '@/lib/scene/types';
import { l, pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { fmtPct } from '@/lib/format';
import type { ClientQuotesPayload } from '@/lib/quotes-client';
import { normalizeCode, upDownColor } from '@/lib/quotes-client';

export interface CalloutDrawerProps {
  api: SceneApi;
  /** p ∈ [0,1]; ref-driven, read here via this component's own rAF loop —
   * same contract as CalloutLayer/ChapterRail/CopyPanels. */
  progressRef: RefObject<number>;
  locale: Locale;
  quotes: ClientQuotesPayload | null;
}

// This component IS the mobile presentation, so its own density cap is fixed
// — matches CalloutLayer's own `MOBILE_CAP`, kept as a literal here rather
// than imported since CalloutLayer doesn't export it (each file's density
// constant is its own presentational choice, per that file's own doc note
// about `chapterIndexFor` not being shared either).
const MOBILE_CAP = 2;
const VISIBLE_OPACITY_THRESHOLD = 0.03;
const DRAWER_LABEL = l('Components in view', '目前顯示的零件');

/** The CHAPTERS entry whose [p0,p1) window contains p — duplicated, same
 * precedent as chapter-rail.tsx / scrolly-stage.tsx / callout-layer.tsx's own
 * copies of this arithmetic. */
function chapterIndexFor(p: number): number {
  const clamped = p < 0 ? 0 : p > 1 ? 1 : p;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (clamped >= CHAPTERS[i].p0) return i;
  }
  return 0;
}

/** HARDWARE_PARTS active in chapter `chapterId`, capped to MOBILE_CAP by
 * priority — pure, same rule as callout-layer.tsx's `activePartsFor` (its
 * own copy; not shared for the same reason). */
function activePartsFor(chapterId: number): HardwarePart[] {
  return HARDWARE_PARTS.filter((p) => chapterId >= p.chapters[0] && chapterId <= p.chapters[1])
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MOBILE_CAP);
}

// Hoisted per-dot component so its callback ref keeps a stable identity
// across CalloutDrawer re-renders — the same pattern callout-layer.tsx's
// LeaderLineSlot/HardwareCardSlot establish: an inline `(el) =>
// setDotEl(id, el)` built fresh inside a `.map()` would be a new function
// identity every render, forcing React to detach/reattach the ref on every
// re-render of a part that never actually left the DOM. A dot has no
// ResizeObserver to drop (unlike those two, so there's no measurable bug
// here today), but keeping the same hoisted-component shape avoids
// reintroducing that class of bug if this component ever grows one.
function Dot({
  id,
  index,
  setDotEl,
}: {
  id: PartId;
  index: number;
  setDotEl: (id: PartId, el: HTMLDivElement | null) => void;
}) {
  const ref = useCallback((el: HTMLDivElement | null) => setDotEl(id, el), [id, setDotEl]);
  return (
    <div
      ref={ref}
      aria-hidden
      className="ss-veil ss-hairline invisible absolute top-0 left-0 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[11px] font-bold opacity-0"
      style={{ willChange: 'transform, opacity' }}
    >
      {index + 1}
    </div>
  );
}

/** One drawer row: numbered index (matches its on-screen dot), part name,
 * top-ranked supplier via `companiesForPart()`, and — for TW-listed
 * companies once a quote is available — `NT$close ±%` colored 紅漲綠跌 via
 * `upDownColor`. Blank-graceful, same as hardware-card.tsx's CompanyChip.
 * Deep-links to the same `/supply-chain?focus=<companyId>` node. */
function DrawerRow({
  part,
  index,
  quotes,
  locale,
}: {
  part: HardwarePart;
  index: number;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
}) {
  const top = companiesForPart(part)[0];
  const isTW = top && (top.exch === 'TWSE' || top.exch === 'TPEx');
  const quote = top && isTW ? quotes?.quotes[normalizeCode(top.ticker)] : undefined;
  const companyName = top && (locale === 'zh' ? (top.zh ?? top.name) : top.name);

  return (
    <li>
      <Link
        href={top ? `/supply-chain?focus=${top.id}` : '/supply-chain'}
        className="hover:bg-accent flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-md)] px-1.5 py-1 transition-colors"
      >
        <span className="bg-secondary flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
          {pick(part.name, locale)}
        </span>
        {companyName && (
          <span className="text-tertiary hidden shrink-0 truncate text-[11px] min-[420px]:inline">
            {companyName}
          </span>
        )}
        {quote ? (
          <span className="flex shrink-0 items-baseline gap-1 text-[11px] tabular-nums">
            <span className="font-semibold">NT${quote.close.toLocaleString()}</span>
            <span className="font-semibold" style={{ color: upDownColor(quote.change, locale) }}>
              {fmtPct(quote.changePct)}
            </span>
          </span>
        ) : (
          <span className="text-tertiary shrink-0 text-[10px]">—</span>
        )}
      </Link>
    </li>
  );
}

export function CalloutDrawer({ api, progressRef, locale, quotes }: CalloutDrawerProps) {
  const [chapterId, setChapterId] = useState(0);
  const lastChapter = useRef(0);

  // Active-chapter tracking: identical rule to callout-layer.tsx's own
  // effect — poll every frame, setState only on an actual index change.
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

  // Only recomputed — and only re-renders the drawer list / mounts-unmounts
  // dots — when the active chapter changes. This is the "active-chapter-set
  // change" React state is allowed for; the per-frame dot-position effect
  // below never touches it.
  const parts = useMemo(() => activePartsFor(chapterId), [chapterId]);
  const chapter = CHAPTERS[chapterId];

  const dotEls = useRef(new Map<PartId, HTMLDivElement>());
  const setDotEl = useCallback((id: PartId, el: HTMLDivElement | null) => {
    if (el) dotEls.current.set(id, el);
    else dotEls.current.delete(id);
  }, []);

  // Per-frame dot placement + fade — never setState, exactly copy-panel.tsx
  // / callout-layer.tsx's rule. Restarts only when the candidate set or
  // scene/progress source changes, never per frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = progressRef.current;
      const fade = curve(p, chapter.p0, chapter.p1 - chapter.p0);
      for (const part of parts) {
        const el = dotEls.current.get(part.id);
        if (!el) continue;
        const proj = api.projectPart(part.id, part.anchor);
        if (!proj || !proj.onScreen) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          continue;
        }
        const opacity = fade * (proj.occluded ? 0.35 : 1);
        el.style.transform = `translate3d(${proj.x.toFixed(1)}px, ${proj.y.toFixed(1)}px, 0)`;
        el.style.opacity = opacity.toFixed(3);
        el.style.visibility = opacity > VISIBLE_OPACITY_THRESHOLD ? 'visible' : 'hidden';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [api, progressRef, parts, chapter]);

  if (parts.length === 0) return null;

  return (
    <>
      {/* Numbered dots — anchored to each active part's projected screen
       * position, no leader lines (the drawer below is the label). */}
      <div className="pointer-events-none fixed inset-0 z-[9]">
        {parts.map((part, i) => (
          <Dot key={part.id} id={part.id} index={i} setDotEl={setDotEl} />
        ))}
      </div>

      {/* Drawer — fixed just below the persistent header, NOT at the
       * viewport's bottom edge. Verified live (browser smoke): the bottom
       * edge is already claimed on mobile by copy-panel.tsx's own chapter
       * copy, which ALSO renders as a full-width `inset-x-4 bottom-20`
       * bottom sheet with content-driven (2-4 line, chapter-dependent)
       * height — the two frosted, semi-transparent (`ss-veil`) sheets
       * visibly muddled together there, since neither is opaque enough to
       * fully occlude the other and copy-panel.tsx is out of this task's
       * file scope to adjust. Anchoring here instead — below the header,
       * above where the 3D stage's own subject typically frames — avoids
       * that collision deterministically (no cross-component DOM
       * measurement needed) rather than guessing a bottom offset that only
       * happens to clear copy-panel.tsx's shortest possible chapter text.
       * `top-44` (176px) clears scrolly-home.tsx's fixed header — measured
       * 143.5px tall at 320/360/390px mobile widths, in both locales (the
       * brand lockup + tagline + locale/nav/badge `tools` row all wrap to a
       * stable number of lines at phone widths) — with ~32px to spare. */}
      <div
        aria-label={pick(DRAWER_LABEL, locale)}
        className="ss-veil ss-hairline pointer-events-auto fixed inset-x-4 top-44 z-10 rounded-[var(--radius-lg)] border px-3 py-2.5"
      >
        <ul className="flex flex-col gap-0.5">
          {parts.map((part, i) => (
            <DrawerRow key={part.id} part={part} index={i} quotes={quotes} locale={locale} />
          ))}
        </ul>
      </div>
    </>
  );
}
