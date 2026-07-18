'use client';

// Copy panels — the eyebrow/headline/body overlay for each chapter of the
// scroll-disassembly hero (Plan 006 Phase C, Task 4). Bilingual copy is read
// straight from `CHAPTERS` (lib/scene/disassembly-timeline.ts); nothing here
// owns any copy of its own.
//
// Per decision D-002 (see docs/superpowers/apple-redesign/01-scroll-
// disassembly/tech-scrub-architecture-and-timeline.md) and this task's brief,
// a panel's visibility is driven straight off the progress ref via rAF —
// `curve(p, ch.p0, ch.p1-ch.p0)` (lib/scene/scroll-math.ts; 0→1→0 across the
// chapter's window) written directly to the panel element's own
// `style.opacity` — a plain DOM mutation, never React state. This mirrors how
// the scene itself derives every part pose from `p`
// (lib/scene/disassembly-timeline.ts's evaluate/evalCamera): stateless, so
// scrubbing back and forth can never drift or desync from what the 3D stage
// is showing, and this component never re-renders on scroll (no `useState`
// here at all).

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { CHAPTERS } from '@/lib/scene/disassembly-timeline';
import { curve } from '@/lib/scene/scroll-math';
import { pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

export interface CopyPanelsProps {
  /** p ∈ [0,1]; written by useScrollProgress's GSAP/rAF source, read here via
   * this component's own rAF loop (never passed through as React state). */
  progressRef: RefObject<number>;
  locale: Locale;
  /** Suppress the panels entirely — e.g. once the 自由探索 handoff has
   * occurred and the pinned stage is gone. */
  hidden?: boolean;
}

export function CopyPanels({ progressRef, locale, hidden }: CopyPanelsProps) {
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (hidden) return;
    let raf = 0;
    const tick = () => {
      const p = progressRef.current;
      for (let i = 0; i < CHAPTERS.length; i++) {
        const el = panelRefs.current[i];
        if (!el) continue;
        const ch = CHAPTERS[i];
        const o = curve(p, ch.p0, ch.p1 - ch.p0);
        el.style.opacity = o.toFixed(3);
        // visibility (not just opacity) keeps near-zero panels out of the
        // accessibility tree and the tab order without unmounting them —
        // mounting/unmounting all 8 panels every scroll pass would thrash
        // layout for no visual benefit, since only the current (and briefly,
        // the adjacent) chapter's panel is ever meaningfully visible.
        el.style.visibility = o > 0.03 ? 'visible' : 'hidden';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef, hidden]);

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[8]">
      {CHAPTERS.map((ch, i) => {
        const alignRight = i % 2 === 1;
        return (
          <div
            key={ch.id}
            ref={(node) => {
              panelRefs.current[i] = node;
            }}
            className={cn(
              'ss-veil invisible absolute rounded-[20px] border px-6 py-5 opacity-0',
              // Mobile (<md): bottom sheet, full width, clear of ChapterRail's
              // own bottom strip.
              'inset-x-4 bottom-20',
              // Desktop (≥md): alternating left/right, vertically centered.
              'md:inset-x-auto md:top-1/2 md:bottom-auto md:w-[min(400px,36vw)] md:-translate-y-1/2',
              alignRight ? 'md:right-10 lg:right-16' : 'md:left-10 lg:left-16',
            )}
          >
            <p className="text-eyebrow mb-2">{pick(ch.eyebrow, locale)}</p>
            <h2 className="text-title mb-2">{pick(ch.headline, locale)}</h2>
            <p className="text-body text-foreground/75">{pick(ch.body, locale)}</p>
          </div>
        );
      })}
    </div>
  );
}
