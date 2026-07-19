// Data-integrity gate for lib/data/stack-tree.ts (Plan 006 Phase G Task 2;
// design spec `docs/superpowers/specs/2026-07-18-ai-server-stack-multi-axis-
// tree-design.md` §8). Verifies every id `StackNode`s reference resolves in
// `supply-chain.ts`, the §6 honesty invariant holds on every edge, node ids
// are unique, there's no self-edge, and the `containment` axis is a single
// tree with no orphan. Run: pnpm check:tree

import { STACK_NODES } from '../lib/data/stack-tree';
import { rootsOf, childrenOf } from '../lib/data/stack-tree-nav';
import { COMPANIES } from '../lib/data/supply-chain/companies';
import { CATEGORIES } from '../lib/data/supply-chain/categories';
import { STAGES } from '../lib/data/supply-chain/stages';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

const COMPANY_IDS = new Set(COMPANIES.map((c) => c.id));
const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const STAGE_IDS = new Set<string>(STAGES.map((s) => s.id));
const NODE_IDS = new Set(STACK_NODES.map((n) => n.id));

let edgeCount = 0;

// 1. node ids unique
const seenNode = new Set<string>();
for (const n of STACK_NODES) {
  if (seenNode.has(n.id)) err(`duplicate node id: ${n.id}`);
  seenNode.add(n.id);
}

for (const n of STACK_NODES) {
  // 2. companyId ∈ dataset
  for (const cid of n.companyIds ?? []) {
    if (!COMPANY_IDS.has(cid)) err(`node ${n.id}: unknown companyId "${cid}"`);
  }
  // 3. categoryId ∈ CATEGORIES
  if (n.categoryId !== undefined && !CATEGORY_IDS.has(n.categoryId)) {
    err(`node ${n.id}: unknown categoryId "${n.categoryId}"`);
  }
  // 4. stageId ∈ StageId
  if (n.stageId !== undefined && !STAGE_IDS.has(n.stageId)) {
    err(`node ${n.id}: unknown stageId "${n.stageId}"`);
  }

  for (const e of n.edges) {
    edgeCount++;
    // 5. edge.to ∈ STACK_NODES
    if (!NODE_IDS.has(e.to)) err(`node ${n.id}: edge → unknown node "${e.to}" (axis ${e.axis})`);
    // 6. no self-edge
    if (e.to === n.id) err(`node ${n.id}: self-edge (axis ${e.axis})`);
    // 7. honesty invariant — both directions
    const expected = e.confidence === 'verified';
    if (e.actionable !== expected) {
      err(
        `node ${n.id} → ${e.to} (axis ${e.axis}): actionable=${e.actionable} but confidence="${e.confidence}" (expected actionable===${expected})`,
      );
    }
  }
}

// 8. containment axis: ≥1 root, every participant reachable from a root (no orphan)
const containmentRoots = rootsOf('containment');
if (containmentRoots.length === 0) {
  err('containment axis: no root found (every node has a parent — cycle or empty axis?)');
} else {
  const reached = new Set<string>();
  const stack = [...containmentRoots];
  while (stack.length) {
    const id = stack.pop()!;
    if (reached.has(id)) continue;
    reached.add(id);
    for (const c of childrenOf('containment', id)) stack.push(c);
  }
  // Every node that participates in the containment axis (has a containment
  // edge in or out) must be in that reachable set — anything else is an
  // orphan hanging off no root.
  const participants = new Set<string>(containmentRoots);
  for (const n of STACK_NODES) {
    for (const e of n.edges) {
      if (e.axis !== 'containment') continue;
      participants.add(n.id);
      participants.add(e.to);
    }
  }
  for (const id of participants) {
    if (!reached.has(id))
      err(`containment axis: node "${id}" is unreachable from any root (orphan)`);
  }
}

if (errors.length) {
  console.error(`✗ stack-tree: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ stack-tree OK — ${STACK_NODES.length} nodes, ${edgeCount} edges`);
