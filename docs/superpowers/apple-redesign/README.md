# Apple-Redesign 專案工作區 — 檔名即內容

> Rebuild the front end around an Apple Mac Studio-style scroll disassembly of
> an AI server: high-fidelity 3D, depth-gated company callouts, hover-to-see
> supplier branches, Apple design grammar everywhere.

## File naming convention（檔名規則）

Every file's prefix tells you what it is — no generic "spec/plan" names:

| Prefix       | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| `research-*` | Web-researched findings with sources — how others do it           |
| `design-*`   | The experience we're building — storyboards, UX rules, acceptance |
| `tech-*`     | Architecture decisions and build approach                         |
| `pipeline-*` | Asset / tooling workflows (Blender → glTF etc.)                   |
| `code-*`     | Reference implementations for Claude Code to adapt                |
| `data-*`     | Data contracts and mappings                                       |
| `tokens-*`   | Concrete design-token sheets                                      |

## Phase map & execution order — 05 → 01 → (02 ∥ 03) → 04

| #   | Folder                        | Ships                                                              |
| --- | ----------------------------- | ------------------------------------------------------------------ |
| 05  | `05-apple-design-language/`   | Apple token layer + chrome restyle (cheap, lifts everything)       |
| 01  | `01-scroll-disassembly/`      | Sticky scrollytelling stage, chapter timeline, exploded-view scrub |
| 02  | `02-high-fidelity-rendering/` | HDRI/PBR/post upgrade + Blender→glTF pipeline                      |
| 03  | `03-component-annotations/`   | Depth-gated hardware cards wired to real companies + live quotes   |
| 04  | `04-supplier-branches/`       | Hover → ego-network branch overlay + chain tier ribbon             |

## Decision log

- **D-001 Real-time 3D, not image sequences.** Apple scrubs pre-rendered
  frames (non-interactive). Our components must be hoverable → live three.js
  scene scrubbed with the same sticky/chapter structure. Pre-rendered hero
  flipbook stays an optional polish (see 02 research: "four routes").
- **D-002 GSAP ScrollTrigger drives the scrub** (pin + scrub + resize/momentum
  handling, battle-tested), feeding a pure `evaluate(p)` keyframe timeline we
  own. Native-scroll fallback documented in `01/code-*`. R3F/drei migration
  rejected — too large for the win (see `01/research-scroll-tech-choices-*`).
- **D-003 Keep** zh-Hant-TW-first i18n, amber accent, validated stage palette,
  紅漲綠跌, all routes. This changes skin/motion/experience, not IA.

## Definition of done (project)

≥6 scrubbed chapters rack→die at 60fps desktop / 30fps mobile with reduced-
motion fallback; every callout resolves to real dataset companies with live
quotes; hover shows supplier branches; Lighthouse perf ≥80 on `/`; zero lint
errors; before/after screenshots ×3 routes ×2 locales.
