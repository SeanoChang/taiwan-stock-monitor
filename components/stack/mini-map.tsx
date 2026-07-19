'use client';

// Mini-map drawer — the active axis's full tree (`treeFor(axis)`), current
// node lit, click-to-fly to any node in one tap (Plan 006 Phase G, Task 3;
// design spec `docs/superpowers/specs/2026-07-18-ai-server-stack-multi-axis-
// tree-design.md` §5). This is what actually delivers the "≤3 clicks to any
// node" acceptance criterion (Task 6): the containment tree alone is 6+
// levels deep (dc → rack → tray → package → substrate → glass-cloth), too
// deep to drill card-by-card in 3 clicks — but any node is exactly [open
// drawer] + [click node] = 2 clicks away here, from anywhere.
//
// Self-contained open/closed state (plain `useState`, a click-only toggle —
// same "no rAF/scroll frame touches this" reasoning branch-overlay.tsx's own
// module doc gives for its state): the drawer doesn't need to be controlled
// from outside, so stack-explorer.tsx just renders `<MiniMap .../>` without
// lifting anything.
//
// Fully expanded, no per-branch collapse: the whole seeded dataset is ~110
// nodes across all axes (`pnpm check:tree`'s own node count), small enough
// that a flat expand-everything tree (scrollable, `ss-scroll`) is simpler and
// more reliably "click-to-fly to ANY node" than a collapsed tree the user
// would have to expand first — v1 is card-view-first, not information-
// density-first (plan 006 Phase G goal).
//
// `hashFor` duplicated here — see breadcrumb.tsx's module doc for why
// (avoids a stack-explorer.tsx ↔ mini-map.tsx import cycle).

import { useId, useState } from 'react';
import type { Axis } from '@/lib/data/stack-tree';
import { NODE_MAP, treeFor } from '@/lib/data/stack-tree-nav';
import type { StackTreeNode } from '@/lib/data/stack-tree-nav';
import { l, pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

function hashFor(axis: Axis, id: string): string {
  return `#/${axis}/${id}`;
}

const MAP_LABEL = l('Mini-map', '小地圖');
const OPEN_LABEL = l('Open mini-map', '開啟小地圖');
const CLOSE_LABEL = l('Close mini-map', '收合小地圖');
const EMPTY_LABEL = l('No nodes seeded on this axis yet.', '此角度尚無節點資料。');

function nodeName(id: string, locale: Locale): string {
  const node = NODE_MAP[id];
  return node ? pick(node.name, locale) : id;
}

function TreeRow({
  node,
  axis,
  currentId,
  locale,
  depth,
}: {
  node: StackTreeNode;
  axis: Axis;
  currentId: string;
  locale: Locale;
  depth: number;
}) {
  const isCurrent = node.id === currentId;
  return (
    <li>
      <a
        href={hashFor(axis, node.id)}
        aria-current={isCurrent ? 'true' : undefined}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={cn(
          'focus-visible:ring-ring flex min-h-11 items-center rounded-[var(--radius-sm)] pr-2.5 text-[12.5px] transition-colors outline-none focus-visible:ring-2',
          isCurrent
            ? 'bg-primary/15 text-foreground font-semibold'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <span className="truncate">{nodeName(node.id, locale)}</span>
      </a>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              axis={axis}
              currentId={currentId}
              locale={locale}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function MiniMap({
  axis,
  currentId,
  locale,
}: {
  axis: Axis;
  currentId: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const roots = treeFor(axis);

  return (
    <div className="w-full shrink-0 lg:w-64">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="ss-hairline bg-secondary hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border px-3.5 text-[12.5px] font-semibold outline-none focus-visible:ring-2"
      >
        {pick(MAP_LABEL, locale)}
        <span aria-hidden="true" className={cn('transition-transform', open && 'rotate-180')}>
          ▾
        </span>
        <span className="sr-only">{pick(open ? CLOSE_LABEL : OPEN_LABEL, locale)}</span>
      </button>

      {open && (
        <div
          id={panelId}
          className="ss-hairline ss-scroll bg-card mt-2 max-h-[360px] overflow-y-auto rounded-[var(--radius-md)] border py-1.5"
        >
          {roots.length === 0 ? (
            <p className="text-tertiary px-3.5 py-3 text-[12px] italic">
              {pick(EMPTY_LABEL, locale)}
            </p>
          ) : (
            <ul>
              {roots.map((root) => (
                <TreeRow
                  key={root.id}
                  node={root}
                  axis={axis}
                  currentId={currentId}
                  locale={locale}
                  depth={0}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
