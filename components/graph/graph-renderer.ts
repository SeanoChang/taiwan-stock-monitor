// Canvas painter for the graph: edges, nodes, labels and the highlight / hover
// fade math. Pure draw — it never ticks the simulation, so hover and zoom can
// repaint without reheating the layout. Returns true while eased fades are
// still in flight, which is what keeps the rAF loop alive and then parks it.

import { ACCENT, INK, PALETTE } from '@/components/graph/graph-model';
import type { GNode, GraphModel, HighlightState } from '@/components/graph/graph-model';
import type { View } from '@/components/graph/graph-camera';
import type { Locale } from '@/lib/i18n/config';

const BG_STROKE = 'rgba(13,27,42,0.85)';
/** resting alpha for everything outside the hovered neighbourhood */
const HOVER_DIM = 0.2;
const HOVER_LABEL_SHIFT = 15;
/** per-kind label fade offset: hubs are the wayfinding layer, companies resolve
 *  on zoom. Lower ⇒ labels appear sooner. */
const TEXT_FADE: Record<GNode['kind'], number> = { hub: -1.6, company: 1 };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export interface RenderFrame {
  view: View;
  k0: number;
  locale: Locale;
  state: HighlightState;
  degree1: Set<string>;
  degree2: Set<string>;
  hover: GNode | null;
  /** ms since the last painted frame, for frame-rate independent easing */
  dt: number;
}

export interface Renderer {
  draw(frame: RenderFrame): boolean;
}

export function createRenderer(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  model: GraphModel,
): Renderer {
  const { nodes, links, adjacency } = model;
  let labelShift = 0;

  const draw = (frame: RenderFrame): boolean => {
    const { view, k0, locale, state, degree1, degree2, hover, dt } = frame;
    const { k, tx, ty } = view;
    const { selection, matches, groupFilter } = state;
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // hover dimming is the lightweight preview of what clicking will show, so
    // it yields to any committed highlight channel rather than stacking on it
    const hoverDim =
      hover !== null && selection === null && matches === null && groupFilter === null;
    const near = hover ? adjacency.get(hover.id) : null;
    const isNear = (n: GNode) => !hover || n.id === hover.id || (near?.has(n.id) ?? false);

    // nodes ease, links snap — the asymmetry is load-bearing for the feel
    const f = 1 - Math.pow(0.9, dt / 16.67);
    let fading = false;
    for (const n of nodes) {
      const target = hoverDim && !isNear(n) ? HOVER_DIM : 1;
      const diff = target - n.fade;
      if (Math.abs(diff) > 0.004) {
        n.fade += diff * f;
        fading = true;
      } else n.fade = target;
    }
    const shiftTarget = hover ? HOVER_LABEL_SHIFT : 0;
    if (Math.abs(shiftTarget - labelShift) > 0.05) {
      labelShift += (shiftTarget - labelShift) * f;
      fading = true;
    } else labelShift = shiftTarget;

    const alphaOf = (n: GNode): number => {
      if (matches) return matches.has(n.id) ? 1 : 0.1;
      if (selection) {
        if (n.id === selection) return 1;
        if (degree1.has(n.id)) return 1;
        if (degree2.has(n.id)) return 0.8;
        return 0.13;
      }
      if (groupFilter !== null) return n.group === groupFilter ? 1 : 0.13;
      return 1;
    };
    const finalAlpha = (n: GNode) => alphaOf(n) * (hoverDim ? n.fade : 1);

    const kr = k / k0;
    const linkZoomAlpha = clamp01(2 * (kr - 0.3));
    const focusId = selection ?? (hoverDim && hover ? hover.id : null);

    // edges: base pass, then focus-touching pass on top
    for (const pass of ['base', 'hi'] as const) {
      if (pass === 'base' && linkZoomAlpha <= 0.01) continue;
      for (const link of links) {
        const a = link.source as GNode,
          b = link.target as GNode;
        const touchesFocus = focusId !== null && (a.id === focusId || b.id === focusId);
        if ((pass === 'hi') !== touchesFocus) continue;
        const x1 = a.x * k + tx,
          y1 = a.y * k + ty,
          x2 = b.x * k + tx,
          y2 = b.y * k + ty;
        if (
          Math.max(x1, x2) < -50 ||
          Math.min(x1, x2) > w + 50 ||
          Math.max(y1, y2) < -50 ||
          Math.min(y1, y2) > h + 50
        )
          continue;
        let stroke = 'rgba(238,244,251,0.10)';
        let width = Math.max(0.5, 0.8 * k);
        if (link.kind === 'member') stroke = 'rgba(238,244,251,0.055)';
        if (link.kind === 'feed') {
          stroke = 'rgba(255,183,3,0.12)';
          width = Math.max(0.7, 1.1 * k);
        }
        // the trace stays readable at any zoom; everything else fades out
        let alpha = touchesFocus ? 1 : linkZoomAlpha;
        if (touchesFocus) {
          stroke = 'rgba(255,183,3,0.8)';
          width = Math.max(1.2, 1.4 * k);
        } else if (hoverDim) {
          alpha *= HOVER_DIM;
        } else if (selection || matches || groupFilter !== null) {
          if (Math.min(alphaOf(a), alphaOf(b)) < 0.5) {
            stroke = link.kind === 'feed' ? 'rgba(255,183,3,0.04)' : 'rgba(238,244,251,0.028)';
          }
        }
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.beginPath();
        const mx = (x1 + x2) / 2,
          my = (y1 + y2) / 2 - Math.min(40 * k, Math.hypot(x2 - x1, y2 - y1) * 0.08);
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(mx, my, x2, y2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // nodes
    for (const n of nodes) {
      const x = n.x * k + tx,
        y = n.y * k + ty;
      const r = Math.max(2.2, n.r * k);
      if (x < -30 || x > w + 30 || y < -30 || y > h + 30) continue;
      const alpha = finalAlpha(n);
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
      if (n.id === selection || hover?.id === n.id) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (selection && degree1.has(n.id)) {
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
      const x = n.x * k + tx,
        y = n.y * k + ty;
      if (x < -160 || x > w + 160 || y < -40 || y > h + 40) continue;
      const highlighted =
        n.id === selection ||
        hover?.id === n.id ||
        (selection !== null && degree1.has(n.id)) ||
        (matches?.has(n.id) ?? false);
      // a hovered or traced label reads regardless of zoom — that is what makes
      // hover-scanning work while zoomed out past the fade threshold
      const labelA = highlighted
        ? 1
        : clamp01(Math.log2(kr) + 1 - TEXT_FADE[n.kind]) * finalAlpha(n);
      if (labelA < 0.02) continue;
      const label = locale === 'zh' ? n.nameZh : n.nameEn;
      const lx =
        x +
        Math.max(2.2, n.r * k) +
        (n.kind === 'hub' ? 5 : 4) +
        (hover?.id === n.id ? labelShift : 0);
      if (n.kind === 'hub') {
        ctx.font = '600 11.5px var(--font-geist-sans), -apple-system, "PingFang TC", sans-serif';
        ctx.globalAlpha = Math.min(1, labelA + 0.08);
        ctx.fillStyle = INK;
        ctx.strokeStyle = 'rgba(13,27,42,0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(label, lx, y);
        ctx.fillText(label, lx, y);
      } else {
        ctx.font = '500 10.5px var(--font-geist-sans), -apple-system, "PingFang TC", sans-serif';
        ctx.globalAlpha = highlighted ? 1 : Math.min(0.85, labelA);
        ctx.fillStyle = highlighted ? '#ffffff' : 'rgba(238,244,251,0.8)';
        ctx.strokeStyle = BG_STROKE;
        ctx.lineWidth = 2.5;
        const text = highlighted && n.ticker ? `${label} ${n.ticker}` : label;
        ctx.strokeText(text, lx, y);
        ctx.fillText(text, lx, y);
      }
      ctx.globalAlpha = 1;
    }

    return fading;
  };

  return { draw };
}
