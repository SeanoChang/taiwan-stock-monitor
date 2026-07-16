'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LOCALE_COOKIE } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';

const YEAR = 60 * 60 * 24 * 365;

/**
 * Locale switcher island. Persists the choice as a cookie and refreshes the
 * route so server components re-render in the selected language.
 */
export function LocaleToggle({ locale, className }: { locale: Locale; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === 'zh' ? 'en' : 'zh';

  const onToggle = () => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${YEAR}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      disabled={pending}
      aria-label={locale === 'zh' ? 'Switch to English' : '切換為繁體中文'}
      className={`ss-veil rounded-full border-border text-xs font-semibold tracking-wider text-foreground/75 hover:text-foreground ${className ?? ''}`}
    >
      {next === 'en' ? 'EN' : '繁中'}
    </Button>
  );
}
