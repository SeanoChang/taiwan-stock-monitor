# Design — Chapter storyboard: 機櫃到裸晶 (rack → die)

`/` becomes a ~900vh scrollytelling page; a sticky full-viewport 3D stage
scrubs this timeline (progress p ∈ [0,1]):

| Ch              | p       | Scene                                                           | Eyebrow / 標題                        |
| --------------- | ------- | --------------------------------------------------------------- | ------------------------------------- |
| 0 hero          | 0–.08   | assembled rack, slow dolly-in                                   | 矽鏈 / 一座 AI 伺服器，一條台灣供應鏈 |
| 1 rack          | .08–.20 | door opens, orbit to one sled                                   | 機櫃 / 加州設計，台灣製造             |
| 2 sled out      | .20–.32 | sled slides on rails, rack dims                                 | 伺服器 / 抽出一台，看看裡面           |
| 3 lid off       | .32–.44 | lid lifts; fans/PSU/board revealed                              | 拆解 / 每個零件，都有名字             |
| 4 board explode | .44–.62 | fan wall/PSUs/GPU tray/cables separate, staggered               | 子系統 / 散熱、電源、機構、連接       |
| 5 package       | .62–.80 | dive to GPU module; heatsink lifts; HBM↑ interposer↓ substrate↓ | 晶片封裝 / 一顆裸晶、八疊記憶體       |
| 6 die           | .80–.94 | die macro → transistor fins                                     | 奈米 / 4 奈米的世界                   |
| 7 outro         | .94–1   | fast reassemble + CTA row（圖譜/行情/自由探索）                 | —                                     |

Rules:

- Copy panels: HTML overlays, Apple grammar (eyebrow+headline+body), alternate
  left/right on desktop, bottom sheet ≤ md. Fade window = same easing as parts.
- **Chapter rail** (right edge dots) = navigation; click smooth-scrolls.
  Deep links `/#ch-5`. Snap `p` to chapter rest-poses within 0.5%.
- **自由探索 handoff**: after ch7 or via persistent toggle — orbit controls +
  Phase 03 callouts take over on the same scene (no reload, no reset).
- `prefers-reduced-motion`: stepped chapters, static poses, prev/next buttons.
- Acceptance: bidirectional scrub with zero state drift (0→1→0.3 test);
  60fps desktop / 30fps mid-mobile (DPR ≤2); islands only, server page shell;
  zero new lint errors.
