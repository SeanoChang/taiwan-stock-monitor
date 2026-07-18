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
      'Photoresist & advanced-node process materials qualified at leading foundries; 2nm EBR/rinse/develop chemistry shipped to all 4 TSMC 2nm fabs as sole yellow-light-area kit supplier',
      '通過先進製程認證的光阻與製程材料；2nm 邊緣曝光／清洗／顯影材料供應台積電全部 4 座 2nm 廠，為黃光區獨家材料商',
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
    role: l(
      'World #1 dry-film photoresist & electronic resins; first to enter TSMC advanced packaging — Apple A20 MUF and M5 LMC materials, validated for CoWoS',
      '乾膜光阻全球第一、電子樹脂大廠；首家切入台積電先進封裝 — Apple A20 MUF 與 M5 LMC 材料，通過 CoWoS 驗證',
    ),
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
    role: l(
      'Wet electronic chemicals (ammonia, etchants); 5th production line for PPT-grade electronic sulfuric acid; etch/develop process chemistry supplied direct to fabs',
      '濕電子化學品（氨水、蝕刻液）；PPT 級電子硫酸第 5 條產線；蝕刻／顯影製程化學品直供晶圓廠',
    ),
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
    role: l(
      'Sputtering targets (incl. ruthenium for TSMC 2nm/RRAM) & closed-loop precious-metal recycling for fabs; emerging-market subsidiary Chuangju (創鉅)',
      '濺鍍靶材（含供應台積電 2nm／RRAM 的釕靶）與貴金屬閉環回收；興櫃子公司創鉅',
    ),
    rel: [{ to: 'tsmc', label: l('target supplier', '靶材供應商') }],
  },
  {
    id: 'shenmao',
    cat: 'target',
    name: 'Shenmao Technology',
    zh: '昇貿',
    ticker: '3305',
    exch: 'TWSE',
    role: l(
      'Solder balls & paste for advanced packaging — AI/HPC now ~50% of revenue; low-temperature BGA solder balls and metal-based thermal interface materials',
      '先進封裝用錫球與錫膏 — AI／HPC 已占營收約五成；低溫 BGA 錫球與金屬基導熱材料',
    ),
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
      'CMP diamond disks co-developed with TSMC — ~70% share of TSMC 3nm diamond disks (displacing 3M); grinding wheels; A16 node uses ~77 CMP layers',
      '與台積電共同開發的 CMP 鑽石碟，3nm 佔比約 70%（取代 3M）；研磨輪；A16 製程 CMP 層數約 77 層',
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
      'Ultra-thin & low-Dk glass fiber cloth for high-speed CCL, expanding low-Dk/low-CTE product lines for next-gen AI substrates',
      '高速 CCL 用極薄、低介電玻纖布，擴大低介電／低熱膨脹係數（CTE）產品線因應新世代 AI 載板',
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
    role: l(
      'Glass fiber yarn & cloth incl. low-dielectric grades, expanding low-Dk/low-CTE glass-cloth capacity for AI substrates',
      '玻纖紗與玻纖布，含低介電等級，擴大低介電／低熱膨脹係數玻纖布產能因應 AI 載板需求',
    ),
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
      'RTF/HVLP copper foil for low-loss AI server CCL — HVLP3 grade for ASIC boards, HVLP4 for NVIDIA GPU compute/switch trays; capacity to grow over 50% in H2 2026',
      'AI 伺服器低損耗 CCL 用 RTF/HVLP 銅箔 — HVLP3 供應 ASIC 板、HVLP4 供應 NVIDIA GPU 運算／交換器托盤；2026 下半年產能將增逾 50%',
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
      'Copper foil, glass cloth, CCL and epoxy — the materials conglomerate; weaves Nittobo specialty glass cloth under contract',
      '銅箔、玻纖布、CCL 與環氧樹脂一手包辦的材料集團；委託代織日東紡特殊玻纖布',
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
    rel: [
      { to: 'emc2383', label: l('glass-cloth supplier', '玻纖布供應商') },
      { to: 'tuc6274', label: l('glass-cloth supplier', '玻纖布供應商') },
    ],
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
    rel: [{ to: 'emc2383', label: l('glass-cloth supplier', '玻纖布供應商') }],
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
    rel: [
      { to: 'aemc', label: l('advanced-packaging material partner', '先進封裝材料夥伴') },
      { to: 'trusval', label: l('advanced-packaging material partner', '先進封裝材料夥伴') },
    ],
  },
];
