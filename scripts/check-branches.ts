// Data-integrity gate for lib/data/adjacency.ts (Plan 006 Phase E) — verifies
// buildAdjacency() is non-empty and symmetric, rankAlters() orders TW-listed
// alters first then by degree, and layoutBranches() fans points with no
// overlap, all on the circle, and never divides by zero at n=1.
// Pure (no DOM/WebGL). Run: pnpm check:branches

import { buildAdjacency, rankAlters, layoutBranches, type Alter } from '../lib/data/adjacency';
import { l } from '../lib/i18n/config';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

// 1. buildAdjacency() is non-empty and symmetric: b∈adj(a) ⇒ a∈adj(b).
const adj = buildAdjacency();
if (adj.size === 0) err('buildAdjacency(): empty — no companies produced an adjacency entry');

for (const [a, alters] of adj) {
  for (const alter of alters) {
    const back = adj.get(alter.id);
    if (!back || !back.some((x) => x.id === a)) {
      err(
        `buildAdjacency(): asymmetric edge — ${alter.id} ∈ adj(${a}) but ${a} ∉ adj(${alter.id})`,
      );
    }
  }
}

// 2. rankAlters(): TW-listed alters first, then by degree (well-connected
// first), then alpha id. Case constructed from real ids with known,
// well-separated exch/degree so the ordering is unambiguous:
//   tsmc      TWSE, high degree
//   foxconn   TWSE, mid degree
//   kungchun3178  TPEx, zero degree
//   nvidia    US,   high degree (but non-TW — must still rank last)
const label = l('x', 'x');
const rankCase: Alter[] = [
  { id: 'nvidia', label },
  { id: 'kungchun3178', label },
  { id: 'tsmc', label },
  { id: 'foxconn', label },
];
const ranked = rankAlters(rankCase, 8).map((a) => a.id);
const expected = ['tsmc', 'foxconn', 'kungchun3178', 'nvidia'];
if (ranked.join(',') !== expected.join(',')) {
  err(`rankAlters(): expected TW-first/degree order [${expected}], got [${ranked}]`);
}

// 3. layoutBranches(8): 8 points, no two within 24px of each other, and
// every point lands on the requested radius (within floating-point slop).
const r = 140;
const eight = layoutBranches(8, r);
if (eight.length !== 8) err(`layoutBranches(8): expected 8 points, got ${eight.length}`);
for (let i = 0; i < eight.length; i++) {
  const p = eight[i];
  const dist = Math.hypot(p.x, p.y);
  if (Math.abs(dist - r) > 0.01) {
    err(`layoutBranches(8): point ${i} at radius ${dist.toFixed(2)}, expected ${r}`);
  }
  for (let j = i + 1; j < eight.length; j++) {
    const q = eight[j];
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < 24)
      err(`layoutBranches(8): points ${i} and ${j} are only ${d.toFixed(2)}px apart (<24)`);
  }
}

// 4. layoutBranches(1): must not divide by zero (n-1 === 0).
const one = layoutBranches(1, r);
if (one.length !== 1) err(`layoutBranches(1): expected 1 point, got ${one.length}`);
if (!one.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))) {
  err(
    `layoutBranches(1): produced non-finite coordinates (divide-by-zero) — ${JSON.stringify(one)}`,
  );
}

if (errors.length) {
  console.error(`✗ branches: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ branches OK — ${adj.size} companies with adjacency, layout/rank sane`);
