'use client';

// Taiwan × AI supply chain — interactive chain board.
// Stages flow top-to-bottom, category nodes hold company chips; selecting a company
// highlights its 1st-degree (accent) and 2nd-degree (soft) neighbours, draws relation
// edges, and opens a detail panel for chain-walking.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  STAGES, CATEGORIES, COMPANIES, COMPANY_MAP, CATEGORY_MAP,
  TW_COUNT, TOTAL_COUNT, inboundRels,
} from '@/lib/supply-chain/data';
import type { SCCompany } from '@/lib/supply-chain/data';

const ACCENT = '#ffb703';
const FG = '#eef4fb';

interface Edge { x1: number; y1: number; x2: number; y2: number; }

function neighborsOf(id: string): Map<string, string> {
  // company id -> relation label (merged out/in)
  const m = new Map<string, string>();
  const c = COMPANY_MAP[id];
  for (const r of c?.rel || []) m.set(r.to, r.label);
  for (const r of inboundRels(id)) if (!m.has(r.from)) m.set(r.from, r.label);
  return m;
}

export default function SupplyChainGraph() {
  const [sel, setSel] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [edges, setEdges] = useState<Edge[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const selCompany: SCCompany | null = sel ? COMPANY_MAP[sel] : null;
  const deg1 = useMemo(() => (sel ? neighborsOf(sel) : new Map<string, string>()), [sel]);
  const deg2 = useMemo(() => {
    const s = new Set<string>();
    if (!sel) return s;
    for (const n of deg1.keys()) for (const nn of neighborsOf(n).keys()) {
      if (nn !== sel && !deg1.has(nn)) s.add(nn);
    }
    return s;
  }, [sel, deg1]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    const s = new Set<string>();
    const zhq = query.trim();
    for (const c of COMPANIES) {
      const cat = CATEGORY_MAP[c.cat];
      if (
        c.name.toLowerCase().includes(q) ||
        (c.zh || '').includes(zhq) ||
        c.ticker.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (cat && (cat.name.toLowerCase().includes(q) || cat.zh.includes(zhq)))
      ) s.add(c.id);
    }
    return s;
  }, [q, query]);

  const recomputeEdges = useCallback(() => {
    if (!sel || !boardRef.current) { setEdges([]); return; }
    const board = boardRef.current.getBoundingClientRect();
    const from = chipRefs.current.get(sel);
    if (!from) { setEdges([]); return; }
    const fr = from.getBoundingClientRect();
    const fx = fr.left - board.left + fr.width / 2;
    const fy = fr.top - board.top + fr.height / 2;
    const next: Edge[] = [];
    for (const nid of deg1.keys()) {
      const el = chipRefs.current.get(nid);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      next.push({ x1: fx, y1: fy, x2: r.left - board.left + r.width / 2, y2: r.top - board.top + r.height / 2 });
    }
    setEdges(next);
  }, [sel, deg1]);

  useEffect(() => {
    recomputeEdges();
    window.addEventListener('resize', recomputeEdges);
    return () => window.removeEventListener('resize', recomputeEdges);
  }, [recomputeEdges]);

  const chipStyle = (c: SCCompany): CSSProperties => {
    const isTW = c.exch === 'TWSE' || c.exch === 'TPEx';
    let opacity = 1, border = '1px solid rgba(255,255,255,0.13)', background = 'rgba(255,255,255,0.045)';
    if (matches) {
      opacity = matches.has(c.id) ? 1 : 0.22;
      if (matches.has(c.id)) border = `1px solid ${ACCENT}`;
    } else if (sel) {
      if (c.id === sel) { border = `1.5px solid ${ACCENT}`; background = 'rgba(255,183,3,0.16)'; }
      else if (deg1.has(c.id)) { border = `1px solid ${ACCENT}`; background = 'rgba(255,183,3,0.07)'; }
      else if (deg2.has(c.id)) { opacity = 0.9; border = '1px solid rgba(255,183,3,0.35)'; }
      else opacity = 0.25;
    }
    return {
      display: 'flex', alignItems: 'baseline', gap: 6, padding: '5px 10px', borderRadius: 8,
      border, background, opacity, cursor: 'pointer', fontFamily: 'inherit', color: FG,
      fontSize: 12, lineHeight: 1.35, textAlign: 'left', transition: 'opacity .2s, border-color .2s',
      ...(isTW ? {} : { borderStyle: 'dashed' }),
    };
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1b2a', color: FG,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', sans-serif",
    }}>
      {/* header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(10,20,33,0.9)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/" className="ss-ghost-btn" style={{ fontSize: 12, fontWeight: 600, color: 'rgba(238,244,251,0.75)', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: '7px 14px', whiteSpace: 'nowrap' }}>
          ← 3D Explorer
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.14em' }}>SILICON STACK</span>
            <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.5)', letterSpacing: '0.28em' }}>矽鏈</span>
            <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600, letterSpacing: '0.04em' }}>Supply-chain map</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.5)' }}>
            {TW_COUNT} Taiwan-listed companies · {TOTAL_COUNT} nodes · {CATEGORIES.length} chain segments — click any company to trace its links
          </span>
        </div>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSel(null); }}
          placeholder="Search name / 中文 / ticker / role…"
          style={{ flex: '1 1 220px', maxWidth: 340, fontFamily: 'inherit', fontSize: 12.5, color: FG, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '8px 16px', outline: 'none' }}
        />
        {matches && (
          <span style={{ fontSize: 11.5, color: ACCENT }}>{matches.size} match{matches.size === 1 ? '' : 'es'}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(238,244,251,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '5px 10px', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
          Curated snapshot · Jul 2026 · not investment advice
        </span>
      </div>

      {/* legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 28px 0', fontSize: 11, color: 'rgba(238,244,251,0.55)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', marginRight: 6 }} />TWSE / TPEx listed</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, border: '1px dashed rgba(255,255,255,0.45)', marginRight: 6 }} />foreign / private anchor</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, border: `1px solid ${ACCENT}`, background: 'rgba(255,183,3,0.15)', marginRight: 6 }} />selected · direct link</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, border: '1px solid rgba(255,183,3,0.4)', marginRight: 6 }} />2nd-degree link</span>
      </div>

      {/* board */}
      <div ref={boardRef} style={{ position: 'relative', padding: '18px 28px 80px', maxWidth: 1600, margin: '0 auto' }}>
        {/* relation edges overlay */}
        {edges.length > 0 && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {edges.map((e, i) => {
              const mx = (e.x1 + e.x2) / 2, my = (e.y1 + e.y2) / 2 - Math.min(90, Math.abs(e.x2 - e.x1) * 0.12 + 24);
              return (
                <g key={i}>
                  <path d={`M ${e.x1} ${e.y1} Q ${mx} ${my} ${e.x2} ${e.y2}`} fill="none" stroke={ACCENT} strokeWidth={1.4} opacity={0.55} />
                  <circle cx={e.x2} cy={e.y2} r={3} fill={ACCENT} opacity={0.8} />
                </g>
              );
            })}
          </svg>
        )}

        {STAGES.map((st, si) => {
          const cats = CATEGORIES.filter(c => c.stage === st.id);
          return (
            <section key={st.id} style={{ marginBottom: 26 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '18px 0 10px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: ACCENT }}>{String(si + 1).padStart(2, '0')}</span>
                <h2 style={{ fontSize: 19, fontWeight: 300, letterSpacing: '-0.01em', margin: 0 }}>{st.name}</h2>
                <span style={{ fontSize: 12, color: 'rgba(238,244,251,0.5)', letterSpacing: '0.18em' }}>{st.zh}</span>
                <span style={{ fontSize: 11.5, color: 'rgba(238,244,251,0.45)' }}>{st.blurb}</span>
                {si < STAGES.length - 1 && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(238,244,251,0.35)' }}>↓ feeds next stage</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 12 }}>
                {cats.map(cat => {
                  const comps = COMPANIES.filter(c => c.cat === cat.id);
                  return (
                    <div key={cat.id} style={{ background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{cat.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.5)' }}>{cat.zh}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'rgba(238,244,251,0.4)' }}>{comps.length}</span>
                      </div>
                      <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(238,244,251,0.55)', marginBottom: 10 }}>{cat.desc}</div>
                      {cat.feeds.length > 0 && (
                        <div style={{ fontSize: 10, color: 'rgba(238,244,251,0.4)', marginBottom: 10 }}>
                          → feeds {cat.feeds.map(f => CATEGORY_MAP[f]?.name).filter(Boolean).join(' · ')}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {comps.map(c => (
                          <button
                            key={c.id}
                            ref={(el) => { if (el) chipRefs.current.set(c.id, el); else chipRefs.current.delete(c.id); }}
                            onClick={() => { setQuery(''); setSel(c.id === sel ? null : c.id); }}
                            style={chipStyle(c)}
                            title={c.role}
                          >
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{c.zh || c.name}</span>
                            {c.zh && <span style={{ fontSize: 10.5, color: 'rgba(238,244,251,0.6)', whiteSpace: 'nowrap' }}>{c.name}</span>}
                            <span style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 10, color: c.exch === 'TWSE' || c.exch === 'TPEx' ? ACCENT : 'rgba(238,244,251,0.45)' }}>
                              {c.ticker}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* detail panel */}
      {selCompany && (
        <div className="ss-scroll" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, maxWidth: '92vw', zIndex: 40, background: 'rgba(11,22,36,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderLeft: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', padding: '28px 26px', animation: 'fadeUp 0.3s ease' }}>
          <button onClick={() => setSel(null)} title="Close" className="ss-ghost-btn" style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.04)', color: 'rgba(238,244,251,0.8)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>

          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
            {CATEGORY_MAP[selCompany.cat]?.name} · {STAGES.find(s => s.id === CATEGORY_MAP[selCompany.cat]?.stage)?.name}
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25, marginBottom: 4, paddingRight: 28 }}>
            {selCompany.zh ? `${selCompany.zh} ${selCompany.name}` : selCompany.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '10px 0 18px' }}>
            <span style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 12, fontWeight: 600, color: '#0d1b2a', background: ACCENT, borderRadius: 6, padding: '3px 8px' }}>{selCompany.ticker}</span>
            <span style={{ fontSize: 12, color: 'rgba(238,244,251,0.6)' }}>
              {selCompany.exch === 'TWSE' ? 'TWSE 上市' : selCompany.exch === 'TPEx' ? 'TPEx 上櫃' : selCompany.exch}
            </span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(238,244,251,0.8)', marginBottom: 20 }}>{selCompany.role}</div>

          <div style={{ fontSize: 11, lineHeight: 1.55, color: 'rgba(238,244,251,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 22 }}>
            {CATEGORY_MAP[selCompany.cat]?.desc}
          </div>

          {(selCompany.rel || []).length > 0 && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(238,244,251,0.45)', marginBottom: 8 }}>Linked to</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 22 }}>
                {(selCompany.rel || []).map(r => (
                  <button key={r.to + r.label} onClick={() => setSel(r.to)} className="ss-link-btn" style={{ display: 'flex', alignItems: 'baseline', gap: 8, textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit', color: FG, width: '100%' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{COMPANY_MAP[r.to]?.zh || COMPANY_MAP[r.to]?.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.55)' }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {inboundRels(selCompany.id).length > 0 && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(238,244,251,0.45)', marginBottom: 8 }}>Referenced by</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 22 }}>
                {inboundRels(selCompany.id).map(r => (
                  <button key={r.from + r.label} onClick={() => setSel(r.from)} className="ss-link-btn" style={{ display: 'flex', alignItems: 'baseline', gap: 8, textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit', color: FG, width: '100%' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{COMPANY_MAP[r.from]?.zh || COMPANY_MAP[r.from]?.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.55)' }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ fontSize: 10, color: 'rgba(238,244,251,0.4)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            Curated mapping for research navigation — verify tickers, listings and relationships against primary sources before acting on them.
          </div>
        </div>
      )}
    </div>
  );
}
