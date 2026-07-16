// Pure graph model for the supply-chain network: node/link construction,
// stage color groups (validated categorical palette for the navy surface)
// and the simulation world constants. No React, safe anywhere.

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

// simulation world
export const WORLD = { w: 2600, h: 1500 };
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

export const stageX = (s: StageId) =>
  s === 'anchor' ? 1350 : 170 + STAGE_ORDER.indexOf(s) * (2260 / 8);
export const stageY = (s: StageId) => (s === 'anchor' ? 190 : WORLD.h / 2 + 60);

export interface GNode {
  id: string;
  kind: 'company' | 'hub';
  stage: StageId;
  group: number;
  r: number;
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

export interface GraphModel {
  nodes: GNode[];
  links: GLink[];
  adjacency: Map<string, Set<string>>;
}

export const hubId = (catId: string) => `cat:${catId}`;
export const isHubId = (id: string) => id.startsWith('cat:');

export function buildGraphModel(): GraphModel {
  const inboundCount = new Map<string, number>();
  for (const c of COMPANIES)
    for (const r of c.rel ?? []) inboundCount.set(r.to, (inboundCount.get(r.to) ?? 0) + 1);

  const nodes: GNode[] = [];
  for (const cat of CATEGORIES) {
    nodes.push({
      id: hubId(cat.id),
      kind: 'hub',
      stage: cat.stage,
      group: STAGE_GROUP[cat.stage],
      r: 13,
      nameEn: cat.name,
      nameZh: cat.zh,
      tw: cat.stage !== 'anchor',
      x: stageX(cat.stage) + (Math.random() - 0.5) * 220,
      y: stageY(cat.stage) + (Math.random() - 0.5) * 420,
    });
  }
  for (const c of COMPANIES) {
    const degree = (c.rel?.length ?? 0) + (inboundCount.get(c.id) ?? 0);
    const stage = CATEGORY_MAP[c.cat].stage;
    nodes.push({
      id: c.id,
      kind: 'company',
      stage,
      group: STAGE_GROUP[stage],
      r: Math.min(11, 4.5 + degree * 0.55),
      nameEn: c.name,
      nameZh: c.zh ?? c.name,
      ticker: c.ticker,
      tw: c.exch === 'TWSE' || c.exch === 'TPEx',
      x: stageX(stage) + (Math.random() - 0.5) * 260,
      y: stageY(stage) + (Math.random() - 0.5) * 520,
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

  const adjacency = new Map<string, Set<string>>();
  const connect = (a: string, b: string) => {
    (adjacency.get(a) ?? adjacency.set(a, new Set()).get(a)!).add(b);
  };
  for (const link of links) {
    const s = typeof link.source === 'string' ? link.source : link.source.id;
    const t = typeof link.target === 'string' ? link.target : link.target.id;
    connect(s, t);
    connect(t, s);
  }
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
