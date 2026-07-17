'use client';

// Interactive island for /supply-chain: search, legend filter, layout toggle,
// the canvas engine and the node detail panel. The static chrome (brand, counts,
// nav, disclaimer, hint) is server-rendered and handed in as slots.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GROUP_LABELS, PALETTE, searchIds } from '@/components/graph/graph-model';
import { NodePanel } from '@/components/graph/node-panel';
import { useForceGraph } from '@/components/graph/use-force-graph';
import type { LayoutMode } from '@/components/graph/use-force-graph';
import { l, pick } from '@/lib/i18n/config';
import type { LStr, Locale } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';
import { cn } from '@/lib/utils';

const LAYOUT_KEY = 'supply-chain:layout';
const LAYOUT_MODES: LayoutMode[] = ['free', 'chain'];
// candidates for lib/i18n/dict.ts once that file is free to edit
const LAYOUT_GROUP: LStr = l('Layout', '版面');
const LAYOUT_LABELS: Record<LayoutMode, LStr> = {
  free: l('Constellation', '星圖'),
  chain: l('Chain', '鏈狀'),
};

/** the persisted layout choice, read as an external store so the server render
 *  can fall back to 'free' without a hydration mismatch */
const layoutStore = (() => {
  const listeners = new Set<() => void>();
  let cache: LayoutMode | null = null;
  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    get(): LayoutMode {
      if (cache === null) {
        const saved = window.localStorage.getItem(LAYOUT_KEY);
        cache = saved === 'free' || saved === 'chain' ? saved : 'free';
      }
      return cache;
    },
    getServer: (): LayoutMode => 'free',
    set(mode: LayoutMode) {
      cache = mode;
      window.localStorage.setItem(LAYOUT_KEY, mode);
      for (const cb of listeners) cb();
    },
  };
})();

interface SupplyChainGraphProps {
  locale: Locale;
  focus?: string;
  /** server-rendered: brand lockup, title badge and the node counts */
  brand: ReactNode;
  /** server-rendered: locale toggle, nav and the disclaimer badge */
  tools: ReactNode;
  /** server-rendered: the usage hint pinned bottom-left */
  hint: ReactNode;
}

export function SupplyChainGraph({ locale, focus, brand, tools, hint }: SupplyChainGraphProps) {
  const [selection, setSelection] = useState<string | null>(focus ?? null);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<number | null>(null);
  const layout = useSyncExternalStore(
    layoutStore.subscribe,
    layoutStore.get,
    layoutStore.getServer,
  );

  const matches = useMemo(() => (query.trim() ? searchIds(query) : null), [query]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graph = useForceGraph(
    canvasRef,
    locale,
    { selection, matches, groupFilter, layout },
    (id) => {
      setSelection(id);
      setQuery('');
    },
  );

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
          {brand}
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
          {tools}
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
          <div
            role="group"
            aria-label={pick(LAYOUT_GROUP, locale)}
            className="border-border bg-secondary ml-auto flex items-center gap-0.5 rounded-full border p-0.5"
          >
            {LAYOUT_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => layoutStore.set(mode)}
                aria-pressed={layout === mode}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
                  layout === mode
                    ? 'bg-primary/15 text-foreground'
                    : 'text-foreground/55 hover:text-foreground',
                )}
              >
                {pick(LAYOUT_LABELS[mode], locale)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {hint}

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
