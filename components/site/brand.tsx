import Link from 'next/link';
import { t } from '@/lib/i18n/dict';
import type { Locale } from '@/lib/i18n/config';

/** SILICON STACK 矽鏈 lockup, optionally with the tagline. */
export function Brand({ locale, tagline = false }: { locale: Locale; tagline?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Link href="/" className="flex items-baseline gap-2.5 outline-none">
        <span className="text-base font-bold tracking-[0.16em]">SILICON STACK</span>
        <span className="text-foreground/50 text-xs tracking-[0.32em]">矽鏈</span>
      </Link>
      {tagline && (
        <span className="text-foreground/50 text-[11.5px] tracking-wide">
          {t('brandSub', locale)}
        </span>
      )}
    </div>
  );
}
