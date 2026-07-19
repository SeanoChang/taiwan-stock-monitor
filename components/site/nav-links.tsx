import Link from 'next/link';
import { t } from '@/lib/i18n/dict';
import type { UIKey } from '@/lib/i18n/dict';
import { l, pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';

// Every entry is either a shared `lib/i18n/dict.ts` key (the original three
// routes) or an inline bilingual `label` (the new 堆疊/Stack entry, Plan 006
// Phase G Task 3) — inline rather than a new dict.ts key because this task's
// file scope is additive/isolated and doesn't touch lib/i18n/dict.ts.
type NavLink = { href: string } & ({ key: UIKey } | { label: LStr });

const LINKS: NavLink[] = [
  { href: '/', key: 'navExplorer' },
  { href: '/supply-chain', key: 'navGraph' },
  { href: '/market', key: 'navMarket' },
  { href: '/stack', label: l('Stack', '堆疊') },
];

/**
 * Cross-page navigation — quiet Apple product-bar anchors; hides the current
 * page's own link. Scrolls horizontally instead of wrapping on narrow widths.
 *
 * Every route reads the locale cookie, so they are all dynamic — and auto
 * prefetch skips dynamic routes without a loading boundary. `prefetch` forces
 * the full route to be prefetched and held in the client cache instead.
 */
export function NavLinks({ locale, current }: { locale: Locale; current: string }) {
  return (
    <nav className="flex items-center gap-5 overflow-x-auto" aria-label="site">
      {LINKS.filter((link) => link.href !== current).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch
          className="text-muted-foreground hover:text-foreground active:text-primary focus-visible:ring-ring focus-visible:ring-offset-background flex h-11 shrink-0 items-center rounded-sm text-xs font-semibold tracking-wide whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {'key' in link ? t(link.key, locale) : pick(link.label, locale)}
        </Link>
      ))}
    </nav>
  );
}
