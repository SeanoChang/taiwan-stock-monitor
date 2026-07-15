'use client';

// Taiwan × AI supply chain — force-directed network graph (canvas).
// Companies + category hubs as nodes; membership, relationship and flow edges;
// stage-clustered layout, pan/zoom, node drag, hover, click-to-trace 1st/2nd degree.
// Palette: validated 8-slot categorical set for the #0d1b2a surface (+ neutral for anchors).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceX, forceY, forceCollide,
} from 'd3-force';
import type { Simulation } from 'd3-force';
import Link from 'next/link';
import {
  STAGES, CATEGORIES, COMPANIES, COMPANY_MAP, CATEGORY_MAP,
  TW_COUNT, TOTAL_COUNT, inboundRels,
} from '@/lib/supply-chain/data';
import type { StageId } from '@/lib/supply-chain/data';
import { useI18n } from '@/lib/i18n';
import { l } from '@/lib/l10n';
import type { LStr, Locale } from '@/lib/l10n';

const ACCENT = '#ffb703';
const FG = '#eef4fb';
const BG = '#0d1b2a';

// stage → color group (materials+wafer share slot 1; anchors neutral)
const STAGE_GROUP: Record<StageId, number> = {
  materials: 0, wafer: 0, fabsupport: 1, chip: 2, package: 3,
  board: 4, subsystem: 5, system: 6, cloud: 7, anchor: 8,
};
const PALETTE = ['#3987e5', '#008300', '#d55181', '#c98500', '#199e70', '#d95926', '#9085e9', '#e66767', '#8a94a0'];
const GROUP_LABELS: LStr[] = [
  l('Materials & Wafers', '材料／晶圓'),
  l('Equipment & Fab', '設備廠務'),
  l('Chip Design & Fab', '晶片設計製造'),
  l('Package & Test', '封裝測試'),
  l('Boards & Passives', '電路板／被動元件'),
  l('Server Subsystems', '伺服器子系統'),
  l('Systems', '系統整合'),
  l('Network & Cloud', '網路雲端'),
  l('Global Anchors', '全球夥伴'),
];

// simulation world
const W = 2600, H = 1500;
const STAGE_ORDER: StageId[] = ['materials', 'fabsupport', 'wafer', 'chip', 'package', 'board', 'subsystem', 'system', 'cloud'];
const stageX = (s: StageId) => s === 'anchor' ? 1350 : 170 + STAGE_ORDER.indexOf(s) * (2260 / 8);
const stageY = (s: StageId) => s === 'anchor' ? 190 : H / 2 + 60;

interface GNode {
  id: string;
  kind: 'company' | 'hub';
  stage: StageId;
  group: number;
  r: number;
  nameEn: string;
  nameZh: string;
  ticker?: string;
  tw: boolean;
  x: number; y: number;
  vx?: number; vy?: number;
  fx?: number | null; fy?: number | null;
  index?: number;
}
interface GLink {
  kind: 'rel' | 'member' | 'feed';
  source: GNode | string;
  target: GNode | string;
}

function buildGraph() {
  const inboundCount = new Map<string, number>();
  for (const c of COMPANIES) for (const r of c.rel || []) inboundCount.set(r.to, (inboundCount.get(r.to) || 0) + 1);

  const nodes: GNode[] = [];
  for (const cat of CATEGORIES) {
    nodes.push({
      id: 'cat:' + cat.id, kind: 'hub', stage: cat.stage, group: STAGE_GROUP[cat.stage],
      r: 13, nameEn: cat.name, nameZh: cat.zh, tw: cat.stage !== 'anchor',
      x: stageX(cat.stage) + (Math.random() - 0.5) * 220,
      y: stageY(cat.stage) + (Math.random() - 0.5) * 420,
    });
  }
  for (const c of COMPANIES) {
    const deg = (c.rel?.length || 0) + (inboundCount.get(c.id) || 0);
    const st = CATEGORY_MAP[c.cat].stage;
    nodes.push({
      id: c.id, kind: 'company', stage: st, group: STAGE_GROUP[st],
      r: Math.min(11, 4.5 + deg * 0.55),
      nameEn: c.name, nameZh: c.zh || c.name, ticker: c.ticker,
      tw: c.exch === 'TWSE' || c.exch === 'TPEx',
      x: stageX(st) + (Math.random() - 0.5) * 260,
      y: stageY(st) + (Math.random() - 0.5) * 520,
    });
  }

  const links: GLink[] = [];
  for (const c of COMPANIES) {
    links.push({ kind: 'member', source: c.id, target: 'cat:' + c.cat });
    for (const r of c.rel || []) links.push({ kind: 'rel', source: c.id, target: r.to });
  }
  for (const cat of CATEGORIES) for (const f of cat.feeds) {
    links.push({ kind: 'feed', source: 'cat:' + cat.id, target: 'cat:' + f });
  }

  // adjacency for highlight (rel both directions + membership + feeds)
  const adj = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a)!.add(b);
  };
  for (const lk of links) {
    const s = typeof lk.source === 'string' ? lk.source : lk.source.id;
    const t = typeof lk.target === 'string' ? lk.target : lk.target.id;
    add(s, t); add(t, s);
  }
  return { nodes, links, adj };
}

export default function SupplyChainGraph() {
  const { locale, toggle, pick, t } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const graph = useMemo(buildGraph, []);
  const simRef = useRef<Simulation<GNode, undefined> | null>(null);

  const [sel, setSel] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<number | null>(null);

  // refs mirrored for the render loop
  const view = useRef({ k: 0.45, tx: 0, ty: 0 });
  const hoverRef = useRef<GNode | null>(null);
  const selRef = useRef<string | null>(null);
  const deg1Ref = useRef<Set<string>>(new Set());
  const deg2Ref = useRef<Set<string>>(new Set());
  const matchRef = useRef<Set<string> | null>(null);
  const groupRef = useRef<number | null>(null);
  const localeRef = useRef<Locale>(locale);
  localeRef.current = locale;
  groupRef.current = groupFilter;

  // selection → neighbor sets
  useEffect(() => {
    selRef.current = sel;
    const d1 = new Set<string>(), d2 = new Set<string>();
    if (sel) {
      for (const n of graph.adj.get(sel) || []) d1.add(n);
      for (const n of d1) for (const nn of graph.adj.get(n) || []) {
        if (nn !== sel && !d1.has(nn)) d2.add(nn);
      }
    }
    deg1Ref.current = d1;
    deg2Ref.current = d2;
  }, [sel, graph]);

  // search → match set
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { matchRef.current = null; return; }
    const zhq = query.trim();
    const s = new Set<string>();
    for (const c of COMPANIES) {
      const cat = CATEGORY_MAP[c.cat];
      if (
        c.name.toLowerCase().includes(q) || (c.zh || '').includes(zhq) ||
        c.ticker.toLowerCase().includes(q) ||
        c.role.en.toLowerCase().includes(q) || c.role.zh.includes(zhq) ||
        cat.name.toLowerCase().includes(q) || cat.zh.includes(zhq)
      ) s.add(c.id);
    }
    for (const cat of CATEGORIES) {
      if (cat.name.toLowerCase().includes(q) || cat.zh.includes(zhq)) s.add('cat:' + cat.id);
    }
    matchRef.current = s;
  }, [query]);

  const matchCount = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    // recompute cheaply for the header badge
    const zhq = q, lq = q.toLowerCase();
    let n = 0;
    for (const c of COMPANIES) {
      const cat = CATEGORY_MAP[c.cat];
      if (c.name.toLowerCase().includes(lq) || (c.zh || '').includes(zhq) || c.ticker.toLowerCase().includes(lq) ||
        c.role.en.toLowerCase().includes(lq) || c.role.zh.includes(zhq) ||
        cat.name.toLowerCase().includes(lq) || cat.zh.includes(zhq)) n++;
    }
    return n;
  }, [query]);

  const centerOn = useCallback((id: string) => {
    const n = graph.nodes.find(x => x.id === id);
    const cv = canvasRef.current;
    if (!n || !cv) return;
    const v = view.current;
    v.k = Math.max(v.k, 1.1);
    v.tx = cv.clientWidth / 2 - n.x * v.k;
    v.ty = cv.clientHeight / 2 - n.y * v.k;
  }, [graph]);

  // ---------- simulation + rendering + interaction ----------
  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    const { nodes, links } = graph;

    const sim = forceSimulation<GNode>(nodes)
      .force('link', forceLink<GNode, GLink & { index?: number }>(links as (GLink & { index?: number })[])
        .id(d => d.id)
        .distance(lk => lk.kind === 'member' ? 46 : lk.kind === 'rel' ? 120 : 210)
        .strength(lk => lk.kind === 'member' ? 0.65 : lk.kind === 'rel' ? 0.05 : 0.04))
      .force('charge', forceManyBody<GNode>().strength(d => d.kind === 'hub' ? -520 : -95).distanceMax(520))
      .force('x', forceX<GNode>(d => stageX(d.stage)).strength(d => d.kind === 'hub' ? 0.2 : 0.055))
      .force('y', forceY<GNode>(d => stageY(d.stage)).strength(d => d.kind === 'hub' ? 0.18 : 0.05))
      .force('collide', forceCollide<GNode>(d => d.r + 3.5).iterations(2))
      .stop();
    for (let i = 0; i < 380; i++) sim.tick();
    simRef.current = sim;

    // initial fit
    const fit = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      }
      const k = Math.min(w / (maxX - minX + 260), h / (maxY - minY + 260));
      view.current = { k, tx: w / 2 - k * (minX + maxX) / 2, ty: h / 2 - k * (minY + maxY) / 2 + 24 };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    fit();
    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(cv);

    // ----- render loop -----
    let raf = 0;
    const alphaOf = (n: GNode): number => {
      const m = matchRef.current, gf = groupRef.current, s = selRef.current;
      if (m) return m.has(n.id) ? 1 : 0.1;
      if (s) {
        if (n.id === s) return 1;
        if (deg1Ref.current.has(n.id)) return 1;
        if (deg2Ref.current.has(n.id)) return 0.8;
        return 0.13;
      }
      if (gf !== null) return n.group === gf ? 1 : 0.13;
      return 1;
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { k, tx, ty } = view.current;
      const w = cv.clientWidth, h = cv.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const s = selRef.current;
      const loc = localeRef.current;

      // edges
      for (const pass of ['base', 'hi'] as const) {
        for (const lk of links) {
          const a = lk.source as GNode, b = lk.target as GNode;
          const touchesSel = s !== null && (a.id === s || b.id === s);
          if (pass === 'base' && touchesSel) continue;
          if (pass === 'hi' && !touchesSel) continue;
          const x1 = a.x * k + tx, y1 = a.y * k + ty, x2 = b.x * k + tx, y2 = b.y * k + ty;
          if (Math.max(x1, x2) < -50 || Math.min(x1, x2) > w + 50 || Math.max(y1, y2) < -50 || Math.min(y1, y2) > h + 50) continue;
          let stroke = 'rgba(238,244,251,0.10)', width = Math.max(0.5, 0.8 * k);
          if (lk.kind === 'member') { stroke = 'rgba(238,244,251,0.055)'; }
          if (lk.kind === 'feed') { stroke = 'rgba(255,183,3,0.12)'; width = Math.max(0.7, 1.1 * k); }
          if (touchesSel) { stroke = 'rgba(255,183,3,0.8)'; width = Math.max(1.2, 1.4 * k); }
          else if (s || matchRef.current || groupRef.current !== null) {
            const aa = alphaOf(a), ab = alphaOf(b);
            if (Math.min(aa, ab) < 0.5) stroke = lk.kind === 'feed' ? 'rgba(255,183,3,0.04)' : 'rgba(238,244,251,0.028)';
          }
          ctx.strokeStyle = stroke;
          ctx.lineWidth = width;
          ctx.beginPath();
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.min(40 * k, Math.hypot(x2 - x1, y2 - y1) * 0.08);
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(mx, my, x2, y2);
          ctx.stroke();
        }
      }

      // nodes
      const hover = hoverRef.current;
      for (const n of nodes) {
        const x = n.x * k + tx, y = n.y * k + ty;
        const r = Math.max(2.2, n.r * k);
        if (x < -30 || x > w + 30 || y < -30 || y > h + 30) continue;
        const a = alphaOf(n);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE[n.group];
        ctx.fill();
        if (n.kind === 'hub') {
          ctx.lineWidth = Math.max(1, 1.4 * k);
          ctx.strokeStyle = 'rgba(13,27,42,0.85)';
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, r + Math.max(1.2, 1.8 * k), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(238,244,251,${0.35 * a})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        if (!n.tw && n.kind === 'company') {
          ctx.setLineDash([3, 2.4]);
          ctx.beginPath();
          ctx.arc(x, y, r + 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(238,244,251,${0.5 * a})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (n.id === s || (hover && hover.id === n.id)) {
          ctx.beginPath();
          ctx.arc(x, y, r + 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (s && deg1Ref.current.has(n.id)) {
          ctx.beginPath();
          ctx.arc(x, y, r + 2.4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,183,3,0.65)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // labels (screen-space, crisp)
      ctx.textBaseline = 'middle';
      for (const n of nodes) {
        const x = n.x * k + tx, y = n.y * k + ty;
        if (x < -160 || x > w + 160 || y < -40 || y > h + 40) continue;
        const a = alphaOf(n);
        const isHi = n.id === s || (hover && hover.id === n.id) || (s !== null && deg1Ref.current.has(n.id)) || (matchRef.current?.has(n.id) ?? false);
        const label = loc === 'zh' ? n.nameZh : n.nameEn;
        if (n.kind === 'hub') {
          if (k < 0.34 && !isHi) continue;
          ctx.font = '600 11.5px -apple-system, "PingFang TC", "Noto Sans TC", sans-serif';
          ctx.globalAlpha = Math.min(1, a + 0.08);
          ctx.fillStyle = FG;
          ctx.strokeStyle = 'rgba(13,27,42,0.9)';
          ctx.lineWidth = 3;
          const lx = x + Math.max(2.2, n.r * k) + 5;
          ctx.strokeText(label, lx, y);
          ctx.fillText(label, lx, y);
          ctx.globalAlpha = 1;
        } else {
          if (!isHi && k < 1.05) continue;
          if (a < 0.5 && !isHi) continue;
          ctx.font = '500 10.5px -apple-system, "PingFang TC", "Noto Sans TC", sans-serif';
          ctx.globalAlpha = isHi ? 1 : Math.min(0.85, a);
          ctx.fillStyle = isHi ? '#ffffff' : 'rgba(238,244,251,0.8)';
          ctx.strokeStyle = 'rgba(13,27,42,0.85)';
          ctx.lineWidth = 2.5;
          const text = isHi && n.ticker ? `${label} ${n.ticker}` : label;
          const lx = x + Math.max(2.2, n.r * k) + 4;
          ctx.strokeText(text, lx, y);
          ctx.fillText(text, lx, y);
          ctx.globalAlpha = 1;
        }
      }
    };
    draw();

    // ----- interaction -----
    let dragNode: GNode | null = null;
    let panning = false;
    let moved = 0;
    let lastX = 0, lastY = 0;

    const toWorld = (mx: number, my: number) => {
      const { k, tx, ty } = view.current;
      return { x: (mx - tx) / k, y: (my - ty) / k };
    };
    const findNode = (mx: number, my: number): GNode | null => {
      const { k } = view.current;
      const p = toWorld(mx, my);
      let best: GNode | null = null, bd = Infinity;
      for (const n of nodes) {
        const d = Math.hypot(n.x - p.x, n.y - p.y);
        const hit = Math.max(n.r + 3, 9 / k);
        if (d < hit && d < bd) { best = n; bd = d; }
      }
      return best;
    };
    const pos = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
    };

    const onDown = (e: PointerEvent) => {
      const { mx, my } = pos(e);
      cv.setPointerCapture(e.pointerId);
      moved = 0; lastX = mx; lastY = my;
      const n = findNode(mx, my);
      if (n) {
        dragNode = n;
        n.fx = n.x; n.fy = n.y;
        sim.alphaTarget(0.25).restart();
      } else {
        panning = true;
      }
    };
    const onMove = (e: PointerEvent) => {
      const { mx, my } = pos(e);
      const dx = mx - lastX, dy = my - lastY;
      if (dragNode || panning) moved += Math.abs(dx) + Math.abs(dy);
      if (dragNode) {
        const p = toWorld(mx, my);
        dragNode.fx = p.x; dragNode.fy = p.y;
      } else if (panning) {
        view.current.tx += dx; view.current.ty += dy;
      } else {
        const n = findNode(mx, my);
        hoverRef.current = n;
        cv.style.cursor = n ? 'pointer' : 'grab';
      }
      lastX = mx; lastY = my;
    };
    const onUp = (e: PointerEvent) => {
      const { mx, my } = pos(e);
      if (dragNode) {
        dragNode.fx = null; dragNode.fy = null;
        sim.alphaTarget(0);
      }
      if (moved < 5) {
        const n = findNode(mx, my);
        setSel(n ? n.id : null);
        setQuery('');
      }
      dragNode = null; panning = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = cv.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const v = view.current;
      const nk = Math.min(6, Math.max(0.2, v.k * Math.exp(-e.deltaY * 0.0012)));
      v.tx = mx - (mx - v.tx) * (nk / v.k);
      v.ty = my - (my - v.ty) * (nk / v.k);
      v.k = nk;
    };

    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      sim.stop();
      simRef.current = null;
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('wheel', onWheel);
    };
    // graph is memoized once; interaction state lives in refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // ---------- panel data ----------
  const selCompany = sel && !sel.startsWith('cat:') ? COMPANY_MAP[sel] : null;
  const selCat = sel && sel.startsWith('cat:') ? CATEGORY_MAP[sel.slice(4)] : null;
  const inbound = selCompany ? inboundRels(selCompany.id) : [];

  const navTo = (id: string) => { setSel(id); centerOn(id); };

  const chipBtn = (active: boolean) => ({
    fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 11px',
    border: active ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(255,183,3,0.12)' : 'rgba(255,255,255,0.04)',
    color: active ? '#fff' : 'rgba(238,244,251,0.7)',
  } as const);

  return (
    <div ref={wrapRef} style={{
      position: 'fixed', inset: 0, background: BG, color: FG, overflow: 'hidden',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', sans-serif",
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'grab' }} />

      {/* header overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '18px 26px 0', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" className="ss-ghost-btn" style={{ pointerEvents: 'auto', fontSize: 12, fontWeight: 600, color: 'rgba(238,244,251,0.75)', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10,20,33,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 999, padding: '7px 14px', whiteSpace: 'nowrap' }}>
            {t('backExplorer')}
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.14em' }}>SILICON STACK</span>
              <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.5)', letterSpacing: '0.28em' }}>矽鏈</span>
              <span style={{ fontSize: 12.5, color: ACCENT, fontWeight: 600 }}>{t('graphTitle')}</span>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.55)' }}>
              {TW_COUNT} {t('graphCounts')} · {TOTAL_COUNT} {t('nodes')} · {CATEGORIES.length} {t('segments')}
            </span>
          </div>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSel(null); setGroupFilter(null); }}
            placeholder={t('searchPlaceholder')}
            style={{ pointerEvents: 'auto', flex: '1 1 200px', maxWidth: 300, fontFamily: 'inherit', fontSize: 12.5, color: FG, background: 'rgba(10,20,33,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '8px 16px', outline: 'none' }}
          />
          {matchCount !== null && (
            <span style={{ fontSize: 11.5, color: ACCENT }}>{matchCount} {matchCount === 1 ? t('match') : t('matches')}</span>
          )}
          <button
            onClick={toggle}
            className="ss-ghost-btn"
            style={{ pointerEvents: 'auto', marginLeft: 'auto', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(238,244,251,0.75)', background: 'rgba(10,20,33,0.7)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '7px 14px', cursor: 'pointer' }}
          >
            {locale === 'zh' ? 'EN' : '繁中'}
          </button>
          <span style={{ fontSize: 10, color: 'rgba(238,244,251,0.45)', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(10,20,33,0.7)', borderRadius: 999, padding: '5px 10px', whiteSpace: 'nowrap' }}>
            {t('notAdvice')}
          </span>
        </div>

        {/* legend / group filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, flexWrap: 'wrap', pointerEvents: 'auto' }}>
          {GROUP_LABELS.map((g, i) => (
            <button key={i} onClick={() => { setGroupFilter(groupFilter === i ? null : i); setSel(null); }} style={chipBtn(groupFilter === i)}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: PALETTE[i], flex: 'none' }} />
              {pick(g)}
            </button>
          ))}
          {(groupFilter !== null || sel || query) && (
            <button onClick={() => { setGroupFilter(null); setSel(null); setQuery(''); }} style={{ ...chipBtn(false), color: ACCENT, borderColor: 'rgba(255,183,3,0.4)' }}>
              ✕ {t('clearFilter')}
            </button>
          )}
        </div>
      </div>

      {/* bottom hint */}
      <div style={{ position: 'absolute', left: 26, bottom: 20, zIndex: 10, fontSize: 11.5, color: 'rgba(238,244,251,0.45)', pointerEvents: 'none', maxWidth: 520, lineHeight: 1.6 }}>
        {t('graphHint')}
      </div>

      {/* detail panel */}
      {(selCompany || selCat) && (
        <div className="ss-scroll" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 372, maxWidth: '92vw', zIndex: 20, background: 'rgba(11,22,36,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderLeft: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', padding: '26px 24px', animation: 'fadeUp 0.3s ease' }}>
          <button onClick={() => setSel(null)} title={t('close')} className="ss-ghost-btn" style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.04)', color: 'rgba(238,244,251,0.8)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>

          {selCompany && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: PALETTE[STAGE_GROUP[CATEGORY_MAP[selCompany.cat].stage]], marginBottom: 8 }}>
                {locale === 'zh' ? CATEGORY_MAP[selCompany.cat].zh : CATEGORY_MAP[selCompany.cat].name}
              </div>
              <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, paddingRight: 26 }}>
                {locale === 'zh' ? (selCompany.zh ? `${selCompany.zh} ${selCompany.name}` : selCompany.name) : `${selCompany.name}${selCompany.zh ? ' ' + selCompany.zh : ''}`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '10px 0 16px' }}>
                <span style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 12, fontWeight: 600, color: '#0d1b2a', background: ACCENT, borderRadius: 6, padding: '3px 8px' }}>{selCompany.ticker}</span>
                <span style={{ fontSize: 12, color: 'rgba(238,244,251,0.6)' }}>
                  {selCompany.exch === 'TWSE' ? `TWSE ${t('listedTWSE')}` : selCompany.exch === 'TPEx' ? `TPEx ${t('listedTPEx')}` : selCompany.exch}
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(238,244,251,0.82)', marginBottom: 18 }}>{pick(selCompany.role)}</div>
              <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(238,244,251,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 20 }}>
                {pick(CATEGORY_MAP[selCompany.cat].desc)}
              </div>

              {(selCompany.rel || []).length > 0 && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(238,244,251,0.45)', marginBottom: 8 }}>{t('linkedTo')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                    {(selCompany.rel || []).map(r => (
                      <button key={r.to + r.label.en} onClick={() => navTo(r.to)} className="ss-link-btn" style={{ display: 'flex', alignItems: 'baseline', gap: 8, textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit', color: FG, width: '100%' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{locale === 'zh' ? (COMPANY_MAP[r.to]?.zh || COMPANY_MAP[r.to]?.name) : COMPANY_MAP[r.to]?.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.55)' }}>{pick(r.label)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {inbound.length > 0 && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(238,244,251,0.45)', marginBottom: 8 }}>{t('referencedBy')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                    {inbound.map(r => (
                      <button key={r.from + r.label.en} onClick={() => navTo(r.from)} className="ss-link-btn" style={{ display: 'flex', alignItems: 'baseline', gap: 8, textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit', color: FG, width: '100%' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{locale === 'zh' ? (COMPANY_MAP[r.from]?.zh || COMPANY_MAP[r.from]?.name) : COMPANY_MAP[r.from]?.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(238,244,251,0.55)' }}>{pick(r.label)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {selCat && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: PALETTE[STAGE_GROUP[selCat.stage]], marginBottom: 8 }}>
                {(() => { const st = STAGES.find(x => x.id === selCat.stage); return st ? (locale === 'zh' ? st.zh : st.name) : ''; })()}
              </div>
              <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, marginBottom: 10, paddingRight: 26 }}>
                {locale === 'zh' ? selCat.zh : selCat.name}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(238,244,251,0.82)', marginBottom: 20 }}>{pick(selCat.desc)}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(238,244,251,0.45)', marginBottom: 8 }}>
                {locale === 'zh' ? '節點成員' : 'Members'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {COMPANIES.filter(c => c.cat === selCat.id).map(c => (
                  <button key={c.id} onClick={() => navTo(c.id)} className="ss-link-btn" style={{ display: 'flex', alignItems: 'baseline', gap: 8, textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit', color: FG, width: '100%' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{locale === 'zh' ? (c.zh || c.name) : c.name}</span>
                    <span style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 10.5, color: c.exch === 'TWSE' || c.exch === 'TPEx' ? ACCENT : 'rgba(238,244,251,0.45)' }}>{c.ticker}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ fontSize: 10, color: 'rgba(238,244,251,0.4)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            {t('graphDisclaimer')}
          </div>
        </div>
      )}
    </div>
  );
}
