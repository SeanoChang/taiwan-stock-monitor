# Research — Scrub technology options (GSAP vs CSS vs drei vs native)

## Options evaluated

**1. GSAP ScrollTrigger (recommended)** — industry default for cinematic 3D
scroll (Codrops' 2025 "Cinematic 3D Scroll Experiences" guide builds on it).
`scrub: true|seconds` binds a timeline to scroll with smoothing; `pin` replaces
manual sticky; handles resize, iOS URL-bar, momentum. Core is free (public
npm); we only need ScrollTrigger. Risk: dependency weight (~60KB) — acceptable.

**2. CSS scroll-driven animations (`animation-timeline: scroll()`)** — pure
CSS, great for copy reveals, but cannot drive a WebGL scene graph (JS needs
the progress value). Chrome/Edge/Safari-TP support; Firefox behind flag as of
research date. Use for copy-fade polish only, not the scene. (Medium: "Replace
GSAP ScrollTrigger with Pure CSS" — good for DOM, silent on canvas.)

**3. drei `<ScrollControls>`** (React Three Fiber) — beautiful DX:
`pages`, `damping`, `useScroll().offset`, `range()/curve()/visible()` helpers,
`<Scroll html>` overlay. **Rejected**: requires migrating our vanilla-three
architecture to R3F — a rewrite of `lib/scene/*` for tooling comfort. The
`range/curve` helper _math_ is worth copying into our own timeline utils.

**4. Native rAF + getBoundingClientRect** — zero deps, full control; we
hand-roll damping/resize. Kept as documented fallback in `code-*`.

## Decision (D-002)

GSAP ScrollTrigger supplies `p` (progress) + pinning; our own pure
`evaluate(p)` keyframe system owns all part/camera animation (unit-testable,
no GSAP tweens on three objects). Copy the drei `range/curve` helpers.

## Sources

- Codrops cinematic 3D scroll with GSAP: https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
- GSAP scroll plugins overview: https://gsap.com/scroll/
- GSAP vs CSS scroll timelines (forum): https://gsap.com/community/forums/topic/45363-gsap-scrolltrigger-vs-css-scroll-timelines/
- CSS scroll-driven animations: https://medium.com/@alexdev82/scroll-driven-animations-replace-gsap-scrolltrigger-with-pure-css-b7d054ae3d02
- drei ScrollControls API: https://drei.docs.pmnd.rs/controls/scroll-controls
- R3F scroll tutorial (Wawa Sensei): https://wawasensei.dev/tuto/react-three-fiber-tutorial-scroll-animations
- 2026 scrollytelling library roundup: https://cssauthor.com/best-javascript-scroll-animation-scrollytelling-libraries/
