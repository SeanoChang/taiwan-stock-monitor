'use client';

// Canvas force-graph engine hook: owns the rAF loop and wires the model, force
// rig, camera, renderer and pointer interaction together. Highlight state is
// passed in and mirrored into refs so the loop never re-subscribes.
//
// The loop ticks only while the sim is hot and paints only while something is
// dirty, then parks at raf = 0. simulation.restart() is banned here — it would
// start d3's internal timer alongside this loop and double-tick the layout.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { buildGraphModel } from '@/components/graph/graph-model';
import type { GNode, GraphModel, HighlightState } from '@/components/graph/graph-model';
import {
  LAYOUT_ALPHA,
  WARMUP_TICKS,
  applyLayout,
  createSimulation,
  isHot,
  reheat,
} from '@/components/graph/graph-forces';
import type { GraphSimulation, LayoutMode } from '@/components/graph/graph-forces';
import { createCamera } from '@/components/graph/graph-camera';
import { createRenderer } from '@/components/graph/graph-renderer';
import { attachInteraction } from '@/components/graph/graph-interaction';
import type { Locale } from '@/lib/i18n/config';

export type { LayoutMode } from '@/components/graph/graph-forces';

export interface ForceGraphState extends HighlightState {
  layout?: LayoutMode;
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
  const camera = useMemo(() => createCamera(), []);

  const hover = useRef<GNode | null>(null);
  const dragging = useRef(false);
  const localeRef = useRef<Locale>(locale);
  const stateRef = useRef(state);
  const wakeRef = useRef<() => void>(() => {});
  const simRef = useRef<GraphSimulation | null>(null);
  const followRef = useRef<string | null>(null);

  const layout = state.layout ?? 'free';
  const layoutRef = useRef<LayoutMode>(layout);

  const degree1 = useMemo(() => {
    const s = new Set<string>();
    if (state.selection) for (const n of model.adjacency.get(state.selection) ?? []) s.add(n);
    return s;
  }, [state.selection, model]);
  const degree2 = useMemo(() => {
    const s = new Set<string>();
    if (!state.selection) return s;
    for (const n of degree1)
      for (const nn of model.adjacency.get(n) ?? []) {
        if (nn !== state.selection && !degree1.has(nn)) s.add(nn);
      }
    return s;
  }, [state.selection, degree1, model]);
  const degRef = useRef({ d1: degree1, d2: degree2 });
  const onPickRef = useRef(onPick);
  // mirror live values for the render loop (post-commit, per hooks rules).
  // Highlight changes alter what is painted but must never reheat the sim.
  useEffect(() => {
    localeRef.current = locale;
    stateRef.current = state;
    degRef.current = { d1: degree1, d2: degree2 };
    onPickRef.current = onPick;
    wakeRef.current();
  });

  const centerOn = useCallback(
    (id: string) => {
      const node = model.nodes.find((n) => n.id === id);
      const canvas = canvasRef.current;
      if (!node || !canvas) return;
      camera.centerOn(node, canvas.clientWidth, canvas.clientHeight);
      // hold the node in frame for the rest of the bloom — it is still drifting
      // to its equilibrium and would otherwise wander out of the centred view
      followRef.current = id;
      wakeRef.current();
    },
    [model, camera, canvasRef],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const simulation = createSimulation(model.nodes, model.links, layoutRef.current);
    simRef.current = simulation;
    const renderer = createRenderer(canvas, ctx, model);

    let raf = 0;
    let dirty = true;
    let last = 0;

    const frame = (now: number) => {
      const dt = last ? Math.min(50, now - last) : 16.67;
      last = now;
      const hot = isHot(simulation);
      if (hot) {
        simulation.tick();
        dirty = true;
      }
      if (followRef.current) {
        const node = hot ? model.nodes.find((n) => n.id === followRef.current) : null;
        if (node) {
          camera.centerOn(node, canvas.clientWidth, canvas.clientHeight);
          dirty = true;
        } else followRef.current = null;
      }
      if (dirty)
        dirty = renderer.draw({
          view: camera.view,
          k0: camera.k0,
          locale: localeRef.current,
          state: stateRef.current,
          degree1: degRef.current.d1,
          degree2: degRef.current.d2,
          hover: hover.current,
          dt,
        });
      raf = hot || dragging.current || dirty ? requestAnimationFrame(frame) : 0;
      if (!raf) last = 0;
    };
    const wake = () => {
      dirty = true;
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    wakeRef.current = wake;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wake();
    };

    // warm up out of view, then fix the camera once and let the rest of the
    // bloom animate inside a stable frame
    for (let i = 0; i < WARMUP_TICKS; i++) simulation.tick();
    resize();
    camera.fit(model.nodes, canvas.clientWidth, canvas.clientHeight);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const detach = attachInteraction({
      canvas,
      model,
      camera,
      simulation,
      hover,
      dragging,
      onPick: (id) => onPickRef.current(id),
      onUserInput: () => {
        followRef.current = null;
      },
      wake,
    });
    wake();

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      wakeRef.current = () => {};
      simRef.current = null;
      observer.disconnect();
      simulation.stop();
      detach();
    };
  }, [model, camera, canvasRef]);

  useEffect(() => {
    const simulation = simRef.current;
    const changed = layoutRef.current !== layout;
    layoutRef.current = layout;
    if (!simulation || !changed) return;
    applyLayout(simulation, layout);
    reheat(simulation, LAYOUT_ALPHA);
    wakeRef.current();
  }, [layout]);

  return { model, degree1, degree2, centerOn };
}
