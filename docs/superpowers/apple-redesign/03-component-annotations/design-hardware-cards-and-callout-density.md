# Design — Hardware cards & depth-gated callout density

As the server disassembles, thin leader lines connect parts to **hardware
cards**. Density grows with depth: ch2 → 3–4 callouts; ch4 → 7–9; ch5 →
package stack (HBM/interposer/substrate/die); ch6 → process suppliers
(EUV、光阻、晶圓…).

Card anatomy (Apple-clean; expands on hover):

```
┌────────────────────────────┐
│ 散熱模組 3D-VC              │ ← part name (LStr)
│ 1,000W GPU 的均熱板與冷板     │ ← one-line blurb (LStr)
│ ● 奇鋐 3017  NT$585 +1.8%   │ ← top-2 companies, live quote chips
│ ● 雙鴻 3324  NT$902 +0.7%   │    (reuse useQuotes; 紅漲綠跌 by locale)
│ 更多 →                      │ ← full list; company chip → Phase 04 overlay
└────────────────────────────┘
```

Rules:

- Cards fade with the same chapter easing as copy; max simultaneous 5
  desktop / 2 mobile (priority field breaks ties).
- Slot layout: left/right columns, sorted by projected anchor Y; leader lines
  may cross the stage but never each other's cards; occlusion-faded when the
  anchor is behind geometry (150ms raycast throttle).
- Mobile: numbered dots + bottom drawer listing the chapter's components.
- Explore mode reuses the same data and replaces today's hard-coded hotspots.
- 在圖譜中檢視 deep-links `/supply-chain?focus=<companyId>`.

Acceptance: ≥22 parts covering ch1–6; all resolve to real categories/
companies (validation script in CI); zh/en complete; zero card overlap in
per-chapter screenshots; quotes degrade gracefully offline.
