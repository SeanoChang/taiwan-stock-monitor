// Silicon Stack — Three.js scene: 4 zoom levels, custom orbit controls, DOM hotspots, transitions.
// Ported from the Claude Design project to use the npm `three` module build. Bilingual hotspots.
// Public entry point: wires the renderer, level geometry, hotspots and controls together.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
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
import { ALL_PART_IDS, createPartRegistry } from '@/lib/scene/parts';
import type { CamSpec, Level, LevelContext, SceneApi, SceneOptions } from '@/lib/scene/types';
import type { Locale } from '@/lib/i18n/config';

export type { SceneApi, SceneOptions } from '@/lib/scene/types';

/** Resolves the post-stack toggle: `opts.fx === false` forces it off (an
 * explicit low-device-tier flag); otherwise `?fx=0`/`?fx=false` in the
 * current URL disables it; anything else (including no query param at all)
 * leaves it on. createScene always runs client-side (use-scene.ts import()s
 * it inside a mount effect), so `window` is safe to read here, but the check
 * stays guarded in case a future caller ever calls this from a non-browser
 * context. */
function resolveFx(explicit: boolean | undefined): boolean {
  if (explicit === false) return false;
  if (explicit === true) return true;
  if (typeof window !== 'undefined' && window.location) {
    const q = new URLSearchParams(window.location.search).get('fx');
    if (q === '0' || q === 'false') return false;
  }
  return true;
}

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

  // ---------- image-based lighting ----------
  // Procedural PMREM studio env (three@0.152's built-in `RoomEnvironment` —
  // no binary HDRI asset) so every PBR material gets physically-plausible
  // specular + diffuse IBL instead of punctual lights alone. The
  // generator and its source room scene are one-shot bake inputs — both are
  // disposed immediately after `scene.environment` is set; only the baked
  // PMREM texture is kept alive (and is released in api.dispose() below).
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envRoom = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(envRoom, 0.04).texture;
  envRoom.dispose();
  pmremGenerator.dispose();

  // lights — trimmed now that the env above supplies ambient/specular fill,
  // so the scene doesn't blow out once the PBR materials below start
  // reflecting it; still the same key + rim + hemi arrangement as before.
  const hemi = new THREE.HemisphereLight(0x3a5570, 0x0a1220, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(5, 9, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fa8d9, 0.4);
  rim.position.set(-6, 4, -6);
  scene.add(rim);

  // ---------- post stack (bloom + SMAA) behind ?fx ----------
  // WebGL-render-path only: orbit/hotspot behavior is untouched, and
  // `?fx=0` (or `opts.fx === false`) yields the plain path —
  // `renderer.render(scene, camera)` — with `composer` simply never built.
  //
  // Verified against the installed
  // three@0.152.2: `three/examples/jsm/postprocessing/OutputPass.js` does not
  // exist in this version (it landed in three.js after 0.152 — confirmed by
  // listing node_modules/three/examples/jsm/postprocessing/, which has no
  // OutputPass.js) — so it isn't used here. In its place: RenderPass already
  // bakes ACESFilmicToneMapping into the composer's first buffer for free
  // (WebGLRenderer applies each mesh material's tone-mapped chunk whenever it
  // renders — on-screen or into a target — so the scene's existing
  // `renderer.toneMapping = ACESFilmicToneMapping` from above applies here
  // too), and a final `ShaderPass(GammaCorrectionShader)` (from three@0.152's
  // examples/jsm/shaders/, also built-in) supplies the sRGB output encoding
  // that a mid-chain render target skips. Net effect at the screen — ACES
  // tone mapping + sRGB — matches what OutputPass would have produced; no new
  // npm dependency either way.
  const fx = resolveFx(opts.fx);
  let composer: EffectComposer | null = null;
  let bloomPass: UnrealBloomPass | null = null;
  let smaaPass: SMAAPass | null = null;
  let outputPass: ShaderPass | null = null;
  if (fx) {
    const w0 = container.clientWidth || 1,
      h0 = container.clientHeight || 1;
    // HalfFloat so bloom's luminance threshold/blur has HDR-ish headroom to
    // work with, per the design doc's `{ frameBufferType: THREE.HalfFloatType }`
    // (EffectComposer's ctor takes a WebGLRenderTarget, not an options bag, in
    // three@0.152 — so the type is threaded through an explicit render target
    // instead). addPass()'s own setSize() call immediately re-sizes every pass
    // to the real pixel-ratio'd dimensions below, so the exact w0/h0 given to
    // the target/passes here only matters as a placeholder.
    const renderTarget = new THREE.WebGLRenderTarget(w0, h0, { type: THREE.HalfFloatType });
    composer = new EffectComposer(renderer, renderTarget);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.addPass(new RenderPass(scene, camera));
    // Subtle — a soft highlight lift, not an HDR bloom-fest.
    bloomPass = new UnrealBloomPass(new THREE.Vector2(w0, h0), 0.25, 0.4, 0.85);
    composer.addPass(bloomPass);
    smaaPass = new SMAAPass(w0, h0);
    composer.addPass(smaaPass);
    outputPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass(outputPass);
  }

  // ---------- levels ----------
  const accents = createAccentRegistry();
  const M = createMaterials();
  const { GLOW, GLOWDIM } = createGlowMaterials(ACC, accents);
  const { box, cyl, shadowDisc } = createGeometryHelpers(scene);
  const parts = createPartRegistry();
  const ctx: LevelContext = { M, GLOW, GLOWDIM, ACC, accents, box, cyl, shadowDisc, parts };

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

  if (process.env.NODE_ENV !== 'production') {
    const missing = ALL_PART_IDS.filter((id) => !parts.has(id));
    if (missing.length) console.warn('[scene] unregistered PartIds:', missing.join(', '));
  }

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
      scene.environment?.dispose();
      // EffectComposer.dispose() only frees its own two ping-pong render
      // targets (+ its internal copy pass) — it does not walk `this.passes`,
      // so each pass we added is disposed explicitly here too (RenderPass
      // owns no GPU resources of its own — just references to scene/camera —
      // so it has nothing to dispose).
      bloomPass?.dispose();
      smaaPass?.dispose();
      outputPass?.dispose();
      composer?.dispose();
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
    if (composer) composer.render();
    else renderer.render(scene, camera);
    if (cur >= 0 && !animating) projectHotspots(levels[cur].hotspots, camera, container);
  }

  // resize
  function resize() {
    const w = container.clientWidth || 1,
      h = container.clientHeight || 1;
    // Re-apply the clamped DPR every resize so a device-pixel-ratio change
    // after mount (dragging between a retina and non-retina monitor, or a
    // browser-zoom change) stays crisp instead of blurring until remount.
    // Same min(dpr,2) cap the renderer used at init.
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    composer?.setPixelRatio(pr);
    composer?.setSize(w, h);
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
