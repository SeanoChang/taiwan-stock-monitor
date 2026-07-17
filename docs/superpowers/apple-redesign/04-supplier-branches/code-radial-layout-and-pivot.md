# Code — radial fan layout, adjacency extraction, pivot state

```ts
// lib/data/adjacency.ts — extract from graph-model (layer hygiene:
// the explorer island must not import from components/graph/*)
export function buildAdjacency(): Map<string, { id: string; label: LStr }[]> {
  const adj = new Map<string, { id: string; label: LStr }[]>();
  const push = (a: string, b: string, label: LStr) =>
    (adj.get(a) ?? adj.set(a, []).get(a)!).push({ id: b, label });
  for (const c of COMPANIES)
    for (const r of c.rel ?? []) {
      push(c.id, r.to, r.label);
      push(r.to, c.id, r.label);
    }
  return adj;
}

export function rankAlters(ids: { id: string }[], max = 8) {
  return [...ids]
    .sort(
      (a, b) =>
        Number(isTW(b.id)) - Number(isTW(a.id)) ||
        degree(b.id) - degree(a.id) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, max);
}
```

```ts
// polar fan: 300° sweep, gap at bottom (breadcrumb slot)
export function layoutBranches(n: number, r = 140) {
  return Array.from({ length: n }, (_, i) => {
    const a = (-150 + (300 / Math.max(1, n - 1)) * i) * (Math.PI / 180);
    return { x: Math.sin(a) * r, y: -Math.cos(a) * r, side: Math.sin(a) < 0 ? 'l' : 'r' };
  });
}
```

```ts
// pivot state (single context in the explorer island)
interface BranchState {
  trail: string[];
} // trail.at(-1) = current ego
const pivot = (id: string) => setTrail((t) => [...t, id]);
const jumpBack = (i: number) => setTrail((t) => t.slice(0, i + 1));
```

Rendering: SVG lines + HTML chips (crisp text), portal into the stage layer,
fadeUp with Phase 05 motion tokens. Unit-test `layoutBranches` (no overlap at
n=8) and `rankAlters` ordering.
