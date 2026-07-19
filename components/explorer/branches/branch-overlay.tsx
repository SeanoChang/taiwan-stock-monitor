'use client';

// Ego-network branch overlay (Plan 006 Phase E, Task 2) — hover (desktop) /
// tap (mobile) a company chip on a Phase D hardware card blooms this radial
// "quick look": the hovered company at center (the ego), its ranked
// supplier/customer alters fanned across labeled branch lines, each alter a
// live-quoted chip. Hovering/clicking an alter *pivots* — it becomes the new
// ego and a breadcrumb trail grows, so the whole path back to the original
// root stays navigable (`jumpBack`). Deep-diving into the full force graph
// stays on /supply-chain (`onDeepLink`); this overlay is a fast, in-place
// look, never a second graph engine.
//
// Layer hygiene (Plan 006 Phase E's Global Constraints): this file imports
// only from `lib/data/adjacency.ts` (the shared ego-network source) and
// `lib/data/supply-chain` for company lookups — never from
// `components/graph/*`, which stays the full-graph deep-dive surface.
//
// Portals to `document.body` via `createPortal`: the overlay must paint
// above the scroll-disassembly stage and all of its chrome (CalloutLayer's
// cards at z-[9], copy-panel's z-[8], the header/handoff button at z-10/
// z-30) regardless of where its trigger sits in the tree, so it isn't at the
// mercy of an ancestor's `overflow`/`transform`/stacking context. `z-[60]`
// clears every z-index already in use in this codebase (the highest
// pre-existing one is the `<Select>` popover's `z-50`).
//
// State cadence: every piece of state here (`trail`, the "+N" tail-expand
// toggle) is set only from a click/hover/keydown handler — never from an
// rAF/scroll frame — so plain `useState` is the right tool throughout,
// unlike copy-panel.tsx/tier-ribbon.tsx's ref-driven per-frame writes.
//
// `trail` resets only via remount, by design (matches `BranchCluster`'s own
// `key={ego}` below): a caller that swaps `rootId` on an already-mounted
// instance should key this component by `rootId` itself (`<BranchOverlay
// key={rootId} rootId={rootId} .../>`) rather than expect an in-place reset
// — React's own recommended way to reset state on an identity change,
// cheaper and simpler than an effect that watches `rootId`.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ADJ, layoutBranches, rankAlters } from '@/lib/data/adjacency';
import type { Alter, BranchPoint } from '@/lib/data/adjacency';
import { COMPANY_MAP } from '@/lib/data/supply-chain';
import type { SCCompany } from '@/lib/data/supply-chain';
import { l, pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';
import { fmtPct } from '@/lib/format';
import type { ClientQuotesPayload } from '@/lib/quotes-client';
import { normalizeCode, upDownColor } from '@/lib/quotes-client';

export interface BranchOverlayProps {
  /** The company the overlay opens on — the first breadcrumb crumb.
   * Pivoting never mutates this, only `trail`. */
  rootId: string;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
  onClose: () => void;
  /** `在圖譜中檢視` — deep-links the *current* ego (`trail.at(-1)`), not
   * necessarily `rootId`, into the full graph at `/supply-chain?focus=`. */
  onDeepLink: (id: string) => void;
}

// Matches `layoutBranches`'s own default radius (lib/data/adjacency.ts) —
// named here so the cluster's footprint (`SIZE`) can be derived from it.
const RADIUS = 140;
// ≤8 alters bloom directly (design doc: "ego at center; ≤8 alters fanned
// across 300°"); the rest fold behind a "+N" chip that expands the tail.
const MAX_FANNED = 8;
// Half the largest chip's footprint (the ego chip, ~168px wide) plus a
// label-pill/padding allowance, so no chip clips the cluster box's edge.
const CLUSTER_MARGIN = 90;
const SIZE = (RADIUS + CLUSTER_MARGIN) * 2;

const BREADCRUMB_LABEL = l('Pivot trail', '瀏覽路徑');
const NO_LINKS_LABEL = l('No known supplier or customer links yet.', '目前尚無已知的供應鏈關聯。');

// Focus-trap fix (code review): every native Tab stop the dialog can ever
// contain — alter/tail chips, breadcrumb links, the close button, the "view
// in graph" button. Deliberately excludes `[tabindex="-1"]` (EgoChip's own
// programmatic-only focus target, see that component's doc) so the trap's
// wrap-around never lands on a node that isn't a real Tab stop in the page's
// natural order.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function displayName(id: string, locale: Locale): string {
  const c = COMPANY_MAP[id];
  if (!c) return id;
  return locale === 'zh' ? (c.zh ?? c.name) : c.name;
}

function quoteOf(company: SCCompany, quotes: ClientQuotesPayload | null) {
  const isTW = company.exch === 'TWSE' || company.exch === 'TPEx';
  return isTW ? quotes?.quotes[normalizeCode(company.ticker)] : undefined;
}

/** name + ticker + live quote, blank-graceful (unlisted / no quote yet /
 * offline `quotes` payload all just omit the price segment) — same rule as
 * hardware-card.tsx's `CompanyChip`. */
function QuoteLines({
  company,
  quotes,
  locale,
}: {
  company: SCCompany;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
}) {
  const quote = quoteOf(company, quotes);
  const name = locale === 'zh' ? (company.zh ?? company.name) : company.name;
  return (
    <>
      <span className="line-clamp-1 w-full text-[12px] leading-snug font-semibold">{name}</span>
      <span className="text-tertiary font-mono text-[9.5px]">{company.ticker}</span>
      {quote ? (
        <span className="flex items-baseline gap-1 text-[10.5px] tabular-nums">
          <span className="font-semibold">NT${quote.close.toLocaleString()}</span>
          <span className="font-semibold" style={{ color: upDownColor(quote.change, locale) }}>
            {fmtPct(quote.changePct)}
          </span>
        </span>
      ) : (
        <span className="text-tertiary text-[9.5px]">—</span>
      )}
    </>
  );
}

/** The ego at the fan's center — informational, not interactive (you're
 * already centered on it); `tabIndex={-1}` makes it a valid *programmatic*
 * focus target (never a Tab stop) so `BranchCluster`'s mount-effect can move
 * focus here without adding a phantom item to the page's natural Tab
 * order. */
function EgoChip({
  company,
  quotes,
  locale,
  chipRef,
}: {
  company: SCCompany;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
  chipRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={chipRef}
      tabIndex={-1}
      className="ss-hairline ss-veil absolute top-1/2 left-1/2 flex w-[168px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-[var(--radius-lg)] border px-4 py-3.5 text-center outline-none"
    >
      <QuoteLines company={company} quotes={quotes} locale={locale} />
    </div>
  );
}

/** Decorative echo of the branch line's `rel` label — `aria-hidden` since
 * the same text is already folded into the alter chip's own `aria-label`
 * (see `AlterChip`), so a screen reader only announces it once. */
function BranchLabel({
  point,
  label,
  locale,
}: {
  point: BranchPoint;
  label: LStr;
  locale: Locale;
}) {
  const mx = point.x * 0.42;
  const my = point.y * 0.42;
  return (
    <span
      aria-hidden="true"
      style={{ left: `calc(50% + ${mx}px)`, top: `calc(50% + ${my}px)` }}
      className="ss-hairline bg-secondary/85 text-tertiary absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-1.5 py-0.5 text-[9px] leading-none whitespace-nowrap"
    >
      {pick(label, locale)}
    </span>
  );
}

/** One alter: fanned chip that pivots the ego. Desktop hover pivots via
 * `onHoverPivot` (the design doc's "hover an alter → pivot"); `onClickPivot`
 * covers keyboard `Enter`/`Space` (native `<button>` click semantics) and
 * touch tap. The two are separate props, not one shared handler, because a
 * real mouse click is *always* preceded by its own `mouseenter` — see
 * `BranchOverlay`'s `onAlterClickPivot` for why firing both unconditionally
 * on the same click double-pivots. ≥44px hit target on both axes. */
function AlterChip({
  alter,
  point,
  quotes,
  locale,
  onHoverPivot,
  onClickPivot,
}: {
  alter: Alter;
  point: BranchPoint;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
  onHoverPivot: (id: string) => void;
  onClickPivot: (id: string, e: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  const company = COMPANY_MAP[alter.id];
  if (!company) return null;
  const name = locale === 'zh' ? (company.zh ?? company.name) : company.name;
  const relText = pick(alter.label, locale);
  const pivotLabel = pick(
    l(`${relText} — pivot to ${name}`, `${relText} — 以「${name}」為中心`),
    locale,
  );
  return (
    <button
      type="button"
      onMouseEnter={() => onHoverPivot(alter.id)}
      onClick={(e) => onClickPivot(alter.id, e)}
      aria-label={pivotLabel}
      style={{ left: `calc(50% + ${point.x}px)`, top: `calc(50% + ${point.y}px)` }}
      className="ss-hairline bg-secondary hover:border-primary hover:bg-accent focus-visible:ring-ring absolute flex min-h-11 w-[136px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-[var(--radius-md)] border px-2.5 py-2 text-center transition-colors outline-none focus-visible:ring-2"
    >
      <QuoteLines company={company} quotes={quotes} locale={locale} />
    </button>
  );
}

/** Folds every alter past `MAX_FANNED - 1` behind a "+N" chip on the last
 * fanned slot; clicking it expands the tail (all alters, still capped by
 * `layoutBranches`' own 300° sweep — never a second ring). */
function TailChip({
  point,
  count,
  locale,
  onOpen,
}: {
  point: BranchPoint;
  count: number;
  locale: Locale;
  onOpen: () => void;
}) {
  const label = pick(l(`Show ${count} more`, `顯示其餘 ${count} 家`), locale);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      style={{ left: `calc(50% + ${point.x}px)`, top: `calc(50% + ${point.y}px)` }}
      className="ss-hairline bg-secondary hover:border-primary hover:bg-accent focus-visible:ring-ring absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border px-3 text-[12px] font-semibold transition-colors outline-none focus-visible:ring-2"
    >
      +{count}
    </button>
  );
}

/**
 * The radial bloom for one ego: SVG branch lines (crisp geometry) underneath
 * HTML chips (crisp text) laid out by `layoutBranches`. Keyed by `ego` at
 * its call site below — a fresh mount per pivot, which both resets the
 * "+N" tail-expand toggle for free and replays the `fadeUp` entrance so
 * every new bloom, not just the first, gets the same motion.
 */
function BranchCluster({
  ego,
  quotes,
  locale,
  onHoverPivot,
  onClickPivot,
}: {
  ego: string;
  quotes: ClientQuotesPayload | null;
  locale: Locale;
  onHoverPivot: (id: string) => void;
  onClickPivot: (id: string, e: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  const [tailOpen, setTailOpen] = useState(false);
  const egoCompany = COMPANY_MAP[ego];
  const ranked = useMemo(() => rankAlters(ADJ.get(ego) ?? [], Number.MAX_SAFE_INTEGER), [ego]);

  // Move focus onto this ego chip once, when this bloom mounts — since this
  // whole component is keyed by `ego` at its call site, that's exactly once
  // per pivot (including the overlay's initial open). A plain `useRef` +
  // mount-only effect, deliberately *not* a callback-ref prop threaded down
  // from the parent: a callback ref's identity changing across an unrelated
  // parent re-render (e.g. `useQuotes()`'s 5-minute refresh) would call
  // `.focus()` again on every such re-render, stealing focus from wherever
  // the user has since moved it (a close button, an alter chip's Tab
  // stop) — a real bug this mount-scoped effect avoids entirely.
  const egoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    egoRef.current?.focus();
  }, []);
  const overflow = ranked.length > MAX_FANNED;
  const shown = tailOpen || !overflow ? ranked : ranked.slice(0, MAX_FANNED - 1);
  const hiddenCount = tailOpen || !overflow ? 0 : ranked.length - shown.length;
  const slots = shown.length + (hiddenCount > 0 ? 1 : 0);
  const points = layoutBranches(slots, RADIUS);

  if (!egoCompany) return null;

  return (
    <div
      className="relative"
      style={{ width: SIZE, height: SIZE, animation: 'fadeUp 0.4s var(--ease-apple)' }}
    >
      <svg
        viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {shown.map((alter, i) => (
          <line
            key={alter.id}
            x1={0}
            y1={0}
            x2={points[i].x}
            y2={points[i].y}
            stroke="var(--foreground)"
            strokeOpacity={0.22}
            strokeWidth={1.25}
          />
        ))}
        {hiddenCount > 0 && (
          <line
            x1={0}
            y1={0}
            x2={points[points.length - 1].x}
            y2={points[points.length - 1].y}
            stroke="var(--foreground)"
            strokeOpacity={0.14}
            strokeWidth={1.25}
            strokeDasharray="2 3"
          />
        )}
      </svg>

      {shown.map((alter, i) => (
        <BranchLabel
          key={`label-${alter.id}`}
          point={points[i]}
          label={alter.label}
          locale={locale}
        />
      ))}

      <EgoChip company={egoCompany} quotes={quotes} locale={locale} chipRef={egoRef} />

      {shown.map((alter, i) => (
        <AlterChip
          key={alter.id}
          alter={alter}
          point={points[i]}
          quotes={quotes}
          locale={locale}
          onHoverPivot={onHoverPivot}
          onClickPivot={onClickPivot}
        />
      ))}

      {hiddenCount > 0 && (
        <TailChip
          point={points[points.length - 1]}
          count={hiddenCount}
          locale={locale}
          onOpen={() => setTailOpen(true)}
        />
      )}

      {ranked.length === 0 && (
        <p className="text-tertiary absolute top-[calc(50%+64px)] left-1/2 w-[200px] -translate-x-1/2 text-center text-[11px] leading-relaxed">
          {pick(NO_LINKS_LABEL, locale)}
        </p>
      )}
    </div>
  );
}

export function BranchOverlay({ rootId, quotes, locale, onClose, onDeepLink }: BranchOverlayProps) {
  const [trail, setTrail] = useState<string[]>(() => [rootId]);
  const ego = trail[trail.length - 1] ?? rootId;

  // Focus trap + restoration (code review fix). `dialogRef` scopes the Tab
  // wrap-around to this dialog's own subtree; `triggerRef` captures whatever
  // had focus the instant this component was *asked to render* — the click/
  // keyboard-activated company chip on the Phase D card underneath (a real
  // mouse hover never moves focus, so this is `document.body` or whatever
  // was last focused in that case, which `.focus()` on is a harmless no-op)
  // — and restores it on unmount.
  //
  // Captured via the lazy-ref-init pattern (a plain `if` during render, not
  // an effect) rather than `useEffect(() => { triggerRef.current =
  // document.activeElement; }, [])`: React commits effects bottom-up (every
  // *descendant's* effects fire before this component's own), and
  // `BranchCluster` below has its own mount effect that moves focus onto its
  // ego chip. An effect here would run *after* that child effect already
  // stole focus, capturing the ego chip itself as the "trigger" instead of
  // the real one — restoring focus right back into the overlay that's
  // closing. Reading `document.activeElement` during render sidesteps this
  // entirely: render always completes, parent *and* children, before any
  // effect (child or parent) gets to run.
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null | undefined>(undefined);
  if (triggerRef.current === undefined) {
    triggerRef.current = typeof document !== 'undefined' ? document.activeElement : null;
  }
  // Restoring is a lifecycle concern (runs once, on unmount) even though
  // capturing isn't — this mount-effect-with-cleanup only ever fires its
  // cleanup, one time, when `ScrollyStage` clears `openEgo` and unmounts
  // this whole component (pivoting via `trail` never remounts it, only the
  // inner `BranchCluster` — see that component's own `egoRef` effect above).
  useEffect(() => {
    return () => {
      const trigger = triggerRef.current;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  const pivot = (id: string) => setTrail((prev) => [...prev, id]);
  const jumpBack = (i: number) => setTrail((prev) => prev.slice(0, i + 1));

  // A real (or touch-synthesized) mouse click on an `AlterChip` is *always*
  // preceded by that same physical gesture's own `mouseenter` — hovering is
  // literally how a pointer arrives at the element it's about to click. Both
  // handlers pivoting unconditionally meant every ordinary click double-
  // pivoted: the hover's `pivot()` swaps in a freshly re-laid-out
  // `BranchCluster` (new ego, new alters, new positions) *before* the click
  // event lands, so that second pivot doesn't even repeat the hover's own
  // target — it fires on whatever unrelated alter now happens to occupy the
  // same screen coordinates, silently corrupting the trail (confirmed via
  // Phase E Task 5 browser smoke: a single click produced a 3-deep trail
  // instead of 1). `onAlterHoverPivot` is unchanged (still the primary
  // desktop affordance the design doc calls out); `onAlterClickPivot`
  // additionally records *when* a hover last pivoted and skips a `click`
  // that lands within `HOVER_CLICK_GUARD_MS` of it — long enough to absorb
  // the same gesture's own click (same-tick dispatch, no human reaction time
  // involved) but far shorter than any real second, deliberate action. A
  // keyboard-activated click (`Enter`/`Space` on a focused, un-hovered
  // button) always has `event.detail === 0` — MouseEvent's standard "not a
  // real pointer click" signal — so it bypasses the guard entirely and
  // always pivots, keeping Tab/Enter navigation exact regardless of timing.
  const lastHoverPivotAtRef = useRef(0);
  const HOVER_CLICK_GUARD_MS = 200;
  const onAlterHoverPivot = (id: string) => {
    lastHoverPivotAtRef.current = Date.now();
    pivot(id);
  };
  const onAlterClickPivot = (id: string, e: ReactMouseEvent<HTMLButtonElement>) => {
    if (e.detail !== 0 && Date.now() - lastHoverPivotAtRef.current < HOVER_CLICK_GUARD_MS) return;
    pivot(id);
  };

  // Esc closes from anywhere in the overlay, not just when a specific
  // element has focus — a document-level listener, torn down with the
  // overlay itself (mirrors `onClose`'s other trigger, the backdrop click,
  // being handled directly in JSX below). Same listener also traps Tab/
  // Shift+Tab within the dialog (code review fix): a document-level
  // `keydown` — rather than a listener on the dialog node itself — is what
  // lets this catch Tab presses that land on the backdrop or (via a bug
  // elsewhere) outside the dialog too, matching Esc's own "from anywhere in
  // the overlay" reach. The focusable set is recomputed on every Tab press
  // rather than cached, since it changes across a pivot (a fresh
  // `BranchCluster` = a different alter/tail-chip set) and across the "+N"
  // tail expanding.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        // Nothing tabbable (shouldn't happen — the close button alone always
        // qualifies — but keeps focus from ever escaping to the page behind
        // the veil if it somehow did).
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const withinDialog = active instanceof Node && dialog.contains(active);
      if (e.shiftKey) {
        if (!withinDialog || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!withinDialog || active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const egoName = displayName(ego, locale);
  const dialogLabel = pick(l(`Supplier network — ${egoName}`, `${egoName} 的供應鏈分支`), locale);

  // SSR-safe portal: on the server (and the client's very first paint, pre-
  // hydration) `document` doesn't exist yet. In practice a caller only ever
  // renders this component in response to a client-side hover/tap, so this
  // guard is a cheap belt-and-braces measure rather than something expected
  // to trigger — but it means this component can never crash a server
  // render if a future caller ends up including it unconditionally.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="ss-veil fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* `pb-16` (code review fix, tier-ribbon.tsx's own bottom-clearance
       * comment gives the same 64px figure): tier-ribbon.tsx elevates itself
       * above this very veil for as long as this overlay is mounted (its own
       * module doc explains why), so this scrollable dialog needs the same
       * bottom clearance scrolly-stage.tsx's reduced-motion nav already
       * reserves for it — otherwise this dialog's own bottom content (the
       * breadcrumb row, on a short viewport where the whole dialog scrolls
       * and that row ends up nearest the bottom of what's visible) would sit
       * underneath the now-elevated ribbon. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        tabIndex={-1}
        className="relative z-10 flex max-h-full w-full max-w-[560px] flex-col items-center gap-4 overflow-auto pb-16 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <nav
            aria-label={pick(BREADCRUMB_LABEL, locale)}
            className="min-w-0 flex-1 overflow-x-auto"
          >
            <ol className="flex items-center gap-1 whitespace-nowrap">
              {trail.map((id, i) => {
                const name = displayName(id, locale);
                const isCurrent = i === trail.length - 1;
                return (
                  <li key={`${id}-${i}`} className="flex items-center gap-1">
                    {i > 0 && (
                      <span aria-hidden="true" className="text-tertiary">
                        →
                      </span>
                    )}
                    {isCurrent ? (
                      <span className="text-foreground px-1 text-[12.5px] font-semibold">
                        {name}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => jumpBack(i)}
                        aria-label={pick(l(`Back to ${name}`, `回到「${name}」`), locale)}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-1.5 text-[12.5px] font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2"
                      >
                        {name}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close', locale)}
            className="ss-hairline bg-secondary hover:bg-accent focus-visible:ring-ring flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border text-[15px] outline-none focus-visible:ring-2"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <BranchCluster
            key={ego}
            ego={ego}
            quotes={quotes}
            locale={locale}
            onHoverPivot={onAlterHoverPivot}
            onClickPivot={onAlterClickPivot}
          />
        </div>

        <button
          type="button"
          onClick={() => onDeepLink(ego)}
          className="ss-hairline bg-secondary hover:border-primary hover:bg-accent focus-visible:ring-ring flex min-h-11 items-center gap-1.5 rounded-[var(--radius-pill)] border px-4 text-[12.5px] font-semibold transition-colors outline-none focus-visible:ring-2"
        >
          {t('viewInGraph', locale)}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
