// Mesh builders for the Silicon Stack levels. Bound to the scene so an omitted
// parent falls back to the scene root, matching the original inline helpers.

import * as THREE from 'three';

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
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
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
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat);
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
