// Force rig for the supply-chain graph and its two discrete layout modes:
// 'free' lets the web float (stage stays encoded by colour), 'chain' pins nodes
// into stage lanes. No React, no canvas — the hook owns ticking.

import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import type { Simulation } from 'd3-force';
import { stageX, stageY } from '@/components/graph/graph-model';
import type { GLink, GNode } from '@/components/graph/graph-model';

export type LayoutMode = 'free' | 'chain';

type SimLink = GLink & { index?: number };
export type GraphSimulation = Simulation<GNode, SimLink>;

/** ticks run before the first fit(): the extent is within 3% of final here, so
 *  the camera can be fixed once and the rest of the bloom animates in frame */
export const WARMUP_TICKS = 60;
/** alpha a drag holds the web at */
export const DRAG_ALPHA = 0.3;
/** a layout swap is a re-arrangement, not a cold start */
export const LAYOUT_ALPHA = 0.5;

const LINK_DISTANCE: Record<GLink['kind'], number> = { member: 120, rel: 250, feed: 400 };
/** multipliers on d3's degree-normalised strength. `feed` gets 2.0 because the
 *  normalisation divides it by a hub degree that is mostly `member` links. */
const LINK_MULT: Record<GLink['kind'], number> = { member: 1, rel: 1, feed: 2 };

const layoutX = (mode: LayoutMode) =>
  mode === 'chain'
    ? forceX<GNode>((d) => stageX(d.stage)).strength(0.45)
    : forceX<GNode>(0).strength(0.1);
const layoutY = (mode: LayoutMode) =>
  mode === 'chain'
    ? forceY<GNode>((d) => stageY(d.stage)).strength(0.16)
    : forceY<GNode>(0).strength(0.1);

export function createSimulation(
  nodes: GNode[],
  links: GLink[],
  mode: LayoutMode,
): GraphSimulation {
  const linkForce = forceLink<GNode, SimLink>(links as SimLink[])
    .id((d) => d.id)
    .distance((lk) => LINK_DISTANCE[lk.kind]);
  // capture d3's degree-normalised default before overriding, then multiply it:
  // degree acts as mass, so hubs stay put and satellites orbit them
  const baseStrength = linkForce.strength();
  linkForce.strength((lk, i, ls) => LINK_MULT[lk.kind] * baseStrength(lk, i, ls));

  // insertion order is load-bearing — d3 applies forces in insertion order
  return forceSimulation<GNode, SimLink>(nodes)
    .force('x', layoutX(mode))
    .force('y', layoutY(mode))
    .force('link', linkForce)
    .force('charge', forceManyBody<GNode>().strength(-1000).theta(0.9))
    .force('collide', forceCollide<GNode>(60).strength(0.5).iterations(1))
    .velocityDecay(0.4)
    .alphaMin(0.001)
    .alphaDecay(1 - Math.pow(0.001, 1 / 300))
    .alpha(1)
    .alphaTarget(0)
    .stop();
}

/** swap the positioning forces in place; re-setting a name keeps its slot in
 *  d3's insertion order, so the rig stays [x, y, link, charge, collide] */
export function applyLayout(simulation: GraphSimulation, mode: LayoutMode): void {
  simulation.force('x', layoutX(mode)).force('y', layoutY(mode));
}

/** raise alpha, never lower it — assigning would cool a sim that is still hot */
export function reheat(simulation: GraphSimulation, a: number): void {
  if (simulation.alpha() < a) simulation.alpha(a);
}

/** manual tick() never enforces alphaMin, so this is the only stop condition */
export const isHot = (simulation: GraphSimulation): boolean =>
  simulation.alpha() > simulation.alphaMin() || simulation.alphaTarget() > simulation.alphaMin();
