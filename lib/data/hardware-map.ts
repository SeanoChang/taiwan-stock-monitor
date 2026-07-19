// Part → category → companies map for the depth-gated hardware cards
// (Plan 006 Phase D). Each HardwarePart anchors a REGISTERED PartId (see
// lib/scene/types.ts's PartId / lib/scene/parts.ts's ALL_PART_IDS) to an
// EXISTING supply-chain category (lib/data/supply-chain/categories.ts); the
// card's company list is *derived* from that category's members (TW-listed
// first) via companiesForPart() below, so every card always resolves to at
// least one real, live-quoted company — curated companyIds are just an
// explicit top ordering, never a hard dependency.
//
// See scripts/check-hardware.ts for the integrity gate (pnpm check:hardware)
// and docs/superpowers/apple-redesign/03-component-annotations/ for the
// design contract this seed implements.

import { l, type LStr } from '@/lib/i18n/config';
import { COMPANIES } from '@/lib/data/supply-chain/companies';
import type { SCCompany } from '@/lib/data/supply-chain/types';
import type { PartId } from '@/lib/scene/types';

export interface HardwarePart {
  id: PartId; // MUST match a registered PartId (ALL_PART_IDS)
  name: LStr; // part name shown on the card
  blurb: LStr; // one-line description
  categoryId: string; // → lib/data/supply-chain/categories.ts CATEGORY_MAP id
  companyIds?: string[]; // explicit top ordering; else category members, TW-first
  chapters: [number, number]; // inclusive CHAPTERS id range [0,7] the card is visible in
  anchor: [number, number, number]; // local-space anchor on the part's Object3D
  priority: number; // density tie-break — higher wins when capping simultaneous cards
}

// Seed coverage: 22 of the 29 registered PartIds, spanning chapters 1
// (rack) through 6 (transistor fins) of the scroll disassembly. gpuModule*
// and hbm* beyond the representative gpuModule0/hbm0 give the package-level
// chapters (4–6) enough distinct anchors to reach the design doc's density
// targets without inventing unregistered PartIds.
export const HARDWARE_PARTS: HardwarePart[] = [
  {
    id: 'rack',
    name: l('Rack', '機櫃'),
    blurb: l('The open rack every server sled slides into.', '每台伺服器最終滑入的開放式機櫃。'),
    categoryId: 'mech',
    companyIds: ['kingslide', 'nanjuen'],
    chapters: [1, 4],
    anchor: [0, 0, 0],
    priority: 100,
  },
  {
    id: 'board',
    name: l('GPU baseboard', 'GPU 基板'),
    blurb: l(
      'The 20+ layer UBB board carrying every GPU module.',
      '20 層以上的 UBB 基板，承載所有 GPU 模組。',
    ),
    categoryId: 'pcb',
    companyIds: ['gce', 'tripod'],
    chapters: [3, 4],
    anchor: [0, 0, 0],
    priority: 98,
  },
  {
    id: 'sled',
    name: l('Sled chassis', '抽換式機箱'),
    blurb: l(
      'The pull-out tray carrying the board, PSUs and cooling.',
      '承載主機板、電源與散熱模組的抽換式機箱。',
    ),
    categoryId: 'mech',
    companyIds: ['chenbro', 'chenming'],
    chapters: [2, 4],
    anchor: [0, 0, 0],
    priority: 96,
  },
  {
    id: 'lid',
    name: l('Chassis lid', '機箱上蓋'),
    blurb: l('Seals the sled for airflow and EMI shielding.', '密封機箱，導引氣流並屏蔽電磁干擾。'),
    categoryId: 'mech',
    chapters: [3, 4],
    anchor: [0, 0, 0],
    priority: 90,
  },
  {
    id: 'fanWall',
    name: l('Fan wall', '風扇牆'),
    blurb: l(
      'High-static-pressure fans driving airflow through the sled.',
      '高靜壓風扇陣列，把氣流吹過整個機箱。',
    ),
    categoryId: 'thermal',
    companyIds: ['sunon', 'avc'],
    chapters: [3, 4],
    anchor: [0, 0, 0],
    priority: 88,
  },
  {
    id: 'psu0',
    name: l('Power supply (PSU-0)', '電源供應器 0'),
    blurb: l(
      'One of the redundant multi-kilowatt PSUs feeding the sled.',
      '為機箱供電的多顆備援千瓦級電源之一。',
    ),
    categoryId: 'power',
    companyIds: ['delta', 'liteon'],
    chapters: [3, 4],
    anchor: [0, 0, 0],
    priority: 86,
  },
  {
    id: 'psu1',
    name: l('Power supply (PSU-1)', '電源供應器 1'),
    blurb: l('The second PSU in the N+1 redundant pair.', 'N+1 備援配置中的第二顆電源供應器。'),
    categoryId: 'power',
    companyIds: ['acbel', 'chiconypower'],
    chapters: [3, 4],
    anchor: [0, 0, 0],
    priority: 84,
  },
  {
    id: 'gpuTray',
    name: l('GPU tray', 'GPU 托盤'),
    blurb: l(
      'Precision tray seating every GPU module onto the baseboard.',
      '將 GPU 模組精準定位到基板上的精密托盤。',
    ),
    categoryId: 'mech',
    chapters: [4, 5],
    anchor: [0, 0, 0],
    priority: 82,
  },
  {
    id: 'heatsink',
    name: l('3D vapor-chamber heatsink', '3D-VC 均熱散熱片'),
    blurb: l(
      'Vapor-chamber heatsink pulling heat off a 1,000W GPU.',
      '把 1,000W GPU 熱量帶走的均熱板散熱片。',
    ),
    categoryId: 'thermal',
    companyIds: ['avc', 'forcecon'],
    chapters: [4, 5],
    anchor: [0, 0, 0],
    priority: 80,
  },
  {
    id: 'gpuModule0',
    name: l('GPU module', 'GPU 模組'),
    blurb: l(
      'One of the GPU compute modules assembled onto the board.',
      '組裝在基板上的其中一顆 GPU 運算模組。',
    ),
    categoryId: 'odm',
    companyIds: ['wistron', 'foxconn'],
    chapters: [4, 5],
    anchor: [0, 0, 0],
    priority: 78,
  },
  {
    id: 'interposer',
    name: l('CoWoS interposer', 'CoWoS 中介層'),
    blurb: l(
      'Silicon interposer routing signals between die and HBM.',
      '在裸晶與 HBM 之間繞線的矽中介層。',
    ),
    categoryId: 'foundry',
    companyIds: ['tsmc', 'umc'],
    chapters: [5, 6],
    anchor: [0, 0, 0],
    priority: 76,
  },
  {
    id: 'substrate',
    name: l('ABF substrate', 'ABF 載板'),
    blurb: l(
      'Fine-line resin substrate fanning the die out to the board.',
      '把裸晶線路扇出到電路板的細線路載板。',
    ),
    categoryId: 'substrate',
    companyIds: ['unimicron', 'kinsus'],
    chapters: [5, 6],
    anchor: [0, 0, 0],
    priority: 74,
  },
  {
    id: 'die',
    name: l('GPU die', 'GPU 裸晶'),
    blurb: l(
      'The compute die, fabricated on the leading-edge process.',
      '以最先進製程製造的 GPU 運算裸晶。',
    ),
    categoryId: 'foundry',
    companyIds: ['tsmc'],
    chapters: [5, 6],
    anchor: [0, 0, 0],
    priority: 72,
  },
  {
    id: 'hbm0',
    name: l('HBM stack', 'HBM 記憶體堆疊'),
    blurb: l(
      'One of the high-bandwidth memory stacks beside the die.',
      '緊鄰裸晶放置的高頻寬記憶體堆疊之一。',
    ),
    categoryId: 'memchip',
    chapters: [5, 6],
    anchor: [0, 0, 0],
    priority: 70,
  },
  {
    id: 'fins',
    name: l('Transistor fins', '電晶體鰭狀結構'),
    blurb: l(
      'Where EUV lithography defines each 4nm transistor.',
      'EUV 微影定義出每顆 4 奈米電晶體的地方。',
    ),
    categoryId: 'euv',
    companyIds: ['gudeng', 'greenfilter'],
    chapters: [6, 6],
    anchor: [0, 0, 0],
    priority: 68,
  },
  {
    id: 'gpuModule1',
    name: l('GPU module 2', 'GPU 模組 2'),
    blurb: l(
      'A second GPU compute module on the same baseboard.',
      '同一張基板上的第二顆 GPU 運算模組。',
    ),
    categoryId: 'odm',
    chapters: [4, 5],
    anchor: [0, 0, 0],
    priority: 60,
  },
  {
    id: 'gpuModule2',
    name: l('GPU module 3', 'GPU 模組 3'),
    blurb: l(
      'A third GPU compute module on the same baseboard.',
      '同一張基板上的第三顆 GPU 運算模組。',
    ),
    categoryId: 'odm',
    chapters: [4, 5],
    anchor: [0, 0, 0],
    priority: 58,
  },
  {
    id: 'gpuModule3',
    name: l('GPU module 4', 'GPU 模組 4'),
    blurb: l(
      'A fourth GPU compute module on the same baseboard.',
      '同一張基板上的第四顆 GPU 運算模組。',
    ),
    categoryId: 'odm',
    chapters: [4, 5],
    anchor: [0, 0, 0],
    priority: 56,
  },
  {
    id: 'gpuModule4',
    name: l('GPU module 5', 'GPU 模組 5'),
    blurb: l(
      'A fifth GPU compute module on the same baseboard.',
      '同一張基板上的第五顆 GPU 運算模組。',
    ),
    categoryId: 'odm',
    chapters: [4, 5],
    anchor: [0, 0, 0],
    priority: 54,
  },
  {
    id: 'hbm1',
    name: l('HBM stack 2', 'HBM 記憶體堆疊 2'),
    blurb: l(
      'A second high-bandwidth memory stack beside the die.',
      '裸晶旁的第二組高頻寬記憶體堆疊。',
    ),
    categoryId: 'memchip',
    chapters: [5, 6],
    anchor: [0, 0, 0],
    priority: 50,
  },
  {
    id: 'hbm2',
    name: l('HBM stack 3', 'HBM 記憶體堆疊 3'),
    blurb: l(
      'A third high-bandwidth memory stack beside the die.',
      '裸晶旁的第三組高頻寬記憶體堆疊。',
    ),
    categoryId: 'memchip',
    chapters: [5, 6],
    anchor: [0, 0, 0],
    priority: 48,
  },
  {
    id: 'hbm3',
    name: l('HBM stack 4', 'HBM 記憶體堆疊 4'),
    blurb: l(
      'A fourth high-bandwidth memory stack beside the die.',
      '裸晶旁的第四組高頻寬記憶體堆疊。',
    ),
    categoryId: 'memchip',
    chapters: [5, 6],
    anchor: [0, 0, 0],
    priority: 46,
  },
];

const twFirst = (a: SCCompany, b: SCCompany) => {
  const tw = (c: SCCompany) => (c.exch === 'TWSE' || c.exch === 'TPEx' ? 0 : 1);
  return tw(a) - tw(b);
};

/** Companies for a part: explicit companyIds first (in order), then the rest of the
 *  category's members, TW-listed first. */
export function companiesForPart(part: HardwarePart): SCCompany[] {
  const inCat = COMPANIES.filter((c) => c.cat === part.categoryId);
  const explicit = (part.companyIds ?? [])
    .map((id) => inCat.find((c) => c.id === id))
    .filter(Boolean) as SCCompany[];
  const rest = inCat.filter((c) => !explicit.includes(c)).sort(twFirst);
  return [...explicit, ...rest];
}
