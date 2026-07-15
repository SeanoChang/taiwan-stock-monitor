// Silicon Stack — curated supply-chain dataset (illustrative snapshot, 15 Jul 2026)
// Bilingual (en / zh-Hant-TW). Structured so a live quote API can later replace
// priceText/chg/mcapText per ticker.

import { l } from '@/lib/l10n';
import type { LStr } from '@/lib/l10n';

export interface Level {
  id: number;
  key: string;
  name: LStr;
  zh: string; // short zh tag shown beside the scale
  scale: string;
  blurb: LStr;
}

export interface CompanyLink {
  to: string;
  label: LStr;
}

export interface Company {
  short: string;
  name: string;
  ticker: string;
  exch: string;
  country: LStr;
  private?: boolean;
  note?: LStr;
  priceText: string;
  chg: number;
  mcapText: string;
  role: LStr;
  share: LStr;
  desc: LStr;
  links: CompanyLink[];
}

export const LEVELS: Level[] = [
  { id: 0, key: 'rack', name: l('The Data Center', '資料中心'), zh: '資料中心', scale: '≈ 2 m',
    blurb: l('Rows of AI racks — designed in California, built in Taiwan.', '一排排 AI 機櫃 — 加州設計，台灣製造。') },
  { id: 1, key: 'server', name: l('Inside the Server', '伺服器內部'), zh: '伺服器內部', scale: '≈ 60 cm',
    blurb: l('Eight GPUs, kilowatts of power, and a Taiwanese parts list.', '八顆 GPU、數千瓦電力，以及一整份台灣零件清單。') },
  { id: 2, key: 'package', name: l('The GPU Package', '晶片封裝'), zh: '晶片封裝', scale: '≈ 8 cm',
    blurb: l('One die and eight memory stacks, bonded onto a silicon interposer.', '一顆裸晶與八疊記憶體，鍵合在矽中介層上。') },
  { id: 3, key: 'die', name: l('The Transistor', '奈米電晶體'), zh: '奈米電晶體', scale: '≈ 4 nm',
    blurb: l('Features printed with EUV light — one machine, one company on Earth.', '以 EUV 光刻印出的結構 — 全世界只有一種機器、一家公司做得到。') }
];

export const TOUR: LStr[] = [
  l('It starts in a data center. NVIDIA designs the platform — but the racks are assembled by Taiwan’s Foxconn and Quanta.',
    '故事從資料中心開始。NVIDIA 設計平台 — 但機櫃是由台灣的鴻海與廣達組裝。'),
  l('Open one server: Delta powers it, AVC cools it, ASPEED’s tiny chip manages it. Nearly every part traces back to Taiwan.',
    '打開一台伺服器：台達電供電、奇鋐散熱、信驊的小晶片負責管理。幾乎每個零件都來自台灣。'),
  l('The GPU itself is a sandwich: a TSMC-made die, SK hynix memory stacks, all packaged on TSMC’s CoWoS interposer.',
    'GPU 本身是一份三明治：台積電製造的裸晶、SK 海力士的記憶體堆疊，全部封裝在台積電的 CoWoS 中介層上。'),
  l('Zoom to 4 nanometers. These shapes are printed with EUV light — machines only ASML can build, with optics only Zeiss can grind.',
    '放大到 4 奈米。這些結構以 EUV 光印出 — 機器只有 ASML 造得出來，鏡片只有蔡司磨得出來。')
];

export const HINTS: LStr[] = [
  l('Drag to orbit · Scroll to zoom deeper · Click a label', '拖曳旋轉 · 滾輪深入 · 點擊標籤'),
  l('Scroll in on the GPUs to go deeper · Scroll out to return', '對著 GPU 滾輪放大可深入 · 縮小可返回'),
  l('Scroll in on the die to reach the nanometer scale', '對著裸晶滾輪放大，進入奈米尺度'),
  l('You’ve reached 4 nm — the atomic frontier · Scroll out to return', '你已抵達 4 奈米 — 原子的邊疆 · 縮小可返回')
];

export const COMPANIES: Record<string, Company> = {
  nvidia: { short: 'NVIDIA', name: 'NVIDIA', ticker: 'NVDA', exch: 'NASDAQ', country: l('United States', '美國'),
    priceText: 'US$171.80', chg: 1.4, mcapText: 'US$4.2T',
    role: l('AI compute platform', 'AI 運算平台'),
    share: l('~90% of AI accelerator market', 'AI 加速器市占約 90%'),
    desc: l('Designs the GPUs and rack-scale systems at the heart of AI data centers. Fabless — every leading chip is manufactured and packaged by TSMC in Taiwan.',
      '設計 AI 資料中心核心的 GPU 與整櫃系統。無晶圓廠 — 每一顆旗艦晶片都由台灣的台積電製造與封裝。'),
    links: [ { to: 'tsmc', label: l('sole foundry for its GPUs', 'GPU 唯一代工廠') }, { to: 'skhynix', label: l('primary HBM supplier', '主要 HBM 供應商') }, { to: 'foxconn', label: l('builds its rack systems', '組裝整櫃系統') }, { to: 'quanta', label: l('builds its servers', '製造伺服器') } ] },

  tsmc: { short: 'TSMC', name: 'TSMC 台積電', ticker: '2330.TW', exch: 'TWSE', country: l('Taiwan', '台灣'),
    priceText: 'NT$1,145', chg: 0.8, mcapText: 'US$1.1T',
    role: l('Advanced chip foundry', '先進晶圓代工'),
    share: l('~90% of sub-5nm foundry output', '5 奈米以下產能約 90%'),
    desc: l('The world’s dominant advanced foundry. Nearly every leading AI chip is manufactured on its EUV-based nodes in Hsinchu, Taichung and Tainan.',
      '全球最強的先進製程代工廠。幾乎所有旗艦 AI 晶片都在新竹、台中、台南的 EUV 產線上誕生。'),
    links: [ { to: 'nvidia', label: l('chief AI customer', '最大 AI 客戶') }, { to: 'asml', label: l('buys its EUV machines', '採購其 EUV 機台') }, { to: 'shinetsu', label: l('wafer & resist supplier', '晶圓與光阻供應商') }, { to: 'globalwafers', label: l('wafer supplier', '晶圓供應商') }, { to: 'ase', label: l('packaging partner', '封裝夥伴') } ] },

  foxconn: { short: 'Foxconn', name: 'Hon Hai 鴻海 (Foxconn)', ticker: '2317.TW', exch: 'TWSE', country: l('Taiwan', '台灣'),
    priceText: 'NT$182.0', chg: 0.5, mcapText: 'US$78B',
    role: l('AI rack integration', 'AI 機櫃整合'),
    share: l('~40% of global AI server assembly', '全球 AI 伺服器組裝約 40%'),
    desc: l('The world’s largest electronics manufacturer. Assembles full GB-series AI racks for NVIDIA and the hyperscalers.',
      '全球最大電子製造商。為 NVIDIA 與各大雲端巨頭組裝完整的 GB 系列 AI 機櫃。'),
    links: [ { to: 'nvidia', label: l('rack systems partner', '機櫃系統夥伴') }, { to: 'delta', label: l('power supplier', '電源供應商') } ] },

  quanta: { short: 'Quanta', name: 'Quanta 廣達', ticker: '2382.TW', exch: 'TWSE', country: l('Taiwan', '台灣'),
    priceText: 'NT$288.0', chg: 1.1, mcapText: 'US$56B',
    role: l('AI server ODM', 'AI 伺服器代工'),
    share: l('Top-tier AI server ODM', '一線 AI 伺服器 ODM'),
    desc: l('Taiwanese ODM designing and building AI servers for the major US cloud providers.',
      '為美國主要雲端服務商設計並製造 AI 伺服器的台灣 ODM 大廠。'),
    links: [ { to: 'nvidia', label: l('server platform partner', '伺服器平台夥伴') }, { to: 'avc', label: l('thermal supplier', '散熱供應商') } ] },

  smci: { short: 'Supermicro', name: 'Super Micro Computer', ticker: 'SMCI', exch: 'NASDAQ', country: l('United States', '美國'),
    priceText: 'US$46.20', chg: -0.6, mcapText: 'US$27B',
    role: l('Rack-scale systems', '整櫃系統'),
    share: l('Rack-scale AI systems specialist', '整櫃式 AI 系統專家'),
    desc: l('Builds liquid-cooled, rack-scale AI systems — with most motherboards and subassemblies made in Taiwan.',
      '打造液冷整櫃 AI 系統 — 主機板與大多數子組件皆為台灣製造。'),
    links: [ { to: 'nvidia', label: l('GPU systems partner', 'GPU 系統夥伴') } ] },

  delta: { short: 'Delta', name: 'Delta Electronics 台達電', ticker: '2308.TW', exch: 'TWSE', country: l('Taiwan', '台灣'),
    priceText: 'NT$425.0', chg: 0.9, mcapText: 'US$44B',
    role: l('Power systems', '電源系統'),
    share: l('>50% of AI server power supplies', 'AI 伺服器電源市占逾 50%'),
    desc: l('Powers the AI buildout: server PSUs, rack busbars, and liquid-cooling systems. A quiet giant of the Taiwan exchange.',
      '撐起 AI 建設的電力：伺服器電源、機櫃匯流排與液冷系統。台股裡低調的巨人。'),
    links: [ { to: 'foxconn', label: l('supplies rack power', '供應機櫃電源') }, { to: 'quanta', label: l('supplies server PSUs', '供應伺服器電源') } ] },

  vertiv: { short: 'Vertiv', name: 'Vertiv Holdings', ticker: 'VRT', exch: 'NYSE', country: l('United States', '美國'),
    priceText: 'US$108.0', chg: 2.1, mcapText: 'US$41B',
    role: l('Data center infrastructure', '資料中心基礎設施'),
    share: l('Leader in DC cooling & power infra', '資料中心冷卻與電力設施領導者'),
    desc: l('Coolant distribution units, in-row cooling and power management for AI data centers.',
      '為 AI 資料中心提供冷卻液分配單元（CDU）、列間冷卻與電力管理。'),
    links: [ { to: 'nvidia', label: l('reference cooling partner', '參考架構冷卻夥伴') } ] },

  avc: { short: 'AVC', name: 'Asia Vital Components 奇鋐', ticker: '3017.TW', exch: 'TWSE', country: l('Taiwan', '台灣'),
    priceText: 'NT$585.0', chg: 1.8, mcapText: 'US$18B',
    role: l('Thermal modules', '散熱模組'),
    share: l('Top server thermal-module maker', '伺服器散熱模組龍頭'),
    desc: l('3D vapor chambers, heatsinks and liquid cold plates that keep 1,000W GPUs from melting.',
      '3D 均熱板、散熱器與液冷冷板，讓一千瓦的 GPU 不至於熔化。'),
    links: [ { to: 'quanta', label: l('supplies cooling', '供應散熱') }, { to: 'foxconn', label: l('supplies cooling', '供應散熱') } ] },

  gce: { short: 'GCE', name: 'Gold Circuit Electronics 金像電', ticker: '2368.TW', exch: 'TWSE', country: l('Taiwan', '台灣'),
    priceText: 'NT$295.0', chg: 1.5, mcapText: 'US$5B',
    role: l('Server PCBs', '伺服器電路板'),
    share: l('Key AI server board supplier', 'AI 伺服器板關鍵供應商'),
    desc: l('High-layer-count printed circuit boards for GPU baseboards and switch trays.',
      '供 GPU 基板與交換器板使用的高層數印刷電路板。'),
    links: [ { to: 'nvidia', label: l('baseboard PCB supplier', '基板 PCB 供應商') } ] },

  aspeed: { short: 'ASPEED', name: 'ASPEED 信驊', ticker: '5274.TWO', exch: 'TPEx', country: l('Taiwan', '台灣'),
    priceText: 'NT$4,150', chg: 0.7, mcapText: 'US$5B',
    role: l('Server management chips', '伺服器管理晶片'),
    share: l('~70% of server BMC chips', '伺服器 BMC 晶片約 70%'),
    desc: l('A 100-person Taiwanese fabless firm whose baseboard-management chips sit inside most of the world’s servers.',
      '一家百人規模的台灣 IC 設計公司，其基板管理晶片藏在全球大多數伺服器裡。'),
    links: [ { to: 'tsmc', label: l('fabricates its chips', '晶片代工') } ] },

  broadcom: { short: 'Broadcom', name: 'Broadcom', ticker: 'AVGO', exch: 'NASDAQ', country: l('United States', '美國'),
    priceText: 'US$268.0', chg: 1.0, mcapText: 'US$1.3T',
    role: l('Networking silicon', '網通晶片'),
    share: l('Ethernet switch silicon leader', '乙太網路交換晶片龍頭'),
    desc: l('Switch and NIC silicon that stitches thousands of GPUs into one training cluster.',
      '交換器與網卡晶片，把數千顆 GPU 織成同一座訓練叢集。'),
    links: [ { to: 'tsmc', label: l('fabricates its chips', '晶片代工') } ] },

  skhynix: { short: 'SK hynix', name: 'SK hynix', ticker: '000660.KS', exch: 'KRX', country: l('South Korea', '南韓'),
    priceText: '₩292,000', chg: 2.4, mcapText: 'US$140B',
    role: l('HBM memory', 'HBM 記憶體'),
    share: l('~50% of HBM market', 'HBM 市占約 50%'),
    desc: l('Leads high-bandwidth memory — the stacked DRAM that feeds data to the GPU die at terabytes per second.',
      '高頻寬記憶體霸主 — 堆疊式 DRAM 以每秒 TB 級速度餵資料給 GPU。'),
    links: [ { to: 'nvidia', label: l('primary HBM customer', '最大 HBM 客戶') }, { to: 'tsmc', label: l('HBM base-die partner', 'HBM 基底晶片夥伴') } ] },

  micron: { short: 'Micron', name: 'Micron Technology', ticker: 'MU', exch: 'NASDAQ', country: l('United States', '美國'),
    priceText: 'US$148.0', chg: 1.2, mcapText: 'US$165B',
    role: l('HBM memory', 'HBM 記憶體'),
    share: l('~25% HBM share', 'HBM 市占約 25%'),
    desc: l('The US challenger in high-bandwidth memory, ramping HBM4 for next-gen accelerators.',
      '高頻寬記憶體的美系挑戰者，正為新一代加速器量產 HBM4。'),
    links: [ { to: 'nvidia', label: l('HBM supplier', 'HBM 供應商') } ] },

  samsung: { short: 'Samsung', name: 'Samsung Electronics', ticker: '005930.KS', exch: 'KRX', country: l('South Korea', '南韓'),
    priceText: '₩91,400', chg: 0.3, mcapText: 'US$420B',
    role: l('Memory & foundry', '記憶體與代工'),
    share: l('Memory giant, #2 foundry', '記憶體巨頭、代工第二'),
    desc: l('Memory giant and the only meaningful foundry rival to TSMC at the leading edge.',
      '記憶體巨頭，也是先進製程上唯一稱得上對手的台積電競爭者。'),
    links: [ { to: 'asml', label: l('buys EUV machines', '採購 EUV 機台') } ] },

  unimicron: { short: 'Unimicron', name: 'Unimicron 欣興', ticker: '3037.TW', exch: 'TWSE', country: l('Taiwan', '台灣'),
    priceText: 'NT$172.0', chg: 1.3, mcapText: 'US$8B',
    role: l('ABF substrates', 'ABF 載板'),
    share: l('Top ABF substrate maker', 'ABF 載板龍頭'),
    desc: l('The resin substrate that fans the die’s microscopic wiring out to the motherboard. Quietly indispensable.',
      '把裸晶顯微等級的線路「扇出」到主機板的樹脂載板。低調卻不可或缺。'),
    links: [ { to: 'tsmc', label: l('substrate supplier', '載板供應商') }, { to: 'ibiden', label: l('chief rival', '主要對手') } ] },

  ibiden: { short: 'Ibiden', name: 'Ibiden', ticker: '4062.T', exch: 'TSE', country: l('Japan', '日本'),
    priceText: '¥6,850', chg: 0.6, mcapText: 'US$9B',
    role: l('IC substrates', 'IC 載板'),
    share: l('Premier package-substrate maker', '頂級封裝載板廠'),
    desc: l('Japanese maker of the highest-end IC package substrates for AI processors.',
      '日本廠商，為 AI 處理器製造最高階的 IC 封裝載板。'),
    links: [ { to: 'unimicron', label: l('chief rival', '主要對手') } ] },

  ase: { short: 'ASE', name: 'ASE Technology 日月光', ticker: '3711.TW', exch: 'TWSE', country: l('Taiwan', '台灣'),
    priceText: 'NT$165.0', chg: 0.9, mcapText: 'US$23B',
    role: l('Packaging & test (OSAT)', '封裝測試（OSAT）'),
    share: l('World’s largest OSAT (~30%)', '全球最大封測廠（約 30%）'),
    desc: l('Packages and final-tests chips for the whole industry, absorbing overflow from TSMC’s advanced packaging lines.',
      '為整個產業封裝與終測晶片，並承接台積電先進封裝的外溢產能。'),
    links: [ { to: 'tsmc', label: l('packaging partner', '封裝夥伴') } ] },

  asml: { short: 'ASML', name: 'ASML Holding', ticker: 'ASML', exch: 'NASDAQ (ADR)', country: l('Netherlands', '荷蘭'),
    priceText: 'US$935.0', chg: 1.6, mcapText: 'US$370B',
    role: l('EUV lithography', 'EUV 微影'),
    share: l('100% of EUV lithography systems', 'EUV 微影機台市占 100%'),
    desc: l('The only company on Earth that builds EUV machines — €200M+ each, 100,000+ parts, shipped in 40 freight containers. No EUV, no advanced AI chips.',
      '地球上唯一造得出 EUV 機台的公司 — 每台逾兩億歐元、超過十萬個零件、要用四十個貨櫃運送。沒有 EUV，就沒有先進 AI 晶片。'),
    links: [ { to: 'zeiss', label: l('sole optics supplier', '唯一光學供應商') }, { to: 'tsmc', label: l('largest EUV customer', '最大 EUV 客戶') }, { to: 'samsung', label: l('EUV customer', 'EUV 客戶') } ] },

  zeiss: { short: 'Zeiss SMT', name: 'Carl Zeiss SMT', ticker: 'Private', exch: '—', country: l('Germany', '德國'),
    private: true, note: l('Privately held — ASML owns a 24.9% stake', '未上市 — ASML 持股 24.9%'), priceText: '—', chg: 0, mcapText: '—',
    role: l('EUV optics', 'EUV 光學'),
    share: l('Sole supplier of EUV mirror optics', 'EUV 反射鏡唯一供應商'),
    desc: l('Grinds EUV mirrors so precise that, scaled to the size of Germany, the largest bump would be 0.1 mm. Every ASML machine depends on them.',
      '研磨的 EUV 反射鏡精度驚人：放大到整個德國，最大的起伏只有 0.1 毫米。每一台 ASML 機器都仰賴它。'),
    links: [ { to: 'asml', label: l('exclusive optics partner', '獨家光學夥伴') } ] },

  shinetsu: { short: 'Shin-Etsu', name: 'Shin-Etsu Chemical', ticker: '4063.T', exch: 'TSE', country: l('Japan', '日本'),
    priceText: '¥5,980', chg: 0.4, mcapText: 'US$78B',
    role: l('Photoresist & wafers', '光阻與晶圓'),
    share: l('#1 in silicon wafers & EUV resist', '矽晶圓與 EUV 光阻雙料第一'),
    desc: l('The light-sensitive chemicals that record EUV patterns, and the ultra-pure silicon wafers they’re printed on.',
      '記錄 EUV 圖形的感光化學品，以及承載這些圖形的超高純度矽晶圓。'),
    links: [ { to: 'tsmc', label: l('materials supplier', '材料供應商') } ] },

  globalwafers: { short: 'GlobalWafers', name: 'GlobalWafers 環球晶', ticker: '6488.TWO', exch: 'TPEx', country: l('Taiwan', '台灣'),
    priceText: 'NT$418.0', chg: 0.7, mcapText: 'US$12B',
    role: l('Silicon wafers', '矽晶圓'),
    share: l('#3 silicon wafer maker globally', '全球第三大矽晶圓廠'),
    desc: l('Taiwanese maker of the 300mm mirror-polished silicon discs every chip begins life on.',
      '台灣廠商，生產每顆晶片的起點 — 300mm 鏡面拋光矽圓片。'),
    links: [ { to: 'tsmc', label: l('wafer supplier', '晶圓供應商') } ] },

  tel: { short: 'Tokyo Electron', name: 'Tokyo Electron', ticker: '8035.T', exch: 'TSE', country: l('Japan', '日本'),
    priceText: '¥29,100', chg: 1.1, mcapText: 'US$90B',
    role: l('Coat & develop tools', '塗佈顯影設備'),
    share: l('~90% of EUV coater/developers', 'EUV 塗佈顯影機約 90%'),
    desc: l('Its coater-developer tools apply and develop photoresist — bolted directly onto every ASML EUV machine.',
      '塗佈顯影機負責上光阻與顯影 — 直接對接在每台 ASML EUV 機台上。'),
    links: [ { to: 'asml', label: l('inline tool partner', '線上設備夥伴') }, { to: 'tsmc', label: l('tool supplier', '設備供應商') } ] },

  lam: { short: 'Lam Research', name: 'Lam Research', ticker: 'LRCX', exch: 'NASDAQ', country: l('United States', '美國'),
    priceText: 'US$98.00', chg: 0.8, mcapText: 'US$126B',
    role: l('Etch tools', '蝕刻設備'),
    share: l('Leader in plasma etch', '電漿蝕刻領導者'),
    desc: l('Etch machines that carve the printed pattern into silicon, atom layer by atom layer.',
      '蝕刻機把印好的圖形一層原子一層原子地刻進矽裡。'),
    links: [ { to: 'tsmc', label: l('tool supplier', '設備供應商') } ] },

  amat: { short: 'Applied Materials', name: 'Applied Materials', ticker: 'AMAT', exch: 'NASDAQ', country: l('United States', '美國'),
    priceText: 'US$212.0', chg: 0.5, mcapText: 'US$172B',
    role: l('Deposition tools', '沉積設備'),
    share: l('#1 in materials engineering', '材料工程第一'),
    desc: l('Deposits the atom-thin films — metals, insulators — that build up a chip’s 60+ layers.',
      '沉積原子級薄膜 — 金屬與絕緣層 — 堆疊出晶片的六十多層結構。'),
    links: [ { to: 'tsmc', label: l('tool supplier', '設備供應商') } ] },

  kla: { short: 'KLA', name: 'KLA Corporation', ticker: 'KLAC', exch: 'NASDAQ', country: l('United States', '美國'),
    priceText: 'US$905.0', chg: 1.4, mcapText: 'US$121B',
    role: l('Metrology & inspection', '量測檢測'),
    share: l('~55% of process control', '製程控制約 55%'),
    desc: l('Finds nanometer-scale defects. At 4nm, a single dust particle is a boulder — KLA is the industry’s microscope.',
      '找出奈米級缺陷。在 4 奈米的世界，一粒灰塵就是一顆巨石 — KLA 是整個產業的顯微鏡。'),
    links: [ { to: 'tsmc', label: l('inspection supplier', '檢測設備供應商') } ] }
};
