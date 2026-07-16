# 矽鏈 Silicon Stack — Taiwan AI Supply-Chain Monitor

Interactive monitor for the Taiwan-centered AI hardware supply chain:

- **`/` — 3D Explorer.** A three.js journey from the data-center rack down to the
  4 nm transistor (ported from a Claude Design project), with per-company panels.
- **`/supply-chain` — Network graph.** Force-directed canvas graph of **202
  TWSE/TPEx-listed companies** + global anchors across **37 chain segments**
  (photoresist, EUV pods, glass-fiber cloth, copper foil, CCL, PCB, substrates,
  foundry, OSAT, cooling, power, mechanics, optics, ODMs, cloud…). Click a node
  to trace 1st/2nd-degree relationships; search, stage filters, deep links via
  `?focus=<companyId>`.
- **`/market` — Market board.** Server-rendered daily quotes for every
  Taiwan-listed company in the chain, sortable/searchable via URL params.

Bilingual: **繁體中文（台灣）by default**, English toggle (cookie-persisted,
SSR-rendered). Market colors follow the local convention in Chinese (紅漲綠跌)
and the western convention in English.

## Architecture

Next.js App Router, server-first:

- **Server components by default.** Pages resolve locale (cookie) and data on
  the server; interactivity lives in scoped client islands
  (`components/explorer/*`, `components/graph/*`, `market-toolbar`).
- **Live quotes** (`lib/server/quotes.ts`, marked `server-only`): TWSE
  `STOCK_DAY_ALL` + TPEx `mainboard_daily_close_quotes` open data, normalized to
  the ~200 watched tickers and cached 5 minutes via `unstable_cache` (raw feeds
  exceed the fetch-cache limit). Exposed to islands at `GET /api/quotes`.
- **Market board filtering/sorting is URL state** (`?q=&sort=`) — the toolbar
  island writes params, the server component renders the result.
- **i18n** without a client context: `getLocale()` on the server, bilingual
  strings (`LStr`) in the datasets, pure `t()/pick()` helpers everywhere.
- **Canvas engines as hooks**: `use-scene.ts` (three.js lifecycle) and
  `use-force-graph.ts` (d3-force simulation + render loop + pan/zoom/drag),
  compliant with the React 19 hooks/compiler lint rules.
- **Design tokens**: the Silicon Stack navy/amber language is mapped onto
  shadcn/Tailwind theme variables in `app/globals.css`; UI is composed from
  shadcn components (`button`, `badge`, `input`, `select`, `table`, `card`).
  Graph stage colors are a CVD-validated 8-slot categorical palette for the
  dark surface.

```
app/            pages (server) + api/quotes route handler
components/
  explorer/     3D explorer island (hooks + HUD + panel)
  graph/        network graph island (model + engine hook + panel + legend)
  market/       toolbar island + server quote table
  site/         brand / nav / locale toggle
  ui/           shadcn primitives
lib/
  data/         curated bilingual datasets (companies, categories, relations)
  i18n/         locale config, dictionary, server resolver
  scene/        three.js scene module (imperative, typed)
  server/       quotes feed (server-only)
```

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Data & disclaimers

- Quotes: TWSE / TPEx OpenAPI (latest daily session, ~5 min cache). When feeds
  are unreachable the UI degrades to structure-only with a notice.
- The company list, groupings and relationship edges are a **curated research
  snapshot** (Jul 2026) — verify against primary sources before acting on them.
  Nothing here is investment advice.
