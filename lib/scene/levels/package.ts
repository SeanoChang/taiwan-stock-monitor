// Level 2 — the GPU package: ABF substrate with pad texture, CoWoS interposer,
// the emissive die, eight HBM stacks and the passive ring.

import * as THREE from 'three';
import { hs, s } from '@/lib/scene/hotspots';
import type { Level, LevelContext } from '@/lib/scene/types';
import { l } from '@/lib/i18n/config';

export function buildPackageLevel(g: THREE.Group, lv: Level, ctx: LevelContext) {
  const { M, ACC, accents, box, shadowDisc } = ctx;

  lv.cam = {
    target: new THREE.Vector3(0, 0.15, 0),
    r: 4.2,
    minR: 1.5,
    maxR: 7.5,
    theta: 0.4,
    phi: 0.9,
  };
  lv.fog = [9, 26];
  shadowDisc(3.4, -0.1, g);
  // substrate with pad texture
  box(3.2, 0.14, 3.2, M.sub, 0, 0, 0, g);
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const c2 = cv.getContext('2d')!;
  c2.fillStyle = '#143122';
  c2.fillRect(0, 0, 512, 512);
  c2.fillStyle = '#c9a227';
  for (let i = 0; i < 24; i++)
    for (let j = 0; j < 24; j++) {
      if (i > 7 && i < 16 && j > 7 && j < 16) continue;
      c2.beginPath();
      c2.arc(16 + i * 21, 16 + j * 21, 3.2, 0, 7);
      c2.fill();
    }
  const padTex = new THREE.CanvasTexture(cv);
  const pads = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 3.0),
    new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.5, metalness: 0.6 }),
  );
  pads.rotation.x = -Math.PI / 2;
  pads.position.y = 0.071;
  g.add(pads);
  // interposer
  box(2.35, 0.09, 2.35, M.si, 0, 0.19, 0, g);
  // die with glowing top
  box(0.95, 0.1, 0.95, M.dark, 0, 0.29, 0, g);
  const dv = document.createElement('canvas');
  dv.width = dv.height = 256;
  const d2 = dv.getContext('2d')!;
  d2.fillStyle = '#0a1420';
  d2.fillRect(0, 0, 256, 256);
  d2.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    d2.globalAlpha = 0.25 + Math.random() * 0.5;
    d2.fillRect(
      8 + Math.random() * 230,
      8 + Math.random() * 230,
      4 + Math.random() * 26,
      3 + Math.random() * 14,
    );
  }
  const dieTex = new THREE.CanvasTexture(dv);
  const dieTop = new THREE.MeshStandardMaterial({
    color: 0x0a1420,
    emissive: ACC.clone(),
    emissiveMap: dieTex,
    emissiveIntensity: 1.1,
    roughness: 0.4,
  });
  accents.mats.push(dieTop);
  const dt = new THREE.Mesh(new THREE.PlaneGeometry(0.93, 0.93), dieTop);
  dt.rotation.x = -Math.PI / 2;
  dt.position.y = 0.341;
  g.add(dt);
  // 8 HBM stacks
  for (let hi = 0; hi < 8; hi++) {
    const hx = hi < 4 ? -0.95 : 0.95,
      hz = -1.02 + (hi % 4) * 0.68;
    const st = new THREE.Group();
    st.position.set(hx, 0.235, hz);
    g.add(st);
    for (let ly = 0; ly < 8; ly++)
      box(0.5, 0.02, 0.6, ly % 2 ? M.dark : M.panel, 0, ly * 0.026, 0, st);
    box(0.5, 0.018, 0.6, M.steel, 0, 8 * 0.026, 0, st);
  }
  // passives
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    box(0.06, 0.03, 0.1, M.gold, Math.cos(a) * 1.35, 0.085, Math.sin(a) * 1.35, g);
  }
  lv.descendPoint = new THREE.Vector3(0, 0.35, 0);
  hs(lv, l('GPU die · 4nm', 'GPU 裸晶 · 4nm'), s('TSMC 台積電'), 0, 0.36, -0.45, 'tsmc');
  hs(lv, l('HBM memory', 'HBM 記憶體'), s('SK hynix'), -0.95, 0.5, -1.02, 'skhynix');
  hs(lv, l('HBM memory', 'HBM 記憶體'), s('Micron'), 0.95, 0.5, 1.02, 'micron');
  hs(lv, l('CoWoS interposer', 'CoWoS 中介層'), s('TSMC 台積電'), -1.0, 0.22, 0.35, 'tsmc');
  hs(lv, l('ABF substrate', 'ABF 載板'), s('Unimicron 欣興'), 1.35, 0.06, -0.9, 'unimicron');
  hs(lv, l('Package & test', '封裝測試'), s('ASE 日月光'), -1.45, 0.06, 1.1, 'ase');
  hs(lv, l('Onto the silicon', '深入矽晶'), l('zoom in', '放大'), 0.25, 0.36, 0.3, null, 'descend');
}
