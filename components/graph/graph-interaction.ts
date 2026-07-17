// Pointer interaction for the graph canvas: drag, pan, hover and click-to-pick.
// A dragged node is released back into the simulation on drop, never pinned —
// that one choice is what separates a diagram editor from a playful toy.
// Every handler that changes anything ends in wake().

import { DRAG_ALPHA, reheat } from '@/components/graph/graph-forces';
import type { GraphSimulation } from '@/components/graph/graph-forces';
import type { Camera } from '@/components/graph/graph-camera';
import type { GNode, GraphModel } from '@/components/graph/graph-model';

/** squared px of pointer travel that turns a click into a drag */
const CLICK_SLOP_SQ = 25;

export interface InteractionDeps {
  canvas: HTMLCanvasElement;
  model: GraphModel;
  camera: Camera;
  simulation: GraphSimulation;
  hover: { current: GNode | null };
  dragging: { current: boolean };
  onPick: (id: string | null) => void;
  onUserInput: () => void;
  wake: () => void;
}

export function attachInteraction({
  canvas,
  model,
  camera,
  simulation,
  hover,
  dragging,
  onPick,
  onUserInput,
  wake,
}: InteractionDeps): () => void {
  let dragNode: GNode | null = null;
  let downPos: { x: number; y: number } | null = null;
  let panning = false;
  let lastX = 0,
    lastY = 0;

  const eventPos = (e: { clientX: number; clientY: number }) => {
    const rect = canvas.getBoundingClientRect();
    return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
  };
  const findNode = (mx: number, my: number): GNode | null => {
    const { k } = camera.view;
    const p = camera.toWorld(mx, my);
    let best: GNode | null = null;
    let bestDist = Infinity;
    for (const n of model.nodes) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < Math.max(n.r + 3, 9 / k) && d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  };

  const onPointerDown = (e: PointerEvent) => {
    const { mx, my } = eventPos(e);
    canvas.setPointerCapture(e.pointerId);
    onUserInput();
    downPos = { x: mx, y: my };
    lastX = mx;
    lastY = my;
    // fx/fy are deferred to the first move, so a plain click never perturbs
    // the layout
    const n = findNode(mx, my);
    if (n) dragNode = n;
    else panning = true;
  };

  const onPointerMove = (e: PointerEvent) => {
    const { mx, my } = eventPos(e);
    const dx = mx - lastX,
      dy = my - lastY;
    lastX = mx;
    lastY = my;
    // squared displacement from pointerdown, not accumulated path length
    if (downPos && (mx - downPos.x) ** 2 + (my - downPos.y) ** 2 > CLICK_SLOP_SQ) downPos = null;
    if (dragNode) {
      const p = camera.toWorld(mx, my);
      dragNode.fx = p.x;
      dragNode.fy = p.y;
      dragging.current = true;
      // raise alpha AND hold it there: alphaTarget alone ramps in over ~2s
      reheat(simulation, DRAG_ALPHA);
      simulation.alphaTarget(DRAG_ALPHA);
    } else if (panning) {
      camera.panBy(dx, dy);
    } else {
      const n = findNode(mx, my);
      if (n === hover.current) return;
      hover.current = n;
      canvas.style.cursor = n ? 'pointer' : 'grab';
    }
    wake();
  };

  const onPointerUp = (e: PointerEvent) => {
    const { mx, my } = eventPos(e);
    if (dragNode) {
      dragNode.fx = null;
      dragNode.fy = null;
      simulation.alphaTarget(0);
    }
    if (downPos) onPick(findNode(mx, my)?.id ?? null);
    dragNode = null;
    downPos = null;
    panning = false;
    dragging.current = false;
    wake();
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const { mx, my } = eventPos(e);
    onUserInput();
    camera.zoomAt(mx, my, e.deltaY);
    wake();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
  };
}
