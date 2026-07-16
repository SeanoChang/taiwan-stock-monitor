// Universal formatting helpers (server & client safe).

import type { Locale } from '@/lib/i18n/config';

/** '2330.TW' / '5274.TWO' / '2330' → '2330' */
export function normalizeCode(ticker: string): string {
  return ticker.replace(/\.(TWO|TW)$/i, '').trim();
}

/**
 * Up/down ink: Taiwan market convention in zh (紅漲綠跌),
 * western convention in en (green up / red down).
 */
export function upDownColor(chg: number, locale: Locale): string {
  if (!chg) return 'rgba(238,244,251,0.55)';
  const red = '#ff8585';
  const green = '#5ad19a';
  return chg > 0 === (locale === 'zh') ? red : green;
}

export function fmtChange(chg: number, pct: number): string {
  const sign = chg > 0 ? '+' : '';
  return `${sign}${chg.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

export function fmtPct(pct: number): string {
  return `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

export function fmtSigned(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
}
