'use client';

// Client orchestrator for `/` (Plan 006 Phase C, Task 5): the ~800vh
// scroll-disassembly hero. Wires the Task 3/4 islands — <ScrollyStage> (pinned
// 3D stage + its own persistent 自由探索 toggle), <CopyPanels> (chapter copy),
// <ChapterRail> (nav dots) — around a single scroll spacer, adds the ch7
// outro CTA row (圖譜/行情/自由探索) and the handoff to the existing
// free-explore experience. `app/page.tsx` stays a server component; this is
// the one client island it mounts.
//
// ---- Progress source (why this file doesn't lift useScrollProgress) ----
// The design docs (docs/superpowers/apple-redesign/01-scroll-disassembly/
// tech-scrub-architecture-and-timeline.md) call for exactly ONE GSAP
// ScrollTrigger pinning `.scrolly-stage` — GSAP does not support two
// ScrollTriggers pinning the same element (each would wrap it in its own
// pin-spacer). `ScrollyStage` already owns that single instance internally
// (components/explorer/scrolly/use-scroll-progress.ts) and doesn't expose its
// progress ref as a prop; threading it out would mean changing
// `scrolly-stage.tsx`'s API, outside this task's file scope
// (`app/page.tsx` + this file only — see task-5-report.md's Scope note).
//
// Instead, `useHeroProgress` below independently re-derives the SAME raw
// scroll fraction ScrollyStage's own GSAP instance uses internally. Reading
// gsap's ScrollTrigger source (node_modules/gsap/ScrollTrigger.js) confirms
// `self.progress` is assigned the immediate, unsmoothed `clipped` scroll
// fraction on every tick (`self.progress = clipped`); `scrub` only smooths an
// internal placeholder tween used for pin/onUpdate cadence, never the
// reported progress value itself. So this hook's `-rect.top / span` formula —
// the same one use-scroll-progress.ts's own reduced-motion fallback already
// uses — is numerically equivalent to what drives ScrollyStage's poses, with
// no desync and without ever creating a second pin.
//
// `scrollToChapter` below is likewise a deliberate, small duplication of
// use-scroll-progress.ts's own implementation (ScrollyStage doesn't expose its
// instance either) — same reasoning, documented once here rather than at
// each call site.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ScrollyStage } from '@/components/explorer/scrolly/scrolly-stage';
import { ChapterRail } from '@/components/explorer/scrolly/chapter-rail';
import { CopyPanels } from '@/components/explorer/scrolly/copy-panel';
import type { ExplorerCopy } from '@/components/explorer/explorer-copy';
import { CHAPTERS } from '@/lib/scene/disassembly-timeline';
import { clamp01, range } from '@/lib/scene/scroll-math';
import { l, pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

// Only needed after the 自由探索 handoff — keeps three.js's explore-mode
// bundle (and the company/quotes data it can pull in) out of the initial
// scrolly-hero load, mirroring silicon-stack-explorer.tsx's own CompanyPanel
// precedent.
const SiliconStackExplorer = dynamic(
  () => import('@/components/explorer/silicon-stack-explorer').then((m) => m.SiliconStackExplorer),
  { ssr: false },
);

const CTA_EXPLORE = l('Free explore', '自由探索');
const CTA_GRAPH = l('Supply-chain map', '供應鏈圖譜');
const CTA_MARKET = l('Market board', '行情看板');
const CTA_GROUP_LABEL = l('Continue exploring', '繼續探索');
const PREV_CHAPTER = l('Previous chapter', '上一章');
const NEXT_CHAPTER = l('Next chapter', '下一章');

const LAST_CHAPTER = CHAPTERS.length - 1;
const CH7 = CHAPTERS[LAST_CHAPTER];

/** The chapter whose [p0,p1) window contains p — same rule as
 * chapter-rail.tsx's own helper (duplicated: it isn't exported, and this is a
 * few lines of pure, stateless arithmetic over the shared CHAPTERS table). */
function chapterIndexFor(p: number): number {
  const clamped = clamp01(p);
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (clamped >= CHAPTERS[i].p0) return i;
  }
  return 0;
}

/** Independently re-derives the raw scroll fraction across `wrapperRef`'s
 * ~800vh span — see the module doc comment above for why this doesn't
 * duplicate ScrollyStage's GSAP pin. `paused` stops the loop once handed off
 * (the wrapper is about to unmount; nothing reads this ref again). */
function useHeroProgress(wrapperRef: RefObject<HTMLDivElement | null>, paused: boolean) {
  const progressRef = useRef(0);
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    const measure = () => {
      const wrapper = wrapperRef.current;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const span = Math.max(1, rect.height - window.innerHeight);
        progressRef.current = clamp01(-rect.top / span);
      }
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [wrapperRef, paused]);
  return progressRef;
}

export interface ScrollyHomeProps {
  locale: Locale;
  copy: ExplorerCopy;
  /** server-rendered: brand lockup and tagline */
  brand: ReactNode;
  /** server-rendered: locale toggle, nav and the illustrative-data badge */
  tools: ReactNode;
  accent?: string;
}

export function ScrollyHome({ locale, copy, brand, tools, accent }: ScrollyHomeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [handedOff, setHandedOff] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const progressRef = useHeroProgress(wrapperRef, handedOff);

  // Reactive prefers-reduced-motion, same pattern as use-scroll-progress.ts /
  // components/site/reveal.tsx.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const scrollToChapter = useCallback(
    // `behaviorOverride` lets the deep-link mount effect below supply a
    // freshly-read `prefers-reduced-motion` value instead of trusting this
    // callback's closed-over `reducedMotion` state — see that effect's
    // comment for why the state alone isn't safe there.
    (i: number, behaviorOverride?: ScrollBehavior) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const ch = CHAPTERS[Math.max(0, Math.min(LAST_CHAPTER, i))];
      const rect = wrapper.getBoundingClientRect();
      const span = Math.max(1, wrapper.offsetHeight - window.innerHeight);
      const targetY = window.scrollY + rect.top + ch.p0 * span;
      window.scrollTo({
        top: targetY,
        behavior: behaviorOverride ?? (reducedMotion ? 'auto' : 'smooth'),
      });
    },
    [reducedMotion],
  );

  const stepChapter = useCallback(
    (dir: 1 | -1) => scrollToChapter(chapterIndexFor(progressRef.current) + dir),
    [scrollToChapter, progressRef],
  );

  const handleHandoff = useCallback(() => setHandedOff(true), []);

  // Deep link: /#ch-N scrolls to chapter N once mounted. A short delay lets
  // the ~800vh wrapper (and the lazily-mounted 3D canvas that can reflow the
  // page) settle before the jump is computed.
  //
  // Reduced-motion fix (review finding): this is a one-shot, mount-only
  // effect (empty deps — it must not re-fire on later renders). Its closure
  // over `scrollToChapter` is frozen from the very first render, where
  // `reducedMotion` state is still its initial `false` — the sibling
  // `prefers-reduced-motion` matchMedia effect above hasn't had a chance to
  // flip it yet (a setState inside an effect doesn't synchronously re-render
  // before sibling effects in the same mount flush finish). Passing that
  // stale `reducedMotion` through would make `/#ch-N` always animate on
  // first load, even under `prefers-reduced-motion: reduce`. Reading
  // `matchMedia` directly here (fresh, not through state) and passing it as
  // an explicit override sidesteps the stale closure entirely.
  useEffect(() => {
    const m = /^#ch-(\d+)$/.exec(window.location.hash);
    if (!m) return;
    const i = Number(m[1]);
    if (!Number.isFinite(i)) return;
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    const id = window.setTimeout(() => scrollToChapter(i, behavior), 60);
    return () => window.clearTimeout(id);
    // Read hash + matchMedia once on mount; scrollToChapter's identity
    // changing with reducedMotion shouldn't re-trigger the jump (the
    // explicit `behavior` override above makes that identity irrelevant to
    // correctness here anyway).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ch7 CTA row: rises across ch7's window and HOLDS at full opacity past
  // p=1 — unlike CopyPanels' curve() (rise-then-fall, correct for transient
  // chapter copy), a resting/terminal CTA must still be visible once the
  // scroll settles at the bottom. A plain ref-driven style write, never React
  // state — same rule CopyPanels itself follows.
  useEffect(() => {
    if (handedOff) return;
    let raf = 0;
    const tick = () => {
      const o = range(progressRef.current, CH7.p0, CH7.p1 - CH7.p0);
      const el = ctaRef.current;
      if (el) {
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o > 0.03 ? 'visible' : 'hidden';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [handedOff, progressRef]);

  // 自由探索 handoff: mount the existing, unmodified free-explore experience
  // fresh — explore mode is therefore provably behavior-identical (it's the
  // same component `/` rendered before this task), and a brand-new scene
  // naturally starts every part at its registered base pose (nothing to
  // "reset" — there's no prior exploded state to carry over).
  if (handedOff) {
    return (
      <SiliconStackExplorer
        locale={locale}
        copy={copy}
        brand={brand}
        tools={tools}
        accent={accent}
      />
    );
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between px-8 py-6">
        <div className="pointer-events-auto">{brand}</div>
        {/* Nudged down to clear ScrollyStage's own persistent 自由探索 toggle
         * (absolute top-6 right-6 inside the stage below). */}
        <div className="pointer-events-auto mt-12 flex items-center gap-2.5">{tools}</div>
      </header>

      <div ref={wrapperRef} className="relative" style={{ height: '800vh' }}>
        <ScrollyStage
          wrapperRef={wrapperRef}
          locale={locale}
          accent={accent}
          onHandoff={handleHandoff}
        />
        <CopyPanels progressRef={progressRef} locale={locale} />
        <ChapterRail
          progressRef={progressRef}
          scrollToChapter={scrollToChapter}
          locale={locale}
          hidden={reducedMotion}
        />

        {/* Reduced motion: ScrollyStage's own stepped-chapter strip lives
         * inside its non-sticky, normal-flow container and scrolls out of
         * view after the first viewport under `no pin/scrub` — these
         * viewport-fixed prev/next controls stay reachable for the whole
         * scroll. Placed on the vertical edges so they never compete with the
         * top header, ScrollyStage's own corner toggle, or the bottom-center
         * CTA row. */}
        {reducedMotion && (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => stepChapter(-1)}
              aria-label={pick(PREV_CHAPTER, locale)}
              className="ss-veil pointer-events-auto fixed top-1/2 left-4 z-30 -translate-y-1/2 rounded-full"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => stepChapter(1)}
              aria-label={pick(NEXT_CHAPTER, locale)}
              className="ss-veil pointer-events-auto fixed top-1/2 right-4 z-30 -translate-y-1/2 rounded-full"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}

        <div
          ref={ctaRef}
          aria-label={pick(CTA_GROUP_LABEL, locale)}
          className="ss-veil pointer-events-auto invisible fixed inset-x-0 bottom-6 z-20 mx-auto flex w-fit max-w-[calc(100%-48px)] flex-wrap items-center justify-center gap-2.5 rounded-[var(--radius-pill)] border px-4 py-3 opacity-0"
        >
          <Link
            href="/supply-chain"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
          >
            {pick(CTA_GRAPH, locale)}
          </Link>
          <Link
            href="/market"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
          >
            {pick(CTA_MARKET, locale)}
          </Link>
          <Button onClick={handleHandoff} size="sm" className="rounded-full">
            {pick(CTA_EXPLORE, locale)}
          </Button>
        </div>
      </div>
    </>
  );
}
