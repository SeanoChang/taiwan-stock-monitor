// Sort vocabulary and URL shape for the market board — universal module shared
// by the page and the toolbar.

import type { UIKey } from '@/lib/i18n/dict';

export type MarketSort = 'pctDesc' | 'pctAsc' | 'volume' | 'code';

export const MARKET_SORTS: MarketSort[] = ['pctDesc', 'pctAsc', 'volume', 'code'];

export const DEFAULT_MARKET_SORT: MarketSort = 'pctDesc';

export const SORT_LABEL_KEYS: Record<MarketSort, UIKey> = {
  pctDesc: 'sortPctDesc',
  pctAsc: 'sortPctAsc',
  volume: 'sortVolume',
  code: 'sortCode',
};

export function isMarketSort(v: string | undefined): v is MarketSort {
  return !!v && (MARKET_SORTS as string[]).includes(v);
}

/** Canonical board URL — defaults stay out of the query string. */
export function marketHref(query: string, sort: MarketSort): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (sort !== DEFAULT_MARKET_SORT) params.set('sort', sort);
  return params.size ? `/market?${params}` : '/market';
}
