# Research — Photoreal real-time rendering on the web (2026 state)

## Key findings

- **"Lighting, more than polygon count, separates render from model"**
  (Utsubo 2026 guide). HDRI studio environments through PMREM beat any number
  of punctual lights; PBR materials (roughness/metalness/anisotropy) do the
  rest. This matches three.js Journey's "Realistic render" lesson: env map +
  ACES tone mapping + correct color space are 80% of realism.
- **Four routes framework** (Utsubo): ① real-time PBR (frame-budget-bound),
  ② pre-rendered sequences (film quality, zero interactivity), ③ baked-
  lighting hybrid (bake AO/lightmaps offline, interact live), ④ Gaussian
  splatting (photoreal capture; wrong fit — our object is CAD-like, not
  captured). **We run ③-flavored ①** with ② reserved for the hero (D-001).
- **Post stack that reads "photographed, not computed"**: subtle bloom on
  emissives, ambient occlusion (N8AO is the current community standard),
  color grading, film grain, optional shallow DoF on macro chapters.
  Community showcase pattern: HDRI + N8AO + bloom (three.js forum car demo).
- **Perf discipline** (Codrops efficient-scenes guide): instancing for
  repeated parts (fans, HBM stacks, rack slots), texture atlases, frustum-
  aware disposal, DPR clamp, halt loop when hidden.

## Fidelity checklist for our scene

bevels on every edge (RoundedBoxGeometry / authored) · anisotropic brushed
aluminum · PCB albedo/normal/rough set · alpha-tested vent perforation ·
emissive LEDs driving bloom · baked radial contact shadow · idle fan spin ·
HDRI + exposure track per chapter (timeline owns it).

## Sources

- Utsubo photoreal web guide (2026): https://www.utsubo.com/blog/photorealistic-3d-web-product-visualization-guide
- three.js Journey realistic render: https://threejs-journey.com/lessons/realistic-render
- Codrops efficient three.js scenes: https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
- HDR env-map official example: https://threejs.org/examples/webgl_materials_envmaps_hdr.html
- PBR+HDRI+bloom showcase thread: https://discourse.threejs.org/t/iridescent-pbr-car-with-dual-hdri-theme-switching-bloom-postprocessing-and-gsap-ui/90388
