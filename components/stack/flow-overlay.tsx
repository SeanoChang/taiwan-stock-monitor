'use client';

// Flow overlay — the `flow:data`/`flow:power`/`flow:heat` axes' extra view
// (Plan 006 Phase G, Task 5; design spec `docs/superpowers/specs/2026-07-18-
// ai-server-stack-multi-axis-tree-design.md` §4). A flow axis re-roots like
// any other axis (`AxisSwitcher`/`Breadcrumb`/`MiniMap`/child-cards in
// stack-explorer.tsx already all work unchanged, since they're generic over
// `Axis`), but sitting ON a flow axis ALSO renders this: the full ordered
// root→end path for the active flow, one hop per row, each hop's `flowSpec`
// (bandwidth/volt/°C — seeded in `lib/data/stack-tree.ts`'s Task-5 edits) as
// a label on the connector between it and the next node. Plus a small
// self-contained toggle chip row so a reader parked on one flow can hop to
// either sibling flow without scrolling back up to the main `AxisSwitcher`.
//
// Pure derivation, no internal state: given `axis`+`currentId` (both already
// owned by stack-explorer.tsx's URL-hash source of truth, see that file's own
// module doc), `walkFlowPath` below reads straight through
// `stack-tree-nav.ts`'s existing `rootsOf`/`childrenOf` — Task 5 doesn't
// touch that file, both utilities were already generic over axis. Flow axes
// are seeded (Task 5, `stack-tree.ts`) as single linear chains — each node
// has AT MOST one `flow:*` child — so walking `childrenOf(axis, cur)[0]`
// repeatedly is exhaustive, not a lossy simplification; the pattern mirrors
// `pathTo`'s own cycle-safe "first parent" walk, just forward instead of
// backward.
//
// Honesty invariant (spec §6) applies here exactly as everywhere else: each
// connector's `ConfidenceBadge` reflects the underlying edge's `confidence`,
// and a non-actionable (※/？) hop renders its destination node dimmed — the
// same "quarantine" treatment `ChildCard`/`SupplierLink` already use, applied
// to a flow hop instead of a child card or supplier link. Every flow edge
// seeded so far happens to be `verified` (the two source docs are both
// earlier-verified, not the 2026-07-18 upstream expansion — see
// `stack-tree.ts`'s `NODE_TIER` comment), but the dimming logic must still be
// real, not decorative, so a future `sourced`/`gap` flow hop renders honestly
// without a code change here.
//
// `ConfidenceBadge`/`CONFIDENCE_META`/`withAlpha`/`hashFor` are duplicated
// from stack-explorer.tsx rather than imported — that file imports THIS one,
// so importing back would cycle; same "trivial pure helper, cheaper to copy
// than to share" precedent breadcrumb.tsx/mini-map.tsx/axis-switcher.tsx/
// node-panel.tsx all already establish for their own local copies.

import type { Axis, Confidence, StackEdge } from '@/lib/data/stack-tree';
import { NODE_MAP, childrenOf, rootsOf } from '@/lib/data/stack-tree-nav';
import { l, pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

function hashFor(axis: Axis, id: string): string {
  return `#/${axis}/${id}`;
}

type FlowAxis = 'flow:data' | 'flow:power' | 'flow:heat';

function isFlowAxis(axis: Axis): axis is FlowAxis {
  return axis === 'flow:data' || axis === 'flow:power' || axis === 'flow:heat';
}

const FLOW_TOGGLE: { axis: FlowAxis; label: LStr }[] = [
  { axis: 'flow:data', label: l('Data', '資料') },
  { axis: 'flow:power', label: l('Power', '電力') },
  { axis: 'flow:heat', label: l('Heat', '熱') },
];

const FLOW_LABEL = l('Flow', '流向');
const PATH_LABEL = l('Flow path', '流向路徑');
const EMPTY_LABEL = l('No flow path seeded on this axis yet.', '此流向軸尚無路徑資料。');

// Confidence badge — duplicated, see module doc.
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

interface FlowHop {
  id: string;
  /** The edge FROM the previous hop INTO this one — `null` for the root
   * (index 0), which has no incoming edge on this axis by definition
   * (`rootsOf`). */
  edgeIn: StackEdge | null;
}

/** Root→end walk of `axis`'s single linear chain — see module doc for why
 * "first child, repeat" is exhaustive rather than lossy for a flow axis.
 * Cycle-safe (defensive only — `check:tree`'s no-self-edge + unique-id
 * assertions already rule out a real cycle in seeded data). Returns `[]` if
 * the axis has no root yet (an unseeded flow axis; graceful, not an error —
 * same posture `MiniMap`'s own `EMPTY_LABEL` already takes for this case). */
function walkFlowPath(axis: Axis): FlowHop[] {
  const [rootId] = rootsOf(axis);
  if (!rootId) return [];
  const hops: FlowHop[] = [{ id: rootId, edgeIn: null }];
  const seen = new Set([rootId]);
  let cur = rootId;
  for (;;) {
    const [nextId] = childrenOf(axis, cur);
    if (!nextId || seen.has(nextId)) break;
    const edge = NODE_MAP[cur]?.edges.find((e) => e.axis === axis && e.to === nextId) ?? null;
    hops.push({ id: nextId, edgeIn: edge });
    seen.add(nextId);
    cur = nextId;
  }
  return hops;
}

/** The self-contained 資料/電力/熱 toggle — a compact sibling of the three
 * flow chips `AxisSwitcher` already renders, scoped to just this trio so a
 * reader on one flow can hop to another without scrolling back to the main
 * switcher. Keeps `currentId` and only swaps the axis segment (cross-axis
 * jump, same contract every other nav control in this feature already
 * honors — see stack-explorer.tsx's own module doc). */
function FlowToggle({
  axis,
  currentId,
  locale,
}: {
  axis: FlowAxis;
  currentId: string;
  locale: Locale;
}) {
  return (
    <nav aria-label={pick(FLOW_LABEL, locale)}>
      <ul className="flex items-center gap-1.5">
        {FLOW_TOGGLE.map((entry) => {
          const isActive = entry.axis === axis;
          return (
            <li key={entry.axis}>
              <a
                href={hashFor(entry.axis, currentId)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'ss-hairline focus-visible:ring-ring inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border px-3.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2',
                  isActive
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                {pick(entry.label, locale)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** One connector: the arrow + (if seeded) the hop's `flowSpec` value/unit and
 * bilingual label. Purely decorative between two hop pills, so the arrow
 * itself is `aria-hidden`; the value/unit/label text is plain readable
 * content (no extra aria needed — a screen reader just reads it in flow). */
function FlowConnector({ edge, locale }: { edge: StackEdge; locale: Locale }) {
  return (
    <div className="ml-[15px] flex min-h-8 items-center gap-2 border-l border-dashed border-[var(--border)] py-1 pl-4">
      <span aria-hidden="true" className="text-tertiary text-[13px] leading-none">
        ↓
      </span>
      {edge.flowSpec && (
        <span className="text-foreground font-mono text-[11px] font-semibold whitespace-nowrap tabular-nums">
          {edge.flowSpec.value}
          {edge.flowSpec.unit}
        </span>
      )}
      {edge.flowSpec && (
        <span className="text-tertiary min-w-0 truncate text-[11px]">
          {pick(edge.flowSpec.label, locale)}
        </span>
      )}
    </div>
  );
}

export interface FlowOverlayProps {
  /** The active axis — this component renders `null` unless it's one of the
   * three flow axes (see `isFlowAxis`); typed as the general `Axis` so
   * stack-explorer.tsx can pass its own axis state straight through without
   * a narrowing dance at the call site. */
  axis: Axis;
  currentId: string;
  locale: Locale;
}

/** The flow diagram: toggle row + the full root→end path for the active
 * flow, current node highlighted. Renders nothing for a non-flow axis — the
 * caller (stack-explorer.tsx) can mount this unconditionally alongside the
 * generic axis view. */
export function FlowOverlay({ axis, currentId, locale }: FlowOverlayProps) {
  if (!isFlowAxis(axis)) return null;
  const hops = walkFlowPath(axis);

  return (
    <section
      aria-label={pick(PATH_LABEL, locale)}
      className="ss-hairline bg-card flex flex-col gap-4 rounded-[var(--radius-lg)] border px-5 py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-eyebrow">{pick(PATH_LABEL, locale)}</p>
        <FlowToggle axis={axis} currentId={currentId} locale={locale} />
      </div>

      {hops.length === 0 ? (
        <p className="text-tertiary text-[12.5px] italic">{pick(EMPTY_LABEL, locale)}</p>
      ) : (
        <ol className="flex flex-col">
          {hops.map((hop, i) => {
            const node = NODE_MAP[hop.id];
            if (!node) return null;
            const isCurrent = hop.id === currentId;
            const actionable = hop.edgeIn ? hop.edgeIn.actionable : true;
            return (
              <li key={hop.id} className="flex flex-col">
                {i > 0 && hop.edgeIn && <FlowConnector edge={hop.edgeIn} locale={locale} />}
                <a
                  href={hashFor(axis, hop.id)}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={cn(
                    'ss-hairline bg-secondary hover:border-primary hover:bg-accent focus-visible:ring-ring flex min-h-11 w-fit max-w-full items-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-2 transition-colors outline-none focus-visible:ring-2',
                    isCurrent && 'border-primary bg-primary/10',
                    !actionable && 'opacity-70',
                  )}
                >
                  <span className="min-w-0 truncate text-[13px] font-semibold">
                    {pick(node.name, locale)}
                  </span>
                  {hop.edgeIn && (
                    <ConfidenceBadge confidence={hop.edgeIn.confidence} locale={locale} />
                  )}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
