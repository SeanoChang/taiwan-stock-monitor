// Silicon Stack — curated supply-chain dataset (illustrative snapshot, 15 Jul 2026)
// Structured so a live quote API can later replace priceText/chg/mcapText per ticker.

export interface Level {
  id: number;
  key: string;
  name: string;
  zh: string;
  scale: string;
  blurb: string;
}

export interface CompanyLink {
  to: string;
  label: string;
}

export interface Company {
  short: string;
  name: string;
  ticker: string;
  exch: string;
  country: string;
  private?: boolean;
  note?: string;
  priceText: string;
  chg: number;
  mcapText: string;
  role: string;
  share: string;
  desc: string;
  links: CompanyLink[];
}

export const LEVELS: Level[] = [
  { id: 0, key: 'rack',    name: 'The Data Center', zh: '資料中心',   scale: '≈ 2 m',
    blurb: 'Rows of AI racks — designed in California, built in Taiwan.' },
  { id: 1, key: 'server',  name: 'Inside the Server', zh: '伺服器內部', scale: '≈ 60 cm',
    blurb: 'Eight GPUs, kilowatts of power, and a Taiwanese parts list.' },
  { id: 2, key: 'package', name: 'The GPU Package', zh: '晶片封裝',   scale: '≈ 8 cm',
    blurb: 'One die and eight memory stacks, bonded onto a silicon interposer.' },
  { id: 3, key: 'die',     name: 'The Transistor', zh: '奈米電晶體',  scale: '≈ 4 nm',
    blurb: 'Features printed with EUV light — one machine, one company on Earth.' }
];

export const TOUR: string[] = [
  'It starts in a data center. NVIDIA designs the platform — but the racks are assembled by Taiwan’s Foxconn and Quanta.',
  'Open one server: Delta powers it, AVC cools it, ASPEED’s tiny chip manages it. Nearly every part traces back to Taiwan.',
  'The GPU itself is a sandwich: a TSMC-made die, SK hynix memory stacks, all packaged on TSMC’s CoWoS interposer.',
  'Zoom to 4 nanometers. These shapes are printed with EUV light — machines only ASML can build, with optics only Zeiss can grind.'
];

export const COMPANIES: Record<string, Company> = {
  nvidia: { short: 'NVIDIA', name: 'NVIDIA', ticker: 'NVDA', exch: 'NASDAQ', country: 'United States',
    priceText: 'US$171.80', chg: 1.4, mcapText: 'US$4.2T',
    role: 'AI compute platform',
    share: '~90% of AI accelerator market',
    desc: 'Designs the GPUs and rack-scale systems at the heart of AI data centers. Fabless — every leading chip is manufactured and packaged by TSMC in Taiwan.',
    links: [ { to: 'tsmc', label: 'sole foundry for its GPUs' }, { to: 'skhynix', label: 'primary HBM supplier' }, { to: 'foxconn', label: 'builds its rack systems' }, { to: 'quanta', label: 'builds its servers' } ] },

  tsmc: { short: 'TSMC', name: 'TSMC 台積電', ticker: '2330.TW', exch: 'TWSE', country: 'Taiwan',
    priceText: 'NT$1,145', chg: 0.8, mcapText: 'US$1.1T',
    role: 'Advanced chip foundry',
    share: '~90% of sub-5nm foundry output',
    desc: 'The world’s dominant advanced foundry. Nearly every leading AI chip is manufactured on its EUV-based nodes in Hsinchu, Taichung and Tainan.',
    links: [ { to: 'nvidia', label: 'chief AI customer' }, { to: 'asml', label: 'buys its EUV machines' }, { to: 'shinetsu', label: 'wafer & resist supplier' }, { to: 'globalwafers', label: 'wafer supplier' }, { to: 'ase', label: 'packaging partner' } ] },

  foxconn: { short: 'Foxconn', name: 'Hon Hai 鴻海 (Foxconn)', ticker: '2317.TW', exch: 'TWSE', country: 'Taiwan',
    priceText: 'NT$182.0', chg: 0.5, mcapText: 'US$78B',
    role: 'AI rack integration',
    share: '~40% of global AI server assembly',
    desc: 'The world’s largest electronics manufacturer. Assembles full GB-series AI racks for NVIDIA and the hyperscalers.',
    links: [ { to: 'nvidia', label: 'rack systems partner' }, { to: 'delta', label: 'power supplier' } ] },

  quanta: { short: 'Quanta', name: 'Quanta 廣達', ticker: '2382.TW', exch: 'TWSE', country: 'Taiwan',
    priceText: 'NT$288.0', chg: 1.1, mcapText: 'US$56B',
    role: 'AI server ODM',
    share: 'Top-tier AI server ODM',
    desc: 'Taiwanese ODM designing and building AI servers for the major US cloud providers.',
    links: [ { to: 'nvidia', label: 'server platform partner' }, { to: 'avc', label: 'thermal supplier' } ] },

  smci: { short: 'Supermicro', name: 'Super Micro Computer', ticker: 'SMCI', exch: 'NASDAQ', country: 'United States',
    priceText: 'US$46.20', chg: -0.6, mcapText: 'US$27B',
    role: 'Rack-scale systems',
    share: 'Rack-scale AI systems specialist',
    desc: 'Builds liquid-cooled, rack-scale AI systems — with most motherboards and subassemblies made in Taiwan.',
    links: [ { to: 'nvidia', label: 'GPU systems partner' } ] },

  delta: { short: 'Delta', name: 'Delta Electronics 台達電', ticker: '2308.TW', exch: 'TWSE', country: 'Taiwan',
    priceText: 'NT$425.0', chg: 0.9, mcapText: 'US$44B',
    role: 'Power systems',
    share: '>50% of AI server power supplies',
    desc: 'Powers the AI buildout: server PSUs, rack busbars, and liquid-cooling systems. A quiet giant of the Taiwan exchange.',
    links: [ { to: 'foxconn', label: 'supplies rack power' }, { to: 'quanta', label: 'supplies server PSUs' } ] },

  vertiv: { short: 'Vertiv', name: 'Vertiv Holdings', ticker: 'VRT', exch: 'NYSE', country: 'United States',
    priceText: 'US$108.0', chg: 2.1, mcapText: 'US$41B',
    role: 'Data center infrastructure',
    share: 'Leader in DC cooling & power infra',
    desc: 'Coolant distribution units, in-row cooling and power management for AI data centers.',
    links: [ { to: 'nvidia', label: 'reference cooling partner' } ] },

  avc: { short: 'AVC', name: 'Asia Vital Components 奇鋐', ticker: '3017.TW', exch: 'TWSE', country: 'Taiwan',
    priceText: 'NT$585.0', chg: 1.8, mcapText: 'US$18B',
    role: 'Thermal modules',
    share: 'Top server thermal-module maker',
    desc: '3D vapor chambers, heatsinks and liquid cold plates that keep 1,000W GPUs from melting.',
    links: [ { to: 'quanta', label: 'supplies cooling' }, { to: 'foxconn', label: 'supplies cooling' } ] },

  gce: { short: 'GCE', name: 'Gold Circuit Electronics 金像電', ticker: '2368.TW', exch: 'TWSE', country: 'Taiwan',
    priceText: 'NT$295.0', chg: 1.5, mcapText: 'US$5B',
    role: 'Server PCBs',
    share: 'Key AI server board supplier',
    desc: 'High-layer-count printed circuit boards for GPU baseboards and switch trays.',
    links: [ { to: 'nvidia', label: 'baseboard PCB supplier' } ] },

  aspeed: { short: 'ASPEED', name: 'ASPEED 信驊', ticker: '5274.TWO', exch: 'TPEx', country: 'Taiwan',
    priceText: 'NT$4,150', chg: 0.7, mcapText: 'US$5B',
    role: 'Server management chips',
    share: '~70% of server BMC chips',
    desc: 'A 100-person Taiwanese fabless firm whose baseboard-management chips sit inside most of the world’s servers.',
    links: [ { to: 'tsmc', label: 'fabricates its chips' } ] },

  broadcom: { short: 'Broadcom', name: 'Broadcom', ticker: 'AVGO', exch: 'NASDAQ', country: 'United States',
    priceText: 'US$268.0', chg: 1.0, mcapText: 'US$1.3T',
    role: 'Networking silicon',
    share: 'Ethernet switch silicon leader',
    desc: 'Switch and NIC silicon that stitches thousands of GPUs into one training cluster.',
    links: [ { to: 'tsmc', label: 'fabricates its chips' } ] },

  skhynix: { short: 'SK hynix', name: 'SK hynix', ticker: '000660.KS', exch: 'KRX', country: 'South Korea',
    priceText: '₩292,000', chg: 2.4, mcapText: 'US$140B',
    role: 'HBM memory',
    share: '~50% of HBM market',
    desc: 'Leads high-bandwidth memory — the stacked DRAM that feeds data to the GPU die at terabytes per second.',
    links: [ { to: 'nvidia', label: 'primary HBM customer' }, { to: 'tsmc', label: 'HBM base-die partner' } ] },

  micron: { short: 'Micron', name: 'Micron Technology', ticker: 'MU', exch: 'NASDAQ', country: 'United States',
    priceText: 'US$148.0', chg: 1.2, mcapText: 'US$165B',
    role: 'HBM memory',
    share: '~25% HBM share',
    desc: 'The US challenger in high-bandwidth memory, ramping HBM4 for next-gen accelerators.',
    links: [ { to: 'nvidia', label: 'HBM supplier' } ] },

  samsung: { short: 'Samsung', name: 'Samsung Electronics', ticker: '005930.KS', exch: 'KRX', country: 'South Korea',
    priceText: '₩91,400', chg: 0.3, mcapText: 'US$420B',
    role: 'Memory & foundry',
    share: 'Memory giant, #2 foundry',
    desc: 'Memory giant and the only meaningful foundry rival to TSMC at the leading edge.',
    links: [ { to: 'asml', label: 'buys EUV machines' } ] },

  unimicron: { short: 'Unimicron', name: 'Unimicron 欣興', ticker: '3037.TW', exch: 'TWSE', country: 'Taiwan',
    priceText: 'NT$172.0', chg: 1.3, mcapText: 'US$8B',
    role: 'ABF substrates',
    share: 'Top ABF substrate maker',
    desc: 'The resin substrate that fans the die’s microscopic wiring out to the motherboard. Quietly indispensable.',
    links: [ { to: 'tsmc', label: 'substrate supplier' }, { to: 'ibiden', label: 'chief rival' } ] },

  ibiden: { short: 'Ibiden', name: 'Ibiden', ticker: '4062.T', exch: 'TSE', country: 'Japan',
    priceText: '¥6,850', chg: 0.6, mcapText: 'US$9B',
    role: 'IC substrates',
    share: 'Premier package-substrate maker',
    desc: 'Japanese maker of the highest-end IC package substrates for AI processors.',
    links: [ { to: 'unimicron', label: 'chief rival' } ] },

  ase: { short: 'ASE', name: 'ASE Technology 日月光', ticker: '3711.TW', exch: 'TWSE', country: 'Taiwan',
    priceText: 'NT$165.0', chg: 0.9, mcapText: 'US$23B',
    role: 'Packaging & test (OSAT)',
    share: 'World’s largest OSAT (~30%)',
    desc: 'Packages and final-tests chips for the whole industry, absorbing overflow from TSMC’s advanced packaging lines.',
    links: [ { to: 'tsmc', label: 'packaging partner' } ] },

  asml: { short: 'ASML', name: 'ASML Holding', ticker: 'ASML', exch: 'NASDAQ (ADR)', country: 'Netherlands',
    priceText: 'US$935.0', chg: 1.6, mcapText: 'US$370B',
    role: 'EUV lithography',
    share: '100% of EUV lithography systems',
    desc: 'The only company on Earth that builds EUV machines — €200M+ each, 100,000+ parts, shipped in 40 freight containers. No EUV, no advanced AI chips.',
    links: [ { to: 'zeiss', label: 'sole optics supplier' }, { to: 'tsmc', label: 'largest EUV customer' }, { to: 'samsung', label: 'EUV customer' } ] },

  zeiss: { short: 'Zeiss SMT', name: 'Carl Zeiss SMT', ticker: 'Private', exch: '—', country: 'Germany',
    private: true, note: 'Privately held — ASML owns a 24.9% stake', priceText: '—', chg: 0, mcapText: '—',
    role: 'EUV optics',
    share: 'Sole supplier of EUV mirror optics',
    desc: 'Grinds EUV mirrors so precise that, scaled to the size of Germany, the largest bump would be 0.1 mm. Every ASML machine depends on them.',
    links: [ { to: 'asml', label: 'exclusive optics partner' } ] },

  shinetsu: { short: 'Shin-Etsu', name: 'Shin-Etsu Chemical', ticker: '4063.T', exch: 'TSE', country: 'Japan',
    priceText: '¥5,980', chg: 0.4, mcapText: 'US$78B',
    role: 'Photoresist & wafers',
    share: '#1 in silicon wafers & EUV resist',
    desc: 'The light-sensitive chemicals that record EUV patterns, and the ultra-pure silicon wafers they’re printed on.',
    links: [ { to: 'tsmc', label: 'materials supplier' } ] },

  globalwafers: { short: 'GlobalWafers', name: 'GlobalWafers 環球晶', ticker: '6488.TWO', exch: 'TPEx', country: 'Taiwan',
    priceText: 'NT$418.0', chg: 0.7, mcapText: 'US$12B',
    role: 'Silicon wafers',
    share: '#3 silicon wafer maker globally',
    desc: 'Taiwanese maker of the 300mm mirror-polished silicon discs every chip begins life on.',
    links: [ { to: 'tsmc', label: 'wafer supplier' } ] },

  tel: { short: 'Tokyo Electron', name: 'Tokyo Electron', ticker: '8035.T', exch: 'TSE', country: 'Japan',
    priceText: '¥29,100', chg: 1.1, mcapText: 'US$90B',
    role: 'Coat & develop tools',
    share: '~90% of EUV coater/developers',
    desc: 'Its coater-developer tools apply and develop photoresist — bolted directly onto every ASML EUV machine.',
    links: [ { to: 'asml', label: 'inline tool partner' }, { to: 'tsmc', label: 'tool supplier' } ] },

  lam: { short: 'Lam Research', name: 'Lam Research', ticker: 'LRCX', exch: 'NASDAQ', country: 'United States',
    priceText: 'US$98.00', chg: 0.8, mcapText: 'US$126B',
    role: 'Etch tools',
    share: 'Leader in plasma etch',
    desc: 'Etch machines that carve the printed pattern into silicon, atom layer by atom layer.',
    links: [ { to: 'tsmc', label: 'tool supplier' } ] },

  amat: { short: 'Applied Materials', name: 'Applied Materials', ticker: 'AMAT', exch: 'NASDAQ', country: 'United States',
    priceText: 'US$212.0', chg: 0.5, mcapText: 'US$172B',
    role: 'Deposition tools',
    share: '#1 in materials engineering',
    desc: 'Deposits the atom-thin films — metals, insulators — that build up a chip’s 60+ layers.',
    links: [ { to: 'tsmc', label: 'tool supplier' } ] },

  kla: { short: 'KLA', name: 'KLA Corporation', ticker: 'KLAC', exch: 'NASDAQ', country: 'United States',
    priceText: 'US$905.0', chg: 1.4, mcapText: 'US$121B',
    role: 'Metrology & inspection',
    share: '~55% of process control',
    desc: 'Finds nanometer-scale defects. At 4nm, a single dust particle is a boulder — KLA is the industry’s microscope.',
    links: [ { to: 'tsmc', label: 'inspection supplier' } ] }
};
