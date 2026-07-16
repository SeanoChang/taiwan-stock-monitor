# Plan 002 — Roadmap candidates (unscheduled)

> Backlog for future specs. Each item should get its own spec in
> `docs/superpowers/specs/` before Claude Code picks it up.

1. **Price history + charts** — TWSE `STOCK_DAY` per-ticker monthly OHLC endpoint;
   sparkline/candlestick in panels and `/market/[code]` detail page. Replace the
   decorative seeded sparkline in the explorer panel with real 30-day closes.
2. **Watchlist** — client-side watchlist (localStorage) surfaced on `/market` and
   as pinned nodes in the graph; export/import.
3. **Data verification pass** — script that cross-checks every ticker/name in
   `lib/data/supply-chain.ts` against the TWSE/TPEx feeds (names already come back
   from the quote join; assert zh name similarity, flag mismatches into a report).
4. **Tests** — vitest for `lib/server/quotes.ts` normalization (fixture JSON) and
   graph model integrity (ids/rels resolve); Playwright smoke for the three routes.
5. **CI/CD** — GitHub Actions: lint + build + tests on PR; deploy to Vercel
   (quotes route needs Node runtime, not edge).
6. **Refresh UX** — visible countdown/refresh control on `/market`; consider
   intraday endpoint (`mis.twse.com.tw`) for selected watchlist tickers only.
