'use client';

// Detail panel for graph nodes (company or category hub), with live quotes
// for TW-listed tickers and chain-walking navigation.

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PALETTE, STAGE_GROUP, isHubId } from '@/components/graph/graph-model';
import { CATEGORY_MAP, COMPANIES, COMPANY_MAP, STAGES, inboundRels } from '@/lib/data/supply-chain';
import { pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';
import { fmtChange, normalizeCode, upDownColor, useQuotes } from '@/lib/quotes-client';

interface NodePanelProps {
  nodeId: string;
  locale: Locale;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

function RelRow({
  name,
  label,
  locale,
  onClick,
}: {
  name: string;
  label: LStr;
  locale: Locale;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="bg-secondary hover:border-primary hover:bg-accent flex w-full items-baseline gap-2 rounded-[10px] border px-3 py-2.5 text-left transition-colors"
      >
        <span className="text-[12.5px] font-semibold whitespace-nowrap">{name}</span>
        <span className="text-foreground/55 text-[11px]">{pick(label, locale)}</span>
      </button>
    </li>
  );
}

export function NodePanel({ nodeId, locale, onNavigate, onClose }: NodePanelProps) {
  const quotes = useQuotes();
  const company = !isHubId(nodeId) ? COMPANY_MAP[nodeId] : null;
  const category = isHubId(nodeId) ? CATEGORY_MAP[nodeId.slice(4)] : null;
  if (!company && !category) return null;

  const displayName = (id: string) =>
    locale === 'zh'
      ? (COMPANY_MAP[id]?.zh ?? COMPANY_MAP[id]?.name ?? id)
      : (COMPANY_MAP[id]?.name ?? id);

  return (
    <aside className="ss-panel ss-scroll bg-card/90 absolute inset-y-0 right-0 z-20 w-[372px] max-w-[92vw] overflow-y-auto border-l px-6 py-6 backdrop-blur-xl">
      <Button
        variant="outline"
        size="icon"
        onClick={onClose}
        title={t('close', locale)}
        className="bg-secondary text-foreground/80 absolute top-3.5 right-3.5 z-10 size-8 rounded-full"
      >
        ✕
      </Button>

      {company &&
        (() => {
          const cat = CATEGORY_MAP[company.cat];
          const quote =
            company.exch === 'TWSE' || company.exch === 'TPEx'
              ? quotes?.quotes[normalizeCode(company.ticker)]
              : undefined;
          return (
            <>
              <p
                className="mb-2 text-[10.5px] font-bold tracking-[0.16em] uppercase"
                style={{ color: PALETTE[STAGE_GROUP[cat.stage]] }}
              >
                {locale === 'zh' ? cat.zh : cat.name}
              </p>
              <h2 className="mb-1 pr-7 text-[21px] leading-snug font-semibold">
                {locale === 'zh'
                  ? company.zh
                    ? `${company.zh} ${company.name}`
                    : company.name
                  : `${company.name}${company.zh ? ` ${company.zh}` : ''}`}
              </h2>
              <div className="mt-2.5 mb-4 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground rounded-md font-mono text-xs font-semibold">
                  {company.ticker}
                </Badge>
                <span className="text-foreground/60 text-xs">
                  {company.exch === 'TWSE'
                    ? `TWSE ${t('listedTWSE', locale)}`
                    : company.exch === 'TPEx'
                      ? `TPEx ${t('listedTPEx', locale)}`
                      : company.exch}
                </span>
              </div>

              {quote && (
                <div className="bg-secondary mb-4 flex items-baseline gap-3 rounded-[10px] border px-3.5 py-3">
                  <span className="text-2xl font-light tracking-tight">
                    NT${quote.close.toLocaleString()}
                  </span>
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: upDownColor(quote.change, locale) }}
                  >
                    {fmtChange(quote.change, quote.changePct)}
                  </span>
                  <span className="text-foreground/45 ml-auto text-[10px]">{quote.date}</span>
                </div>
              )}

              <p className="text-foreground/80 mb-4 text-[13px] leading-relaxed">
                {pick(company.role, locale)}
              </p>
              <p className="bg-muted text-foreground/50 mb-5 rounded-[10px] border px-3 py-2.5 text-[11px] leading-relaxed">
                {pick(cat.desc, locale)}
              </p>

              {(company.rel ?? []).length > 0 && (
                <>
                  <p className="text-foreground/45 mb-2 text-[10.5px] font-bold tracking-[0.16em] uppercase">
                    {t('linkedTo', locale)}
                  </p>
                  <ul className="mb-5 flex flex-col gap-1.5">
                    {(company.rel ?? []).map((r) => (
                      <RelRow
                        key={r.to + r.label.en}
                        name={displayName(r.to)}
                        label={r.label}
                        locale={locale}
                        onClick={() => onNavigate(r.to)}
                      />
                    ))}
                  </ul>
                </>
              )}
              {inboundRels(company.id).length > 0 && (
                <>
                  <p className="text-foreground/45 mb-2 text-[10.5px] font-bold tracking-[0.16em] uppercase">
                    {t('referencedBy', locale)}
                  </p>
                  <ul className="mb-5 flex flex-col gap-1.5">
                    {inboundRels(company.id).map((r) => (
                      <RelRow
                        key={r.from + r.label.en}
                        name={displayName(r.from)}
                        label={r.label}
                        locale={locale}
                        onClick={() => onNavigate(r.from)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          );
        })()}

      {category && (
        <>
          <p
            className="mb-2 text-[10.5px] font-bold tracking-[0.16em] uppercase"
            style={{ color: PALETTE[STAGE_GROUP[category.stage]] }}
          >
            {(() => {
              const st = STAGES.find((s) => s.id === category.stage);
              return st ? (locale === 'zh' ? st.zh : st.name) : '';
            })()}
          </p>
          <h2 className="mb-2.5 pr-7 text-[21px] leading-snug font-semibold">
            {locale === 'zh' ? category.zh : category.name}
          </h2>
          <p className="text-foreground/80 mb-5 text-[13px] leading-relaxed">
            {pick(category.desc, locale)}
          </p>
          <p className="text-foreground/45 mb-2 text-[10.5px] font-bold tracking-[0.16em] uppercase">
            {t('members', locale)}
          </p>
          <ul className="mb-5 flex flex-col gap-1.5">
            {COMPANIES.filter((c) => c.cat === category.id).map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onNavigate(c.id)}
                  className="bg-secondary hover:border-primary hover:bg-accent flex w-full items-baseline gap-2 rounded-[10px] border px-3 py-2.5 text-left transition-colors"
                >
                  <span className="text-[12.5px] font-semibold whitespace-nowrap">
                    {locale === 'zh' ? (c.zh ?? c.name) : c.name}
                  </span>
                  <span
                    className={`font-mono text-[10.5px] ${c.exch === 'TWSE' || c.exch === 'TPEx' ? 'text-primary' : 'text-foreground/45'}`}
                  >
                    {c.ticker}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className="text-foreground/40 border-t pt-3 text-[10px] leading-normal">
        {t('graphDisclaimer', locale)}
      </footer>
    </aside>
  );
}
