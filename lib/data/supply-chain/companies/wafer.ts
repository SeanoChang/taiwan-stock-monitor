// Wafers & masks — companies in this stage of the chain.

import { l } from '@/lib/i18n/config';

import type { SCCompany } from '../types';

export const WAFER_COMPANIES: SCCompany[] = [
  // ---------------- wafers & masks ----------------
  {
    id: 'globalwafers',
    cat: 'si',
    name: 'GlobalWafers',
    zh: '環球晶',
    ticker: '6488',
    exch: 'TPEx',
    role: l('#3 silicon wafer maker worldwide', '全球第三大矽晶圓廠'),
    rel: [
      { to: 'tsmc', label: l('wafer supplier', '晶圓供應商') },
      { to: 'sas5483', label: l('parent group', '母集團') },
    ],
  },
  {
    id: 'sas5483',
    cat: 'si',
    name: 'Sino-American Silicon',
    zh: '中美晶',
    ticker: '5483',
    exch: 'TPEx',
    role: l('Wafer group parent of GlobalWafers', '環球晶母公司、晶圓集團'),
    rel: [{ to: 'globalwafers', label: l('subsidiary', '子公司') }],
  },
  {
    id: 'waferworks',
    cat: 'si',
    name: 'Wafer Works',
    zh: '合晶',
    ticker: '6182',
    exch: 'TPEx',
    role: l('Polished & annealed wafers for power/logic', '功率／邏輯用拋光與退火晶圓'),
    rel: [{ to: 'umc', label: l('wafer supplier', '晶圓供應商') }],
  },
  {
    id: 'formosasumco',
    cat: 'si',
    name: 'Formosa Sumco Technology',
    zh: '台勝科',
    ticker: '3532',
    exch: 'TWSE',
    role: l('300 mm wafers (Formosa Plastics × SUMCO JV)', '300mm 晶圓（台塑×SUMCO 合資）'),
    rel: [{ to: 'tsmc', label: l('wafer supplier', '晶圓供應商') }],
  },
  {
    id: 'episil3016',
    cat: 'si',
    name: 'Episil-Precision',
    zh: '嘉晶',
    ticker: '3016',
    exch: 'TWSE',
    role: l('Epitaxial wafers incl. SiC/GaN', '磊晶圓，含 SiC/GaN'),
    rel: [{ to: 'hanlei', label: l('group foundry partner', '集團代工夥伴') }],
  },
  {
    id: 'psi8028',
    cat: 'reclaim',
    name: 'Phoenix Silicon International',
    zh: '昇陽半導體',
    ticker: '8028',
    exch: 'TPEx',
    role: l(
      "World's largest wafer-reclaim capacity ~850K/mo (→~45% global by 2028); also wafer thinning services",
      '全球最大再生晶圓產能 ~850K 片/月（2028 全球約 45%）；並提供晶圓薄化服務',
    ),
    rel: [{ to: 'tsmc', label: l('reclaim vendor', '再生服務商') }],
  },
  {
    id: 'tmc2338',
    cat: 'mask',
    name: 'Taiwan Mask Corporation',
    zh: '台灣光罩',
    ticker: '2338',
    exch: 'TWSE',
    role: l('Merchant photomask maker', '專業光罩製造商'),
    rel: [
      { to: 'umc', label: l('mask supplier', '光罩供應商') },
      { to: 'vis', label: l('mask supplier', '光罩供應商') },
    ],
  },
  // ---- 2026-07 upstream expansion: specialty gases ----
  {
    id: 'tsc4772',
    cat: 'gas',
    name: 'Taiwan Speciality Chemicals',
    zh: '台特化',
    ticker: '4772',
    exch: 'TPEx',
    role: l(
      'Semiconductor-grade silane/disilane (Si2H6) — TSMC 2nm GAA CVD workhorse (SAS group)',
      '半導體級矽甲烷／乙矽烷（Si2H6）——台積電 2nm GAA CVD 主力（中美晶集團）',
    ),
    rel: [
      { to: 'tsmc', label: l('precursor gas supplier', '前驅物氣體供應商') },
      { to: 'sas5483', label: l('group affiliate', '集團關係企業') },
    ],
  },
  {
    id: 'crystalgas4768',
    cat: 'gas',
    name: 'Crystal-Optech Gas',
    zh: '晶呈科技',
    ticker: '4768',
    exch: 'TPEx',
    role: l(
      'Full-process four-stage specialty gas (C4F8/C4F6/SF6/AHF) + wet chemicals + wafer reclaim',
      '全製程四段特氣（C4F8/C4F6/SF6/AHF）＋濕化學＋再生晶圓',
    ),
    rel: [{ to: 'tsmc', label: l('specialty gas supplier', '特氣供應商') }],
  },
  {
    id: 'luhon1229',
    cat: 'gas',
    name: 'Lien Hwa Industrial Holdings',
    zh: '聯華實業控股',
    ticker: '1229',
    exch: 'TWSE',
    role: l(
      "Holds ~50% of unlisted Lien Hwa Linde (Taiwan's largest industrial-gas maker) — the only listed proxy",
      '持台灣最大工業氣體商聯華林德約 50%（林德未上市，唯一掛牌曝險）',
    ),
    rel: [{ to: 'tsmc', label: l('industrial gas (via JV)', '工業氣體（透過合資）') }],
  },
];
