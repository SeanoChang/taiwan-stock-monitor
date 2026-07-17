// DOM hotspots: authoring helpers for the level builders, per-level button
// creation, and per-frame projection from world space onto the overlay layer.

import * as THREE from 'three';
import type { Hotspot, Level } from '@/lib/scene/types';
import type { Locale, LStr } from '@/lib/i18n/config';

/** same string in both locales (company names etc.) */
export const s = (x: string): LStr => ({ en: x, zh: x });

/** Register a hotspot on a level while its geometry is being built. */
export function hs(
  lv: Level,
  title: LStr,
  sub: LStr,
  x: number,
  y: number,
  z: number,
  company?: string | null,
  type?: string,
) {
  lv.hotspots.push({
    title,
    sub,
    pos: new THREE.Vector3(x, y, z),
    company: company || null,
    type: type || 'info',
    el: null,
    t1: null,
    t2: null,
  });
}

export interface HotspotHandlers {
  onSelect: (id: string, role: LStr) => void;
  onDescend: (nextLevel: number) => void;
}

/** Build one hidden overlay div per level, holding that level's hotspot buttons. */
export function mountHotspots(
  levels: Level[],
  layer: HTMLElement,
  locale: Locale,
  { onSelect, onDescend }: HotspotHandlers,
) {
  levels.forEach((lv, li) => {
    const ld = document.createElement('div');
    ld.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
    layer.appendChild(ld);
    lv.dom = ld;
    lv.hotspots.forEach((h) => {
      const b = document.createElement('button');
      const desc = h.type === 'descend';
      b.className = desc ? 'ss-hotspot ss-hotspot--descend' : 'ss-hotspot';
      const dot = document.createElement('span');
      if (desc) {
        dot.textContent = '+';
        dot.className = 'ss-hotspot__plus';
      } else {
        dot.className = 'ss-hotspot__dot';
      }
      const tx = document.createElement('span');
      tx.className = 'ss-hotspot__text';
      const t1 = document.createElement('span');
      t1.textContent = h.title[locale];
      t1.className = 'ss-hotspot__title';
      const t2 = document.createElement('span');
      t2.textContent = h.sub[locale];
      t2.className = 'ss-hotspot__sub';
      tx.appendChild(t1);
      tx.appendChild(t2);
      h.t1 = t1;
      h.t2 = t2;
      b.appendChild(dot);
      b.appendChild(tx);
      b.onclick = (e) => {
        e.stopPropagation();
        if (desc) {
          onDescend(li + 1);
        } else if (h.company) onSelect(h.company, h.title);
      };
      ld.appendChild(b);
      h.el = b;
    });
  });
}

export function setHotspotLocale(levels: Level[], loc: Locale) {
  levels.forEach((lv) =>
    lv.hotspots.forEach((h) => {
      if (h.t1) h.t1.textContent = h.title[loc];
      if (h.t2) h.t2.textContent = h.sub[loc];
    }),
  );
}

const v = new THREE.Vector3();
const camWorld = new THREE.Vector3();

/** Place each hotspot button over its world anchor, hiding those off-screen. */
export function projectHotspots(
  hotspots: Hotspot[],
  camera: THREE.PerspectiveCamera,
  container: HTMLElement,
) {
  const W = container.clientWidth,
    H = container.clientHeight;
  camera.getWorldPosition(camWorld);
  hotspots.forEach((h) => {
    v.copy(h.pos).project(camera);
    const x = ((v.x + 1) / 2) * W,
      y = ((1 - v.y) / 2) * H;
    if (v.z > 1 || x < -20 || x > W - 8 || y < 30 || y > H - 8) {
      h.el!.style.opacity = '0';
      h.el!.style.pointerEvents = 'none';
      return;
    }
    h.el!.style.opacity = '1';
    h.el!.style.pointerEvents = 'auto';
    const shift = x > W - 210 ? 'translate(calc(-100% + 13px),-50%)' : 'translate(-13px,-50%)';
    h.el!.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) ' + shift;
  });
}
