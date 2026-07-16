import 'server-only';

import { unstable_cache } from 'next/cache';
import { COMPANIES } from '@/lib/data/supply-chain';
import { COMPANIES as EXPLORER_COMPANIES } from '@/lib/data/silicon-stack';

// TWSE / TPEx open-data quote feed, normalized to the tickers this app knows.
// Both endpoints publish the latest trading session for every listed security;
// we cache for five minutes and degrade gracefully when unreachable.

const TWSE_URL = 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL';
const TPEX_URL = 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes';
export const QUOTES_REVALIDATE_SECONDS = 300;

export interface Quote {
  code: string;
  name: string; // exchange-registered zh name
  close: number;
  change: number;
  changePct: number;
  volume: number; // board lots (張)
  date: string; // YYYY/MM/DD
  market: 'TWSE' | 'TPEx';
}

export interface QuotesPayload {
  ok: boolean;
  updated: string | null;
  quotes: Record<string, Quote>;
}

export { normalizeCode } from '@/lib/format';
import { normalizeCode } from '@/lib/format';

function watchedCodes(): Set<string> {
  const codes = new Set<string>();
  for (const c of COMPANIES) {
    if (c.exch === 'TWSE' || c.exch === 'TPEx') codes.add(normalizeCode(c.ticker));
  }
  for (const c of Object.values(EXPLORER_COMPANIES)) {
    if (c.exch === 'TWSE' || c.exch === 'TPEx') codes.add(normalizeCode(c.ticker));
  }
  return codes;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

/** ROC calendar '1150715' → '2026/07/15' */
function rocToIso(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!/^\d{7}$/.test(s)) return s;
  const year = parseInt(s.slice(0, 3), 10) + 1911;
  return `${year}/${s.slice(3, 5)}/${s.slice(5, 7)}`;
}

function changePct(close: number, change: number): number {
  const prev = close - change;
  return prev > 0 ? (change / prev) * 100 : 0;
}

interface TwseRow {
  Date?: string;
  Code?: string;
  Name?: string;
  ClosingPrice?: string;
  Change?: string;
  TradeVolume?: string;
}
interface TpexRow {
  Date?: string;
  SecuritiesCompanyCode?: string;
  CompanyName?: string;
  Close?: string;
  Change?: string;
  TradingShares?: string;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    // Raw feeds exceed Next's 2 MB data-cache limit; we cache the small
    // normalized payload below instead (unstable_cache) and skip fetch caching.
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function computeQuotes(): Promise<QuotesPayload> {
  const watched = watchedCodes();
  const [twse, tpex] = await Promise.all([
    fetchJson<TwseRow[]>(TWSE_URL),
    fetchJson<TpexRow[]>(TPEX_URL),
  ]);

  const quotes: Record<string, Quote> = {};
  let updated: string | null = null;

  for (const row of twse ?? []) {
    const code = String(row.Code ?? '').trim();
    if (!watched.has(code)) continue;
    const close = num(row.ClosingPrice);
    const change = num(row.Change) ?? 0;
    if (close === null) continue;
    const date = rocToIso(row.Date);
    updated = updated ?? date;
    quotes[code] = {
      code,
      name: String(row.Name ?? '').trim(),
      close,
      change,
      changePct: changePct(close, change),
      volume: Math.round((num(row.TradeVolume) ?? 0) / 1000),
      date,
      market: 'TWSE',
    };
  }

  for (const row of tpex ?? []) {
    const code = String(row.SecuritiesCompanyCode ?? '').trim();
    if (!watched.has(code)) continue;
    const close = num(row.Close);
    const change = num(row.Change) ?? 0;
    if (close === null) continue;
    const date = rocToIso(row.Date);
    updated = updated ?? date;
    quotes[code] = {
      code,
      name: String(row.CompanyName ?? '').trim(),
      close,
      change,
      changePct: changePct(close, change),
      volume: Math.round((num(row.TradingShares) ?? 0) / 1000),
      date,
      market: 'TPEx',
    };
  }

  return { ok: Object.keys(quotes).length > 0, updated, quotes };
}

/**
 * Latest session for every watched ticker, normalized and cached for five
 * minutes. The cached value is the ~200-entry payload, not the raw feeds.
 */
export const getQuotes = unstable_cache(computeQuotes, ['quotes-v1'], {
  revalidate: QUOTES_REVALIDATE_SECONDS,
});
