# Pipeline — Blender → glTF → Draco/KTX2 → chapter lazy-load

## Tracks (ship in order)

- **T1 procedural upgrade (days)**: keep generated geometry; add HDRI+PMREM,
  post stack, PBR materials, bevels, vent alpha maps, LED emissives, cable
  tubes. ~70% of the visual win, zero pipeline.
- **T2 authored model (the real deal)**: `assets/blender/ssx72.blend` —
  rack + sled + GPU module; every mesh named to the `PartId` contract from
  Phase 01. Export: glTF → `gltf-transform optimize` (draco, ktx2, prune,
  dedup). Decide with Sean: LFS vs keep .blend out of repo.
- **T3 hero flipbook (optional)**: 240-frame Cycles turntable → AVIF sequence
  → canvas scrub for chapter 0 only; crossfade to live scene at ch1.

## Commands & checks

```bash
npx @gltf-transform/cli optimize ssx72.glb public/models/ssx72.glb \
  --compress draco --texture-compress ktx2
node scripts/check-parts.mjs public/models/ssx72.glb   # asserts PartId nodes exist (CI)
```

Loaders: GLTFLoader + DRACOLoader (`/decoders/draco/`) + KTX2Loader
(`/decoders/basis/`). Budgets: ≤150k visible tris/chapter, ≤8MB compressed
assets/chapter, lazy-load on chapter approach, 2-chapter disposal window on
mobile, DPR ≤2.

## Acceptance

Before/after screenshots ch 0/3/5 · anisotropic metal reads at 100% zoom ·
60fps M-series / ≥30fps iPhone-13-class · asset ledger complete · part-name
contract test green in CI.
