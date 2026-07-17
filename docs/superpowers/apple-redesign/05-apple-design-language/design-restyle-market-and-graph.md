# Design — Applying the grammar to /market, /supply-chain and site chrome

## Site chrome (all routes)

- **Local nav** (Apple's product bar): sticky hairline bar — 矽鏈 left;
  探索 / 圖譜 / 行情 anchors + locale toggle right; frosted `ss-veil`;
  replaces today's pill cluster. 44px tall, text 12px/600.
- **Reveal primitive**: `components/site/reveal.tsx` — IntersectionObserver,
  once, `--ease-apple` 600ms, `translateY(24px)`; server-friendly wrapper.

## /market

- Header becomes a chapter opener: eyebrow（市場行情）+ display headline
  （台股 AI 供應鏈，每天的價格）+ body gray sub.
- Table: hairline separators only (no zebra), 17px rows, tabular numerals,
  sticky header; stat tiles → cards (20px radius, hairline border);
  summary chips adopt pill grammar. Sort/search controls restyle to quiet
  Apple controls; logic untouched.

## /supply-chain

- Header/legend/panel adopt tokens (type ramp, hairlines, pills); canvas
  rendering untouched (already dark-grammar). Legend chips = Apple pills with
  stage-palette dots.

## Order & acceptance

Ship this phase FIRST (tokens lift every page; phases 01–04 consume them).
Acceptance: before/after ×3 routes ×2 locales; contrast audit (body gray
≥4.5:1); element→token audit table in the PR; zero functional diffs.
