import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Brand } from '@/components/site/brand';
import { LocaleToggle } from '@/components/site/locale-toggle';
import { NavLinks } from '@/components/site/nav-links';
import { SiteHeader } from '@/components/site/site-header';
import { Reveal } from '@/components/site/reveal';
import { MarketToolbar } from '@/components/market/market-toolbar';
import { DEFAULT_MARKET_SORT, isMarketSort } from '@/components/market/market-sort';
import type { MarketSort } from '@/components/market/market-sort';
import { buildMarketBoard } from '@/components/market/market-rows';
import { QuoteTable } from '@/components/market/quote-table';
import { upDownColor } from '@/lib/format';
import { getLocale } from '@/lib/i18n/server';
import { t } from '@/lib/i18n/dict';
import { l, pick } from '@/lib/i18n/config';
import { getQuotes } from '@/lib/server/quotes';

export const metadata: Metadata = {
  title: '市場行情 Market Board',
  description:
    '台股 AI 供應鏈 200+ 家公司每日行情：收盤、漲跌、成交量，依供應鏈節點導覽。Daily TWSE/TPEx quotes for 200+ Taiwan AI supply-chain companies.',
};

// Chapter-opener headline (design-restyle-market-and-graph.md §/market) — page-local
// bilingual copy, kept next to its one call site rather than the shared UI dict.
const MARKET_HEADLINE = l("Taiwan's AI supply chain, priced daily", '台股 AI 供應鏈，每天的價格');

interface PageProps {
  searchParams: Promise<{ q?: string; sort?: string }>;
}

export default async function MarketPage({ searchParams }: PageProps) {
  const [locale, params, payload] = await Promise.all([getLocale(), searchParams, getQuotes()]);
  const query = (params.q ?? '').trim();
  const sort: MarketSort = isMarketSort(params.sort) ? params.sort : DEFAULT_MARKET_SORT;
  const { rows, advancers, decliners, unchanged } = buildMarketBoard(payload, query, sort);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteHeader
        brand={<Brand locale={locale} />}
        tools={
          <>
            <LocaleToggle locale={locale} />
            <NavLinks locale={locale} current="/market" />
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <Reveal as="section">
          <p className="text-eyebrow">{t('marketTitle', locale)}</p>
          <h1 className="text-headline mt-2">{pick(MARKET_HEADLINE, locale)}</h1>
          <p className="text-body text-muted-foreground mt-3 max-w-2xl">{t('marketSub', locale)}</p>
        </Reveal>

        <section aria-label="summary" className="mt-9 mb-5 flex flex-wrap items-center gap-2.5">
          <SummaryChip
            label={t('advancers', locale)}
            value={advancers}
            color={upDownColor(1, locale)}
          />
          <SummaryChip
            label={t('decliners', locale)}
            value={decliners}
            color={upDownColor(-1, locale)}
          />
          <SummaryChip label={t('unchanged', locale)} value={unchanged} />
          {payload.updated && (
            <Badge
              variant="outline"
              className="border-border text-muted-foreground rounded-[var(--radius-pill)] px-3 py-1 text-[11px] font-normal"
            >
              {t('updatedAt', locale)} {payload.updated}
            </Badge>
          )}
          {!payload.ok && (
            <Badge
              variant="outline"
              className="border-destructive/50 text-destructive rounded-[var(--radius-pill)] px-3 py-1 text-[11px] font-normal"
            >
              {t('offline', locale)}
            </Badge>
          )}
          <span className="text-tertiary ml-auto text-[10.5px]">{t('source', locale)}</span>
        </section>

        <section aria-label="controls" className="mb-4">
          <MarketToolbar locale={locale} query={query} sort={sort} />
        </section>

        <section
          aria-label="quotes"
          className="bg-card ss-hairline overflow-x-auto rounded-[var(--radius-lg)] border"
        >
          <QuoteTable rows={rows} locale={locale} />
        </section>

        <p className="text-tertiary mt-4 text-[10.5px] leading-relaxed">
          {t('graphDisclaimer', locale)}
        </p>
      </main>
    </div>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-secondary ss-hairline flex items-baseline gap-2 rounded-[var(--radius-pill)] border px-3.5 py-1.5">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
