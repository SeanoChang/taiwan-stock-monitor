# Plan 006 · Phase B — Part-registry refactor of the scene (Implementation)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`. This is the bite-sized execution of **Phase B** of `plans/006-build-frontend-scroll-disassembly-and-multi-axis-tree.md` (tech: `apple-redesign/01-scroll-disassembly/tech-scrub-architecture-and-timeline.md`).

**Goal:** Make individual scene parts addressable via a `PartId` registry + `applyPose()`, without changing the existing `/` 4-level explorer. `PartId` becomes the contract for Phase C (disassembly timeline), Phase D (annotation anchors), and Phase G (tree containment 3D).

**Architecture:** A new `lib/scene/parts.ts` registry (`PartId → THREE.Object3D` + `applyPose`) threaded through `LevelContext` so each level builder registers named sub-assemblies as it builds them; `createScene` owns the registry and exposes `applyPose`/`getPart` on `SceneApi`. The `Level`/`goLevel` API is untouched — parts are additional handles into the same meshes. Registry transform ops are pure Object3D math, unit-tested headlessly via a new `check:parts` gate.

**Tech Stack:** three.js (npm module build, raw `import * as THREE`), TypeScript, tsx, pnpm.

## Global Constraints

- **pnpm only.** Branch `feat/006-phase-b-part-registry`, commit directly.
- **Do NOT regress the `/` explorer.** `goLevel`, the 4 levels, hotspots, camera, transitions must behave exactly as today. Parts are additive handles.
- **Shared-material caveat:** materials (`M.*`, `GLOW`) are shared across meshes. `applyPose` transforms (position/rotation/scale) are always safe. **Opacity** must NOT mutate a shared material (it would fade unrelated parts) — the registry isolates a part's materials (clones them) on first opacity use. Note: isolated (cloned) materials stop tracking `setAccent`; acceptable for exploded/faded parts.
- **Verification harness:** new `pnpm check:parts` (tsx, headless — Object3D/registry math needs no WebGL) + `pnpm build` + `pnpm lint`; `pnpm test`/`check:data` stay green. Full in-scene addressability is confirmed with a browser smoke (Task 5).
- Bilingual/i18n untouched (Phase B touches no strings). Next docs rule doesn't apply (no route/server files).

## PartId contract (the union)

```
rack · sled · lid · fanWall · gpuTray · board · heatsink · interposer · substrate · die · fins
psu0..psu1 · gpuModule0..gpuModule7 · hbm0..hbm7
```

---

### Task 1: `PartId`/`Pose` types + `parts.ts` registry + `check:parts` gate

**Files:**
- Modify: `lib/scene/types.ts` (add `PartId`, `Pose`, `PartRegistry`; extend `LevelContext` + `SceneApi`)
- Create: `lib/scene/parts.ts`
- Create: `scripts/check-parts.ts`; Modify: `package.json` (add `check:parts` script)

**Interfaces (produced):** `createPartRegistry()`, `PartId`, `Pose`, `ALL_PART_IDS`, `SceneApi.applyPose`, `SceneApi.getPart`.

- [ ] **Step 1: Types in `lib/scene/types.ts`**

Add:
```ts
export type PartId =
  | 'rack' | 'sled' | 'lid' | 'fanWall' | 'gpuTray' | 'board'
  | 'heatsink' | 'interposer' | 'substrate' | 'die' | 'fins'
  | `psu${number}` | `gpuModule${number}` | `hbm${number}`;

export interface Pose {
  position?: [number, number, number];
  rotation?: [number, number, number]; // euler XYZ radians
  scale?: number | [number, number, number];
  opacity?: number; // 0..1; triggers per-part material isolation
}

export interface PartRegistry {
  register: (id: PartId, obj: import('three').Object3D) => import('three').Object3D;
  get: (id: PartId) => import('three').Object3D | undefined;
  has: (id: PartId) => boolean;
  ids: () => PartId[];
  applyPose: (id: PartId, pose: Pose) => void;
  reset: (id: PartId) => void; // restore captured base transform + opacity 1
}
```
Extend `LevelContext` with `parts: PartRegistry;` and `SceneApi` with:
```ts
  applyPose: (id: PartId, pose: Pose) => void;
  getPart: (id: PartId) => import('three').Object3D | undefined;
```

- [ ] **Step 2: `lib/scene/parts.ts`**

```ts
// Addressable part registry over the Silicon Stack scene. PartId → Object3D,
// with pose application (transform always; opacity via lazy material isolation
// so fading one part never bleeds through shared materials).
import * as THREE from 'three';
import type { PartId, Pose, PartRegistry } from '@/lib/scene/types';

export const ALL_PART_IDS: PartId[] = [
  'rack', 'sled', 'lid', 'fanWall', 'gpuTray', 'board', 'heatsink',
  'interposer', 'substrate', 'die', 'fins',
  'psu0', 'psu1',
  'gpuModule0', 'gpuModule1', 'gpuModule2', 'gpuModule3',
  'gpuModule4', 'gpuModule5', 'gpuModule6', 'gpuModule7',
  'hbm0', 'hbm1', 'hbm2', 'hbm3', 'hbm4', 'hbm5', 'hbm6', 'hbm7',
];

interface Base {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  scale: THREE.Vector3;
}

export function createPartRegistry(): PartRegistry {
  const map = new Map<PartId, THREE.Object3D>();
  const base = new Map<PartId, Base>();
  const isolated = new Set<PartId>();

  function register(id: PartId, obj: THREE.Object3D) {
    obj.name = id;
    map.set(id, obj);
    base.set(id, {
      pos: obj.position.clone(),
      quat: obj.quaternion.clone(),
      scale: obj.scale.clone(),
    });
    return obj;
  }

  // Clone every material under `obj` so opacity edits don't touch shared instances.
  function isolate(id: PartId, obj: THREE.Object3D) {
    if (isolated.has(id)) return;
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : mesh.material.clone();
    });
    isolated.add(id);
  }

  function setOpacity(obj: THREE.Object3D, v: number) {
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        m.transparent = v < 1;
        m.opacity = v;
        m.depthWrite = v >= 1;
        m.needsUpdate = true;
      }
    });
  }

  function applyPose(id: PartId, pose: Pose) {
    const obj = map.get(id);
    if (!obj) return;
    if (pose.position) obj.position.set(pose.position[0], pose.position[1], pose.position[2]);
    if (pose.rotation) obj.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
    if (pose.scale != null) {
      const s = pose.scale;
      if (typeof s === 'number') obj.scale.set(s, s, s);
      else obj.scale.set(s[0], s[1], s[2]);
    }
    if (pose.opacity != null) {
      isolate(id, obj);
      setOpacity(obj, pose.opacity);
    }
  }

  function reset(id: PartId) {
    const obj = map.get(id);
    const b = base.get(id);
    if (!obj || !b) return;
    obj.position.copy(b.pos);
    obj.quaternion.copy(b.quat);
    obj.scale.copy(b.scale);
    if (isolated.has(id)) setOpacity(obj, 1);
  }

  return {
    register,
    get: (id) => map.get(id),
    has: (id) => map.has(id),
    ids: () => [...map.keys()],
    applyPose,
    reset,
  };
}
```

- [ ] **Step 3: `scripts/check-parts.ts` (headless gate) + `package.json` script**

Add to `package.json` scripts: `"check:parts": "tsx scripts/check-parts.ts"`. Create `scripts/check-parts.ts`:
```ts
// Headless gate for the part registry — Object3D math needs no WebGL.
import * as THREE from 'three';
import { ALL_PART_IDS, createPartRegistry } from '../lib/scene/parts';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

// 1. ALL_PART_IDS is unique
const seen = new Set<string>();
for (const id of ALL_PART_IDS) {
  if (seen.has(id)) err(`duplicate PartId: ${id}`);
  seen.add(id);
}

// 2. registry transform + reset round-trips
const reg = createPartRegistry();
const obj = new THREE.Group();
obj.position.set(1, 2, 3);
reg.register('die', obj);
reg.applyPose('die', { position: [9, 9, 9], rotation: [0, Math.PI / 2, 0], scale: 2 });
if (obj.position.x !== 9) err('applyPose position did not move the object');
if (Math.abs(obj.scale.x - 2) > 1e-9) err('applyPose scale not applied');
reg.reset('die');
if (obj.position.x !== 1 || obj.position.y !== 2) err('reset did not restore base position');

// 3. opacity isolates materials (no bleed to a shared material)
const shared = new THREE.MeshStandardMaterial();
const a = new THREE.Mesh(new THREE.BoxGeometry(), shared);
const b = new THREE.Mesh(new THREE.BoxGeometry(), shared);
const gא = new THREE.Group();
gא.add(a);
reg.register('substrate', gא);
reg.applyPose('substrate', { opacity: 0.3 });
if ((a.material as THREE.Material).opacity !== 0.3) err('opacity not applied to part');
if ((b.material as THREE.Material).opacity === 0.3) err('opacity BLED into shared material (isolation failed)');

// 4. applyPose on an unregistered id is a no-op (no throw)
reg.applyPose('rack', { position: [1, 1, 1] });

if (errors.length) {
  console.error(`✗ part-registry: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ part-registry OK — ${ALL_PART_IDS.length} PartIds, transform+reset+opacity-isolation verified`);
```
*(Note: use a plain ascii local var name; the `gא` above is illustrative — name it `grp`.)*

- [ ] **Step 4: Verify + commit**

Run `pnpm check:parts` (expect `✓ part-registry OK — 28 PartIds …`), `pnpm build`, `pnpm lint`, `pnpm test`. All green.
```bash
git add lib/scene/types.ts lib/scene/parts.ts scripts/check-parts.ts package.json
git commit -m "feat(scene): PartId registry + applyPose + check:parts gate"
```

---

### Task 2: Thread the registry through `createScene` + expose on `SceneApi`

**Files:**
- Modify: `lib/scene/silicon-stack-scene.ts`

- [ ] **Step 1: Create the registry, add to `ctx`, register-completeness assert, expose API**

In `createScene`: `import { createPartRegistry, ALL_PART_IDS } from '@/lib/scene/parts';`. After building materials/helpers, `const parts = createPartRegistry();` and add `parts` to the `ctx: LevelContext` object. Levels build with `ctx` (unchanged call). After the `levels = LEVEL_BUILDERS.map(...)` block, add a dev-only completeness check:
```ts
if (process.env.NODE_ENV !== 'production') {
  const missing = ALL_PART_IDS.filter((id) => !parts.has(id));
  if (missing.length) console.warn('[scene] unregistered PartIds:', missing.join(', '));
}
```
Add to the returned `api`:
```ts
  applyPose: (id, pose) => parts.applyPose(id, pose),
  getPart: (id) => parts.get(id),
```
Do NOT change `goLevel`, `applyLevel`, hotspots, controls, or the render loop.

- [ ] **Step 2: Verify + commit**

`pnpm build` + `pnpm lint`; the `/` explorer must still compile/behave. (`missing` will list all PartIds until Tasks 3–4 register them — that's expected now.)
```bash
git add lib/scene/silicon-stack-scene.ts
git commit -m "feat(scene): wire part registry into createScene + SceneApi"
```

---

### Task 3: Register parts in the rack + server level builders

**Files:**
- Modify: `lib/scene/levels/rack.ts`, `lib/scene/levels/server.ts`

- [ ] **Step 1: rack.ts — register `rack`**

The `rack(x, hero)` helper returns a `THREE.Group r`. Capture the hero rack (the `i === 2` one) and register it: `ctx.parts.register('rack', <heroGroup>)`. (Rename the forEach so you can grab the hero group's return value.)

- [ ] **Step 2: server.ts — register `sled, lid, gpuTray, board, fanWall, psu0/1, heatsink, gpuModule0..7`**

Read the file; wrap/register per this map (add a thin `lid` mesh to the chassis top since none exists today):
- `sled` → the chassis group `ch`.
- `board` → the server board PCB mesh (`box(2.14, 0.025, 1.36, M.pcb, 0, -0.13, 0, ch)`) — assign it to a var, `ctx.parts.register('board', <that mesh>)`.
- `gpuTray` → wrap the 8 GPU-module loop in a `const tray = new THREE.Group(); ch.add(tray);` and add each `gm` to `tray` instead of `ch`; `ctx.parts.register('gpuTray', tray)`.
- `gpuModule0..7` → each `gm` group in the loop: `ctx.parts.register(\`gpuModule${r * 4 + c}\` as PartId, gm)`.
- `fanWall` → wrap the fan-wall loop meshes in `const fanWall = new THREE.Group(); ch.add(fanWall);` (add fan meshes to it); register `'fanWall'`.
- `psu0`,`psu1` → wrap each PSU box in a group (or register the mesh) → `'psu0'`,`'psu1'`.
- `heatsink` → wrap the two CPU-heatsink assemblies in a group → `'heatsink'`.
- `lid` → add `const lid = box(2.3, 0.02, 1.5, M.frame, 0, 0.16, 0, ch);` (thin top panel) and `ctx.parts.register('lid', lid)`.
Keep every mesh's final world position identical to today (wrapping in a zero-offset group preserves it).

- [ ] **Step 3: Verify + commit**

`pnpm check:parts` (still green — it's unit-level), `pnpm build`, `pnpm lint`; run `pnpm dev`, load `/`, confirm the rack + server levels look unchanged and the descend/zoom still works. The dev `[scene] unregistered PartIds` warning should now list only package/die parts.
```bash
git add lib/scene/levels/rack.ts lib/scene/levels/server.ts
git commit -m "feat(scene): register rack + server parts"
```

---

### Task 4: Register parts in the package + die level builders

**Files:**
- Modify: `lib/scene/levels/package.ts`, `lib/scene/levels/die.ts`

- [ ] **Step 1: package.ts — `substrate, interposer, die, hbm0..7`**

- `substrate` → the `box(3.2, 0.14, 3.2, M.sub, …)` mesh (assign to var, register).
- `interposer` → the `box(2.35, 0.09, 2.35, M.si, …)` mesh.
- `die` → wrap the die box (`box(0.95,0.1,0.95,M.dark,…)`) + the emissive `dt` plane in a `const die = new THREE.Group(); g.add(die);` (add both to it, preserving positions) → register `'die'`.
- `hbm0..7` → each `st` group in the 8-stack loop → `ctx.parts.register(\`hbm${hi}\` as PartId, st)`.

- [ ] **Step 2: die.ts — `fins`**

Wrap the 21-fin loop in `const fins = new THREE.Group(); g.add(fins);` (add each fin box to `fins`) → `ctx.parts.register('fins', fins)`. (The die-level base/gates/contacts stay loose; `die` PartId is owned by the package level.)

- [ ] **Step 3: Verify + commit**

`pnpm check:parts`, `pnpm build`, `pnpm lint`; `pnpm dev` → `/` package + die levels unchanged. The dev `[scene] unregistered PartIds` warning should now be **empty** (all 28 registered).
```bash
git add lib/scene/levels/package.ts lib/scene/levels/die.ts
git commit -m "feat(scene): register package + die parts (all PartIds covered)"
```

---

### Task 5: Acceptance — full addressability + explorer parity

**Files:** none (verification; a browser smoke).

- [ ] **Step 1: Gates**

`pnpm check:parts`, `pnpm build`, `pnpm lint`, `pnpm test` — all green.

- [ ] **Step 2: In-scene addressability smoke (browser)**

`pnpm dev` on a port; load `/`. In the page console (or via Playwright/`javascript_tool`), obtain the scene api (or add a temporary `window.__scene = api` behind `NODE_ENV!=='production'` if no handle exists — revert after) and verify for a sample across levels (`rack`, `gpuModule0`, `hbm3`, `die`, `fins`): `api.getPart(id)` returns an Object3D and `api.applyPose(id, {position:[…]})` visibly moves it; confirm **no `[scene] unregistered PartIds` warning** appears at boot. Then confirm the 4-level zoom/descend/hotspots behave exactly as before. Stop dev.

- [ ] **Step 3: Commit any acceptance fixes**

```bash
git add -A && git commit -m "chore(scene): Phase B acceptance — all 28 PartIds addressable, explorer unchanged"
```

## Self-Review

- **Spec coverage:** PartId union + registry + applyPose (tech doc "part registry refactor first") = Tasks 1–4; old Level/goLevel API preserved (Task 2 leaves it untouched; Tasks 3–4 only add named groups) ; gate "each PartId addressable + applyPose moves it + explorer unchanged" = check:parts (unit) + Task 5 (in-scene browser).
- **Placeholder scan:** Tasks 1 carries full code; Tasks 3–4 give exact mesh→PartId mappings referencing the real builders (implementer reads + wraps). The `gא` typo is called out to use `grp`.
- **Risk:** the shared-material opacity bleed is handled by lazy isolation (unit-tested); the main regression risk is a wrapping group shifting a mesh's world position — mitigated by zero-offset wrapper groups and the Task 3/5 visual parity checks.

## Execution Handoff

Recommend the same dynamic-workflow / subagent-driven approach, Task 1 first (deterministic registry + gate).
