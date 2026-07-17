// The ten top-level stages of the chain, ordered raw inputs → cloud.

import { l } from '@/lib/i18n/config';

import type { SCStage } from './types';

export const STAGES: SCStage[] = [
  {
    id: 'materials',
    name: 'Materials & Chemistry',
    zh: '材料化學',
    blurb: l(
      'Resists, chemicals, targets, glass fiber, copper foil — the raw inputs.',
      '光阻、化學品、靶材、玻纖、銅箔 — 一切的原料。',
    ),
  },
  {
    id: 'fabsupport',
    name: 'Equipment & Fab Support',
    zh: '設備廠務',
    blurb: l(
      'Process tools, EUV carriers, cleanrooms and distribution.',
      '製程設備、EUV 傳載、無塵室與材料通路。',
    ),
  },
  {
    id: 'wafer',
    name: 'Wafers & Masks',
    zh: '晶圓光罩',
    blurb: l(
      'Polished silicon, epitaxy, reclaim and photomasks.',
      '拋光矽晶圓、磊晶、再生與光罩。',
    ),
  },
  {
    id: 'chip',
    name: 'Chip Design & Fab',
    zh: '晶片設計製造',
    blurb: l(
      'Foundry, memory, fabless design, ASIC services and IP.',
      '晶圓代工、記憶體、IC 設計、ASIC 服務與 IP。',
    ),
  },
  {
    id: 'package',
    name: 'Package & Test',
    zh: '封裝測試',
    blurb: l(
      'OSAT, substrates, lead frames and test interfaces.',
      '封測、載板、導線架與測試介面。',
    ),
  },
  {
    id: 'board',
    name: 'Boards & Passives',
    zh: '電路板被動元件',
    blurb: l(
      'Glass-fiber laminates, high-layer PCBs and passives.',
      '玻纖基板、高層數電路板與被動元件。',
    ),
  },
  {
    id: 'subsystem',
    name: 'Server Subsystems',
    zh: '伺服器子系統',
    blurb: l(
      'Cooling, power, mechanics, connectivity and optics.',
      '散熱、電源、機構、連接與光通訊。',
    ),
  },
  {
    id: 'system',
    name: 'Systems & Integration',
    zh: '系統整合',
    blurb: l(
      'AI servers, racks, boards and storage — assembled in Taiwan.',
      'AI 伺服器、機櫃、板卡與儲存 — 台灣組裝。',
    ),
  },
  {
    id: 'cloud',
    name: 'Network & Cloud',
    zh: '網路雲端',
    blurb: l(
      'Switches, telecom backbones and AI cloud services.',
      '交換器、電信骨幹與 AI 雲端服務。',
    ),
  },
  {
    id: 'anchor',
    name: 'Global Anchors',
    zh: '全球夥伴',
    blurb: l('The non-Taiwan giants the chain plugs into.', '與台灣供應鏈相互嵌合的全球巨頭。'),
  },
];
