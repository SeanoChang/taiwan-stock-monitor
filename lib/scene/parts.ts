// Addressable part registry over the Silicon Stack scene. PartId → Object3D,
// with pose application (transform always; opacity via lazy material isolation
// so fading one part never bleeds through shared materials).
import * as THREE from 'three';
import type { PartId, Pose, PoseDelta, PartRegistry } from '@/lib/scene/types';

export const ALL_PART_IDS: PartId[] = [
  'rack',
  'sled',
  'lid',
  'fanWall',
  'gpuTray',
  'board',
  'heatsink',
  'interposer',
  'substrate',
  'die',
  'fins',
  'psu0',
  'psu1',
  'gpuModule0',
  'gpuModule1',
  'gpuModule2',
  'gpuModule3',
  'gpuModule4',
  'gpuModule5',
  'gpuModule6',
  'gpuModule7',
  'hbm0',
  'hbm1',
  'hbm2',
  'hbm3',
  'hbm4',
  'hbm5',
  'hbm6',
  'hbm7',
];

interface Base {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  euler: THREE.Euler; // captured alongside quat — applyPoseFromBase adds
  // timeline rotation deltas on top of this without a quat→euler conversion
  // every frame.
  scale: THREE.Vector3;
}

export function createPartRegistry(): PartRegistry {
  const map = new Map<PartId, THREE.Object3D>();
  const base = new Map<PartId, Base>();
  const isolated = new Set<PartId>();

  function register(id: PartId, obj: THREE.Object3D) {
    obj.name = id;
    map.set(id, obj);
    base.set(id, {
      pos: obj.position.clone(),
      quat: obj.quaternion.clone(),
      euler: obj.rotation.clone(),
      scale: obj.scale.clone(),
    });
    return obj;
  }

  // Clone every material under `obj` so opacity edits don't touch shared instances.
  function isolate(id: PartId, obj: THREE.Object3D) {
    if (isolated.has(id)) return;
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : mesh.material.clone();
    });
    isolated.add(id);
  }

  function setOpacity(obj: THREE.Object3D, v: number) {
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        m.transparent = v < 1;
        m.opacity = v;
        m.depthWrite = v >= 1;
        m.needsUpdate = true;
      }
    });
  }

  function applyPose(id: PartId, pose: Pose) {
    const obj = map.get(id);
    if (!obj) return;
    if (pose.position) obj.position.set(pose.position[0], pose.position[1], pose.position[2]);
    if (pose.rotation) obj.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
    if (pose.scale != null) {
      const s = pose.scale;
      if (typeof s === 'number') obj.scale.set(s, s, s);
      else obj.scale.set(s[0], s[1], s[2]);
    }
    if (pose.opacity != null) {
      isolate(id, obj);
      setOpacity(obj, pose.opacity);
    }
  }

  // Phase C Task 2 — applies a base-relative DELTA pose (from
  // disassembly-timeline.ts's evaluate(p)): position/rotation are offsets
  // added to the registered base transform, scale is a multiplier on the
  // base scale. A part with no active keyframe (pose === {}) resolves to
  // exactly its base pose — never an accumulating drift, since every field
  // is re-derived from `base` + the caller-supplied delta, not from the
  // object's current transform.
  function applyPoseFromBase(id: PartId, pose: PoseDelta) {
    const obj = map.get(id);
    const b = base.get(id);
    if (!obj || !b) return;
    const dp = pose.position ?? [0, 0, 0];
    obj.position.set(b.pos.x + dp[0], b.pos.y + dp[1], b.pos.z + dp[2]);
    const dr = pose.rotation ?? [0, 0, 0];
    obj.rotation.set(b.euler.x + dr[0], b.euler.y + dr[1], b.euler.z + dr[2]);
    const sm = pose.scale ?? 1;
    obj.scale.set(b.scale.x * sm, b.scale.y * sm, b.scale.z * sm);
    if (pose.opacity != null) {
      isolate(id, obj);
      setOpacity(obj, pose.opacity);
    }
  }

  function reset(id: PartId) {
    const obj = map.get(id);
    const b = base.get(id);
    if (!obj || !b) return;
    obj.position.copy(b.pos);
    obj.quaternion.copy(b.quat);
    obj.scale.copy(b.scale);
    if (isolated.has(id)) setOpacity(obj, 1);
  }

  return {
    register,
    get: (id) => map.get(id),
    has: (id) => map.has(id),
    ids: () => [...map.keys()],
    applyPose,
    applyPoseFromBase,
    reset,
  };
}
