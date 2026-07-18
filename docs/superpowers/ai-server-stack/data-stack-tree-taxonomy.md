# Data — Stack-tree node taxonomy → categories/companies mapping

Node ids (stable, URL-safe) → existing dataset hooks. New categories needed
are marked NEW.

| Node id | zh | Category hook | Companies (verified★/mapped) |
|---|---|---|---|
| dc | 資料中心 | telecom | chtel, twm |
| rack | 機櫃 NVL72 | odm | foxconn, quanta, wiwynn |
| rack.tray | 運算托盤 | odm/mech | quanta, wistron, chenbro |
| rack.tray.grace | Grace CPU | anchor | nvidia |
| rack.tray.gpu | GPU 封裝 | foundry/osat | tsmc★, ase |
| rack.tray.nic | SuperNIC/DPU | icdesign/anchor | nvidia, realtek |
| rack.tray.bmc | BMC | icdesign | aspeed★ (AST2600 verified) |
| rack.tray.pdb | 電源分配板 | analog | upi6719, excelliance [verify] |
| rack.switchtray | NVLink 交換托盤 | anchor | nvidia |
| rack.copper | 銅纜背板 | connect | (Amphenol US) bizlink? [verify] |
| rack.powershelf | 電源櫃 | power | liteon★ (verified photo), delta |
| rack.busbar | 匯流排 | connect | bizlink [verify] |
| rack.cooling | 歧管/QD | thermal | avc, auras, fositek, kaori [verify] |
| rack.rails | 滑軌 | mech | kingslide, nanjuen |
| gpu.die | GPU 晶粒 | foundry | tsmc★ |
| gpu.hbm | HBM 堆疊 | memchip/anchor | skhynix, micron, samsung, pti [verify] |
| gpu.cowos | CoWoS-L | foundry | tsmc★ (sole, verified) |
| gpu.substrate | ABF 載板 | substrate | unimicron, nanyapcb, kinsus, zdt; anchor ibiden |
| gpu.substrate.film | ABF 增層膜 | (anchor/gap) | Ajinomoto ~95% — NO TW listed |
| gpu.substrate.tglass | 芯材 T-glass 布 | glass | baotek5340, nanya1303; anchor Nittobo |
| gpu.substrate.drill | 鑽針 | pcb | topoint8021, kaiwai5498 |
| gpu.substrate.equip | 乾製程/AOI/自動化 | equip | groupup6664, csun2467, machvision3563, utechzone3455, symtek6438 |
| gpu.pkgmat.lid | lid/均熱片 | pkgmat NEW | jentech3653 |
| gpu.pkgmat.mold | 成型膠 LMC/MUF | pkgmat/chem | eternal1717; distributor changhua8070; anchor Namics |
| gpu.internal.sm | SM | anchor | nvidia |
| gpu.internal.memctrl | 記憶體控制器 | anchor | nvidia |
| net.scaleup | NVLink/銅 | anchor | nvidia |
| net.scaleout | IB/乙太 | net | accton, wnc |
| net.optics | 光傳輸 | optics **NEW subnodes** | jpc4977, apacopto, gloriole, foci, gcs4991, landmark, parade |
| net.optics.cpo | CPO | optics NEW | tsmc★, foci [verify] |
| power.chain | 電力鏈 | power | delta, liteon★, chiconypower |
| heat.chain | 散熱鏈 | thermal | avc, auras, kaori, fositek |
| mem.tiers | 記憶體階層 | memchip/storage | nanyatech, adata, phison |
| upstream | 半導體上游 | (existing) | gudeng, asml, … |
| up.wafer | 矽晶圓/再生 | si/reclaim | globalwafers, formosasumco, waferworks, psi8028, kinik, scientech |
| up.mask | 光罩/檢測 | mask/euv | tmc2338, gudeng, jiashuo6953, hwahong6983, skytech6937 |
| up.litho | 黃光 微影 | euv/chem/dist | gudeng, greenfilter, aemc, topco, hwalin3010, marketech6196 |
| up.etch | 蝕刻 腔體零件 | euv/equip | hsiangming8091, chianfu6829, shihher3551, rayzher6532 |
| up.depo | 薄膜 沉積 | equip/target/gas | foxsemicon3413, solartech1785, taisc4772, jingcheng4768, lienhwa1229 |
| up.clean.cmp | 清洗/CMP | equip/cmp | scientech3583, gpt3131, kinik1560, sungslin7768 |
| up.testlab | 檢測分析 | testlab NEW | mssc6830, materials3587, ita3289 |
| up.beol | BEOL 金屬化 | target/chem | solartech1785, chunghwachem1727 |
| up.recycle | 廠務循環/水 | recycle NEW | megaunion6944, taifer1722, forestwater8473, shiny1773 |
| up.glasspkg | 玻璃基板/FOPLP | glasspkg NEW | chipmos6789?, walsin3055, innolux3481, auo2409 (evidence C) |

New-category ids to define in supply-chain.ts: `gas`, `pkgmat`, `testlab`,
`recycle`, `glasspkg` — see `data-dataset-additions-semiconductor-upstream.md`
for the full company table, tickers to re-confirm, and role/rel proposals.
(Company ids above are suggested slugs; Claude Code assigns final ids.)

Dataset TODOs: add `hbm` alias companies (skhynix/micron/samsung already
anchors); add CPO/silicon-photonics category or extend `optics` with
sub-tags; add rel edges nvidia↔liteon (power shelf, verified), nvidia↔
amphenol? (foreign, optional), tsmc↔foci (COUPE/CPO, existing).
Every table row must resolve against `lib/data/supply-chain.ts` ids — extend
the integrity script.
