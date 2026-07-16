'use client';

// Interactive island for /supply-chain: force-directed network of the whole
// Taiwan × AI chain. Header, legend filter, search, canvas engine and the
// node detail panel.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brand } from '@/components/site/brand';
import { LocaleToggle } from '@/components/site/locale-toggle';
import { NavLinks } from '@/components/site/nav-links';
import { GROUP_LABELS, PALETTE, searchIds } from '@/components/graph/graph-model';
import { NodePanel } from '@/components/graph/node-panel';
import { useForceGraph } from '@/components/graph/use-force-graph';
import { CATEGORIES, TOTAL_COUNT, TW_COUNT } from '@/lib/data/supply-chain';
import { pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';
import { cn } from '@/lib/utils';

export function SupplyChainGraph({ locale, focus }: { locale: Locale; focus?: string }) {
  const [selection, setSelection] = useState<string | null>(focus ?? null);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<number | null>(null);

  const matches = useMemo(() => (query.trim() ? searchIds(query) : null), [query]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graph = useForceGraph(canvasRef, locale, { selection, matches, groupFilter }, (id) => {
    setSelection(id);
    setQuery('');
  });

  // deep link: /supply-chain?focus=<companyId>
  useEffect(() => {
    if (focus) graph.centerOn(focus);
    // centerOn is stable per model; run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const navigate = (id: string) => {
    setSelection(id);
    graph.centerOn(id);
  };
  const clearAll = () => {
    setSelection(null);
    setQuery('');
    setGroupFilter(null);
  };

  return (
    <div className="bg-background text-foreground fixed inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 size-full cursor-grab" />

      {/* header overlay */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-6 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="pointer-events-auto flex items-center gap-3">
            <Brand locale={locale} />
            <Badge
              variant="outline"
              className="border-primary/40 text-primary rounded-full text-xs font-semibold"
            >
              {t('graphTitle', locale)}
            </Badge>
          </div>
          <p className="text-foreground/55 text-[11px]">
            {TW_COUNT} {t('graphCounts', locale)} · {TOTAL_COUNT} {t('nodes', locale)} ·{' '}
            {CATEGORIES.length} {t('segments', locale)}
          </p>
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelection(null);
              setGroupFilter(null);
            }}
            placeholder={t('searchPlaceholder', locale)}
            className="ss-veil pointer-events-auto h-9 max-w-[300px] flex-[1_1_200px] rounded-full px-4 text-xs"
          />
          {matches && (
            <span className="text-primary text-[11.5px]">
              {matches.size} {t('matches', locale)}
            </span>
          )}
          <div className="pointer-events-auto ml-auto flex items-center gap-2">
            <LocaleToggle locale={locale} />
            <NavLinks locale={locale} current="/supply-chain" />
            <Badge
              variant="outline"
              className="border-border text-foreground/45 rounded-full px-2.5 py-1 text-[10px] font-normal"
            >
              {t('notAdvice', locale)}
            </Badge>
          </div>
        </div>

        {/* legend / stage filter */}
        <div className="pointer-events-auto mt-3 flex flex-wrap items-center gap-1.5">
          {GROUP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => {
                setGroupFilter(groupFilter === i ? null : i);
                setSelection(null);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
                groupFilter === i
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-secondary text-foreground/70 hover:text-foreground',
              )}
            >
              <span
                className="size-[9px] flex-none rounded-full"
                style={{ background: PALETTE[i] }}
              />
              {pick(label, locale)}
            </button>
          ))}
          {(groupFilter !== null || selection || query) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="border-primary/40 bg-secondary text-primary h-7 rounded-full px-2.5 text-[11.5px] font-semibold"
            >
              ✕ {t('clearFilter', locale)}
            </Button>
          )}
        </div>
      </header>

      <p className="text-foreground/45 pointer-events-none absolute bottom-5 left-6 z-10 max-w-[520px] text-[11.5px] leading-relaxed">
        {t('graphHint', locale)}
      </p>

      {selection && (
        <NodePanel
          nodeId={selection}
          locale={locale}
          onNavigate={navigate}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
