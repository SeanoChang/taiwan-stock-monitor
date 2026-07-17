# Code — progress plumbing, timeline evaluator, drei-style helpers

## ScrollTrigger as a progress source (only)

```ts
'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function useScrollScrub(wrapper: RefObject<HTMLElement | null>) {
  const progress = useRef(0);
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: wrapper.current!,
      start: 'top top',
      end: 'bottom bottom',
      pin: '.scrolly-stage',
      scrub: 0.5,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    return () => st.kill();
  }, [wrapper]);
  return progress;
}
```

Native fallback (no GSAP): rAF + `-rect.top / (rect.height - innerHeight)`
with manual `position: sticky` stage — same downstream contract.

## drei-style range/curve helpers (copy the math, not the lib)

```ts
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 0→1 across [start, start+length] of total progress */
export const range = (p: number, start: number, length: number) => clamp01((p - start) / length);
/** 0→1→0 across the range (copy fades, glow pulses) */
export const curve = (p: number, start: number, length: number) =>
  Math.sin(range(p, start, length) * Math.PI);
```

## Keyframe evaluator (pure, tested)

```ts
export interface Keyframe {
  part: PartId;
  t0: number;
  t1: number;
  from: PartPose;
  to: PartPose;
  ease?: (t: number) => number;
}
const smooth = (t: number) => t * t * (3 - 2 * t);

export function evaluate(p: number, tracks: Keyframe[]) {
  const out = new Map<PartId, PartPose>();
  for (const k of tracks)
    out.set(k.part, lerpPose(k.from, k.to, (k.ease ?? smooth)(range(p, k.t0, k.t1 - k.t0))));
  return out; // later tracks override earlier for the same part
}
```

Frame loop: `if (mode==='scrolly') { applyPoses(evaluate(progress.current, TIMELINE)); applyCamera(evalCamera(progress.current)); }`

Gotchas: never setState from rAF; snap to chapter rest-poses (<0.5% away);
`ScrollTrigger.refresh()` after fonts/assets load; test fast wheel + keyboard
PgDn + iOS momentum.
