// Data-integrity gate for lib/data/hardware-map.ts — verifies every
// HardwarePart resolves to a registered PartId, an existing supply-chain
// category, valid explicit companyIds (present AND in that category), a
// non-empty derived company list, a legal chapter range, and unique ids.
// Pure (no WebGL/DOM). Run: pnpm check:hardware

import { ALL_PART_IDS } from '../lib/scene/parts';
import { CATEGORY_MAP } from '../lib/data/supply-chain/categories';
import { COMPANIES } from '../lib/data/supply-chain/companies';
import { HARDWARE_PARTS, companiesForPart } from '../lib/data/hardware-map';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

const PART_IDS = new Set<string>(ALL_PART_IDS);

// 1. unique HardwarePart ids
const seen = new Set<string>();
for (const p of HARDWARE_PARTS) {
  if (seen.has(p.id)) err(`duplicate HardwarePart id: ${p.id}`);
  seen.add(p.id);
}

for (const p of HARDWARE_PARTS) {
  // 2. id must be a registered PartId
  if (!PART_IDS.has(p.id)) err(`${p.id}: not a registered PartId (see ALL_PART_IDS)`);

  // 3. categoryId must resolve to an existing category
  if (!CATEGORY_MAP[p.categoryId]) err(`${p.id}: unknown categoryId "${p.categoryId}"`);

  // 4. every explicit companyId must exist AND belong to categoryId
  for (const cid of p.companyIds ?? []) {
    const c = COMPANIES.find((cc) => cc.id === cid);
    if (!c) {
      err(`${p.id}: unknown companyId "${cid}"`);
    } else if (c.cat !== p.categoryId) {
      err(`${p.id}: companyId "${cid}" belongs to cat "${c.cat}", not "${p.categoryId}"`);
    }
  }

  // 5. companiesForPart(part) must resolve to at least one company
  if (companiesForPart(p).length === 0) {
    err(`${p.id}: companiesForPart() resolved to zero companies`);
  }

  // 6. chapters within [0,7] and p0 <= p1
  const [p0, p1] = p.chapters;
  if (p0 < 0 || p1 > 7 || p0 > p1) {
    err(`${p.id}: chapters [${p0},${p1}] out of range or inverted (expect 0<=p0<=p1<=7)`);
  }
}

if (errors.length) {
  console.error(`✗ hardware-map: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ hardware-map OK — ${HARDWARE_PARTS.length} parts, all categories/companies resolve`);
