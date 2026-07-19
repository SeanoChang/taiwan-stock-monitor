'use client';

// Node info panel — the currently-selected node's full detail: name, blurb,
// its own ✓/※/？ confidence marker, `specs` (value+unit, per-spec citation +
// confidence), and its `companyIds` resolved to live-quoted supplier links
// (Plan 006 Phase G, Task 4; design spec `docs/superpowers/specs/2026-07-18-
// ai-server-stack-multi-axis-tree-design.md` §6, §9 step 4).
//
// Rendered inline as the "selected" node's header in stack-explorer.tsx's
// main column — see that file's own module doc: navigating (a hash change)
// to become the current node IS "selecting" it here, so this panel always
// shows the node currently at the root of the active axis view, with its
// children remaining separate drill-in cards below it. No open/close state
// of its own — always mounted for the current node, same as
// `graph/node-panel.tsx`'s detail panel is always mounted for its selected
// node (that one adds a slide-over + close button because it floats OVER a
// canvas; here the "canvas" IS the page column, so this is plain inline
// content, no overlay needed).
//
// `ConfidenceBadge`/`CONFIDENCE_META`/`withAlpha` are duplicated from
// stack-explorer.tsx rather than imported — that file already imports THIS
// one (to render it inline), so importing back would create a cycle; same
// "trivial pure helper, cheaper to copy than to share" precedent
// breadcrumb.tsx/mini-map.tsx/axis-switcher.tsx already establish for their
// own local `hashFor` copies.
//
// A node's OWN confidence isn't a field on `StackNode` — `edgeTo()` in
// `lib/data/stack-tree.ts` stamps a confidence onto every EDGE that targets
// a node (never onto the node itself), so this file derives "this node's
// tier" the same way any parent already implicitly does: scan `STACK_NODES`
// once for the first edge whose `to === id` and take that edge's
// `confidence` — every edge into a given node carries the same value by
// construction (`edgeTo()` reads it from one shared per-target tier keyed by
// `to`), so "first found" is exactly "all of them agree". Pure
// organizational nodes (the `sub.*`/`stage.*` axis-root GROUP nodes — never
// an edge target anywhere in the dataset; confirmed by grep and by
// `check-tree.ts`'s own reachability scan never flagging them as orphans
// via an inbound edge) have no such edge and therefore no marker: showing a
// fabricated ✓/※/？ on a navigational grouping — which asserts nothing about
// hardware or a supplier — would itself be dishonest, so the badge and the
// supplier/specs sections below all just quietly omit themselves for these
// ids (`companies`/`specs` are empty for group nodes anyway).
//
// Supplier "links" reuse this SAME node-level confidence for every company
// in `companyIds` — the data model has no separate per-company edge/tier
// (`companyIds` is a flat id array, not its own sub-graph), so "how sure are
// we this node's hardware fact is right" and "how sure are we these are its
// suppliers" are, honestly, one claim. `actionable` mirrors the honesty
// invariant used everywhere else in this feature:
// `actionable === (confidence === 'verified')`.
//
// Per-spec `sourceUrl`s are repo-relative doc/source paths (see
// `lib/data/stack-tree.ts`'s own `SRC_NAVMAP`/`SRC_SPEC`/`SRC_STAGES`
// constants) — real files in this project's own (public) GitHub repo, not
// in-app routes. Resolving them against the repo's GitHub blob URL, rather
// than rendering dead text, is what makes "source link" in the Task 4 brief
// literally true: a reviewer can actually open the cited doc.

import Link from 'next/link';
import { STACK_NODES } from '@/lib/data/stack-tree';
import type { Confidence, StackNode, StackSpec } from '@/lib/data/stack-tree';
import { COMPANY_MAP } from '@/lib/data/supply-chain';
import { l, pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';
import { fmtPct } from '@/lib/format';
import type { ClientQuotesPayload } from '@/lib/quotes-client';
import { normalizeCode, upDownColor, useQuotes } from '@/lib/quotes-client';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Confidence badge — duplicated from stack-explorer.tsx, see module doc.
const CONFIDENCE_META: Record<Confidence, { symbol: string; color: string; label: LStr }> = {
  verified: { symbol: '✓', color: '#5ad19a', label: l('Verified', '已驗證') },
  sourced: { symbol: '※', color: '#ffb703', label: l('Pending verification', '待查證') },
  gap: { symbol: '？', color: '#8a8a8f', label: l('Pending verification', '待查證') },
};

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

function ConfidenceBadge({ confidence, locale }: { confidence: Confidence; locale: Locale }) {
  const meta = CONFIDENCE_META[confidence];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
      style={{ color: meta.color, backgroundColor: withAlpha(meta.color, 0.16) }}
    >
      <span aria-hidden="true">{meta.symbol}</span>
      {pick(meta.label, locale)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Node-level confidence — first incoming edge across ANY axis (see module
// doc for why "first" is safe). Built once, module scope, same "build once,
// reuse for the whole session" precedent `lib/data/stack-tree-nav.ts`'s own
// `NODE_MAP`/`AXIS_CACHE` establish, rather than rescanning ~110 nodes ×
// their edges on every render.
const INCOMING_CONFIDENCE: Record<string, Confidence> = (() => {
  const map: Record<string, Confidence> = {};
  for (const n of STACK_NODES) {
    for (const e of n.edges) {
      if (!(e.to in map)) map[e.to] = e.confidence;
    }
  }
  return map;
})();

function nodeConfidence(id: string): Confidence | null {
  return INCOMING_CONFIDENCE[id] ?? null;
}

// GitHub blob base for resolving `StackSpec.sourceUrl`'s repo-relative paths
// into real clickable citations — see module doc. This app IS the
// `taiwan-stock-monitor` repo (a singleton product codebase, not a shared
// library), so hardcoding its own public remote here is no different from
// any other repo-specific constant already in this file (e.g. the
// `/supply-chain?focus=` route below).
const REPO_BLOB_BASE = 'https://github.com/SeanoChang/taiwan-stock-monitor/blob/main/';

const SPECS_LABEL = l('Specs', '規格');
const SUPPLIERS_LABEL = l('Suppliers', '供應商');
const NO_SUPPLIER_LABEL = l('No supplier linked yet', '尚無供應商連結');
const VIEW_IN_GRAPH_LABEL = l('View in graph', '在圖譜中檢視');
const SOURCE_LINK_LABEL = l('Open source', '開啟來源');

/** One spec row: value(+unit), its own confidence badge, and (below, full-
 * width) a citation link to its source doc. Reachable at every width, not
 * just sm+ (FIX 1, final-review pass) — this IS spec §6's honesty
 * affordance: a per-spec citation a reviewer can actually open.
 *
 * The link is a flex sibling of `value`/badge, not nested in its own
 * `shrink-0` box — a fixed-width non-shrinking sourceUrl chunk sitting
 * beside `value` on the SAME row squeezed `value` (a `min-w-0 flex-1` span)
 * down to a sliver on narrow phones, wrapping it into an unreadably narrow
 * column that visually overlapped the link. Instead the link takes
 * `basis-full` below `sm` — its own full-width row underneath value+badge —
 * and only collapses back to an inline trailing chunk at `sm:basis-auto`,
 * the same "trailing detail drops to its own line on mobile" idiom
 * `SupplierLink` below already uses for its `在圖譜中檢視` label. */
function SpecRow({ spec, locale }: { spec: StackSpec; locale: Locale }) {
  return (
    <li className="ss-hairline bg-secondary flex min-h-11 flex-wrap items-center gap-2.5 rounded-[var(--radius-md)] border px-3.5 py-2.5">
      <span className="min-w-0 flex-1 text-[12.5px] leading-snug">
        {spec.value}
        {spec.unit ? ` ${spec.unit}` : ''}
      </span>
      <ConfidenceBadge confidence={spec.confidence} locale={locale} />
      {spec.sourceUrl && (
        // `inline-flex min-h-11 items-center` gives the (visually small,
        // font-mono) link a ≥44px tap target the same way breadcrumb.tsx's
        // crumb links do, rather than relying on the row's own height. A
        // bare `title` isn't exposed to touch/screen-reader users, so the
        // accessible name is an explicit bilingual `aria-label` instead
        // (the filename is still the visible text for sighted users).
        <a
          href={`${REPO_BLOB_BASE}${spec.sourceUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${pick(SOURCE_LINK_LABEL, locale)}: ${spec.sourceUrl.split('/').pop()}`}
          className="text-tertiary hover:text-primary focus-visible:ring-ring inline-flex min-h-11 basis-full items-center truncate rounded-[var(--radius-sm)] font-mono text-[10px] underline-offset-2 outline-none hover:underline focus-visible:ring-2 sm:max-w-[9.5rem] sm:basis-auto"
          title={spec.sourceUrl}
        >
          {spec.sourceUrl.split('/').pop()}
        </a>
      )}
    </li>
  );
}

/** One supplier link: name/ticker/live-quote chip (`hardware-card.tsx`'s
 * `CompanyChip` pattern, 紅漲綠跌 via `upDownColor`, blank-graceful when no
 * quote is available) PLUS this node's own confidence badge, deep-linking to
 * `/supply-chain?focus=<companyId>` (the brief's `在圖譜中檢視` control —
 * the whole row IS that deep-link, its trailing label makes the destination
 * explicit). Non-actionable (※/？) rows render visibly dimmed — the
 * quarantine treatment `ChildCard` in stack-explorer.tsx already uses for
 * child nodes, applied here to the supplier claim itself. */
function SupplierLink({
  companyId,
  confidence,
  actionable,
  quotes,
  locale,
}: {
  companyId: string;
  confidence: Confidence;
  actionable: boolean;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
}) {
  const company = COMPANY_MAP[companyId];
  if (!company) return null; // defensive only — check:tree gates every companyId resolves
  const isTW = company.exch === 'TWSE' || company.exch === 'TPEx';
  const quote = isTW ? quotes?.quotes[normalizeCode(company.ticker)] : undefined;
  const name = locale === 'zh' ? (company.zh ?? company.name) : company.name;
  const dot = quote ? upDownColor(quote.change, locale) : 'var(--tertiary)';

  return (
    <li>
      <Link
        href={`/supply-chain?focus=${company.id}`}
        className={cn(
          'ss-hairline bg-secondary hover:border-primary hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full flex-wrap items-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-2.5 transition-colors outline-none focus-visible:ring-2',
          !actionable && 'opacity-70',
        )}
      >
        <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: dot }} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{name}</span>
        <span className="text-tertiary shrink-0 font-mono text-[10px]">{company.ticker}</span>
        {quote ? (
          <span className="flex shrink-0 items-baseline gap-1 text-[11px] tabular-nums">
            <span className="font-semibold">NT${quote.close.toLocaleString()}</span>
            <span className="font-semibold" style={{ color: upDownColor(quote.change, locale) }}>
              {fmtPct(quote.changePct)}
            </span>
          </span>
        ) : (
          <span className="text-tertiary shrink-0 text-[10px]">—</span>
        )}
        <ConfidenceBadge confidence={confidence} locale={locale} />
        <span className="text-tertiary order-last basis-full text-[10px] sm:order-none sm:ml-1 sm:basis-auto">
          {pick(VIEW_IN_GRAPH_LABEL, locale)} →
        </span>
      </Link>
    </li>
  );
}

export interface NodePanelProps {
  node: StackNode;
  locale: Locale;
}

/** The current node's full detail — name, blurb, confidence marker, specs,
 * live-quoted supplier links. Fetches its own `useQuotes()` ONCE and passes
 * the payload down to every `SupplierLink`, rather than each link polling
 * `/api/quotes` independently (same "share one island" reasoning
 * `hardware-card.tsx`'s module doc gives for its own `quotes` prop). */
export function NodePanel({ node, locale }: NodePanelProps) {
  const quotes = useQuotes();
  const confidence = nodeConfidence(node.id);
  const actionable = confidence === 'verified';
  const companies = node.companyIds ?? [];
  const specs = node.specs ?? [];

  return (
    <div
      aria-label={pick(node.name, locale)}
      className="ss-hairline bg-card flex flex-col gap-4 rounded-[var(--radius-lg)] border px-5 py-4"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-[19px] font-semibold">{pick(node.name, locale)}</h2>
        {confidence && <ConfidenceBadge confidence={confidence} locale={locale} />}
      </div>

      <p className="text-muted-foreground text-[13px] leading-relaxed">
        {pick(node.blurb, locale)}
      </p>

      {specs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-eyebrow">{pick(SPECS_LABEL, locale)}</p>
          <ul className="flex flex-col gap-1.5">
            {specs.map((s, i) => (
              <SpecRow key={`${s.value}-${i}`} spec={s} locale={locale} />
            ))}
          </ul>
        </div>
      )}

      {(companies.length > 0 || node.categoryId) && (
        <div className="flex flex-col gap-1.5">
          <p className="text-eyebrow">{pick(SUPPLIERS_LABEL, locale)}</p>
          {companies.length === 0 ? (
            <p className="text-tertiary text-[12px] italic">{pick(NO_SUPPLIER_LABEL, locale)}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {companies.map((id) => (
                <SupplierLink
                  key={id}
                  companyId={id}
                  confidence={confidence ?? 'gap'}
                  actionable={actionable}
                  quotes={quotes}
                  locale={locale}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
