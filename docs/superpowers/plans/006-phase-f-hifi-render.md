# Plan 006 · Phase F — High-fidelity rendering (Implementation)

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Bite-sized execution of **Phase F** of `plans/006-build-frontend-scroll-disassembly-and-multi-axis-tree.md`. Design: `apple-redesign/02-high-fidelity-rendering/*`.

**Goal:** Lift the scene from "toyish primitives" toward "photographed, not computed" — **image-based lighting** (studio env via PMREM), a **PBR/env-intensity material pass**, a subtle **post stack** (bloom + AA) behind a `?fx=0` fallback, and a **per-chapter exposure track**. No behavior changes to explore/scrub/cards.

**Architecture (asset-free, three@0.152-safe):** three is pinned at `^0.152.2`, so instead of an external `.hdr` + the pmndrs `postprocessing`/`n8ao` deps (version-risky here), use three's **built-in** `RoomEnvironment` (procedural PMREM studio env — the research's "HDRI studio env beats punctual lights", zero binary asset) and three's **built-in** `EffectComposer` (`RenderPass` + `UnrealBloomPass` + `SMAAPass` + `OutputPass`). The Blender→glTF model pipeline stays deferred (un-modeled parts already render as primitives — the §10 incremental rule); real-HDRI/n8ao are documented follow-ups.

**Tech Stack:** three.js `0.152` (built-in examples/jsm modules), Next 16/React 19, pnpm. **No new npm dependency.**

## Global Constraints

- pnpm; branch `feat/006-phases-e-f-g`, commit directly. **No new npm dep** (use `three/examples/jsm/*`).
- **Explore mode + Phase C/D/E scrub/cards/overlays stay behavior-identical** — this is a WebGL-render-path change only; DOM hotspots/callouts/overlays are unaffected. `goLevel`/`evaluate(p)`/hotspot projection untouched.
- **`?fx=0` fallback:** the post stack must be toggleable off (URL `?fx=0` or a low-device-tier flag) → `renderer.render(scene,camera)` (today's path). Never let the composer become a hard dependency.
- **Perf:** keep `setPixelRatio(min(dpr,2))`; the composer must size to the container on resize; pause-when-hidden stays. Target 60fps desktop / 30fps mid-mobile; low tier auto-disables the post stack.
- **Verify:** `pnpm test` (all gates) + `pnpm build` + `pnpm lint` green; fidelity + perf via browser smoke (Task 4). Extend `check:timeline` for the exposure track.

## The pieces (from `02/code-renderer-hdri-postprocessing.md`, adapted)

- Env: `PMREMGenerator.fromScene(new RoomEnvironment(), 0.04)` → `scene.environment`. (Verify the `RoomEnvironment` constructor signature for 0.152.)
- Materials get `envMapIntensity` (they auto-use `scene.environment`); brushed-metal parts (`steel`/`silver`/`frame`) → `MeshPhysicalMaterial` w/ `anisotropy` for the brushed look.
- Post: `EffectComposer` (HalfFloat) → `RenderPass` → `UnrealBloomPass` (subtle: strength ≈0.25, radius 0.4, threshold 0.85) → `SMAAPass` → `OutputPass` (applies ACES tone mapping + sRGB). `frame()`: `fx ? composer.render() : renderer.render(scene,camera)`.
- Exposure: `renderer.toneMappingExposure = evalExposure(p)` in scrolly mode; explore keeps the fixed `1.06`.

---

### Task 1: Image-based lighting + PBR material pass
**Files:** Modify `lib/scene/silicon-stack-scene.ts`, `lib/scene/materials.ts`
- [ ] **Step 1** — In `createScene`, after the renderer/scene exist: build a PMREM env from `RoomEnvironment` and set `scene.environment` (dispose the PMREM generator + room scene after). Keep the existing lights but you may soften the fills (env now carries ambient). Verify the exact `three@0.152` import path (`three/examples/jsm/environments/RoomEnvironment.js`) and constructor.
- [ ] **Step 2** — In `materials.ts`, add `envMapIntensity` (~1.0–1.2) to each `std(...)` material (via the `extra` arg) so they pick up the env reflections; upgrade `steel`/`silver`/`frame` to `MeshPhysicalMaterial` with `metalness:1`, tuned `roughness`, and mild `anisotropy` (brushed aluminum). Keep the `AccentRegistry`/`applyAccent` contract intact (accent materials still `emissive`-tinted).
- [ ] **Step 3** — Verify (`pnpm build`+`lint`+`test`) and a quick `pnpm dev` look: the scene should read markedly more "metallic/lit" with reflections, explore + scrub unaffected. Commit `feat(scene): image-based lighting (RoomEnvironment PMREM) + PBR material pass`.

### Task 2: Post stack (bloom + AA) behind `?fx=0`
**Files:** Modify `lib/scene/silicon-stack-scene.ts`, `lib/scene/types.ts` (add `fx?: boolean` to `SceneOptions` if wiring a prop)
- [ ] **Step 1** — Build an `EffectComposer` (`{ frameBufferType: THREE.HalfFloatType }`) with `RenderPass` + a subtle `UnrealBloomPass` + `SMAAPass` + `OutputPass` (all from `three/examples/jsm/postprocessing/*`). Size it to the container (`setSize` + `setPixelRatio(min(dpr,2))`), and update it in the existing `resize()`. Gate on `fx` (default true; `?fx=0` in the URL, or an explicit low-tier flag, disables it). In `frame()`: `if (fx) composer.render(); else renderer.render(scene, camera);`. Dispose the composer/passes in `dispose()`.
- [ ] **Step 2** — Confirm the DOM overlays are unaffected (hotspots/callouts/branch-overlay/tier-ribbon are DOM, independent of the WebGL composer) and that `?fx=0` yields the exact prior render path. Verify `pnpm build`+`lint`; `pnpm dev` with and without `?fx=0`.
- [ ] **Step 3** — Commit `feat(scene): post stack (bloom + SMAA + ACES) behind ?fx fallback`.

### Task 3: Per-chapter exposure track
**Files:** Modify `lib/scene/disassembly-timeline.ts`, `lib/scene/silicon-stack-scene.ts`, `scripts/check-timeline.ts`
- [ ] **Step 1** — Add `EXPOSURE_TRACK` + `evalExposure(p): number` to `disassembly-timeline.ts` (a smooth, bounded track, e.g. ~1.0 hero → slightly brighter on the macro die/fins chapters → settle; clamp to a sane range like [0.8, 1.4]). Pure.
- [ ] **Step 2** — In `applyDisassembly(p)` (scrolly mode), set `renderer.toneMappingExposure = evalExposure(p)`. Explore mode leaves it at the fixed value (reset on handoff to explore).
- [ ] **Step 3** — Extend `scripts/check-timeline.ts`: assert `evalExposure(p)` is finite and within the clamp for `p ∈ {0,.25,.5,.75,1}`. Keep `check:timeline` green.
- [ ] **Step 4** — Verify + commit `feat(scene): per-chapter tone-mapping exposure track`.

### Task 4: Acceptance — fidelity + perf + fallback
- [ ] **Step 1** — Gates: `pnpm test` (all), `pnpm build`, `pnpm lint` green.
- [ ] **Step 2** — Browser smoke (Playwright/Chrome MCP, `PORT=3140 pnpm dev`): before/after-style screenshots at a couple of chapters showing the fidelity lift (reflections, subtle bloom on emissives, AO-like grounding); confirm the scene holds a smooth frame rate (rough fps check; note if any pass is a perf hog); confirm `/?fx=0` renders the plain path (no composer) and still 60fps; confirm explore mode + the scroll disassembly + cards + branch overlay all still work; 0 new console errors. Capture Lighthouse perf if the tooling allows (target ≥80) — else note it as a manual follow-up. Stop dev.
- [ ] **Step 3** — Commit any acceptance fixes `chore(scene): Phase F acceptance — fidelity + perf`.

## Self-Review
- Coverage: IBL + PBR (02/code+research §"lighting is 80%") = T1; bloom/AA post stack behind ?fx (02/code) = T2; per-chapter exposure track (02/code "timeline owns exposure") = T3; fidelity + perf ≥80 acceptance = T4. glTF pipeline + real HDRI + n8ao explicitly deferred (asset work / dep risk) — noted.
- Placeholders: the env/composer/exposure wiring is concrete against the design's code block; three@0.152 API signatures are verified by the implementer at build.
- Risk: (1) three@0.152 examples/jsm import paths — implementer verifies; (2) perf regression — `?fx=0` fallback + DPR clamp + Task 4 fps check; (3) explore/scrub regression — render-path-only change, DOM untouched, ?fx=0 restores the exact prior path.

## Execution Handoff
Dynamic-workflow, Task 1 first (env + materials — the biggest visible win at least risk).
