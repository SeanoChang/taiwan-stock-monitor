import Link from 'next/link';
import { t } from '@/lib/i18n/dict';
import type { Locale } from '@/lib/i18n/config';

/** SILICON STACK 矽鏈 lockup, optionally with the tagline. Quiet product-bar mark. */
export function Brand({ locale, tagline = false }: { locale: Locale; tagline?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Link
        href="/"
        className="focus-visible:ring-ring focus-visible:ring-offset-background flex h-11 items-baseline gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <span className="text-foreground text-[13px] font-semibold tracking-tight">
          SILICON STACK
        </span>
        <span className="text-muted-foreground text-[11px] tracking-[0.18em]">矽鏈</span>
      </Link>
      {tagline && (
        <span className="text-muted-foreground text-[11px] tracking-wide">
          {t('brandSub', locale)}
        </span>
      )}
    </div>
  );
}
