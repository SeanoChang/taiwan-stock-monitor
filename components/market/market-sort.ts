// Sort vocabulary for the market board — universal module shared by the
// server page and the client toolbar.

export type MarketSort = 'pctDesc' | 'pctAsc' | 'volume' | 'code';

export const MARKET_SORTS: MarketSort[] = ['pctDesc', 'pctAsc', 'volume', 'code'];

export function isMarketSort(v: string | undefined): v is MarketSort {
  return !!v && (MARKET_SORTS as string[]).includes(v);
}
