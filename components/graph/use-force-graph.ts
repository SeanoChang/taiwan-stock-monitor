'use client';

// Canvas force-graph engine hook: owns the d3-force simulation, the render
// loop, and pan/zoom/drag/hover/click interaction. Highlight state (selection,
// search matches, group filter) is passed in and mirrored into refs so the
// render loop never re-subscribes.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import {
  forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY,
} from 'd3-force';
import { ACCENT, INK, PALETTE, buildGraphModel, stageX, stageY } from '@/components/graph/graph-model';
import type { GLink, GNode, GraphModel } from '@/components/graph/graph-model';
import type { Locale } from '@/lib/i18n/config';

const BG_STROKE = 'rgba(13,27,42,0.85)';
const PRERUN_TICKS = 380;
const ZOOM_RANGE = [0.2, 6] as const;

export interface ForceGraphState {
  selection: string | null;
  matches: Set<string> | null;
  groupFilter: number | null;
}

export interface ForceGraphHandle {
  model: GraphModel;
  degree1: Set<string>;
  degree2: Set<string>;
  centerOn: (id: string) => void;
}

export function useForceGraph(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  locale: Locale,
  state: ForceGraphState,
  onPick: (id: string | null) => void,
): ForceGraphHandle {
  const model = useMemo(() => buildGraphModel(), []);

  const view = useRef({ k: 0.45, tx: 0, ty: 0 });
  const hover = useRef<GNode | null>(null);
  const localeRef = useRef<Locale>(locale);

  const stateRef = useRef(state);
  const degree1 = useMemo(() => {
    const s = new Set<string>();
    if (state.selection) for (const n of model.adjacency.get(state.selection) ?? []) s.add(n);
    return s;
  }, [state.selection, model]);
  const degree2 = useMemo(() => {
    const s = new Set<string>();
    if (!state.selection) return s;
    for (const n of degree1) for (const nn of model.adjacency.get(n) ?? []) {
      if (nn !== state.selection && !degree1.has(nn)) s.add(nn);
    }
    return s;
  }, [state.selection, degree1, model]);
  const degRef = useRef({ d1: degree1, d2: degree2 });
  const onPickRef = useRef(onPick);
  // mirror live values for the render loop (post-commit, per hooks rules)
  useEffect(() => {
    localeRef.current = locale;
    stateRef.current = state;
    degRef.current = { d1: degree1, d2: degree2 };
    onPickRef.current = onPick;
  });

  const centerOn = useCallback((id: string) => {
    const node = model.nodes.find(n => n.id === id);
    const canvas = canvasRef.current;
    if (!node || !canvas) return;
    const v = view.current;
    v.k = Math.max(v.k, 1.1);
    v.tx = canvas.clientWidth / 2 - node.x * v.k;
    v.ty = canvas.clientHeight / 2 - node.y * v.k;
  }, [model, canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { nodes, links } = model;

    const simulation = forceSimulation<GNode>(nodes)
      .force('link', forceLink<GNode, GLink & { index?: number }>(links as (GLink & { index?: number })[])
        .id(d => d.id)
        .distance(lk => (lk.kind === 'member' ? 46 : lk.kind === 'rel' ? 120 : 210))
        .strength(lk => (lk.kind === 'member' ? 0.65 : lk.kind === 'rel' ? 0.05 : 0.04)))
      .force('charge', forceManyBody<GNode>().strength(d => (d.kind === 'hub' ? -520 : -95)).distanceMax(520))
      .force('x', forceX<GNode>(d => stageX(d.stage)).strength(d => (d.kind === 'hub' ? 0.2 : 0.055)))
      .force('y', forceY<GNode>(d => stageY(d.stage)).strength(d => (d.kind === 'hub' ? 0.18 : 0.05)))
      .force('collide', forceCollide<GNode>(d => d.r + 3.5).iterations(2))
      .stop();
    for (let i = 0; i < PRERUN_TICKS; i++) simulation.tick();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const fit = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      }
      const k = Math.min(w / (maxX - minX + 260), h / (maxY - minY + 260));
      view.current = { k, tx: w / 2 - k * (minX + maxX) / 2, ty: h / 2 - k * (minY + maxY) / 2 + 24 };
    };
    resize();
    fit();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const alphaOf = (n: GNode): number => {
      const { matches, groupFilter, selection } = stateRef.current;
      if (matches) return matches.has(n.id) ? 1 : 0.1;
      if (selection) {
        if (n.id === selection) return 1;
        if (degRef.current.d1.has(n.id)) return 1;
        if (degRef.current.d2.has(n.id)) return 0.8;
        return 0.13;
      }
      if (groupFilter !== null) return n.group === groupFilter ? 1 : 0.13;
      return 1;
    };

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { k, tx, ty } = view.current;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const { selection, matches, groupFilter } = stateRef.current;
      const loc = localeRef.current;
      ctx.clearRect(0, 0, w, h);

      // edges: base pass, then selection-touching pass on top
      for (const pass of ['base', 'hi'] as const) {
        for (const link of links) {
          const a = link.source as GNode, b = link.target as GNode;
          const touchesSel = selection !== null && (a.id === selection || b.id === selection);
          if ((pass === 'hi') !== touchesSel) continue;
          const x1 = a.x * k + tx, y1 = a.y * k + ty, x2 = b.x * k + tx, y2 = b.y * k + ty;
          if (Math.max(x1, x2) < -50 || Math.min(x1, x2) > w + 50 || Math.max(y1, y2) < -50 || Math.min(y1, y2) > h + 50) continue;
          let stroke = 'rgba(238,244,251,0.10)';
          let width = Math.max(0.5, 0.8 * k);
          if (link.kind === 'member') stroke = 'rgba(238,244,251,0.055)';
          if (link.kind === 'feed') { stroke = 'rgba(255,183,3,0.12)'; width = Math.max(0.7, 1.1 * k); }
          if (touchesSel) { stroke = 'rgba(255,183,3,0.8)'; width = Math.max(1.2, 1.4 * k); }
          else if (selection || matches || groupFilter !== null) {
            if (Math.min(alphaOf(a), alphaOf(b)) < 0.5) {
              stroke = link.kind === 'feed' ? 'rgba(255,183,3,0.04)' : 'rgba(238,244,251,0.028)';
            }
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
      for (const n of nodes) {
        const x = n.x * k + tx, y = n.y * k + ty;
        const r = Math.max(2.2, n.r * k);
        if (x < -30 || x > w + 30 || y < -30 || y > h + 30) continue;
        const alpha = alphaOf(n);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE[n.group];
        ctx.fill();
        if (n.kind === 'hub') {
          ctx.lineWidth = Math.max(1, 1.4 * k);
          ctx.strokeStyle = BG_STROKE;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, r + Math.max(1.2, 1.8 * k), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(238,244,251,${0.35 * alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        if (!n.tw && n.kind === 'company') {
          ctx.setLineDash([3, 2.4]);
          ctx.beginPath();
          ctx.arc(x, y, r + 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(238,244,251,${0.5 * alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (n.id === selection || hover.current?.id === n.id) {
          ctx.beginPath();
          ctx.arc(x, y, r + 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (selection && degRef.current.d1.has(n.id)) {
          ctx.beginPath();
          ctx.arc(x, y, r + 2.4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,183,3,0.65)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // labels (screen-space for crispness)
      ctx.textBaseline = 'middle';
      for (const n of nodes) {
        const x = n.x * k + tx, y = n.y * k + ty;
        if (x < -160 || x > w + 160 || y < -40 || y > h + 40) continue;
        const alpha = alphaOf(n);
        const highlighted = n.id === selection || hover.current?.id === n.id
          || (selection !== null && degRef.current.d1.has(n.id)) || (matches?.has(n.id) ?? false);
        const label = loc === 'zh' ? n.nameZh : n.nameEn;
        const lx = x + Math.max(2.2, n.r * k) + (n.kind === 'hub' ? 5 : 4);
        if (n.kind === 'hub') {
          if (k < 0.34 && !highlighted) continue;
          ctx.font = '600 11.5px var(--font-geist-sans), -apple-system, "PingFang TC", sans-serif';
          ctx.globalAlpha = Math.min(1, alpha + 0.08);
          ctx.fillStyle = INK;
          ctx.strokeStyle = 'rgba(13,27,42,0.9)';
          ctx.lineWidth = 3;
          ctx.strokeText(label, lx, y);
          ctx.fillText(label, lx, y);
        } else {
          if ((!highlighted && k < 1.05) || (alpha < 0.5 && !highlighted)) continue;
          ctx.font = '500 10.5px var(--font-geist-sans), -apple-system, "PingFang TC", sans-serif';
          ctx.globalAlpha = highlighted ? 1 : Math.min(0.85, alpha);
          ctx.fillStyle = highlighted ? '#ffffff' : 'rgba(238,244,251,0.8)';
          ctx.strokeStyle = BG_STROKE;
          ctx.lineWidth = 2.5;
          const text = highlighted && n.ticker ? `${label} ${n.ticker}` : label;
          ctx.strokeText(text, lx, y);
          ctx.fillText(text, lx, y);
        }
        ctx.globalAlpha = 1;
      }
    };
    draw();

    // ---- interaction ----
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
      let best: GNode | null = null;
      let bestDist = Infinity;
      for (const n of nodes) {
        const d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d < Math.max(n.r + 3, 9 / k) && d < bestDist) { best = n; bestDist = d; }
      }
      return best;
    };
    const eventPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      const { mx, my } = eventPos(e);
      canvas.setPointerCapture(e.pointerId);
      moved = 0; lastX = mx; lastY = my;
      const n = findNode(mx, my);
      if (n) {
        dragNode = n;
        n.fx = n.x; n.fy = n.y;
        simulation.alphaTarget(0.25).restart();
      } else {
        panning = true;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      const { mx, my } = eventPos(e);
      const dx = mx - lastX, dy = my - lastY;
      if (dragNode || panning) moved += Math.abs(dx) + Math.abs(dy);
      if (dragNode) {
        const p = toWorld(mx, my);
        dragNode.fx = p.x; dragNode.fy = p.y;
      } else if (panning) {
        view.current.tx += dx; view.current.ty += dy;
      } else {
        hover.current = findNode(mx, my);
        canvas.style.cursor = hover.current ? 'pointer' : 'grab';
      }
      lastX = mx; lastY = my;
    };
    const onPointerUp = (e: PointerEvent) => {
      const { mx, my } = eventPos(e);
      if (dragNode) {
        dragNode.fx = null; dragNode.fy = null;
        simulation.alphaTarget(0);
      }
      if (moved < 5) onPickRef.current(findNode(mx, my)?.id ?? null);
      dragNode = null;
      panning = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const v = view.current;
      const nk = Math.min(ZOOM_RANGE[1], Math.max(ZOOM_RANGE[0], v.k * Math.exp(-e.deltaY * 0.0012)));
      v.tx = mx - (mx - v.tx) * (nk / v.k);
      v.ty = my - (my - v.ty) * (nk / v.k);
      v.k = nk;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      simulation.stop();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [model, canvasRef]);

  return { model, degree1, degree2, centerOn };
}
