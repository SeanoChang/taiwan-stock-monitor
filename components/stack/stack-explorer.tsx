'use client';

// `/stack` client island — the multi-axis tree explorer nav shell (Plan 006
// Phase G, Task 3; design spec `docs/superpowers/specs/2026-07-18-ai-server-
// stack-multi-axis-tree-design.md` §3–§6, §9 step 3). Composes the axis
// switcher, breadcrumb, mini-map drawer and the current node's children (as
// drill-in cards) around ONE piece of state: the URL hash `#/<axis>/<id>`.
//
// URL is the single source of truth (design spec §5's shareable-angle
// requirement): no `axis`/`currentId` React state exists here at all — both
// are *derived* every render from `window.location.hash` via
// `useSyncExternalStore`, which is what makes back/forward and a pasted
// link "just work" for free, and is what keeps a reload landing on the same
// node (`parseHash` is pure — same hash in, same {axis,id} out, every time).
// `getServerSnapshot` returns `''` (empty hash → the resolved default),
// exactly matching what the very first client paint sees pre-hydration, so
// there is no hydration-mismatch warning and no client-only flash.
//
// Every navigation (axis switch, breadcrumb crumb, mini-map click-to-fly,
// child-card drill-in) is a plain same-page hash `<a href="#/...">` — never
// an onClick + `history.pushState` call. A same-document hash `<a>` already
// updates `location.hash`, pushes a history entry, and fires `hashchange`
// natively; `subscribeHash` below just listens for that event. This is
// simpler than the Next.js SPA guide's `pushState`-in-an-onClick pattern
// (`node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md`
// §"Shallow routing on the client") because that pattern exists to keep
// Next's OWN router (`usePathname`/`useSearchParams`) in sync with
// *query-string* state — a hash fragment is never sent to the server and
// never touches Next's router at all, so a native anchor is both correct and
// the least code. It also means every link here is a REAL link: right-click
// "copy link address", middle-click-to-new-tab, and screen-reader link
// semantics all work with zero extra wiring.
//
// Cross-axis jump (design spec §5's signature interaction): switching axis
// keeps `currentId` and only swaps the axis segment of the hash
// (axis-switcher.tsx's own hrefs), so `pathTo`/`childrenOf` below just
// re-derive from the NEW axis's reverse index — the id itself never changes.
//
// `hashFor`/`ConfidenceBadge` etc. below are used only by THIS file's own
// JSX (the child-card grid); axis-switcher.tsx/breadcrumb.tsx/mini-map.tsx
// each keep their own trivial local copy of `hashFor` rather than importing
// it from here, to avoid a circular import (this file imports all three of
// them) — see breadcrumb.tsx's module doc for the full reasoning.

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AxisSwitcher } from '@/components/stack/axis-switcher';
import { Breadcrumb } from '@/components/stack/breadcrumb';
import { MiniMap } from '@/components/stack/mini-map';
import { NodePanel } from '@/components/stack/node-panel';
import type { Axis, Confidence } from '@/lib/data/stack-tree';
import { NODE_MAP, childrenOf, rootsOf } from '@/lib/data/stack-tree-nav';
import { l, pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';
import type { ClientQuotesPayload } from '@/lib/quotes-client';
import { useQuotes } from '@/lib/quotes-client';
import { cn } from '@/lib/utils';

export interface StackExplorerProps {
  locale: Locale;
  /** Server-fetched `getQuotes()` payload — seeds the shared client quote
   * cache (see the `useQuotes(quotes)` call below) so `<NodePanel>`'s own
   * `useQuotes()` call (its supplier quote chips) never has to wait on a
   * client-side `/api/quotes` round trip the way the home page's scrolly
   * stage does (that route's own doc explains why it DOESN'T seed: no
   * server payload is fetched there). This route's server page DOES fetch
   * one, so this is the "prefer seeding" branch `lib/quotes-client.ts`'s own
   * module doc recommends. */
  quotes: ClientQuotesPayload | null;
}

const AXES: Axis[] = ['containment', 'flow:data', 'flow:power', 'flow:heat', 'subsystem', 'stage'];
function isAxis(v: string | undefined): v is Axis {
  return !!v && (AXES as readonly string[]).includes(v);
}

const DEFAULT_AXIS: Axis = 'containment';
// Ultimate fallback if `rootsOf('containment')` were ever somehow empty —
// can't happen once `pnpm check:tree`'s "containment axis: no root found"
// assertion is green, but this keeps `parseHash` total (never throws) rather
// than relying on that gate alone.
const FALLBACK_ID = Object.keys(NODE_MAP)[0];

function hashFor(axis: Axis, id: string): string {
  return `#/${axis}/${id}`;
}

/** Pure: same hash string in, same `{axis, id}` out, every time — what makes
 * a reload/shared link land on the same node (Task 6 acceptance). An
 * unknown/missing axis falls back to `containment`; an unknown/missing id
 * falls back to that axis's first root — never throws on a malformed or
 * hand-edited hash. */
function parseHash(hash: string): { axis: Axis; id: string } {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const [axisRaw, idRaw] = raw.split('/').filter(Boolean);
  const axis = isAxis(axisRaw) ? axisRaw : DEFAULT_AXIS;
  const id = idRaw && NODE_MAP[idRaw] ? idRaw : (rootsOf(axis)[0] ?? FALLBACK_ID);
  return { axis, id };
}

function subscribeHash(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
function getHashSnapshot(): string {
  return window.location.hash;
}
function getServerHashSnapshot(): string {
  return '';
}

// Confidence-tier badge colors, matched to the existing CSS tokens
// (app/globals.css: --up #5ad19a / --primary #ffb703 / --tertiary #8a8a8f) —
// hardcoded here the same way `lib/format.ts`'s `upDownColor` already
// hardcodes --up/--down's hex values, rather than a CSS `color-mix()` off a
// `var(--x)` reference, so `withAlpha` below can composite a background off
// a known hex string.
const CONFIDENCE_META: Record<Confidence, { symbol: string; color: string; label: LStr }> = {
  verified: { symbol: '✓', color: '#5ad19a', label: l('Verified', '已驗證') },
  sourced: { symbol: '※', color: '#ffb703', label: l('Pending verification', '待查證') },
  gap: { symbol: '？', color: '#8a8a8f', label: l('Pending verification', '待查證') },
};

/** `#rrggbb` + a 0..1 alpha as an 8-digit hex — duplicated from
 * `components/explorer/branches/tier-ribbon.tsx`'s own `withAlpha` (same
 * "trivial pure helper, cheaper to copy than to share" precedent). */
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/** The ✓/※/？ marker (design spec §6). `sourced`/`gap` share the same
 * "待查證" label — both are non-actionable per the honesty invariant
 * (`edge.actionable === (confidence==='verified')`); the symbol/color is
 * what still tells the two apart. */
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

const SUPPLIERS_LABEL = l('suppliers', '家供應商');
const NO_SUPPLIER_LABEL = l('No supplier linked yet', '尚無供應商連結');
const NO_CHILDREN_LABEL = l(
  'No child nodes on this axis yet — try the mini-map or another axis.',
  '此角度尚無下層節點 — 可嘗試小地圖或切換角度。',
);
const EXPLORER_LABEL = l('Stack explorer', '堆疊探索');

/** One child-as-card: name, ✓/※/？ badge (from the edge that led here, per
 * the active axis — see stack-explorer's own `childEdges` lookup), supplier
 * count. Clicking drills in (re-roots to this node, same axis) — a real hash
 * `<a>`, see this file's module doc for why. Non-actionable (※/？) edges
 * render visibly dimmed, the honesty-invariant "quarantine" treatment. */
function ChildCard({
  axis,
  id,
  name,
  supplierCount,
  confidence,
  actionable,
  locale,
}: {
  axis: Axis;
  id: string;
  name: string;
  supplierCount: number;
  confidence: Confidence;
  actionable: boolean;
  locale: Locale;
}) {
  return (
    <li>
      <a
        href={hashFor(axis, id)}
        className={cn(
          'ss-hairline bg-secondary hover:border-primary hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full flex-col gap-1.5 rounded-[var(--radius-md)] border px-3.5 py-3 transition-colors outline-none focus-visible:ring-2',
          !actionable && 'opacity-70',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1 text-[13px] leading-snug font-semibold">{name}</span>
          <ConfidenceBadge confidence={confidence} locale={locale} />
        </div>
        <span className="text-tertiary text-[11px]">
          {supplierCount > 0
            ? `${supplierCount} ${pick(SUPPLIERS_LABEL, locale)}`
            : pick(NO_SUPPLIER_LABEL, locale)}
        </span>
      </a>
    </li>
  );
}

export function StackExplorer({ locale, quotes }: StackExplorerProps) {
  // Seed-only here: primes the shared module-level quote cache
  // (lib/quotes-client.ts) on first mount of this route so `<NodePanel>`'s
  // own `useQuotes()` call below resolves instantly instead of waiting on a
  // fetch. This file's own JSX doesn't render price data itself — the
  // children cards show name/badge/supplier COUNT only; live quotes render
  // inside `<NodePanel>` — so the return value here is intentionally unused.
  useQuotes(quotes);

  const hash = useSyncExternalStore(subscribeHash, getHashSnapshot, getServerHashSnapshot);
  const { axis, id: currentId } = useMemo(() => parseHash(hash), [hash]);

  // Normalize an empty/invalid hash to the resolved default once mounted, so
  // the address bar itself reflects state (copy/share works) even before any
  // click. `replaceState`, not `location.hash =`: this must NOT add a
  // back-button entry, and deliberately fires no `hashchange` — `axis`/
  // `currentId` above already equal this exact default (`parseHash` is
  // pure), so nothing downstream needs to re-run.
  useEffect(() => {
    const normalized = hashFor(axis, currentId);
    if (window.location.hash !== normalized) {
      window.history.replaceState(null, '', normalized);
    }
  }, [axis, currentId]);

  const node = NODE_MAP[currentId];
  const childIds = useMemo(() => childrenOf(axis, currentId), [axis, currentId]);
  const childEdges = useMemo(() => {
    const edges = node?.edges.filter((e) => e.axis === axis) ?? [];
    return new Map(edges.map((e) => [e.to, e]));
  }, [node, axis]);

  // `parseHash` only ever returns ids that resolve in NODE_MAP (its own
  // fallback chain guarantees this) — defensive-only, never expected live.
  if (!node) return null;

  return (
    <section aria-label={pick(EXPLORER_LABEL, locale)} className="mt-8 flex flex-col gap-5">
      <AxisSwitcher axis={axis} currentId={currentId} locale={locale} />
      <Breadcrumb axis={axis} currentId={currentId} locale={locale} />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <NodePanel node={node} locale={locale} />

          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {childIds.length === 0 ? (
              <li className="text-tertiary col-span-full text-[12.5px] italic">
                {pick(NO_CHILDREN_LABEL, locale)}
              </li>
            ) : (
              childIds.map((id) => {
                const edge = childEdges.get(id);
                const child = NODE_MAP[id];
                if (!edge || !child) return null;
                return (
                  <ChildCard
                    key={id}
                    axis={axis}
                    id={id}
                    name={pick(child.name, locale)}
                    supplierCount={child.companyIds?.length ?? 0}
                    confidence={edge.confidence}
                    actionable={edge.actionable}
                    locale={locale}
                  />
                );
              })
            )}
          </ul>
        </div>

        <MiniMap axis={axis} currentId={currentId} locale={locale} />
      </div>
    </section>
  );
}
