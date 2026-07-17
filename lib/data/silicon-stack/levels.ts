// The scale levels the explorer zooms through, coarsest → finest.

import { l } from '@/lib/i18n/config';

import type { Level } from './types';

export const LEVELS: Level[] = [
  {
    id: 0,
    key: 'rack',
    name: l('The Data Center', '資料中心'),
    zh: '資料中心',
    scale: '≈ 2 m',
    blurb: l(
      'Rows of AI racks — designed in California, built in Taiwan.',
      '一排排 AI 機櫃 — 加州設計，台灣製造。',
    ),
  },
  {
    id: 1,
    key: 'server',
    name: l('Inside the Server', '伺服器內部'),
    zh: '伺服器內部',
    scale: '≈ 60 cm',
    blurb: l(
      'Eight GPUs, kilowatts of power, and a Taiwanese parts list.',
      '八顆 GPU、數千瓦電力，以及一整份台灣零件清單。',
    ),
  },
  {
    id: 2,
    key: 'package',
    name: l('The GPU Package', '晶片封裝'),
    zh: '晶片封裝',
    scale: '≈ 8 cm',
    blurb: l(
      'One die and eight memory stacks, bonded onto a silicon interposer.',
      '一顆裸晶與八疊記憶體，鍵合在矽中介層上。',
    ),
  },
  {
    id: 3,
    key: 'die',
    name: l('The Transistor', '奈米電晶體'),
    zh: '奈米電晶體',
    scale: '≈ 4 nm',
    blurb: l(
      'Features printed with EUV light — one machine, one company on Earth.',
      '以 EUV 光刻印出的結構 — 全世界只有一種機器、一家公司做得到。',
    ),
  },
];
