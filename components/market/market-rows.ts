// Row shaping for the market board: match the query, order the rows and tally
// the advance/decline summary. Pure, so the page stays composition only.

import { CATEGORY_MAP, COMPANIES } from '@/lib/data/supply-chain';
import type { SCCompany } from '@/lib/data/supply-chain';
import { normalizeCode } from '@/lib/format';
import type { MarketSort } from '@/components/market/market-sort';
import type { Quote, QuotesPayload } from '@/lib/server/quotes';

export interface MarketRow {
  company: SCCompany;
  quote: Quote | null;
}

export interface MarketBoard {
  rows: MarketRow[];
  advancers: number;
  decliners: number;
  unchanged: number;
}

function matches(company: SCCompany, q: string, zhq: string): boolean {
  if (!q) return true;
  const cat = CATEGORY_MAP[company.cat];
  return (
    company.name.toLowerCase().includes(q) ||
    (company.zh ?? '').includes(zhq) ||
    company.ticker.includes(q) ||
    cat.name.toLowerCase().includes(q) ||
    cat.zh.includes(zhq)
  );
}

function compare(a: MarketRow, b: MarketRow, sort: MarketSort): number {
  switch (sort) {
    case 'pctDesc':
      return (b.quote?.changePct ?? -Infinity) - (a.quote?.changePct ?? -Infinity);
    case 'pctAsc':
      return (a.quote?.changePct ?? Infinity) - (b.quote?.changePct ?? Infinity);
    case 'volume':
      return (b.quote?.volume ?? -1) - (a.quote?.volume ?? -1);
    case 'code':
      return a.company.ticker.localeCompare(b.company.ticker);
  }
}

/** Taiwan-listed rows for the board, filtered and sorted, plus the day's tally. */
export function buildMarketBoard(
  payload: QuotesPayload,
  query: string,
  sort: MarketSort,
): MarketBoard {
  const zhq = query;
  const q = query.toLowerCase();

  const rows: MarketRow[] = COMPANIES.filter((c) => c.exch === 'TWSE' || c.exch === 'TPEx')
    .filter((c) => matches(c, q, zhq))
    .map((c) => ({ company: c, quote: payload.quotes[normalizeCode(c.ticker)] ?? null }));

  rows.sort((a, b) => compare(a, b, sort));

  const quoted = rows.filter((r) => r.quote);
  const advancers = quoted.filter((r) => r.quote!.change > 0).length;
  const decliners = quoted.filter((r) => r.quote!.change < 0).length;

  return { rows, advancers, decliners, unchanged: quoted.length - advancers - decliners };
}
