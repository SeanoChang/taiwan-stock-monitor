// Camera for the graph canvas: view transform, data-driven fit(), screen↔world
// conversion, pan and cursor-anchored zoom. k0 is the scale fit() produced —
// the zoom-dependent fades are expressed relative to it, not to absolute k.

import type { GNode } from '@/components/graph/graph-model';

const ZOOM_RANGE = [0.2, 6] as const;
/** deep-linked nodes arrive zoomed in far enough for their label to be legible */
const CENTER_ZOOM = 2.2;

export interface View {
  k: number;
  tx: number;
  ty: number;
}

export interface Camera {
  readonly view: View;
  readonly k0: number;
  fit(nodes: GNode[], w: number, h: number): void;
  toWorld(mx: number, my: number): { x: number; y: number };
  panBy(dx: number, dy: number): void;
  zoomAt(mx: number, my: number, deltaY: number): void;
  centerOn(node: GNode, w: number, h: number): void;
}

export function createCamera(): Camera {
  const view: View = { k: 0.45, tx: 0, ty: 0 };
  let k0 = view.k;

  return {
    get view() {
      return view;
    },
    get k0() {
      return k0;
    },
    fit(nodes, w, h) {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
      }
      if (!Number.isFinite(minX) || w <= 0 || h <= 0) return;
      const k = Math.min(w / (maxX - minX + 260), h / (maxY - minY + 260));
      k0 = k;
      view.k = k;
      view.tx = w / 2 - (k * (minX + maxX)) / 2;
      view.ty = h / 2 - (k * (minY + maxY)) / 2 + 24;
    },
    toWorld(mx, my) {
      return { x: (mx - view.tx) / view.k, y: (my - view.ty) / view.k };
    },
    panBy(dx, dy) {
      view.tx += dx;
      view.ty += dy;
    },
    zoomAt(mx, my, deltaY) {
      const nk = Math.min(
        ZOOM_RANGE[1],
        Math.max(ZOOM_RANGE[0], view.k * Math.exp(-deltaY * 0.0012)),
      );
      view.tx = mx - (mx - view.tx) * (nk / view.k);
      view.ty = my - (my - view.ty) * (nk / view.k);
      view.k = nk;
    },
    centerOn(node, w, h) {
      view.k = Math.min(ZOOM_RANGE[1], Math.max(view.k, k0 * CENTER_ZOOM));
      view.tx = w / 2 - node.x * view.k;
      view.ty = h / 2 - node.y * view.k;
    },
  };
}
