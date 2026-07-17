// Level 0 — the data center: a row of AI racks with a hero cabinet, the CDU
// cooling skid and the overhead busway.

import * as THREE from 'three';
import { hs, s } from '@/lib/scene/hotspots';
import { std } from '@/lib/scene/materials';
import type { Level, LevelContext } from '@/lib/scene/types';
import { l } from '@/lib/i18n/config';

export function buildRackLevel(g: THREE.Group, lv: Level, ctx: LevelContext) {
  const { M, GLOW, box, cyl } = ctx;

  lv.cam = {
    target: new THREE.Vector3(0, 1.05, 0),
    r: 7.2,
    minR: 2.6,
    maxR: 13,
    theta: 0.5,
    phi: 1.12,
  };
  lv.fog = [16, 44];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), std(0x0b1826, 0.85, 0.15));
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const grid = new THREE.GridHelper(60, 60, 0x1d3550, 0x152a3f);
  grid.position.y = 0.002;
  g.add(grid);
  function rack(x: number, hero?: boolean) {
    const r = new THREE.Group();
    r.position.x = x;
    g.add(r);
    box(0.66, 2.06, 1.04, M.frame, 0, 1.03, 0, r);
    box(0.58, 1.94, 0.05, M.dark, 0, 1.03, 0.505, r);
    for (let i = 0; i < 12; i++) {
      const y = 0.22 + i * 0.155;
      box(0.55, 0.085, 0.07, hero ? M.panel : M.dark, 0, y, 0.53, r);
      box(0.02, 0.02, 0.015, GLOW, 0.24, y, 0.565, r);
    }
    box(0.7, 0.06, 1.08, M.steel, 0, 2.09, 0, r);
    return r;
  }
  [-2.7, -1.35, 0, 1.35, 2.7].forEach((x, i) => rack(x, i === 2));
  // CDU cooling unit
  box(0.85, 1.7, 0.95, M.steel, 4.15, 0.85, 0);
  cyl(0.045, 0.045, 1.7, M.silver, 3.85, 0.85, 0.3, g);
  cyl(0.045, 0.045, 1.7, M.silver, 3.85, 0.85, -0.3, g);
  // overhead busway
  box(7.6, 0.13, 0.26, M.steel, 0, 2.42, 0);
  [-2.7, -1.35, 0, 1.35, 2.7].forEach((x) => cyl(0.03, 0.03, 0.26, M.dark, x, 2.22, 0, g));

  lv.descendPoint = new THREE.Vector3(0, 1.15, 0.55);
  hs(lv, l('GPU platform', 'GPU 平台'), s('NVIDIA'), 0, 2.18, 0.4, 'nvidia');
  hs(lv, l('Rack integration', '機櫃整合'), s('Foxconn 鴻海'), -2.7, 1.5, 0.55, 'foxconn');
  hs(lv, l('Server ODM', '伺服器代工'), s('Quanta 廣達'), 1.35, 1.7, 0.55, 'quanta');
  hs(lv, l('Rack systems', '整櫃系統'), s('Supermicro'), 2.7, 1.1, 0.55, 'smci');
  hs(lv, l('Power busway', '電力匯流排'), s('Delta 台達電'), -1.2, 2.45, 0.15, 'delta');
  hs(lv, l('Cooling plant', '冷卻設備'), s('Vertiv'), 4.15, 1.75, 0.5, 'vertiv');
  hs(lv, l('Open a server', '打開伺服器'), l('zoom in', '放大'), 0, 1.0, 0.6, null, 'descend');
}
