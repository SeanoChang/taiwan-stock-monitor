// Silicon Stack — Three.js scene: 4 zoom levels, custom orbit controls, DOM hotspots, transitions.
// Ported from the Claude Design project to use the npm `three` module build. Bilingual hotspots.
// Public entry point: wires the renderer, level geometry, hotspots and controls together.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
import { activeLevelFor, evalCamera, evaluate } from '@/lib/scene/disassembly-timeline';
import { ALL_PART_IDS, createPartRegistry } from '@/lib/scene/parts';
import type {
  CamSpec,
  Level,
  LevelContext,
  PartId,
  SceneApi,
  SceneMode,
  SceneOptions,
} from '@/lib/scene/types';
import type { Locale } from '@/lib/i18n/config';

export type { SceneApi, SceneOptions } from '@/lib/scene/types';

/** True if `node` is `root` or a descendant of it (walks `.parent`). Used by
 * projectPart's occlusion raycast to ignore self-hits — a part's own anchor
 * often sits inside its own solid geometry, which would otherwise "occlude"
 * itself. */
function isInSubtree(root: THREE.Object3D, node: THREE.Object3D): boolean {
  let o: THREE.Object3D | null = node;
  while (o) {
    if (o === root) return true;
    o = o.parent;
  }
  return false;
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
  // specular + diffuse IBL instead of punctual lights alone (Phase F Task 1;
  // docs/superpowers/apple-redesign/02-high-fidelity-rendering). The
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
  // Phase C — 'explore' is the pre-existing goLevel/orbit/hotspot behavior,
  // untouched below; it stays the default until something calls
  // api.setMode('scrolly'). `scrollP` is a plain module-local number (never
  // React state) fed by api.setScrollProgress() each frame from the scroll
  // island's rAF loop — poses are re-derived from it every frame via the pure
  // evaluate(p)/evalCamera(p) timeline, so there is nothing to drift.
  let mode: SceneMode = 'explore';
  let scrollP = 0;

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

  // Phase C — the entire scrolly render path. Pure function of `p`: every
  // part pose and the camera pose are re-derived from `evaluate(p)` /
  // `evalCamera(p)` every call, so scrubbing forward then back lands on
  // exactly the same poses (no accumulation, no setState — see D-002).
  // Lid onset/offset (.32/.62) mirror BOUNDS[3]/BOUNDS[5] in
  // disassembly-timeline.ts (ch3 lid-lift through the end of ch4 board
  // explode); not imported to keep this task's file scope to
  // silicon-stack-scene.ts/types.ts/parts.ts only.
  function applyDisassembly(p: number) {
    const lv = activeLevelFor(p);
    levels.forEach((l, k) => {
      l.group.visible = k === lv;
      // Hotspots aren't projected in scrolly mode (see frame() below); hide
      // every level's DOM layer so no stale-positioned hotspot markers show.
      l.dom!.style.display = 'none';
    });
    fog.near = levels[lv].fog[0];
    fog.far = levels[lv].fog[1];

    const lidObj = parts.get('lid');
    if (lidObj) lidObj.visible = p >= 0.32 && p < 0.62;

    for (const [id, pose] of evaluate(p)) parts.applyPoseFromBase(id, pose);

    const c = evalCamera(p);
    ctl.target.set(c.target[0], c.target[1], c.target[2]);
    ctl.r = ctl.dR = c.r;
    ctl.theta = ctl.dTheta = c.theta;
    ctl.phi = ctl.dPhi = c.phi;
    // Position the camera directly from the (now drift-free, undamped) ctl
    // state — the same spherical→cartesian math controls.update() uses for
    // explore mode, applied here without its auto-rotate/pointer-damping
    // logic so the camera is an exact function of p, not of frame timing.
    camera.position.set(
      ctl.target.x + ctl.r * Math.sin(ctl.phi) * Math.sin(ctl.theta),
      ctl.target.y + ctl.r * Math.cos(ctl.phi),
      ctl.target.z + ctl.r * Math.sin(ctl.phi) * Math.cos(ctl.theta),
    );
    camera.lookAt(ctl.target);
  }

  // ---------- Phase D — part projection + throttled occlusion ----------
  // Reused scratch objects (mirrors hotspots.ts's module-level `v`/`camWorld`
  // reuse pattern) — safe because every projectPart() call fully consumes
  // them synchronously before returning, so nothing can observe a
  // mid-mutation value across calls.
  const raycaster = new THREE.Raycaster();
  const pAnchor = new THREE.Vector3();
  const pNdc = new THREE.Vector3();
  const pCamWorld = new THREE.Vector3();
  const pRayDir = new THREE.Vector3();
  // Per-id occlusion cache — raycasting every candidate part every frame is
  // wasted work (occlusion changes slowly relative to scroll/orbit speed),
  // so each id's `occluded` flag is only recomputed once per TTL.
  const occlusionCache = new Map<string, { occluded: boolean; t: number }>();
  const OCCLUSION_TTL_MS = 150;

  /** The level whose group is actually visible right now, in either mode —
   * scrolly derives it from scroll progress the same way applyDisassembly
   * does; explore just reads the current zoom level. */
  function activeLevelIndex(): number {
    return mode === 'scrolly' ? activeLevelFor(scrollP) : cur;
  }

  function projectPart(
    id: PartId,
    anchor: [number, number, number] = [0, 0, 0],
  ): { x: number; y: number; onScreen: boolean; occluded: boolean } | null {
    const obj = parts.get(id);
    if (!obj || !obj.visible) return null;

    // World anchor: the part's local-space anchor point (default its own
    // origin) carried through its current world matrix.
    obj.updateWorldMatrix(true, false);
    const w = obj.localToWorld(pAnchor.set(anchor[0], anchor[1], anchor[2]));

    // Project to px — identical NDC→px math to projectHotspots (hotspots.ts).
    const W = container.clientWidth,
      H = container.clientHeight;
    pNdc.copy(w).project(camera);
    const x = ((pNdc.x + 1) / 2) * W,
      y = ((1 - pNdc.y) / 2) * H;
    const onScreen = pNdc.z <= 1 && x >= 0 && x <= W && y >= 0 && y <= H;

    // Occlusion — throttled raycast from the camera toward the world anchor
    // against the active level's meshes only (an inactive level's group is
    // `visible = false`, and three.js's raycaster already skips invisible
    // subtrees, so this can't false-occlude against a hidden level/lid).
    const now = performance.now();
    const cached = occlusionCache.get(id);
    let occluded: boolean;
    if (cached && now - cached.t < OCCLUSION_TTL_MS) {
      occluded = cached.occluded;
    } else {
      occluded = false;
      camera.getWorldPosition(pCamWorld);
      const dist = pCamWorld.distanceTo(w);
      const lv = levels[activeLevelIndex()];
      if (lv && dist > 1e-6) {
        pRayDir.copy(w).sub(pCamWorld).normalize();
        raycaster.set(pCamWorld, pRayDir);
        raycaster.near = 0;
        raycaster.far = dist;
        const hits = raycaster.intersectObject(lv.group, true);
        // "Meaningfully closer" margin, scaled with distance so it holds
        // across the scene's very different zoom levels (rack vs. die) —
        // and skip hits inside the anchored part's own subtree, since the
        // anchor commonly sits inside (not on the surface of) its geometry.
        const eps = Math.max(0.08, dist * 0.015);
        occluded = hits.some((h) => h.distance < dist - eps && !isInSubtree(obj, h.object));
      }
      occlusionCache.set(id, { occluded, t: now });
    }

    return { x, y, onScreen, occluded };
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
    applyPose: (id, pose) => parts.applyPose(id, pose),
    getPart: (id) => parts.get(id),
    setMode(m: SceneMode) {
      if (mode === m) return;
      mode = m;
      // 'explore' has no reset work here (review finding — dead branch
      // removed): the only caller that hands off scrolly→explore
      // (components/explorer/scrolly/scrolly-stage.tsx's handleHandoff)
      // calls this immediately before unmounting ScrollyStage, which disposes
      // this exact scene instance and mounts a brand-new one via
      // use-scene.ts/SiliconStackExplorer — a fresh scene that starts every
      // part at its registered base pose already, with nothing to reset. If
      // a future caller ever flips scrolly→explore *without* disposing the
      // scene, this branch would need to come back.
      if (m === 'scrolly') {
        // Scrolly owns the camera every frame via applyDisassembly(); disable
        // auto-rotate/idle-drift and make sure no explore-mode level
        // transition is left mid-flight fighting for ctl state.
        controls.setAutoRotate(false);
        animating = false;
      }
    },
    setScrollProgress(p: number) {
      scrollP = p;
    },
    projectPart,
    dispose() {
      disposed = true;
      scene.environment?.dispose();
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
    if (mode === 'scrolly') applyDisassembly(scrollP);
    else controls.update(camera);
    renderer.render(scene, camera);
    // hotspot projection — explore mode only (scrolly hides every level's DOM
    // layer in applyDisassembly, but skip the projection work entirely too).
    if (mode === 'explore' && cur >= 0 && !animating)
      projectHotspots(levels[cur].hotspots, camera, container);
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
