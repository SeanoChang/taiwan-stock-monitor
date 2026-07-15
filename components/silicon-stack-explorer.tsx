'use client';

// Silicon Stack Explorer — ported from the Claude Design project
// "Silicon Stack Explorer.dc.html". Faithful translation of the DC template
// + component logic into a Next.js client component.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { LEVELS, TOUR, COMPANIES } from '@/lib/silicon-stack/data';
import type { SceneApi } from '@/lib/silicon-stack/scene';

export interface SiliconStackExplorerProps {
  accent?: string;      // '#ffb703' | '#4cc9f0' | '#2dd4a7' | '#ff7a59'
  autoRotate?: boolean;
  startLevel?: number;  // 0..3
}

function spark(ticker: string, chg: number) {
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) seed = (seed * 31 + ticker.charCodeAt(i)) % 9973;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const n = 36, pts: number[] = [];
  let v = 32;
  const drift = (chg >= 0 ? -0.42 : 0.42);
  for (let i = 0; i < n; i++) { v += (rnd() - 0.5) * 7 + drift; v = Math.max(6, Math.min(58, v)); pts.push(v); }
  const step = 300 / (n - 1);
  const str = pts.map((p, i) => (i * step).toFixed(1) + ',' + p.toFixed(1)).join(' ');
  const area = 'M0,64 L' + str.split(' ').join(' L') + ' L300,64 Z';
  return { str, area };
}

const HINTS = [
  'Drag to orbit · Scroll to zoom deeper · Click a label',
  'Scroll in on the GPUs to go deeper · Scroll out to return',
  'Scroll in on the die to reach the nanometer scale',
  'You’ve reached 4 nm — the atomic frontier · Scroll out to return'
];

export default function SiliconStackExplorer({
  accent = '#ffb703',
  autoRotate = true,
  startLevel = 0
}: SiliconStackExplorerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const tourRef = useRef(false);
  const tourTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);
  const [level, setLevel] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [selRole, setSelRole] = useState('');
  const [tour, setTour] = useState(false);

  const stopTour = useCallback(() => {
    clearTimeout(tourTimer.current);
    tourRef.current = false;
    setTour(false);
  }, []);

  const tourStep = useCallback((i: number) => {
    if (i > 3) { stopTour(); return; }
    apiRef.current?.goLevel(i);
    tourTimer.current = setTimeout(() => { if (tourRef.current) tourStep(i + 1); }, 10000);
  }, [stopTour]);

  const startTour = useCallback(() => {
    if (!apiRef.current) return;
    tourRef.current = true;
    setTour(true);
    setSel(null);
    tourStep(0);
  }, [tourStep]);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/silicon-stack/scene')
      .then(({ createScene }) => {
        if (cancelled || !canvasRef.current || !layerRef.current) return;
        apiRef.current = createScene({
          container: canvasRef.current,
          layer: layerRef.current,
          accent,
          autoRotate,
          startLevel: Math.max(0, Math.min(3, startLevel)),
          onLevel: (i) => setLevel(i),
          onSelect: (id, role) => { setSel(id); setSelRole(role); },
          onReady: () => setReady(true),
          onInteract: () => { if (tourRef.current) stopTour(); }
        });
      })
      .catch((e) => { console.error(e); setErr(true); setReady(true); });
    return () => {
      cancelled = true;
      clearTimeout(tourTimer.current);
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // Scene is created once; accent/autoRotate updates are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { apiRef.current?.setAccent(accent); }, [accent]);
  useEffect(() => { apiRef.current?.setAutoRotate(autoRotate); }, [autoRotate]);

  const go = (i: number) => apiRef.current?.goLevel(i);

  const L = LEVELS[level] ?? { name: '', zh: '', blurb: '', scale: '' };
  const c = sel ? COMPANIES[sel] : null;
  const sp = useMemo(
    () => (c && !c.private ? spark(c.ticker, c.chg) : { str: '', area: '' }),
    [c]
  );
  const up = c ? c.chg >= 0 : true;
  const notTouring = !tour && ready && !err;

  const rootStyle = {
    '--accent': accent,
    position: 'fixed', inset: 0, background: '#0d1b2a', color: '#eef4fb',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', sans-serif",
    overflow: 'hidden'
  } as CSSProperties;

  return (
    <div style={rootStyle}>
      {/* 3D canvas host */}
      <div ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* hotspot layer (scene.ts populates) */}
      <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }} />

      {/* vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, background: 'radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(4,10,18,0.55) 100%)' }} />

      {/* header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '26px 32px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.16em' }}>SILICON STACK</span>
            <span style={{ fontSize: 12, color: 'rgba(238,244,251,0.5)', letterSpacing: '0.32em' }}>矽鏈</span>
          </div>
          <span style={{ fontSize: 11.5, color: 'rgba(238,244,251,0.52)', letterSpacing: '0.02em' }}>
            Taiwan &amp; the global AI supply chain · from rack to nanometer
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          <Link
            href="/supply-chain"
            className="ss-ghost-btn"
            style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.03em', color: 'rgba(238,244,251,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '9px 18px' }}
          >
            Supply chain map →
          </Link>
          <span style={{ fontSize: 10.5, color: 'rgba(238,244,251,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '5px 11px', letterSpacing: '0.04em' }}>
            Illustrative data · 15 Jul 2026
          </span>
          {notTouring && (
            <button onClick={startTour} className="ss-tour-btn" style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.03em', color: '#0d1b2a', background: 'var(--accent, #ffb703)', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>
              Guided tour
            </button>
          )}
          {tour && (
            <button onClick={stopTour} style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: '#eef4fb', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>
              Exit tour
            </button>
          )}
        </div>
      </div>

      {/* bottom bar: identity · rail · hint (flex, no overlap at narrow widths) */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'flex-end', gap: 20, padding: '0 32px 28px', pointerEvents: 'none' }}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', color: 'var(--accent, #ffb703)', marginBottom: 6 }}>{L.zh} · {L.scale}</div>
          <div style={{ fontSize: 'clamp(19px, 2.6vw, 30px)', fontWeight: 300, letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 7, whiteSpace: 'nowrap' }}>{L.name}</div>
          <div style={{ fontSize: 12.5, color: 'rgba(238,244,251,0.6)', lineHeight: 1.5, maxWidth: 340 }}>{L.blurb}</div>
        </div>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(10,20,33,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '7px 10px', pointerEvents: 'auto' }}>
          {level > 0 && ready && !err && (
            <button onClick={() => go(level - 1)} title="Zoom out one level" className="ss-ghost-btn" style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'rgba(238,244,251,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '7px 13px', cursor: 'pointer', marginRight: 4 }}>
              ↖ Out
            </button>
          )}
          {LEVELS.map((lv, i) => {
            const active = i === level;
            return (
              <button
                key={lv.key}
                onClick={() => go(i)}
                className="ss-rail-btn"
                style={{
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
                  display: 'flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer',
                  borderRadius: 999, padding: '7px 13px',
                  background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                  color: active ? '#eef4fb' : 'rgba(238,244,251,0.55)'
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', flex: 'none', background: active ? accent : 'rgba(238,244,251,0.28)' }} />
                <span>{lv.name.replace('The ', '').replace('Inside the ', '')}</span>
              </button>
            );
          })}
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>
          {notTouring && (
            <div style={{ fontSize: 11.5, color: 'rgba(238,244,251,0.45)', letterSpacing: '0.02em', textAlign: 'right', lineHeight: 1.6, maxWidth: 210, paddingBottom: 4 }}>
              {HINTS[level] || HINTS[0]}
            </div>
          )}
        </div>
      </div>

      {/* tour caption */}
      {tour && (
        <div style={{ position: 'absolute', left: '50%', bottom: 92, transform: 'translateX(-50%)', zIndex: 11, maxWidth: 620, width: 'calc(100% - 48px)', background: 'rgba(10,20,33,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '16px 22px', fontSize: 14.5, lineHeight: 1.55, color: 'rgba(238,244,251,0.92)', textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
          {TOUR[level]}
        </div>
      )}

      {/* company panel */}
      {c && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 390, maxWidth: '92vw', zIndex: 20, background: 'rgba(11,22,36,0.88)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.35s ease' }}>
          <button onClick={() => setSel(null)} title="Close" className="ss-ghost-btn" style={{ position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.04)', color: 'rgba(238,244,251,0.8)', fontSize: 14, cursor: 'pointer', zIndex: 2, fontFamily: 'inherit' }}>
            ✕
          </button>
          <div className="ss-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 28px 20px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent, #ffb703)', marginBottom: 10 }}>
              {selRole || c.role}
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 10, paddingRight: 30 }}>{c.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
              <span style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 12, fontWeight: 600, color: '#0d1b2a', background: 'var(--accent, #ffb703)', borderRadius: 6, padding: '3px 8px' }}>{c.ticker}</span>
              <span style={{ fontSize: 12, color: 'rgba(238,244,251,0.55)' }}>{c.exch} · {c.country}</span>
            </div>

            {!c.private && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.01em' }}>{c.priceText}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: up ? '#5ad19a' : '#ff8585' }}>
                    {(c.chg > 0 ? '+' : '') + c.chg.toFixed(1) + '%'}
                  </span>
                </div>
                <svg viewBox="0 0 300 64" style={{ width: '100%', height: 64, display: 'block', marginBottom: 18 }}>
                  <path d={sp.area} fill={up ? 'rgba(90,209,154,0.12)' : 'rgba(255,133,133,0.12)'} stroke="none" />
                  <polyline points={sp.str} fill="none" stroke={up ? '#5ad19a' : '#ff8585'} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </>
            )}
            {c.private && (
              <div style={{ fontSize: 13, color: 'rgba(238,244,251,0.75)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
                {c.note || ''}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.045)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(238,244,251,0.45)', marginBottom: 4 }}>Market cap</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{c.mcapText}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.045)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(238,244,251,0.45)', marginBottom: 4 }}>Position</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>{c.share}</div>
              </div>
            </div>

            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(238,244,251,0.78)', marginBottom: 24 }}>{c.desc}</div>

            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(238,244,251,0.45)', marginBottom: 10 }}>Supply chain</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(c.links || []).map((lk) => (
                <button
                  key={lk.to + lk.label}
                  onClick={() => { setSel(lk.to); setSelRole(COMPANIES[lk.to].role); }}
                  className="ss-link-btn"
                  style={{ display: 'flex', alignItems: 'baseline', gap: 8, textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 13px', cursor: 'pointer', fontFamily: 'inherit', color: '#eef4fb', width: '100%' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{COMPANIES[lk.to].short}</span>
                  <span style={{ fontSize: 11.5, color: 'rgba(238,244,251,0.55)' }}>{lk.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '14px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 10.5, color: 'rgba(238,244,251,0.4)', lineHeight: 1.5 }}>
            Illustrative snapshot for design purposes — not live quotes, not investment advice.
          </div>
        </div>
      )}

      {/* loading */}
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#0d1b2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.18em' }}>SILICON STACK</span>
            <span style={{ fontSize: 13, color: 'rgba(238,244,251,0.5)', letterSpacing: '0.32em' }}>矽鏈</span>
          </div>
          <div style={{ width: 26, height: 26, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent, #ffb703)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <div style={{ fontSize: 12, color: 'rgba(238,244,251,0.5)', letterSpacing: '0.04em' }}>Preparing the data center…</div>
        </div>
      )}
      {err && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 31, background: '#0d1b2a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ maxWidth: 380, textAlign: 'center', fontSize: 14, lineHeight: 1.6, color: 'rgba(238,244,251,0.75)' }}>
            Couldn&apos;t load the 3D engine. Reload to retry.
          </div>
        </div>
      )}
    </div>
  );
}
