'use client';

// Axis switcher — the chip row `[機構包含][資料][電力][熱][子系統][階段]`
// (Plan 006 Phase G, Task 3; design spec `docs/superpowers/specs/2026-07-18-
// ai-server-stack-multi-axis-tree-design.md` §4–§5). Every chip's href keeps
// the CURRENT node id and only swaps the axis segment — "cross-axis jump":
// sitting on `gpu.cowos` in containment, clicking 階段 re-roots the SAME node
// under its `stage` parent (`stage.chip`) without losing your place. Plain
// same-page hash `<a>`s, no onClick — see breadcrumb.tsx's module doc for why
// native hash navigation is enough (no imperative routing needed) and why
// `hashFor` is duplicated here rather than imported.
//
// `flow:data`/`flow:power`/`flow:heat` have no seeded edges yet (Task 5) —
// their chips still render and are still clickable (the shell must not know
// or care which axes currently have data; stack-explorer.tsx's empty-state
// handles a childless/rootless axis gracefully), so the full v1 axis set is
// visible and navigable from day one.

import type { Axis } from '@/lib/data/stack-tree';
import { l, pick } from '@/lib/i18n/config';
import type { Locale, LStr } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

function hashFor(axis: Axis, id: string): string {
  return `#/${axis}/${id}`;
}

const AXIS_LABEL = l('Axis', '角度');

const AXES: { axis: Axis; label: LStr }[] = [
  { axis: 'containment', label: l('Containment', '機構包含') },
  { axis: 'flow:data', label: l('Data', '資料') },
  { axis: 'flow:power', label: l('Power', '電力') },
  { axis: 'flow:heat', label: l('Heat', '熱') },
  { axis: 'subsystem', label: l('Subsystem', '子系統') },
  { axis: 'stage', label: l('Stage', '階段') },
];

export function AxisSwitcher({
  axis,
  currentId,
  locale,
}: {
  axis: Axis;
  currentId: string;
  locale: Locale;
}) {
  return (
    <nav aria-label={pick(AXIS_LABEL, locale)} className="-mx-1 overflow-x-auto px-1">
      <ul className="flex items-center gap-1.5 whitespace-nowrap">
        {AXES.map((entry) => {
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
