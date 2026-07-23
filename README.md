# 矽鏈 Silicon Stack — Taiwan AI Supply-Chain Monitor

Interactive monitor for the Taiwan-centered AI hardware supply chain:

- **`/` — 3D Explorer.** A free-navigation three.js journey from the
  data-center rack down to the 4 nm transistor, with per-company panels and
  live quotes.
- **`/supply-chain` — Network graph.** Force-directed canvas graph of **229
  TWSE/TPEx-listed companies** + global anchors across **42 chain segments**
  (photoresist, EUV pods, glass-fiber cloth, copper foil, CCL, PCB, substrates,
  foundry, OSAT, cooling, power, mechanics, optics, ODMs, cloud…). Click a node
  to trace 1st/2nd-degree relationships; search, stage filters, deep links via
  `?focus=<companyId>`.

Bilingual: **繁體中文（台灣）by default**, English toggle (cookie-persisted,
SSR-rendered). Quote colors follow the local convention in Chinese (紅漲綠跌)
and the western convention in English.

## Architecture

Next.js App Router, server-first:

- **Server components by default.** Pages resolve locale (cookie) on the
  server; interactivity lives in scoped client islands
  (`components/explorer/*`, `components/graph/*`).
- **Live quotes** (`lib/server/quotes.ts`, marked `server-only`): TWSE
  `STOCK_DAY_ALL` + TPEx `mainboard_daily_close_quotes` open data, normalized to
  the ~230 watched tickers and cached 5 minutes via `unstable_cache` (raw feeds
  exceed the fetch-cache limit). Exposed to the company/node panels at
  `GET /api/quotes`.
- **i18n** without a client context: `getLocale()` on the server, bilingual
  strings (`LStr`) in the datasets, pure `t()/pick()` helpers everywhere.
- **Canvas engines as hooks**: `use-scene.ts` (three.js lifecycle) and
  `use-force-graph.ts` (d3-force simulation + render loop + pan/zoom/drag),
  compliant with the React 19 hooks/compiler lint rules.
- **Design tokens**: the Silicon Stack navy/amber language is mapped onto
  shadcn/Tailwind theme variables in `app/globals.css`; UI is composed from
  shadcn components (`button`, `badge`, `input`). Graph stage colors are a
  CVD-validated 8-slot categorical palette for the dark surface.

```
app/            pages (server) + api/quotes route handler
components/
  explorer/     3D explorer island (hooks + HUD + panel)
  graph/        network graph island (model + engine hook + panel + legend)
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
pnpm install
pnpm dev        # http://localhost:3000
pnpm lint
pnpm test       # dataset + part-registry gates (check:data, check:parts)
pnpm build
```

## Data & disclaimers

- Quotes: TWSE / TPEx OpenAPI (latest daily session, ~5 min cache). When feeds
  are unreachable the UI degrades to structure-only with a notice.
- The company list, groupings and relationship edges are a **curated research
  snapshot** (Jul 2026) — verify against primary sources before acting on them.
  Nothing here is investment advice. Research provenance lives in
  `docs/superpowers/ai-server-stack/`; the consolidated plan history is in
  `docs/superpowers/plans.md`.
