// Guided-tour narration and idle hints shown by the explorer HUD.

import { l } from '@/lib/i18n/config';
import type { LStr } from '@/lib/i18n/config';

export const TOUR: LStr[] = [
  l(
    'It starts in a data center. NVIDIA designs the platform — but the racks are assembled by Taiwan’s Foxconn and Quanta.',
    '故事從資料中心開始。NVIDIA 設計平台 — 但機櫃是由台灣的鴻海與廣達組裝。',
  ),
  l(
    'Open one server: Delta powers it, AVC cools it, ASPEED’s tiny chip manages it. Nearly every part traces back to Taiwan.',
    '打開一台伺服器：台達電供電、奇鋐散熱、信驊的小晶片負責管理。幾乎每個零件都來自台灣。',
  ),
  l(
    'The GPU itself is a sandwich: a TSMC-made die, SK hynix memory stacks, all packaged on TSMC’s CoWoS interposer.',
    'GPU 本身是一份三明治：台積電製造的裸晶、SK 海力士的記憶體堆疊，全部封裝在台積電的 CoWoS 中介層上。',
  ),
  l(
    'Zoom to 4 nanometers. These shapes are printed with EUV light — machines only ASML can build, with optics only Zeiss can grind.',
    '放大到 4 奈米。這些結構以 EUV 光印出 — 機器只有 ASML 造得出來，鏡片只有蔡司磨得出來。',
  ),
];

export const HINTS: LStr[] = [
  l('Drag to orbit · Scroll to zoom deeper · Click a label', '拖曳旋轉 · 滾輪深入 · 點擊標籤'),
  l(
    'Scroll in on the GPUs to go deeper · Scroll out to return',
    '對著 GPU 滾輪放大可深入 · 縮小可返回',
  ),
  l('Scroll in on the die to reach the nanometer scale', '對著裸晶滾輪放大，進入奈米尺度'),
  l(
    'You’ve reached 4 nm — the atomic frontier · Scroll out to return',
    '你已抵達 4 奈米 — 原子的邊疆 · 縮小可返回',
  ),
];
