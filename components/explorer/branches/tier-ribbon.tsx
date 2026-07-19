'use client';

// Tier ribbon — a slim, fixed-bottom strip of the 9 supply-chain tiers
// 材料→設備→晶圓→晶片→封測→板卡→子系統→系統→雲端 (Plan 006 Phase E, Task 3;
// design: docs/superpowers/apple-redesign/04-supplier-branches/
// design-hover-branch-overlay-and-tier-ribbon.md's "Tier ribbon" section).
//
// Layer hygiene (Plan 006 Phase E's Global Constraints): this file does NOT
// import components/graph/graph-model.ts's GROUP_LABELS/PALETTE/STAGE_GROUP
// — that module belongs to the full-graph deep-dive surface
// (components/graph/*), off-limits to the explorer. TIERS below is a local
// mirror instead: the same 8 chromatic slots (materials+wafer share slot 0,
// exactly like graph-model.ts's STAGE_GROUP), but its own terse per-tier
// bilingual labels — the design doc calls out 9 distinct tier names, not
// graph-model.ts's 8 *grouped* legend labels ("Materials & Wafers" as one
// entry). `group` numbers are chosen to line up 1:1 with STAGE_GROUP's own
// numbering, so a future `/supply-chain?group=` deep link (Task 4) can hand
// `onTier`'s payload straight to that page's existing `groupFilter` state
// with no translation table. 'anchor' (graph-model.ts's neutral 9th slot,
// "Global Anchors") is intentionally excluded — the design doc's 9 tiers
// stop at 雲端/Cloud.
//
// Two independently-"lit" states, two different update rules:
//   - Chapter glow tracks `progressRef` (p ∈ [0,1], written every scroll
//     frame by useScrollProgress's GSAP/rAF source) via this component's own
//     rAF loop. Per Plan 006 Phase E's "no setState from an rAF/scroll
//     frame" constraint, this never calls setState — it only reads the ref
//     and, on the rare frame where the active *chapter* actually changes
//     (`chapterIndexFor`, duplicated from chapter-rail.tsx/scrolly-stage.tsx
//     — see their own comments for why a few lines of pure CHAPTERS lookup
//     is cheaper to copy than to share), toggles a `glow` class plus a
//     couple of `el.style.*` properties directly on each tile's DOM node —
//     the same imperative-DOM-write idiom copy-panel.tsx and
//     callout-layer.tsx already use for their own per-frame visuals.
//   - Overlay glow (`activeStages`) reflects whether BranchOverlay is open
//     and which tier groups its currently-visible alters touch. Opening/
//     closing the overlay is a hover/click *event*, not a scroll frame — so
//     this is ordinary prop-driven React rendering (a plain conditional
//     `style`), exactly the reasoning branch-overlay.tsx's own module doc
//     gives for why ITS state is plain `useState`.
//
// CHAPTER_TIERS traces the same rack→die→rack dive disassembly-timeline.ts's
// CHAPTERS copy already tells: chapters 4-6 are pinned to the design doc's
// own worked example (ch4=子系統, ch5=封測／晶片, ch6=材料／設備); the
// bookend chapters — the intro and ch7's "explore the full map" — don't zoom
// on any one tier, so nothing glows there, while the rack/server/teardown
// chapters in between read as the *finished system* sharpening to its
// *board* once the lid lifts.

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { StageId } from '@/lib/data/supply-chain';
import { CHAPTERS } from '@/lib/scene/disassembly-timeline';
import { l, pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';

export interface TierRibbonProps {
  /** p ∈ [0,1]; written by useScrollProgress's GSAP/rAF source, read here via
   * this component's own rAF loop (never passed through as React state). */
  progressRef: RefObject<number>;
  /** Tier `group` numbers touched by BranchOverlay's currently-visible
   * alters (Task 4 computes this from the ego + each alter's own company
   * stage); omitted/empty when no overlay is open. */
  activeStages?: Set<number>;
  /** A tile was clicked — `group` matches graph-model.ts's STAGE_GROUP
   * numbering (see TIERS below), ready for a `/supply-chain` group-filter
   * deep link (Task 4). */
  onTier: (group: number) => void;
  locale: Locale;
}

interface Tier {
  stage: StageId;
  /** graph-model.ts's STAGE_GROUP slot — materials+wafer intentionally
   * share slot 0, mirroring that module's own grouping. */
  group: number;
  /** graph-model.ts's PALETTE, slots 0-7 (this ribbon never shows the
   * anchor stage's neutral slot 8). */
  color: string;
  label: LStr;
}

const TIERS: Tier[] = [
  { stage: 'materials', group: 0, color: '#3987e5', label: l('Materials', '材料') },
  { stage: 'fabsupport', group: 1, color: '#008300', label: l('Equipment', '設備') },
  { stage: 'wafer', group: 0, color: '#3987e5', label: l('Wafer', '晶圓') },
  { stage: 'chip', group: 2, color: '#d55181', label: l('Chip', '晶片') },
  { stage: 'package', group: 3, color: '#c98500', label: l('Package', '封測') },
  { stage: 'board', group: 4, color: '#199e70', label: l('Boards', '板卡') },
  { stage: 'subsystem', group: 5, color: '#d95926', label: l('Subsystems', '子系統') },
  { stage: 'system', group: 6, color: '#9085e9', label: l('Systems', '系統') },
  { stage: 'cloud', group: 7, color: '#e66767', label: l('Cloud', '雲端') },
];

/** Chapter id (CHAPTERS' own 0-7) → the tier(s) that chapter's copy is
 * actually about; see the module doc above for the narrative this traces. */
const CHAPTER_TIERS: StageId[][] = [
  [], // ch0 Silicon chain — intro, before the dive starts
  ['system'], // ch1 The rack
  ['system'], // ch2 The server
  ['board'], // ch3 Teardown — fans/PSU/board revealed
  ['subsystem'], // ch4 Subsystems
  ['package', 'chip'], // ch5 The package
  ['materials', 'fabsupport'], // ch6 Nanometers
  [], // ch7 Made in Taiwan — zoomed back out to the whole chain
];

const RIBBON_LABEL = l('Supply chain tiers', '供應鏈層級');

function tierAriaLabel(tier: Tier, locale: Locale): string {
  const name = pick(tier.label, locale);
  return pick(l(`${name} — filter the supply chain graph`, `${name} — 篩選供應鏈圖譜`), locale);
}

/** `#rrggbb` + a 0..1 alpha, as an 8-digit hex color — every TIERS color is
 * already 6-digit hex, so this is enough for the glow's box-shadow without
 * pulling in a color-mix()/rgba() parse. */
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/** The chapter whose [p0,p1) window contains p — same rule as chapter-
 * rail.tsx's own helper (itself duplicated from scrolly-stage.tsx; see
 * either's comment for why this handful of lines of pure CHAPTERS lookup is
 * cheaper to copy than to share). */
function chapterIndexFor(p: number): number {
  const clamped = p < 0 ? 0 : p > 1 ? 1 : p;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (clamped >= CHAPTERS[i].p0) return i;
  }
  return 0;
}

export function TierRibbon({ progressRef, activeStages, onTier, locale }: TierRibbonProps) {
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastChapter = useRef(-1);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const idx = chapterIndexFor(progressRef.current);
      if (idx !== lastChapter.current) {
        lastChapter.current = idx;
        const glowing = CHAPTER_TIERS[idx] ?? [];
        for (let i = 0; i < TIERS.length; i++) {
          const tier = TIERS[i];
          const el = tileRefs.current[i];
          if (!el) continue;
          const isGlowing = glowing.includes(tier.stage);
          el.classList.toggle('glow', isGlowing);
          el.style.boxShadow = isGlowing
            ? `0 0 0 1.5px ${withAlpha(tier.color, 0.9)}, 0 0 14px 2px ${withAlpha(tier.color, 0.4)}`
            : '';
          el.style.transform = isGlowing ? 'translateY(-3px)' : '';
          const label = el.querySelector<HTMLElement>('[data-tier-label]');
          if (label) label.style.color = isGlowing ? tier.color : '';
          if (isGlowing) el.setAttribute('aria-current', 'true');
          else el.removeAttribute('aria-current');
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <nav
      aria-label={pick(RIBBON_LABEL, locale)}
      className="ss-veil pointer-events-auto fixed inset-x-0 bottom-0 z-[9] flex items-stretch justify-center gap-0.5 overflow-x-auto border-t px-2 py-1.5 sm:gap-1 sm:px-4"
    >
      {TIERS.map((tier, i) => {
        const isOverlayActive = activeStages?.has(tier.group) ?? false;
        return (
          <button
            key={tier.stage}
            ref={(node) => {
              tileRefs.current[i] = node;
            }}
            type="button"
            onClick={() => onTier(tier.group)}
            aria-label={tierAriaLabel(tier, locale)}
            style={{
              transition:
                'background-color 0.3s var(--ease-apple), box-shadow 0.3s var(--ease-apple), transform 0.3s var(--ease-apple)',
              backgroundColor: isOverlayActive ? withAlpha(tier.color, 0.16) : undefined,
            }}
            className="hover:bg-secondary flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-1 text-center"
          >
            <span
              aria-hidden="true"
              className="size-[7px] flex-none rounded-full"
              style={{ background: tier.color }}
            />
            <span
              data-tier-label
              className="text-tertiary text-[9.5px] leading-none font-semibold whitespace-nowrap sm:text-[10.5px]"
            >
              {pick(tier.label, locale)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
