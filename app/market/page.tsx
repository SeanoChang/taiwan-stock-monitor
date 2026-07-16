import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/site/brand";
import { LocaleToggle } from "@/components/site/locale-toggle";
import { NavLinks } from "@/components/site/nav-links";
import { MarketToolbar } from "@/components/market/market-toolbar";
import { isMarketSort } from "@/components/market/market-sort";
import type { MarketSort } from "@/components/market/market-sort";
import { QuoteTable } from "@/components/market/quote-table";
import type { MarketRow } from "@/components/market/quote-table";
import { CATEGORY_MAP, COMPANIES } from "@/lib/data/supply-chain";
import { normalizeCode, upDownColor } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dict";
import { getQuotes } from "@/lib/server/quotes";

export const metadata: Metadata = {
  title: "市場行情 Market Board",
  description:
    "台股 AI 供應鏈 200+ 家公司每日行情：收盤、漲跌、成交量，依供應鏈節點導覽。Daily TWSE/TPEx quotes for 200+ Taiwan AI supply-chain companies.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; sort?: string }>;
}

export default async function MarketPage({ searchParams }: PageProps) {
  const [locale, params, payload] = await Promise.all([getLocale(), searchParams, getQuotes()]);
  const query = (params.q ?? "").trim();
  const sort: MarketSort = isMarketSort(params.sort) ? params.sort : "pctDesc";

  const zhq = query;
  const q = query.toLowerCase();
  const rows: MarketRow[] = COMPANIES
    .filter(c => c.exch === "TWSE" || c.exch === "TPEx")
    .filter(c => {
      if (!q) return true;
      const cat = CATEGORY_MAP[c.cat];
      return (
        c.name.toLowerCase().includes(q) || (c.zh ?? "").includes(zhq) ||
        c.ticker.includes(q) ||
        cat.name.toLowerCase().includes(q) || cat.zh.includes(zhq)
      );
    })
    .map(c => ({ company: c, quote: payload.quotes[normalizeCode(c.ticker)] ?? null }));

  rows.sort((a, b) => {
    switch (sort) {
      case "pctDesc": return (b.quote?.changePct ?? -Infinity) - (a.quote?.changePct ?? -Infinity);
      case "pctAsc": return (a.quote?.changePct ?? Infinity) - (b.quote?.changePct ?? Infinity);
      case "volume": return (b.quote?.volume ?? -1) - (a.quote?.volume ?? -1);
      case "code": return a.company.ticker.localeCompare(b.company.ticker);
    }
  });

  const quoted = rows.filter(r => r.quote);
  const advancers = quoted.filter(r => r.quote!.change > 0).length;
  const decliners = quoted.filter(r => r.quote!.change < 0).length;
  const unchanged = quoted.length - advancers - decliners;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="ss-veil sticky top-0 z-30 border-b px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <Brand locale={locale} />
          <Badge variant="outline" className="rounded-full border-primary/40 text-xs font-semibold text-primary">
            {t("marketTitle", locale)}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <LocaleToggle locale={locale} />
            <NavLinks locale={locale} current="/market" />
          </div>
        </div>
        <p className="mx-auto mt-1.5 max-w-6xl text-[11.5px] text-foreground/50">{t("marketSub", locale)}</p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-6">
        <section aria-label="summary" className="mb-5 flex flex-wrap items-center gap-2.5">
          <SummaryChip label={t("advancers", locale)} value={advancers} color={upDownColor(1, locale)} />
          <SummaryChip label={t("decliners", locale)} value={decliners} color={upDownColor(-1, locale)} />
          <SummaryChip label={t("unchanged", locale)} value={unchanged} />
          {payload.updated && (
            <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-[11px] font-normal text-foreground/55">
              {t("updatedAt", locale)} {payload.updated}
            </Badge>
          )}
          {!payload.ok && (
            <Badge variant="outline" className="rounded-full border-destructive/50 px-3 py-1 text-[11px] font-normal text-destructive">
              {t("offline", locale)}
            </Badge>
          )}
          <span className="ml-auto text-[10.5px] text-foreground/40">{t("source", locale)}</span>
        </section>

        <section aria-label="controls" className="mb-4">
          <MarketToolbar locale={locale} initialQuery={query} initialSort={sort} />
        </section>

        <section aria-label="quotes" className="overflow-x-auto rounded-xl border bg-card/50">
          <QuoteTable rows={rows} locale={locale} />
        </section>

        <p className="mt-4 text-[10.5px] leading-relaxed text-foreground/40">{t("graphDisclaimer", locale)}</p>
      </main>
    </div>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-baseline gap-2 rounded-full border bg-secondary px-3.5 py-1.5">
      <span className="text-[11px] text-foreground/55">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}
