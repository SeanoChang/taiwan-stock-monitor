'use client';

// Locale context: Traditional Chinese (Taiwan) by default, English toggle.
// Persists to localStorage and mirrors onto <html lang>.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_LOCALE, HTML_LANG, UI } from '@/lib/l10n';
import type { Locale, LStr } from '@/lib/l10n';

interface I18nCtx {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  toggle: () => void;
  /** pick a bilingual string */
  pick: (s: LStr) => string;
  /** UI dictionary lookup */
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE_KEY = 'ss-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'zh') setLocaleState(saved);
    } catch { /* private mode etc. */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    try { window.localStorage.setItem(STORAGE_KEY, loc); } catch { /* noop */ }
  }, []);

  const toggle = useCallback(() => setLocale(locale === 'zh' ? 'en' : 'zh'), [locale, setLocale]);
  const pick = useCallback((s: LStr) => s[locale], [locale]);
  const t = useCallback((key: string) => {
    const s = UI[key];
    return s ? s[locale] : key;
  }, [locale]);

  return <Ctx.Provider value={{ locale, setLocale, toggle, pick, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
