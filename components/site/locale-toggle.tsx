import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { setLocale } from '@/lib/i18n/actions';
import type { Locale } from '@/lib/i18n/config';

/**
 * Locale switcher. A server function sets the cookie and the route re-renders
 * in the chosen language, so this needs no client JS of its own — and it stays
 * renderable from both the server board and the client explorer/graph chrome.
 */
export function LocaleToggle({ locale, className }: { locale: Locale; className?: string }) {
  const next: Locale = locale === 'zh' ? 'en' : 'zh';

  return (
    <form action={setLocale} className="contents">
      <input type="hidden" name="locale" value={next} />
      <button
        type="submit"
        aria-label={locale === 'zh' ? 'Switch to English' : '切換為繁體中文'}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'ss-veil border-border text-foreground/75 hover:text-foreground rounded-full text-xs font-semibold tracking-wider',
          className,
        )}
      >
        {next === 'en' ? 'EN' : '繁中'}
      </button>
    </form>
  );
}
