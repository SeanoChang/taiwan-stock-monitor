'use client';

// Scroll-scrub progress source for the disassembly hero (Plan 006 Phase C,
// decision D-002 — see docs/superpowers/apple-redesign/01-scroll-disassembly/
// tech-scrub-architecture-and-timeline.md). GSAP ScrollTrigger supplies
// progress p ∈ [0,1] + viewport pinning ONLY; nothing here ever tweens a
// three.js object — `lib/scene/disassembly-timeline.ts`'s evaluate(p)/
// evalCamera(p) own all part/camera animation, applied by the scene's
// `scrolly` mode every frame.
//
// `progressRef` is written only from GSAP's onUpdate callback (or the native
// rAF fallback below) — never through React state, so scrubbing back and
// forth can never trigger an extra render or accumulate drift (poses are
// re-derived from p alone; see scripts/check-timeline.ts).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHAPTERS } from '@/lib/scene/disassembly-timeline';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollProgress {
  /** p ∈ [0,1]; read every frame by the render loop — never via setState. */
  progressRef: RefObject<number>;
  /** Scrolls to a chapter's start offset (smooth normally, instant under
   * prefers-reduced-motion). Drives `progressRef` indirectly via the real
   * scroll position, so it works identically whether GSAP or the native
   * fallback below is the active progress source. */
  scrollToChapter: (i: number) => void;
  /** true under prefers-reduced-motion: no GSAP pin/scrub is created — the
   * page scrolls at its own pace and progress is derived from the wrapper's
   * natural (unpinned) position via rAF + getBoundingClientRect instead. */
  reducedMotion: boolean;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * @param wrapperRef the ~900vh scroll spacer that owns this hero (Task 5's
 * `scrolly-home.tsx`); `.scrolly-stage` (rendered by `ScrollyStage`, a
 * descendant of this wrapper) is what GSAP pins.
 */
export function useScrollProgress(wrapperRef: RefObject<HTMLElement | null>): ScrollProgress {
  const progressRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Reactive prefers-reduced-motion — read once and kept in sync so a user
  // toggling the OS setting mid-session switches progress sources cleanly.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (reducedMotion) {
      // Native fallback (no GSAP pin/scrub — per the storyboard's reduced-
      // motion rule the page scrolls normally; ScrollyStage layers stepped
      // chapter buttons on top for navigation). See code-scroll-progress-
      // and-keyframes.md's documented native rAF + getBoundingClientRect path.
      let raf = 0;
      const measure = () => {
        const rect = wrapper.getBoundingClientRect();
        const span = Math.max(1, rect.height - window.innerHeight);
        progressRef.current = clamp01(-rect.top / span);
        raf = requestAnimationFrame(measure);
      };
      raf = requestAnimationFrame(measure);
      return () => cancelAnimationFrame(raf);
    }

    const st = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top top',
      end: 'bottom bottom',
      pin: '.scrolly-stage',
      scrub: 0.5,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });
    // The three.js canvas mounts lazily and fonts can reflow the page after
    // this effect first runs; one refresh on the next frame keeps the
    // pinned start/end measurements accurate against the settled layout.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(raf);
      st.kill();
    };
  }, [wrapperRef, reducedMotion]);

  const scrollToChapter = useCallback(
    (i: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const ch = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, i))];
      const rect = wrapper.getBoundingClientRect();
      const span = Math.max(1, wrapper.offsetHeight - window.innerHeight);
      const targetY = window.scrollY + rect.top + ch.p0 * span;
      window.scrollTo({ top: targetY, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [wrapperRef, reducedMotion],
  );

  return { progressRef, scrollToChapter, reducedMotion };
}
