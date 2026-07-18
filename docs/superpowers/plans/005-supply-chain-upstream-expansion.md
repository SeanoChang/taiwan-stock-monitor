# Supply-Chain Upstream Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `lib/data/supply-chain/` with the 2026-07-18 semiconductor-upstream / ABF-substrate / lithography research — new categories, ~27 new Taiwan-listed companies, and role/edge deepening for existing ones — behind a new data-integrity gate.

**Architecture:** Pure-data change to the existing curated graph (`STAGES → CATEGORIES → COMPANIES` + `rel` edges). No UI or route changes. A new `scripts/check-supply-chain.ts` gate (run via `tsx`) validates every invariant and is the test harness for every task. The live `/market` board and force-graph pick up the new TWSE/TPEx companies automatically via the existing quote join.

**Tech Stack:** TypeScript, Next.js (existing), pnpm, `tsx` (new dev dependency, for running the TS integrity script).

This plan implements **step 0** of `docs/superpowers/specs/2026-07-18-ai-server-stack-multi-axis-tree-design.md` (the dataset dependency) and the data portion of `plans/004-stack-tree-expansion.md`. The stack-tree data model, multi-axis navigation, and the tree-specific integrity checks (edge `confidence`/`sourceUrl`, the `actionable` biconditional) are a **separate follow-up plan**.

## Global Constraints

- **Package manager:** pnpm only (repo pins pnpm 11.13.1). Never run `npm`/`yarn`.
- **Next.js docs:** this repo's Next.js has breaking changes vs. training data. Before editing ANY route/server/component file, read the relevant guide in `node_modules/next/dist/docs/`. (This plan is data-only; the constraint bites only if a task strays into `app/`.)
- **Authoritative data source:** `docs/superpowers/ai-server-stack/data-dataset-additions-semiconductor-upstream.md` (§A–§E). **Re-confirm every ticker against TWSE/TPEx or Goodinfo before writing it** — the source's ticker auto-recheck stage was cut short.
- **Bilingual strings:** every `role`/`desc`/`label` uses `l(en, zh)` from `@/lib/i18n/config`. `name`/`zh`/`ticker` are plain strings. zh is Traditional Chinese (zh-Hant-TW).
- **English names/roles below are best-effort** — confirm each company's official English name against its IR/TWSE listing; zh is authoritative (verbatim from §B).
- **Company `id`:** stable, unique, lowercase, ASCII, URL-safe. Convention in this repo: romanized name, disambiguated with the ticker when needed (e.g. `sas5483`, `psi8028`, `tmc2338`). Ticker collisions are impossible; id collisions are caught by the gate.
- **Every `rel.to` and `company.cat` and `category.feeds` entry MUST resolve** to an existing id, or `check:data` fails. If a rel target isn't in the dataset, omit that edge rather than inventing an id.
- **Test harness for every task:** `pnpm check:data` (must exit 0) **and** `pnpm build` (typecheck must pass). `pnpm lint` before each commit.
- **Exclusions (§C):** ticker `4944` (兆遠, delisted) must never appear. 興櫃 tickers `7909`/`7887`/`7918`/`4542` must not use a `TWSE`/`TPEx` `exch` (they get no live quote); they are **not added as companies in this plan** — they belong to the stack-tree watchlist work.

---

### Task 1: Data-integrity gate (the test harness)

Creates the gate first so every later task has a red/green signal. Adds `tsx` and a `check:data` script. The gate must pass on the **current** dataset (baseline green), then we prove it catches problems.

**Files:**
- Modify: `package.json` (add `tsx` devDependency + `check:data` script)
- Modify: `lib/data/supply-chain/types.ts` (add `'Emerging'` to the `exch` union)
- Create: `scripts/check-supply-chain.ts`

**Interfaces:**
- Consumes: `COMPANIES` (`lib/data/supply-chain/companies`), `CATEGORIES` (`./categories`), `STAGES` (`./stages`), `StageId` (`./types`).
- Produces: `pnpm check:data` — exits 0 on success, 1 (with a printed problem list) on any violation. Later tasks rely on this command.

- [ ] **Step 1: Add `'Emerging'` to the `exch` union**

In `lib/data/supply-chain/types.ts`, change the `SCCompany.exch` field:

```ts
  exch: 'TWSE' | 'TPEx' | 'Emerging' | 'US' | 'JP' | 'KR' | 'EU' | 'Private';
```

(`'Emerging'` = 興櫃; the quote join in `lib/server/quotes.ts` only includes `TWSE`/`TPEx`, so `Emerging` companies never fetch a quote. No change needed in `quotes.ts`.)

- [ ] **Step 2: Add `tsx` and the `check:data` script**

Run:
```bash
pnpm add -D tsx
```
Then add to the `"scripts"` block of `package.json`:
```json
    "check:data": "tsx scripts/check-supply-chain.ts",
```

- [ ] **Step 3: Write the integrity gate**

Create `scripts/check-supply-chain.ts` (relative imports on purpose — avoids the `@/` alias in a standalone script):

```ts
// Data-integrity gate for the Taiwan × AI supply-chain dataset.
// Run: pnpm check:data
// Exits non-zero on any violation.

import { CATEGORIES } from '../lib/data/supply-chain/categories';
import { COMPANIES } from '../lib/data/supply-chain/companies';
import { STAGES } from '../lib/data/supply-chain/stages';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

const STAGE_IDS = new Set(STAGES.map((s) => s.id));
const CAT_IDS = new Set(CATEGORIES.map((c) => c.id));
const COMPANY_IDS = new Set(COMPANIES.map((c) => c.id));

// Tickers that must never appear (delisted / no live quote).
const DELISTED = new Set(['4944']); // 兆遠, delisted 2023-11-01
// 興櫃 (emerging board) tickers: allowed only with a non-main-board exch.
const EMERGING = new Set(['7909', '7887', '7918', '4542']);

// 1. unique company ids
const seenCompany = new Set<string>();
for (const c of COMPANIES) {
  if (seenCompany.has(c.id)) err(`duplicate company id: ${c.id}`);
  seenCompany.add(c.id);
}
// 2. unique category ids
const seenCat = new Set<string>();
for (const c of CATEGORIES) {
  if (seenCat.has(c.id)) err(`duplicate category id: ${c.id}`);
  seenCat.add(c.id);
}
// 3. every category.stage is a real stage
for (const c of CATEGORIES) {
  if (!STAGE_IDS.has(c.stage)) err(`category ${c.id}: unknown stage "${c.stage}"`);
}
// 4. every category.feeds target resolves to a category
for (const c of CATEGORIES) {
  for (const f of c.feeds) if (!CAT_IDS.has(f)) err(`category ${c.id}: feeds unknown category "${f}"`);
}
// 5. every company.cat resolves to a category
for (const c of COMPANIES) {
  if (!CAT_IDS.has(c.cat)) err(`company ${c.id}: unknown cat "${c.cat}"`);
}
// 6. every rel.to resolves to a company
for (const c of COMPANIES) {
  for (const r of c.rel ?? []) if (!COMPANY_IDS.has(r.to)) err(`company ${c.id}: rel → unknown company "${r.to}"`);
}
// 7. no delisted ticker present
for (const c of COMPANIES) {
  if (DELISTED.has(c.ticker)) err(`company ${c.id}: delisted ticker ${c.ticker} must be removed`);
}
// 8. 興櫃 tickers must not carry a main-board exch
for (const c of COMPANIES) {
  if (EMERGING.has(c.ticker) && (c.exch === 'TWSE' || c.exch === 'TPEx')) {
    err(`company ${c.id}: 興櫃 ticker ${c.ticker} must not use exch ${c.exch}`);
  }
}

if (errors.length) {
  console.error(`✗ supply-chain integrity: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ supply-chain integrity OK — ${COMPANIES.length} companies, ${CATEGORIES.length} categories`);
```

- [ ] **Step 4: Run the gate on current data — expect PASS**

Run: `pnpm check:data`
Expected: exit 0, prints `✓ supply-chain integrity OK — <N> companies, <M> categories`.

If it errors with an `@/lib/i18n/config` resolution failure, the `paths` alias isn't being read by `tsx`; fix by running `tsx --tsconfig ./tsconfig.json scripts/check-supply-chain.ts` (update the `check:data` script accordingly). Re-run until green.

- [ ] **Step 5: Prove the gate catches problems (red test)**

Temporarily append to any company's `rel`: `{ to: 'does-not-exist', label: l('x', 'x') }`.
Run: `pnpm check:data`
Expected: exit 1, prints `- company <id>: rel → unknown company "does-not-exist"`.
Then **revert** the temporary edit and re-run `pnpm check:data` → back to green.

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm build` (expect success) and `pnpm lint`.
```bash
git add package.json pnpm-lock.yaml scripts/check-supply-chain.ts lib/data/supply-chain/types.ts
git commit -m "chore(data): add supply-chain integrity gate + Emerging exch tier"
```

---

### Task 2: Five new categories (§A)

**Files:**
- Modify: `lib/data/supply-chain/categories.ts` (append 5 entries to `CATEGORIES`)

**Interfaces:**
- Consumes: `SCCategory` shape (`{ id, stage: StageId, name, zh, desc: LStr, feeds: string[] }`), `l` from `@/lib/i18n/config`.
- Produces: category ids `gas`, `pkgmat`, `testlab`, `recycle`, `glasspkg` — consumed by every company task below.

**Stage remap note:** §A proposes stages `test` and `fab`, which are NOT in the `StageId` union (`materials|fabsupport|wafer|chip|package|board|subsystem|system|cloud|anchor`). Remap: `testlab → package` (the stage is literally "Package & Test"), `recycle → fabsupport` ("Equipment & Fab Support"). Keep §A's valid stages: `gas → wafer`, `pkgmat → package`, `glasspkg → package`.

- [ ] **Step 1: Append the 5 categories**

Add before the closing `];` of `CATEGORIES` in `categories.ts`:

```ts
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
```

- [ ] **Step 2: Verify — expect PASS**

Run: `pnpm check:data` (expect green; category count +5) and `pnpm build`.
Expected: `✓ supply-chain integrity OK` with the higher category count.

- [ ] **Step 3: Commit**

```bash
git add lib/data/supply-chain/categories.ts
git commit -m "feat(data): add gas/pkgmat/testlab/recycle/glasspkg categories"
```

---

### Task 3: New companies — materials.ts (cmp, glass, chem)

**Files:**
- Modify: `lib/data/supply-chain/companies/materials.ts` (append to `MATERIALS_COMPANIES`)

**Interfaces:**
- Consumes: `SCCompany` shape, categories `cmp`/`glass`/`chem` (existing), `l`.
- Produces: company ids `sungsheng7768`, `baoteck5340`, `dehong5475`, `nanpao4766`.

- [ ] **Step 1: Append the companies**

Add before the closing `];` of `MATERIALS_COMPANIES`:

```ts
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
```

(§B lists rel targets `emc2383`/`tuc6274` for 建榮/德宏 and `aemc`/`trusval` for 南寶. Add those rel edges **only if** the target ids already exist — confirm with a grep; otherwise leave the edge off and `check:data` stays green.)

- [ ] **Step 2: Verify — expect PASS**

Run: `pnpm check:data` and `pnpm build`. Expected: green, company count +4.

- [ ] **Step 3: Commit**

```bash
git add lib/data/supply-chain/companies/materials.ts
git commit -m "feat(data): add CMP pad / T-glass / packaging-adhesive suppliers"
```

---

### Task 4: New companies — fab-support.ts (equip, euv, fabbuild, recycle)

**Files:**
- Modify: `lib/data/supply-chain/companies/fab-support.ts` (append to `FAB_SUPPORT_COMPANIES`)

**Interfaces:**
- Consumes: categories `equip`/`euv`/`fabbuild` (existing) and `recycle` (Task 2), `l`.
- Produces: ids `innotech7734`, `sindtek6438`, `tenglong6937`, `kungchun3178`, `hwahong6983`, `jiashuo6953`, `pne6613`, `chianfu8383`, `raytech7703`, `megaunion6944`, `taifer1722`, `forestwater8473`.

- [ ] **Step 1: Append the companies**

Add before the closing `];` of `FAB_SUPPORT_COMPANIES`:

```ts
  // ---- 2026-07 upstream expansion ----
  {
    id: 'innotech7734',
    cat: 'equip',
    name: 'Innotech',
    zh: '印能科技',
    ticker: '7734',
    exch: 'TPEx',
    role: l(
      'Vacuum-pressure de-void oven (VTS) ~90% share; solves CoWoS void/warpage',
      '真空壓力除泡烤箱（VTS）全球近九成，解 CoWoS void／warpage',
    ),
    rel: [{ to: 'tsmc', label: l('advanced-packaging tool', '先進封裝設備') }],
  },
  {
    id: 'sindtek6438',
    cat: 'equip',
    name: 'Sindtek Machinery',
    zh: '迅得機械',
    ticker: '6438',
    exch: 'TWSE',
    role: l(
      'Substrate-line automation + TSMC CoWoS AMHS material handling',
      '載板產線自動化＋台積電 CoWoS AMHS 搬運',
    ),
    rel: [
      { to: 'unimicron', label: l('automation supplier', '自動化供應商') },
      { to: 'tsmc', label: l('AMHS supplier', 'AMHS 供應商') },
    ],
  },
  {
    id: 'tenglong6937',
    cat: 'equip',
    name: 'Skytech',
    zh: '天虹科技',
    ticker: '6937',
    exch: 'TWSE',
    role: l(
      'Domestic ALD/PVD deposition tools + 2000+ parts; 2nd-gen EUV pellicle metrology',
      '本土 ALD/PVD 沉積設備＋2000+ 零件；EUV pellicle 量測二代機',
    ),
    rel: [{ to: 'tsmc', label: l('deposition tools', '沉積設備') }],
  },
  {
    id: 'kungchun3178',
    cat: 'equip',
    name: 'Kung Chun Precision',
    zh: '公準精密',
    ticker: '3178',
    exch: 'TPEx',
    role: l(
      'AMAT-concept precision machined parts / jigs for high-end process tools',
      'AMAT 概念——高階製程設備精密加工件／治具',
    ),
  },
  {
    id: 'hwahong6983',
    cat: 'euv',
    name: 'Hwa Yang Precision',
    zh: '華洋精機',
    ticker: '6983',
    exch: 'TPEx',
    role: l(
      "Taiwan's only EUV+DUV photomask particle/defect inspection (0.2µm); extends to CoWoS/TGV",
      '台廠唯一 EUV+DUV 光罩微粒／缺陷檢測（0.2µm），延伸 CoWoS/TGV',
    ),
    rel: [{ to: 'tsmc', label: l('mask inspection', '光罩檢測') }],
  },
  {
    id: 'jiashuo6953',
    cat: 'euv',
    name: 'Jiashuo',
    zh: '家碩科技',
    ticker: '6953',
    exch: 'TPEx',
    role: l(
      'EUV / high-end reticle-pod clean, exchange, inspection & automated storage (Gudeng group)',
      'EUV／高階光罩載具潔淨・交換・檢測・自動倉儲（家登集團）',
    ),
    // rel: add { to: 'gudeng', ... } only if 'gudeng' resolves (confirm by grep)
    rel: [{ to: 'tsmc', label: l('reticle-pod service', '光罩載具服務') }],
  },
  {
    id: 'pne6613',
    cat: 'fabbuild',
    name: 'P&E',
    zh: '朋億',
    ticker: '6613',
    exch: 'TPEx',
    role: l(
      'High-purity chemical delivery systems (CDS) / gas piping to wet-process tools',
      '高潔淨化學品供應系統（CDS）／氣體管路工程',
    ),
    rel: [{ to: 'tsmc', label: l('chemical delivery systems', '化學輸送系統') }],
  },
  {
    id: 'chianfu8383',
    cat: 'fabbuild',
    name: 'ChianFu Industrial',
    zh: '千附實業',
    ticker: '8383',
    exch: 'TPEx',
    role: l(
      'Fab systems engineering (gas/chemical piping) + precision-part integration',
      '廠務系統工程（氣／化學管路）＋精密零組件整合',
    ),
    rel: [{ to: 'tsmc', label: l('fab systems engineering', '廠務系統工程') }],
  },
  {
    id: 'raytech7703',
    cat: 'fabbuild',
    name: 'Rayzher Industrial',
    zh: '銳澤實業',
    ticker: '7703',
    exch: 'TPEx',
    role: l(
      'Fab hook-up / specialty-gas supply systems — manufacture, install, agency',
      '廠務 hookup／特殊氣體供應系統代理製造安裝',
    ),
    rel: [{ to: 'tsmc', label: l('gas supply systems', '氣體供應系統') }],
  },
  {
    id: 'megaunion6944',
    cat: 'recycle',
    name: 'MegaUnion',
    zh: '兆聯實業',
    ticker: '6944',
    exch: 'TWSE',
    role: l(
      'TSMC UPW / wastewater recovery turnkey (listed 2025-05; NT$26.5B backlog)',
      '台積電 UPW／廢水回收系統統包（2025/5 上市；在手 NT$264.7 億）',
    ),
    rel: [{ to: 'tsmc', label: l('water recovery turnkey', '水回收統包') }],
  },
  {
    id: 'taifer1722',
    cat: 'recycle',
    name: 'Taiwan Fertilizer',
    zh: '台肥',
    ticker: '1722',
    exch: 'TWSE',
    role: l(
      'Spent-sulfuric-acid regeneration at TSMC Taichung zero-waste plant (BOT, 2027 H2)',
      '台積電台中零廢中心廢硫酸再生（廠中廠 BOT，2027 H2 投產）',
    ),
    rel: [{ to: 'tsmc', label: l('acid regeneration', '廢酸再生') }],
  },
  {
    id: 'forestwater8473',
    cat: 'recycle',
    name: 'ForestWater',
    zh: '山林水',
    ticker: '8473',
    exch: 'TWSE',
    role: l(
      'Nanzih reclaimed-water plant (BTO); full reclaimed-water supply to TSMC Kaohsiung by end-2028',
      '楠梓再生水廠 BTO，2028 底供台積電高雄廠全量再生水',
    ),
    rel: [{ to: 'tsmc', label: l('reclaimed water', '再生水') }],
  },
```

- [ ] **Step 2: Verify — expect PASS**

Run: `pnpm check:data` and `pnpm build`. Expected: green, company count +12.

- [ ] **Step 3: Commit**

```bash
git add lib/data/supply-chain/companies/fab-support.ts
git commit -m "feat(data): add fab equip/EUV-inspection/fabbuild/recycle suppliers"
```

---

### Task 5: New companies — wafer.ts (gas)

**Files:**
- Modify: `lib/data/supply-chain/companies/wafer.ts` (append to `WAFER_COMPANIES`)

**Interfaces:**
- Consumes: category `gas` (Task 2), existing company `sas5483`, `l`.
- Produces: ids `tsc4772`, `crystalgas4768`, `luhon1229`.

- [ ] **Step 1: Append the companies**

Add before the closing `];` of `WAFER_COMPANIES`:

```ts
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
```

- [ ] **Step 2: Verify — expect PASS**

Run: `pnpm check:data` and `pnpm build`. Expected: green, company count +3.

- [ ] **Step 3: Commit**

```bash
git add lib/data/supply-chain/companies/wafer.ts
git commit -m "feat(data): add specialty-gas suppliers to the wafer stage"
```

---

### Task 6: New companies — package-test.ts (pkgmat, testlab, glasspkg)

**Files:**
- Modify: `lib/data/supply-chain/companies/package-test.ts` (append to `PACKAGE_TEST_COMPANIES`)

**Interfaces:**
- Consumes: categories `pkgmat`/`testlab`/`glasspkg` (Task 2), existing `tsmc`/`ase`/`nvidia`, `l`.
- Produces: ids `jentech3653`, `changwah8070`, `matek3587`, `istgroup3289`, `msscorp6830`, `weihua3055`, `vpec6789`.

- [ ] **Step 1: Append the companies**

Add before the closing `];` of `PACKAGE_TEST_COMPANIES`:

```ts
  // ---- 2026-07 upstream expansion ----
  {
    id: 'jentech3653',
    cat: 'pkgmat',
    name: 'Jentech Precision',
    zh: '健策',
    ticker: '3653',
    exch: 'TWSE',
    role: l(
      'CoWoS/SoIC lids, stiffener rings, plated lids; NVIDIA Rubin MCL micro-channel-lid qualified',
      'CoWoS/SoIC 均熱片・補強環・鍍金蓋板龍頭；輝達 Rubin MCL 微通道蓋板認證',
    ),
    rel: [
      { to: 'nvidia', label: l('lid / heat-spreader supplier', '蓋板／均熱片供應商') },
      { to: 'tsmc', label: l('advanced-packaging materials', '先進封裝材料') },
    ],
  },
  {
    id: 'changwah8070',
    cat: 'pkgmat',
    name: 'Chang Wah Technology',
    zh: '長華',
    ticker: '8070',
    exch: 'TWSE',
    role: l(
      'Packaging-material distribution leader (Sumitomo EMC sole agent); material used in CoWoS',
      '封裝材料通路龍頭（住友培科 EMC 總代理）；材料已用於 CoWoS',
    ),
    rel: [
      { to: 'ase', label: l('EMC distributor', 'EMC 通路') },
      { to: 'tsmc', label: l('packaging-material supply', '封裝材料供應') },
    ],
  },
  {
    id: 'matek3587',
    cat: 'testlab',
    name: 'Materials Analysis Technology',
    zh: '閎康',
    ticker: '3587',
    exch: 'TPEx',
    role: l(
      'Materials analysis (MA) / failure analysis (FA); benefits from 2nm & silicon-photonics validation',
      '材料分析 MA／故障分析 FA（2nm／矽光子驗證受惠）',
    ),
    rel: [
      { to: 'tsmc', label: l('analysis lab', '檢測實驗室') },
      { to: 'ase', label: l('analysis lab', '檢測實驗室') },
    ],
  },
  {
    id: 'istgroup3289',
    cat: 'testlab',
    name: 'iST (Integrated Service Technology)',
    zh: '宜特',
    ticker: '3289',
    exch: 'TPEx',
    role: l('Reliability validation (RA) / IC testing', '可靠度驗證 RA／IC 測試'),
    rel: [
      { to: 'tsmc', label: l('reliability lab', '可靠度實驗室') },
      { to: 'ase', label: l('reliability lab', '可靠度實驗室') },
    ],
  },
  {
    id: 'msscorp6830',
    cat: 'testlab',
    name: 'Materials Solution & Service',
    zh: '汎銓科技',
    ticker: '6830',
    exch: 'TWSE',
    role: l(
      'MA >80% of revenue; tier-1 AI customer runs a dedicated R&D zone in its lab; silicon-photonics loss metrology',
      'MA >80% 營收；全球 tier-1 AI 客戶在其實驗室設專屬 R&D 區；矽光子光損量測',
    ),
    rel: [
      { to: 'tsmc', label: l('analysis lab', '檢測實驗室') },
      { to: 'nvidia', label: l('analysis lab', '檢測實驗室') },
    ],
  },
  {
    id: 'weihua3055',
    cat: 'glasspkg',
    name: 'Weihua Technology',
    zh: '蔚華科技',
    ticker: '3055',
    exch: 'TWSE',
    role: l(
      'Only market non-destructive TGV inspection across glass-substrate stages (SP8000G); CPO test via subsidiary',
      'SP8000G 市場唯一玻璃基板 TGV 各階段非破壞檢測；子公司整合 CPO 測試',
    ),
    rel: [{ to: 'tsmc', label: l('glass-substrate inspection', '玻璃基板檢測') }],
  },
  {
    id: 'vpec6789',
    cat: 'glasspkg',
    name: 'VisEra Technologies',
    zh: '采鈺',
    ticker: '6789',
    exch: 'TWSE',
    role: l(
      'TSMC-invested; hosts the CoPoS mini pilot line (2026)',
      '台積電轉投資；承接 CoPoS mini 試產線（2026）',
    ),
    rel: [{ to: 'tsmc', label: l('CoPoS pilot line', 'CoPoS 試產線') }],
  },
```

- [ ] **Step 2: Verify — expect PASS**

Run: `pnpm check:data` and `pnpm build`. Expected: green, company count +7.

- [ ] **Step 3: Commit**

```bash
git add lib/data/supply-chain/companies/package-test.ts
git commit -m "feat(data): add pkgmat/testlab/glasspkg suppliers"
```

---

### Task 7: New company — board.ts (pcb drill)

**Files:**
- Modify: `lib/data/supply-chain/companies/board.ts` (append to `BOARD_COMPANIES`)

**Interfaces:**
- Consumes: category `pcb` (existing), existing `unimicron`, `l`.
- Produces: id `kaiwai5498`.

- [ ] **Step 1: Append the company**

Add before the closing `];` of `BOARD_COMPANIES`:

```ts
  // ---- 2026-07 upstream expansion ----
  {
    id: 'kaiwai5498',
    cat: 'pcb',
    name: 'Kinwong (Kaiwai Electronics)',
    zh: '凱崴電子',
    ticker: '5498',
    exch: 'TPEx',
    role: l(
      'Second-source micro-drill maker riding the AI/ABF drill shortage; 20-year revenue high 2026-06',
      '第二受惠鑽針廠（AI/ABF 缺針潮）；2026/6 營收 20 年高',
    ),
    rel: [{ to: 'unimicron', label: l('micro-drill supplier', '鑽針供應商') }],
  },
```

(§B also lists rel target `gce` — add `{ to: 'gce', ... }` only if that id resolves.)

- [ ] **Step 2: Verify — expect PASS**

Run: `pnpm check:data` and `pnpm build`. Expected: green, company count +1.

- [ ] **Step 3: Commit**

```bash
git add lib/data/supply-chain/companies/board.ts
git commit -m "feat(data): add micro-drill maker Kaiwai to the board stage"
```

---

### Task 8: Existing-company role & edge deepening (§D)

Updates `role` text and/or adds `rel` edges for companies **already in the dataset**. This is the load-bearing §D work — not just the new rows.

**Files:**
- Modify: whichever company file each id lives in (find with grep — mostly `wafer.ts`, `fab-support.ts`, `materials.ts`, `package-test.ts`, `board.ts`).

**Interfaces:**
- Consumes: existing company ids + `l`. No new ids produced.

- [ ] **Step 1: Locate each §D company**

For each ticker in the table below, find its entry:
```bash
grep -rn "ticker: '<TICKER>'" lib/data/supply-chain/companies/
```
If a ticker has **no** entry, it is not yet in the dataset — treat it as a §B addition (add it in the matching stage file using the Task 3–7 pattern) rather than an update.

- [ ] **Step 2: Apply role/edge deepening**

§D table (from `data-dataset-additions-semiconductor-upstream.md` §D) — update each company's `role` to reflect the "補強重點" and add the listed `rel` edges (only to ids that resolve):

| ticker | zh | update |
|---|---|---|
| 8021 | 尖點 | substrate-grade DLC micro-drills (not just PCB); 2025-12 tie-up with 臻鼎; add rel → `unimicron`, `zdt` (if present) |
| 6664 | 群翊 | >95% of ABF substrate fabs use its bake/coat tools; add rel → `nanyapcb`, `kinsus` (if present) |
| 2467 | 志聖 | invested in 東捷 for glass-substrate lines; semi >50% of revenue |
| 3563 | 牧德 | pushing into IC-substrate fine-line/micro-blind-via AOI (ASE co-dev); add rel → `ase` |
| 3455 | 由田 | official "IC substrate inspection" product line; add rel → `unimicron` (if not already) |
| 8027 | 鈦昇 | TGV glass through-hole laser (into TSMC/ASE adv. packaging); add rel → `tsmc`, `ase` |
| 1785 | 光洋科 | Ru target into TSMC 2nm/RRAM; precious-metal closed loop; subsidiary 創鉅 (興櫃) |
| 1560 | 中砂 | ~70% of TSMC 3nm diamond disks (displaced 3M); A16 CMP ~77 layers |
| 4749 | 新應材 | 2nm EBR/Rinse/develop shipped to 4 TSMC 2nm fabs; sole yellow-light kit |
| 2383 | 台光電 | AI-CCL ~60% share, sole M9 for Rubin; **risk: Doosan chasing Rubin CCL — track** |
| 1815 | 富喬 | low-Dk/low-CTE glass-cloth expansion |
| 1802 | 台玻 | low-Dk/low-CTE glass-cloth expansion |
| 1303 | 南亞 | weaves Nittobo specialty cloth (contract) |
| 8358 | 金居 | HVLP3 (ASIC) / HVLP4 (NVIDIA GPU compute/switch tray); +50% capacity H2 2026 |
| 5434 | 崇越 | Shin-Etsu photoresist sole agent ~50% TW; quartz JV makes furnace tubes/boats |
| 8028 | 昇陽半 | world's largest wafer reclaim ~850K/mo → ~45% global by 2028 (id likely `psi8028`) |
| 1717 | 長興 | first into TSMC adv. packaging: Apple A20 MUF, M5 LMC; validated for CoWoS |
| 1727 | 中華化 | PPT-grade electronic sulfuric acid 5th line; etch/develop chemistry direct to fabs |
| 3305 | 昇貿 | AI/HPC ~50% revenue; low-temp BGA solder balls; metal-based TIM |
| 3388 | 崇越電 | Shin-Etsu silicone-TIM agent; AI-server thermal wins at CSPs |
| 6667 | 信紘科 | pivot to circular-economy green-process fab solutions (TSMC ~55% revenue) |
| 3551 | 世禾 | chamber-parts clean/regen; price+volume up after 2nm ramp |
| 3583 | 辛耘 | front-end wet process + wafer reclaim + equipment agency |
| 6829 | 千附精密 | vacuum transfer / load-lock direct to AMAT & Lam; semi 65-70% |
| 8091 | 翔名 | etch/implant/thin-film parts & coatings; qualified for TSMC 2nm consumables |

For each, edit only the `role` (and `rel` where noted). Example — updating `psi8028` (昇陽半, ticker 8028) in `wafer.ts`:

```ts
    role: l(
      "World's largest wafer-reclaim capacity ~850K/mo, heading to ~45% global by 2028",
      '全球最大再生晶圓產能 ~850K 片/月，2028 全球約 45%',
    ),
```

- [ ] **Step 3: Verify — expect PASS**

Run: `pnpm check:data` and `pnpm build`. Expected: green (company count unchanged; only roles/edges changed).

- [ ] **Step 4: Commit**

```bash
git add lib/data/supply-chain/companies/
git commit -m "feat(data): deepen roles & rel edges for existing upstream suppliers (§D)"
```

---

### Task 9: Exclusion audit + final gate & smoke

**Files:** none created; verification + one possible cleanup edit.

- [ ] **Step 1: Assert delisted / 興櫃 are absent from the main board**

Run:
```bash
grep -rn "ticker: '4944'" lib/data/supply-chain/ || echo "OK: 4944 absent"
grep -rEn "ticker: '(7909|7887|7918|4542)'" lib/data/supply-chain/ || echo "OK: no 興櫃 tickers"
```
Expected: both print the `OK:` line. If any match is found, remove that entry (delisted) or set its `exch: 'Emerging'` (興櫃) — then re-run. The gate (Task 1, checks 7–8) also enforces this.

- [ ] **Step 2: Full gate + build**

Run: `pnpm check:data` and `pnpm build`.
Expected: `✓ supply-chain integrity OK — <N> companies, <M> categories` with `<N>` = old total + 27 and `<M>` = old total + 5; build succeeds.

- [ ] **Step 3: Live smoke — new companies get quotes**

Run: `pnpm dev`, open `/market`, and confirm several new tickers (e.g. `3653`, `6830`, `4772`, `6944`) appear in the TW-listed table with a live quote and are sortable/filterable. Confirm none of `4944`/`7909`/`7887`/`7918`/`4542` appear.
(If touching any route to debug, first read the relevant guide in `node_modules/next/dist/docs/`.)

- [ ] **Step 4: Final commit (if Step 1/3 required a cleanup edit)**

```bash
git add -A
git commit -m "chore(data): exclusion audit — upstream expansion complete"
```

---

## Self-Review

- **Spec coverage:** implements design-spec §7 (categories §A, new companies §B, existing-company deepening §D, exclusions §C, structural-gap note is carried by the stack-tree plan's `gap` nodes) and §8 checks 1 & 4 (id resolution, delisted/興櫃). §8 checks 2–3 (edge `confidence`/`sourceUrl`, `actionable` biconditional) are stack-tree edge invariants — deferred to the follow-up tree plan, noted in the header. §E "no-Taiwan-hook" links are foreign-anchor/`gap` nodes built in the tree plan, not dataset rows here.
- **Placeholder scan:** company `name`/`role.en` are best-effort English flagged in Global Constraints for confirmation (values present, not blank); rel edges to unconfirmed ids are explicitly gated on "add only if it resolves," backed by `check:data`. No blank TODOs.
- **Type consistency:** every added object matches `SCCompany`/`SCCategory`; the gate imports the same `COMPANIES`/`CATEGORIES`/`STAGES`; `check:data` is the single command name used in every task.

## Execution Handoff

(Presented after your review.)
