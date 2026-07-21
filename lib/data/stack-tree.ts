// Stack tree — multi-axis, multi-parent node graph for the /stack explorer
// (Plan 006 Phase G; design spec `docs/superpowers/specs/2026-07-18-ai-server-
// stack-multi-axis-tree-design.md` §3–§6). Nodes *reference* existing
// `lib/data/supply-chain.ts` ids (company / category / stage) — zero
// duplication, live quotes for free (design decision 5).
//
// Seed sources:
//  - `docs/superpowers/ai-server-stack/data-stack-tree-taxonomy.md` — the
//    node → category → company table. Each row below is one `StackNode`.
//  - `docs/superpowers/ai-server-stack/tree-website-navigation-map.md` — the
//    containment tree + per-line `[✓]`/`[s]`/`[?]` verification tiers.
//
// Honesty invariant (spec §6): `edge.actionable === (edge.confidence ===
// 'verified')` on every edge, enforced structurally below by the `edgeTo()`
// builder (never set by hand). ALL nodes under `gpu.substrate.*` and
// `upstream`/`up.*` are `sourced`/`gap` — the 2026-07-18 upstream expansion's
// adversarial-verify pass was cut short by a model limit (nav-map header,
// spec §6) — never `verified`, regardless of how well-known the underlying
// physics is. The `verified` ✓ tier is only the rack → tray → package →
// datapath spine carried over from the earlier verified docs.
//
// `lib/data/stack-tree-nav.ts` (Task 2) builds the reverse index (axis, node)
// → parents that powers re-rooting; `scripts/check-tree.ts` (Task 2) is the
// `pnpm check:tree` integrity gate — id resolution, the actionable
// biconditional, and containment reachability.

import { l, type LStr } from '@/lib/i18n/config';
import { STAGES } from '@/lib/data/supply-chain/stages';

export type Axis = 'containment' | 'flow:data' | 'flow:power' | 'flow:heat' | 'subsystem' | 'stage';

export type Confidence = 'verified' | 'sourced' | 'gap'; // ✓ / ※ / ？

export interface StackEdge {
  to: string; // StackNode id
  axis: Axis;
  confidence: Confidence;
  sourceUrl?: string;
  actionable: boolean; // === (confidence === 'verified'); see edgeTo()
  flowSpec?: { value: number; unit: string; label: LStr }; // flow-axis overlay (Task 5)
}

export interface StackSpec {
  value: string;
  unit?: string;
  confidence: Confidence;
  sourceUrl?: string;
}

export interface StackNode {
  id: string; // stable, URL-safe: 'gpu.substrate.tglass', 'up.litho'
  name: LStr;
  blurb: LStr;
  edges: StackEdge[]; // outgoing, multi-axis — the multi-parent graph lives here
  companyIds?: string[]; // → supply-chain.ts COMPANIES (live quotes)
  categoryId?: string; // → supply-chain.ts CATEGORY_MAP
  stageId?: string; // → supply-chain.ts StageId (drives the `stage` axis)
  specs?: StackSpec[];
}

// ---------------------------------------------------------------------------
// Source-doc citations (repo-relative — these two markdown files ARE the
// primary source; there are no external URLs to cite, see doc audit note in
// the Task 1 report).
// (data-stack-tree-taxonomy.md is the node→category→company table this file
// was authored from; every node/company/category mapping traces back to it,
// but nothing here needs a *per-edge* citation distinct from the nav-map's
// containment/verification-tier tags below, so only the latter is cited.)
const SRC_NAVMAP = 'docs/superpowers/ai-server-stack/tree-website-navigation-map.md';
const SRC_SPEC = 'docs/superpowers/specs/2026-07-18-ai-server-stack-multi-axis-tree-design.md';
// Task 5 (flow axes) additions cite the two dedicated verified-flow research
// runs directly, same "earlier verified docs" tier as the rack/GPU-internal
// spine (spec §6's honesty carve-out — NOT the 2026-07-18 upstream
// expansion): `research-verified-gpu-hbm-packaging-interconnect.md` for
// `flow:data`, `research-verified-rack-power-cooling.md` for
// `flow:power`/`flow:heat`.
const SRC_GPU_HBM =
  'docs/superpowers/ai-server-stack/research-verified-gpu-hbm-packaging-interconnect.md';
const SRC_RACK_POWER = 'docs/superpowers/ai-server-stack/research-verified-rack-power-cooling.md';
// Plan 007 (latest-gen modernization): Rubin generation, GPU microarchitecture
// and the full board-silicon complement all cite the latest-gen research run.
// Tier `[s] sourced` (each claim URL-backed, not yet adversarially re-voted) —
// so every node this constant sources is `sourced`/`gap`, never `verified`.
const SRC_LATEST =
  'docs/superpowers/ai-server-stack/research-verified-latest-gen-gpu-internals-chips.md';

// ---------------------------------------------------------------------------
// Per-node base confidence tier — the single source of truth `edgeTo()` reads
// from, so every edge that targets a node (containment/subsystem/stage) can
// never drift from that node's own verification tier. Derived from the
// nav-map's per-line `[✓]`/`[s]`/`[?]` tag; rack.copper's line carries an
// explicit `[✓]` on the *structure* with only the trailing "★…／…[?]" aside
// (a plausible TW company name, unconfirmed) flagged uncertain — treated as
// verified. rack.rails' line has no `[✓]` at all (see NODE_TIER below), so
// it is NOT part of that pattern and stays at `sourced`.
const NODE_TIER: Record<string, Confidence> = {
  // verified — rack → tray → package → datapath spine (earlier verified docs)
  dc: 'verified',
  rack: 'verified',
  'rack.tray': 'verified',
  'rack.tray.grace': 'verified',
  'rack.tray.gpu': 'verified',
  'rack.tray.nic': 'verified',
  'rack.tray.bmc': 'verified',
  'rack.tray.pdb': 'verified',
  'rack.switchtray': 'verified',
  'rack.powershelf': 'verified',
  'rack.busbar': 'verified',
  'gpu.die': 'verified',
  'gpu.hbm': 'verified',
  'gpu.cowos': 'verified',
  'gpu.internal.sm': 'verified',
  'gpu.internal.memctrl': 'verified',
  // sourced — GB300 on-die microarchitecture (Plan 007; latest-gen research
  // `[s]`). NOT verified: it is not part of the original verified spine, per
  // the file-header honesty carve-out. Existing gpu.internal.sm/memctrl stay
  // verified (datapath spine). Rubin per-SM internals are `gap` (Task 2).
  'gpu.internal.gpc': 'sourced',
  'gpu.internal.tpc': 'sourced',
  'gpu.internal.sm.warp': 'sourced',
  'gpu.internal.sm.regfile': 'sourced',
  'gpu.internal.sm.l1': 'sourced',
  'gpu.internal.sm.tensor': 'sourced',
  'gpu.internal.sm.tmem': 'sourced',
  'gpu.internal.l2': 'sourced',
  // sourced — Vera Rubin NVL72 delta layer (Plan 007; latest-gen research
  // `[s]`, volume 2H2026). Rubin-internal per-SM counts + the roadmap tiers
  // are undisclosed/future → `gap`.
  'rack.rubin': 'sourced',
  'rubin.gpu': 'sourced',
  'rubin.hbm': 'sourced',
  'rubin.vera': 'sourced',
  'rubin.nvswitch': 'sourced',
  'rubin.cx9': 'sourced',
  'rubin.bf4': 'sourced',
  'rubin.socamm': 'sourced',
  'rubin.gpu.sm': 'gap',
  'rubin.roadmap': 'gap',
  'rubin.cpx': 'gap',
  'rubin.ultra': 'gap',
  'rubin.feynman': 'gap',
  'net.scaleup': 'verified',
  'net.scaleout': 'verified',
  'power.chain': 'verified',
  'heat.chain': 'verified',
  // rack.cooling / rack.copper: nav-map tags the manifold/cable *structure*
  // [✓], and the named companies (avc/auras/kaori/fositek, bizlink) already
  // carry confirmed `rel` edges to nvidia/wiwynn/quanta elsewhere in
  // supply-chain.ts — treated as verified.
  'rack.cooling': 'verified',
  'rack.copper': 'verified',
  // rack.rails: nav-map line 40 ('滑軌/機構（★川湖/勤誠 [?]）') carries ONLY
  // [?] — no [✓] appears on this line at all, unlike its rack.cooling/
  // rack.copper/rack.powershelf/etc. siblings — so the structural fact
  // itself, not just the supplier attribution, is unconfirmed. `sourced`
  // per the Task 1 mapping rule ([✓]→verified / [s]→sourced / [?]→gap),
  // rounded up from gap since a rail/chassis subsystem existing on the rack
  // is a reasonable structural inference even though the doc itself never
  // marks it confirmed.
  'rack.rails': 'sourced',

  // sourced — the 2026-07-18 upstream/substrate expansion (nav-map [s]) and
  // the optics/CPO branch (nav-map [s]); never verified per spec §6.
  'gpu.substrate': 'sourced',
  'gpu.substrate.tglass': 'sourced',
  'gpu.substrate.drill': 'sourced',
  'gpu.substrate.equip': 'sourced',
  'gpu.pkgmat.lid': 'sourced',
  'gpu.pkgmat.mold': 'sourced',
  'net.optics': 'sourced',
  'net.optics.cpo': 'sourced',
  'mem.tiers': 'sourced',
  upstream: 'sourced',
  'up.wafer': 'sourced',
  'up.mask': 'sourced',
  'up.litho': 'sourced',
  'up.etch': 'sourced',
  'up.depo': 'sourced',
  'up.clean.cmp': 'sourced',
  'up.testlab': 'sourced',
  'up.beol': 'sourced',
  'up.recycle': 'sourced',
  'up.glasspkg': 'sourced',

  // gap — structural "no Taiwan hook" link (spec §7 §E): Ajinomoto's ABF
  // build-up film has no TW-listed alternative.
  'gpu.substrate.film': 'gap',

  // verified — Task 5 flow-only waypoint nodes (below): each line in the
  // nav-map's dedicated flow-view sections ("電力鏈 ─ flow view [✓]",
  // "散熱鏈 ─ flow view [✓]", the GPU-internal datapath bullets) carries an
  // explicit [✓] tag, same earlier-verified-doc tier as the rack/GPU-internal
  // spine above — these are NOT part of the 2026-07-18 upstream expansion.
  // `flow.heat.cdu`'s own *type* (immersion vs. plate) is flagged [?] in the
  // doc — that uncertainty is carried in its `blurb`, not its tier, mirroring
  // how `rack.rails` already separates "structure confirmed" from "detail
  // unconfirmed".
  'flow.data.nvhbi': 'verified',
  'flow.power.grid': 'verified',
  'flow.heat.coldplate': 'verified',
  'flow.heat.cdu': 'verified',
  'flow.heat.facility': 'verified',
};

/** Build an outgoing edge; confidence is read from the TARGET's declared
 * tier, so `actionable` can never disagree with `confidence` (honesty
 * invariant, spec §6) and no edge can silently point at an undeclared node.
 * `flowSpec` (Task 5) is optional and orthogonal to confidence — it's the
 * per-hop bandwidth/volt/°C label the flow-axis overlay renders, not a
 * provenance claim of its own; a hop with no sourced number simply omits it
 * rather than fabricating one (see the flow-edge calls below, several of
 * which deliberately pass none). */
function edgeTo(
  to: string,
  axis: Axis,
  sourceUrl?: string,
  flowSpec?: StackEdge['flowSpec'],
): StackEdge {
  const confidence = NODE_TIER[to];
  if (!confidence) {
    throw new Error(`stack-tree: edgeTo("${to}") — no NODE_TIER entry for "${to}"`);
  }
  return { to, axis, confidence, actionable: confidence === 'verified', sourceUrl, flowSpec };
}

const spec = (
  value: string,
  confidence: Confidence,
  opts?: { unit?: string; sourceUrl?: string },
): StackSpec => ({ value, confidence, unit: opts?.unit, sourceUrl: opts?.sourceUrl ?? SRC_NAVMAP });

// ---------------------------------------------------------------------------
// Taxonomy-row nodes — one per `data-stack-tree-taxonomy.md` table row.
// `edges` on each node are its CONTAINMENT children per the nav-map tree.
const CONTAINMENT_NODES: StackNode[] = [
  {
    id: 'dc',
    name: l('AI Data Center', '資料中心'),
    blurb: l(
      'The cloud/telecom operators standing up GB300 NVL72 racks.',
      '部署 GB300 NVL72 機櫃的雲端／電信營運商。',
    ),
    categoryId: 'telecom',
    companyIds: ['chtel', 'twm'],
    stageId: 'cloud',
    edges: [
      edgeTo('rack', 'containment', SRC_NAVMAP),
      edgeTo('rack.rubin', 'containment', SRC_LATEST),
    ],
  },
  {
    id: 'rack',
    name: l('GB300 NVL72 Rack', '機櫃 NVL72'),
    blurb: l(
      '48U MGX liquid-cooled rack, 120→155kW peak — assembled by Taiwan ODMs.',
      '48U MGX 液冷機櫃，120→155kW 尖峰功耗 — 由台灣 ODM 組裝。',
    ),
    categoryId: 'odm',
    companyIds: ['foxconn', 'quanta', 'wiwynn'],
    stageId: 'system',
    specs: [spec('48U MGX, 120→155kW peak', 'verified')],
    edges: [
      edgeTo('rack.tray', 'containment', SRC_NAVMAP),
      edgeTo('rack.switchtray', 'containment', SRC_NAVMAP),
      edgeTo('rack.powershelf', 'containment', SRC_NAVMAP),
      edgeTo('rack.busbar', 'containment', SRC_NAVMAP),
      edgeTo('rack.cooling', 'containment', SRC_NAVMAP),
      edgeTo('rack.rails', 'containment', SRC_NAVMAP),
    ],
  },
  {
    id: 'rack.tray',
    name: l('Compute Tray', '運算托盤'),
    blurb: l(
      '1U tray, ×18/rack: 2 Grace CPUs + 4 Blackwell Ultra GPUs, ~6.3kW.',
      '1U 托盤，每櫃 18 個：2 顆 Grace CPU + 4 顆 Blackwell Ultra GPU，約 6.3kW。',
    ),
    categoryId: 'odm',
    companyIds: ['quanta', 'wistron', 'chenbro'],
    stageId: 'system',
    specs: [spec('×18/rack; 2 Grace + 4 Blackwell; ~6.3kW', 'verified')],
    edges: [
      edgeTo('rack.tray.grace', 'containment', SRC_NAVMAP),
      edgeTo('rack.tray.gpu', 'containment', SRC_NAVMAP),
      edgeTo('rack.tray.nic', 'containment', SRC_NAVMAP),
      edgeTo('rack.tray.bmc', 'containment', SRC_NAVMAP),
      edgeTo('rack.tray.pdb', 'containment', SRC_NAVMAP),
    ],
  },
  {
    id: 'rack.tray.grace',
    name: l('Grace CPU', 'Grace CPU'),
    blurb: l(
      '72× Neoverse V2 cores, 3.1GHz, 300W, 480GB LPDDR5X — NVIDIA-designed.',
      '72 核 Neoverse V2，3.1GHz，300W，480GB LPDDR5X — NVIDIA 自研設計。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('72× Neoverse V2, 3.1GHz, 300W, 480GB LPDDR5X', 'verified')],
    edges: [],
  },
  {
    id: 'rack.tray.gpu',
    name: l('GPU Package', 'GPU 封裝'),
    blurb: l(
      'Blackwell Ultra package ×4/tray — TSMC-fabbed die, ASE/TSMC packaging.',
      '每托盤 4 顆 Blackwell Ultra 封裝 — 台積電製造晶圓，日月光／台積電封裝。',
    ),
    categoryId: 'foundry',
    companyIds: ['tsmc', 'ase'],
    stageId: 'chip',
    specs: [spec('×4/tray', 'verified')],
    edges: [
      edgeTo('gpu.die', 'containment', SRC_NAVMAP),
      edgeTo('gpu.hbm', 'containment', SRC_NAVMAP),
      edgeTo('gpu.cowos', 'containment', SRC_NAVMAP),
      edgeTo('gpu.pkgmat.lid', 'containment', SRC_NAVMAP),
      edgeTo('gpu.pkgmat.mold', 'containment', SRC_NAVMAP),
      edgeTo('gpu.substrate', 'containment', SRC_NAVMAP),
    ],
  },
  {
    id: 'rack.tray.nic',
    name: l('SuperNIC / DPU', 'SuperNIC/DPU'),
    blurb: l(
      'ConnectX-8 SuperNIC ×4 (800G OSFP) + BlueField-3 DPU for storage/mgmt.',
      'ConnectX-8 SuperNIC ×4（800G OSFP）+ BlueField-3 DPU 負責儲存／管理。',
    ),
    categoryId: 'icdesign',
    companyIds: ['nvidia', 'realtek'],
    stageId: 'chip',
    specs: [spec('4× 800G OSFP', 'verified')],
    edges: [edgeTo('net.scaleout', 'containment', SRC_NAVMAP)],
  },
  {
    id: 'rack.tray.bmc',
    name: l('BMC', 'BMC'),
    blurb: l('ASPEED AST2600 baseboard management controller.', 'ASPEED AST2600 基板管理控制器。'),
    categoryId: 'icdesign',
    companyIds: ['aspeed'],
    stageId: 'chip',
    specs: [spec('AST2600', 'verified')],
    edges: [],
  },
  {
    id: 'rack.tray.pdb',
    name: l('Power Distribution Board', '電源分配板'),
    blurb: l(
      '48V→12V PDB with RapidLock, 2.7kW/board.',
      '48V→12V 電源分配板，RapidLock 快接，每板 2.7kW。',
    ),
    categoryId: 'analog',
    companyIds: ['upi6719', 'excelliance'],
    stageId: 'chip',
    specs: [spec('48V→12V, RapidLock, 2.7kW/board', 'verified')],
    edges: [
      edgeTo('power.chain', 'containment', SRC_NAVMAP),
      // flow:power hop 4/4 — PDB's 12V rail feeds the tray board up to the
      // GPU's own max TGP (terminal hop of the power flow).
      edgeTo('rack.tray.gpu', 'flow:power', SRC_RACK_POWER, {
        value: 1400,
        unit: 'W',
        label: l('GPU TGP (max, via 12V tray rail)', 'GPU 最高熱設計功耗（經 12V 托盤軌）'),
      }),
    ],
  },
  {
    id: 'rack.switchtray',
    name: l('NVLink Switch Tray', 'NVLink 交換托盤'),
    blurb: l(
      '×9/rack, 2× NVSwitch5 @28.8Tb/s = 57.6Tb/s/tray.',
      '每櫃 9 個，2 顆 NVSwitch5 @28.8Tb/s = 每托盤 57.6Tb/s。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('×9/rack; 2×NVSwitch5 @28.8Tb/s = 57.6Tb/s/tray', 'verified')],
    edges: [
      edgeTo('rack.copper', 'containment', SRC_NAVMAP),
      edgeTo('net.scaleup', 'containment', SRC_NAVMAP),
    ],
  },
  {
    id: 'rack.copper',
    name: l('Copper Backplane', '銅纜背板'),
    blurb: l(
      '5,184 cables/rack (Amphenol Paladin/SkewClear/OverPass); TW rack cabling via BizLink.',
      '每櫃 5,184 條線纜（Amphenol Paladin/SkewClear/OverPass）；台廠機櫃線纜由貿聯供應。',
    ),
    categoryId: 'connect',
    companyIds: ['bizlink'],
    stageId: 'subsystem',
    specs: [spec('5,184 cables/rack', 'verified')],
    edges: [],
  },
  {
    id: 'rack.powershelf',
    name: l('Power Shelf', '電源櫃'),
    blurb: l(
      '×8/rack, 33kW each, 6×5.5kW PSU N+N; LiteOn confirmed in-rack.',
      '每櫃 8 個，各 33kW，6×5.5kW PSU N+N 備援；光寶已確認實裝。',
    ),
    categoryId: 'power',
    companyIds: ['liteon', 'delta'],
    stageId: 'subsystem',
    specs: [spec('33kW ×8/rack; 6×5.5kW PSU, N+N', 'verified')],
    // flow:power hop 2/4 — shelf output feeds the rack busbar.
    edges: [
      edgeTo('rack.busbar', 'flow:power', SRC_RACK_POWER, {
        value: 50,
        unit: 'V DC',
        label: l('Busbar (47.5–51.5V, 1400A)', '匯流排（47.5–51.5V，1400A）'),
      }),
    ],
  },
  {
    id: 'rack.busbar',
    name: l('Busbar', '匯流排'),
    blurb: l('~50V DC / 1400A rack power distribution.', '~50V DC / 1400A 機櫃配電匯流排。'),
    categoryId: 'connect',
    companyIds: ['bizlink'],
    stageId: 'subsystem',
    specs: [spec('~50V DC / 1400A', 'verified')],
    // flow:power hop 3/4 — busbar feeds the per-tray PDB.
    edges: [
      edgeTo('rack.tray.pdb', 'flow:power', SRC_RACK_POWER, {
        value: 48,
        unit: 'V',
        label: l('PDB input (48V-class)', 'PDB 輸入（48V 級）'),
      }),
    ],
  },
  {
    id: 'rack.cooling',
    name: l('Manifold & Quick-Disconnect', '歧管/QD'),
    blurb: l('Full-rack liquid-cooling manifolds and quick-disconnects.', '全櫃液冷歧管與快接頭。'),
    categoryId: 'thermal',
    companyIds: ['avc', 'auras', 'fositek', 'kaori'],
    stageId: 'subsystem',
    edges: [
      edgeTo('heat.chain', 'containment', SRC_NAVMAP),
      // flow:heat hop 2/3 — manifold hands off to the CDU.
      edgeTo('flow.heat.cdu', 'flow:heat', SRC_RACK_POWER, {
        value: 50,
        unit: '°C',
        label: l(
          'Manifold coolant range (2–50°C, DI water/PG25)',
          '歧管冷卻液溫域（2–50°C，DI 水/PG25）',
        ),
      }),
    ],
  },
  {
    id: 'rack.rails',
    name: l('Rails & Chassis', '滑軌'),
    blurb: l('Precision sliding rails and rack mechanics.', '精密滑軌與機構件。'),
    categoryId: 'mech',
    companyIds: ['kingslide', 'nanjuen'],
    stageId: 'subsystem',
    edges: [],
  },
  {
    id: 'rack.rubin',
    name: l('Vera Rubin NVL72 Rack', 'Vera Rubin NVL72 機櫃'),
    blurb: l(
      'Latest gen (volume 2H2026): 72 Rubin GPU / 36 Vera CPU, 18 compute + 9 switch trays, cable-free, ~180–220kW, 100% liquid. Oberon rack, 50V busbar.',
      '最新世代（2026 下半量產）：72 顆 Rubin GPU／36 顆 Vera CPU，18 運算＋9 交換托盤，無纜線，約 180–220kW，100% 液冷。Oberon 機櫃，50V 匯流排。',
    ),
    categoryId: 'odm',
    companyIds: ['foxconn', 'quanta', 'wiwynn'],
    stageId: 'system',
    specs: [spec('72 Rubin GPU / 36 Vera; 18+9 trays; ~180–220kW; 100% liquid', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [
      edgeTo('rubin.gpu', 'containment', SRC_LATEST),
      edgeTo('rubin.vera', 'containment', SRC_LATEST),
      edgeTo('rubin.nvswitch', 'containment', SRC_LATEST),
      edgeTo('rubin.cx9', 'containment', SRC_LATEST),
      edgeTo('rubin.bf4', 'containment', SRC_LATEST),
      edgeTo('rubin.socamm', 'containment', SRC_LATEST),
      edgeTo('rubin.roadmap', 'containment', SRC_LATEST),
    ],
  },
  {
    id: 'rubin.gpu',
    name: l('Rubin R200 GPU', 'Rubin R200 GPU'),
    blurb: l(
      'Rubin R200: 336B transistors, TSMC N3, 2 reticle dies, 224 SM, 35 PFLOPS dense NVFP4 (50 PF w/ sparsity).',
      'Rubin R200：3,360 億電晶體，台積電 N3，2 顆光罩晶粒，224 SM，35 PFLOPS 密集 NVFP4（稀疏 50 PF）。',
    ),
    categoryId: 'foundry',
    companyIds: ['tsmc', 'nvidia'],
    stageId: 'chip',
    specs: [
      spec('336B tr · TSMC N3 · 224 SM · 35 PF NVFP4', 'sourced', { sourceUrl: SRC_LATEST }),
    ],
    edges: [
      edgeTo('rubin.hbm', 'containment', SRC_LATEST),
      edgeTo('rubin.gpu.sm', 'containment', SRC_LATEST),
    ],
  },
  {
    id: 'rubin.hbm',
    name: l('HBM4 Stacks (Rubin)', 'HBM4 堆疊（Rubin）'),
    blurb: l(
      '8× HBM4 stacks → 288GB, ~22TB/s (Tom’s Hardware cites ~13TB/s — flagged). SK hynix / Samsung lead; Micron largely excluded on Rubin.',
      '8 顆 HBM4 堆疊 → 288GB，約 22TB/s（Tom’s Hardware 引 ~13TB/s — 已標註）。SK 海力士／三星主供；美光在 Rubin 大致被排除。',
    ),
    categoryId: 'memchip',
    companyIds: ['skhynix', 'samsung'],
    stageId: 'chip',
    specs: [spec('8× HBM4 → 288GB, ~22TB/s (alt 13TB/s)', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'rubin.gpu.sm',
    name: l('Rubin SM Array (per-SM internals TBD)', 'Rubin SM 陣列（每 SM 內部待揭露）'),
    blurb: l(
      'Rubin scales to 224 SM with an expanded-SFU Tensor Core, but per-SM CUDA / TMEM / L2 counts are not yet disclosed.',
      'Rubin 擴充至 224 SM，具擴充 SFU 的 Tensor Core，但每 SM 的 CUDA／TMEM／L2 數量尚未公布。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('224 SM; per-SM internals undisclosed', 'gap')],
    edges: [],
  },
  {
    id: 'rubin.vera',
    name: l('Vera CPU', 'Vera CPU'),
    blurb: l(
      'Vera: 88 custom Olympus Armv9 cores, 176 threads, 227B tr, LPDDR5X ≤1.5TB; NVLink-C2C 1.8TB/s to the Rubin GPU.',
      'Vera：88 顆自研 Olympus Armv9 核心，176 執行緒，2,270 億電晶體，LPDDR5X ≤1.5TB；NVLink-C2C 1.8TB/s 連接 Rubin GPU。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('88 Olympus Armv9, 176 threads, LPDDR5X ≤1.5TB, C2C 1.8TB/s', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'rubin.nvswitch',
    name: l('NVLink 6 / NVSwitch 6', 'NVLink 6／NVSwitch 6'),
    blurb: l(
      'NVLink 6 at 3.6TB/s per GPU; NVSwitch 6 fabric ~260TB/s per rack.',
      'NVLink 6 每 GPU 3.6TB/s；NVSwitch 6 交換網狀每櫃約 260TB/s。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('NVLink6 3.6TB/s/GPU; NVSwitch6 260TB/s/rack', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'rubin.cx9',
    name: l('ConnectX-9 SuperNIC', 'ConnectX-9 SuperNIC'),
    blurb: l(
      'ConnectX-9: 1.6Tb/s, embeds a 48-lane PCIe6 switch.',
      'ConnectX-9：1.6Tb/s，內建 48-lane PCIe6 交換器。',
    ),
    categoryId: 'icdesign',
    companyIds: ['nvidia'],
    stageId: 'chip',
    specs: [spec('1.6Tb/s; embedded 48-lane PCIe6 switch', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'rubin.bf4',
    name: l('BlueField-4 DPU', 'BlueField-4 DPU'),
    blurb: l(
      'BlueField-4: reuses a Grace die + CX-9, integrates the AST2600-class BMC.',
      'BlueField-4：沿用 Grace 晶粒＋CX-9，整合 AST2600 級 BMC。',
    ),
    categoryId: 'icdesign',
    companyIds: ['nvidia'],
    stageId: 'chip',
    specs: [spec('Grace die + CX-9; integrated BMC', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'rubin.socamm',
    name: l('SOCAMM / MRDIMM Interface', 'SOCAMM／MRDIMM 介面'),
    blurb: l(
      'Rubin-only SOCAMM/MRDIMM module interface silicon (SPD hub, CKD, MRCD/MDB) — Montage / Rambus; no Taiwan-listed play.',
      'Rubin 專屬 SOCAMM／MRDIMM 模組介面晶片（SPD hub、CKD、MRCD/MDB）— Montage／Rambus；無台廠掛鉤。',
    ),
    specs: [spec('SOCAMM/MRDIMM interface (Montage/Rambus)', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'rubin.roadmap',
    name: l('Rubin Roadmap', 'Rubin 藍圖'),
    blurb: l(
      'Future variants and generations — shown for context, not yet a shipping supply chain.',
      '未來變體與世代 — 僅供脈絡參考，尚非量產供應鏈。',
    ),
    edges: [
      edgeTo('rubin.cpx', 'containment', SRC_LATEST),
      edgeTo('rubin.ultra', 'containment', SRC_LATEST),
      edgeTo('rubin.feynman', 'containment', SRC_LATEST),
    ],
  },
  {
    id: 'rubin.cpx',
    name: l('Rubin CPX (roadmap)', 'Rubin CPX（藍圖）'),
    blurb: l(
      'Context/prefill inference GPU: 128GB GDDR7, no HBM, no advanced packaging — a cheaper, different supply chain. Avail. end-2026.',
      '情境／prefill 推論 GPU：128GB GDDR7，無 HBM、無先進封裝 — 較便宜的另一條供應鏈。2026 年底供貨。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('128GB GDDR7, no HBM', 'gap')],
    edges: [],
  },
  {
    id: 'rubin.ultra',
    name: l('Rubin Ultra NVL576 (roadmap)', 'Rubin Ultra NVL576（藍圖）'),
    blurb: l(
      '2H2027: 4 reticle dies/package, HBM4e 1TB/GPU (16 stacks, ~32TB/s), Kyber rack ~600kW, 800V HVDC, NVLink 7.',
      '2027 下半：每封裝 4 顆光罩晶粒，HBM4e 每 GPU 1TB（16 堆疊，約 32TB/s），Kyber 機櫃約 600kW，800V HVDC，NVLink 7。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('4 dies/pkg; HBM4e 1TB; Kyber ~600kW; 800V HVDC', 'gap')],
    edges: [],
  },
  {
    id: 'rubin.feynman',
    name: l('Feynman (roadmap)', 'Feynman（藍圖）'),
    blurb: l('The post-Rubin architecture, expected 2028.', '後 Rubin 架構，預計 2028 年。'),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('expected 2028', 'gap')],
    edges: [],
  },
  {
    id: 'gpu.die',
    name: l('GPU Die', 'GPU 晶粒'),
    blurb: l(
      'Dual-reticle Blackwell Ultra die, 208B transistors, TSMC 4NP.',
      '雙倍光罩 Blackwell Ultra 晶粒，2,080 億電晶體，台積電 4NP 製程。',
    ),
    categoryId: 'foundry',
    companyIds: ['tsmc'],
    stageId: 'chip',
    specs: [spec('dual-reticle, 208B transistors, TSMC 4NP', 'verified')],
    edges: [
      edgeTo('gpu.internal.gpc', 'containment', SRC_LATEST),
      edgeTo('gpu.internal.l2', 'containment', SRC_LATEST),
      edgeTo('gpu.internal.memctrl', 'containment', SRC_NAVMAP),
      edgeTo('upstream', 'containment', SRC_NAVMAP),
    ],
  },
  {
    id: 'gpu.hbm',
    name: l('HBM Stack', 'HBM 堆疊'),
    blurb: l(
      'HBM3e ×8 stacks, 12-Hi, 36GB/stack → 288GB, 8TB/s.',
      'HBM3e ×8 顆，12 層堆疊，每顆 36GB → 共 288GB，頻寬 8TB/s。',
    ),
    categoryId: 'memchip',
    companyIds: ['skhynix', 'micron', 'samsung', 'pti'],
    stageId: 'chip',
    specs: [spec('8× 12-Hi stacks, 36GB/stack → 288GB, 8TB/s', 'verified')],
    edges: [
      edgeTo('mem.tiers', 'containment', SRC_NAVMAP),
      // flow:data hop 2/6 — HBM fans onto the CoWoS-L interposer; no sourced
      // bandwidth figure for this specific packaging hop, so no `flowSpec`
      // (edgeTo()'s own doc: omit rather than fabricate).
      edgeTo('gpu.cowos', 'flow:data', SRC_GPU_HBM),
    ],
  },
  {
    id: 'gpu.cowos',
    name: l('CoWoS-L Interposer', 'CoWoS-L'),
    blurb: l(
      'RDL interposer + LSI chiplets + eDTC — TSMC sole-source.',
      'RDL 中介層 + LSI 小晶片 + eDTC — 台積電獨家。',
    ),
    categoryId: 'foundry',
    companyIds: ['tsmc'],
    stageId: 'chip',
    specs: [spec('RDL interposer + LSI chiplets + eDTC', 'verified')],
    // flow:data hop 3/6 — onward to the die-to-die interconnect (nav-map's
    // flow-view narrative order per design spec §4's table; NV-HBI is
    // physically intra-package, this hop is the flow overlay's curated
    // narrative order, not a literal signal-path claim).
    edges: [
      edgeTo('flow.data.nvhbi', 'flow:data', SRC_GPU_HBM, {
        value: 10,
        unit: 'TB/s',
        label: l('NV-HBI die-to-die link', 'NV-HBI 晶粒對晶粒鏈路'),
      }),
    ],
  },
  {
    id: 'gpu.substrate',
    name: l('ABF Substrate', 'ABF 載板'),
    blurb: l(
      'IC substrate fanning the die out to the board; TW makers, Ibiden anchor.',
      '把裸晶線路扇出到板卡的載板；台廠供應，日商 Ibiden 為錨點。',
    ),
    categoryId: 'substrate',
    companyIds: ['unimicron', 'nanyapcb', 'kinsus', 'zdt', 'ibiden'],
    stageId: 'package',
    edges: [
      edgeTo('gpu.substrate.film', 'containment', SRC_NAVMAP),
      edgeTo('gpu.substrate.tglass', 'containment', SRC_NAVMAP),
      edgeTo('gpu.substrate.drill', 'containment', SRC_NAVMAP),
      edgeTo('gpu.substrate.equip', 'containment', SRC_NAVMAP),
      edgeTo('up.glasspkg', 'containment', SRC_NAVMAP),
    ],
  },
  {
    id: 'gpu.substrate.film',
    name: l('ABF Build-up Film', 'ABF 增層膜'),
    blurb: l(
      'Ajinomoto ~95%+ monopoly; no Taiwan-listed alternative (structural gap).',
      '味之素 Ajinomoto ~95%+ 獨占；無台廠替代（結構性缺口）。',
    ),
    categoryId: 'substrate',
    stageId: 'package',
    edges: [],
  },
  {
    id: 'gpu.substrate.tglass',
    name: l('T-glass Core Cloth', '芯材 T-glass 布'),
    blurb: l(
      'Nittobo ~99% share; BaoTeck holds a 47.65% agency stake, Nan Ya weaves.',
      '日東紡 ~99% 市佔；建榮持股代理層 47.65%，南亞代織。',
    ),
    categoryId: 'glass',
    companyIds: ['baoteck5340', 'nanya1303'],
    stageId: 'materials',
    specs: [spec('Nittobo ~99% share', 'sourced')],
    edges: [],
  },
  {
    id: 'gpu.substrate.drill',
    name: l('Micro-drills', '鑽針'),
    blurb: l(
      'Micro-drill bits for substrate laser/mechanical drilling.',
      '載板雷射／機械鑽孔用鑽針。',
    ),
    categoryId: 'pcb',
    companyIds: ['topoint', 'kaiwai5498'],
    stageId: 'board',
    edges: [],
  },
  {
    id: 'gpu.substrate.equip',
    name: l('Substrate Process Equipment', '乾製程/AOI/自動化'),
    blurb: l(
      'Dry-process lamination, AOI inspection and AMHS automation for substrates.',
      '載板乾製程壓合、AOI 檢測與自動化搬運設備。',
    ),
    categoryId: 'equip',
    companyIds: ['groupup', 'csun', 'machvision', 'utechzone', 'sindtek6438'],
    stageId: 'fabsupport',
    edges: [],
  },
  {
    id: 'gpu.pkgmat.lid',
    name: l('Lid / Heat Spreader', 'lid/均熱片'),
    blurb: l(
      'Package lid, heat spreader and stiffener ring — Jentech for Rubin MCL.',
      '封裝 lid、均熱片與補強環 — 健策供應輝達 Rubin MCL。',
    ),
    categoryId: 'pkgmat',
    companyIds: ['jentech3653'],
    stageId: 'package',
    edges: [],
  },
  {
    id: 'gpu.pkgmat.mold',
    name: l('Molding Compound', '成型膠 LMC/MUF'),
    blurb: l(
      'LMC/MUF molding compound + underfill; Eternal in CoWoS qualification.',
      'LMC/MUF 成型膠與底部填充；長興驗證中打入 CoWoS。',
    ),
    categoryId: 'pkgmat',
    companyIds: ['eternal', 'changwah8070'],
    stageId: 'package',
    edges: [],
  },
  {
    id: 'gpu.internal.gpc',
    name: l('GPC ×8', 'GPC ×8'),
    blurb: l(
      '8 Graphics Processing Clusters (4 per die) partition the GB300 die-pair.',
      '8 個圖形處理叢集（每晶粒 4 個），劃分 GB300 雙晶粒。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('8 GPC (4/die)', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [edgeTo('gpu.internal.tpc', 'containment', SRC_LATEST)],
  },
  {
    id: 'gpu.internal.tpc',
    name: l('TPC ×10/GPC', 'TPC ×10/GPC'),
    blurb: l(
      '10 Texture Processing Clusters per GPC, 2 SM each → 160 SM (GB300 full; B200 = 148 floorswept).',
      '每 GPC 10 個 TPC，各含 2 個 SM → 共 160 個 SM（全 GB300；B200 屏蔽為 148）。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('10 TPC/GPC × 2 SM = 160 SM', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [edgeTo('gpu.internal.sm', 'containment', SRC_LATEST)],
  },
  {
    id: 'gpu.internal.sm',
    name: l('Streaming Multiprocessors', 'SM'),
    blurb: l(
      '×160 SMs — each: 128 CUDA (FP32/INT32)+FP64, 4 sub-partitions, 64 warps max, 4 Tensor Cores, 256KB TMEM = 20,480 CUDA cores total.',
      '160 個 SM — 每個：128 CUDA（FP32/INT32）+FP64、4 子分割、最多 64 warp、4 個 Tensor Core、256KB TMEM ＝共 20,480 個 CUDA 核心。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('160 SM × (128 CUDA + 4 Tensor + 256KB TMEM) = 20,480 CUDA', 'verified')],
    // Containment children: the on-SM blocks (Plan 007). LSU/SFU exact counts
    // are unpublished (`gap`) so no node is fabricated for them.
    // flow:data hop 1/6 (unchanged) — SM feeds HBM through the memory controller.
    edges: [
      edgeTo('gpu.internal.sm.warp', 'containment', SRC_LATEST),
      edgeTo('gpu.internal.sm.regfile', 'containment', SRC_LATEST),
      edgeTo('gpu.internal.sm.l1', 'containment', SRC_LATEST),
      edgeTo('gpu.internal.sm.tensor', 'containment', SRC_LATEST),
      edgeTo('gpu.hbm', 'flow:data', SRC_GPU_HBM, {
        value: 8,
        unit: 'TB/s',
        label: l('Memory controller → HBM', '記憶體控制器 → HBM'),
      }),
    ],
  },
  {
    id: 'gpu.internal.memctrl',
    name: l('Memory Controller', '記憶體控制器'),
    blurb: l(
      '16×512-bit (8,192-bit total) controller feeding HBM at 8TB/s.',
      '16×512-bit（共 8,192-bit）控制器，餵入 HBM 頻寬 8TB/s。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('16×512-bit (8,192-bit total) ↔ HBM 8TB/s', 'verified')],
    edges: [],
  },
  {
    id: 'gpu.internal.sm.warp',
    name: l('Warp Schedulers ×4', 'Warp 排程器 ×4'),
    blurb: l(
      '1 warp scheduler + dispatch per sub-partition (4/SM); up to 64 warps in flight.',
      '每子分割 1 個 warp 排程器＋派發（每 SM 4 個）；最多 64 個 warp 同時執行。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('4 sub-partitions × (1 sched + dispatch); 64 warps max', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'gpu.internal.sm.regfile',
    name: l('Register File', '暫存器檔案'),
    blurb: l(
      '256 KB/SM register file (64K × 32-bit; 64KB per sub-partition).',
      '每 SM 256 KB 暫存器檔案（64K × 32-bit；每子分割 64KB）。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('256 KB/SM (64K × 32-bit)', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'gpu.internal.sm.l1',
    name: l('L1 / Shared Memory', 'L1／共享記憶體'),
    blurb: l(
      '256 KB/SM unified L1 + shared (shared carve-out ≤228 KB); L1 ~39-cycle.',
      '每 SM 256 KB 統一 L1＋共享（共享配置 ≤228 KB）；L1 約 39 週期。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('256 KB/SM unified (≤228 KB smem)', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'gpu.internal.sm.tensor',
    name: l('5th-gen Tensor Cores ×4', '第五代 Tensor Core ×4'),
    blurb: l(
      '4 Tensor Cores/SM (640 total): NVFP4/MXFP4/FP6/FP8/BF16/TF32/FP64. tcgen05 MMA operands live in shared mem + TMEM; MMA.2SM spans a CTA pair across 2 SMs.',
      '每 SM 4 個 Tensor Core（共 640 個）：NVFP4/MXFP4/FP6/FP8/BF16/TF32/FP64。tcgen05 MMA 運算元置於共享記憶體＋TMEM；MMA.2SM 跨 2 個 SM 的 CTA 對。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('4 Tensor/SM (640 total); NVFP4 → FP64', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [edgeTo('gpu.internal.sm.tmem', 'containment', SRC_LATEST)],
  },
  {
    id: 'gpu.internal.sm.tmem',
    name: l('Tensor Memory (TMEM)', 'Tensor 記憶體（TMEM）'),
    blurb: l(
      '256 KB/SM tensor memory (128 lanes × 512 × 4B; 16 TB/s read / 8 TB/s write) — new in Blackwell.',
      '每 SM 256 KB tensor 記憶體（128 lane × 512 × 4B；讀 16 TB/s／寫 8 TB/s）— Blackwell 新增。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('256 KB/SM; 16/8 TB/s R/W', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'gpu.internal.l2',
    name: l('L2 Cache', 'L2 快取'),
    blurb: l(
      '~126 MB/GPU L2, 4 partitions (2 per die), ~150 ns latency.',
      '每 GPU 約 126 MB L2，4 個分割（每晶粒 2 個），延遲約 150 ns。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('~126 MB; 4 partitions; ~150 ns', 'sourced', { sourceUrl: SRC_LATEST })],
    edges: [],
  },
  {
    id: 'net.scaleup',
    name: l('NVLink Scale-up', 'NVLink/銅'),
    blurb: l(
      'One-hop NVSwitch star topology (not full-mesh) over copper; UALink 200G open standard emerging.',
      '一跳式 NVSwitch 星狀拓撲（非全網狀）走銅纜；開放標準 UALink 200G 正在興起。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('UALink 200G 1.0 target: 1,024 endpoints, 93% efficiency', 'verified')],
    // flow:data hop 5/6 — scale-up fabric hands off to the scale-out network.
    edges: [
      edgeTo('net.scaleout', 'flow:data', SRC_NAVMAP, {
        value: 3200,
        unit: 'Gb/s',
        label: l('Scale-out NIC aggregate (4×800G)', 'Scale-out 網卡聚合頻寬（4×800G）'),
      }),
    ],
  },
  {
    id: 'net.scaleout',
    name: l('Scale-out Network', 'IB/乙太'),
    blurb: l(
      'Node side: 4×ConnectX-8 800G + BlueField-3 + BMC out-of-band; TW switch ODMs Accton/WNC.',
      '節點側：4×ConnectX-8 800G + BlueField-3 + BMC 帶外管理；台廠交換器 ODM 為智邦／智易。',
    ),
    categoryId: 'net',
    companyIds: ['accton', 'wnc'],
    stageId: 'cloud',
    specs: [spec('node side: 4× ConnectX-8 800G', 'verified')],
    edges: [
      edgeTo('net.optics', 'containment', SRC_NAVMAP),
      // flow:data hop 6/6 — terminates at the memory/storage tier. Nav-map's
      // own "記憶體/儲存階層 ─ flow view" line marks NVMe/network-storage
      // bandwidth `[?]` (gap) — no sourced number for THIS specific hop, so
      // no `flowSpec` rather than asserting one.
      edgeTo('mem.tiers', 'flow:data', SRC_NAVMAP),
    ],
  },
  {
    id: 'net.optics',
    name: l('Optical Transceivers', '光傳輸'),
    blurb: l(
      '800G/1.6T pluggable modules (~30W/port) and LPO/LRO linear-drive optics.',
      '800G/1.6T 可插拔模組（約 30W/port）與 LPO/LRO 線性驅動光學。',
    ),
    categoryId: 'optics',
    companyIds: ['jpc4977', 'apacopto', 'gloriole', 'foci', 'gcs4991', 'landmark', 'parade'],
    stageId: 'subsystem',
    specs: [spec('800G/1.6T, ~30W/port', 'sourced')],
    edges: [edgeTo('net.optics.cpo', 'containment', SRC_NAVMAP)],
  },
  {
    id: 'net.optics.cpo',
    name: l('Co-Packaged Optics', 'CPO'),
    blurb: l(
      'NVIDIA Quantum-X/Spectrum-X Photonics: 9W vs 30W/port, 3.5× power savings.',
      'NVIDIA Quantum-X／Spectrum-X Photonics：9W 對比 30W/port，省電 3.5 倍。',
    ),
    categoryId: 'optics',
    companyIds: ['tsmc', 'foci'],
    stageId: 'subsystem',
    specs: [spec('9W vs 30W/port; 3.5× power savings; 22dB→4dB loss', 'sourced')],
    edges: [],
  },
  {
    id: 'power.chain',
    name: l('Power Delivery Chain', '電力鏈'),
    blurb: l(
      '3φ 200–480Vac grid → 33kW shelf ×8 → ~50V/1400A busbar → 48→12V PDB → GPU up to 1,400W.',
      '3φ 200–480Vac 市電 → 33kW 電源櫃 ×8 → ~50V/1400A 匯流排 → 48→12V PDB → GPU 最高 1,400W。',
    ),
    categoryId: 'power',
    companyIds: ['delta', 'liteon', 'chiconypower'],
    stageId: 'subsystem',
    specs: [spec('3φ 200–480Vac → 33kW×8 → ~50V/1400A → 48→12V → 1,400W/GPU', 'verified')],
    edges: [],
  },
  {
    id: 'heat.chain',
    name: l('Cooling Chain', '散熱鏈'),
    blurb: l(
      'Cold plate (90% of heat) → QD → manifold (2–50°C, DI water/PG25) → CDU → facility water (W45).',
      '冷板（90% 熱量）→ 快接頭 → 歧管（2–50°C，DI 水／PG25）→ CDU → 廠務水（W45）。',
    ),
    categoryId: 'thermal',
    companyIds: ['avc', 'auras', 'kaori', 'fositek'],
    stageId: 'subsystem',
    specs: [spec('90% liquid / 10% air; manifold 2–50°C, DI water/PG25', 'verified')],
    edges: [],
  },
  {
    id: 'mem.tiers',
    name: l('Memory / Storage Tiers', '記憶體階層'),
    blurb: l(
      'HBM3e 8TB/s → LPDDR5X 480GB/CPU (C2C 900GB/s) → NVMe → networked storage.',
      'HBM3e 8TB/s → LPDDR5X 480GB/CPU（C2C 900GB/s）→ NVMe → 網路儲存。',
    ),
    categoryId: 'storage',
    companyIds: ['nanyatech', 'adata', 'phison'],
    stageId: 'system',
    specs: [spec('HBM3e 8TB/s → LPDDR5X 480GB/CPU (C2C 900GB/s)', 'verified')],
    edges: [],
  },
  {
    id: 'upstream',
    name: l('Semiconductor Upstream', '半導體上游'),
    blurb: l(
      'Fab & materials feeding the die: TW makers hold the carrier/parts/consumables/chemical-delivery/test/automation periphery; tool bodies are mostly foreign.',
      '供應晶粒的晶圓廠與材料：台廠吃載具／零件／耗材／化學輸送／檢測／自動化的周邊環，機台本體多為外商。',
    ),
    categoryId: 'euv',
    companyIds: ['gudeng', 'asml'],
    stageId: 'fabsupport',
    edges: [
      edgeTo('up.wafer', 'containment', SRC_NAVMAP),
      edgeTo('up.mask', 'containment', SRC_NAVMAP),
      edgeTo('up.litho', 'containment', SRC_NAVMAP),
      edgeTo('up.etch', 'containment', SRC_NAVMAP),
      edgeTo('up.depo', 'containment', SRC_NAVMAP),
      edgeTo('up.clean.cmp', 'containment', SRC_NAVMAP),
      edgeTo('up.testlab', 'containment', SRC_NAVMAP),
      edgeTo('up.beol', 'containment', SRC_NAVMAP),
      edgeTo('up.recycle', 'containment', SRC_NAVMAP),
    ],
  },
  {
    id: 'up.wafer',
    name: l('Silicon Wafers & Reclaim', '矽晶圓/再生'),
    blurb: l(
      'Polished/epi silicon wafers plus monitor-wafer reclaim; GlobalWafers #3 worldwide.',
      '拋光／磊晶矽晶圓與測試片再生；環球晶為全球第三大廠。',
    ),
    categoryId: 'si',
    companyIds: ['globalwafers', 'formosasumco', 'waferworks', 'psi8028', 'kinik', 'scientech'],
    stageId: 'wafer',
    specs: [spec('GlobalWafers: global #3 silicon wafer maker', 'sourced')],
    edges: [],
  },
  {
    id: 'up.mask',
    name: l('Photomasks', '光罩/檢測'),
    blurb: l(
      'Photomask fabrication and pellicle/particle inspection.',
      '光罩製作與 pellicle／微粒檢測。',
    ),
    categoryId: 'mask',
    companyIds: ['tmc2338', 'gudeng', 'jiashuo6953', 'hwahong6983', 'tenglong6937'],
    stageId: 'wafer',
    edges: [],
  },
  {
    id: 'up.litho',
    name: l('Lithography', '黃光 微影'),
    blurb: l(
      'EUV/DUV exposure and track are foreign-only; TW supplies pods, agency chemicals and AMC filters.',
      'EUV/DUV 曝光機與 Track 塗佈顯影皆為外商；台廠供應傳載盒、代理化學品與 AMC 濾網。',
    ),
    categoryId: 'euv',
    companyIds: ['gudeng', 'greenfilter', 'aemc', 'topco', 'wahlee', 'mic6196'],
    stageId: 'fabsupport',
    edges: [],
  },
  {
    id: 'up.etch',
    name: l('Etch — Chamber Parts', '蝕刻 腔體零件'),
    blurb: l(
      'Etch tool bodies are foreign (Lam/TEL/AMAT); TW supplies chamber parts, cleaning and etch chemicals.',
      '蝕刻機台本體為外商（Lam/TEL/AMAT）；台廠供應腔體零件、清洗再生與蝕刻化學品。',
    ),
    categoryId: 'euv',
    companyIds: ['hsiangming', 'chianfu', 'sg3551', 'rayzher'],
    stageId: 'fabsupport',
    edges: [],
  },
  {
    id: 'up.depo',
    name: l('Deposition', '薄膜 沉積'),
    blurb: l(
      'PVD/CVD tools mostly AMAT/ASM/Kokusai; TW does module subcontracting, targets and specialty gas.',
      'PVD/CVD 設備多為 AMAT/ASM/Kokusai；台廠做模組代工、靶材與特殊氣體。',
    ),
    categoryId: 'gas',
    companyIds: ['foxsemicon', 'solartech', 'tsc4772', 'crystalgas4768', 'luhon1229'],
    stageId: 'wafer',
    edges: [],
  },
  {
    id: 'up.clean.cmp',
    name: l('Clean / CMP', '清洗/CMP'),
    blurb: l(
      'Wet clean (SCREEN-dominated) plus CMP; Kinik supplies ~70% of TSMC 3nm diamond disks.',
      '濕製程清洗（SCREEN 主導）與 CMP；中砂供應台積電 3nm 鑽石碟約 70%。',
    ),
    categoryId: 'cmp',
    companyIds: ['scientech', 'gpt', 'kinik', 'sungsheng7768'],
    stageId: 'materials',
    specs: [spec('Kinik: ~70% of TSMC 3nm diamond-disk share', 'sourced')],
    edges: [],
  },
  {
    id: 'up.testlab',
    name: l('Analysis & Reliability Labs', '檢測分析'),
    blurb: l(
      'Third-party MA/FA/RA labs verifying advanced nodes, packaging and silicon photonics.',
      '第三方 MA／FA／RA 實驗室，驗證先進製程、封裝與矽光子。',
    ),
    categoryId: 'testlab',
    companyIds: ['msscorp6830', 'matek3587', 'istgroup3289'],
    stageId: 'package',
    edges: [],
  },
  {
    id: 'up.beol',
    name: l('BEOL Metallization', 'BEOL 金屬化'),
    blurb: l(
      'Cu→Ru/Mo transition below 2nm; TW exposure via Solar Applied Materials targets.',
      '2nm 以下銅轉釕／鉬瓶頸；台廠曝險透過光洋科靶材。',
    ),
    categoryId: 'target',
    companyIds: ['solartech', 'chunghwachem'],
    stageId: 'materials',
    edges: [],
  },
  {
    id: 'up.recycle',
    name: l('Fab Circular Economy', '廠務循環/水'),
    blurb: l(
      'Spent-acid regeneration, UPW/wastewater recycling — "not one drop of acid leaves the fab".',
      '廢酸再生、UPW／廢水回收 — 「一滴硫酸不外運」。',
    ),
    categoryId: 'recycle',
    companyIds: ['megaunion6944', 'taifer1722', 'forestwater8473', 'shiny'],
    stageId: 'fabsupport',
    edges: [],
  },
  {
    id: 'up.glasspkg',
    name: l('Glass Substrate / FOPLP', '玻璃基板/FOPLP'),
    blurb: l(
      'Low-CTE glass core (Corning/AGC/SCHOTT/NEG); TSMC CoPoS mini-line at VisEra (2026).',
      '低 CTE 玻璃芯材（Corning/AGC/SCHOTT/NEG）；台積電 CoPoS 於采鈺建 mini line（2026）。',
    ),
    categoryId: 'glasspkg',
    companyIds: ['vpec6789', 'weihua3055', 'eandr', 'groupup'],
    stageId: 'package',
    edges: [],
  },
];

// ---------------------------------------------------------------------------
// Flow-only waypoint nodes (Plan 006 Phase G Task 5; design spec §4). The
// `flow:data`/`flow:power`/`flow:heat` axes mostly re-thread EXISTING
// containment nodes (gpu.internal.sm, gpu.hbm, gpu.cowos, net.scaleup,
// net.scaleout, mem.tiers; rack.powershelf, rack.busbar, rack.tray.pdb,
// rack.tray.gpu; rack.cooling — their new `flow:*` edges live inline on
// those nodes above) but each flow's *first* hop (and heat's CDU/facility
// hops) name a concept with no existing containment counterpart — "grid",
// "NV-HBI", "cold plate", "CDU", "facility water". Rather than force these
// onto the containment/subsystem/stage axes (they aren't distinct hardware
// SKUs with their own supplier — they're physics/infra waypoints the two
// verified flow-research docs name explicitly), they're modeled as small
// nodes that participate ONLY in their one flow axis: no `companyIds`
// (matching the honest "no Taiwan hook" pattern `gpu.substrate.film` already
// establishes for a fact with nothing to attribute), no `categoryId`/
// `stageId` (they're not `supply-chain.ts`-backed entities), no containment/
// subsystem/stage edges. `check:tree`'s reachability gate only walks the
// `containment` axis, so this is expected, not an orphan.
const FLOW_WAYPOINT_NODES: StackNode[] = [
  {
    id: 'flow.data.nvhbi',
    name: l('NV-HBI Die-to-Die Link', 'NV-HBI 晶粒間鏈路'),
    blurb: l(
      '10TB/s die-to-die interconnect joining the Blackwell Ultra dual-reticle dies.',
      '10TB/s 晶粒對晶粒互連，連接 Blackwell Ultra 雙倍光罩晶粒。',
    ),
    specs: [spec('10 TB/s die-to-die', 'verified', { sourceUrl: SRC_GPU_HBM })],
    // flow:data hop 4/6 — onward to the scale-up fabric.
    edges: [
      edgeTo('net.scaleup', 'flow:data', SRC_GPU_HBM, {
        value: 1.8,
        unit: 'TB/s',
        label: l('NVLink 5 per-GPU bidirectional', '每 GPU NVLink 5 雙向頻寬'),
      }),
    ],
  },
  {
    id: 'flow.power.grid',
    name: l('Grid / Facility Power Feed', '市電/廠務電力輸入'),
    blurb: l(
      '3-phase 200–480Vac facility feed into the rack power shelves.',
      '三相 200–480Vac 廠務電力，輸入機櫃電源櫃。',
    ),
    specs: [spec('3φ 200–480Vac', 'verified', { sourceUrl: SRC_RACK_POWER })],
    // flow:power hop 1/4 — root of the power flow.
    edges: [
      edgeTo('rack.powershelf', 'flow:power', SRC_RACK_POWER, {
        value: 480,
        unit: 'Vac',
        label: l('3-phase grid feed (200–480Vac)', '三相市電輸入（200–480Vac）'),
      }),
    ],
  },
  {
    id: 'flow.heat.coldplate',
    name: l('Cold Plate', '冷板'),
    blurb: l(
      'Direct-liquid cold plates on CPU/GPU/NIC dies — carries ~90% of rack heat.',
      'CPU/GPU/NIC 晶片上的直觸式液冷冷板 — 承載機櫃約 90% 熱量。',
    ),
    specs: [spec('~90% of heat to liquid', 'verified', { sourceUrl: SRC_RACK_POWER })],
    // flow:heat hop 1/3 — root of the heat flow.
    edges: [
      edgeTo('rack.cooling', 'flow:heat', SRC_RACK_POWER, {
        value: 90,
        unit: '%',
        label: l(
          'Share of rack heat carried by liquid cold plates',
          '機櫃熱量由液冷冷板承載之比例',
        ),
      }),
    ],
  },
  {
    id: 'flow.heat.cdu',
    name: l('CDU', 'CDU 冷卻液分配單元'),
    blurb: l(
      'Coolant distribution unit between the rack manifold and facility water; exact type/vendor unconfirmed.',
      '機櫃歧管與廠務水之間的冷卻液分配單元；確切型式與供應商尚未確認。',
    ),
    // flow:heat hop 3/3 — CDU hands off to the facility water loop.
    edges: [
      edgeTo('flow.heat.facility', 'flow:heat', SRC_RACK_POWER, {
        value: 45,
        unit: '°C',
        label: l('CDU → facility supply water (W45, ≤45°C)', 'CDU 送至廠務供水（W45，≤45°C）'),
      }),
    ],
  },
  {
    id: 'flow.heat.facility',
    name: l('Facility Water', '廠務水'),
    blurb: l(
      'Facility supply water loop, ASHRAE W45 (≤45°C) — the heat chain terminus.',
      '廠務供水迴路，ASHRAE W45（≤45°C）— 散熱鏈終點。',
    ),
    specs: [spec('W45, ≤45°C facility supply', 'verified', { sourceUrl: SRC_RACK_POWER })],
    edges: [], // terminal
  },
];

// ---------------------------------------------------------------------------
// Subsystem-axis group nodes (spec §4: compute / memory / packaging /
// scale-up / scale-out+optics / power / cooling / management /
// upstream-materials). Curated grouping over the node set above — not
// sourced from a doc row, so `sourceUrl` cites the design spec that defines
// the grouping itself; each member edge mirrors that member's own tier
// (re-organizing an established fact isn't a new claim to verify).
const SUBSYSTEM_MEMBERS: Record<string, string[]> = {
  'sub.compute': [
    'rack.tray.grace',
    'rack.tray.gpu',
    'gpu.die',
    'gpu.internal.sm',
    'gpu.internal.memctrl',
  ],
  'sub.memory': ['gpu.hbm', 'mem.tiers'],
  'sub.packaging': [
    'gpu.cowos',
    'gpu.substrate',
    'gpu.substrate.film',
    'gpu.substrate.tglass',
    'gpu.substrate.drill',
    'gpu.substrate.equip',
    'gpu.pkgmat.lid',
    'gpu.pkgmat.mold',
    'up.glasspkg',
  ],
  'sub.scaleup': ['net.scaleup', 'rack.switchtray', 'rack.copper'],
  'sub.scaleout-optics': ['net.scaleout', 'net.optics', 'net.optics.cpo'],
  'sub.power': ['rack.powershelf', 'rack.busbar', 'rack.tray.pdb', 'power.chain'],
  'sub.cooling': ['rack.cooling', 'heat.chain'],
  'sub.management': ['rack.tray.bmc', 'rack.tray.nic'],
  'sub.upstream-materials': [
    'upstream',
    'up.wafer',
    'up.mask',
    'up.litho',
    'up.etch',
    'up.depo',
    'up.clean.cmp',
    'up.testlab',
    'up.beol',
    'up.recycle',
  ],
};

const SUBSYSTEM_META: Record<string, { name: LStr; blurb: LStr }> = {
  'sub.compute': {
    name: l('Compute', '運算'),
    blurb: l('CPU/GPU silicon and the on-die datapath.', 'CPU/GPU 晶粒與晶片內資料路徑。'),
  },
  'sub.memory': {
    name: l('Memory', '記憶體'),
    blurb: l('HBM stacks and the storage tier beneath them.', 'HBM 堆疊與其下的儲存階層。'),
  },
  'sub.packaging': {
    name: l('Packaging', '封裝'),
    blurb: l('CoWoS, ABF substrate and package materials.', 'CoWoS、ABF 載板與封裝材料。'),
  },
  'sub.scaleup': {
    name: l('Scale-up', 'Scale-up'),
    blurb: l('NVLink switch trays and the copper backplane.', 'NVLink 交換托盤與銅纜背板。'),
  },
  'sub.scaleout-optics': {
    name: l('Scale-out & Optics', 'Scale-out 與光通訊'),
    blurb: l('Cluster networking and photonics.', '叢集網路與光傳輸。'),
  },
  'sub.power': {
    name: l('Power', '電源'),
    blurb: l(
      'Power shelves, busbar, PDB and the delivery chain.',
      '電源櫃、匯流排、PDB 與電力鏈。',
    ),
  },
  'sub.cooling': {
    name: l('Cooling', '散熱'),
    blurb: l('Manifolds, quick-disconnects and the liquid loop.', '歧管、快接頭與液冷迴路。'),
  },
  'sub.management': {
    name: l('Management', '管理'),
    blurb: l('BMC and DPU out-of-band control.', 'BMC 與 DPU 帶外管理。'),
  },
  'sub.upstream-materials': {
    name: l('Upstream Materials', '上游材料'),
    blurb: l(
      'The fab / litho / etch / depo / CMP / BEOL sub-tree feeding the die.',
      '供應晶粒的晶圓廠／微影／蝕刻／沉積／CMP／BEOL 子樹。',
    ),
  },
};

const SUBSYSTEM_NODES: StackNode[] = Object.entries(SUBSYSTEM_MEMBERS).map(([id, members]) => ({
  id,
  name: SUBSYSTEM_META[id].name,
  blurb: SUBSYSTEM_META[id].blurb,
  edges: members.map((m) => edgeTo(m, 'subsystem', SRC_SPEC)),
}));

// ---------------------------------------------------------------------------
// Stage-axis group nodes — one per existing `supply-chain.ts` StageId,
// membership from each taxonomy node's own `stageId` above. Reuses the
// existing STAGES name/zh/blurb so the two datasets never drift.
const STAGE_MEMBERS: Record<string, string[]> = {
  cloud: ['dc', 'net.scaleout'],
  system: ['rack', 'rack.tray', 'mem.tiers'],
  anchor: [
    'rack.tray.grace',
    'rack.switchtray',
    'gpu.internal.sm',
    'gpu.internal.memctrl',
    'net.scaleup',
  ],
  chip: [
    'rack.tray.gpu',
    'rack.tray.nic',
    'rack.tray.bmc',
    'rack.tray.pdb',
    'gpu.die',
    'gpu.hbm',
    'gpu.cowos',
  ],
  package: [
    'gpu.substrate',
    'gpu.substrate.film',
    'gpu.pkgmat.lid',
    'gpu.pkgmat.mold',
    'up.testlab',
    'up.glasspkg',
  ],
  materials: ['gpu.substrate.tglass', 'up.clean.cmp', 'up.beol'],
  board: ['gpu.substrate.drill'],
  fabsupport: ['gpu.substrate.equip', 'upstream', 'up.litho', 'up.etch', 'up.recycle'],
  subsystem: [
    'rack.copper',
    'rack.powershelf',
    'rack.busbar',
    'rack.cooling',
    'rack.rails',
    'power.chain',
    'heat.chain',
    'net.optics',
    'net.optics.cpo',
  ],
  wafer: ['up.wafer', 'up.mask', 'up.depo'],
};

const SRC_STAGES = 'lib/data/supply-chain/stages.ts';

const STAGE_NODES: StackNode[] = STAGES.filter((s) => (STAGE_MEMBERS[s.id]?.length ?? 0) > 0).map(
  (s) => ({
    id: `stage.${s.id}`,
    name: l(s.name, s.zh),
    blurb: s.blurb,
    stageId: s.id,
    edges: STAGE_MEMBERS[s.id].map((m) => edgeTo(m, 'stage', SRC_STAGES)),
  }),
);

// ---------------------------------------------------------------------------
export const STACK_NODES: StackNode[] = [
  ...CONTAINMENT_NODES,
  ...FLOW_WAYPOINT_NODES,
  ...SUBSYSTEM_NODES,
  ...STAGE_NODES,
];
