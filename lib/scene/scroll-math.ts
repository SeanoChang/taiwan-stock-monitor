// Drei-style scroll-progress helpers — the math is copied (not the library;
// see docs/superpowers/apple-redesign/01-scroll-disassembly/research-scroll-tech-choices-gsap-css-drei.md,
// decision D-002). Pure, dependency-free arithmetic on a single progress
// value p ∈ [0,1]; used by lib/scene/disassembly-timeline.ts to turn a scroll
// position into part poses and copy fades. No three/gsap imports here on
// purpose — this file must stay usable from a headless Node script
// (scripts/check-timeline.ts) with no WebGL/DOM.

/** Clamp to [0,1]. */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0→1 across [start, start+length] of total progress; clamped outside. */
export const range = (p: number, start: number, length: number) => clamp01((p - start) / length);

/** 0→1→0 across the range (copy fades, glow pulses). */
export const curve = (p: number, start: number, length: number) =>
  Math.sin(range(p, start, length) * Math.PI);

/** smoothstep — the default ease for timeline keyframes. */
export const smooth = (t: number) => t * t * (3 - 2 * t);
