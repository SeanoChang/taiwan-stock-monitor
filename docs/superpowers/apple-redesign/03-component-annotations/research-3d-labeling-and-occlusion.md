# Research — Labeling 3D scenes: renderers, occlusion, leader lines

## Findings

- **CSS2DRenderer** (three.js official) renders DOM elements tracked to 3D
  positions — the standard for text-crisp labels over WebGL. Our existing
  hotspot projection is the same idea hand-rolled; keep ours (already handles
  screen-edge flipping + pointer-events) but generalize it, since
  CSS2DRenderer offers no occlusion or collision handling either.
- **Occlusion**: DOM labels ignore depth. Community consensus (three.js
  forum threads): raycast from camera to each anchor on a throttle (~100–150ms,
  not per frame) and fade the label when geometry intersects first. Depth-
  buffer readback alternatives are fragile across GPUs.
- **Leader lines**: an SVG overlay (full-viewport, pointer-events none) drawn
  from projected anchor px → card edge is the Apple/product-configurator
  pattern; SVG keeps hairlines crisp on HiDPI where canvas blurs.
- **Collision/density**: with ≤9 simultaneous callouts, a deterministic
  slot layout (left/right columns, sort by projected Y, stable order) beats
  force-directed label placement — no jitter while scrubbing.

## Sources

- CSS2DRenderer docs: https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer
- Occlusion of CSS2D objects (forum): https://discourse.threejs.org/t/how-to-check-if-a-css2dobject-is-occluded-by-other-objects/10034
- CSS3D/WebGL occlusion discussion: https://discourse.threejs.org/t/occlusion-between-css3d-renderer-and-webgl-renderer/55722
- HTML/WebGL integration patterns: https://www.intelligentgraphicandcode.com/development/threejs-interfaces/html-integration
