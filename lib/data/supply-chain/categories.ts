// Chain nodes within each stage, and the id → category lookup.

import { l } from '@/lib/i18n/config';

import type { SCCategory } from './types';

export const CATEGORIES: SCCategory[] = [
  // materials
  {
    id: 'chem',
    stage: 'materials',
    name: 'Photoresist & process chemicals',
    zh: '光阻／化學品',
    feeds: ['foundry', 'osat'],
    desc: l(
      'Photoresists, developers, solvents, specialty gases and wet chemicals consumed by every lithography, etch and clean step.',
      '光阻、顯影劑、溶劑、特用氣體與濕製程化學品 — 每一道微影、蝕刻、清洗都要消耗。',
    ),
  },
  {
    id: 'target',
    stage: 'materials',
    name: 'Sputtering targets & solders',
    zh: '靶材／焊料',
    feeds: ['foundry', 'osat'],
    desc: l(
      'High-purity metal targets for thin-film deposition, plus solder balls and paste for assembly.',
      '薄膜沉積用高純度金屬靶材，以及封裝用錫球與錫膏。',
    ),
  },
  {
    id: 'cmp',
    stage: 'materials',
    name: 'CMP & grinding consumables',
    zh: '研磨耗材',
    feeds: ['foundry'],
    desc: l(
      'Diamond disks, retaining rings and pads consumed when polishing each wafer layer flat.',
      '鑽石碟、固定環與研磨墊 — 把每一層晶圓磨平所消耗的材料。',
    ),
  },
  {
    id: 'glass',
    stage: 'materials',
    name: 'Glass fiber yarn & cloth',
    zh: '玻纖紗／玻纖布',
    feeds: ['ccl'],
    desc: l(
      'Ultra-thin, low-Dk glass cloth — the woven skeleton inside every copper-clad laminate on an AI board.',
      '極薄、低介電玻纖布 — 每一張 AI 板材（CCL）裡的編織骨架。',
    ),
  },
  {
    id: 'copperfoil',
    stage: 'materials',
    name: 'Copper foil',
    zh: '銅箔',
    feeds: ['ccl'],
    desc: l(
      'Electro-deposited HVLP/RTF copper foil laminated onto glass cloth to make CCL.',
      '電解 HVLP/RTF 銅箔，與玻纖布壓合成銅箔基板。',
    ),
  },
  {
    id: 'ptfe',
    stage: 'materials',
    name: 'Fluoropolymer & specialty resin',
    zh: '氟素材料',
    feeds: ['ccl', 'fabbuild'],
    desc: l(
      'PTFE-lined piping and vessels for ultra-pure chemical delivery, and low-loss resin systems.',
      '超純化學品輸送用 PTFE 內襯管槽，以及低損耗樹脂系統。',
    ),
  },

  // fab support
  {
    id: 'euv',
    stage: 'fabsupport',
    name: 'EUV pods, shells & precision parts',
    zh: 'EUV 傳載盒／精密零組件',
    feeds: ['foundry'],
    desc: l(
      'EUV reticle pods (the vacuum-tight “shells” that carry masks), FOUPs, chamber parts, coatings and molecular filters.',
      'EUV 光罩傳載盒（運送光罩的真空密封「外殼」）、FOUP、腔體零件、鍍膜與化學濾網。',
    ),
  },
  {
    id: 'equip',
    stage: 'fabsupport',
    name: 'Process & test equipment',
    zh: '製程設備',
    feeds: ['foundry', 'osat'],
    desc: l(
      'Wet-process, advanced-packaging, dicing, AOI and handling equipment built in Taiwan.',
      '台灣製造的濕製程、先進封裝、切割、AOI 檢測與搬運設備。',
    ),
  },
  {
    id: 'fabbuild',
    stage: 'fabsupport',
    name: 'Cleanroom & fab engineering',
    zh: '無塵室工程',
    feeds: ['foundry'],
    desc: l(
      'Turn-key cleanrooms, hook-up, ultra-pure gas/chemical delivery and parts cleaning for every new fab.',
      '每座新廠都需要的無塵室統包、二次配、超純氣體化學輸送與零件清洗。',
    ),
  },
  {
    id: 'dist',
    stage: 'fabsupport',
    name: 'Materials & IC distribution',
    zh: '材料／IC 通路',
    feeds: ['foundry', 'odm'],
    desc: l(
      'The trading houses moving wafers, chemicals, quartz and chips through the chain.',
      '在供應鏈中運轉晶圓、化學品、石英與晶片的通路商。',
    ),
  },

  // wafers & masks
  {
    id: 'si',
    stage: 'wafer',
    name: 'Silicon wafers & epitaxy',
    zh: '矽晶圓／磊晶',
    feeds: ['foundry'],
    desc: l(
      '300 mm polished and epitaxial wafers — the blank canvas of every chip.',
      '300mm 拋光與磊晶晶圓 — 每顆晶片的空白畫布。',
    ),
  },
  {
    id: 'reclaim',
    stage: 'wafer',
    name: 'Wafer reclaim',
    zh: '晶圓再生',
    feeds: ['foundry'],
    desc: l(
      'Strips and re-polishes monitor wafers so fabs can reuse them.',
      '將測試片剝除重拋，讓晶圓廠重複使用。',
    ),
  },
  {
    id: 'mask',
    stage: 'wafer',
    name: 'Photomasks',
    zh: '光罩',
    feeds: ['foundry'],
    desc: l(
      'The quartz plates carrying each chip layer’s pattern.',
      '承載晶片每一層圖形的石英板。',
    ),
  },

  // chip
  {
    id: 'foundry',
    stage: 'chip',
    name: 'Foundry',
    zh: '晶圓代工',
    feeds: ['osat', 'substrate'],
    desc: l(
      'Where designs become silicon — Taiwan holds ~90% of leading-edge output plus CoWoS/SoIC packaging.',
      '設計變成矽晶的地方 — 台灣掌握約九成先進製程產能，外加 CoWoS/SoIC 先進封裝。',
    ),
  },
  {
    id: 'memchip',
    stage: 'chip',
    name: 'Memory ICs',
    zh: '記憶體',
    feeds: ['osat', 'storage'],
    desc: l(
      'DRAM, NOR/NAND flash and specialty high-bandwidth memory made in Taiwan.',
      '台灣製造的 DRAM、NOR/NAND 快閃與特殊高頻寬記憶體。',
    ),
  },
  {
    id: 'icdesign',
    stage: 'chip',
    name: 'Fabless IC design',
    zh: 'IC 設計',
    feeds: ['foundry', 'mb', 'odm'],
    desc: l(
      'SoCs, BMCs, retimers, controllers and interface silicon designed in Taiwan.',
      '台灣設計的 SoC、BMC、重定時器、控制器與介面晶片。',
    ),
  },
  {
    id: 'asicip',
    stage: 'chip',
    name: 'ASIC services & silicon IP',
    zh: '設計服務／IP',
    feeds: ['foundry'],
    desc: l(
      'The teams that turn hyperscalers’ AI ambitions into TSMC-ready silicon, plus the IP they license.',
      '把雲端巨頭的 AI 野心變成可下線晶片的設計服務團隊，以及他們授權的 IP。',
    ),
  },
  {
    id: 'analog',
    stage: 'chip',
    name: 'Analog & power ICs',
    zh: '類比／電源 IC',
    feeds: ['power', 'mb'],
    desc: l(
      'Voltage regulation, DrMOS and power-stage silicon feeding kilowatt-class GPUs.',
      '餵飽千瓦級 GPU 的電壓調節、DrMOS 與功率級晶片。',
    ),
  },
  {
    id: 'discrete',
    stage: 'chip',
    name: 'Power discretes',
    zh: '功率元件',
    feeds: ['power'],
    desc: l(
      'MOSFETs, diodes and third-gen (SiC/GaN) devices in every power supply.',
      '每顆電源裡的 MOSFET、二極體與第三代半導體（SiC/GaN）。',
    ),
  },

  // package & test
  {
    id: 'osat',
    stage: 'package',
    name: 'Packaging & test (OSAT)',
    zh: '封裝測試',
    feeds: ['odm', 'mb'],
    desc: l(
      'Assembly, bumping, final test and burn-in — Taiwan is the world’s OSAT hub.',
      '封裝、凸塊、終測與預燒 — 台灣是全球封測重鎮。',
    ),
  },
  {
    id: 'substrate',
    stage: 'package',
    name: 'ABF & BT substrates',
    zh: 'IC 載板',
    feeds: ['osat'],
    desc: l(
      'The fine-line resin boards that fan a die’s wiring out to the PCB.',
      '把裸晶線路扇出到電路板的細線路樹脂載板。',
    ),
  },
  {
    id: 'leadframe',
    stage: 'package',
    name: 'Lead frames',
    zh: '導線架',
    feeds: ['osat'],
    desc: l(
      'Stamped and etched metal carriers for power and analog packages.',
      '功率與類比封裝用的沖壓／蝕刻金屬載體。',
    ),
  },
  {
    id: 'testif',
    stage: 'package',
    name: 'Test interfaces & probe cards',
    zh: '測試介面',
    feeds: ['osat'],
    desc: l(
      'Probe cards, sockets and load boards that touch every AI die at test.',
      '測試時接觸每顆 AI 晶片的探針卡、測試座與載板。',
    ),
  },

  // board
  {
    id: 'ccl',
    stage: 'board',
    name: 'Copper-clad laminate (CCL)',
    zh: '銅箔基板',
    feeds: ['pcb'],
    desc: l(
      'Glass cloth + copper foil + resin, pressed into the ultra-low-loss laminates AI boards demand.',
      '玻纖布＋銅箔＋樹脂，壓合成 AI 板卡要求的超低損耗基板。',
    ),
  },
  {
    id: 'pcb',
    stage: 'board',
    name: 'AI server PCBs & drills',
    zh: '印刷電路板',
    feeds: ['odm', 'mb'],
    desc: l(
      'GPU baseboards, UBB/OAM boards and switch trays with 20+ layers — plus the micro-drills that make them.',
      '20 層以上的 GPU 基板、UBB/OAM 與交換器板 — 以及鑽出它們的微型鑽針。',
    ),
  },
  {
    id: 'passives',
    stage: 'board',
    name: 'Passive components',
    zh: '被動元件',
    feeds: ['odm', 'mb', 'power'],
    desc: l(
      'MLCCs, chip resistors, inductors, polymer capacitors and crystals — thousands per AI board.',
      'MLCC、晶片電阻、電感、固態電容與石英元件 — 每張 AI 板要用上數千顆。',
    ),
  },

  // subsystems
  {
    id: 'thermal',
    stage: 'subsystem',
    name: 'Cooling — air & liquid',
    zh: '散熱',
    feeds: ['odm'],
    desc: l(
      'Vapor chambers, 3D-VC heatsinks, cold plates, CDUs, quick-disconnects, fans and interface materials.',
      '均熱板、3D-VC 散熱器、水冷板、CDU、快接頭、風扇與導熱介面材料。',
    ),
  },
  {
    id: 'power',
    stage: 'subsystem',
    name: 'Power supplies & BBU',
    zh: '電源／備援電池',
    feeds: ['odm'],
    desc: l(
      'Multi-kilowatt PSUs, rack power shelves, busbars and battery backup units.',
      '數千瓦電源供應器、機櫃電源櫃、匯流排與 BBU 備援電池。',
    ),
  },
  {
    id: 'mech',
    stage: 'subsystem',
    name: 'Chassis, rails & mechanics',
    zh: '機殼／滑軌',
    feeds: ['odm'],
    desc: l(
      'Server chassis, rack cabinets, sliding rails and precision metal parts.',
      '伺服器機殼、機櫃、滑軌與精密金屬件。',
    ),
  },
  {
    id: 'connect',
    stage: 'subsystem',
    name: 'Connectors & cabling',
    zh: '連接器／線纜',
    feeds: ['odm'],
    desc: l(
      'CPU/GPU sockets, high-speed connectors, power whips and cable harnesses.',
      'CPU/GPU 插座、高速連接器、電源線束與線纜組件。',
    ),
  },
  {
    id: 'optics',
    stage: 'subsystem',
    name: 'Optical transceivers & photonics',
    zh: '光通訊',
    feeds: ['net', 'odm'],
    desc: l(
      '400G/800G/1.6T optics, laser chips, fiber connectivity and co-packaged-optics work for GPU clusters.',
      'GPU 叢集用的 400G/800G/1.6T 光模組、雷射晶片、光纖連接與 CPO 共封裝光學。',
    ),
  },

  // systems
  {
    id: 'odm',
    stage: 'system',
    name: 'AI server ODM / rack integration',
    zh: 'AI 伺服器組裝',
    feeds: ['net', 'telecom'],
    desc: l(
      'From L6 boards to full GB-series racks — Taiwan assembles ~90% of the world’s AI servers.',
      '從 L6 板卡到整櫃 GB 系列 — 全球約九成 AI 伺服器由台灣組裝。',
    ),
  },
  {
    id: 'mb',
    stage: 'system',
    name: 'Boards, cards & edge systems',
    zh: '板卡／工控',
    feeds: ['telecom'],
    desc: l(
      'GPU cards, motherboards, workstations and industrial edge-AI systems.',
      'GPU 顯示卡、主機板、工作站與工業級邊緣 AI 系統。',
    ),
  },
  {
    id: 'storage',
    stage: 'system',
    name: 'Memory modules & storage',
    zh: '記憶體模組',
    feeds: ['odm'],
    desc: l(
      'DIMMs, SSDs and industrial storage built around DRAM/NAND.',
      '以 DRAM/NAND 為核心的記憶體模組、SSD 與工控儲存。',
    ),
  },

  // cloud
  {
    id: 'net',
    stage: 'cloud',
    name: 'Switches & networking',
    zh: '網通設備',
    feeds: ['telecom'],
    desc: l(
      'The 800G Ethernet switches and appliances wiring GPUs into clusters.',
      '把 GPU 織成叢集的 800G 乙太網路交換器與網通設備。',
    ),
  },
  {
    id: 'telecom',
    stage: 'cloud',
    name: 'Cloud, telecom & AI services',
    zh: '雲端／電信',
    feeds: [],
    desc: l(
      'Data-center operators, telecom backbones, GPU clouds and AI system integrators.',
      '資料中心營運商、電信骨幹、GPU 雲與 AI 系統整合商。',
    ),
  },

  // anchors
  {
    id: 'anchorcat',
    stage: 'anchor',
    name: 'Global anchors',
    zh: '全球夥伴',
    feeds: ['foundry', 'odm'],
    desc: l(
      'The non-Taiwan platforms, memory makers and toolmakers the island’s chain interlocks with.',
      '與台灣供應鏈緊密咬合的海外平台、記憶體與設備巨頭。',
    ),
  },
  // 2026-07 upstream expansion
  {
    id: 'gas',
    stage: 'wafer',
    name: 'Specialty & electronic gases',
    zh: '特殊／電子氣體',
    feeds: ['foundry'],
    desc: l(
      'Silicon precursors, specialty gases and AHF fed to CVD, etch and clean steps.',
      '矽前驅物、特殊氣體與 AHF — 供給 CVD、蝕刻與清洗製程。',
    ),
  },
  {
    id: 'pkgmat',
    stage: 'package',
    name: 'Package materials & structures',
    zh: '封裝材料／結構件',
    feeds: ['osat', 'foundry'],
    desc: l(
      'Lids, heat spreaders, stiffener rings, molding compound (LMC/MUF) and EMC distribution.',
      'lid／均熱片／補強環／成型膠（LMC/MUF）與 EMC 通路。',
    ),
  },
  {
    id: 'testlab',
    stage: 'package',
    name: 'Analysis & reliability labs',
    zh: '檢測分析實驗室',
    feeds: ['foundry', 'osat'],
    desc: l(
      'Third-party MA / FA / RA labs verifying advanced nodes, packaging and silicon photonics.',
      '第三方 MA／FA／RA 實驗室，驗證先進製程、封裝與矽光子。',
    ),
  },
  {
    id: 'recycle',
    stage: 'fabsupport',
    name: 'Fab circular economy & water',
    zh: '廠務循環／水資源',
    feeds: ['foundry'],
    desc: l(
      'Spent-acid / solvent regeneration, ultra-pure-water and reclaimed-water loops for fabs.',
      '廢酸／溶劑再生、UPW 與再生水回收 — 晶圓廠的循環。',
    ),
  },
  {
    id: 'glasspkg',
    stage: 'package',
    name: 'Glass-core / panel-level packaging',
    zh: '玻璃基板／面板級封裝',
    feeds: ['osat'],
    desc: l(
      'CoPoS / FOPLP / TGV equipment and glass-core substrate work.',
      'CoPoS／FOPLP／TGV 設備與玻璃基板。',
    ),
  },
];

export const CATEGORY_MAP: Record<string, SCCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);
