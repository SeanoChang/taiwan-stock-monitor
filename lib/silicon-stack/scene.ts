// Silicon Stack — Three.js scene: 4 zoom levels, custom orbit controls, DOM hotspots, transitions.
// Ported from the Claude Design project to use the npm `three` module build.

import * as THREE from 'three';

export interface SceneOptions {
  container: HTMLElement;
  layer: HTMLElement;
  accent?: string;
  autoRotate?: boolean;
  startLevel?: number;
  onSelect: (id: string, role: string) => void;
  onLevel: (i: number) => void;
  onReady?: () => void;
  onInteract?: () => void;
  onDepthEnd?: () => void;
}

export interface SceneApi {
  goLevel: (i: number) => Promise<void>;
  setAccent: (hex: string) => void;
  setAutoRotate: (b: boolean) => void;
  dispose: () => void;
}

interface Hotspot {
  title: string;
  sub: string;
  pos: THREE.Vector3;
  company: string | null;
  type: string;
  el: HTMLButtonElement | null;
}

interface CamSpec {
  target: THREE.Vector3;
  r: number;
  minR: number;
  maxR: number;
  theta: number;
  phi: number;
}

interface Level {
  group: THREE.Group;
  hotspots: Hotspot[];
  descendPoint: THREE.Vector3 | null;
  cam: CamSpec;
  fog: [number, number];
  dom: HTMLDivElement | null;
}

export function createScene(opts: SceneOptions): SceneApi {
  const { container, layer, accent, autoRotate, onSelect, onLevel, onReady, onInteract, onDepthEnd } = opts;

  const BG = 0x0d1b2a;
  let ACC = new THREE.Color(accent || '#ffb703');

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(BG);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;';

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(BG, 18, 46);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);

  // lights
  const hemi = new THREE.HemisphereLight(0x3a5570, 0x0a1220, 1.05);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.35); key.position.set(5, 9, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fa8d9, 0.55); rim.position.set(-6, 4, -6); scene.add(rim);

  // ---------- materials ----------
  const accentMats: THREE.MeshStandardMaterial[] = [];
  const accentLights: THREE.Light[] = [];
  function std(c: number, rough: number, metal: number, extra?: Record<string, unknown>) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: rough, metalness: metal }, extra || {}));
  }
  const M = {
    frame:  std(0x24384f, 0.55, 0.6),
    dark:   std(0x101f31, 0.6, 0.5),
    panel:  std(0x1b2e44, 0.6, 0.4),
    steel:  std(0x2e4560, 0.35, 0.85),
    silver: std(0x8ea6bd, 0.32, 0.9),
    pcb:    std(0x13273c, 0.55, 0.25),
    sub:    std(0x143122, 0.5, 0.3),
    si:     std(0x35485e, 0.38, 0.7),
    gold:   std(0xc9a227, 0.4, 0.9),
    glassy: std(0x9db8d4, 0.15, 0.9, { transparent: true, opacity: 0.13 })
  };
  function glowMat(intensity: number) {
    const m = new THREE.MeshStandardMaterial({ color: 0x081120, emissive: ACC.clone(), emissiveIntensity: intensity, roughness: 0.4, metalness: 0.2 });
    accentMats.push(m); return m;
  }
  const GLOW = glowMat(1.7), GLOWDIM = glowMat(0.75);

  function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent?: THREE.Object3D) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); (parent || scene).add(m); return m;
  }
  function cyl(rt: number, rb: number, h: number, mat: THREE.Material, x: number, y: number, z: number, parent?: THREE.Object3D, seg?: number) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat);
    m.position.set(x, y, z); (parent || scene).add(m); return m;
  }
  function shadowDisc(radius: number, y: number, parent: THREE.Object3D, opacity?: number) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d')!;
    const rg = g.createRadialGradient(128, 128, 10, 128, 128, 126);
    rg.addColorStop(0, 'rgba(0,0,0,0.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(cv);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: opacity || 0.6, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; parent.add(m); return m;
  }

  // ---------- levels ----------
  const levels: Level[] = [];
  function makeLevel(build: (g: THREE.Group, lv: Level) => void) {
    const group = new THREE.Group(); group.visible = false; scene.add(group);
    const lv: Level = { group, hotspots: [], descendPoint: null, cam: {} as CamSpec, fog: [18, 46], dom: null };
    build(group, lv); levels.push(lv); return lv;
  }
  function hs(lv: Level, title: string, sub: string, x: number, y: number, z: number, company?: string | null, type?: string) {
    lv.hotspots.push({ title, sub, pos: new THREE.Vector3(x, y, z), company: company || null, type: type || 'info', el: null });
  }

  // ----- L0: rack row -----
  makeLevel((g, lv) => {
    lv.cam = { target: new THREE.Vector3(0, 1.05, 0), r: 7.2, minR: 2.6, maxR: 13, theta: 0.5, phi: 1.12 };
    lv.fog = [16, 44];
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), std(0x0b1826, 0.85, 0.15));
    floor.rotation.x = -Math.PI / 2; g.add(floor);
    const grid = new THREE.GridHelper(60, 60, 0x1d3550, 0x152a3f);
    grid.position.y = 0.002;
    g.add(grid);
    function rack(x: number, hero?: boolean) {
      const r = new THREE.Group(); r.position.x = x; g.add(r);
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
    [-2.7, -1.35, 0, 1.35, 2.7].forEach(x => cyl(0.03, 0.03, 0.26, M.dark, x, 2.22, 0, g));

    lv.descendPoint = new THREE.Vector3(0, 1.15, 0.55);
    hs(lv, 'GPU platform', 'NVIDIA', 0, 2.18, 0.4, 'nvidia');
    hs(lv, 'Rack integration', 'Foxconn 鴻海', -2.7, 1.5, 0.55, 'foxconn');
    hs(lv, 'Server ODM', 'Quanta 廣達', 1.35, 1.7, 0.55, 'quanta');
    hs(lv, 'Rack systems', 'Supermicro', 2.7, 1.1, 0.55, 'smci');
    hs(lv, 'Power busway', 'Delta 台達電', -1.2, 2.45, 0.15, 'delta');
    hs(lv, 'Cooling plant', 'Vertiv', 4.15, 1.75, 0.5, 'vertiv');
    hs(lv, 'Open a server', 'zoom in', 0, 1.0, 0.6, null, 'descend');
  });

  // ----- L1: inside the server -----
  makeLevel((g, lv) => {
    lv.cam = { target: new THREE.Vector3(0, 0.12, 0), r: 2.9, minR: 1.0, maxR: 5.2, theta: 0.35, phi: 0.95 };
    lv.fog = [8, 24];
    shadowDisc(2.6, -0.24, g);
    // chassis
    const ch = new THREE.Group(); g.add(ch);
    box(2.3, 0.06, 1.5, M.panel, 0, -0.17, 0, ch);
    box(2.3, 0.3, 0.05, M.frame, 0, 0.0, -0.75, ch);
    box(2.3, 0.3, 0.05, M.frame, 0, 0.0, 0.75, ch);
    box(0.05, 0.3, 1.5, M.frame, -1.15, 0, 0, ch);
    box(0.05, 0.3, 1.5, M.frame, 1.15, 0, 0, ch);
    box(2.14, 0.025, 1.36, M.pcb, 0, -0.13, 0, ch);
    // 8 GPU modules, 2 rows of 4, rear half (z<0)
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const gx = -0.72 + c * 0.48, gz = -0.5 + r * 0.34;
      const gm = new THREE.Group(); gm.position.set(gx, 0, gz); ch.add(gm);
      box(0.36, 0.05, 0.28, M.dark, 0, -0.09, 0, gm);
      box(0.32, 0.025, 0.24, M.silver, 0, -0.055, 0, gm);
      for (let f = 0; f < 7; f++) box(0.3, 0.13, 0.014, M.steel, 0, 0.02, -0.1 + f * 0.033, gm);
      box(0.34, 0.015, 0.02, GLOWDIM, 0, -0.075, 0.135, gm);
    }
    // fan wall front
    for (let i = 0; i < 5; i++) {
      const fx = -0.88 + i * 0.44;
      box(0.4, 0.26, 0.1, M.dark, fx, 0.0, 0.62, ch);
      const fan = cyl(0.1, 0.1, 0.11, M.frame, fx, 0.0, 0.62, ch);
      fan.rotation.x = Math.PI / 2;
      const hub = cyl(0.035, 0.035, 0.12, GLOWDIM, fx, 0, 0.62, ch); hub.rotation.x = Math.PI / 2;
    }
    // PSUs rear-left
    box(0.5, 0.17, 0.3, M.silver, -0.85, -0.04, 0.34, ch);
    box(0.5, 0.17, 0.3, M.silver, -0.85, -0.04, 0.0, ch);
    box(0.02, 0.02, 0.01, GLOW, -0.62, 0.0, 0.48, ch);
    // CPU heatsinks mid-front
    [0.25, 0.75].forEach(x => {
      box(0.22, 0.1, 0.22, M.steel, x, -0.06, 0.3, ch);
      box(0.24, 0.02, 0.24, M.dark, x, -0.115, 0.3, ch);
    });
    // NIC card
    box(0.3, 0.02, 0.15, M.pcb, 0.95, -0.05, 0.55, ch);
    box(0.08, 0.008, 0.13, M.gold, 0.85, -0.038, 0.55, ch);
    // BMC chip
    box(0.07, 0.014, 0.07, M.dark, -0.35, -0.115, 0.28, ch);
    box(0.02, 0.006, 0.02, GLOW, -0.35, -0.104, 0.28, ch);

    lv.descendPoint = new THREE.Vector3(-0.24, 0.05, -0.33);
    hs(lv, 'GPU modules', 'NVIDIA', 0.72, 0.12, -0.5, 'nvidia');
    hs(lv, 'Power supplies', 'Delta 台達電', -0.85, 0.08, 0.34, 'delta');
    hs(lv, 'Thermal modules', 'AVC 奇鋐', -0.88, 0.15, 0.62, 'avc');
    hs(lv, 'Server board PCB', 'Gold Circuit 金像電', 1.05, -0.1, 0.05, 'gce');
    hs(lv, 'BMC chip', 'ASPEED 信驊', -0.35, -0.08, 0.28, 'aspeed');
    hs(lv, 'Networking', 'Broadcom', 0.95, -0.02, 0.55, 'broadcom');
    hs(lv, 'Chassis & assembly', 'Quanta 廣達', -1.15, 0.18, -0.4, 'quanta');
    hs(lv, 'Into the GPU package', 'zoom in', -0.24, 0.12, -0.33, null, 'descend');
  });

  // ----- L2: GPU package -----
  makeLevel((g, lv) => {
    lv.cam = { target: new THREE.Vector3(0, 0.15, 0), r: 4.2, minR: 1.5, maxR: 7.5, theta: 0.4, phi: 0.9 };
    lv.fog = [9, 26];
    shadowDisc(3.4, -0.1, g);
    // substrate with pad texture
    box(3.2, 0.14, 3.2, M.sub, 0, 0, 0, g);
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    const c2 = cv.getContext('2d')!; c2.fillStyle = '#143122'; c2.fillRect(0, 0, 512, 512);
    c2.fillStyle = '#c9a227';
    for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) {
      if ((i > 7 && i < 16) && (j > 7 && j < 16)) continue;
      c2.beginPath(); c2.arc(16 + i * 21, 16 + j * 21, 3.2, 0, 7); c2.fill();
    }
    const padTex = new THREE.CanvasTexture(cv);
    const pads = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.5, metalness: 0.6 }));
    pads.rotation.x = -Math.PI / 2; pads.position.y = 0.071; g.add(pads);
    // interposer
    box(2.35, 0.09, 2.35, M.si, 0, 0.19, 0, g);
    // die with glowing top
    box(0.95, 0.1, 0.95, M.dark, 0, 0.29, 0, g);
    const dv = document.createElement('canvas'); dv.width = dv.height = 256;
    const d2 = dv.getContext('2d')!; d2.fillStyle = '#0a1420'; d2.fillRect(0, 0, 256, 256);
    d2.fillStyle = '#ffffff';
    for (let i = 0; i < 90; i++) {
      d2.globalAlpha = 0.25 + Math.random() * 0.5;
      d2.fillRect(8 + Math.random() * 230, 8 + Math.random() * 230, 4 + Math.random() * 26, 3 + Math.random() * 14);
    }
    const dieTex = new THREE.CanvasTexture(dv);
    const dieTop = new THREE.MeshStandardMaterial({ color: 0x0a1420, emissive: ACC.clone(), emissiveMap: dieTex, emissiveIntensity: 1.1, roughness: 0.4 });
    accentMats.push(dieTop);
    const dt = new THREE.Mesh(new THREE.PlaneGeometry(0.93, 0.93), dieTop);
    dt.rotation.x = -Math.PI / 2; dt.position.y = 0.341; g.add(dt);
    // 8 HBM stacks
    for (let s = 0; s < 8; s++) {
      const hx = s < 4 ? -0.95 : 0.95, hz = -1.02 + (s % 4) * 0.68;
      const st = new THREE.Group(); st.position.set(hx, 0.235, hz); g.add(st);
      for (let l = 0; l < 8; l++) box(0.5, 0.02, 0.6, l % 2 ? M.dark : M.panel, 0, l * 0.026, 0, st);
      box(0.5, 0.018, 0.6, M.steel, 0, 8 * 0.026, 0, st);
    }
    // passives
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      box(0.06, 0.03, 0.1, M.gold, Math.cos(a) * 1.35, 0.085, Math.sin(a) * 1.35, g);
    }
    lv.descendPoint = new THREE.Vector3(0, 0.35, 0);
    hs(lv, 'GPU die · 4nm', 'TSMC 台積電', 0, 0.36, -0.45, 'tsmc');
    hs(lv, 'HBM memory', 'SK hynix', -0.95, 0.5, -1.02, 'skhynix');
    hs(lv, 'HBM memory', 'Micron', 0.95, 0.5, 1.02, 'micron');
    hs(lv, 'CoWoS interposer', 'TSMC 台積電', -1.0, 0.22, 0.35, 'tsmc');
    hs(lv, 'ABF substrate', 'Unimicron 欣興', 1.35, 0.06, -0.9, 'unimicron');
    hs(lv, 'Package & test', 'ASE 日月光', -1.45, 0.06, 1.1, 'ase');
    hs(lv, 'Onto the silicon', 'zoom in', 0.25, 0.36, 0.3, null, 'descend');
  });

  // ----- L3: transistor / nm -----
  makeLevel((g, lv) => {
    lv.cam = { target: new THREE.Vector3(0, 0.45, 0), r: 5.4, minR: 2.0, maxR: 9.5, theta: 0.45, phi: 1.0 };
    lv.fog = [10, 30];
    shadowDisc(4.0, -0.22, g);
    box(4.4, 0.18, 3.2, M.dark, 0, -0.09, 0, g);
    // fins
    for (let i = 0; i < 21; i++) {
      box(0.06, 0.3, 2.7, M.si, -1.6 + i * 0.16, 0.15, 0, g);
    }
    // gates crossing
    for (let j = 0; j < 5; j++) {
      box(3.6, 0.4, 0.2, GLOWDIM, 0, 0.2, -1.05 + j * 0.52, g);
    }
    // contacts
    for (let j = 0; j < 5; j++) for (let k = 0; k < 4; k++) {
      cyl(0.035, 0.035, 0.35, M.gold, -1.2 + k * 0.8, 0.55, -1.05 + j * 0.52, g, 10);
    }
    // translucent metal layers
    box(3.9, 0.045, 2.9, M.glassy, 0, 0.95, 0, g);
    box(3.9, 0.045, 2.9, M.glassy, 0, 1.25, 0, g);
    for (let i = 0; i < 6; i++) box(0.08, 0.05, 2.7, M.steel, -1.4 + i * 0.56, 1.1, 0, g);
    lv.descendPoint = null;
    hs(lv, 'EUV lithography', 'ASML', -1.7, 1.5, -0.9, 'asml');
    hs(lv, 'EUV optics', 'Zeiss SMT', 1.8, 1.45, -0.7, 'zeiss');
    hs(lv, 'Photoresist', 'Shin-Etsu', -1.9, 0.5, 0.9, 'shinetsu');
    hs(lv, 'Silicon wafer', 'GlobalWafers 環球晶', 1.5, 0.05, 1.3, 'globalwafers');
    hs(lv, 'Coat & develop', 'Tokyo Electron', 0.4, 1.32, 0.9, 'tel');
    hs(lv, 'Plasma etch', 'Lam Research', -0.6, 0.42, -1.35, 'lam');
    hs(lv, 'Deposition', 'Applied Materials', 1.1, 0.98, 0.2, 'amat');
    hs(lv, 'Metrology', 'KLA', -0.2, 0.05, 1.5, 'kla');
  });

  // ---------- hotspot DOM ----------
  levels.forEach((lv, li) => {
    const ld = document.createElement('div');
    ld.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
    layer.appendChild(ld); lv.dom = ld;
    lv.hotspots.forEach(h => {
      const b = document.createElement('button');
      const desc = h.type === 'descend';
      b.style.cssText = 'position:absolute;left:0;top:0;display:flex;align-items:center;gap:9px;padding:7px 15px 7px 9px;'
        + 'background:rgba(10,20,33,0.74);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);'
        + 'border:1px solid ' + (desc ? 'var(--accent,#ffb703)' : 'rgba(255,255,255,0.14)') + ';border-radius:999px;'
        + 'color:#eef4fb;cursor:pointer;pointer-events:auto;white-space:nowrap;font:inherit;'
        + 'transition:border-color .2s,background .2s,opacity .3s;will-change:transform;';
      const dot = document.createElement('span');
      if (desc) {
        dot.textContent = '+';
        dot.style.cssText = 'width:16px;height:16px;border-radius:50%;border:1.5px solid var(--accent,#ffb703);color:var(--accent,#ffb703);'
          + 'display:flex;align-items:center;justify-content:center;font:600 12px/1 ui-monospace,Menlo,monospace;flex:none;animation:hsPulse 2.2s infinite;';
      } else {
        dot.style.cssText = 'width:9px;height:9px;border-radius:50%;background:var(--accent,#ffb703);flex:none;animation:hsPulse 2.6s infinite;';
      }
      const tx = document.createElement('span');
      tx.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:1px;text-align:left;';
      const t1 = document.createElement('span');
      t1.textContent = h.title;
      t1.style.cssText = 'font-size:12.5px;font-weight:600;letter-spacing:0.01em;';
      const t2 = document.createElement('span');
      t2.textContent = h.sub;
      t2.style.cssText = 'font-size:11px;color:' + (desc ? 'var(--accent,#ffb703)' : 'rgba(238,244,251,0.58)') + ';';
      tx.appendChild(t1); tx.appendChild(t2);
      b.appendChild(dot); b.appendChild(tx);
      b.onmouseenter = () => { b.style.borderColor = 'var(--accent,#ffb703)'; b.style.background = 'rgba(16,30,47,0.9)'; };
      b.onmouseleave = () => { b.style.borderColor = desc ? 'var(--accent,#ffb703)' : 'rgba(255,255,255,0.14)'; b.style.background = 'rgba(10,20,33,0.74)'; };
      b.onclick = (e) => {
        e.stopPropagation();
        if (desc) { api.goLevel(li + 1); }
        else if (h.company) onSelect(h.company, h.title);
      };
      ld.appendChild(b); h.el = b;
    });
  });

  // ---------- controls ----------
  const ctl = {
    theta: 0.5, phi: 1.1, r: 7, target: new THREE.Vector3(),
    dTheta: 0.5, dPhi: 1.1, dR: 7,
    minR: 2, maxR: 13
  };
  let cur = -1, animating = false, cooldownUntil = 0, lastInteract = 0, zoomInAcc = 0, zoomOutAcc = 0;
  let AUTOROT = autoRotate !== false;

  const el = renderer.domElement;
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;

  function interact() { lastInteract = performance.now(); zoomInAcc = 0; zoomOutAcc = 0; if (onInteract) onInteract(); }

  el.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    el.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const p = [...pointers.values()];
      pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    }
    interact();
  });
  el.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId)!;
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      ctl.dTheta -= dx * 0.0052;
      ctl.dPhi = Math.min(1.5, Math.max(0.15, ctl.dPhi - dy * 0.0042));
      lastInteract = performance.now();
    } else if (pointers.size === 2) {
      const p = [...pointers.values()];
      const nd = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (pinchDist > 0) ctl.dR = clampR(ctl.dR * (pinchDist / nd));
      pinchDist = nd;
      lastInteract = performance.now();
    }
  });
  function endPointer(e: PointerEvent) { pointers.delete(e.pointerId); pinchDist = 0; }
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);

  function clampR(r: number) { return Math.min(ctl.maxR, Math.max(ctl.minR, r)); }

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (animating || performance.now() < cooldownUntil) return;
    const f = Math.exp(e.deltaY * 0.0011);
    const nr = ctl.dR * f;
    ctl.dR = clampR(nr);
    lastInteract = performance.now();
    if (onInteract) onInteract();
    // threshold crossing → level change
    if (e.deltaY < 0 && nr <= ctl.minR * 1.02) {
      zoomInAcc += -e.deltaY;
      if (zoomInAcc > 320) {
        zoomInAcc = 0;
        if (cur < levels.length - 1 && levels[cur].descendPoint) api.goLevel(cur + 1);
        else if (onDepthEnd) onDepthEnd();
      }
    } else if (e.deltaY > 0 && nr >= ctl.maxR * 0.98) {
      zoomOutAcc += e.deltaY;
      if (zoomOutAcc > 320) { zoomOutAcc = 0; if (cur > 0) api.goLevel(cur - 1); }
    } else { zoomInAcc = 0; zoomOutAcc = 0; }
  }, { passive: false });

  // ---------- transition overlay ----------
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;background:#0d1b2a;opacity:1;pointer-events:none;transition:opacity .45s ease;z-index:5;';
  container.appendChild(overlay);

  function applyLevel(i: number) {
    levels.forEach((lv, k) => { lv.group.visible = k === i; lv.dom!.style.display = k === i ? 'block' : 'none'; });
    const lv = levels[i];
    fog.near = lv.fog[0]; fog.far = lv.fog[1];
    ctl.target.copy(lv.cam.target);
    ctl.minR = lv.cam.minR; ctl.maxR = lv.cam.maxR;
    ctl.theta = ctl.dTheta = lv.cam.theta;
    ctl.phi = ctl.dPhi = lv.cam.phi;
    cur = i;
  }

  function wait(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

  const api: SceneApi = {
    async goLevel(i: number) {
      i = Math.max(0, Math.min(levels.length - 1, i));
      if (animating || i === cur) return;
      animating = true;
      const down = i > cur;
      if (levels[cur]) levels[cur].dom!.style.display = 'none';
      // fly toward descend point when going down
      if (down && levels[cur] && levels[cur].descendPoint) {
        const from = ctl.r, to = Math.max(ctl.minR * 0.5, 0.3);
        const t0 = performance.now(), dur = 460;
        const startTarget = ctl.target.clone(), endTarget = levels[cur].descendPoint!.clone();
        overlay.style.opacity = '1';
        await new Promise<void>(res => {
          (function step() {
            const k = Math.min(1, (performance.now() - t0) / dur);
            const e2 = k * k * (3 - 2 * k);
            ctl.r = ctl.dR = from + (to - from) * e2;
            ctl.target.lerpVectors(startTarget, endTarget, e2);
            if (k < 1) tick(step); else res();
          })();
        });
      } else {
        overlay.style.opacity = '1';
        await wait(430);
      }
      applyLevel(i);
      // arrival: start slightly off default and settle
      const c = levels[i].cam;
      ctl.r = ctl.dR = down ? c.maxR * 0.92 : c.minR * 1.25;
      const settleTo = c.r;
      overlay.style.opacity = '0';
      const t1 = performance.now(), dur2 = 850, r0 = ctl.r;
      await new Promise<void>(res => {
        (function step() {
          const k = Math.min(1, (performance.now() - t1) / dur2);
          const e2 = 1 - Math.pow(1 - k, 3);
          ctl.r = ctl.dR = r0 + (settleTo - r0) * e2;
          if (k < 1) tick(step); else res();
        })();
      });
      levels[i].dom!.style.display = 'block';
      animating = false;
      cooldownUntil = performance.now() + 500;
      onLevel(i);
    },
    setAccent(hex: string) {
      ACC = new THREE.Color(hex);
      accentMats.forEach(m => m.emissive.copy(ACC));
      accentLights.forEach(l => l.color.copy(ACC));
    },
    setAutoRotate(b: boolean) { AUTOROT = b !== false; },
    dispose() {
      disposed = true;
      renderer.dispose();
      ro.disconnect();
      // remove DOM this scene attached (keeps React strict-mode remounts clean)
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      if (overlay.parentNode === container) container.removeChild(overlay);
      levels.forEach(lv => { if (lv.dom && lv.dom.parentNode === layer) layer.removeChild(lv.dom); });
    }
  };

  // ---------- render loop ----------
  let disposed = false;
  // rAF is throttled/paused in hidden documents — race it against a timeout so
  // boot, tweens and rendering always make progress.
  function tick(cb: () => void) {
    let done = false;
    const fire = () => { if (!done) { done = true; cb(); } };
    requestAnimationFrame(fire);
    setTimeout(fire, 55);
  }
  const v = new THREE.Vector3();
  const camWorld = new THREE.Vector3();

  function frame() {
    if (disposed) return;
    tick(frame);
    // idle auto-rotate
    if (AUTOROT && !animating && performance.now() - lastInteract > 4000) ctl.dTheta += 0.0011;
    // damping
    ctl.theta += (ctl.dTheta - ctl.theta) * 0.1;
    ctl.phi += (ctl.dPhi - ctl.phi) * 0.1;
    ctl.r += (ctl.dR - ctl.r) * 0.12;
    camera.position.set(
      ctl.target.x + ctl.r * Math.sin(ctl.phi) * Math.sin(ctl.theta),
      ctl.target.y + ctl.r * Math.cos(ctl.phi),
      ctl.target.z + ctl.r * Math.sin(ctl.phi) * Math.cos(ctl.theta)
    );
    camera.lookAt(ctl.target);
    renderer.render(scene, camera);
    // hotspot projection
    if (cur >= 0 && !animating) {
      const W = container.clientWidth, H = container.clientHeight;
      camera.getWorldPosition(camWorld);
      levels[cur].hotspots.forEach(h => {
        v.copy(h.pos).project(camera);
        const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
        if (v.z > 1 || x < -20 || x > W - 8 || y < 30 || y > H - 8) { h.el!.style.opacity = '0'; h.el!.style.pointerEvents = 'none'; return; }
        h.el!.style.opacity = '1'; h.el!.style.pointerEvents = 'auto';
        const shift = x > W - 210 ? 'translate(calc(-100% + 13px),-50%)' : 'translate(-13px,-50%)';
        h.el!.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) ' + shift;
      });
    }
  }

  // resize
  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  applyLevel(opts.startLevel || 0);
  ctl.r = ctl.dR = levels[cur].cam.r * 1.15;
  frame();
  // boot: fire immediately after the first synchronous render — never gate on rAF
  overlay.style.opacity = '0';
  {
    const c = levels[cur].cam;
    const t0 = performance.now(), r0 = ctl.r;
    (function settle() {
      const k = Math.min(1, (performance.now() - t0) / 900);
      ctl.r = ctl.dR = r0 + (c.r - r0) * (1 - Math.pow(1 - k, 3));
      if (k < 1 && !disposed) tick(settle);
    })();
  }
  onLevel(cur);
  if (onReady) onReady();

  return api;
}
