// Mesh builders for the Silicon Stack levels. Bound to the scene so an omitted
// parent falls back to the scene root, matching the original inline helpers.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export interface GeometryHelpers {
  box: (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent?: THREE.Object3D,
  ) => THREE.Mesh;
  cyl: (
    rt: number,
    rb: number,
    h: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent?: THREE.Object3D,
    seg?: number,
  ) => THREE.Mesh;
  shadowDisc: (radius: number, y: number, parent: THREE.Object3D, opacity?: number) => THREE.Mesh;
}

export function createGeometryHelpers(scene: THREE.Scene): GeometryHelpers {
  function box(
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent?: THREE.Object3D,
  ) {
    // Rounded box edges (radius scaled to the smallest side, capped) catch
    // the env-map highlight along each edge — reads as machined metal
    // instead of a flat prism. Segments kept low (2) to stay cheap.
    const r = Math.min(w, h, d) * 0.06;
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat);
    m.position.set(x, y, z);
    (parent || scene).add(m);
    return m;
  }

  function cyl(
    rt: number,
    rb: number,
    h: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent?: THREE.Object3D,
    seg?: number,
  ) {
    // 48 radial segments removes visible faceting on the round parts
    // (pins/posts/cans) without a meaningful vertex-count cost at this
    // scene's mesh count. Explicit per-call `seg` still overrides.
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 48), mat);
    m.position.set(x, y, z);
    (parent || scene).add(m);
    return m;
  }

  function shadowDisc(radius: number, y: number, parent: THREE.Object3D, opacity?: number) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const g = cv.getContext('2d')!;
    const rg = g.createRadialGradient(128, 128, 10, 128, 128, 126);
    rg.addColorStop(0, 'rgba(0,0,0,0.55)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(cv);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2, radius * 2),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: opacity || 0.6,
        depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    parent.add(m);
    return m;
  }

  return { box, cyl, shadowDisc };
}
