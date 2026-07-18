// Materials & chemistry — companies in this stage of the chain.

import { l } from '@/lib/i18n/config';

import type { SCCompany } from '../types';

export const MATERIALS_COMPANIES: SCCompany[] = [
  // ---------------- materials: photoresist & chemicals ----------------
  {
    id: 'aemc',
    cat: 'chem',
    name: 'Advanced Echem Materials',
    zh: '新應材',
    ticker: '4749',
    exch: 'TPEx',
    role: l(
      'Photoresist & advanced-node process materials qualified at leading foundries',
      '通過先進製程認證的光阻與製程材料',
    ),
    rel: [{ to: 'tsmc', label: l('resist materials supplier', '光阻材料供應商') }],
  },
  {
    id: 'everlightchem',
    cat: 'chem',
    name: 'Everlight Chemical',
    zh: '永光',
    ticker: '1711',
    exch: 'TWSE',
    role: l(
      'Specialty chemicals incl. photoresist intermediates & electronic chemicals',
      '特用化學品，含光阻中間體與電子化學品',
    ),
    rel: [{ to: 'tsmc', label: l('chemical supplier', '化學品供應商') }],
  },
  {
    id: 'eternal',
    cat: 'chem',
    name: 'Eternal Materials',
    zh: '長興',
    ticker: '1717',
    exch: 'TWSE',
    role: l('World #1 dry-film photoresist & electronic resins', '乾膜光阻全球第一、電子樹脂大廠'),
    rel: [
      { to: 'unimicron', label: l('dry film for substrates', '載板乾膜供應') },
      { to: 'gce', label: l('PCB resist supplier', 'PCB 光阻供應') },
    ],
  },
  {
    id: 'daxin',
    cat: 'chem',
    name: 'Daxin Materials',
    zh: '達興材料',
    ticker: '5234',
    exch: 'TPEx',
    role: l('Semiconductor & advanced-packaging process chemistry', '半導體與先進封裝製程材料'),
    rel: [{ to: 'tsmc', label: l('packaging materials', '封裝材料供應') }],
  },
  {
    id: 'sanfu',
    cat: 'chem',
    name: 'San Fu Chemical',
    zh: '三福化',
    ticker: '4755',
    exch: 'TPEx',
    role: l('Electronic-grade chemicals & specialty gases', '電子級化學品與特用氣體'),
    rel: [{ to: 'tsmc', label: l('wet chemical supplier', '濕化學品供應商') }],
  },
  {
    id: 'shiny',
    cat: 'chem',
    name: 'Shiny Chemical',
    zh: '勝一',
    ticker: '1773',
    exch: 'TWSE',
    role: l('Electronic-grade solvents (NMP, IPA) for fabs', '晶圓廠電子級溶劑（NMP、IPA）'),
    rel: [{ to: 'tsmc', label: l('solvent supplier', '溶劑供應商') }],
  },
  {
    id: 'chunghwachem',
    cat: 'chem',
    name: 'Chung Hwa Chemical',
    zh: '中華化',
    ticker: '1727',
    exch: 'TWSE',
    role: l('Wet electronic chemicals (ammonia, etchants)', '濕電子化學品（氨水、蝕刻液）'),
    rel: [{ to: 'umc', label: l('chemical supplier', '化學品供應商') }],
  },

  // materials: targets / solder
  {
    id: 'solartech',
    cat: 'target',
    name: 'Solar Applied Materials',
    zh: '光洋科',
    ticker: '1785',
    exch: 'TPEx',
    role: l('Sputtering targets & precious-metal recycling for fabs', '濺鍍靶材與貴金屬回收'),
    rel: [{ to: 'tsmc', label: l('target supplier', '靶材供應商') }],
  },
  {
    id: 'shenmao',
    cat: 'target',
    name: 'Shenmao Technology',
    zh: '昇貿',
    ticker: '3305',
    exch: 'TWSE',
    role: l('Solder balls & paste for advanced packaging', '先進封裝用錫球與錫膏'),
    rel: [{ to: 'ase', label: l('solder supplier', '焊料供應商') }],
  },

  // materials: CMP consumables
  {
    id: 'kinik',
    cat: 'cmp',
    name: 'Kinik Company',
    zh: '中砂',
    ticker: '1560',
    exch: 'TWSE',
    role: l(
      'CMP diamond disks co-developed with TSMC; grinding wheels',
      '與台積電共同開發的 CMP 鑽石碟、研磨輪',
    ),
    rel: [{ to: 'tsmc', label: l('CMP disk supplier', 'CMP 鑽石碟供應商') }],
  },
  {
    id: 'rayzher',
    cat: 'cmp',
    name: 'Rayzher Industrial',
    zh: '瑞耘',
    ticker: '6532',
    exch: 'TPEx',
    role: l('CMP retaining rings & precision fab parts', 'CMP 固定環與精密廠務零件'),
    rel: [{ to: 'tsmc', label: l('CMP parts', 'CMP 零件供應') }],
  },

  // materials: glass fiber
  {
    id: 'fulltech',
    cat: 'glass',
    name: 'Fulltech Fiber Glass',
    zh: '富喬',
    ticker: '1815',
    exch: 'TWSE',
    role: l(
      'Ultra-thin & low-Dk glass fiber cloth for high-speed CCL',
      '高速 CCL 用極薄、低介電玻纖布',
    ),
    rel: [
      { to: 'emc2383', label: l('glass cloth supplier', '玻纖布供應商') },
      { to: 'tuc6274', label: l('glass cloth supplier', '玻纖布供應商') },
    ],
  },
  {
    id: 'taiwanglass',
    cat: 'glass',
    name: 'Taiwan Glass',
    zh: '台玻',
    ticker: '1802',
    exch: 'TWSE',
    role: l('Glass fiber yarn & cloth incl. low-dielectric grades', '玻纖紗與玻纖布，含低介電等級'),
    rel: [
      { to: 'emc2383', label: l('glass cloth supplier', '玻纖布供應商') },
      { to: 'nanya1303', label: l('materials peer', '材料同業') },
    ],
  },

  // materials: copper foil
  {
    id: 'cotech',
    cat: 'copperfoil',
    name: 'Co-Tech Development',
    zh: '金居',
    ticker: '8358',
    exch: 'TPEx',
    role: l(
      'RTF/HVLP copper foil for low-loss AI server CCL',
      'AI 伺服器低損耗 CCL 用 RTF/HVLP 銅箔',
    ),
    rel: [
      { to: 'emc2383', label: l('HVLP foil supplier', 'HVLP 銅箔供應商') },
      { to: 'tuc6274', label: l('foil supplier', '銅箔供應商') },
    ],
  },
  {
    id: 'nanya1303',
    cat: 'copperfoil',
    name: 'Nan Ya Plastics',
    zh: '南亞',
    ticker: '1303',
    exch: 'TWSE',
    role: l(
      'Copper foil, glass cloth, CCL and epoxy — the materials conglomerate',
      '銅箔、玻纖布、CCL 與環氧樹脂一手包辦的材料集團',
    ),
    rel: [
      { to: 'nanyapcb', label: l('group substrate maker', '集團載板廠') },
      { to: 'nanyatech', label: l('group DRAM maker', '集團 DRAM 廠') },
    ],
  },

  // materials: PTFE / resin
  {
    id: 'shangpin',
    cat: 'ptfe',
    name: 'Shang Pin Global',
    zh: '上品',
    ticker: '4770',
    exch: 'TWSE',
    role: l(
      'PTFE-lined equipment for ultra-pure chemical delivery in fabs',
      '晶圓廠超純化學輸送用 PTFE 內襯設備',
    ),
    rel: [
      { to: 'tsmc', label: l('fluoropolymer systems', '氟素系統供應') },
      { to: 'trusval', label: l('delivery-system partner', '輸送系統夥伴') },
    ],
  },

  // ---- 2026-07 upstream expansion ----
  {
    id: 'sungsheng7768',
    cat: 'cmp',
    name: 'Sungsheng Technology',
    zh: '頌勝科技',
    ticker: '7768',
    exch: 'TWSE',
    role: l(
      "Taiwan's only volume CMP polishing-pad maker; in TSMC's chain via subsidiary iVT",
      '全台唯一量產 CMP 研磨墊，經子公司智勝 iVT 進入台積電鏈',
    ),
    rel: [{ to: 'tsmc', label: l('CMP pad supplier', 'CMP 研磨墊供應商') }],
  },
  {
    id: 'baoteck5340',
    cat: 'glass',
    name: 'Bao Teck',
    zh: '建榮',
    ticker: '5340',
    exch: 'TPEx',
    role: l(
      'Nittobo affiliate (47.65% held); closest listed proxy to the T-glass cloth monopoly, booked to 2027',
      '日東紡持股 47.65% 的關係企業，最貼近 T-glass 玻纖布獨占者，接單滿至 2027',
    ),
  },
  {
    id: 'dehong5475',
    cat: 'glass',
    name: 'Dehong',
    zh: '德宏',
    ticker: '5475',
    exch: 'TPEx',
    role: l(
      'Only listed Taiwan maker of electronic-grade quartz-fiber yarn/cloth (Rubin-gen low-Df M9/Q)',
      '台灣唯一電子級石英纖維紗／布，Rubin 世代 M9/Q 低 Df 布',
    ),
  },
  {
    id: 'nanpao4766',
    cat: 'chem',
    name: 'Nan Pao Resins',
    zh: '南寶',
    ticker: '4766',
    exch: 'TWSE',
    role: l(
      'JV cutting into TSMC advanced-packaging UV debonding / adhesive materials',
      '與新應材／信紘科合資，切入台積電先進封裝 UV 解膠／膠黏材料',
    ),
  },
];
