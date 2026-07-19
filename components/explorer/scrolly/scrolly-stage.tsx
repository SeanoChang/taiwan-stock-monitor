'use client';

// Client island: the pinned full-viewport 3D stage for the scroll-
// disassembly hero (Plan 006 Phase C). Mounts the Silicon Stack scene
// directly in `scrolly` mode — every registered part and the camera are
// driven each frame from `useScrollProgress`'s progress ref via
// `evaluate(p)`/`evalCamera(p)` (lib/scene/disassembly-timeline.ts, applied
// through lib/scene/silicon-stack-scene.ts's `applyDisassembly`) — never
// through a GSAP tween on a three.js object (decision D-002).
//
// Pointer-events note: the scene's orbit controls (lib/scene/camera.ts)
// attach unconditional wheel/pointer-drag listeners to the canvas —
// `e.preventDefault()` on every `wheel` event and pointer-capture on every
// single-finger drag, regardless of scene mode. Since this stage only ever
// runs in `scrolly` mode until handoff, mounting the scene as-is would
// silently swallow the wheel/touch gestures GSAP ScrollTrigger (and, under
// reduced motion, the rAF/getBoundingClientRect fallback) need to see to
// drive scroll progress — the page couldn't be scrolled at all while the
// pointer is over the pinned, full-viewport canvas. Fixed here, in file
// scope, by rendering the canvas `pointer-events-none` until `onHandoff`
// fires: input passes straight through to the page instead of being
// captured for orbit-zoom/drag. `lib/scene/camera.ts` is untouched (out of
// this task's file scope; a mode-aware fix there is a reasonable follow-up).
//
// Hardware callouts (Plan 006 Phase D, Task 5): once the scene api exists
// (`sceneApi` state below, set the moment `createScene()` resolves — a ref
// read can't gate JSX per the `react-hooks/refs` lint rule Task 4's own
// review already hit, hence a plain state mirror of `apiRef.current` instead
// of reading the ref directly in render), this stage mounts BOTH
// <CalloutLayer> (desktop: anchored cards + leader lines) and
// <CalloutDrawer> (mobile: numbered dots + bottom drawer) permanently, and
// lets Tailwind's `sm:` breakpoint pick which one is visible via a
// `display:none` ancestor — the same technique chapter-rail.tsx already uses
// for its own desktop-rail/mobile-strip pair. `useQuotes()` is called with
// no seed: `app/page.tsx` doesn't fetch a server-side quotes payload for
// this route, so this is the "(else it fetches)" branch the brief allows.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { useScrollProgress } from '@/components/explorer/scrolly/use-scroll-progress';
import { CalloutLayer } from '@/components/explorer/annotations/callout-layer';
import { CalloutDrawer } from '@/components/explorer/annotations/callout-drawer';
import { CHAPTERS } from '@/lib/scene/disassembly-timeline';
import { l, pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import type { SceneApi } from '@/lib/scene/silicon-stack-scene';
import { useQuotes } from '@/lib/quotes-client';
import { cn } from '@/lib/utils';

const HANDOFF_LABEL = l('Free explore', '自由探索');
const CHAPTERS_LABEL = l('Chapters', '章節');

/** The chapter whose [p0,p1) window contains p — same rule as chapter-
 * rail.tsx's own helper (duplicated: it isn't exported, and this is a few
 * lines of pure, stateless arithmetic over the shared CHAPTERS table — see
 * that file's comment for the fuller rationale for not sharing it). */
function chapterIndexFor(p: number): number {
  const clamped = p < 0 ? 0 : p > 1 ? 1 : p;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (clamped >= CHAPTERS[i].p0) return i;
  }
  return 0;
}

/** Reduced-motion review finding: rather than feed the scene the raw,
 * continuously-changing scroll fraction (which still drives a continuous
 * "dive" through evaluate(p)/evalCamera(p) even with no GSAP scrub), snap it
 * to the REST position of whichever chapter's window it falls in — the
 * midpoint of [p0,p1), deep in that chapter's keyframe "hold" phase (see
 * disassembly-timeline.ts's holdEase). Scrolling under
 * `prefers-reduced-motion: reduce` then steps discretely between each
 * chapter's resting pose instead of animating continuously between them. */
function nearestChapterRestP(p: number): number {
  const ch = CHAPTERS[chapterIndexFor(p)];
  return (ch.p0 + ch.p1) / 2;
}

export interface ScrollyStageProps {
  /** The ~900vh scroll spacer this stage pins inside of (Task 5's
   * `scrolly-home.tsx` owns and sizes it; GSAP pins `.scrolly-stage`, a
   * descendant, while tracking scroll against this element). */
  wrapperRef: RefObject<HTMLElement | null>;
  locale: Locale;
  accent?: string;
  /** Fires after the scene has switched to `explore` mode. The caller decides
   * how to reveal explore-mode chrome — swap in `SiliconStackExplorer`, or
   * keep this stage mounted and layer HUD over it (see Task 5's brief). */
  onHandoff: () => void;
}

export function ScrollyStage({ wrapperRef, locale, accent, onHandoff }: ScrollyStageProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const [ready, setReady] = useState(false);
  const [handedOff, setHandedOff] = useState(false);
  // State mirror of apiRef.current — see the module doc comment above for
  // why CalloutLayer/CalloutDrawer can't just gate on a ref read in JSX.
  const [sceneApi, setSceneApi] = useState<SceneApi | null>(null);

  const { progressRef, scrollToChapter, reducedMotion } = useScrollProgress(wrapperRef);
  // Shared across CalloutLayer + CalloutDrawer so both read one payload
  // instead of each polling /api/quotes independently — same reason
  // hardware-card.tsx's module doc gives for taking `quotes` as a prop.
  const quotes = useQuotes();

  // Live-read inside the mount-once effect's rAF loop below without adding
  // `reducedMotion` as a dependency (which would tear down and recreate the
  // whole scene on every prefers-reduced-motion change) — same ref-not-state
  // pattern `progressRef` itself already uses, just for this one boolean.
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  // Mount the scene exactly once, in `scrolly` mode, then push the progress
  // ref into it every frame via its own rAF loop — this is what keeps poses
  // smooth regardless of GSAP onUpdate's cadence (or the reduced-motion
  // fallback's), per the brief. Never calls setState from this loop; it only
  // ever writes to the scene's internal `scrollP`, a plain number.
  //
  // Reduced-motion review finding: under prefers-reduced-motion, `p` is
  // snapped to the nearest chapter's rest position (nearestChapterRestP)
  // before being handed to the scene, so scrolling steps discretely between
  // chapters instead of continuously diving — the raw, continuous
  // `progressRef` itself is left untouched (chapterIndexFor/scrollToChapter
  // still read it directly) so this only changes what the *scene* sees.
  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    import('@/lib/scene/silicon-stack-scene')
      .then(({ createScene }) => {
        if (cancelled || !canvasRef.current || !layerRef.current) return;
        const api = createScene({
          container: canvasRef.current,
          layer: layerRef.current,
          accent,
          autoRotate: false,
          locale,
          onSelect: () => {},
          onLevel: () => {},
          onReady: () => setReady(true),
        });
        api.setMode('scrolly');
        apiRef.current = api;
        // One-time, at scene-creation, not per frame — same rule as the
        // pre-existing `onReady: () => setReady(true)` a few lines above.
        setSceneApi(api);
        const tick = () => {
          const p = reducedMotionRef.current
            ? nearestChapterRestP(progressRef.current)
            : progressRef.current;
          api.setScrollProgress(p);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch((e) => {
        console.error('[scrolly-stage] scene failed to start', e);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // Mounted exactly once; locale/accent are pushed to the live scene below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiRef.current?.setLocale(locale);
  }, [locale]);
  useEffect(() => {
    if (accent) apiRef.current?.setAccent(accent);
  }, [accent]);

  const handleHandoff = useCallback(() => {
    apiRef.current?.setMode('explore');
    setHandedOff(true);
    onHandoff();
  }, [onHandoff]);

  return (
    <div
      className={cn(
        // `sticky top-0` keeps the stage visually pinned to the viewport for
        // the whole ~800vh scroll span regardless of motion preference. That
        // is not the scroll-jacking prefers-reduced-motion guards against —
        // no GSAP ScrollTrigger pin/scrub ever runs under reduced motion (see
        // useScrollProgress); the browser scrolls this page at its own
        // uncontrolled, native 1:1 speed either way, only the progress
        // *source* differs. Making this conditional on `!reducedMotion` (as
        // an earlier pass did) let the stage — canvas, 自由探索 toggle, and
        // this file's own stepped-chapter strip below — scroll out of view
        // after the first viewport under reduced motion, leaving every
        // chapter past the first as a blank page (caught by Phase C Task 6's
        // acceptance smoke test).
        'scrolly-stage bg-background sticky top-0 h-svh w-full overflow-hidden',
      )}
    >
      <div
        ref={canvasRef}
        className={cn('absolute inset-0', !handedOff && 'pointer-events-none')}
      />
      <div ref={layerRef} className="pointer-events-none absolute inset-0 z-[6]" />

      {/* vignette, matching the explore-mode stage's framing */}
      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(4,10,18,0.55) 100%)',
        }}
      />

      {/* Depth-gated hardware callouts — over the stage, below chrome (the
       * handoff button / reduced-motion nav below sit at z-10, matching
       * CalloutDrawer's own drawer-bar z-10; CalloutLayer's z-[7]/z-[9] and
       * CalloutDrawer's dot z-[9] stay under the ready spinner's z-20). Both
       * mount permanently once the scene api exists; only one is ever
       * visible at a time via the `sm:` breakpoint toggle described in the
       * module doc comment above. */}
      {!handedOff && sceneApi && (
        <>
          <div className="hidden sm:block">
            <CalloutLayer
              api={sceneApi}
              progressRef={progressRef}
              locale={locale}
              quotes={quotes}
            />
          </div>
          <div className="sm:hidden">
            <CalloutDrawer
              api={sceneApi}
              progressRef={progressRef}
              locale={locale}
              quotes={quotes}
            />
          </div>
        </>
      )}

      {!handedOff && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleHandoff}
          className="ss-veil pointer-events-auto absolute top-6 right-6 z-10 min-h-11 rounded-full text-xs font-semibold tracking-wide"
        >
          {pick(HANDOFF_LABEL, locale)}
        </Button>
      )}

      {/* Reduced motion: no continuous scrub feel to navigate by — a small
       * stepped chapter strip sets discrete p via a direct scroll jump. */}
      {!handedOff && reducedMotion && (
        <nav
          aria-label={pick(CHAPTERS_LABEL, locale)}
          className="ss-veil pointer-events-auto absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit max-w-[calc(100%-48px)] items-center gap-1 overflow-x-auto rounded-full border px-2 py-2"
        >
          {CHAPTERS.map((ch, i) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => scrollToChapter(i)}
              className="text-foreground/70 hover:text-foreground inline-flex min-h-11 flex-none items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors"
            >
              {pick(ch.eyebrow, locale)}
            </button>
          ))}
        </nav>
      )}

      {!ready && (
        <div className="bg-background pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="border-foreground/15 border-t-primary size-[26px] animate-[spin_0.9s_linear_infinite] rounded-full border-2" />
        </div>
      )}
    </div>
  );
}
