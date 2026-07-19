import type { Metadata } from 'next';
import { GROUP_LABELS } from '@/components/graph/graph-model';
import { SupplyChainGraph } from '@/components/graph/supply-chain-graph';
import { Brand } from '@/components/site/brand';
import { LocaleToggle } from '@/components/site/locale-toggle';
import { NavLinks } from '@/components/site/nav-links';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, COMPANY_MAP, TOTAL_COUNT, TW_COUNT } from '@/lib/data/supply-chain';
import { getLocale } from '@/lib/i18n/server';
import { t } from '@/lib/i18n/dict';

export const metadata: Metadata = {
  title: '台灣 AI 供應鏈網絡圖',
  description:
    "台股 AI 供應鏈完整網絡圖：材料、EUV 零組件、晶圓、代工、封測、電路板、散熱、電源、伺服器與雲端 — 支援一度／二度關聯追蹤與即時行情。Force-directed network graph of Taiwan's AI supply chain with live quotes.",
};

interface PageProps {
  searchParams: Promise<{ focus?: string; group?: string }>;
}

export default async function SupplyChainPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const { focus, group } = await searchParams;
  const validFocus = focus && COMPANY_MAP[focus] ? focus : undefined;
  // deep link: /supply-chain?group=<GROUP_LABELS index> — the explorer's
  // <TierRibbon> tile clicks (Plan 006 Phase E, Task 4) route here; validate
  // against GROUP_LABELS' own length rather than trusting the raw string,
  // the same defensive pattern `validFocus` above already uses for `focus`.
  const groupNum = group === undefined ? NaN : Number(group);
  const validGroupFilter =
    Number.isInteger(groupNum) && groupNum >= 0 && groupNum < GROUP_LABELS.length
      ? groupNum
      : undefined;
  return (
    <SupplyChainGraph
      locale={locale}
      focus={validFocus}
      initialGroupFilter={validGroupFilter}
      brand={
        <>
          <div className="pointer-events-auto flex items-center gap-3">
            <Brand locale={locale} />
            <Badge
              variant="outline"
              className="border-primary/40 text-primary rounded-[var(--radius-pill)] text-xs font-semibold"
            >
              {t('graphTitle', locale)}
            </Badge>
          </div>
          <p className="text-muted-foreground text-[11px]">
            {TW_COUNT} {t('graphCounts', locale)} · {TOTAL_COUNT} {t('nodes', locale)} ·{' '}
            {CATEGORIES.length} {t('segments', locale)}
          </p>
        </>
      }
      tools={
        <div className="pointer-events-auto ml-auto flex items-center gap-2">
          <LocaleToggle locale={locale} />
          <NavLinks locale={locale} current="/supply-chain" />
          <Badge
            variant="outline"
            className="border-border text-tertiary rounded-[var(--radius-pill)] px-2.5 py-1 text-[10px] font-normal"
          >
            {t('notAdvice', locale)}
          </Badge>
        </div>
      }
      hint={
        <p className="text-tertiary pointer-events-none absolute bottom-5 left-6 z-10 max-w-[520px] text-[11.5px] leading-relaxed">
          {t('graphHint', locale)}
        </p>
      }
    />
  );
}
