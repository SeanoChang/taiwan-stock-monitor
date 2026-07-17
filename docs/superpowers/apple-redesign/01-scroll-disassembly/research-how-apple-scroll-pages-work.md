# Research — How Apple's product pages actually work

## Findings (Mac Studio page, fetched 2026-07)

- Narrative order: hero → chip ("Supercharged by M4 Max and M3 Ultra") →
  performance → **design & thermal system with internal-component visuals** →
  ports (front/back diagrams) → ecosystem → compare → values.
- Scroll animations are **pre-rendered image sequences** scrubbed by scroll:
  frame assets named `_startframe_` / `_endframe_` / `_static_`, drawn inside
  **sticky full-viewport sections**; copy fades per chapter.
- Copy grammar: eyebrow ("Choose your superpower") + short-fragment headline
  ("Plays it cool and quiet", "Fits right in") + 1–2 line gray body.
- The classic implementation (documented by CSS-Tricks): `<canvas>` flipbook —
  preload N JPEG/AVIF frames, `frameIndex = round(progress × (N-1))`, draw on
  scroll inside a tall wrapper with a sticky canvas.

## What we copy vs. change

| Apple                                 | Us                                                     |
| ------------------------------------- | ------------------------------------------------------ |
| sticky chapters + scrub + copy fades  | same                                                   |
| eyebrow/fragment/body copy grammar    | same (zh-first)                                        |
| pre-rendered frames (non-interactive) | **live three.js scene** — parts stay hoverable (D-001) |
| ~8 image-sequence "moments"           | 8 chapters, one continuous part-keyframe timeline      |

## Sources

- Apple Mac Studio page structure: https://www.apple.com/mac-studio/
- CSS-Tricks canvas-flipbook technique: https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/
- AirPods-Pro-style walkthrough: https://ankittrehan2000.medium.com/creating-scroll-animations-similar-to-apples-airpods-pro-page-bc5c1c0814df
- GSAP image-sequence recipe: https://gsapvault.com/effects/scroll-image-sequence
