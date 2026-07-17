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
}

export type LevelBuilder = (g: THREE.Group, lv: Level, ctx: LevelContext) => void;
