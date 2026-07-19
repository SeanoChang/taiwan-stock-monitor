'use client';

// Breadcrumb along the active axis (Plan 006 Phase G, Task 3; design spec
// `docs/superpowers/specs/2026-07-18-ai-server-stack-multi-axis-tree-design.md`
// §5). Reads `pathTo(axis, currentId)` — `lib/data/stack-tree-nav.ts`'s
// root-first ancestor chain for the CURRENT axis only, so switching axes
// (cross-axis jump) redraws this trail from the new axis's own parent chain
// while the node id itself never changes (see stack-explorer.tsx's `navigate`
// contract). Every crumb but the last is a plain same-page hash `<a>` — no
// onClick/JS routing needed, the browser's native hash navigation already
// updates the URL and fires `hashchange`, which stack-explorer.tsx's
// `useSyncExternalStore` subscription picks up (see that file's doc for why
// this is simpler and more robust than an imperative `history.pushState`
// call per click). `hashFor` is a one-line pure helper, deliberately
// duplicated in each of axis-switcher.tsx/breadcrumb.tsx/mini-map.tsx rather
// than imported from stack-explorer.tsx — the latter already imports THIS
// file, and importing back would make the two modules circular; the same
// "trivial pure helper, cheaper to copy than to share" precedent
// tier-ribbon.tsx/callout-drawer.tsx already establish elsewhere.

import type { Axis } from '@/lib/data/stack-tree';
import { NODE_MAP, pathTo } from '@/lib/data/stack-tree-nav';
import { l, pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';

const BREADCRUMB_LABEL = l('Breadcrumb', '路徑');

function hashFor(axis: Axis, id: string): string {
  return `#/${axis}/${id}`;
}

function nodeName(id: string, locale: Locale): string {
  const node = NODE_MAP[id];
  return node ? pick(node.name, locale) : id;
}

export function Breadcrumb({
  axis,
  currentId,
  locale,
}: {
  axis: Axis;
  currentId: string;
  locale: Locale;
}) {
  const trail = pathTo(axis, currentId);

  return (
    <nav aria-label={pick(BREADCRUMB_LABEL, locale)} className="min-w-0 overflow-x-auto">
      <ol className="flex items-center gap-1 whitespace-nowrap">
        {trail.map((id, i) => {
          const isCurrent = i === trail.length - 1;
          const name = nodeName(id, locale);
          return (
            <li key={`${id}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="text-tertiary text-[11px]">
                  →
                </span>
              )}
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="text-foreground inline-flex min-h-11 items-center px-1.5 text-[13px] font-semibold"
                >
                  {name}
                </span>
              ) : (
                <a
                  href={hashFor(axis, id)}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-1.5 text-[13px] font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2"
                >
                  {name}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
