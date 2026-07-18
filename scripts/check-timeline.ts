// Headless gate for the pure disassembly timeline — no WebGL/DOM needed since
// scroll-math.ts and disassembly-timeline.ts are plain arithmetic over p.
// Run: pnpm check:timeline
import { clamp01, range, curve } from '../lib/scene/scroll-math';
import { evaluate, evalCamera, CHAPTERS, activeLevelFor } from '../lib/scene/disassembly-timeline';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

// range/curve/clamp sanity
// (epsilon, not !==: (0.5-0.4)/0.2 is 0.4999999999999999 in IEEE-754, so a
// strict equality check here would fail for reasons unrelated to range()'s
// correctness — same reasoning as the epsilon checks below.)
if (Math.abs(range(0.5, 0.4, 0.2) - 0.5) > 1e-9) err('range midpoint wrong');
if (clamp01(2) !== 1 || clamp01(-1) !== 0) err('clamp01 wrong');
if (Math.abs(curve(0.5, 0, 1) - 1) > 1e-9) err('curve peak != 1 at mid');

// determinism / zero-drift: evaluate(0.3) is identical whether or not evaluate(1) ran first
const a = JSON.stringify([...evaluate(0.3)]);
evaluate(1);
evaluate(0);
const b = JSON.stringify([...evaluate(0.3)]);
if (a !== b) err('evaluate is not a pure function of p (drift!)');

// camera defined across [0,1]
for (const p of [0, 0.25, 0.5, 0.75, 1]) {
  const c = evalCamera(p);
  if (!c || typeof c.r !== 'number') err(`evalCamera(${p}) invalid`);
}

// chapters contiguous cover [0,1]; activeLevel in 0..3
let prev = 0;
for (const ch of CHAPTERS) {
  if (Math.abs(ch.p0 - prev) > 1e-9) err(`chapter gap at ${ch.p0}`);
  prev = ch.p1;
}
if (Math.abs(prev - 1) > 1e-9) err('chapters do not end at 1');
for (const p of [0, 0.3, 0.7, 0.9, 1]) {
  const lv = activeLevelFor(p);
  if (lv < 0 || lv > 3) err(`activeLevelFor(${p})=${lv} out of range`);
}

if (errors.length) {
  console.error(`✗ timeline: ${errors.length} problem(s)`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log(`✓ timeline OK — ${CHAPTERS.length} chapters, evaluate() pure/drift-free`);
