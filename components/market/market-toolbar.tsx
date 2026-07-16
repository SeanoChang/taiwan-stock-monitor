'use client';

// Toolbar island for the market board: search + sort, expressed as URL
// search params so the board itself stays a server component.

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Locale } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';
import type { MarketSort } from '@/components/market/market-sort';

const SORT_LABEL_KEYS = {
  pctDesc: 'sortPctDesc',
  pctAsc: 'sortPctAsc',
  volume: 'sortVolume',
  code: 'sortCode',
} as const;

export function MarketToolbar({
  locale,
  initialQuery,
  initialSort,
}: {
  locale: Locale;
  initialQuery: string;
  initialSort: MarketSort;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<MarketSort>(initialSort);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const push = (q: string, s: MarketSort) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (s !== 'pctDesc') params.set('sort', s);
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  };

  useEffect(() => () => clearTimeout(debounce.current), []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          clearTimeout(debounce.current);
          const next = e.target.value;
          debounce.current = setTimeout(() => push(next, sort), 300);
        }}
        placeholder={t('searchMarket', locale)}
        className="bg-secondary h-9 max-w-[300px] flex-[1_1_220px] rounded-full px-4 text-xs"
      />
      <Select
        value={sort}
        onValueChange={(v) => {
          const s = v as MarketSort;
          setSort(s);
          push(query, s);
        }}
      >
        <SelectTrigger
          size="sm"
          className="bg-secondary h-9 rounded-full text-xs"
          aria-label={t('sortBy', locale)}
        >
          <span className="text-foreground/50">{t('sortBy', locale)}</span>
          <SelectValue>{t(SORT_LABEL_KEYS[sort], locale)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pctDesc">{t('sortPctDesc', locale)}</SelectItem>
          <SelectItem value="pctAsc">{t('sortPctAsc', locale)}</SelectItem>
          <SelectItem value="volume">{t('sortVolume', locale)}</SelectItem>
          <SelectItem value="code">{t('sortCode', locale)}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
