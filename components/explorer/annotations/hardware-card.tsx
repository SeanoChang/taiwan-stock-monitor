'use client';

// Hardware card — part name/blurb + live-supplier-quote chips, anchored to a
// registered part by the depth-gated callout layer (Plan 006 Phase D, Task 3
// building on Task 1's `lib/data/hardware-map.ts` and Task 2's scene
// `projectPart()`). Purely presentational and position-agnostic: it renders
// wherever its parent places it — Task 4's callout layer owns all `el.style.*`
// positioning/opacity from its own rAF loop and never touches this
// component's props per frame, so nothing here needs to be rAF-aware.
//
// Companies come from `companiesForPart()` — category-driven, so every card
// always resolves to real, TW-first, live-quoted companies (see
// scripts/check-hardware.ts). Quotes are passed in rather than fetched here,
// so a parent can share one `useQuotes()` island across every simultaneously
// visible card instead of each card polling `/api/quotes` on its own.
//
// The only React state is the user-triggered 更多/收合 expand toggle — a
// click handler, never written to by any scroll/rAF frame.

import { useState } from 'react';
import Link from 'next/link';
import type { HardwarePart } from '@/lib/data/hardware-map';
import { companiesForPart } from '@/lib/data/hardware-map';
import type { SCCompany } from '@/lib/data/supply-chain/types';
import { l, pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { fmtPct } from '@/lib/format';
import type { ClientQuotesPayload } from '@/lib/quotes-client';
import { normalizeCode, upDownColor } from '@/lib/quotes-client';

const MORE_LABEL = l('More →', '更多 →');
const LESS_LABEL = l('Less ↑', '收合 ↑');

export interface HardwareCardProps {
  part: HardwarePart;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
}

/** One supplier row: name, ticker, and — for TW-listed companies once a
 * quote is available — `NT$close ±%` colored 紅漲綠跌 via `upDownColor`.
 * Blank-graceful: unlisted companies, a missing quote, or an offline
 * `quotes` payload all just omit the price segment rather than erroring.
 * Deep-links to the node's spot in the supply-chain graph (≥44px hit area,
 * matching `node-panel.tsx`'s quote-chip pattern). */
function CompanyChip({
  company,
  quotes,
  locale,
}: {
  company: SCCompany;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
}) {
  const isTW = company.exch === 'TWSE' || company.exch === 'TPEx';
  const quote = isTW ? quotes?.quotes[normalizeCode(company.ticker)] : undefined;
  const name = locale === 'zh' ? (company.zh ?? company.name) : company.name;
  const dot = quote ? upDownColor(quote.change, locale) : 'var(--tertiary)';

  return (
    <li>
      <Link
        href={`/supply-chain?focus=${company.id}`}
        className="ss-hairline bg-secondary hover:border-primary hover:bg-accent flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 transition-colors"
      >
        <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: dot }} />
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{name}</span>
        <span className="text-tertiary shrink-0 font-mono text-[10px]">{company.ticker}</span>
        {quote ? (
          <span className="flex shrink-0 items-baseline gap-1 text-[11px] tabular-nums">
            <span className="font-semibold">NT${quote.close.toLocaleString()}</span>
            <span className="font-semibold" style={{ color: upDownColor(quote.change, locale) }}>
              {fmtPct(quote.changePct)}
            </span>
          </span>
        ) : (
          <span className="text-tertiary shrink-0 text-[10px]">—</span>
        )}
      </Link>
    </li>
  );
}

/**
 * Apple-clean card: part name, one-line blurb, then the top-2
 * `companiesForPart(part)` suppliers as live quote chips. A `更多 →` control
 * (≥44px hit area) expands to the full resolved list — the full list is
 * always non-empty per `check:hardware`'s gate, so it only renders when
 * there's a second page beyond the top-2 already shown.
 */
export function HardwareCard({ part, quotes, locale }: HardwareCardProps) {
  const [expanded, setExpanded] = useState(false);
  const companies = companiesForPart(part);
  const shown = expanded ? companies : companies.slice(0, 2);
  const hasMore = companies.length > 2;

  return (
    <article
      aria-label={pick(part.name, locale)}
      className="ss-veil ss-hairline w-64 max-w-[80vw] rounded-[var(--radius-lg)] border px-3.5 py-3"
    >
      <p className="mb-0.5 text-[13px] leading-snug font-semibold">{pick(part.name, locale)}</p>
      <p className="text-muted-foreground mb-2.5 text-[11px] leading-snug">
        {pick(part.blurb, locale)}
      </p>
      <ul className="flex flex-col gap-1.5">
        {shown.map((c) => (
          <CompanyChip key={c.id} company={c} quotes={quotes} locale={locale} />
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="text-primary mt-1.5 flex min-h-11 w-full items-center text-[11.5px] font-semibold"
        >
          {pick(expanded ? LESS_LABEL : MORE_LABEL, locale)}
        </button>
      )}
    </article>
  );
}
