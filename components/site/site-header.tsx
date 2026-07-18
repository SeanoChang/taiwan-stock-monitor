import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Apple "product-bar" site chrome (design-restyle-market-and-graph.md
 * §Site chrome / task-3-brief.md Step 2): a sticky hairline bar, 44px tall,
 * frosted via `.ss-veil`, hairline bottom border (`border-b ss-hairline`),
 * wrapping brand (left) and nav anchors + locale toggle (right) as **one
 * unit** — quiet, no pill chrome around the cluster.
 *
 * Not yet composed into any route: `/`, `/supply-chain` and `/market` each
 * still build their own bespoke header/overlay (page-level markup, Task
 * 4/5 scope — out of Task 3's file list, which is `app/layout.tsx` +
 * `components/site/`). This primitive exists so those tasks (or a
 * dedicated follow-up) can adopt the literal unified bar in place of their
 * ad hoc containers without re-deriving the container styling.
 */
export function SiteHeader({
  brand,
  tools,
  className,
}: {
  brand: ReactNode;
  tools: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'ss-veil ss-hairline sticky top-0 z-30 flex h-11 items-center justify-between gap-4 border-b px-6',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">{brand}</div>
      <div className="flex shrink-0 items-center gap-5">{tools}</div>
    </header>
  );
}
