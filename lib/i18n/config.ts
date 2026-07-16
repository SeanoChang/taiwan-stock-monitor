// Locale primitives — universal module (safe in server and client components).

export type Locale = 'zh' | 'en'; // 'zh' = zh-Hant-TW (Traditional Chinese, Taiwan)

export const LOCALES: Locale[] = ['zh', 'en'];
export const DEFAULT_LOCALE: Locale = 'zh';
export const LOCALE_COOKIE = 'locale';

export const HTML_LANG: Record<Locale, string> = { zh: 'zh-Hant-TW', en: 'en' };

export interface LStr {
  en: string;
  zh: string;
}

/** shorthand constructor for bilingual strings */
export const l = (en: string, zh: string): LStr => ({ en, zh });

/** pick a bilingual string for a locale */
export const pick = (s: LStr, locale: Locale): string => s[locale];

export function isLocale(v: unknown): v is Locale {
  return v === 'zh' || v === 'en';
}
