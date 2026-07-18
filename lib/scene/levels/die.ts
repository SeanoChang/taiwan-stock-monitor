// Level 3 — the transistor: fins, crossing gates, contacts and the translucent
// metal stack. Deepest level, so it has no descend point.

import * as THREE from 'three';
import { hs, s } from '@/lib/scene/hotspots';
import type { Level, LevelContext } from '@/lib/scene/types';
import { l } from '@/lib/i18n/config';

export function buildDieLevel(g: THREE.Group, lv: Level, ctx: LevelContext) {
  const { M, GLOWDIM, box, cyl, shadowDisc } = ctx;

  lv.cam = {
    target: new THREE.Vector3(0, 0.45, 0),
    r: 5.4,
    minR: 2.0,
    maxR: 9.5,
    theta: 0.45,
    phi: 1.0,
  };
  lv.fog = [10, 30];
  shadowDisc(4.0, -0.22, g);
  box(4.4, 0.18, 3.2, M.dark, 0, -0.09, 0, g);
  // fins
  const fins = new THREE.Group();
  g.add(fins);
  ctx.parts?.register('fins', fins);
  for (let i = 0; i < 21; i++) {
    box(0.06, 0.3, 2.7, M.si, -1.6 + i * 0.16, 0.15, 0, fins);
  }
  // gates crossing
  for (let j = 0; j < 5; j++) {
    box(3.6, 0.4, 0.2, GLOWDIM, 0, 0.2, -1.05 + j * 0.52, g);
  }
  // contacts
  for (let j = 0; j < 5; j++)
    for (let k = 0; k < 4; k++) {
      cyl(0.035, 0.035, 0.35, M.gold, -1.2 + k * 0.8, 0.55, -1.05 + j * 0.52, g, 10);
    }
  // translucent metal layers
  box(3.9, 0.045, 2.9, M.glassy, 0, 0.95, 0, g);
  box(3.9, 0.045, 2.9, M.glassy, 0, 1.25, 0, g);
  for (let i = 0; i < 6; i++) box(0.08, 0.05, 2.7, M.steel, -1.4 + i * 0.56, 1.1, 0, g);
  lv.descendPoint = null;
  hs(lv, l('EUV lithography', 'EUV 微影'), s('ASML'), -1.7, 1.5, -0.9, 'asml');
  hs(lv, l('EUV optics', 'EUV 光學'), s('Zeiss SMT'), 1.8, 1.45, -0.7, 'zeiss');
  hs(lv, l('Photoresist', '光阻'), s('Shin-Etsu'), -1.9, 0.5, 0.9, 'shinetsu');
  hs(lv, l('Silicon wafer', '矽晶圓'), s('GlobalWafers 環球晶'), 1.5, 0.05, 1.3, 'globalwafers');
  hs(lv, l('Coat & develop', '塗佈顯影'), s('Tokyo Electron'), 0.4, 1.32, 0.9, 'tel');
  hs(lv, l('Plasma etch', '電漿蝕刻'), s('Lam Research'), -0.6, 0.42, -1.35, 'lam');
  hs(lv, l('Deposition', '薄膜沉積'), s('Applied Materials'), 1.1, 0.98, 0.2, 'amat');
  hs(lv, l('Metrology', '量測檢測'), s('KLA'), -0.2, 0.05, 1.5, 'kla');
}
