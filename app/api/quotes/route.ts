import { NextResponse } from 'next/server';
import { getQuotes, QUOTES_REVALIDATE_SECONDS } from '@/lib/server/quotes';

// Node runtime is required, not incidental: the handler pulls in `server-only`
// and the raw TWSE/TPEx feeds exceed the edge fetch-cache cap.
export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  const payload = await getQuotes();
  return NextResponse.json(payload, {
    headers: {
      'cache-control': `public, s-maxage=${QUOTES_REVALIDATE_SECONDS}, stale-while-revalidate=60`,
    },
  });
}
