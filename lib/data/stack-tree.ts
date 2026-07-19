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

// ---------------------------------------------------------------------------
// Per-node base confidence tier — the single source of truth `edgeTo()` reads
// from, so every edge that targets a node (containment/subsystem/stage) can
// never drift from that node's own verification tier. Derived from the
// nav-map's per-line `[✓]`/`[s]`/`[?]` tag, downgraded to `sourced` where the
// doc itself flags the *specific supplier* attribution uncertain even though
// the structural fact is `[✓]` (rack.copper / rack.rails' "★…／…[?]" asides
// name a plausible TW company without confirming it — see nav-map).
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
  'net.scaleup': 'verified',
  'net.scaleout': 'verified',
  'power.chain': 'verified',
  'heat.chain': 'verified',
  // rack.cooling / rack.copper / rack.rails: nav-map tags the manifold/cable/
  // rail *structure* [✓], and the named companies (avc/auras/kaori/fositek,
  // bizlink, kingslide/nanjuen) already carry confirmed `rel` edges to
  // nvidia/wiwynn/quanta elsewhere in supply-chain.ts — treated as verified.
  'rack.cooling': 'verified',
  'rack.copper': 'verified',
  'rack.rails': 'verified',

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
};

/** Build an outgoing edge; confidence is read from the TARGET's declared
 * tier, so `actionable` can never disagree with `confidence` (honesty
 * invariant, spec §6) and no edge can silently point at an undeclared node. */
function edgeTo(to: string, axis: Axis, sourceUrl?: string): StackEdge {
  const confidence = NODE_TIER[to];
  if (!confidence) {
    throw new Error(`stack-tree: edgeTo("${to}") — no NODE_TIER entry for "${to}"`);
  }
  return { to, axis, confidence, actionable: confidence === 'verified', sourceUrl };
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
    edges: [edgeTo('rack', 'containment', SRC_NAVMAP)],
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
    edges: [edgeTo('power.chain', 'containment', SRC_NAVMAP)],
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
    edges: [],
  },
  {
    id: 'rack.busbar',
    name: l('Busbar', '匯流排'),
    blurb: l('~50V DC / 1400A rack power distribution.', '~50V DC / 1400A 機櫃配電匯流排。'),
    categoryId: 'connect',
    companyIds: ['bizlink'],
    stageId: 'subsystem',
    specs: [spec('~50V DC / 1400A', 'verified')],
    edges: [],
  },
  {
    id: 'rack.cooling',
    name: l('Manifold & Quick-Disconnect', '歧管/QD'),
    blurb: l('Full-rack liquid-cooling manifolds and quick-disconnects.', '全櫃液冷歧管與快接頭。'),
    categoryId: 'thermal',
    companyIds: ['avc', 'auras', 'fositek', 'kaori'],
    stageId: 'subsystem',
    edges: [edgeTo('heat.chain', 'containment', SRC_NAVMAP)],
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
      edgeTo('gpu.internal.sm', 'containment', SRC_NAVMAP),
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
    edges: [edgeTo('mem.tiers', 'containment', SRC_NAVMAP)],
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
    edges: [],
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
    id: 'gpu.internal.sm',
    name: l('Streaming Multiprocessors', 'SM'),
    blurb: l(
      '×160 SMs (128 CUDA + 4 Tensor + 256KB TMEM each) = 20,480 CUDA cores.',
      '160 個 SM（各 128 CUDA + 4 Tensor + 256KB TMEM）＝共 20,480 個 CUDA 核心。',
    ),
    categoryId: 'anchorcat',
    companyIds: ['nvidia'],
    stageId: 'anchor',
    specs: [spec('160 SM × (128 CUDA + 4 Tensor + 256KB TMEM) = 20,480 CUDA', 'verified')],
    edges: [],
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
    edges: [],
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
    edges: [edgeTo('net.optics', 'containment', SRC_NAVMAP)],
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
export const STACK_NODES: StackNode[] = [...CONTAINMENT_NODES, ...SUBSYSTEM_NODES, ...STAGE_NODES];
