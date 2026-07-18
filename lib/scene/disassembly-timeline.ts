// Pure disassembly timeline — the single source of truth for "given a scroll
// progress p ∈ [0,1], what pose is every part and the camera in, and what
// chapter copy is showing". No three.js, no GSAP, no DOM: evaluate(p) and
// evalCamera(p) are ordinary pure functions of a number, so poses can never
// drift regardless of scroll direction or how many times they're called
// (see scripts/check-timeline.ts). Consumed by the scene's `scrolly` mode
// (Task 2), which applies these poses to the Phase B part registry via
// `applyPoseFromBase`, and by the copy/rail islands (Tasks 3–4).
//
// Design: docs/superpowers/apple-redesign/01-scroll-disassembly/
//   design-storyboard-rack-to-die-chapters.md (chapter table this file encodes)
//   tech-scrub-architecture-and-timeline.md (D-002: GSAP supplies p only)

import type { PartId } from '@/lib/scene/types';
import { range, smooth, clamp01 } from '@/lib/scene/scroll-math';
import { l, type LStr } from '@/lib/i18n/config';

// ---------- Pose shapes ----------

/** A part's pose is expressed as a DELTA from its registered base transform
 * (see Task 2's `applyPoseFromBase`) — never an absolute world transform. */
export interface PartPose {
  position?: [number, number, number];
  rotation?: [number, number, number]; // euler XYZ radians
  scale?: number;
  opacity?: number; // 0..1
}

export interface CamPose {
  target: [number, number, number];
  r: number;
  theta: number;
  phi: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Component-wise lerp between two PartPoses. A field is emitted only when at
 * least one side defines it; whichever side omits it falls back to identity
 * (zero offset for position/rotation, scale 1, opacity 1) — so a keyframe can
 * write `from: {}` to mean "no offset from base" instead of spelling out
 * every field on both ends.
 */
export function lerpPose(from: PartPose, to: PartPose, t: number): PartPose {
  const out: PartPose = {};
  if (from.position || to.position) {
    const a = from.position ?? [0, 0, 0];
    const b = to.position ?? [0, 0, 0];
    out.position = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  }
  if (from.rotation || to.rotation) {
    const a = from.rotation ?? [0, 0, 0];
    const b = to.rotation ?? [0, 0, 0];
    out.rotation = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  }
  if (from.scale != null || to.scale != null) {
    out.scale = lerp(from.scale ?? 1, to.scale ?? 1, t);
  }
  if (from.opacity != null || to.opacity != null) {
    out.opacity = lerp(from.opacity ?? 1, to.opacity ?? 1, t);
  }
  return out;
}

// ---------- Keyframes + evaluate(p) ----------

export interface Keyframe {
  part: PartId;
  t0: number;
  t1: number;
  from: PartPose;
  to: PartPose;
  ease?: (t: number) => number;
}

/**
 * Evaluate every keyframe in TIMELINE at progress p and collect the result
 * per part. `range()` clamps outside [t0,t1], so a keyframe's pose holds at
 * `from` before its window and at `to` after it — later entries in the array
 * win for a given part id (Map.set overwrites). In this module's TIMELINE
 * every part has exactly one keyframe (see `explode()` below and its doc
 * comment for why two literal keyframes per part — an "onset" one and a
 * separate ch7 "reassemble to base" one — cannot compose correctly under
 * this override rule), so the override clause never actually triggers; it's
 * kept because it's the contract Task 2 (and any future track) relies on.
 */
export function evaluate(p: number): Map<PartId, PartPose> {
  const out = new Map<PartId, PartPose>();
  for (const k of TIMELINE) {
    const t = (k.ease ?? smooth)(range(p, k.t0, k.t1 - k.t0));
    out.set(k.part, lerpPose(k.from, k.to, t));
  }
  return out;
}

// ---------- Camera track + evalCamera(p) ----------

export interface CamKey {
  t0: number;
  t1: number;
  from: CamPose;
  to: CamPose;
}

function lerpCam(from: CamPose, to: CamPose, t: number): CamPose {
  return {
    target: [
      lerp(from.target[0], to.target[0], t),
      lerp(from.target[1], to.target[1], t),
      lerp(from.target[2], to.target[2], t),
    ],
    r: lerp(from.r, to.r, t),
    theta: lerp(from.theta, to.theta, t),
    phi: lerp(from.phi, to.phi, t),
  };
}

/** Find the CAMERA_TRACK segment containing p and lerp within it. Segments
 * are contiguous and cover [0,1], so this is always defined; the `??` fallback
 * only guards the (unreachable, given contiguous coverage) TS-narrowing case. */
export function evalCamera(p: number): CamPose {
  const pp = clamp01(p);
  const seg = CAMERA_TRACK.find((k) => pp <= k.t1) ?? CAMERA_TRACK[CAMERA_TRACK.length - 1];
  const t = smooth(range(pp, seg.t0, seg.t1 - seg.t0));
  return lerpCam(seg.from, seg.to, t);
}

// ---------- Chapters ----------

export interface Chapter {
  id: number;
  p0: number;
  p1: number;
  level: number;
  eyebrow: LStr;
  headline: LStr;
  body: LStr;
}

/** Chapter boundaries — the single source of truth p breakpoints are derived
 * from (CHAPTERS, TIMELINE onsets, activeLevelFor, CAMERA_TRACK all key off
 * these same 9 numbers so they can't drift out of sync with each other). */
const BOUNDS = [0, 0.08, 0.2, 0.32, 0.44, 0.62, 0.8, 0.94, 1] as const;

export const CHAPTERS: Chapter[] = [
  {
    id: 0,
    p0: BOUNDS[0],
    p1: BOUNDS[1],
    level: 0,
    eyebrow: l('Silicon chain', '矽鏈'),
    headline: l('One AI server, one Taiwan supply chain', '一座 AI 伺服器，一條台灣供應鏈'),
    body: l(
      "From rack to die — see how Taiwan builds the world's AI engine.",
      '從機櫃到裸晶，看見台灣如何打造世界的 AI 引擎。',
    ),
  },
  {
    id: 1,
    p0: BOUNDS[1],
    p1: BOUNDS[2],
    level: 0,
    eyebrow: l('The rack', '機櫃'),
    headline: l('Designed in California, made in Taiwan', '加州設計，台灣製造'),
    body: l(
      'The cabinet door opens; we move toward a single server sled.',
      '打開機櫃門，走近其中一台伺服器。',
    ),
  },
  {
    id: 2,
    p0: BOUNDS[2],
    p1: BOUNDS[3],
    level: 1,
    eyebrow: l('The server', '伺服器'),
    headline: l('Slide one out, look inside', '抽出一台，看看裡面'),
    body: l(
      'The sled slides out on its rails, ready to come apart.',
      '伺服器沿滑軌抽出機櫃，準備拆解。',
    ),
  },
  {
    id: 3,
    p0: BOUNDS[3],
    p1: BOUNDS[4],
    level: 1,
    eyebrow: l('Teardown', '拆解'),
    headline: l('Every part has a name', '每個零件，都有名字'),
    body: l(
      'The lid lifts, revealing fans, power supplies and the board.',
      '上蓋掀起，風扇、電源與主機板一一顯現。',
    ),
  },
  {
    id: 4,
    p0: BOUNDS[4],
    p1: BOUNDS[5],
    level: 1,
    eyebrow: l('Subsystems', '子系統'),
    headline: l('Cooling, power, mechanics, connectivity', '散熱、電源、機構、連接'),
    body: l(
      'Fan wall, power supplies, GPU tray and board separate in turn.',
      '風牆、電源供應器、GPU 托盤與主機板依序分離。',
    ),
  },
  {
    id: 5,
    p0: BOUNDS[5],
    p1: BOUNDS[6],
    level: 2,
    eyebrow: l('The package', '晶片封裝'),
    headline: l('One bare die, eight memory stacks', '一顆裸晶、八疊記憶體'),
    body: l(
      'Inside the GPU module: HBM stacks lift, interposer and substrate spread apart.',
      '深入 GPU 模組：HBM 疊起，中介層與載板向外展開。',
    ),
  },
  {
    id: 6,
    p0: BOUNDS[6],
    p1: BOUNDS[7],
    level: 3,
    eyebrow: l('Nanometers', '奈米'),
    headline: l('The world of 4 nanometers', '4 奈米的世界'),
    body: l(
      'The camera dives to the die surface, down to transistor-fin scale.',
      '鏡頭潛入裸晶表面，看見電晶體鰭片的尺度。',
    ),
  },
  {
    id: 7,
    p0: BOUNDS[7],
    p1: BOUNDS[8],
    level: 0,
    eyebrow: l('Made in Taiwan', '台灣製造'),
    headline: l('From die to rack, one supply chain', '從裸晶到機櫃，一條完整供應鏈'),
    body: l(
      'Explore the full map, or take the scene into your own hands.',
      '探索完整供應鏈圖譜，或自由操控整座場景。',
    ),
  },
];

/** Active level per progress, per the storyboard thresholds:
 * [0,.20)→0 rack · [.20,.62)→1 server · [.62,.80)→2 package · [.80,.94)→3 die · [.94,1]→0 rack. */
export function activeLevelFor(p: number): number {
  if (p < BOUNDS[2]) return 0;
  if (p < BOUNDS[5]) return 1;
  if (p < BOUNDS[6]) return 2;
  if (p < BOUNDS[7]) return 3;
  return 0;
}

// ---------- TIMELINE (part disassembly, first pass) ----------

const REASSEMBLE_START = BOUNDS[7]; // ch7 p0 — every displaced part is back at
const TIMELINE_END = BOUNDS[8]; //          base by p=1 (fast reassemble + CTA).

/**
 * Rise → hold → fall ease for a single keyframe spanning a part's *entire*
 * active window (its own onset chapter through the end of the outro).
 *
 * Why not two literal keyframes ("explode" then a separate ch7 "reassemble
 * to base, `to: {}`" keyframe), as the storyboard prose reads at first
 * glance? Because `evaluate()` overwrites a part's Map entry per keyframe
 * *unconditionally* (Map.set, not "only inside my window") — `range()`
 * clamps rather than opting a keyframe out of contributing outside its
 * [t0,t1]. So whichever of the two keyframes runs later in TIMELINE wins for
 * *every* p, not just its own window:
 *   - reassemble ordered after onset → the reassemble keyframe's clamped
 *     `from` (the fully-exploded pose) wins for every p < its own t0,
 *     including the p=0 hero shot: parts would render pre-exploded.
 *   - onset ordered after reassemble → the onset keyframe's clamped `to`
 *     (also the fully-exploded pose) wins for every p > its own t1,
 *     including the ch7 reassemble window itself: parts would stay frozen
 *     exploded through the outro instead of coming back together.
 * Both orderings are wrong, unconditionally, regardless of the specific
 * offset values chosen — it's a property of the override rule, not a tuning
 * issue. A single keyframe per part with a rise/hold/fall-shaped ease has no
 * such collision (there is nothing to override) and gives exactly the
 * required three-phase motion — assembled at onset, held through the
 * following chapters, reassembled to base during ch7 — while `evaluate()`
 * itself stays exactly the simple, spec'd algorithm above.
 */
function holdEase(riseFrac: number, fallFrac: number): (t: number) => number {
  return (t: number) => {
    if (t <= riseFrac) return riseFrac > 0 ? smooth(t / riseFrac) : 1;
    if (t < fallFrac) return 1;
    return fallFrac < 1 ? smooth(1 - (t - fallFrac) / (1 - fallFrac)) : 0;
  };
}

/** A part that starts at base, explodes to `to` between `onset` and `settle`,
 * holds through the following chapters, then reassembles to base by the end
 * of ch7 (TIMELINE_END). Offsets are deltas from the part's registered base
 * transform (Task 2 applies them via `applyPoseFromBase`). */
function explode(part: PartId, onset: number, settle: number, to: PartPose): Keyframe {
  const t0 = onset;
  const t1 = TIMELINE_END;
  const riseFrac = (settle - onset) / (t1 - t0);
  const fallFrac = (REASSEMBLE_START - onset) / (t1 - t0);
  return { part, t0, t1, from: {}, to, ease: holdEase(riseFrac, fallFrac) };
}

// ch2 — sled slides out on +z.
const SLED = explode('sled', BOUNDS[2], BOUNDS[3], { position: [0, 0, 1.3] });

// ch3 — lid lifts off on +y (visibility is toggled by the scene, Task 2 —
// this file only owns the lift).
const LID = explode('lid', BOUNDS[3], BOUNDS[4], { position: [0, 0.55, 0] });

// ch4 — fan wall / PSUs / GPU tray / board separate, staggered within the
// chapter window so they read as a sequence rather than a single pop.
const CH4_STEPS: [number, number] = [BOUNDS[4], BOUNDS[5]]; // .44 .. .62
const ch4At = (fromFrac: number, toFrac: number) => {
  const [a, b] = CH4_STEPS;
  const span = b - a;
  return [a + span * fromFrac, a + span * toFrac] as const;
};
const [fanWallOnset, fanWallSettle] = ch4At(0, 0.35);
const [psuOnset, psuSettle] = ch4At(0.2, 0.55);
const [gpuTrayOnset, gpuTraySettle] = ch4At(0.4, 0.75);
const [boardOnset, boardSettle] = ch4At(0.6, 1.0);

const FAN_WALL = explode('fanWall', fanWallOnset, fanWallSettle, { position: [0, 0, 0.5] });
const PSU0 = explode('psu0', psuOnset, psuSettle, { position: [-0.45, 0, 0] });
const PSU1 = explode('psu1', psuOnset, psuSettle, { position: [-0.45, 0, 0] });
const GPU_TRAY = explode('gpuTray', gpuTrayOnset, gpuTraySettle, { position: [0, 0.45, 0] });
const BOARD = explode('board', boardOnset, boardSettle, { position: [0, -0.4, 0] });

// ch5 — GPU package: HBM stacks lift up/out, interposer and substrate drop
// away, the die lifts clear of the stack. Staggered similarly to ch4.
const CH5_STEPS: [number, number] = [BOUNDS[5], BOUNDS[6]]; // .62 .. .80
const ch5At = (fromFrac: number, toFrac: number) => {
  const [a, b] = CH5_STEPS;
  const span = b - a;
  return [a + span * fromFrac, a + span * toFrac] as const;
};
const [hbmOnset, hbmSettle] = ch5At(0, 0.4);
const [interposerOnset, interposerSettle] = ch5At(0.2, 0.6);
const [substrateOnset, substrateSettle] = ch5At(0.35, 0.8);
const [dieOnset, dieSettle] = ch5At(0.5, 1.0);

const HBM = Array.from({ length: 8 }, (_, hi) => {
  const side = hi < 4 ? -1 : 1; // matches package.ts: hi<4 → x=-0.95, else +0.95
  const row = (hi % 4) - 1.5; // -1.5..1.5, matches the z stagger in package.ts
  return explode(`hbm${hi}` as PartId, hbmOnset, hbmSettle, {
    position: [side * 0.3, 0.5, row * 0.15],
  });
});
const INTERPOSER = explode('interposer', interposerOnset, interposerSettle, {
  position: [0, -0.2, 0],
});
const SUBSTRATE = explode('substrate', substrateOnset, substrateSettle, {
  position: [0, -0.35, 0],
});
const DIE = explode('die', dieOnset, dieSettle, { position: [0, 0.35, 0] });

// ch6 — transistor fins fan out slightly as the camera dives in.
const FINS = explode('fins', BOUNDS[6], BOUNDS[6] + (BOUNDS[7] - BOUNDS[6]) * 0.5, {
  scale: 1.12,
});

// Note: `heatsink` and `gpuModule0..7` are deliberately left un-animated in
// this first pass. `gpuModule0..7` are children of `gpuTray` (see
// lib/scene/levels/server.ts), so GPU_TRAY's own offset already carries them
// along; `heatsink` (the CPU heatsink registered in the *server* level) isn't
// part of this task's brief part list and only ever renders while level 1 is
// active, so it stays at its base pose until a later pass wants it staggered
// alongside fanWall/psu/gpuTray/board.

export const TIMELINE: Keyframe[] = [
  SLED,
  LID,
  FAN_WALL,
  PSU0,
  PSU1,
  GPU_TRAY,
  BOARD,
  ...HBM,
  INTERPOSER,
  SUBSTRATE,
  DIE,
  FINS,
];

// ---------- CAMERA_TRACK ----------
// Anchor cam specs reused verbatim from each level's own `lv.cam` (see
// lib/scene/levels/{rack,server,package,die}.ts) so the scrolly camera lands
// exactly where explore mode's goLevel() would park it — no seam on handoff.

const RACK_CAM: CamPose = { target: [0, 1.05, 0], r: 7.2, theta: 0.5, phi: 1.12 };
const SERVER_CAM: CamPose = { target: [0, 0.12, 0], r: 2.9, theta: 0.35, phi: 0.95 };
const PACKAGE_CAM: CamPose = { target: [0, 0.15, 0], r: 4.2, theta: 0.4, phi: 0.9 };
const DIE_CAM: CamPose = { target: [0, 0.45, 0], r: 5.4, theta: 0.45, phi: 1.0 };

export const CAMERA_TRACK: CamKey[] = [
  // ch0 — slow dolly-in to the hero rack framing.
  {
    t0: BOUNDS[0],
    t1: BOUNDS[1],
    from: { target: [0, 1.05, 0], r: 9.6, theta: 0.5, phi: 1.12 },
    to: RACK_CAM,
  },
  // ch1 — orbit toward one sled.
  {
    t0: BOUNDS[1],
    t1: BOUNDS[2],
    from: RACK_CAM,
    to: { target: [0, 1.05, 0], r: 6.4, theta: 0.15, phi: 1.05 },
  },
  // ch2-4 — pull in from the rack orbit to the server anchor while the sled
  // slides out and the board explodes.
  {
    t0: BOUNDS[2],
    t1: BOUNDS[5],
    from: { target: [0, 1.05, 0], r: 6.4, theta: 0.15, phi: 1.05 },
    to: SERVER_CAM,
  },
  // ch5 — dive to the GPU package.
  { t0: BOUNDS[5], t1: BOUNDS[6], from: SERVER_CAM, to: PACKAGE_CAM },
  // ch6 — dive to the die / transistor fins.
  { t0: BOUNDS[6], t1: BOUNDS[7], from: PACKAGE_CAM, to: DIE_CAM },
  // ch7 — fast pull back to the hero rack framing for the CTA row.
  { t0: BOUNDS[7], t1: BOUNDS[8], from: DIE_CAM, to: RACK_CAM },
];
