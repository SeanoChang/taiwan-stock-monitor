// Material palette for the Silicon Stack scene. Accent-driven materials register
// themselves so setAccent() can re-tint them in place.
//
// IBL + PBR pass: every material below carries an
// `envMapIntensity` so it picks up `scene.environment`'s PMREM studio env
// (see silicon-stack-scene.ts), and the brushed-metal parts (frame/steel/
// silver) are `MeshPhysicalMaterial` for a truer metallic response.
// `MeshPhysicalMaterial extends MeshStandardMaterial`, so it satisfies the
// `Materials`/`LevelContext` typing below unchanged — callers that only use
// the `THREE.Material`/`MeshStandardMaterial` surface (geometry.ts's
// box()/cyl(), parts.ts's clone()-on-isolate) don't need to know which
// concrete class they got. Note: three@0.152's MeshPhysicalMaterial predates
// the KHR_materials_anisotropy `anisotropy`/`anisotropyRotation` properties
// (added in a later three release), so the "brushed" read here comes from
// metalness:1 + tuned roughness + env reflections rather than a real
// anisotropic BRDF term — verified against node_modules/three@0.152.2.

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

/** Same shape as `std()` but backed by `MeshPhysicalMaterial` — used for the
 * brushed-aluminum parts (frame/steel/silver) so metalness:1 reads as real
 * metal against the PMREM env instead of MeshStandardMaterial's coarser
 * specular approximation. */
export function physical(c: number, rough: number, metal: number, extra?: Record<string, unknown>) {
  return new THREE.MeshPhysicalMaterial(
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
    frame: physical(0x24384f, 0.5, 1, { envMapIntensity: 1.1 }),
    dark: std(0x101f31, 0.6, 0.5, { envMapIntensity: 1.0 }),
    panel: std(0x1b2e44, 0.6, 0.4, { envMapIntensity: 1.0 }),
    steel: physical(0x2e4560, 0.32, 1, { envMapIntensity: 1.2 }),
    silver: physical(0x8ea6bd, 0.28, 1, { envMapIntensity: 1.2 }),
    pcb: std(0x13273c, 0.55, 0.25, { envMapIntensity: 1.0 }),
    sub: std(0x143122, 0.5, 0.3, { envMapIntensity: 1.0 }),
    si: std(0x35485e, 0.38, 0.7, { envMapIntensity: 1.05 }),
    gold: std(0xc9a227, 0.4, 0.9, { envMapIntensity: 1.1 }),
    glassy: std(0x9db8d4, 0.15, 0.9, { transparent: true, opacity: 0.13, envMapIntensity: 1.0 }),
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
