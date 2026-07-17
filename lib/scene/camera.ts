// Custom orbit controls for the Silicon Stack scene: pointer drag, pinch and
// wheel zoom, damped spherical framing, and idle auto-rotate. Zooming past a
// level's radius limits reports an edge crossing so the scene can change level.

import * as THREE from 'three';
import type { CamSpec } from '@/lib/scene/types';

/** Spherical camera state; `d*` fields are the targets the live values damp toward. */
export interface ControlState {
  theta: number;
  phi: number;
  r: number;
  target: THREE.Vector3;
  dTheta: number;
  dPhi: number;
  dR: number;
  minR: number;
  maxR: number;
}

export interface OrbitControlsOptions {
  el: HTMLElement;
  autoRotate?: boolean;
  onInteract?: () => void;
  /** true while a level transition owns the camera */
  isAnimating: () => boolean;
  /** true while wheel input should be ignored (transition or post-transition cooldown) */
  isBusy: () => boolean;
  onZoomInEdge: () => void;
  onZoomOutEdge: () => void;
}

export interface OrbitControls {
  ctl: ControlState;
  applyCamSpec: (cam: CamSpec) => void;
  setAutoRotate: (b: boolean) => void;
  update: (camera: THREE.PerspectiveCamera) => void;
}

export function createOrbitControls({
  el,
  autoRotate,
  onInteract,
  isAnimating,
  isBusy,
  onZoomInEdge,
  onZoomOutEdge,
}: OrbitControlsOptions): OrbitControls {
  const ctl: ControlState = {
    theta: 0.5,
    phi: 1.1,
    r: 7,
    target: new THREE.Vector3(),
    dTheta: 0.5,
    dPhi: 1.1,
    dR: 7,
    minR: 2,
    maxR: 13,
  };
  let lastInteract = 0,
    zoomInAcc = 0,
    zoomOutAcc = 0;
  let AUTOROT = autoRotate !== false;

  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;

  function clampR(r: number) {
    return Math.min(ctl.maxR, Math.max(ctl.minR, r));
  }

  function interact() {
    lastInteract = performance.now();
    zoomInAcc = 0;
    zoomOutAcc = 0;
    if (onInteract) onInteract();
  }

  el.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    el.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const p = [...pointers.values()];
      pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    }
    interact();
  });
  el.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId)!;
    const dx = e.clientX - prev.x,
      dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      ctl.dTheta -= dx * 0.0052;
      ctl.dPhi = Math.min(1.5, Math.max(0.15, ctl.dPhi - dy * 0.0042));
      lastInteract = performance.now();
    } else if (pointers.size === 2) {
      const p = [...pointers.values()];
      const nd = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (pinchDist > 0) ctl.dR = clampR(ctl.dR * (pinchDist / nd));
      pinchDist = nd;
      lastInteract = performance.now();
    }
  });
  function endPointer(e: PointerEvent) {
    pointers.delete(e.pointerId);
    pinchDist = 0;
  }
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);

  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (isBusy()) return;
      const f = Math.exp(e.deltaY * 0.0011);
      const nr = ctl.dR * f;
      ctl.dR = clampR(nr);
      lastInteract = performance.now();
      if (onInteract) onInteract();
      // threshold crossing → level change
      if (e.deltaY < 0 && nr <= ctl.minR * 1.02) {
        zoomInAcc += -e.deltaY;
        if (zoomInAcc > 320) {
          zoomInAcc = 0;
          onZoomInEdge();
        }
      } else if (e.deltaY > 0 && nr >= ctl.maxR * 0.98) {
        zoomOutAcc += e.deltaY;
        if (zoomOutAcc > 320) {
          zoomOutAcc = 0;
          onZoomOutEdge();
        }
      } else {
        zoomInAcc = 0;
        zoomOutAcc = 0;
      }
    },
    { passive: false },
  );

  return {
    ctl,
    applyCamSpec(cam: CamSpec) {
      ctl.target.copy(cam.target);
      ctl.minR = cam.minR;
      ctl.maxR = cam.maxR;
      ctl.theta = ctl.dTheta = cam.theta;
      ctl.phi = ctl.dPhi = cam.phi;
    },
    setAutoRotate(b: boolean) {
      AUTOROT = b !== false;
    },
    update(camera: THREE.PerspectiveCamera) {
      // idle auto-rotate
      if (AUTOROT && !isAnimating() && performance.now() - lastInteract > 4000)
        ctl.dTheta += 0.0011;
      // damping
      ctl.theta += (ctl.dTheta - ctl.theta) * 0.1;
      ctl.phi += (ctl.dPhi - ctl.phi) * 0.1;
      ctl.r += (ctl.dR - ctl.r) * 0.12;
      camera.position.set(
        ctl.target.x + ctl.r * Math.sin(ctl.phi) * Math.sin(ctl.theta),
        ctl.target.y + ctl.r * Math.cos(ctl.phi),
        ctl.target.z + ctl.r * Math.sin(ctl.phi) * Math.cos(ctl.theta),
      );
      camera.lookAt(ctl.target);
    },
  };
}
