// Material palette for the Silicon Stack scene. Accent-driven materials register
// themselves so setAccent() can re-tint them in place.

import * as THREE from 'three';

export interface Materials {
  frame: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  panel: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  silver: THREE.MeshStandardMaterial;
  pcb: THREE.MeshStandardMaterial;
  sub: THREE.MeshStandardMaterial;
  si: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  glassy: THREE.MeshStandardMaterial;
}

/** Materials and lights that follow the accent colour. */
export interface AccentRegistry {
  mats: THREE.MeshStandardMaterial[];
  lights: THREE.Light[];
}

export function std(c: number, rough: number, metal: number, extra?: Record<string, unknown>) {
  return new THREE.MeshStandardMaterial(
    Object.assign({ color: c, roughness: rough, metalness: metal }, extra || {}),
  );
}

export function createAccentRegistry(): AccentRegistry {
  return { mats: [], lights: [] };
}

export function applyAccent(accents: AccentRegistry, acc: THREE.Color) {
  accents.mats.forEach((m) => m.emissive.copy(acc));
  accents.lights.forEach((l) => l.color.copy(acc));
}

export function createMaterials(): Materials {
  return {
    frame: std(0x24384f, 0.55, 0.6),
    dark: std(0x101f31, 0.6, 0.5),
    panel: std(0x1b2e44, 0.6, 0.4),
    steel: std(0x2e4560, 0.35, 0.85),
    silver: std(0x8ea6bd, 0.32, 0.9),
    pcb: std(0x13273c, 0.55, 0.25),
    sub: std(0x143122, 0.5, 0.3),
    si: std(0x35485e, 0.38, 0.7),
    gold: std(0xc9a227, 0.4, 0.9),
    glassy: std(0x9db8d4, 0.15, 0.9, { transparent: true, opacity: 0.13 }),
  };
}

/** The two emissive accent materials shared across levels. */
export function createGlowMaterials(acc: THREE.Color, accents: AccentRegistry) {
  function glowMat(intensity: number) {
    const m = new THREE.MeshStandardMaterial({
      color: 0x081120,
      emissive: acc.clone(),
      emissiveIntensity: intensity,
      roughness: 0.4,
      metalness: 0.2,
    });
    accents.mats.push(m);
    return m;
  }
  return { GLOW: glowMat(1.7), GLOWDIM: glowMat(0.75) };
}
