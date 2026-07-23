# Data — 半導體上游資料集擴充清單（交給 Claude Code 執行）

> **給 Claude Code**：這是把四輪研究（ABF 載板／製程站點／地基材料／封裝-BEOL-循環）落到
> `lib/data/supply-chain.ts` 的擴充規格。**寫入前每個代號請用 TWSE/TPEx 或 Goodinfo 再複核
> 一次**——本輪 ticker 自動複核階段因模型額度中斷未跑完，代號來自研究代理所附 Yahoo/上市櫃
> 公告，強度見「事證」欄。維持既有型別 `SCCompany`／`CATEGORIES`，並跑 integrity 腳本。
> 研究日 2026-07-17/18。

## A. 建議新增類別（CATEGORIES）

| id         | name                           | zh                   | stage   | feeds              | 說明                       |
| ---------- | ------------------------------ | -------------------- | ------- | ------------------ | -------------------------- |
| `gas`      | Specialty & electronic gases   | 特殊／電子氣體       | wafer   | ['foundry']        | 矽前驅物、特氣、AHF        |
| `pkgmat`   | Package materials & structures | 封裝材料／結構件     | package | ['osat','foundry'] | lid/均熱片/成型膠/EMC 通路 |
| `testlab`  | Analysis & reliability labs    | 檢測分析實驗室       | test    | ['foundry','osat'] | MA/FA/RA 第三方實驗室      |
| `recycle`  | Fab circular economy & water   | 廠務循環／水資源     | fab     | ['foundry']        | 廢酸/溶劑/UPW/再生水回收   |
| `glasspkg` | Glass-core / panel-level pkg   | 玻璃基板／面板級封裝 | package | ['osat']           | CoPoS/FOPLP/TGV 設備與載板 |

（也可把 `recycle` 併入既有 `fabbuild`、`glasspkg` 併入 `equip`；上表為較誠實的分層，擇一。）

## B. 新增公司（TWSE/TPEx 掛牌——有行情，可進 market board）

事證：**A** = 多來源、角色明確；**B** = 單來源附出處；**C** = 事證薄／需再查 IR。

| ticker | exch | zh           | 建議 cat | 角色（zh）                                                                   | 建議 rel →       | 事證  |
| ------ | ---- | ------------ | -------- | ---------------------------------------------------------------------------- | ---------------- | ----- |
| 3653   | TWSE | 健策         | pkgmat   | CoWoS/SoIC 均熱片・補強環・鍍金蓋板龍頭；輝達 Rubin MCL 微通道蓋板認證       | nvidia, tsmc     | **A** |
| 8070   | TWSE | 長華*        | pkgmat   | 封裝材料通路龍頭（住友培科 EMC 總代理）；材料已用於 CoWoS                    | ase, tsmc        | A     |
| 7734   | TPEx | 印能科技     | equip    | 真空壓力除泡烤箱（VTS）壓力除泡全球近九成，解 CoWoS void/warpage             | tsmc             | A     |
| 6438   | TWSE | 迅得機械     | equip    | 載板產線自動化＋台積電 CoWoS AMHS 搬運                                       | unimicron, tsmc  | A     |
| 7768   | TWSE | 頌勝科技     | cmp      | 全台唯一量產 CMP 研磨墊、入台積電鏈（子公司智勝 iVT）                        | tsmc             | A     |
| 4772   | TPEx | 台特化       | gas      | 半導體級矽甲烷/乙矽烷（Si2H6）——台積電 2nm GAA CVD 主力；中美晶集團          | tsmc, sas5483    | A     |
| 4768   | TPEx | 晶呈科技     | gas      | 全製程四段特氣（C4F8/C4F6/SF6/AHF）＋濕化學＋再生晶圓                        | tsmc             | B     |
| 1229   | TWSE | 聯華實業控股 | gas      | 持台灣最大工業氣體商聯華林德約 50%（林德本身未上市，唯一掛牌曝險）           | tsmc             | B     |
| 5340   | TPEx | 建榮         | glass    | 日東紡持股 47.65% 的台灣玻纖布關係企業，最貼近 T-glass 獨占者；接單滿至 2027 | emc2383, tuc6274 | A     |
| 5475   | TPEx | 德宏         | glass    | 台灣唯一電子級石英纖維紗/石英布，Rubin 世代 M9/Q 布（Df 約玻纖 1/10）        | emc2383          | A     |
| 5498   | TPEx | 凱崴電子     | pcb      | 第二受惠鑽針廠（AI/ABF 缺針潮）；2026/6 營收 20 年高                         | gce, unimicron   | B     |
| 6983   | TPEx | 華洋精機     | euv      | 台廠唯一 EUV+DUV 光罩微粒/缺陷檢測（SFO 專利、0.2µm），延伸 CoWoS/TGV        | tsmc             | A     |
| 6953   | TPEx | 家碩科技     | euv      | EUV/高階光罩載具潔淨・交換・檢測・自動倉儲（家登集團；台積電、Intel 採用）   | gudeng, tsmc     | A     |
| 6937   | TWSE | 天虹科技     | equip    | 本土 ALD/PVD 沉積設備＋2000+ 設備零件；EUV pellicle 量測二代機               | tsmc             | B     |
| 3587   | TPEx | 閎康         | testlab  | 材料分析 MA／故障分析 FA（2nm/矽光子驗證受惠）                               | tsmc, ase        | A     |
| 3289   | TPEx | 宜特         | testlab  | 可靠度驗證 RA／IC 測試                                                       | tsmc, ase        | A     |
| 6830   | TWSE | 汎銓科技     | testlab  | MA >80% 營收；全球 tier-1 AI 客戶在其實驗室設專屬 R&D 區；跨矽光子光損量測   | tsmc, nvidia     | A     |
| 6944   | TWSE | 兆聯實業     | recycle  | 台積電 UPW/廢水回收系統統包（2025/5 轉上市；在手訂單 NT$264.7 億）           | tsmc             | A     |
| 1722   | TWSE | 台肥         | recycle  | 台積電台中零廢中心廢硫酸再生（廠中廠 BOT，2027 H2 投產）                     | tsmc             | B     |
| 8473   | TWSE | 山林水       | recycle  | 楠梓再生水廠 BTO，2028 底供台積電高雄廠全量再生水                            | tsmc             | B     |
| 6613   | TPEx | 朋億         | fabbuild | 高潔淨化學品供應系統 CDS／氣體管路工程（送蝕刻/清洗化學到濕製程機台）        | tsmc             | B     |
| 8383   | TPEx | 千附實業     | fabbuild | 廠務系統工程（氣/化學管路）＋精密零組件整合                                  | tsmc             | B     |
| 7703   | TPEx | 銳澤實業     | fabbuild | 廠務 hookup／特殊氣體供應系統代理製造安裝                                    | tsmc             | C     |
| 4766   | TWSE | 南寶         | chem     | 與新應材/信紘科合資切台積電先進封裝 UV 解膠/膠黏材料                         | aemc, trusval    | B     |
| 3055   | TWSE | 蔚華科技     | glasspkg | SP8000G 市場唯一玻璃基板 TGV 各階段非破壞檢測；子公司思衛整合 CPO 測試       | tsmc             | B     |
| 6789   | TWSE | 采鈺         | glasspkg | 台積電轉投資；承接 CoPoS mini 試產線（2026）                                 | tsmc             | B     |
| 3178   | TPEx | 公準精密     | equip    | AMAT 概念——高階製程設備精密加工件/治具                                       | amat             | C     |

### 次級／玻璃基板題材（事證 C，建議先列 watch，勿貿然加 rel）

群創3481（FOPLP/玻璃）、友達2409（FOPLP/玻璃）、正達3149（玻璃加工×康寧）、宸鴻3673（TGV 試產）、
友威科3580（濺鍍/FOPLP 金屬化）、致茂2360（載板電測，需再查 IR）、國精化學4722（樹脂/單體）。

## C. 不可加入（下市／興櫃無行情）

- **兆遠 4944 —— 已於 2023/11/1 下市**（0.02:1 換股併入環球晶）。**刪除任何殘留引用。**
- **興櫃（emerging board）＝無 TWSE/TPEx 日行情，勿放 market board**，僅可列 watchlist 註記：
  鈺祥7909（AMC 濾網）、宇川精材7887（ALD 前驅物）、創鉅7918（光洋科子公司靶材）、
  科嶠4542（CoWoS 載盤清洗）、穩晟材料（未上市 SiC）、晶化科技 WaferChem（未上市 ABF 膜）、
  台灣上村/台灣太陽油墨/長春集團（未上市外商或集團）。

## D. 既有公司「角色深化」（更新 role 文字／補 rel，非新增）

| ticker         | zh             | 補強重點                                                                             |
| -------------- | -------------- | ------------------------------------------------------------------------------------ |
| 8021           | 尖點           | 載板專用 DLC 微鑽針（非僅 PCB）；2025/12 與臻鼎4958 策略合作；補 rel → unimicron/zdt |
| 6664           | 群翊           | 全球 >95% ABF 載板廠採用其烘烤/塗佈設備；補 rel → nanyapcb/kinsus                    |
| 2467           | 志聖           | 入股東捷8064 組玻璃基板整線；半導體占比升 >50%；補 rel → 東捷                        |
| 3563           | 牧德           | 上攻 IC 載板細線/微盲孔 AOI（日月光策略入股共同開發）；補 rel → ase                  |
| 3455           | 由田           | 官方型錄「IC 載板檢測設備」專類；補 rel → unimicron（已有）                          |
| 8027           | 鈦昇           | TGV 玻璃通孔雷射（傳入台積電/日月光先進封裝）；補 rel → tsmc/ase                     |
| 1785           | 光洋科         | Ru 靶材切台積電 2nm/RRAM；靶材貴金屬閉環；子公司創鉅（興櫃）                         |
| 1560           | 中砂           | 台積電 3nm 鑽石碟約 70%（首度擠下 3M）；A16 CMP 約 77 層                             |
| 4749           | 新應材         | 2nm EBR/Rinse/顯影已交台積電 4 座 2nm 廠；黃光配套獨供                               |
| 2383           | 台光電         | AI-CCL 全球約 60%、稱 Rubin 唯一 M9；**風險：Doosan 傳搶 Rubin CCL，需追蹤**         |
| 1815/1802/1303 | 富喬/台玻/南亞 | 低 Dk/低 CTE 玻纖布擴產；南亞為日東紡代織特殊布                                      |
| 8358           | 金居           | HVLP3（ASIC）/HVLP4（輝達 GPU 運算/交換托盤）；H2 2026 產能 +50%                     |
| 5434           | 崇越           | 信越光阻總代理台灣約 50%；崇越石英 JV 產爐管/晶舟                                    |
| 8028           | 昇陽半         | 全球最大再生晶圓 ~850K 片/月→2028 全球 45%                                           |
| 1717           | 長興           | 首打台積電先進封裝：Apple A20 MUF、M5 LMC，驗證用於 CoWoS                            |
| 1727           | 中華化         | PPT 級電子硫酸第五線；蝕刻/顯影液直供晶圓廠                                          |
| 3305           | 昇貿           | AI/HPC 約 50% 營收；低溫 BGA 錫球；開發金屬基 TIM                                    |
| 3388           | 崇越電         | 信越矽利光 TIM 代理，AI 伺服器散熱獲 CSP 訂單                                        |
| 6667           | 信紘科         | 轉「循環經濟綠色製程」fab 方案（台積電約 55% 營收）                                  |
| 3551           | 世禾           | 腔體零件清洗/再生；2nm 量產後頻率＋單價齊揚                                          |
| 3583           | 辛耘           | 前段濕製程（清洗/蝕刻/剝離）＋再生晶圓＋設備代理三事業                               |
| 6829           | 千附精密       | 真空傳輸腔/Load Lock 直供 AMAT 與 Lam，半導體占 65-70%                               |
| 8091           | 翔名           | 蝕刻/離子植入/薄膜零件與鍍膜，過台積電 2nm 耗材                                      |

## E. 誠實缺口註記（放進節點資料的 confidence 欄，勿硬塞台廠）

以下環節**無台灣純掛牌標的**，資料集應以外商錨點＋缺口標示：多晶矽（Hemlock/Wacker）、
石英坩堝（信越石英）、蝕刻矽電極、EUV 光阻（JSR/信越/TOK）、CMP slurry（Fujimi/Entegris）、
載板 ABF 膜（味之素）、載板 T-glass（日東紡）、載板超薄銅箔（三井）、防焊（太陽油墨）、
desmear/鍍銅藥水（Atotech/上村）、Co/Ru/Mo 前驅物與 low-k（Merck/Entegris）、track（TEL）、
曝光機（ASML）、光罩坯（HOYA）、光罩檢測（Lasertec）、光罩寫入（IMS/NuFlare）。
