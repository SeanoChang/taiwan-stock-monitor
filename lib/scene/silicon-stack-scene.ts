// Silicon Stack — Three.js scene: 4 zoom levels, custom orbit controls, DOM hotspots, transitions.
// Ported from the Claude Design project to use the npm `three` module build. Bilingual hotspots.
// Public entry point: wires the renderer, level geometry, hotspots and controls together.

import * as THREE from 'three';
import { createOrbitControls } from '@/lib/scene/camera';
import { createGeometryHelpers } from '@/lib/scene/geometry';
import { mountHotspots, projectHotspots, setHotspotLocale } from '@/lib/scene/hotspots';
import { LEVEL_BUILDERS } from '@/lib/scene/levels';
import {
  applyAccent,
  createAccentRegistry,
  createGlowMaterials,
  createMaterials,
} from '@/lib/scene/materials';
import type { CamSpec, Level, LevelContext, SceneApi, SceneOptions } from '@/lib/scene/types';
import type { Locale } from '@/lib/i18n/config';

export type { SceneApi, SceneOptions } from '@/lib/scene/types';

export function createScene(opts: SceneOptions): SceneApi {
  const {
    container,
    layer,
    accent,
    autoRotate,
    onSelect,
    onLevel,
    onReady,
    onInteract,
    onDepthEnd,
  } = opts;
  let LOCALE: Locale = opts.locale || 'zh';

  const BG = 0x0d1b2a;
  let ACC = new THREE.Color(accent || '#ffb703');

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(BG);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;';

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(BG, 18, 46);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);

  // lights
  const hemi = new THREE.HemisphereLight(0x3a5570, 0x0a1220, 1.05);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(5, 9, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fa8d9, 0.55);
  rim.position.set(-6, 4, -6);
  scene.add(rim);

  // ---------- levels ----------
  const accents = createAccentRegistry();
  const M = createMaterials();
  const { GLOW, GLOWDIM } = createGlowMaterials(ACC, accents);
  const { box, cyl, shadowDisc } = createGeometryHelpers(scene);
  const ctx: LevelContext = { M, GLOW, GLOWDIM, ACC, accents, box, cyl, shadowDisc };

  const levels: Level[] = LEVEL_BUILDERS.map((build) => {
    const group = new THREE.Group();
    group.visible = false;
    scene.add(group);
    const lv: Level = {
      group,
      hotspots: [],
      descendPoint: null,
      cam: {} as CamSpec,
      fog: [18, 46],
      dom: null,
    };
    build(group, lv, ctx);
    return lv;
  });

  // ---------- hotspot DOM ----------
  mountHotspots(levels, layer, LOCALE, {
    onSelect,
    onDescend: (next) => api.goLevel(next),
  });

  // ---------- controls ----------
  let cur = -1,
    animating = false,
    cooldownUntil = 0;

  const controls = createOrbitControls({
    el: renderer.domElement,
    autoRotate,
    onInteract,
    isAnimating: () => animating,
    isBusy: () => animating || performance.now() < cooldownUntil,
    onZoomInEdge: () => {
      if (cur < levels.length - 1 && levels[cur].descendPoint) api.goLevel(cur + 1);
      else if (onDepthEnd) onDepthEnd();
    },
    onZoomOutEdge: () => {
      if (cur > 0) api.goLevel(cur - 1);
    },
  });
  const ctl = controls.ctl;

  // ---------- transition overlay ----------
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:absolute;inset:0;background:#0d1b2a;opacity:1;pointer-events:none;transition:opacity .45s ease;z-index:5;';
  container.appendChild(overlay);

  function applyLevel(i: number) {
    levels.forEach((lv, k) => {
      lv.group.visible = k === i;
      lv.dom!.style.display = k === i ? 'block' : 'none';
    });
    const lv = levels[i];
    fog.near = lv.fog[0];
    fog.far = lv.fog[1];
    controls.applyCamSpec(lv.cam);
    cur = i;
  }

  function wait(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  const api: SceneApi = {
    async goLevel(i: number) {
      i = Math.max(0, Math.min(levels.length - 1, i));
      if (animating || i === cur) return;
      animating = true;
      const down = i > cur;
      if (levels[cur]) levels[cur].dom!.style.display = 'none';
      // fly toward descend point when going down
      if (down && levels[cur] && levels[cur].descendPoint) {
        const from = ctl.r,
          to = Math.max(ctl.minR * 0.5, 0.3);
        const t0 = performance.now(),
          dur = 460;
        const startTarget = ctl.target.clone(),
          endTarget = levels[cur].descendPoint!.clone();
        overlay.style.opacity = '1';
        await new Promise<void>((res) => {
          (function step() {
            const k = Math.min(1, (performance.now() - t0) / dur);
            const e2 = k * k * (3 - 2 * k);
            ctl.r = ctl.dR = from + (to - from) * e2;
            ctl.target.lerpVectors(startTarget, endTarget, e2);
            if (k < 1) tick(step);
            else res();
          })();
        });
      } else {
        overlay.style.opacity = '1';
        await wait(430);
      }
      applyLevel(i);
      // arrival: start slightly off default and settle
      const c = levels[i].cam;
      ctl.r = ctl.dR = down ? c.maxR * 0.92 : c.minR * 1.25;
      const settleTo = c.r;
      overlay.style.opacity = '0';
      const t1 = performance.now(),
        dur2 = 850,
        r0 = ctl.r;
      await new Promise<void>((res) => {
        (function step() {
          const k = Math.min(1, (performance.now() - t1) / dur2);
          const e2 = 1 - Math.pow(1 - k, 3);
          ctl.r = ctl.dR = r0 + (settleTo - r0) * e2;
          if (k < 1) tick(step);
          else res();
        })();
      });
      levels[i].dom!.style.display = 'block';
      animating = false;
      cooldownUntil = performance.now() + 500;
      onLevel(i);
    },
    setAccent(hex: string) {
      ACC = new THREE.Color(hex);
      applyAccent(accents, ACC);
    },
    setAutoRotate(b: boolean) {
      controls.setAutoRotate(b);
    },
    setLocale(loc: Locale) {
      LOCALE = loc;
      setHotspotLocale(levels, LOCALE);
    },
    dispose() {
      disposed = true;
      renderer.dispose();
      ro.disconnect();
      // remove DOM this scene attached (keeps React strict-mode remounts clean)
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      if (overlay.parentNode === container) container.removeChild(overlay);
      levels.forEach((lv) => {
        if (lv.dom && lv.dom.parentNode === layer) layer.removeChild(lv.dom);
      });
    },
  };

  // ---------- render loop ----------
  let disposed = false;
  // rAF is throttled/paused in hidden documents — race it against a timeout so
  // boot, tweens and rendering always make progress.
  function tick(cb: () => void) {
    let done = false;
    const fire = () => {
      if (!done) {
        done = true;
        cb();
      }
    };
    requestAnimationFrame(fire);
    setTimeout(fire, 55);
  }

  function frame() {
    if (disposed) return;
    tick(frame);
    controls.update(camera);
    renderer.render(scene, camera);
    // hotspot projection
    if (cur >= 0 && !animating) projectHotspots(levels[cur].hotspots, camera, container);
  }

  // resize
  function resize() {
    const w = container.clientWidth || 1,
      h = container.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  applyLevel(opts.startLevel || 0);
  ctl.r = ctl.dR = levels[cur].cam.r * 1.15;
  frame();
  // boot: fire immediately after the first synchronous render — never gate on rAF
  overlay.style.opacity = '0';
  {
    const c = levels[cur].cam;
    const t0 = performance.now(),
      r0 = ctl.r;
    (function settle() {
      const k = Math.min(1, (performance.now() - t0) / 900);
      ctl.r = ctl.dR = r0 + (c.r - r0) * (1 - Math.pow(1 - k, 3));
      if (k < 1 && !disposed) tick(settle);
    })();
  }
  onLevel(cur);
  if (onReady) onReady();

  return api;
}
