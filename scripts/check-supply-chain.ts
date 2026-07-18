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
  for (const f of c.feeds)
    if (!CAT_IDS.has(f)) err(`category ${c.id}: feeds unknown category "${f}"`);
}
// 5. every company.cat resolves to a category
for (const c of COMPANIES) {
  if (!CAT_IDS.has(c.cat)) err(`company ${c.id}: unknown cat "${c.cat}"`);
}
// 6. every rel.to resolves to a company
for (const c of COMPANIES) {
  for (const r of c.rel ?? [])
    if (!COMPANY_IDS.has(r.to)) err(`company ${c.id}: rel → unknown company "${r.to}"`);
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
// 9. unique tickers (the quote join keys on ticker)
const seenTicker = new Set<string>();
for (const c of COMPANIES) {
  if (seenTicker.has(c.ticker)) err(`duplicate ticker: ${c.ticker} (company ${c.id})`);
  seenTicker.add(c.ticker);
}

if (errors.length) {
  console.error(`✗ supply-chain integrity: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(
  `✓ supply-chain integrity OK — ${COMPANIES.length} companies, ${CATEGORIES.length} categories`,
);
