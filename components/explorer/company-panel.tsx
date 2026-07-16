'use client';

// Company detail panel for the 3D explorer. Prices are live for TW-listed
// tickers (TWSE/TPEx open data); everything else is the curated snapshot.

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COMPANIES } from '@/lib/data/silicon-stack';
import { pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';
import { fmtChange, normalizeCode, upDownColor, useQuotes } from '@/lib/quotes-client';

interface CompanyPanelProps {
  companyId: string;
  role: LStr | null;
  locale: Locale;
  onSelect: (id: string, role: LStr | null) => void;
  onClose: () => void;
}

/** deterministic decorative sparkline, seeded by ticker */
function sparkline(ticker: string, up: boolean) {
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) seed = (seed * 31 + ticker.charCodeAt(i)) % 9973;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const n = 36, pts: number[] = [];
  let v = 32;
  const drift = up ? -0.42 : 0.42;
  for (let i = 0; i < n; i++) { v += (rnd() - 0.5) * 7 + drift; v = Math.max(6, Math.min(58, v)); pts.push(v); }
  const step = 300 / (n - 1);
  const line = pts.map((p, i) => `${(i * step).toFixed(1)},${p.toFixed(1)}`).join(' ');
  return { line, area: `M0,64 L${line.split(' ').join(' L')} L300,64 Z` };
}

export function CompanyPanel({ companyId, role, locale, onSelect, onClose }: CompanyPanelProps) {
  const company = COMPANIES[companyId];
  const quotes = useQuotes();

  const isTW = company && (company.exch === 'TWSE' || company.exch === 'TPEx');
  const quote = isTW ? quotes?.quotes[normalizeCode(company.ticker)] : undefined;
  const priceText = quote ? `NT$${quote.close.toLocaleString()}` : company?.priceText;
  const change = quote ? quote.change : company?.chg ?? 0;
  const changeText = quote
    ? fmtChange(quote.change, quote.changePct)
    : `${(company?.chg ?? 0) > 0 ? '+' : ''}${(company?.chg ?? 0).toFixed(1)}%`;
  const upDown = upDownColor(change, locale);
  const spark = useMemo(
    () => (company && !company.private ? sparkline(company.ticker, change >= 0) : null),
    [company, change],
  );

  if (!company) return null;

  return (
    <aside className="ss-panel absolute inset-y-0 right-0 z-20 flex w-[390px] max-w-[92vw] flex-col border-l bg-card/90 backdrop-blur-xl">
      <Button
        variant="outline"
        size="icon"
        onClick={onClose}
        title={t('close', locale)}
        className="absolute right-4 top-4 z-10 size-8 rounded-full bg-secondary text-foreground/80"
      >
        ✕
      </Button>

      <div className="ss-scroll flex-1 overflow-y-auto px-7 pb-5 pt-8">
        <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">
          {pick(role ?? company.role, locale)}
        </p>
        <h2 className="mb-2.5 pr-8 text-2xl font-semibold leading-tight tracking-tight">{company.name}</h2>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Badge className="rounded-md bg-primary font-mono text-xs font-semibold text-primary-foreground">
            {company.ticker}
          </Badge>
          <span className="text-xs text-foreground/55">
            {company.exch} · {pick(company.country, locale)}
            {quote && <span className="ml-1.5 text-primary">· {t('live', locale)}</span>}
          </span>
        </div>

        {!company.private && (
          <>
            <div className="mb-1.5 flex items-baseline gap-3">
              <span className="text-[32px] font-light tracking-tight">{priceText}</span>
              <span className="text-[13px] font-semibold" style={{ color: upDown }}>{changeText}</span>
            </div>
            {spark && (
              <svg viewBox="0 0 300 64" className="mb-4 block h-16 w-full" aria-hidden>
                <path d={spark.area} fill={upDown} opacity={0.12} stroke="none" />
                <polyline points={spark.line} fill="none" stroke={upDown} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            )}
          </>
        )}
        {company.private && company.note && (
          <p className="mb-4 rounded-[10px] border bg-secondary px-3.5 py-3 text-[13px] text-foreground/75">
            {pick(company.note, locale)}
          </p>
        )}

        <div className="mb-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-[10px] bg-muted px-3.5 py-3">
            <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-foreground/45">{t('marketCap', locale)}</p>
            <p className="text-[15px] font-semibold">{company.mcapText}</p>
          </div>
          <div className="rounded-[10px] bg-muted px-3.5 py-3">
            <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-foreground/45">{t('position', locale)}</p>
            <p className="text-[12.5px] font-semibold leading-snug">{pick(company.share, locale)}</p>
          </div>
        </div>

        <p className="mb-6 text-[13.5px] leading-relaxed text-foreground/80">{pick(company.desc, locale)}</p>

        <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-foreground/45">
          {t('supplyChainSec', locale)}
        </p>
        <ul className="flex flex-col gap-2">
          {company.links.map(link => (
            <li key={link.to + link.label.en}>
              <button
                onClick={() => onSelect(link.to, COMPANIES[link.to].role)}
                className="flex w-full items-baseline gap-2 rounded-[10px] border bg-secondary px-3.5 py-2.5 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="whitespace-nowrap text-[13px] font-semibold">{COMPANIES[link.to].short}</span>
                <span className="text-[11.5px] text-foreground/55">{pick(link.label, locale)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <footer className="border-t px-7 py-3.5 text-[10.5px] leading-normal text-foreground/40">
        {t('panelDisclaimer', locale)}
      </footer>
    </aside>
  );
}
