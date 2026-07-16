import 'server-only';

import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';

/** Resolve the request locale from the cookie (zh-Hant-TW by default). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}
