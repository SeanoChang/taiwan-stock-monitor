# Design — Hover branch overlay（供應商分支）＋ chain tier ribbon（層級絲帶）

## Branch overlay (ego quick-look)

Hover (desktop) / tap (mobile) any company chip → overlay blooms in place:

- Ego at center; ≤8 alters fanned across 300° (gap at bottom for breadcrumb);
  "+N" chip expands a second ring. Each branch line labeled with the
  relationship (晶圓供應商 / 散熱供應商 …) from the dataset's rel labels.
- Alter node = zh name + ticker + live quote chip. **Hover an alter → pivot**:
  it becomes the new ego; breadcrumb grows（奇鋐 → 台積電 → ASML）; chips jump
  back; Esc / backdrop click closes.
- Click-through: 在圖譜中檢視 → `/supply-chain?focus=` (the full graph stays
  the deep-dive surface).
- Perf: adjacency precomputed at build of the island; quotes already cached —
  hover→visible < 100ms, no fetch on hover.

## Tier ribbon (hierarchy made visible)

Slim fixed ribbon (bottom) with the 9 chain tiers 材料→設備→晶圓→晶片→封測→
板卡→子系統→系統→雲端, colored with the validated stage palette (same slots
as the graph page):

- While scrolling: current chapter's tier(s) glow (ch4=子系統, ch5=封測/晶片,
  ch6=材料/設備…).
- Overlay open: tiers touched by visible branches light up — the "layers of
  the supply chain" stay legible while exploring.
- Clicking a tier = group-filter deep link into `/supply-chain`.

Acceptance: 4-hop pivot with breadcrumb back-nav · keyboard accessible
(focus/Enter/Esc) + aria labels · ribbon states match palette slot-for-slot ·
zh/en complete.
