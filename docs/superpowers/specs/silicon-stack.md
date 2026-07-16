# Spec — 矽鏈 Silicon Stack (Taiwan AI Supply-Chain Monitor)

> Source of truth for the current state of the app (v3, commit `5b9e865`).
> Cowork owns this document; Claude Code executes against it.

## Product

Bilingual (繁體中文（台灣）default / EN toggle) monitor of the Taiwan-centered
AI hardware supply chain. Three surfaces:

| Route           | What it is                                                                                                                                                                                                     | Rendering                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `/`             | three.js 3D explorer: data-center rack → server → GPU package → 4 nm transistor, per-company panels (ported from a Claude Design project)                                                                      | server page + client island     |
| `/supply-chain` | force-directed canvas graph: 202 TWSE/TPEx companies + 17 global anchors, 37 chain-segment hubs, membership/relation/flow edges, 1st/2nd-degree tracing, search, stage filter, `?focus=<companyId>` deep links | server page + client island     |
| `/market`       | daily quote board for all 202 TW companies; sort/search via URL params (`?q=&sort=`); 紅漲綠跌 in zh, inverted in EN                                                                                           | server-rendered, toolbar island |
| `/api/quotes`   | normalized quote JSON for the islands                                                                                                                                                                          | route handler, 5-min revalidate |

## Architecture decisions (do not regress)

- **Server-first**: pages are async server components; interactivity lives only in
  `components/{explorer,graph,market,site}` islands.
- **i18n**: locale cookie read by `lib/i18n/server.ts#getLocale()`; `<html lang>` SSR'd;
  bilingual `LStr {en, zh}` strings throughout `lib/data/*`; pure `t()/pick()` helpers.
  No client i18n context. zh = zh-Hant-TW, never simplified.
- **Quotes**: `lib/server/quotes.ts` (`server-only`) fetches TWSE `STOCK_DAY_ALL` +
  TPEx `tpex_mainboard_daily_close_quotes`, filters to watched tickers, caches the
  normalized payload via `unstable_cache` (raw feeds exceed the 2 MB fetch-cache cap).
  Degrades gracefully offline (`ok:false` → UI shows structure + notice).
- **Canvas engines as hooks**: `use-scene.ts` (three.js lifecycle),
  `use-force-graph.ts` (d3-force + render loop + pan/zoom/drag). Live values are
  mirrored into refs inside `useEffect` — React 19 hooks/compiler lint passes with
  zero errors; keep it that way.
- **Design tokens**: navy `#0d1b2a` / ink `#eef4fb` / amber `#ffb703` mapped onto
  shadcn/Tailwind variables in `app/globals.css` (single dark theme). Graph stage
  palette is CVD-validated for this surface — don't reorder the slots.
- **RSC discipline**: never import runtime values from a `'use client'` module into a
  server component (this bit us once — `market-sort.ts` exists for that reason).

## Data

- `lib/data/supply-chain.ts` — 219 companies (202 TW), 37 categories, 10 stages,
  ~260 bilingual relation edges. Curated snapshot (Jul 2026): tickers/relations are
  research-grade, not verified financial data. `inboundRels()` derives reverse edges.
- `lib/data/silicon-stack.ts` — 24-company explorer dataset with illustrative
  price/mcap text; live quotes override price/chg when the ticker is TW-listed.

## Quality gates

`npm run lint` (zero errors) and `npm run build` must pass; screenshots of the three
surfaces belong in any PR that touches rendering. Disclaimers (非投資建議) must stay
on all three surfaces.
