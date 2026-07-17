# Code — renderer, HDRI, materials, post stack

```ts
// deps: npm i postprocessing n8ao
import { EffectComposer, RenderPass, EffectPass, BloomEffect, FXAAEffect } from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
composer.addPass(new RenderPass(scene, camera));
const ao = new N8AOPostPass(scene, camera, w, h);
ao.configuration.aoRadius = 0.4;
ao.configuration.intensity = 3;
composer.addPass(ao);
composer.addPass(
  new EffectPass(
    camera,
    new BloomEffect({ intensity: 0.35, luminanceThreshold: 0.8 }),
    new FXAAEffect(),
  ),
);
// frame(): composer.render()  — behind feature flag ?fx=0 → renderer.render()
```

```ts
// HDRI environment (PolyHaven CC0 .hdr)
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
const pmrem = new THREE.PMREMGenerator(renderer);
new RGBELoader().load('/env/studio_small_08_1k.hdr', (hdr) => {
  scene.environment = pmrem.fromEquirectangular(hdr).texture;
  hdr.dispose();
  pmrem.dispose();
});
```

```ts
// brushed aluminum chassis
new THREE.MeshPhysicalMaterial({
  color: 0x9aa4ad,
  metalness: 1,
  roughness: 0.38,
  anisotropy: 0.6,
  anisotropyRotation: Math.PI / 2,
  envMapIntensity: 1.1,
});
// timeline owns per-chapter exposure: renderer.toneMappingExposure = evalExposure(p)
```

```ts
// chapter glTF loading bound to the part registry
export async function loadChapterModel(url: string, parts: PartRegistry) {
  const gltf = await loader.loadAsync(url);
  gltf.scene.traverse((o) => {
    if (isPartId(o.name)) parts.set(o.name as PartId, o);
  });
  return gltf.scene;
}
```
