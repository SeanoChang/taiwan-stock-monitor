// Level 1 — inside the server: chassis, eight GPU modules, fan wall, PSUs,
// CPU heatsinks, NIC and the BMC chip.

import * as THREE from 'three';
import { hs, s } from '@/lib/scene/hotspots';
import type { Level, LevelContext, PartId } from '@/lib/scene/types';
import { l } from '@/lib/i18n/config';

export function buildServerLevel(g: THREE.Group, lv: Level, ctx: LevelContext) {
  const { M, GLOW, GLOWDIM, box, cyl, shadowDisc } = ctx;

  lv.cam = {
    target: new THREE.Vector3(0, 0.12, 0),
    r: 2.9,
    minR: 1.0,
    maxR: 5.2,
    theta: 0.35,
    phi: 0.95,
  };
  lv.fog = [8, 24];
  shadowDisc(2.6, -0.24, g);
  // chassis
  const ch = new THREE.Group();
  g.add(ch);
  ctx.parts?.register('sled', ch);
  box(2.3, 0.06, 1.5, M.panel, 0, -0.17, 0, ch);
  box(2.3, 0.3, 0.05, M.frame, 0, 0.0, -0.75, ch);
  box(2.3, 0.3, 0.05, M.frame, 0, 0.0, 0.75, ch);
  box(0.05, 0.3, 1.5, M.frame, -1.15, 0, 0, ch);
  box(0.05, 0.3, 1.5, M.frame, 1.15, 0, 0, ch);
  const board = box(2.14, 0.025, 1.36, M.pcb, 0, -0.13, 0, ch);
  ctx.parts?.register('board', board);
  const lid = box(2.3, 0.02, 1.5, M.frame, 0, 0.16, 0, ch);
  ctx.parts?.register('lid', lid);
  // 8 GPU modules, 2 rows of 4, rear half (z<0)
  const tray = new THREE.Group();
  ch.add(tray);
  ctx.parts?.register('gpuTray', tray);
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 4; c++) {
      const gx = -0.72 + c * 0.48,
        gz = -0.5 + r * 0.34;
      const gm = new THREE.Group();
      gm.position.set(gx, 0, gz);
      tray.add(gm);
      ctx.parts?.register(`gpuModule${r * 4 + c}` as PartId, gm);
      box(0.36, 0.05, 0.28, M.dark, 0, -0.09, 0, gm);
      box(0.32, 0.025, 0.24, M.silver, 0, -0.055, 0, gm);
      for (let f = 0; f < 7; f++) box(0.3, 0.13, 0.014, M.steel, 0, 0.02, -0.1 + f * 0.033, gm);
      box(0.34, 0.015, 0.02, GLOWDIM, 0, -0.075, 0.135, gm);
    }
  // fan wall front
  const fanWall = new THREE.Group();
  ch.add(fanWall);
  ctx.parts?.register('fanWall', fanWall);
  for (let i = 0; i < 5; i++) {
    const fx = -0.88 + i * 0.44;
    box(0.4, 0.26, 0.1, M.dark, fx, 0.0, 0.62, fanWall);
    const fan = cyl(0.1, 0.1, 0.11, M.frame, fx, 0.0, 0.62, fanWall);
    fan.rotation.x = Math.PI / 2;
    const hub = cyl(0.035, 0.035, 0.12, GLOWDIM, fx, 0, 0.62, fanWall);
    hub.rotation.x = Math.PI / 2;
  }
  // PSUs rear-left
  const psu0 = box(0.5, 0.17, 0.3, M.silver, -0.85, -0.04, 0.34, ch);
  ctx.parts?.register('psu0', psu0);
  const psu1 = box(0.5, 0.17, 0.3, M.silver, -0.85, -0.04, 0.0, ch);
  ctx.parts?.register('psu1', psu1);
  box(0.02, 0.02, 0.01, GLOW, -0.62, 0.0, 0.48, ch);
  // CPU heatsinks mid-front
  const heatsink = new THREE.Group();
  ch.add(heatsink);
  ctx.parts?.register('heatsink', heatsink);
  [0.25, 0.75].forEach((x) => {
    box(0.22, 0.1, 0.22, M.steel, x, -0.06, 0.3, heatsink);
    box(0.24, 0.02, 0.24, M.dark, x, -0.115, 0.3, heatsink);
  });
  // NIC card
  box(0.3, 0.02, 0.15, M.pcb, 0.95, -0.05, 0.55, ch);
  box(0.08, 0.008, 0.13, M.gold, 0.85, -0.038, 0.55, ch);
  // BMC chip
  box(0.07, 0.014, 0.07, M.dark, -0.35, -0.115, 0.28, ch);
  box(0.02, 0.006, 0.02, GLOW, -0.35, -0.104, 0.28, ch);

  lv.descendPoint = new THREE.Vector3(-0.24, 0.05, -0.33);
  hs(lv, l('GPU modules', 'GPU 模組'), s('NVIDIA'), 0.72, 0.12, -0.5, 'nvidia');
  hs(lv, l('Power supplies', '電源供應器'), s('Delta 台達電'), -0.85, 0.08, 0.34, 'delta');
  hs(lv, l('Thermal modules', '散熱模組'), s('AVC 奇鋐'), -0.88, 0.15, 0.62, 'avc');
  hs(lv, l('Server board PCB', '伺服器主機板'), s('Gold Circuit 金像電'), 1.05, -0.1, 0.05, 'gce');
  hs(lv, l('BMC chip', 'BMC 晶片'), s('ASPEED 信驊'), -0.35, -0.08, 0.28, 'aspeed');
  hs(lv, l('Networking', '網路晶片'), s('Broadcom'), 0.95, -0.02, 0.55, 'broadcom');
  hs(lv, l('Chassis & assembly', '機殼與組裝'), s('Quanta 廣達'), -1.15, 0.18, -0.4, 'quanta');
  hs(
    lv,
    l('Into the GPU package', '進入晶片封裝'),
    l('zoom in', '放大'),
    -0.24,
    0.12,
    -0.33,
    null,
    'descend',
  );
}
