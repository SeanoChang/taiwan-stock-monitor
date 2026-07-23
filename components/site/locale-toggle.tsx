import { cn } from '@/lib/utils';
import { setLocale } from '@/lib/i18n/actions';
import type { Locale } from '@/lib/i18n/config';

/**
 * Locale switcher. A server function sets the cookie and the route re-renders
 * in the chosen language, so this needs no client JS of its own — and it stays
 * renderable from both server pages and the client explorer/graph chrome.
 *
 * Quiet product-bar control — no pill chrome, matches the nav anchors.
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
          'text-muted-foreground hover:text-foreground active:text-primary focus-visible:ring-ring focus-visible:ring-offset-background flex h-11 shrink-0 items-center rounded-sm text-xs font-semibold tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          className,
        )}
      >
        {next === 'en' ? 'EN' : '繁中'}
      </button>
    </form>
  );
}
