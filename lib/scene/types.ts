// Shared types for the Silicon Stack scene: the public options/API surface plus
// the internal level, hotspot and camera shapes the scene modules pass around.

import type * as THREE from 'three';
import type { GeometryHelpers } from '@/lib/scene/geometry';
import type { AccentRegistry, Materials } from '@/lib/scene/materials';
import type { Locale, LStr } from '@/lib/i18n/config';

export interface SceneOptions {
  container: HTMLElement;
  layer: HTMLElement;
  accent?: string;
  autoRotate?: boolean;
  startLevel?: number;
  locale?: Locale;
  onSelect: (id: string, role: LStr) => void;
  onLevel: (i: number) => void;
  onReady?: () => void;
  onInteract?: () => void;
  onDepthEnd?: () => void;
}

export interface SceneApi {
  goLevel: (i: number) => Promise<void>;
  setAccent: (hex: string) => void;
  setAutoRotate: (b: boolean) => void;
  setLocale: (loc: Locale) => void;
  dispose: () => void;
  // Optional in Phase B Task 1 (types + registry only, no scene wiring yet —
  // that's Task 2). Tighten to required once createScene always implements
  // them; kept optional here so this type-only change can't break the build.
  applyPose?: (id: PartId, pose: Pose) => void;
  getPart?: (id: PartId) => THREE.Object3D | undefined;
}

export interface Hotspot {
  title: LStr;
  sub: LStr;
  pos: THREE.Vector3;
  company: string | null;
  type: string;
  el: HTMLButtonElement | null;
  t1: HTMLSpanElement | null;
  t2: HTMLSpanElement | null;
}

export interface CamSpec {
  target: THREE.Vector3;
  r: number;
  minR: number;
  maxR: number;
  theta: number;
  phi: number;
}

export interface Level {
  group: THREE.Group;
  hotspots: Hotspot[];
  descendPoint: THREE.Vector3 | null;
  cam: CamSpec;
  fog: [number, number];
  dom: HTMLDivElement | null;
}

/** Shared palette and mesh builders handed to each level's geometry builder. */
export interface LevelContext extends GeometryHelpers {
  M: Materials;
  GLOW: THREE.MeshStandardMaterial;
  GLOWDIM: THREE.MeshStandardMaterial;
  ACC: THREE.Color;
  accents: AccentRegistry;
  // Optional for the same reason as SceneApi.applyPose/getPart above — Task 2
  // threads the actual registry into createScene's ctx object.
  parts?: PartRegistry;
}

export type LevelBuilder = (g: THREE.Group, lv: Level, ctx: LevelContext) => void;

// ---------- Part registry (addressable sub-assemblies) ----------
// PartId is the contract with Phase C (disassembly timeline), Phase D
// (annotation anchors) and Phase G (tree containment 3D). The `/` explorer's
// Level API above is untouched — parts are additive handles into the same
// meshes, registered by level builders as they construct the scene.

export type PartId =
  | 'rack'
  | 'sled'
  | 'lid'
  | 'fanWall'
  | 'gpuTray'
  | 'board'
  | 'heatsink'
  | 'interposer'
  | 'substrate'
  | 'die'
  | 'fins'
  | `psu${number}`
  | `gpuModule${number}`
  | `hbm${number}`;

export interface Pose {
  position?: [number, number, number];
  rotation?: [number, number, number]; // euler XYZ radians
  scale?: number | [number, number, number];
  opacity?: number; // 0..1; triggers per-part material isolation
}

export interface PartRegistry {
  register: (id: PartId, obj: THREE.Object3D) => THREE.Object3D;
  get: (id: PartId) => THREE.Object3D | undefined;
  has: (id: PartId) => boolean;
  ids: () => PartId[];
  applyPose: (id: PartId, pose: Pose) => void;
  reset: (id: PartId) => void; // restore captured base transform + opacity 1
}
