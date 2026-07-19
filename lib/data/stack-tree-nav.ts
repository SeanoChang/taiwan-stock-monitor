// Reverse-index / re-root utilities over `lib/data/stack-tree.ts`'s
// axis-tagged, multi-parent node graph (Plan 006 Phase G Task 2; design spec
// `docs/superpowers/specs/2026-07-18-ai-server-stack-multi-axis-tree-design.md`
// §3, §5). Pure — no DOM/WebGL — shared by the `/stack` explorer island
// (Task 3+) AND `scripts/check-tree.ts` (the `pnpm check:tree` integrity
// gate), same layering discipline as `lib/data/adjacency.ts` /
// `scripts/check-branches.ts` for the ego-network graph.
//
// A node's "parents on axis X" = whoever holds an *outgoing* edge tagged X
// that points at it (edges live on the source node, see `StackNode.edges`).
// Re-rooting onto a node = read its `childrenOf(axis, id)`; cross-axis jump
// (spec §5) = keep the node id, swap axis, re-derive parents/children from
// the new axis's index — the id itself never changes.

import { STACK_NODES, type Axis, type StackNode } from '@/lib/data/stack-tree';

/** id → StackNode, O(1) lookup — every node panel/breadcrumb/mini-map reads through this. */
export const NODE_MAP: Record<string, StackNode> = Object.fromEntries(
  STACK_NODES.map((n) => [n.id, n]),
);

interface AxisIndex {
  /** parent id -> ordered child ids (edge declaration order) */
  children: Map<string, string[]>;
  /** child id -> parent ids (reverse of `children`; usually one entry, a node can have >1 parent on an axis) */
  parents: Map<string, string[]>;
}

/** Build the forward + reverse adjacency for one axis by scanning every node's outgoing edges once. */
function buildAxisIndex(axis: Axis): AxisIndex {
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  for (const node of STACK_NODES) {
    for (const edge of node.edges) {
      if (edge.axis !== axis) continue;
      const kids = children.get(node.id);
      if (kids) kids.push(edge.to);
      else children.set(node.id, [edge.to]);
      const pars = parents.get(edge.to);
      if (pars) pars.push(node.id);
      else parents.set(edge.to, [node.id]);
    }
  }
  return { children, parents };
}

// Each axis's index is built at most once (module-level cache) — "reverse +
// forward index built once per axis" per the Task 2 brief — and reused by
// every subsequent call, however many nodes get visited during a session.
const AXIS_CACHE = new Map<Axis, AxisIndex>();
function indexFor(axis: Axis): AxisIndex {
  let idx = AXIS_CACHE.get(axis);
  if (!idx) {
    idx = buildAxisIndex(axis);
    AXIS_CACHE.set(axis, idx);
  }
  return idx;
}

/** Direct children of `id` on `axis` — `id`'s own outgoing edges filtered to `axis`, in edge order. Re-root = this. */
export function childrenOf(axis: Axis, id: string): string[] {
  return indexFor(axis).children.get(id) ?? [];
}

/** Direct parents of `id` on `axis` — every node with an outgoing `axis` edge that targets `id`. */
export function parentsOf(axis: Axis, id: string): string[] {
  return indexFor(axis).parents.get(id) ?? [];
}

/**
 * Root nodes of `axis`: nodes that participate in the axis (appear as an
 * edge endpoint, source or target) but have no parent on it. A node with no
 * edge tagged `axis` anywhere isn't part of that axis's tree at all, so it's
 * excluded rather than counted as a trivial one-node root.
 */
export function rootsOf(axis: Axis): string[] {
  const { children, parents } = indexFor(axis);
  const participants = new Set<string>();
  for (const id of children.keys()) participants.add(id);
  for (const id of parents.keys()) participants.add(id);
  return [...participants].filter((id) => !parents.has(id));
}

/**
 * Breadcrumb ancestors for `id` on `axis`, root-first, ending with `id`
 * itself — "the first path" per the Task 2 brief: each hop takes
 * `parentsOf(axis, cur)[0]` (a node can have >1 parent on an axis; this walks
 * one deterministic chain rather than branching). Cycle-safe: stops if a
 * node would be revisited instead of looping forever.
 */
export function pathTo(axis: Axis, id: string): string[] {
  const path = [id];
  const seen = new Set([id]);
  let cur = id;
  for (;;) {
    const [parent] = parentsOf(axis, cur);
    if (!parent || seen.has(parent)) break;
    path.unshift(parent);
    seen.add(parent);
    cur = parent;
  }
  return path;
}

export interface StackTreeNode {
  id: string;
  children: StackTreeNode[];
}

/**
 * Nested tree for `axis`'s mini-map drawer: one `StackTreeNode` per entry in
 * `rootsOf(axis)`, recursively expanded via `childrenOf`. Cycle-safe: a node
 * already on the current root-to-here path renders as a childless leaf
 * instead of recursing forever — the data is a DAG by construction on each
 * axis (see `scripts/check-tree.ts`), but this guards the util itself.
 */
export function treeFor(axis: Axis): StackTreeNode[] {
  const build = (id: string, ancestors: ReadonlySet<string>): StackTreeNode => {
    if (ancestors.has(id)) return { id, children: [] };
    const nextAncestors = new Set(ancestors).add(id);
    return { id, children: childrenOf(axis, id).map((c) => build(c, nextAncestors)) };
  };
  return rootsOf(axis).map((id) => build(id, new Set()));
}
