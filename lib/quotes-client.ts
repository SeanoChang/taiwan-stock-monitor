'use client';

// Client-side quote access for the interactive islands (graph & explorer
// panels). One module-level cache shared across islands; refreshes on the
// same cadence as the server cache.

import { useEffect, useState } from 'react';

export interface ClientQuote {
  code: string;
  name: string;
  close: number;
  change: number;
  changePct: number;
  volume: number;
  date: string;
  market: 'TWSE' | 'TPEx';
}

export interface ClientQuotesPayload {
  ok: boolean;
  updated: string | null;
  quotes: Record<string, ClientQuote>;
}

export { fmtChange, normalizeCode, upDownColor } from '@/lib/format';

const TTL = 5 * 60 * 1000;
let cached: ClientQuotesPayload | null = null;
let fetchedAt = 0;
let inflight: Promise<ClientQuotesPayload> | null = null;

async function load(): Promise<ClientQuotesPayload> {
  if (cached && Date.now() - fetchedAt < TTL) return cached;
  inflight ??= fetch('/api/quotes')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((p: ClientQuotesPayload) => {
      cached = p;
      fetchedAt = Date.now();
      return p;
    })
    .catch(() => cached ?? { ok: false, updated: null, quotes: {} })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useQuotes(): ClientQuotesPayload | null {
  const [payload, setPayload] = useState<ClientQuotesPayload | null>(cached);
  useEffect(() => {
    let alive = true;
    load().then((p) => {
      if (alive) setPayload(p);
    });
    const iv = setInterval(() => {
      fetchedAt = 0;
      load().then((p) => {
        if (alive) setPayload({ ...p });
      });
    }, TTL);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, []);
  return payload;
}
