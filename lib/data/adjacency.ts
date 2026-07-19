// Company-to-company adjacency built from the supply-chain dataset's `rel`
// edges (Plan 006 Phase E). Pure, no DOM/WebGL — shared by the explorer's
// branch-overlay island AND scripts/check-branches.ts. Layer hygiene: this
// is the one place the ego-network graph lives; the explorer must depend on
// THIS module, never on components/graph/* (that stays the full-graph
// deep-dive surface, see app/supply-chain/page.tsx).
//
// See scripts/check-branches.ts for the integrity gate (pnpm check:branches)
// and docs/superpowers/apple-redesign/04-supplier-branches/ for the design
// contract this seed implements.

import { COMPANIES, COMPANY_MAP } from '@/lib/data/supply-chain';
import type { LStr } from '@/lib/i18n/config';

export interface Alter {
  id: string;
  label: LStr;
}

/** Undirected adjacency: for every `rel` edge a→b, both a∈adj(b) and b∈adj(a). */
export function buildAdjacency(): Map<string, Alter[]> {
  const adj = new Map<string, Alter[]>();
  const push = (a: string, b: string, label: LStr) => {
    const arr = adj.get(a) ?? (adj.set(a, []), adj.get(a)!);
    if (!arr.some((x) => x.id === b)) arr.push({ id: b, label });
  };
  for (const c of COMPANIES) {
    for (const r of c.rel ?? []) {
      push(c.id, r.to, r.label);
      push(r.to, c.id, r.label);
    }
  }
  return adj;
}

export const ADJ = buildAdjacency();

const degree = (id: string) => ADJ.get(id)?.length ?? 0;
const isTW = (id: string) => {
  const c = COMPANY_MAP[id];
  return !!c && (c.exch === 'TWSE' || c.exch === 'TPEx');
};

/** Rank alters TW-listed first, then by degree (well-connected first), then alpha id. */
export function rankAlters(alters: Alter[], max = 8): Alter[] {
  return [...alters]
    .sort(
      (a, b) =>
        Number(isTW(b.id)) - Number(isTW(a.id)) ||
        degree(b.id) - degree(a.id) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, max);
}

export interface BranchPoint {
  x: number;
  y: number;
  side: 'l' | 'r';
}

/**
 * Polar fan layout for the ego-network overlay: `n` points swept across
 * 300° (gap at the bottom for the breadcrumb slot), radius `r`.
 */
export function layoutBranches(n: number, r = 140): BranchPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (-150 + (300 / Math.max(1, n - 1)) * i) * (Math.PI / 180);
    return { x: Math.sin(a) * r, y: -Math.cos(a) * r, side: Math.sin(a) < 0 ? 'l' : 'r' };
  });
}
