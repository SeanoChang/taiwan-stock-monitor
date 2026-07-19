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
// re-derive from the NEW axis's reverse index — the id itself never changes
// PROVIDED `currentId` actually participates in the new axis. When it
// doesn't (e.g. `dc` has no `flow:power` edge in or out at all), keeping it
// would render an empty breadcrumb/child-grid, so `parseHash`'s own
// `participatesInAxis` check falls back to `rootsOf(axis)[0]` instead (FIX
// 2, final-review pass) — landing on the new axis's root rather than a
// blank view.
//
// `hashFor`/`ConfidenceBadge` etc. below are used only by THIS file's own
// JSX (the child-card grid); axis-switcher.tsx/breadcrumb.tsx/mini-map.tsx
// each keep their own trivial local copy of `hashFor` rather than importing
// it from here, to avoid a circular import (this file imports all three of
// them) — see breadcrumb.tsx's module doc for the full reasoning.
//
// Task 5 (flow axes + overlay): `<FlowOverlay>` mounts alongside the
// existing generic axis view (child-card grid, breadcrumb, mini-map — none
// of which needed to change, since they're already generic over `Axis`) and
// renders the flow-specific extra: the ordered root→end path for the active
// `flow:data`/`flow:power`/`flow:heat` axis, with each hop's `flowSpec`
// (bandwidth/volt/°C) on the connector. It self-guards for the other three
// axes (see its own module doc), so gating its mount here on `axis` is only
// to avoid a stray empty spacer wrapper — not load-bearing correctness.

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AxisSwitcher } from '@/components/stack/axis-switcher';
import { Breadcrumb } from '@/components/stack/breadcrumb';
import { FlowOverlay } from '@/components/stack/flow-overlay';
import { MiniMap } from '@/components/stack/mini-map';
import { NodePanel } from '@/components/stack/node-panel';
import type { Axis, Confidence } from '@/lib/data/stack-tree';
import { NODE_MAP, childrenOf, parentsOf, rootsOf } from '@/lib/data/stack-tree-nav';
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

/** Whether `id` participates in `axis` at all — has at least one child OR
 * one parent there (design spec §4's "root/leaf/branch" definition of
 * membership, same test `rootsOf`/`treeFor` already use internally). A node
 * can be a perfectly valid `StackNode` and still be absent from a given
 * axis's tree entirely (e.g. `dc` has no `flow:power` edge in or out) — see
 * `parseHash`'s use of this below (FIX 2, final-review pass). */
function participatesInAxis(axis: Axis, id: string): boolean {
  return childrenOf(axis, id).length > 0 || parentsOf(axis, id).length > 0;
}

/** Pure: same hash string in, same `{axis, id}` out, every time — what makes
 * a reload/shared link land on the same node (Task 6 acceptance). An
 * unknown/missing axis falls back to `containment`; an unknown/missing id,
 * OR an id that doesn't participate in the resolved axis at all (e.g. an
 * axis-switch chip that keeps `currentId` across a jump onto an axis it
 * never appears in — `dc` has no `flow:power` edge — see axis-switcher.tsx's
 * hrefs, which always keep `currentId` and let THIS function be the one
 * place that validates it against the axis), falls back to that axis's
 * first root instead of rendering an empty breadcrumb/child-grid — never
 * throws on a malformed or hand-edited hash either. */
function parseHash(hash: string): { axis: Axis; id: string } {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const [axisRaw, idRaw] = raw.split('/').filter(Boolean);
  const axis = isAxis(axisRaw) ? axisRaw : DEFAULT_AXIS;
  const id =
    idRaw && NODE_MAP[idRaw] && participatesInAxis(axis, idRaw)
      ? idRaw
      : (rootsOf(axis)[0] ?? FALLBACK_ID);
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

  // Normalize an empty/invalid/non-participating hash to its resolved
  // `{axis,id}`, so the address bar itself always reflects what's actually
  // on screen (copy/share works) — including right after mount (an
  // empty/pasted-deep-link/reload hash) AND after every later `hashchange`
  // (FIX 2, final-review pass: an axis-switch chip keeps `currentId` across
  // a jump and `parseHash` may fall back to that axis's root — e.g. `dc` →
  // `flow:power` → `flow.power.grid` — so the URL must catch up to match,
  // not keep showing the stale `dc` segment). `[hash]` deps (not `[]`) is
  // what makes it re-run on every navigation, not just mount.
  //
  // Still re-derives `normalized` from `window.location.hash` directly
  // rather than from the `axis`/`currentId` state above: on the very FIRST
  // effect flush after hydration specifically, that state still reflects
  // `getServerHashSnapshot()` (`''` → the default node), which can disagree
  // with a real, non-default hash the browser already has (a reload or a
  // pasted deep link) — `useSyncExternalStore`'s own hydration-mismatch
  // correction re-render hasn't necessarily run yet by the time this effect
  // first fires. Deriving from that stale render state would `replaceState`
  // the browser's real hash away to the default before React ever renders
  // the correct node, silently losing the shared link (Task 6 acceptance:
  // "a hash URL reload lands on the same node"). Reading
  // `window.location.hash` directly sidesteps that race on every run, mount
  // or not — `hash` (the dep) and `window.location.hash` always agree by
  // the time a non-initial run of this effect fires, since both come from
  // the same `hashchange`-driven update.
  // `replaceState`, not `location.hash =`: this must NOT add a back-button
  // entry — back/forward still lands on the ACTUAL prior hash the browser
  // pushed, `parseHash` just re-resolves it the same deterministic way.
  useEffect(() => {
    const real = window.location.hash;
    const resolved = parseHash(real);
    const normalized = hashFor(resolved.axis, resolved.id);
    if (real !== normalized) {
      window.history.replaceState(null, '', normalized);
    }
  }, [hash]);

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

          {/* Flow axes (Task 5) additionally render the ordered root→end
           * path as a diagram — gated on `axis` here (rather than always
           * mounting and letting `FlowOverlay` no-op) so a non-flow axis
           * doesn't leave a stray empty spacer wrapper in the DOM; the
           * component itself still independently no-ops for defense (see
           * its own module doc). */}
          {axis.startsWith('flow:') && (
            <div className="mt-4">
              <FlowOverlay axis={axis} currentId={currentId} locale={locale} />
            </div>
          )}

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
