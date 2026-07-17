// Toolbar for the market board: search + sort. Both are already URL state, so
// this renders on the server — <Form> and <Link> carry the params and the board
// re-renders from them. No island state to keep in sync, and it works with JS
// off; the field and the links are all that hydrate.

import Form from 'next/form';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_MARKET_SORT,
  MARKET_SORTS,
  SORT_LABEL_KEYS,
  marketHref,
} from '@/components/market/market-sort';
import type { MarketSort } from '@/components/market/market-sort';
import type { Locale } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';

const PILL = 'rounded-full text-[11px] font-semibold';

export function MarketToolbar({
  locale,
  query,
  sort,
}: {
  locale: Locale;
  query: string;
  sort: MarketSort;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Form action="/market" replace scroll={false} className="flex items-center gap-2">
        {/* carries the active sort through a search; the default stays out of the URL */}
        {sort !== DEFAULT_MARKET_SORT && <input type="hidden" name="sort" value={sort} />}
        <Input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={t('searchMarket', locale)}
          className="bg-secondary h-9 w-[300px] max-w-[52vw] rounded-full px-4 text-xs"
        />
        <button
          type="submit"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), PILL, 'ss-veil')}
        >
          {t('searchAction', locale)}
        </button>
      </Form>

      {query && (
        <Link
          href={marketHref('', sort)}
          replace
          scroll={false}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), PILL)}
        >
          {t('clearFilter', locale)}
        </Link>
      )}

      <nav aria-label={t('sortBy', locale)} className="ml-auto flex flex-wrap items-center gap-1.5">
        <span className="text-foreground/50 text-[11px]">{t('sortBy', locale)}</span>
        {MARKET_SORTS.map((s) => (
          <Link
            key={s}
            href={marketHref(query, s)}
            replace
            scroll={false}
            aria-current={s === sort ? 'true' : undefined}
            className={cn(
              buttonVariants({ variant: s === sort ? 'secondary' : 'outline', size: 'sm' }),
              PILL,
              s === sort && 'border-primary/40 text-primary',
            )}
          >
            {t(SORT_LABEL_KEYS[s], locale)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
