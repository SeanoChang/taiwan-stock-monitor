// Lookups and reverse-edge helpers computed from the company list.

import type { LStr } from '@/lib/i18n/config';

import { COMPANIES } from './companies';
import type { SCCompany } from './types';

export const COMPANY_MAP: Record<string, SCCompany> = Object.fromEntries(
  COMPANIES.map((c) => [c.id, c]),
);

export const TW_COUNT = COMPANIES.filter((c) => c.exch === 'TWSE' || c.exch === 'TPEx').length;
export const TOTAL_COUNT = COMPANIES.length;

/** companies whose rel edges point at `id` (reverse edges) */
export function inboundRels(id: string): { from: string; label: LStr }[] {
  const out: { from: string; label: LStr }[] = [];
  for (const c of COMPANIES) {
    for (const r of c.rel || []) if (r.to === id) out.push({ from: c.id, label: r.label });
  }
  return out;
}
