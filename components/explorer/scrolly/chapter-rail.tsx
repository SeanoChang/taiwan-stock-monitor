'use client';

// Chapter rail — navigation dots for the scroll-disassembly hero (Plan 006
// Phase C, Task 4). One dot per `CHAPTERS` entry (lib/scene/
// disassembly-timeline.ts, the single source of truth for chapter bounds and
// bilingual copy); the active dot tracks scroll progress `p`. Click a dot to
// jump to that chapter via `scrollToChapter` (components/explorer/scrolly/
// use-scroll-progress.ts).
//
// `p` arrives as a ref, written by GSAP's onUpdate (or the reduced-motion
// rAF fallback) — never React state, per decision D-002 (see
// docs/superpowers/apple-redesign/01-scroll-disassembly/
// tech-scrub-architecture-and-timeline.md). This component reads that ref via
// its own rAF loop but calls `setState` only when the *active chapter index*
// actually changes — a handful of transitions across the whole ~900vh scroll,
// never once per frame (the brief's "light rAF-driven state throttle").
// That's a deliberately different rule from the hard "poses derive from p
// only, never setState" constraint that governs part/camera POSE data
// (Tasks 1-2, lib/scene/disassembly-timeline.ts's evaluate/evalCamera): this
// is UI highlight state, not pose data, so there is no drift to guard
// against — `chapterIndexFor(p)` gives the same answer no matter how often,
// or in what order, it is evaluated, exactly like the pure timeline it reads
// bounds from.

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { CHAPTERS } from '@/lib/scene/disassembly-timeline';
import { pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

export interface ChapterRailProps {
  /** p ∈ [0,1]; written by useScrollProgress's GSAP/rAF source, read here via
   * this component's own rAF loop (never passed through as React state). */
  progressRef: RefObject<number>;
  scrollToChapter: (i: number) => void;
  locale: Locale;
  /** Suppress the rail entirely — e.g. under prefers-reduced-motion, where
   * ScrollyStage already renders its own stepped-chapter strip, or once the
   * 自由探索 handoff has occurred. */
  hidden?: boolean;
}

/** The chapter whose [p0,p1) window contains p (CHAPTERS is contiguous and
 * covers [0,1] — see disassembly-timeline.ts's BOUNDS); p=1 resolves to the
 * last chapter. */
function chapterIndexFor(p: number): number {
  const clamped = p < 0 ? 0 : p > 1 ? 1 : p;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (clamped >= CHAPTERS[i].p0) return i;
  }
  return 0;
}

export function ChapterRail({ progressRef, scrollToChapter, locale, hidden }: ChapterRailProps) {
  const [active, setActive] = useState(0);
  const lastIndex = useRef(0);

  useEffect(() => {
    if (hidden) return;
    let raf = 0;
    const tick = () => {
      const idx = chapterIndexFor(progressRef.current);
      if (idx !== lastIndex.current) {
        lastIndex.current = idx;
        setActive(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef, hidden]);

  if (hidden) return null;

  return (
    <>
      {/* Desktop (≥sm): right-edge vertical dot rail. */}
      <nav
        aria-label="chapters"
        className="ss-veil pointer-events-auto fixed top-1/2 right-6 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-full border px-2.5 py-4 sm:flex"
      >
        {CHAPTERS.map((ch, i) => {
          const isActive = i === active;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => scrollToChapter(i)}
              title={pick(ch.eyebrow, locale)}
              aria-label={pick(ch.eyebrow, locale)}
              aria-current={isActive ? 'step' : undefined}
              className="group flex items-center justify-center p-1"
            >
              <span
                className={cn(
                  'block size-[7px] rounded-full transition-all duration-300',
                  isActive
                    ? 'bg-primary scale-125'
                    : 'bg-foreground/25 group-hover:bg-foreground/50',
                )}
              />
            </button>
          );
        })}
      </nav>

      {/* Mobile (<sm): slim bottom strip, same dots, horizontal. */}
      <nav
        aria-label="chapters"
        className="ss-veil pointer-events-auto fixed inset-x-0 bottom-4 z-10 mx-auto flex w-fit max-w-[calc(100%-32px)] items-center gap-2.5 rounded-full border px-4 py-2.5 sm:hidden"
      >
        {CHAPTERS.map((ch, i) => {
          const isActive = i === active;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => scrollToChapter(i)}
              title={pick(ch.eyebrow, locale)}
              aria-label={pick(ch.eyebrow, locale)}
              aria-current={isActive ? 'step' : undefined}
              className="flex items-center justify-center p-1"
            >
              <span
                className={cn(
                  'block size-[6px] rounded-full transition-all duration-300',
                  isActive ? 'bg-primary scale-125' : 'bg-foreground/25',
                )}
              />
            </button>
          );
        })}
      </nav>
    </>
  );
}
