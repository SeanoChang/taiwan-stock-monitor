import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Apple "product-bar" site chrome (design-restyle-market-and-graph.md
 * §Site chrome / task-3-brief.md Step 2): a sticky hairline bar, 44px tall,
 * frosted via `.ss-veil`, hairline bottom border (`border-b ss-hairline`),
 * wrapping brand (left) and nav anchors + locale toggle (right) as **one
 * unit** — quiet, no pill chrome around the cluster.
 *
 * Composed by `/market` (app/market/page.tsx). The canvas routes (`/`,
 * `/supply-chain`) keep their full-bleed graph-overlay chrome using the same
 * brand/anchors/tokens in page-level markup; adopt this bar on other routes
 * to get the unified container styling without re-deriving it.
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
