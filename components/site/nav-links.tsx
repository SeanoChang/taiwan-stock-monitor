import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { t } from '@/lib/i18n/dict';
import type { UIKey } from '@/lib/i18n/dict';
import type { Locale } from '@/lib/i18n/config';

const LINKS: { href: string; key: UIKey }[] = [
  { href: '/', key: 'navExplorer' },
  { href: '/supply-chain', key: 'navGraph' },
  { href: '/market', key: 'navMarket' },
];

/**
 * Cross-page navigation pills; hides the current page's own link.
 *
 * Every route reads the locale cookie, so they are all dynamic — and auto
 * prefetch skips dynamic routes without a loading boundary. `prefetch` forces
 * the full route to be prefetched and held in the client cache instead.
 */
export function NavLinks({ locale, current }: { locale: Locale; current: string }) {
  return (
    <nav className="flex items-center gap-2">
      {LINKS.filter((link) => link.href !== current).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'ss-veil border-border text-foreground/75 hover:text-foreground rounded-full text-xs font-semibold',
          )}
        >
          {t(link.key, locale)}
        </Link>
      ))}
    </nav>
  );
}
