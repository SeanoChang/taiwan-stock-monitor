import Link from 'next/link';
import { t } from '@/lib/i18n/dict';
import type { UIKey } from '@/lib/i18n/dict';
import type { Locale } from '@/lib/i18n/config';

const LINKS: { href: string; key: UIKey }[] = [
  { href: '/', key: 'navExplorer' },
  { href: '/supply-chain', key: 'navGraph' },
  { href: '/market', key: 'navMarket' },
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
          {t(link.key, locale)}
        </Link>
      ))}
    </nav>
  );
}
