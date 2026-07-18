// Headless gate for the part registry — Object3D math needs no WebGL.
import * as THREE from 'three';
import { ALL_PART_IDS, createPartRegistry } from '../lib/scene/parts';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

// 1. ALL_PART_IDS is unique
const seen = new Set<string>();
for (const id of ALL_PART_IDS) {
  if (seen.has(id)) err(`duplicate PartId: ${id}`);
  seen.add(id);
}

// 2. registry transform + reset round-trips
const reg = createPartRegistry();
const obj = new THREE.Group();
obj.position.set(1, 2, 3);
reg.register('die', obj);
reg.applyPose('die', { position: [9, 9, 9], rotation: [0, Math.PI / 2, 0], scale: 2 });
if (obj.position.x !== 9) err('applyPose position did not move the object');
if (Math.abs(obj.scale.x - 2) > 1e-9) err('applyPose scale not applied');
reg.reset('die');
if (obj.position.x !== 1 || obj.position.y !== 2) err('reset did not restore base position');

// 3. opacity isolates materials (no bleed to a shared material)
const shared = new THREE.MeshStandardMaterial();
const a = new THREE.Mesh(new THREE.BoxGeometry(), shared);
const b = new THREE.Mesh(new THREE.BoxGeometry(), shared);
const grp = new THREE.Group();
grp.add(a);
reg.register('substrate', grp);
reg.applyPose('substrate', { opacity: 0.3 });
if ((a.material as THREE.Material).opacity !== 0.3) err('opacity not applied to part');
if ((b.material as THREE.Material).opacity === 0.3)
  err('opacity BLED into shared material (isolation failed)');

// 4. applyPose on an unregistered id is a no-op (no throw)
reg.applyPose('rack', { position: [1, 1, 1] });

if (errors.length) {
  console.error(`✗ part-registry: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(
  `✓ part-registry OK — ${ALL_PART_IDS.length} PartIds, transform+reset+opacity-isolation verified`,
);
