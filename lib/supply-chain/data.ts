// Taiwan × AI supply chain — exhaustive curated node graph.
// Curated snapshot (Jul 2026) compiled from public supply-chain research. Tickers,
// groupings and relationships are illustrative and should be re-verified before any
// investment use. Structure: STAGES (columns) → CATEGORIES (chain nodes) → COMPANIES
// (chips on each node), plus company→company relationship edges (rel) so the graph
// can expand 1st- and 2nd-degree neighbours from any node.

export type StageId =
  | 'materials'
  | 'fabsupport'
  | 'wafer'
  | 'chip'
  | 'package'
  | 'board'
  | 'subsystem'
  | 'system'
  | 'cloud'
  | 'anchor';

export interface SCStage {
  id: StageId;
  name: string;
  zh: string;
  blurb: string;
}

export interface SCCategory {
  id: string;
  stage: StageId;
  name: string;
  zh: string;
  desc: string;
  feeds: string[]; // downstream category ids (category-level chain edges)
}

export interface SCRel {
  to: string; // company id
  label: string;
}

export interface SCCompany {
  id: string;
  cat: string;
  name: string;   // English / romanized name
  zh?: string;    // Chinese name
  ticker: string;
  exch: 'TWSE' | 'TPEx' | 'US' | 'JP' | 'KR' | 'EU' | 'Private';
  role: string;
  rel?: SCRel[];
}

export const STAGES: SCStage[] = [
  { id: 'materials',  name: 'Materials & Chemistry',   zh: '材料化學', blurb: 'Resists, chemicals, targets, glass fiber, copper foil — the raw inputs.' },
  { id: 'fabsupport', name: 'Equipment & Fab Support', zh: '設備廠務', blurb: 'Process tools, EUV carriers, cleanrooms and distribution.' },
  { id: 'wafer',      name: 'Wafers & Masks',          zh: '晶圓光罩', blurb: 'Polished silicon, epitaxy, reclaim and photomasks.' },
  { id: 'chip',       name: 'Chip Design & Fab',       zh: '晶片設計製造', blurb: 'Foundry, memory, fabless design, ASIC services and IP.' },
  { id: 'package',    name: 'Package & Test',          zh: '封裝測試', blurb: 'OSAT, substrates, lead frames and test interfaces.' },
  { id: 'board',      name: 'Boards & Passives',       zh: '電路板被動元件', blurb: 'Glass-fiber laminates, high-layer PCBs and passives.' },
  { id: 'subsystem',  name: 'Server Subsystems',       zh: '伺服器子系統', blurb: 'Cooling, power, mechanics, connectivity and optics.' },
  { id: 'system',     name: 'Systems & Integration',   zh: '系統整合', blurb: 'AI servers, racks, boards and storage — assembled in Taiwan.' },
  { id: 'cloud',      name: 'Network & Cloud',         zh: '網路雲端', blurb: 'Switches, telecom backbones and AI cloud services.' },
  { id: 'anchor',     name: 'Global Anchors',          zh: '全球夥伴', blurb: 'The non-Taiwan giants the chain plugs into.' },
];

export const CATEGORIES: SCCategory[] = [
  // materials
  { id: 'chem',       stage: 'materials', name: 'Photoresist & process chemicals', zh: '光阻／化學品', feeds: ['foundry', 'osat'],
    desc: 'Photoresists, developers, solvents, specialty gases and wet chemicals consumed by every lithography, etch and clean step.' },
  { id: 'target',     stage: 'materials', name: 'Sputtering targets & solders', zh: '靶材／焊料', feeds: ['foundry', 'osat'],
    desc: 'High-purity metal targets for thin-film deposition, plus solder balls and paste for assembly.' },
  { id: 'cmp',        stage: 'materials', name: 'CMP & grinding consumables', zh: '研磨耗材', feeds: ['foundry'],
    desc: 'Diamond disks, retaining rings and pads consumed when polishing each wafer layer flat.' },
  { id: 'glass',      stage: 'materials', name: 'Glass fiber yarn & cloth', zh: '玻纖紗／玻纖布', feeds: ['ccl'],
    desc: 'Ultra-thin, low-Dk glass cloth — the woven skeleton inside every copper-clad laminate on an AI board.' },
  { id: 'copperfoil', stage: 'materials', name: 'Copper foil', zh: '銅箔', feeds: ['ccl'],
    desc: 'Electro-deposited HVLP/RTF copper foil laminated onto glass cloth to make CCL.' },
  { id: 'ptfe',       stage: 'materials', name: 'Fluoropolymer & specialty resin', zh: '氟素材料', feeds: ['ccl', 'fabbuild'],
    desc: 'PTFE-lined piping and vessels for ultra-pure chemical delivery, and low-loss resin systems.' },

  // fab support
  { id: 'euv',        stage: 'fabsupport', name: 'EUV pods, shells & precision parts', zh: 'EUV 傳載盒／精密零組件', feeds: ['foundry'],
    desc: 'EUV reticle pods (the vacuum-tight “shells” that carry masks), FOUPs, chamber parts, coatings and molecular filters.' },
  { id: 'equip',      stage: 'fabsupport', name: 'Process & test equipment', zh: '製程設備', feeds: ['foundry', 'osat'],
    desc: 'Wet-process, advanced-packaging, dicing, AOI and handling equipment built in Taiwan.' },
  { id: 'fabbuild',   stage: 'fabsupport', name: 'Cleanroom & fab engineering', zh: '無塵室工程', feeds: ['foundry'],
    desc: 'Turn-key cleanrooms, hook-up, ultra-pure gas/chemical delivery and parts cleaning for every new fab.' },
  { id: 'dist',       stage: 'fabsupport', name: 'Materials & IC distribution', zh: '材料／IC 通路', feeds: ['foundry', 'odm'],
    desc: 'The trading houses moving wafers, chemicals, quartz and chips through the chain.' },

  // wafers & masks
  { id: 'si',         stage: 'wafer', name: 'Silicon wafers & epitaxy', zh: '矽晶圓／磊晶', feeds: ['foundry'],
    desc: '300 mm polished and epitaxial wafers — the blank canvas of every chip.' },
  { id: 'reclaim',    stage: 'wafer', name: 'Wafer reclaim', zh: '晶圓再生', feeds: ['foundry'],
    desc: 'Strips and re-polishes monitor wafers so fabs can reuse them.' },
  { id: 'mask',       stage: 'wafer', name: 'Photomasks', zh: '光罩', feeds: ['foundry'],
    desc: 'The quartz plates carrying each chip layer’s pattern.' },

  // chip
  { id: 'foundry',    stage: 'chip', name: 'Foundry', zh: '晶圓代工', feeds: ['osat', 'substrate'],
    desc: 'Where designs become silicon — Taiwan holds ~90% of leading-edge output plus CoWoS/SoIC packaging.' },
  { id: 'memchip',    stage: 'chip', name: 'Memory ICs', zh: '記憶體', feeds: ['osat', 'storage'],
    desc: 'DRAM, NOR/NAND flash and specialty high-bandwidth memory made in Taiwan.' },
  { id: 'icdesign',   stage: 'chip', name: 'Fabless IC design', zh: 'IC 設計', feeds: ['foundry', 'mb', 'odm'],
    desc: 'SoCs, BMCs, retimers, controllers and interface silicon designed in Taiwan.' },
  { id: 'asicip',     stage: 'chip', name: 'ASIC services & silicon IP', zh: '設計服務／IP', feeds: ['foundry'],
    desc: 'The teams that turn hyperscalers’ AI ambitions into TSMC-ready silicon, plus the IP they license.' },
  { id: 'analog',     stage: 'chip', name: 'Analog & power ICs', zh: '類比／電源 IC', feeds: ['power', 'mb'],
    desc: 'Voltage regulation, DrMOS and power-stage silicon feeding kilowatt-class GPUs.' },
  { id: 'discrete',   stage: 'chip', name: 'Power discretes', zh: '功率元件', feeds: ['power'],
    desc: 'MOSFETs, diodes and third-gen (SiC/GaN) devices in every power supply.' },

  // package & test
  { id: 'osat',       stage: 'package', name: 'Packaging & test (OSAT)', zh: '封裝測試', feeds: ['odm', 'mb'],
    desc: 'Assembly, bumping, final test and burn-in — Taiwan is the world’s OSAT hub.' },
  { id: 'substrate',  stage: 'package', name: 'ABF & BT substrates', zh: 'IC 載板', feeds: ['osat'],
    desc: 'The fine-line resin boards that fan a die’s wiring out to the PCB.' },
  { id: 'leadframe',  stage: 'package', name: 'Lead frames', zh: '導線架', feeds: ['osat'],
    desc: 'Stamped and etched metal carriers for power and analog packages.' },
  { id: 'testif',     stage: 'package', name: 'Test interfaces & probe cards', zh: '測試介面', feeds: ['osat'],
    desc: 'Probe cards, sockets and load boards that touch every AI die at test.' },

  // board
  { id: 'ccl',        stage: 'board', name: 'Copper-clad laminate (CCL)', zh: '銅箔基板', feeds: ['pcb'],
    desc: 'Glass cloth + copper foil + resin, pressed into the ultra-low-loss laminates AI boards demand.' },
  { id: 'pcb',        stage: 'board', name: 'AI server PCBs & drills', zh: '印刷電路板', feeds: ['odm', 'mb'],
    desc: 'GPU baseboards, UBB/OAM boards and switch trays with 20+ layers — plus the micro-drills that make them.' },
  { id: 'passives',   stage: 'board', name: 'Passive components', zh: '被動元件', feeds: ['odm', 'mb', 'power'],
    desc: 'MLCCs, chip resistors, inductors, polymer capacitors and crystals — thousands per AI board.' },

  // subsystems
  { id: 'thermal',    stage: 'subsystem', name: 'Cooling — air & liquid', zh: '散熱', feeds: ['odm'],
    desc: 'Vapor chambers, 3D-VC heatsinks, cold plates, CDUs, quick-disconnects, fans and interface materials.' },
  { id: 'power',      stage: 'subsystem', name: 'Power supplies & BBU', zh: '電源／備援電池', feeds: ['odm'],
    desc: 'Multi-kilowatt PSUs, rack power shelves, busbars and battery backup units.' },
  { id: 'mech',       stage: 'subsystem', name: 'Chassis, rails & mechanics', zh: '機殼／滑軌', feeds: ['odm'],
    desc: 'Server chassis, rack cabinets, sliding rails and precision metal parts.' },
  { id: 'connect',    stage: 'subsystem', name: 'Connectors & cabling', zh: '連接器／線纜', feeds: ['odm'],
    desc: 'CPU/GPU sockets, high-speed connectors, power whips and cable harnesses.' },
  { id: 'optics',     stage: 'subsystem', name: 'Optical transceivers & photonics', zh: '光通訊', feeds: ['net', 'odm'],
    desc: '400G/800G/1.6T optics, laser chips, fiber connectivity and co-packaged-optics work for GPU clusters.' },

  // systems
  { id: 'odm',        stage: 'system', name: 'AI server ODM / rack integration', zh: 'AI 伺服器組裝', feeds: ['net', 'telecom'],
    desc: 'From L6 boards to full GB-series racks — Taiwan assembles ~90% of the world’s AI servers.' },
  { id: 'mb',         stage: 'system', name: 'Boards, cards & edge systems', zh: '板卡／工控', feeds: ['telecom'],
    desc: 'GPU cards, motherboards, workstations and industrial edge-AI systems.' },
  { id: 'storage',    stage: 'system', name: 'Memory modules & storage', zh: '記憶體模組', feeds: ['odm'],
    desc: 'DIMMs, SSDs and industrial storage built around DRAM/NAND.' },

  // cloud
  { id: 'net',        stage: 'cloud', name: 'Switches & networking', zh: '網通設備', feeds: ['telecom'],
    desc: 'The 800G Ethernet switches and appliances wiring GPUs into clusters.' },
  { id: 'telecom',    stage: 'cloud', name: 'Cloud, telecom & AI services', zh: '雲端／電信', feeds: [],
    desc: 'Data-center operators, telecom backbones, GPU clouds and AI system integrators.' },

  // anchors
  { id: 'anchorcat',  stage: 'anchor', name: 'Global anchors', zh: '全球夥伴', feeds: ['foundry', 'odm'],
    desc: 'The non-Taiwan platforms, memory makers and toolmakers the island’s chain interlocks with.' },
];

export const COMPANIES: SCCompany[] = [
  // ---------------- materials: photoresist & chemicals ----------------
  { id: 'aemc', cat: 'chem', name: 'Advanced Echem Materials', zh: '新應材', ticker: '4749', exch: 'TPEx', role: 'Photoresist & advanced-node process materials qualified at leading foundries', rel: [{ to: 'tsmc', label: 'resist materials supplier' }] },
  { id: 'everlightchem', cat: 'chem', name: 'Everlight Chemical', zh: '永光', ticker: '1711', exch: 'TWSE', role: 'Specialty chemicals incl. photoresist intermediates & electronic chemicals', rel: [{ to: 'tsmc', label: 'chemical supplier' }] },
  { id: 'eternal', cat: 'chem', name: 'Eternal Materials', zh: '長興', ticker: '1717', exch: 'TWSE', role: 'World #1 dry-film photoresist & electronic resins', rel: [{ to: 'unimicron', label: 'dry film for substrates' }, { to: 'gce', label: 'PCB resist supplier' }] },
  { id: 'daxin', cat: 'chem', name: 'Daxin Materials', zh: '達興材料', ticker: '5234', exch: 'TPEx', role: 'Semiconductor & advanced-packaging process chemistry', rel: [{ to: 'tsmc', label: 'packaging materials' }] },
  { id: 'sanfu', cat: 'chem', name: 'San Fu Chemical', zh: '三福化', ticker: '4755', exch: 'TPEx', role: 'Electronic-grade chemicals & specialty gases', rel: [{ to: 'tsmc', label: 'wet chemical supplier' }] },
  { id: 'shiny', cat: 'chem', name: 'Shiny Chemical', zh: '勝一', ticker: '1773', exch: 'TWSE', role: 'Electronic-grade solvents (NMP, IPA) for fabs', rel: [{ to: 'tsmc', label: 'solvent supplier' }] },
  { id: 'chunghwachem', cat: 'chem', name: 'Chung Hwa Chemical', zh: '中華化', ticker: '1727', exch: 'TWSE', role: 'Wet electronic chemicals (ammonia, etchants)', rel: [{ to: 'umc', label: 'chemical supplier' }] },

  // materials: targets / solder
  { id: 'solartech', cat: 'target', name: 'Solar Applied Materials', zh: '光洋科', ticker: '1785', exch: 'TPEx', role: 'Sputtering targets & precious-metal recycling for fabs', rel: [{ to: 'tsmc', label: 'target supplier' }] },
  { id: 'shenmao', cat: 'target', name: 'Shenmao Technology', zh: '昇貿', ticker: '3305', exch: 'TWSE', role: 'Solder balls & paste for advanced packaging', rel: [{ to: 'ase', label: 'solder supplier' }] },

  // materials: CMP consumables
  { id: 'kinik', cat: 'cmp', name: 'Kinik Company', zh: '中砂', ticker: '1560', exch: 'TWSE', role: 'CMP diamond disks co-developed with TSMC; grinding wheels', rel: [{ to: 'tsmc', label: 'CMP disk supplier' }] },
  { id: 'rayzher', cat: 'cmp', name: 'Rayzher Industrial', zh: '瑞耘', ticker: '6532', exch: 'TPEx', role: 'CMP retaining rings & precision fab parts', rel: [{ to: 'tsmc', label: 'CMP parts' }] },

  // materials: glass fiber
  { id: 'fulltech', cat: 'glass', name: 'Fulltech Fiber Glass', zh: '富喬', ticker: '1815', exch: 'TWSE', role: 'Ultra-thin & low-Dk glass fiber cloth for high-speed CCL', rel: [{ to: 'emc2383', label: 'glass cloth supplier' }, { to: 'tuc6274', label: 'glass cloth supplier' }] },
  { id: 'taiwanglass', cat: 'glass', name: 'Taiwan Glass', zh: '台玻', ticker: '1802', exch: 'TWSE', role: 'Glass fiber yarn & cloth incl. low-dielectric grades', rel: [{ to: 'emc2383', label: 'glass cloth supplier' }, { to: 'nanya1303', label: 'materials peer' }] },

  // materials: copper foil
  { id: 'cotech', cat: 'copperfoil', name: 'Co-Tech Development', zh: '金居', ticker: '8358', exch: 'TPEx', role: 'RTF/HVLP copper foil for low-loss AI server CCL', rel: [{ to: 'emc2383', label: 'HVLP foil supplier' }, { to: 'tuc6274', label: 'foil supplier' }] },
  { id: 'nanya1303', cat: 'copperfoil', name: 'Nan Ya Plastics', zh: '南亞', ticker: '1303', exch: 'TWSE', role: 'Copper foil, glass cloth, CCL and epoxy — the materials conglomerate', rel: [{ to: 'nanyapcb', label: 'group substrate maker' }, { to: 'nanyatech', label: 'group DRAM maker' }] },

  // materials: PTFE / resin
  { id: 'shangpin', cat: 'ptfe', name: 'Shang Pin Global', zh: '上品', ticker: '4770', exch: 'TWSE', role: 'PTFE-lined equipment for ultra-pure chemical delivery in fabs', rel: [{ to: 'tsmc', label: 'fluoropolymer systems' }, { to: 'trusval', label: 'delivery-system partner' }] },

  // ---------------- fab support: EUV & precision parts ----------------
  { id: 'gudeng', cat: 'euv', name: 'Gudeng Precision', zh: '家登', ticker: '3680', exch: 'TWSE', role: 'World’s dominant EUV reticle pod (“shell”) maker; FOUPs & wafer carriers', rel: [{ to: 'tsmc', label: 'EUV pod supplier' }, { to: 'asml', label: 'EUV ecosystem partner' }] },
  { id: 'chianfu', cat: 'euv', name: 'Chian Fu Precision', zh: '千附精密', ticker: '6829', exch: 'TPEx', role: 'Precision chamber parts & modules for semiconductor/EUV equipment', rel: [{ to: 'tsmc', label: 'precision parts' }] },
  { id: 'foxsemicon', cat: 'euv', name: 'Foxsemicon Integrated Tech', zh: '京鼎', ticker: '3413', exch: 'TWSE', role: 'Equipment modules & parts, key OEM for Applied Materials', rel: [{ to: 'amat', label: 'module OEM' }, { to: 'foxconn', label: 'group affiliate' }] },
  { id: 'hsiangming', cat: 'euv', name: 'Hsiang Ming Technology', zh: '翔名', ticker: '8091', exch: 'TPEx', role: 'Precision process parts & coatings for etch/deposition chambers', rel: [{ to: 'tsmc', label: 'chamber parts' }] },
  { id: 'greenfilter', cat: 'euv', name: 'Green Filter', zh: '濾能', ticker: '6823', exch: 'TPEx', role: 'Chemical/fan filters protecting EUV scanners from molecular contamination', rel: [{ to: 'tsmc', label: 'AMC filtration' }] },

  // fab support: equipment
  { id: 'scientech', cat: 'equip', name: 'Scientech', zh: '辛耘', ticker: '3583', exch: 'TWSE', role: 'Wet-process equipment & wafer reclaim services', rel: [{ to: 'tsmc', label: 'equipment & reclaim' }] },
  { id: 'gpt', cat: 'equip', name: 'Grand Process Technology', zh: '弘塑', ticker: '3131', exch: 'TPEx', role: 'Wet-bench & advanced-packaging process equipment', rel: [{ to: 'ase', label: 'packaging equipment' }, { to: 'tsmc', label: 'CoWoS process tools' }] },
  { id: 'allring', cat: 'equip', name: 'All Ring Tech', zh: '萬潤', ticker: '6187', exch: 'TPEx', role: 'Dispensing & assembly equipment used in CoWoS packaging', rel: [{ to: 'tsmc', label: 'CoWoS equipment' }] },
  { id: 'gpm', cat: 'equip', name: 'Gallant Precision Machining', zh: '均豪', ticker: '5443', exch: 'TPEx', role: 'AOI & packaging equipment', rel: [{ to: 'ase', label: 'equipment supplier' }] },
  { id: 'gmm', cat: 'equip', name: 'Gallant Micro Machining', zh: '均華', ticker: '6640', exch: 'TWSE', role: 'Die-bonders & advanced-packaging tools', rel: [{ to: 'tsmc', label: 'bonder supplier' }] },
  { id: 'csun', cat: 'equip', name: 'C SUN Manufacturing', zh: '志聖', ticker: '2467', exch: 'TWSE', role: 'Exposure & lamination equipment for PCB/substrates', rel: [{ to: 'unimicron', label: 'equipment supplier' }] },
  { id: 'groupup', cat: 'equip', name: 'Group Up Industrial', zh: '群翊', ticker: '6664', exch: 'TPEx', role: 'PCB/substrate baking & automation equipment', rel: [{ to: 'unimicron', label: 'equipment supplier' }] },
  { id: 'contrel', cat: 'equip', name: 'Contrel Technology', zh: '東捷', ticker: '8064', exch: 'TPEx', role: 'Laser & semiconductor/display equipment', rel: [{ to: 'ase', label: 'laser tools' }] },
  { id: 'eandr', cat: 'equip', name: 'E&R Engineering', zh: '鈦昇', ticker: '8027', exch: 'TPEx', role: 'Laser drilling/marking equipment for packaging', rel: [{ to: 'ase', label: 'laser equipment' }] },
  { id: 'utechzone', cat: 'equip', name: 'Utechzone', zh: '由田', ticker: '3455', exch: 'TPEx', role: 'AOI inspection machines', rel: [{ to: 'unimicron', label: 'AOI supplier' }] },
  { id: 'taliang', cat: 'equip', name: 'Ta Liang Technology', zh: '大量', ticker: '3167', exch: 'TPEx', role: 'PCB drilling & routing machines', rel: [{ to: 'gce', label: 'drilling machines' }] },
  { id: 'mirle', cat: 'equip', name: 'Mirle Automation', zh: '盟立', ticker: '2464', exch: 'TWSE', role: 'Fab automation & AMHS systems', rel: [{ to: 'tsmc', label: 'automation supplier' }] },
  { id: 'kenmec', cat: 'equip', name: 'Kenmec Mechanical', zh: '廣運', ticker: '6125', exch: 'TWSE', role: 'Automation, warehousing & immersion-cooling systems', rel: [{ to: 'tsmc', label: 'automation' }] },
  { id: 'tri', cat: 'equip', name: 'Test Research Inc. (TRI)', zh: '德律', ticker: '3030', exch: 'TWSE', role: 'ICT/AOI board-test systems for AI server boards', rel: [{ to: 'quanta', label: 'board test systems' }] },
  { id: 'machvision', cat: 'equip', name: 'Machvision', zh: '牧德', ticker: '3563', exch: 'TWSE', role: 'PCB & substrate optical inspection systems', rel: [{ to: 'unimicron', label: 'inspection supplier' }] },

  // fab support: cleanroom & fab engineering
  { id: 'uis', cat: 'fabbuild', name: 'United Integrated Services', zh: '漢唐', ticker: '2404', exch: 'TWSE', role: 'Turn-key fab & cleanroom construction', rel: [{ to: 'tsmc', label: 'fab contractor' }] },
  { id: 'acter', cat: 'fabbuild', name: 'Acter Group', zh: '聖暉', ticker: '5536', exch: 'TPEx', role: 'Cleanroom MEP & hook-up engineering', rel: [{ to: 'tsmc', label: 'hook-up contractor' }] },
  { id: 'lk6139', cat: 'fabbuild', name: 'L&K Engineering', zh: '亞翔', ticker: '6139', exch: 'TWSE', role: 'Cleanroom construction for fabs in Taiwan & overseas', rel: [{ to: 'tsmc', label: 'cleanroom contractor' }] },
  { id: 'mic6196', cat: 'fabbuild', name: 'Marketech International (MIC)', zh: '帆宣', ticker: '6196', exch: 'TWSE', role: 'Fab systems integration; local ASML service partner', rel: [{ to: 'tsmc', label: 'facility systems' }, { to: 'asml', label: 'local integration partner' }] },
  { id: 'yankey', cat: 'fabbuild', name: 'Yankey Engineering', zh: '洋基工程', ticker: '6691', exch: 'TWSE', role: 'Cleanroom & process piping turn-key contractor', rel: [{ to: 'tsmc', label: 'engineering contractor' }] },
  { id: 'trusval', cat: 'fabbuild', name: 'Trusval Technology', zh: '信紘科', ticker: '6667', exch: 'TPEx', role: 'Ultra-pure chemical & gas delivery systems', rel: [{ to: 'tsmc', label: 'chemical delivery' }] },
  { id: 'sg3551', cat: 'fabbuild', name: 'S&G Technology', zh: '世禾', ticker: '3551', exch: 'TPEx', role: 'Precision cleaning of process-chamber parts', rel: [{ to: 'tsmc', label: 'parts cleaning' }] },

  // fab support: distribution
  { id: 'topco', cat: 'dist', name: 'Topco Scientific', zh: '崇越', ticker: '5434', exch: 'TWSE', role: 'Largest local distributor of wafers, quartz & chemicals (Shin-Etsu agent)', rel: [{ to: 'shinetsu', label: 'Taiwan agent' }, { to: 'tsmc', label: 'materials channel' }] },
  { id: 'wahlee', cat: 'dist', name: 'Wah Lee Industrial', zh: '華立', ticker: '3010', exch: 'TWSE', role: 'Distributor of semiconductor materials & engineering plastics', rel: [{ to: 'tsmc', label: 'materials channel' }] },
  { id: 'supreme', cat: 'dist', name: 'Supreme Electronics', zh: '至上', ticker: '8112', exch: 'TWSE', role: 'Memory & component distribution', rel: [{ to: 'skhynix', label: 'memory distributor' }] },
  { id: 'wpg', cat: 'dist', name: 'WPG Holdings', zh: '大聯大', ticker: '3702', exch: 'TWSE', role: 'Asia’s largest semiconductor component distributor', rel: [{ to: 'nvidia', label: 'component channel' }] },
  { id: 'wtmicro', cat: 'dist', name: 'WT Microelectronics', zh: '文曄', ticker: '3036', exch: 'TWSE', role: 'Semiconductor distribution (incl. NVIDIA line)', rel: [{ to: 'nvidia', label: 'authorized distributor' }] },

  // ---------------- wafers & masks ----------------
  { id: 'globalwafers', cat: 'si', name: 'GlobalWafers', zh: '環球晶', ticker: '6488', exch: 'TPEx', role: '#3 silicon wafer maker worldwide', rel: [{ to: 'tsmc', label: 'wafer supplier' }, { to: 'sas5483', label: 'parent group' }] },
  { id: 'sas5483', cat: 'si', name: 'Sino-American Silicon', zh: '中美晶', ticker: '5483', exch: 'TPEx', role: 'Wafer group parent of GlobalWafers', rel: [{ to: 'globalwafers', label: 'subsidiary' }] },
  { id: 'waferworks', cat: 'si', name: 'Wafer Works', zh: '合晶', ticker: '6182', exch: 'TPEx', role: 'Polished & annealed wafers for power/logic', rel: [{ to: 'umc', label: 'wafer supplier' }] },
  { id: 'formosasumco', cat: 'si', name: 'Formosa Sumco Technology', zh: '台勝科', ticker: '3532', exch: 'TWSE', role: '300 mm wafers (Formosa Plastics × SUMCO JV)', rel: [{ to: 'tsmc', label: 'wafer supplier' }] },
  { id: 'episil3016', cat: 'si', name: 'Episil-Precision', zh: '嘉晶', ticker: '3016', exch: 'TWSE', role: 'Epitaxial wafers incl. SiC/GaN', rel: [{ to: 'hanlei', label: 'group foundry partner' }] },
  { id: 'psi8028', cat: 'reclaim', name: 'Phoenix Silicon International', zh: '昇陽半導體', ticker: '8028', exch: 'TPEx', role: 'Wafer reclaim & thinning services', rel: [{ to: 'tsmc', label: 'reclaim vendor' }] },
  { id: 'tmc2338', cat: 'mask', name: 'Taiwan Mask Corporation', zh: '台灣光罩', ticker: '2338', exch: 'TWSE', role: 'Merchant photomask maker', rel: [{ to: 'umc', label: 'mask supplier' }, { to: 'vis', label: 'mask supplier' }] },

  // ---------------- chip ----------------
  { id: 'tsmc', cat: 'foundry', name: 'TSMC', zh: '台積電', ticker: '2330', exch: 'TWSE', role: 'World’s dominant advanced foundry; CoWoS/SoIC advanced packaging', rel: [{ to: 'nvidia', label: 'chief AI customer' }, { to: 'asml', label: 'EUV customer' }, { to: 'ase', label: 'OSAT partner' }, { to: 'unimicron', label: 'substrate partner' }] },
  { id: 'umc', cat: 'foundry', name: 'UMC', zh: '聯電', ticker: '2303', exch: 'TWSE', role: 'Mature-node foundry; interposer & specialty processes', rel: [{ to: 'novatek', label: 'foundry for drivers' }, { to: 'faraday', label: 'ASIC affiliate' }] },
  { id: 'psmc', cat: 'foundry', name: 'Powerchip (PSMC)', zh: '力積電', ticker: '6770', exch: 'TWSE', role: 'Memory & logic foundry; interposer capacity', rel: [{ to: 'tsmc', label: 'interposer overflow' }] },
  { id: 'vis', cat: 'foundry', name: 'Vanguard (VIS)', zh: '世界先進', ticker: '5347', exch: 'TPEx', role: 'Power-management IC foundry (TSMC affiliate)', rel: [{ to: 'tsmc', label: 'affiliate' }, { to: 'upi6719', label: 'foundry for PMICs' }] },
  { id: 'hanlei', cat: 'foundry', name: 'Episil Holdings', zh: '漢磊', ticker: '3707', exch: 'TPEx', role: 'SiC/GaN & power semiconductor foundry', rel: [{ to: 'episil3016', label: 'epi sister company' }] },

  { id: 'nanyatech', cat: 'memchip', name: 'Nanya Technology', zh: '南亞科', ticker: '2408', exch: 'TWSE', role: 'DRAM maker (Formosa group)', rel: [{ to: 'micron', label: 'technology lineage' }, { to: 'adata', label: 'DRAM to modules' }] },
  { id: 'winbond', cat: 'memchip', name: 'Winbond Electronics', zh: '華邦電', ticker: '2344', exch: 'TWSE', role: 'Specialty DRAM/NOR; CUBE high-bandwidth memory for edge AI', rel: [{ to: 'realtek', label: 'memory for SoCs' }] },
  { id: 'macronix', cat: 'memchip', name: 'Macronix International', zh: '旺宏', ticker: '2337', exch: 'TWSE', role: 'NOR flash — boot memory in GPUs & servers', rel: [{ to: 'nvidia', label: 'NOR flash supplier' }] },
  { id: 'apmemory', cat: 'memchip', name: 'AP Memory', zh: '愛普', ticker: '6531', exch: 'TWSE', role: 'PSRAM & customized ultra-high-bandwidth memory-on-SoC', rel: [{ to: 'tsmc', label: 'memory-on-logic partner' }] },

  { id: 'mediatek', cat: 'icdesign', name: 'MediaTek', zh: '聯發科', ticker: '2454', exch: 'TWSE', role: 'Edge-AI SoCs; NVIDIA GB10 co-design & custom cloud ASIC wins', rel: [{ to: 'nvidia', label: 'GB10 co-design' }, { to: 'tsmc', label: 'leading-edge customer' }] },
  { id: 'realtek', cat: 'icdesign', name: 'Realtek Semiconductor', zh: '瑞昱', ticker: '2379', exch: 'TWSE', role: 'Ethernet/connectivity silicon in every server & NIC', rel: [{ to: 'quanta', label: 'LAN silicon' }] },
  { id: 'novatek', cat: 'icdesign', name: 'Novatek Microelectronics', zh: '聯詠', ticker: '3034', exch: 'TWSE', role: 'Display drivers & SoCs', rel: [{ to: 'umc', label: 'foundry partner' }, { to: 'chipbond', label: 'bumping partner' }] },
  { id: 'asmedia', cat: 'icdesign', name: 'ASMedia Technology', zh: '祥碩', ticker: '5269', exch: 'TWSE', role: 'PCIe switches, USB & AMD chipsets', rel: [{ to: 'amd', label: 'chipset partner' }] },
  { id: 'parade', cat: 'icdesign', name: 'Parade Technologies', zh: '譜瑞-KY', ticker: '4966', exch: 'TPEx', role: 'PCIe retimers & high-speed interface ICs for AI servers', rel: [{ to: 'nvidia', label: 'retimer supplier' }] },
  { id: 'phison', cat: 'icdesign', name: 'Phison Electronics', zh: '群聯', ticker: '8299', exch: 'TPEx', role: 'NAND controllers & aiDAPTIV+ AI storage offload', rel: [{ to: 'tsmc', label: 'controller foundry' }, { to: 'teamgroup', label: 'controller partner' }] },
  { id: 'aspeed', cat: 'icdesign', name: 'ASPEED Technology', zh: '信驊', ticker: '5274', exch: 'TPEx', role: '~70% of server BMC chips worldwide', rel: [{ to: 'tsmc', label: 'foundry' }, { to: 'quanta', label: 'BMC in every server' }] },
  { id: 'nuvoton', cat: 'icdesign', name: 'Nuvoton Technology', zh: '新唐', ticker: '4919', exch: 'TWSE', role: 'MCUs & server hardware-management ICs', rel: [{ to: 'quanta', label: 'management ICs' }] },
  { id: 'genesys', cat: 'icdesign', name: 'Genesys Logic', zh: '創惟', ticker: '6104', exch: 'TPEx', role: 'USB & interface controllers', rel: [{ to: 'quanta', label: 'interface ICs' }] },

  { id: 'guc', cat: 'asicip', name: 'Global Unichip (GUC)', zh: '創意', ticker: '3443', exch: 'TWSE', role: 'TSMC-affiliated ASIC services for AI/HPC (CoWoS designs)', rel: [{ to: 'tsmc', label: 'affiliate & sole foundry' }] },
  { id: 'alchip', cat: 'asicip', name: 'Alchip Technologies', zh: '世芯-KY', ticker: '3661', exch: 'TWSE', role: 'Leading-edge AI ASIC design services for hyperscaler accelerators', rel: [{ to: 'tsmc', label: '3nm/2nm ASIC flows' }] },
  { id: 'faraday', cat: 'asicip', name: 'Faraday Technology', zh: '智原', ticker: '3035', exch: 'TWSE', role: 'ASIC & IP (UMC affiliate); FPGA-to-ASIC AI conversions', rel: [{ to: 'umc', label: 'affiliate' }] },
  { id: 'ememory', cat: 'asicip', name: 'eMemory Technology', zh: '力旺', ticker: '3529', exch: 'TPEx', role: 'NVM & PUF security IP licensed across foundries', rel: [{ to: 'tsmc', label: 'IP partner' }] },
  { id: 'm31', cat: 'asicip', name: 'M31 Technology', zh: '円星科技', ticker: '6643', exch: 'TPEx', role: 'High-speed interface IP (PCIe/USB) on advanced nodes', rel: [{ to: 'tsmc', label: 'IP partner' }] },
  { id: 'andes', cat: 'asicip', name: 'Andes Technology', zh: '晶心科', ticker: '6533', exch: 'TWSE', role: 'RISC-V CPU IP used inside AI accelerators', rel: [{ to: 'tsmc', label: 'IP on TSMC nodes' }] },

  { id: 'silergy', cat: 'analog', name: 'Silergy', zh: '矽力-KY', ticker: '6415', exch: 'TWSE', role: 'Power-management ICs for servers & networking', rel: [{ to: 'delta', label: 'PMIC into PSUs' }] },
  { id: 'gmt', cat: 'analog', name: 'Global Mixed-mode Technology', zh: '致新', ticker: '8081', exch: 'TWSE', role: 'PWM controllers & PMICs for boards and fans', rel: [{ to: 'gigabyte', label: 'board PMICs' }] },
  { id: 'anpec', cat: 'analog', name: 'Anpec Electronics', zh: '茂達', ticker: '6138', exch: 'TPEx', role: 'Power ICs & fan-motor drivers', rel: [{ to: 'avc', label: 'fan driver ICs' }] },
  { id: 'upi6719', cat: 'analog', name: 'uPI Semiconductor', zh: '力智', ticker: '6719', exch: 'TPEx', role: 'VRM power stages / DrMOS on GPU boards', rel: [{ to: 'nvidia', label: 'DrMOS on GPU boards' }, { to: 'vis', label: 'foundry' }] },
  { id: 'excelliance', cat: 'analog', name: 'Excelliance MOS', zh: '杰力', ticker: '5299', exch: 'TPEx', role: 'MOSFETs & power stages for servers/notebooks', rel: [{ to: 'quanta', label: 'power stages' }] },

  { id: 'panjit', cat: 'discrete', name: 'PANJIT International', zh: '強茂', ticker: '2481', exch: 'TWSE', role: 'Diodes & MOSFETs for power supplies', rel: [{ to: 'delta', label: 'discrete supplier' }] },
  { id: 'tsc5425', cat: 'discrete', name: 'Taiwan Semiconductor Co (TSC)', zh: '台半', ticker: '5425', exch: 'TPEx', role: 'Rectifiers & power discretes', rel: [{ to: 'liteon', label: 'discrete supplier' }] },
  { id: 'apec8261', cat: 'discrete', name: 'Advanced Power Electronics (APEC)', zh: '富鼎', ticker: '8261', exch: 'TWSE', role: 'MOSFETs for server VRM', rel: [{ to: 'quanta', label: 'MOSFET supplier' }] },
  { id: 'niko', cat: 'discrete', name: 'Niko Semiconductor', zh: '尼克森', ticker: '3317', exch: 'TPEx', role: 'Power MOSFETs', rel: [{ to: 'chicony', label: 'PSU discretes' }] },

  // ---------------- package & test ----------------
  { id: 'ase', cat: 'osat', name: 'ASE Technology Holding', zh: '日月光投控', ticker: '3711', exch: 'TWSE', role: 'World’s largest OSAT; absorbs TSMC advanced-packaging overflow', rel: [{ to: 'tsmc', label: 'packaging partner' }, { to: 'nvidia', label: 'test & assembly' }] },
  { id: 'pti', cat: 'osat', name: 'Powertech Technology (PTI)', zh: '力成', ticker: '6239', exch: 'TWSE', role: 'Memory & logic packaging/test', rel: [{ to: 'skhynix', label: 'memory packaging' }, { to: 'micron', label: 'DRAM packaging & test' }] },
  { id: 'kyec', cat: 'osat', name: 'King Yuan Electronics (KYEC)', zh: '京元電子', ticker: '2449', exch: 'TWSE', role: 'Largest dedicated test house — final test for NVIDIA AI chips', rel: [{ to: 'nvidia', label: 'chip final test' }, { to: 'tsmc', label: 'test partner' }] },
  { id: 'sigurd', cat: 'osat', name: 'Sigurd Microelectronics', zh: '矽格', ticker: '6257', exch: 'TWSE', role: 'IC test & packaging services', rel: [{ to: 'mediatek', label: 'test vendor' }] },
  { id: 'ardentec', cat: 'osat', name: 'Ardentec', zh: '欣銓', ticker: '3264', exch: 'TWSE', role: 'Wafer-level test services', rel: [{ to: 'nvidia', label: 'wafer sort' }] },
  { id: 'chipbond', cat: 'osat', name: 'Chipbond Technology', zh: '頎邦', ticker: '6147', exch: 'TPEx', role: 'Gold bumping & COF packaging', rel: [{ to: 'novatek', label: 'driver-IC bumping' }] },
  { id: 'chipmos', cat: 'osat', name: 'ChipMOS Technologies', zh: '南茂', ticker: '8150', exch: 'TWSE', role: 'Memory & display-driver packaging/test', rel: [{ to: 'winbond', label: 'memory packaging' }] },
  { id: 'ose2329', cat: 'osat', name: 'Orient Semiconductor (OSE)', zh: '華泰', ticker: '2329', exch: 'TWSE', role: 'Packaging & EMS services', rel: [{ to: 'phison', label: 'SSD module assembly' }] },
  { id: 'lingsen', cat: 'osat', name: 'Lingsen Precision', zh: '菱生', ticker: '2369', exch: 'TWSE', role: 'IC assembly & test', rel: [{ to: 'anpec', label: 'analog packaging' }] },
  { id: 'xintec', cat: 'osat', name: 'Xintec', zh: '精材', ticker: '3374', exch: 'TPEx', role: 'Wafer-level CSP & TSV (TSMC affiliate)', rel: [{ to: 'tsmc', label: 'affiliate' }] },
  { id: 'tsht3265', cat: 'osat', name: 'TSHT (Taiwan Star Tech)', zh: '台星科', ticker: '3265', exch: 'TPEx', role: 'Bumping & wafer test (Sigurd group)', rel: [{ to: 'sigurd', label: 'group affiliate' }] },

  { id: 'unimicron', cat: 'substrate', name: 'Unimicron Technology', zh: '欣興', ticker: '3037', exch: 'TWSE', role: '#1 ABF substrate maker — every AI accelerator needs its boards', rel: [{ to: 'tsmc', label: 'substrate into CoWoS' }, { to: 'nvidia', label: 'ABF for GPUs' }, { to: 'ibiden', label: 'chief rival' }] },
  { id: 'nanyapcb', cat: 'substrate', name: 'Nan Ya PCB', zh: '南電', ticker: '8046', exch: 'TWSE', role: 'ABF/BT substrates (Formosa group)', rel: [{ to: 'nvidia', label: 'ABF supplier' }, { to: 'nanya1303', label: 'group materials' }] },
  { id: 'kinsus', cat: 'substrate', name: 'Kinsus Interconnect', zh: '景碩', ticker: '3189', exch: 'TWSE', role: 'ABF/BT substrates (Pegatron group)', rel: [{ to: 'mediatek', label: 'substrate supplier' }, { to: 'pegatron', label: 'group parent' }] },

  { id: 'sdi2351', cat: 'leadframe', name: 'SDI Corporation', zh: '順德', ticker: '2351', exch: 'TWSE', role: 'Lead frames & precision stamping', rel: [{ to: 'ase', label: 'lead-frame supplier' }] },
  { id: 'jihlin', cat: 'leadframe', name: 'Jih Lin Technology', zh: '界霖', ticker: '5285', exch: 'TWSE', role: 'Lead frames for power packages', rel: [{ to: 'panjit', label: 'frame supplier' }] },

  { id: 'chpt', cat: 'testif', name: 'CHPT (Chunghwa Precision Test)', zh: '中華精測', ticker: '6510', exch: 'TPEx', role: 'Probe cards & load boards for AI chip test', rel: [{ to: 'kyec', label: 'probe cards' }, { to: 'tsmc', label: 'test interface' }] },
  { id: 'winway', cat: 'testif', name: 'WinWay Technology', zh: '穎崴', ticker: '6515', exch: 'TWSE', role: 'Test sockets for HPC/AI processors', rel: [{ to: 'nvidia', label: 'socket supplier' }] },
  { id: 'mpi6223', cat: 'testif', name: 'MPI Corporation', zh: '旺矽', ticker: '6223', exch: 'TWSE', role: 'Probe cards & probers', rel: [{ to: 'kyec', label: 'probe supply' }] },
  { id: 'ytec6683', cat: 'testif', name: 'YTEC', zh: '雍智科技', ticker: '6683', exch: 'TWSE', role: 'Test sockets & boards', rel: [{ to: 'mediatek', label: 'socket supplier' }] },

  // ---------------- board ----------------
  { id: 'emc2383', cat: 'ccl', name: 'Elite Material (EMC)', zh: '台光電', ticker: '2383', exch: 'TWSE', role: '#1 ultra-low-loss CCL — the laminate in NVIDIA GPU baseboards', rel: [{ to: 'gce', label: 'CCL into AI PCBs' }, { to: 'nvidia', label: 'qualified laminate' }, { to: 'fulltech', label: 'glass cloth input' }] },
  { id: 'tuc6274', cat: 'ccl', name: 'Taiwan Union Technology (TUC)', zh: '台燿', ticker: '6274', exch: 'TWSE', role: 'Low-loss CCL for switches & servers', rel: [{ to: 'accton', label: 'CCL into switch boards' }, { to: 'cotech', label: 'foil input' }] },
  { id: 'iteq', cat: 'ccl', name: 'ITEQ Corporation', zh: '聯茂', ticker: '6213', exch: 'TWSE', role: 'High-speed CCL & prepreg', rel: [{ to: 'tripod', label: 'laminate supplier' }] },
  { id: 'ventec', cat: 'ccl', name: 'Ventec International', zh: '騰輝電子-KY', ticker: '6672', exch: 'TPEx', role: 'Specialty CCL incl. thermal-management laminates', rel: [{ to: 'gce', label: 'laminate supplier' }] },

  { id: 'gce', cat: 'pcb', name: 'Gold Circuit Electronics (GCE)', zh: '金像電', ticker: '2368', exch: 'TWSE', role: 'Key NVIDIA GPU baseboard / UBB PCB maker', rel: [{ to: 'nvidia', label: 'GPU baseboards' }, { to: 'quanta', label: 'server boards' }, { to: 'emc2383', label: 'CCL input' }] },
  { id: 'tripod', cat: 'pcb', name: 'Tripod Technology', zh: '健鼎', ticker: '3044', exch: 'TWSE', role: 'High-layer server & networking PCBs', rel: [{ to: 'wiwynn', label: 'server PCBs' }] },
  { id: 'boardtek', cat: 'pcb', name: 'Boardtek Electronics', zh: '博智', ticker: '8155', exch: 'TPEx', role: 'AI accelerator & server PCBs', rel: [{ to: 'smci', label: 'server boards' }] },
  { id: 'unitechpcb', cat: 'pcb', name: 'Unitech PCB', zh: '燿華', ticker: '2367', exch: 'TWSE', role: 'HDI & server boards', rel: [{ to: 'foxconn', label: 'board supplier' }] },
  { id: 'compeq', cat: 'pcb', name: 'Compeq Manufacturing', zh: '華通', ticker: '2313', exch: 'TWSE', role: 'HDI boards incl. GPU module PCBs', rel: [{ to: 'nvidia', label: 'module boards' }] },
  { id: 'zdt', cat: 'pcb', name: 'Zhen Ding Technology (ZDT)', zh: '臻鼎-KY', ticker: '4958', exch: 'TWSE', role: 'World’s largest PCB group, expanding into AI substrates', rel: [{ to: 'foxconn', label: 'group affiliate' }] },
  { id: 'topoint', cat: 'pcb', name: 'Topoint Technology', zh: '尖點', ticker: '8021', exch: 'TWSE', role: 'Micro drill bits for high-layer PCBs', rel: [{ to: 'gce', label: 'drill supplier' }] },

  { id: 'yageo', cat: 'passives', name: 'Yageo', zh: '國巨', ticker: '2327', exch: 'TWSE', role: 'World #3 MLCC & chip-resistor group', rel: [{ to: 'nvidia', label: 'passives on GPU boards' }, { to: 'quanta', label: 'board passives' }] },
  { id: 'walsin', cat: 'passives', name: 'Walsin Technology', zh: '華新科', ticker: '2492', exch: 'TWSE', role: 'MLCCs & chip resistors', rel: [{ to: 'gigabyte', label: 'board passives' }] },
  { id: 'holystone', cat: 'passives', name: 'Holy Stone Enterprise', zh: '禾伸堂', ticker: '3026', exch: 'TWSE', role: 'High-voltage & high-reliability MLCCs', rel: [{ to: 'delta', label: 'PSU capacitors' }] },
  { id: 'taitech', cat: 'passives', name: 'TAI-TECH Advanced Electronics', zh: '台慶科', ticker: '3357', exch: 'TPEx', role: 'Power inductors & chokes', rel: [{ to: 'delta', label: 'inductor supplier' }] },
  { id: 'apaq', cat: 'passives', name: 'APAQ Technology', zh: '鈺邦', ticker: '6449', exch: 'TPEx', role: 'Solid polymer capacitors for GPU VRM', rel: [{ to: 'nvidia', label: 'VRM capacitors' }] },
  { id: 'lelon', cat: 'passives', name: 'Lelon Electronics', zh: '立隆電', ticker: '2472', exch: 'TWSE', role: 'Aluminum & polymer capacitors', rel: [{ to: 'delta', label: 'capacitor supplier' }] },
  { id: 'kaimei', cat: 'passives', name: 'Kaimei Electronic (Jamicon)', zh: '凱美', ticker: '2375', exch: 'TWSE', role: 'Capacitors & passive components', rel: [{ to: 'liteon', label: 'capacitor supplier' }] },
  { id: 'txc', cat: 'passives', name: 'TXC Corporation', zh: '晶技', ticker: '3042', exch: 'TWSE', role: 'Crystals & oscillators — timing for boards and optics', rel: [{ to: 'accton', label: 'timing devices' }] },

  // ---------------- subsystems ----------------
  { id: 'avc', cat: 'thermal', name: 'AVC (Asia Vital Components)', zh: '奇鋐', ticker: '3017', exch: 'TWSE', role: '#1 server thermal: 3D-VC, cold plates, CDUs, fans', rel: [{ to: 'nvidia', label: 'GB rack cooling' }, { to: 'quanta', label: 'thermal modules' }, { to: 'foxconn', label: 'thermal modules' }] },
  { id: 'auras', cat: 'thermal', name: 'Auras Technology', zh: '雙鴻', ticker: '3324', exch: 'TWSE', role: 'Cold plates & CDUs for AI racks', rel: [{ to: 'nvidia', label: 'liquid cooling' }, { to: 'wiwynn', label: 'cold plates' }] },
  { id: 'sunon', cat: 'thermal', name: 'Sunonwealth (SUNON)', zh: '建準', ticker: '2421', exch: 'TWSE', role: 'Server fans & blowers with MagLev motors', rel: [{ to: 'quanta', label: 'fan walls' }] },
  { id: 'forcecon', cat: 'thermal', name: 'Forcecon Technology', zh: '力致', ticker: '3483', exch: 'TWSE', role: 'Vapor chambers & heat pipes', rel: [{ to: 'inventec', label: 'thermal modules' }] },
  { id: 'taisol', cat: 'thermal', name: 'Taisol Electronics', zh: '泰碩', ticker: '3338', exch: 'TWSE', role: 'Heat pipes & cold plates', rel: [{ to: 'wistron', label: 'thermal supplier' }] },
  { id: 'nidec6230', cat: 'thermal', name: 'Nidec Chaun-Choung', zh: '尼得科超眾', ticker: '6230', exch: 'TWSE', role: 'Thermal modules (Nidec group)', rel: [{ to: 'quanta', label: 'thermal supplier' }] },
  { id: 'kaori', cat: 'thermal', name: 'Kaori Heat Treatment', zh: '高力', ticker: '8996', exch: 'TWSE', role: 'Brazed-plate heat exchangers & CDU cores for liquid cooling', rel: [{ to: 'vertiv', label: 'heat exchangers' }, { to: 'foxconn', label: 'CDU partner' }] },
  { id: 'yensun', cat: 'thermal', name: 'Yen Sun Technology', zh: '元山', ticker: '6275', exch: 'TPEx', role: 'Cooling fans & modules', rel: [{ to: 'gigabyte', label: 'fan supplier' }] },
  { id: 'dynamic6591', cat: 'thermal', name: 'Dynamic Holding', zh: '動力-KY', ticker: '6591', exch: 'TWSE', role: 'Chassis with integrated liquid-cooling assembly', rel: [{ to: 'smci', label: 'cooling chassis' }] },
  { id: 'fositek', cat: 'thermal', name: 'Fositek', zh: '富世達', ticker: '6805', exch: 'TWSE', role: 'UQD quick-disconnect couplings for liquid-cooled racks', rel: [{ to: 'nvidia', label: 'UQD supplier' }] },
  { id: 'topcotech', cat: 'thermal', name: 'Topco Technologies', zh: '崇越電', ticker: '3388', exch: 'TWSE', role: 'Thermal interface materials (silicone) for modules', rel: [{ to: 'avc', label: 'TIM supplier' }] },

  { id: 'delta', cat: 'power', name: 'Delta Electronics', zh: '台達電', ticker: '2308', exch: 'TWSE', role: '>50% of AI server power: PSUs, power shelves, busbars, cooling', rel: [{ to: 'nvidia', label: '800V HVDC partner' }, { to: 'foxconn', label: 'rack power' }, { to: 'quanta', label: 'server PSUs' }] },
  { id: 'liteon', cat: 'power', name: 'LITE-ON Technology', zh: '光寶科', ticker: '2301', exch: 'TWSE', role: 'Server PSUs & power shelves', rel: [{ to: 'wiwynn', label: 'PSU supplier' }] },
  { id: 'chiconypower', cat: 'power', name: 'Chicony Power Technology', zh: '群電', ticker: '6412', exch: 'TWSE', role: 'Server & networking power supplies', rel: [{ to: 'chicony', label: 'group parent' }, { to: 'inventec', label: 'PSU supplier' }] },
  { id: 'chicony', cat: 'power', name: 'Chicony Electronics', zh: '群光', ticker: '2385', exch: 'TWSE', role: 'Peripherals group; server power via Chicony Power', rel: [{ to: 'chiconypower', label: 'subsidiary' }] },
  { id: 'acbel', cat: 'power', name: 'AcBel Polytech', zh: '康舒', ticker: '6282', exch: 'TWSE', role: 'Server PSUs (acquired ABB power-conversion unit)', rel: [{ to: 'foxconn', label: 'PSU supplier' }] },
  { id: 'channelwell', cat: 'power', name: 'Channel Well Technology (CWT)', zh: '僑威', ticker: '3078', exch: 'TPEx', role: 'Power supplies', rel: [{ to: 'gigabyte', label: 'PSU supplier' }] },
  { id: 'fsp', cat: 'power', name: 'FSP Group', zh: '全漢', ticker: '3015', exch: 'TWSE', role: 'PSUs incl. server & industrial', rel: [{ to: 'msi', label: 'PSU supplier' }] },
  { id: 'dynapack', cat: 'power', name: 'Dynapack International', zh: '順達', ticker: '3211', exch: 'TPEx', role: 'BBU battery backup for AI racks', rel: [{ to: 'quanta', label: 'BBU supplier' }] },
  { id: 'celxpert', cat: 'power', name: 'Celxpert Energy', zh: '加百裕', ticker: '3323', exch: 'TPEx', role: 'BBU packs for GB-series racks', rel: [{ to: 'quanta', label: 'BBU supplier' }] },
  { id: 'tdhitech', cat: 'power', name: 'TD Hitech Energy', zh: '新盛力', ticker: '4931', exch: 'TPEx', role: 'Battery systems & BBU', rel: [{ to: 'wiwynn', label: 'BBU supplier' }] },

  { id: 'chenbro', cat: 'mech', name: 'Chenbro Micom', zh: '勤誠', ticker: '8210', exch: 'TWSE', role: 'Server chassis leader', rel: [{ to: 'nvidia', label: 'MGX chassis' }, { to: 'quanta', label: 'chassis supplier' }] },
  { id: 'chenming', cat: 'mech', name: 'Chenming Mold Industrial', zh: '晟銘電', ticker: '3013', exch: 'TWSE', role: 'Server chassis & mechanical parts', rel: [{ to: 'inventec', label: 'chassis supplier' }] },
  { id: 'aic3693', cat: 'mech', name: 'AIC Inc.', zh: '營邦', ticker: '3693', exch: 'TWSE', role: 'Server chassis & storage enclosures', rel: [{ to: 'smci', label: 'chassis supplier' }] },
  { id: 'inwin', cat: 'mech', name: 'In Win Development', zh: '迎廣', ticker: '6117', exch: 'TPEx', role: 'Server & PC chassis', rel: [{ to: 'gigabyte', label: 'chassis supplier' }] },
  { id: 'kingslide', cat: 'mech', name: 'King Slide Works', zh: '川湖', ticker: '2059', exch: 'TWSE', role: 'Server rail kits — near-monopoly precision slides', rel: [{ to: 'nvidia', label: 'rack rails' }, { to: 'quanta', label: 'rail supplier' }] },
  { id: 'nanjuen', cat: 'mech', name: 'Nan Juen International', zh: '南俊國際', ticker: '6584', exch: 'TWSE', role: 'Server sliding rails', rel: [{ to: 'wiwynn', label: 'rail supplier' }] },

  { id: 'lotes', cat: 'connect', name: 'Lotes', zh: '嘉澤', ticker: '3533', exch: 'TWSE', role: 'CPU/GPU sockets & high-speed connectors', rel: [{ to: 'nvidia', label: 'socket supplier' }, { to: 'amd', label: 'socket supplier' }] },
  { id: 'sinbon', cat: 'connect', name: 'SINBON Electronics', zh: '信邦', ticker: '3023', exch: 'TWSE', role: 'Custom cable assemblies & interconnect', rel: [{ to: 'wiwynn', label: 'cable harnesses' }] },
  { id: 'bizlink', cat: 'connect', name: 'BizLink Holding', zh: '貿聯-KY', ticker: '3665', exch: 'TWSE', role: 'Power whips, busbars & high-speed cables for AI racks', rel: [{ to: 'nvidia', label: 'rack cabling' }] },
  { id: 'speedtech', cat: 'connect', name: 'Speed Tech', zh: '宣德', ticker: '5457', exch: 'TPEx', role: 'High-speed connectors', rel: [{ to: 'foxconn', label: 'connector supplier' }] },
  { id: 'chant', cat: 'connect', name: 'Chant Sincere', zh: '詮欣', ticker: '6205', exch: 'TPEx', role: 'Connectors & cables', rel: [{ to: 'quanta', label: 'connector supplier' }] },
  { id: 'wanshih', cat: 'connect', name: 'Wanshih Electronic', zh: '萬旭', ticker: '6134', exch: 'TPEx', role: 'Cable assemblies', rel: [{ to: 'inventec', label: 'cable supplier' }] },
  { id: 'wellshin', cat: 'connect', name: 'Well Shin Technology', zh: '維熹', ticker: '3501', exch: 'TWSE', role: 'Power cords & connectors', rel: [{ to: 'delta', label: 'power cords' }] },

  { id: 'jpc4977', cat: 'optics', name: 'JPC Connectivity', zh: '眾達-KY', ticker: '4977', exch: 'TWSE', role: '400G/800G optical transceivers', rel: [{ to: 'accton', label: 'optics supplier' }] },
  { id: 'browave', cat: 'optics', name: 'Browave', zh: '波若威', ticker: '3163', exch: 'TPEx', role: 'Optical components & modules', rel: [{ to: 'accton', label: 'optical components' }] },
  { id: 'gloriole', cat: 'optics', name: 'Gloriole Electroptic', zh: '光聖', ticker: '6442', exch: 'TPEx', role: 'Fiber connectivity & transceivers', rel: [{ to: 'nvidia', label: 'fiber links' }] },
  { id: 'landmark', cat: 'optics', name: 'LandMark Optoelectronics', zh: '聯亞', ticker: '3081', exch: 'TPEx', role: 'III-V epi wafers & laser-diode chips for datacom', rel: [{ to: 'jpc4977', label: 'laser chips' }] },
  { id: 'luxnet', cat: 'optics', name: 'LuxNet', zh: '光環', ticker: '3234', exch: 'TPEx', role: 'Laser diodes & optical subassemblies', rel: [{ to: 'accton', label: 'optical components' }] },
  { id: 'apacopto', cat: 'optics', name: 'APAC Opto Electronics', zh: '前鼎', ticker: '4908', exch: 'TPEx', role: 'Optical transceivers & OSA', rel: [{ to: 'accton', label: 'optics supplier' }] },
  { id: 'foci', cat: 'optics', name: 'FOCI Fiber Optic', zh: '上詮', ticker: '3363', exch: 'TPEx', role: 'Fiber connectors & co-packaged-optics (CPO) collaboration with TSMC', rel: [{ to: 'tsmc', label: 'CPO collaboration' }] },
  { id: 'gcs4991', cat: 'optics', name: 'GCS Holdings', zh: '環宇-KY', ticker: '4991', exch: 'TPEx', role: 'GaAs & photonics wafer foundry (VCSEL/laser chips)', rel: [{ to: 'landmark', label: 'III-V peer' }] },

  // ---------------- systems ----------------
  { id: 'foxconn', cat: 'odm', name: 'Hon Hai (Foxconn)', zh: '鴻海', ticker: '2317', exch: 'TWSE', role: 'Largest electronics manufacturer; GB-series rack integration', rel: [{ to: 'nvidia', label: 'rack partner' }, { to: 'delta', label: 'power partner' }, { to: 'kingslide', label: 'rail supplier' }] },
  { id: 'quanta', cat: 'odm', name: 'Quanta Computer', zh: '廣達', ticker: '2382', exch: 'TWSE', role: 'Top AI server ODM for US hyperscalers', rel: [{ to: 'nvidia', label: 'platform partner' }, { to: 'avc', label: 'cooling supplier' }, { to: 'gce', label: 'PCB supplier' }] },
  { id: 'wistron', cat: 'odm', name: 'Wistron', zh: '緯創', ticker: '3231', exch: 'TWSE', role: 'GPU baseboard & AI server maker (DGX/HGX boards)', rel: [{ to: 'nvidia', label: 'baseboard partner' }, { to: 'wiwynn', label: 'subsidiary' }] },
  { id: 'wiwynn', cat: 'odm', name: 'Wiwynn', zh: '緯穎', ticker: '6669', exch: 'TWSE', role: 'Hyperscale data-center servers (Meta, Microsoft)', rel: [{ to: 'nvidia', label: 'GB rack builder' }, { to: 'wistron', label: 'parent' }] },
  { id: 'inventec', cat: 'odm', name: 'Inventec', zh: '英業達', ticker: '2356', exch: 'TWSE', role: 'AI server boards & systems', rel: [{ to: 'nvidia', label: 'board partner' }] },
  { id: 'compal', cat: 'odm', name: 'Compal Electronics', zh: '仁寶', ticker: '2324', exch: 'TWSE', role: 'Notebook giant expanding into AI servers', rel: [{ to: 'nvidia', label: 'MGX systems' }] },
  { id: 'pegatron', cat: 'odm', name: 'Pegatron', zh: '和碩', ticker: '4938', exch: 'TWSE', role: 'EMS & AI server assembly', rel: [{ to: 'nvidia', label: 'server partner' }, { to: 'kinsus', label: 'substrate arm' }] },
  { id: 'mitac', cat: 'odm', name: 'MiTAC Holdings', zh: '神達', ticker: '3706', exch: 'TWSE', role: 'Servers & cloud systems (acquired Intel server line)', rel: [{ to: 'nvidia', label: 'MGX partner' }] },

  { id: 'gigabyte', cat: 'mb', name: 'GIGABYTE Technology', zh: '技嘉', ticker: '2376', exch: 'TWSE', role: 'GPU cards, motherboards & AI servers', rel: [{ to: 'nvidia', label: 'AIC & server partner' }] },
  { id: 'msi', cat: 'mb', name: 'Micro-Star International (MSI)', zh: '微星', ticker: '2377', exch: 'TWSE', role: 'GPU cards, boards & edge servers', rel: [{ to: 'nvidia', label: 'AIC partner' }] },
  { id: 'asus', cat: 'mb', name: 'ASUS', zh: '華碩', ticker: '2357', exch: 'TWSE', role: 'Boards, GPU cards & AI servers', rel: [{ to: 'nvidia', label: 'systems partner' }] },
  { id: 'asrock', cat: 'mb', name: 'ASRock', zh: '華擎', ticker: '3515', exch: 'TWSE', role: 'Boards & server systems (Pegatron group)', rel: [{ to: 'pegatron', label: 'parent group' }, { to: 'amd', label: 'board partner' }] },
  { id: 'chaintech', cat: 'mb', name: 'Chaintech Technology', zh: '承啟', ticker: '2425', exch: 'TWSE', role: 'GPU cards & boards', rel: [{ to: 'nvidia', label: 'AIC partner' }] },
  { id: 'leadtek', cat: 'mb', name: 'Leadtek Research', zh: '麗臺', ticker: '2465', exch: 'TWSE', role: 'NVIDIA workstation GPU cards', rel: [{ to: 'nvidia', label: 'RTX pro partner' }] },
  { id: 'advantech', cat: 'mb', name: 'Advantech', zh: '研華', ticker: '2395', exch: 'TWSE', role: 'Industrial PCs & edge-AI systems', rel: [{ to: 'nvidia', label: 'Jetson ecosystem' }] },
  { id: 'adlink', cat: 'mb', name: 'ADLINK Technology', zh: '凌華', ticker: '6166', exch: 'TWSE', role: 'Edge computing & embedded GPU systems', rel: [{ to: 'nvidia', label: 'edge partner' }] },
  { id: 'lanner', cat: 'mb', name: 'Lanner Electronics', zh: '立端', ticker: '6245', exch: 'TPEx', role: 'Network appliances & edge AI', rel: [{ to: 'nvidia', label: 'edge platforms' }] },
  { id: 'avalue', cat: 'mb', name: 'Avalue Technology', zh: '安勤', ticker: '3479', exch: 'TPEx', role: 'Embedded & edge-AI boards', rel: [{ to: 'advantech', label: 'sector peer' }] },

  { id: 'adata', cat: 'storage', name: 'ADATA Technology', zh: '威剛', ticker: '3260', exch: 'TPEx', role: 'DRAM modules & SSDs', rel: [{ to: 'nanyatech', label: 'DRAM source' }] },
  { id: 'teamgroup', cat: 'storage', name: 'Team Group', zh: '十銓', ticker: '4967', exch: 'TWSE', role: 'Memory modules & industrial storage', rel: [{ to: 'phison', label: 'controller partner' }] },
  { id: 'innodisk', cat: 'storage', name: 'Innodisk', zh: '宜鼎', ticker: '5289', exch: 'TWSE', role: 'Industrial SSD/DRAM & edge-AI storage', rel: [{ to: 'advantech', label: 'edge partner' }] },
  { id: 'transcend', cat: 'storage', name: 'Transcend Information', zh: '創見', ticker: '2451', exch: 'TWSE', role: 'Memory modules & flash products', rel: [{ to: 'micron', label: 'NAND source' }] },

  // ---------------- cloud ----------------
  { id: 'accton', cat: 'net', name: 'Accton Technology', zh: '智邦', ticker: '2345', exch: 'TWSE', role: '800G data-center switches for hyperscalers', rel: [{ to: 'broadcom', label: 'switch silicon' }, { to: 'nvidia', label: 'Spectrum-X ecosystem' }] },
  { id: 'wnc', cat: 'net', name: 'Wistron NeWeb (WNC)', zh: '啟碁', ticker: '6285', exch: 'TWSE', role: 'Networking & communication systems', rel: [{ to: 'wistron', label: 'group affiliate' }] },
  { id: 'alpha3380', cat: 'net', name: 'Alpha Networks', zh: '明泰', ticker: '3380', exch: 'TWSE', role: 'Switches & network appliances', rel: [{ to: 'accton', label: 'sector peer' }] },
  { id: 'sercomm', cat: 'net', name: 'Sercomm', zh: '中磊', ticker: '5388', exch: 'TWSE', role: 'Broadband & telecom equipment', rel: [{ to: 'chtel', label: 'telecom equipment' }] },
  { id: 'zyxel', cat: 'net', name: 'Zyxel Group', zh: '合勤控', ticker: '3704', exch: 'TWSE', role: 'Networking equipment', rel: [{ to: 'chtel', label: 'CPE supplier' }] },

  { id: 'chtel', cat: 'telecom', name: 'Chunghwa Telecom', zh: '中華電', ticker: '2412', exch: 'TWSE', role: 'Taiwan’s largest telecom, IDC & sovereign AI cloud operator', rel: [{ to: 'nvidia', label: 'sovereign AI cloud' }] },
  { id: 'twm', cat: 'telecom', name: 'Taiwan Mobile', zh: '台灣大', ticker: '3045', exch: 'TWSE', role: 'Telecom & GPU cloud services', rel: [{ to: 'nvidia', label: 'GPU cloud partner' }] },
  { id: 'fetnet', cat: 'telecom', name: 'Far EasTone', zh: '遠傳', ticker: '4904', exch: 'TWSE', role: 'Telecom & enterprise AI services', rel: [{ to: 'chtel', label: 'sector peer' }] },
  { id: 'chief6561', cat: 'telecom', name: 'Chief Telecom', zh: '是方', ticker: '6561', exch: 'TPEx', role: 'IDC, cloud exchange & interconnect', rel: [{ to: 'chtel', label: 'parent group' }] },
  { id: 'systex', cat: 'telecom', name: 'SYSTEX', zh: '精誠', ticker: '6214', exch: 'TWSE', role: 'Largest local SI; enterprise AI deployment', rel: [{ to: 'nvidia', label: 'solution partner' }] },
  { id: 'ecloudvalley', cat: 'telecom', name: 'eCloudvalley', zh: '伊雲谷', ticker: '6689', exch: 'TWSE', role: 'Cloud MSP & AI services', rel: [{ to: 'systex', label: 'sector peer' }] },

  // ---------------- anchors ----------------
  { id: 'nvidia', cat: 'anchorcat', name: 'NVIDIA', ticker: 'NVDA', exch: 'US', role: 'AI compute platform — ~90% of accelerators', rel: [{ to: 'tsmc', label: 'sole leading-edge foundry' }, { to: 'foxconn', label: 'rack integration' }, { to: 'quanta', label: 'server ODM' }, { to: 'wiwynn', label: 'server ODM' }] },
  { id: 'amd', cat: 'anchorcat', name: 'AMD', ticker: 'AMD', exch: 'US', role: 'MI-series accelerators & EPYC CPUs', rel: [{ to: 'tsmc', label: 'foundry' }, { to: 'asmedia', label: 'chipset partner' }] },
  { id: 'intel', cat: 'anchorcat', name: 'Intel', ticker: 'INTC', exch: 'US', role: 'Xeon CPUs & accelerators', rel: [{ to: 'tsmc', label: 'partial outsourcing' }] },
  { id: 'broadcom', cat: 'anchorcat', name: 'Broadcom', ticker: 'AVGO', exch: 'US', role: 'Switch silicon & custom AI ASICs', rel: [{ to: 'tsmc', label: 'foundry' }, { to: 'accton', label: 'silicon into Taiwan ODMs' }] },
  { id: 'skhynix', cat: 'anchorcat', name: 'SK hynix', ticker: '000660', exch: 'KR', role: '~50% of HBM', rel: [{ to: 'nvidia', label: 'primary HBM' }, { to: 'tsmc', label: 'HBM base die' }, { to: 'pti', label: 'packaging partner' }] },
  { id: 'micron', cat: 'anchorcat', name: 'Micron Technology', ticker: 'MU', exch: 'US', role: 'HBM & DRAM (major fabs in Taichung/Taoyuan)', rel: [{ to: 'nvidia', label: 'HBM supplier' }, { to: 'pti', label: 'Taiwan packaging & test' }] },
  { id: 'samsung', cat: 'anchorcat', name: 'Samsung Electronics', ticker: '005930', exch: 'KR', role: 'Memory giant & #2 foundry', rel: [{ to: 'asml', label: 'EUV customer' }] },
  { id: 'asml', cat: 'anchorcat', name: 'ASML', ticker: 'ASML', exch: 'EU', role: '100% of EUV lithography systems', rel: [{ to: 'tsmc', label: 'largest customer' }, { to: 'zeiss', label: 'sole optics' }, { to: 'gudeng', label: 'EUV pod ecosystem' }, { to: 'mic6196', label: 'Taiwan service partner' }] },
  { id: 'zeiss', cat: 'anchorcat', name: 'Carl Zeiss SMT', ticker: '—', exch: 'Private', role: 'Sole EUV mirror-optics maker', rel: [{ to: 'asml', label: 'exclusive partner' }] },
  { id: 'tel', cat: 'anchorcat', name: 'Tokyo Electron', ticker: '8035', exch: 'JP', role: 'Coater/developer & etch tools', rel: [{ to: 'tsmc', label: 'tool supplier' }, { to: 'asml', label: 'inline EUV track' }] },
  { id: 'lam', cat: 'anchorcat', name: 'Lam Research', ticker: 'LRCX', exch: 'US', role: 'Plasma-etch leadership', rel: [{ to: 'tsmc', label: 'tool supplier' }] },
  { id: 'amat', cat: 'anchorcat', name: 'Applied Materials', ticker: 'AMAT', exch: 'US', role: 'Deposition & materials engineering', rel: [{ to: 'tsmc', label: 'tool supplier' }, { to: 'foxsemicon', label: 'Taiwan module OEM' }] },
  { id: 'kla', cat: 'anchorcat', name: 'KLA', ticker: 'KLAC', exch: 'US', role: 'Metrology & inspection', rel: [{ to: 'tsmc', label: 'inspection supplier' }] },
  { id: 'shinetsu', cat: 'anchorcat', name: 'Shin-Etsu Chemical', ticker: '4063', exch: 'JP', role: '#1 silicon wafers & EUV resist', rel: [{ to: 'tsmc', label: 'materials supplier' }, { to: 'topco', label: 'Taiwan agent' }] },
  { id: 'ibiden', cat: 'anchorcat', name: 'Ibiden', ticker: '4062', exch: 'JP', role: 'Premier IC substrates', rel: [{ to: 'unimicron', label: 'chief rival' }] },
  { id: 'smci', cat: 'anchorcat', name: 'Supermicro', ticker: 'SMCI', exch: 'US', role: 'Rack-scale AI systems (Taiwan-built subassemblies)', rel: [{ to: 'nvidia', label: 'systems partner' }, { to: 'boardtek', label: 'PCB supplier' }] },
  { id: 'vertiv', cat: 'anchorcat', name: 'Vertiv', ticker: 'VRT', exch: 'US', role: 'Data-center power & cooling infrastructure', rel: [{ to: 'kaori', label: 'heat-exchanger supply' }] },
];

// ---------- lookups & helpers ----------
export const COMPANY_MAP: Record<string, SCCompany> = Object.fromEntries(COMPANIES.map(c => [c.id, c]));
export const CATEGORY_MAP: Record<string, SCCategory> = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const TW_COUNT = COMPANIES.filter(c => c.exch === 'TWSE' || c.exch === 'TPEx').length;
export const TOTAL_COUNT = COMPANIES.length;

/** companies whose rel edges point at `id` (reverse edges) */
export function inboundRels(id: string): { from: string; label: string }[] {
  const out: { from: string; label: string }[] = [];
  for (const c of COMPANIES) {
    for (const r of c.rel || []) if (r.to === id) out.push({ from: c.id, label: r.label });
  }
  return out;
}
