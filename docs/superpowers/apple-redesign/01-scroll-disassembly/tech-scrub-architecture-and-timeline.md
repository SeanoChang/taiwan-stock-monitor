# Tech — Scrub architecture & keyframe timeline

## Layering (who owns what)

```
GSAP ScrollTrigger (pin + scrub + resize)      ← progress source only
        ↓ p ∈ [0,1] (ref, never React state)
lib/scene/disassembly-timeline.ts              ← pure data + evaluate(p)
        ↓ part poses + camera pose + copy opacities
lib/scene/* part registry (named groups)       ← applyPose() in frame loop
components/explorer/scrolly/* islands          ← stage, copy, rail (DOM)
```

- **Part registry refactor first**: split scene builders into addressable
  named groups — `rack, sled, lid, fanWall, psu[0..n], gpuTray, board,
gpuModule, heatsink, hbm[0..7], interposer, substrate, die, fins` — this
  `PartId` union is the contract with Phase 02 (glTF node names) and Phase 03
  (annotation anchors). Old level API stays for explore mode.
- **Timeline**: `{part, t0, t1, from:{pos,rot,opacity}, to, ease}` tracks +
  camera track + chapter copy ranges; smoothstep default; `evaluate(p)` is a
  pure function with unit tests (drift-free by construction — poses derive
  from p, never accumulate).
- **ScrollTrigger config**: one trigger on the wrapper, `pin` the stage,
  `scrub: 0.5` (300–600ms catch-up feels Apple-like), `onUpdate: st =>
progressRef.current = st.progress`. No GSAP tweens touch three objects.
- **Copy reveals**: CSS scroll-driven animations where supported, JS-driven
  opacity from the same chapter ranges as fallback (one source of truth).
- Assets/perf: chapter-based lazy loading hooks (Phase 02 fills in), pause
  loop when tab hidden, `svh` for sticky height (iOS URL bar).
