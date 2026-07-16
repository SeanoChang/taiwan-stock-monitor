import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n/dict';
import type { UIKey } from '@/lib/i18n/dict';
import type { Locale } from '@/lib/i18n/config';

const LINKS: { href: string; key: UIKey }[] = [
  { href: '/', key: 'navExplorer' },
  { href: '/supply-chain', key: 'navGraph' },
  { href: '/market', key: 'navMarket' },
];

/** Cross-page navigation pills; hides the current page's own link. */
export function NavLinks({ locale, current }: { locale: Locale; current: string }) {
  return (
    <nav className="flex items-center gap-2">
      {LINKS.filter((link) => link.href !== current).map((link) => (
        <Button
          key={link.href}
          render={<Link href={link.href} />}
          variant="outline"
          size="sm"
          className="ss-veil border-border text-foreground/75 hover:text-foreground rounded-full text-xs font-semibold"
        >
          {t(link.key, locale)}
        </Button>
      ))}
    </nav>
  );
}
