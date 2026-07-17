import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Brand } from '@/components/site/brand';
import { LocaleToggle } from '@/components/site/locale-toggle';
import { NavLinks } from '@/components/site/nav-links';
import { MarketToolbar } from '@/components/market/market-toolbar';
import { DEFAULT_MARKET_SORT, isMarketSort } from '@/components/market/market-sort';
import type { MarketSort } from '@/components/market/market-sort';
import { buildMarketBoard } from '@/components/market/market-rows';
import { QuoteTable } from '@/components/market/quote-table';
import { upDownColor } from '@/lib/format';
import { getLocale } from '@/lib/i18n/server';
import { t } from '@/lib/i18n/dict';
import { getQuotes } from '@/lib/server/quotes';

export const metadata: Metadata = {
  title: '市場行情 Market Board',
  description:
    '台股 AI 供應鏈 200+ 家公司每日行情：收盤、漲跌、成交量，依供應鏈節點導覽。Daily TWSE/TPEx quotes for 200+ Taiwan AI supply-chain companies.',
};

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
      <header className="ss-veil sticky top-0 z-30 border-b px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <Brand locale={locale} />
          <Badge
            variant="outline"
            className="border-primary/40 text-primary rounded-full text-xs font-semibold"
          >
            {t('marketTitle', locale)}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <LocaleToggle locale={locale} />
            <NavLinks locale={locale} current="/market" />
          </div>
        </div>
        <p className="text-foreground/50 mx-auto mt-1.5 max-w-6xl text-[11.5px]">
          {t('marketSub', locale)}
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-6 pb-16">
        <section aria-label="summary" className="mb-5 flex flex-wrap items-center gap-2.5">
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
              className="border-border text-foreground/55 rounded-full px-3 py-1 text-[11px] font-normal"
            >
              {t('updatedAt', locale)} {payload.updated}
            </Badge>
          )}
          {!payload.ok && (
            <Badge
              variant="outline"
              className="border-destructive/50 text-destructive rounded-full px-3 py-1 text-[11px] font-normal"
            >
              {t('offline', locale)}
            </Badge>
          )}
          <span className="text-foreground/40 ml-auto text-[10.5px]">{t('source', locale)}</span>
        </section>

        <section aria-label="controls" className="mb-4">
          <MarketToolbar locale={locale} query={query} sort={sort} />
        </section>

        <section aria-label="quotes" className="bg-card/50 overflow-x-auto rounded-xl border">
          <QuoteTable rows={rows} locale={locale} />
        </section>

        <p className="text-foreground/40 mt-4 text-[10.5px] leading-relaxed">
          {t('graphDisclaimer', locale)}
        </p>
      </main>
    </div>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-secondary flex items-baseline gap-2 rounded-full border px-3.5 py-1.5">
      <span className="text-foreground/55 text-[11px]">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
