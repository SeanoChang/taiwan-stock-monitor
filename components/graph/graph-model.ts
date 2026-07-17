// Pure graph model for the supply-chain network: node/link construction,
// stage color groups (validated categorical palette for the navy surface),
// node sizing and the deterministic seed layout. No React, safe anywhere.

import { CATEGORIES, CATEGORY_MAP, COMPANIES } from '@/lib/data/supply-chain';
import type { StageId } from '@/lib/data/supply-chain';
import { l } from '@/lib/i18n/config';
import type { LStr } from '@/lib/i18n/config';

export const ACCENT = '#ffb703';
export const INK = '#eef4fb';

/** stage → color group (materials+wafer share a slot; anchors are neutral) */
export const STAGE_GROUP: Record<StageId, number> = {
  materials: 0,
  wafer: 0,
  fabsupport: 1,
  chip: 2,
  package: 3,
  board: 4,
  subsystem: 5,
  system: 6,
  cloud: 7,
  anchor: 8,
};

/** 8 chromatic slots validated (CVD + contrast) against #0d1b2a, + neutral */
export const PALETTE = [
  '#3987e5',
  '#008300',
  '#d55181',
  '#c98500',
  '#199e70',
  '#d95926',
  '#9085e9',
  '#e66767',
  '#8a94a0',
];

export const GROUP_LABELS: LStr[] = [
  l('Materials & Wafers', '材料／晶圓'),
  l('Equipment & Fab', '設備廠務'),
  l('Chip Design & Fab', '晶片設計製造'),
  l('Package & Test', '封裝測試'),
  l('Boards & Passives', '電路板／被動元件'),
  l('Server Subsystems', '伺服器子系統'),
  l('Systems', '系統整合'),
  l('Network & Cloud', '網路雲端'),
  l('Global Anchors', '全球夥伴'),
];

const STAGE_ORDER: StageId[] = [
  'materials',
  'fabsupport',
  'wafer',
  'chip',
  'package',
  'board',
  'subsystem',
  'system',
  'cloud',
];

/** stage lanes, centred on the world origin so both layout modes share (0,0) */
export const stageX = (s: StageId) =>
  s === 'anchor' ? 0 : -1130 + STAGE_ORDER.indexOf(s) * (2260 / 8);
export const stageY = (s: StageId) => (s === 'anchor' ? -620 : 0);

export interface GNode {
  id: string;
  kind: 'company' | 'hub';
  stage: StageId;
  group: number;
  /** link endpoints touching this node — d3 forceLink `count` semantics */
  deg: number;
  r: number;
  /** eased hover-dim level, 1 = undimmed */
  fade: number;
  nameEn: string;
  nameZh: string;
  ticker?: string;
  tw: boolean;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface GLink {
  kind: 'rel' | 'member' | 'feed';
  source: GNode | string;
  target: GNode | string;
}

/** the highlight channels the renderer reads; owned by the graph surface */
export interface HighlightState {
  selection: string | null;
  matches: Set<string> | null;
  groupFilter: number | null;
}

export interface GraphModel {
  nodes: GNode[];
  links: GLink[];
  adjacency: Map<string, Set<string>>;
}

export const hubId = (catId: string) => `cat:${catId}`;
export const isHubId = (id: string) => id.startsWith('cat:');

const SIZE_MULT: Record<GNode['kind'], number> = { hub: 1.35, company: 1 };
const nodeRadius = (kind: GNode['kind'], deg: number) =>
  SIZE_MULT[kind] * Math.max(8, Math.min(3 * Math.sqrt(deg + 1), 30));

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** seeded disk, uniform by area (~60×60 of room per node) — sqrt keeps nodes
 *  from bunching at the centre, which is what makes the cold start explode */
function seedPositions(nodes: GNode[]) {
  const rand = mulberry32(0x5eed);
  const seedR = Math.sqrt((3600 * nodes.length) / Math.PI);
  for (const n of nodes) {
    const a = 2 * Math.PI * rand();
    const d = Math.sqrt(rand()) * seedR;
    n.x = d * Math.cos(a);
    n.y = d * Math.sin(a);
    n.vx = 0;
    n.vy = 0;
  }
}

export function buildGraphModel(): GraphModel {
  const nodes: GNode[] = [];
  for (const cat of CATEGORIES) {
    nodes.push({
      id: hubId(cat.id),
      kind: 'hub',
      stage: cat.stage,
      group: STAGE_GROUP[cat.stage],
      deg: 0,
      r: 0,
      fade: 1,
      nameEn: cat.name,
      nameZh: cat.zh,
      tw: cat.stage !== 'anchor',
      x: 0,
      y: 0,
    });
  }
  for (const c of COMPANIES) {
    const stage = CATEGORY_MAP[c.cat].stage;
    nodes.push({
      id: c.id,
      kind: 'company',
      stage,
      group: STAGE_GROUP[stage],
      deg: 0,
      r: 0,
      fade: 1,
      nameEn: c.name,
      nameZh: c.zh ?? c.name,
      ticker: c.ticker,
      tw: c.exch === 'TWSE' || c.exch === 'TPEx',
      x: 0,
      y: 0,
    });
  }

  const links: GLink[] = [];
  for (const c of COMPANIES) {
    links.push({ kind: 'member', source: c.id, target: hubId(c.cat) });
    for (const r of c.rel ?? []) links.push({ kind: 'rel', source: c.id, target: r.to });
  }
  for (const cat of CATEGORIES)
    for (const f of cat.feeds) {
      links.push({ kind: 'feed', source: hubId(cat.id), target: hubId(f) });
    }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Set<string>>();
  const connect = (a: string, b: string) => {
    (adjacency.get(a) ?? adjacency.set(a, new Set()).get(a)!).add(b);
  };
  for (const link of links) {
    const s = typeof link.source === 'string' ? link.source : link.source.id;
    const t = typeof link.target === 'string' ? link.target : link.target.id;
    const sn = byId.get(s);
    const tn = byId.get(t);
    if (sn) sn.deg += 1;
    if (tn) tn.deg += 1;
    connect(s, t);
    connect(t, s);
  }
  for (const n of nodes) n.r = nodeRadius(n.kind, n.deg);
  seedPositions(nodes);

  return { nodes, links, adjacency };
}

/** search across company + category names/tickers/roles, both languages */
export function searchIds(query: string): Set<string> {
  const zhq = query.trim();
  const q = zhq.toLowerCase();
  const out = new Set<string>();
  if (!q) return out;
  for (const c of COMPANIES) {
    const cat = CATEGORY_MAP[c.cat];
    if (
      c.name.toLowerCase().includes(q) ||
      (c.zh ?? '').includes(zhq) ||
      c.ticker.toLowerCase().includes(q) ||
      c.role.en.toLowerCase().includes(q) ||
      c.role.zh.includes(zhq) ||
      cat.name.toLowerCase().includes(q) ||
      cat.zh.includes(zhq)
    )
      out.add(c.id);
  }
  for (const cat of CATEGORIES) {
    if (cat.name.toLowerCase().includes(q) || cat.zh.includes(zhq)) out.add(hubId(cat.id));
  }
  return out;
}
