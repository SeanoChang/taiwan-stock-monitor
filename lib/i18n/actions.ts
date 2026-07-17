'use server';

// Locale mutation. Cookies can only be written from a server function, so the
// toggle posts here and Next re-renders the route in the chosen language —
// this is the write half of the server-cookie locale model in ./server.ts.

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, isLocale } from '@/lib/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocale(formData: FormData): Promise<void> {
  const next = formData.get('locale');
  if (!isLocale(next)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, next, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' });
}
