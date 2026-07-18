# Tree — 網站導覽地圖 Website Navigation Map（取代四層線性結構）

> Verification tiers: **[✓]** = adversarially verified 3-0 against primary
> sources (deep-research run, 2026-07-17, 105 agents / 23 sources / 24
> confirmed claims) · **[s]** = sourced, single-pass · **[?]** = open gap
> (see `research-open-gaps-second-pass.md`). ★ = Taiwan-listed supplier hook.
>
> **2026-07-18 upstream expansion**: the 半導體上游 branch below was rebuilt
> from 4 research runs (ABF substrate / fab process steps / foundation
> materials / packaging-BEOL-recycling — see the four `research-verified-*`
> files). Those runs' **adversarial-verify + ticker stages were cut short by a
> model limit**, so every upstream node added here is **[s] sourced**, not
> [✓]. New Taiwan-listed hooks and category proposals are in
> `data-dataset-additions-semiconductor-upstream.md`.

## Navigation model

Containment hierarchy (zoom-in buttons per view) + three cross-cutting FLOW
overlays (資料流/電力流/熱流) that light up paths across the tree. No linear
levels — every view offers multiple children to dive into.

```
AI 資料中心
└── 機櫃 GB300 NVL72 (48U MGX, 120→155kW peak) [✓]
    ├── 運算托盤 ×18 (1U; 2 Grace + 4 Blackwell; ~6.3kW) [✓]        ⤵ zoom
    │   ├── Grace CPU (72× Neoverse V2, 3.1GHz, 300W, 480GB LPDDR5X) [✓]
    │   ├── Blackwell Ultra GPU 封裝 ×4 [✓]                          ⤵ zoom
    │   ├── ConnectX-8 SuperNIC ×4 (800G OSFP) [✓] → scale-out flow
    │   ├── BlueField-3 DPU (儲存/管理) [✓]
    │   ├── BMC (ASPEED AST2600 ★信驊5274) [✓]
    │   ├── 電源分配板 PDB (48V→12V, RapidLock, 2.7kW/board) [✓] → power flow
    │   └── 冷板 (CPU/GPU/NIC 全液冷) [✓] → heat flow
    ├── NVLink 交換托盤 ×9 (2× NVSwitch5 @28.8Tb/s; 57.6Tb/s/tray) [✓] ⤵ zoom
    │   └── 銅纜背板匣 5,184 cables (Amphenol Paladin/SkewClear/OverPass) [✓]
    ├── 電源櫃 ×8 (33kW; 6×5.5kW PSU, N+N; ★光寶2301 實裝) [✓]      → power flow
    │   └── GB300 電容儲能 65J/GPU → 尖峰需求 −30% [✓]
    ├── 匯流排 ~50V DC / 1400A [✓]
    ├── 歧管 + 快接頭 QD [✓] → heat flow（★奇鋐/雙鴻/富世達 [?]）
    ├── 管理交換器 ×2 (SN2201) [✓]
    └── 滑軌/機構（★川湖/勤誠 [?]）

GPU 封裝 Blackwell Ultra ─ zoom view [✓]
    ├── GPU 晶粒 ×2 — dual-reticle, 208B 電晶體, TSMC 4NP [✓]        ⤵ zoom
    │   └── NV-HBI 晶粒對晶粒 10TB/s [✓]
    ├── HBM3e ×8 stacks (12-Hi, 36GB/stack → 288GB, 8TB/s) [✓]       ⤵ zoom
    ├── CoWoS-L: RDL interposer + LSI chiplets + eDTC (★台積電2330) [✓]
    ├── 封裝結構件 lid/均熱片/補強環（★健策3653 — 輝達 Rubin MCL）[s] → heat flow
    ├── 成型膠 LMC/MUF（Namics；★長興1717 驗證中）+ underfill [s]
    └── ABF 載板 ⤵ zoom [s]（上游材料由日商獨占，見下）

ABF 載板 IC substrate ─ zoom view [s]
    ├── 載板廠：★欣興3037（AI 佔比 60%）/ ★南電8046（網通/ASIC，H2'26 切美系 AI 二供）
    │             / ★景碩3189（ASIC/HPC，非輝達 GPU）/ ★臻鼎4958（爬坡）；錨點 Ibiden（輝達首選）
    ├── ABF 增層膜：味之素 Ajinomoto ~95%+ 獨占（唯一替代 積水~5%）[s]  ← 無台廠
    ├── 芯材 T-glass 布：日東紡 ~99%（★建榮5340 持股 47.65% 代理層 / ★南亞1303 代織）[s]
    ├── 載體超薄銅箔：三井金屬 MicroThin >95% [s]  ← 無台廠
    ├── 細線乾膜：旭化成/Resonac（★長興1717 中低階）；防焊：太陽油墨 >50% ← 無台廠
    ├── 雷射鑽孔：三菱電機/Via Mechanics；曝光 DI：Adtec/ORC ← 無台廠
    ├── 鑽針：★尖點8021 / ★凱崴5498（缺針潮）[s]
    ├── 乾製程設備：★群翊6664（全球 >95% ABF 廠採用）/ ★志聖2467（壓合/貼膜）[s]
    ├── AOI 檢測：★牧德3563 / ★由田3455（IC 載板專類）[s]
    ├── 自動化 AMHS：★迅得6438 [s]
    └── desmear/鍍銅藥水：Atotech/上村 ← 無台廠（結構性缺口）

GPU 內部 — HBM↔SM 資料路徑 ─ zoom view
    ├── SM ×160（每 SM: 128 CUDA + 4 Tensor + 256KB TMEM；共 20,480 CUDA）[✓]
    ├── L2 快取 [?]
    ├── 記憶體控制器 16×512-bit（8,192-bit 總寬）↔ HBM 8TB/s [✓]
    ├── NVLink 5 PHY: 18 links × 100GB/s = 1.8TB/s 雙向 [✓]
    ├── NVLink-C2C ↔ Grace 900GB/s（記憶體一致性）[✓]
    └── PCIe Gen6 ×16（256GB/s）↔ NIC/DPU [✓]

HBM 堆疊 ─ zoom view
    ├── DRAM die ×12（12-Hi）+ TSV [s]   基底晶粒 base die [?]
    ├── HBM4：2,048-bit 介面、10GT/s（SK hynix 開發完成）[s]
    └── 供應商 SK hynix / Micron / Samsung；封測 ★力成 [?]

Scale-up 互連 ─ flow view
    ├── 一跳式 NVSwitch 星狀拓撲（**非** full-mesh — 該說法已被否證 1-2）[✓]
    ├── 為何用銅：省 ~20kW/rack 光模組功耗；rack 內 <2m [✓]
    └── 開放標準 UALink 200G 1.0（1,024 端點、乙太 PAM4、93% 目標）[✓]

Scale-out 網路 ─ flow view
    ├── 節點側：4×CX-8 800G + BF-3 + BMC 帶外管理 [✓]
    ├── Quantum-X800 XDR IB vs Spectrum-X 乙太 [?]  拓撲 fat-tree/rail [?]
    └── 光傳輸 ⤵ zoom

光傳輸 Optics ─ zoom view（★使用者點名補上的分支）
    ├── 可插拔模組 800G/1.6T（DSP 重定時；~30W/port）[s]
    │   └── ★眾達/前鼎/光聖 模組；★譜瑞 retimer
    ├── LPO/LRO 線性驅動（去 DSP 省電）[s]
    ├── CPO 共封裝光學 [s — NVIDIA 技術部落格]
    │   ├── Quantum-X Photonics：144×800G、115Tb/s、液冷、2026 初出貨
    │   ├── Spectrum-X Photonics：SN6810 128×800G／SN6800 512×800G、H2 2026
    │   └── 效益：9W vs 30W/port、3.5× 省電、電損 22dB→4dB、可靠度 10×
    ├── 矽光子引擎 + 外部雷射 + 光纖 shuffle（★上詮 FOCI／環宇 GCS／聯亞 [?]）
    └── 銅 vs 光的分界：rack 內銅、rack 間光 [✓/s]

電力鏈 ─ flow view [✓]
    市電 3φ 200–480Vac → 電源櫃 33kW ×8 → 匯流排 ~50V/1400A
    → PDB 48→12V → VRM/DrMOS → GPU（最高 1,400W）
    └── 未來 800V HVDC（Kyber 世代）[?]；VRM/DrMOS ★力智/杰力 [?]

散熱鏈 ─ flow view [✓]
    冷板（90% 熱）→ QD → 後歧管（2–50°C，DI 水/PG25）→ CDU → 廠務水（W45）
    └── 10% 氣冷；CDU 型式/浸沒式 [?]；★奇鋐/雙鴻/高力/富世達 [?]

記憶體/儲存階層 ─ flow view
    HBM3e 8TB/s → LPDDR5X 480GB/CPU（C2C 900GB/s）[✓] → NVMe [?] → 網路儲存 [?]

半導體上游 Fab & materials ─ zoom view [s]（2026-07-18 重建；分工鐵律：機台本體多為外商，
台廠吃載具/零件/耗材/化學輸送/檢測/自動化的周邊環）

    晶圓地基 ⤵ zoom
    ├── 矽晶圓：★環球晶6488（全球第三）/ ★台勝科3532 / ★合晶6182 / ★嘉晶3016(磊晶)
    ├── 再生晶圓：★昇陽半8028（全球最大 850K/月）/ ★中砂1560 / ★辛耘3583
    ├── 石英/矽零件：★崇越5434（信越石英 JV）  ← 坩堝/多晶矽/矽電極無台廠 [?]
    └── 光罩：★台灣光罩2338；坯 HOYA >60% ← 無台廠

    黃光 微影 ⤵ zoom
    ├── 曝光機 ASML EUV/High-NA（Intel 18A 首量產 2026/7；台積電僅研發）← 無台廠
    ├── Track 塗佈/顯影 TEL ~90%／EUV ~100% ← 無台廠
    ├── 光阻 日商 ~80%（EUV JSR+信越 ~90%）← 台廠僅代理 ★崇越5434/★華立3010
    ├── 配套化學：★新應材4749（2nm EBR/Rinse 已交 4 廠）/ ★勝一1773 / ★三福化4755 / ★達興5234
    ├── EUV pod 載具：★家登3680（台積電獨供、High-NA 過認證）+ ★家碩6953（潔淨/檢測）
    ├── 光罩檢測：★華洋精機6983（唯一 EUV+DUV 微粒）/ ★天虹6937（pellicle 量測）
    ├── AMC 微污染濾網：★濾能6823（+ 興櫃鈺祥7909）
    └── ASML 模組代工：★帆宣6196

    蝕刻 Etch ⤵ zoom
    ├── 乾蝕刻 Lam/TEL/AMAT ← 無台廠整機
    ├── 腔體零件經濟：★翔名8091 / ★千附精密6829（直供 AMAT/Lam）/ ★世禾3551（清洗再生）/ ★瑞耘6532
    ├── 蝕刻/剝離化學：★中華化1727 / ★三福化4755
    └── 化學/氣體輸送工程：★朋億6613 / ★千附實業8383 / ★信紘科6667 / ★銳澤7703

    薄膜 沉積 Deposition ⤵ zoom
    ├── 設備 ASM/AMAT(PVD 85%)/Kokusai ← 台廠 ★京鼎3413 模組代工（AMAT 依存 >80%）
    ├── 靶材：★光洋科1785（Ru 靶切台積電 2nm）+ 興櫃創鉅7918
    ├── 特殊氣體/前驅物：★台特化4772（乙矽烷）/ ★晶呈4768 / ★聯華實業控股1229 + 興櫃宇川7887
    └── AMAT 概念零件：★瑞耘6532/★翔名8091/★千附精密6829/★公準3178

    清洗 / CMP / 檢測 ⤵ zoom
    ├── 清洗 SCREEN 獨大 ← 台廠 ★辛耘3583（前段）/ ★弘塑3131（先進封裝）
    ├── CMP：設備 AMAT/Ebara；鑽石碟 ★中砂1560（台積電 3nm ~70%）；
    │        研磨墊 ★頌勝7768（全台唯一量產）；slurry 外商 ← 無台廠
    ├── 量測/檢測 KLA >56%；EUV 光罩 Lasertec 獨占 ← 無台廠整機
    └── 檢測分析實驗室：★汎銓6830 / ★閎康3587 / ★宜特3289（2nm/矽光子驗證）

    BEOL 金屬化 ─ flow view [s]
    ├── 銅→釕(Ru)/鉬(Mo) 轉折（2nm 以下電阻瓶頸）；台廠曝險 ★光洋科1785 靶材
    ├── 鍍銅藥水 MacDermid/杜邦/Atotech ← 無台廠
    └── 電子級硫酸 ★中華化1727（PPT 級第五線）

    封裝材料 Package materials ─ flow view [s]
    ├── lid/均熱片 ★健策3653（輝達 Rubin MCL）→ heat flow
    ├── 成型膠 LMC/MUF ★長興1717（打進台積電，驗證 CoWoS）；EMC 通路 ★長華8070
    ├── 錫球/焊料 ★昇貿3305；封裝 TIM ★崇越電3388
    └── CoWoS 熱處理設備四雄：★印能7734(除泡壓力烤箱 ~90%)/★志聖2467/★群翊6664/興櫃科嶠4542

    玻璃基板 / 面板級封裝 CoPoS/FOPLP ─ zoom view [s]
    ├── 低 CTE 玻璃 Corning/AGC/SCHOTT/NEG ← 台積電 CoPoS 於 ★采鈺6789 建 mini line(2026)
    ├── TGV 雷射：★鈦昇8027；烘烤/壓合：★群翊6664；非破壞檢測：★蔚華科3055
    └── 面板廠跨界：★群創3481/★友達2409/★正達3149/★宸鴻3673/★友威科3580（事證 C）

    廠務循環 Fab circular economy ─ flow view [s]
    ├── 廢硫酸再生 ★台肥1722（台積電零廢中心廠中廠）；「一滴硫酸不外運」
    ├── UPW/廢水回收 ★兆聯6944（台積電水循環統包）；再生水 ★山林水8473（供高雄廠）
    ├── e-IPA 溶劑閉環 ★勝一1773；靶材貴金屬閉環 ★光洋科1785；零件再生 ★世禾3551
    └── 綁定約束：電力（2026-2035 需求年增 2.5%，AI+半導體驅動）
```

## What this replaces

The linear four-level scroll (rack→server→package→die) becomes the **guided
spine** — one curated path through this tree — while every view exposes its
children as zoom buttons for free exploration. See
`design-tree-navigation-experience.md`.
