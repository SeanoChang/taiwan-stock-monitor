'use client';

// Interactive island for the home page: the Silicon Stack 3D explorer,
// ported from the Claude Design project. Composition of the scene hook,
// HUD chrome and the company detail panel. The static chrome (brand, nav,
// disclaimer badge) is server-rendered and handed in as slots.

import { useRef } from 'react';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  BootOverlay,
  ExplorerBottomBar,
  ExplorerHeader,
  TourCaption,
} from '@/components/explorer/hud';
import { useScene } from '@/components/explorer/use-scene';
import type { ExplorerCopy } from '@/components/explorer/explorer-copy';
import type { Locale } from '@/lib/i18n/config';

// Only mounts once a hotspot is picked, so it stays out of the initial bundle
// along with the company dataset and the quotes client it pulls in.
const CompanyPanel = dynamic(
  () => import('@/components/explorer/company-panel').then((m) => m.CompanyPanel),
  { ssr: false },
);

export interface SiliconStackExplorerProps {
  locale: Locale;
  copy: ExplorerCopy;
  /** server-rendered: brand lockup and tagline */
  brand: ReactNode;
  /** server-rendered: locale toggle, nav and the illustrative-data badge */
  tools: ReactNode;
  accent?: string;
  autoRotate?: boolean;
  startLevel?: number;
}

export function SiliconStackExplorer({
  locale,
  copy,
  brand,
  tools,
  accent,
  autoRotate,
  startLevel,
}: SiliconStackExplorerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const scene = useScene(canvasRef, layerRef, { locale, accent, autoRotate, startLevel });

  return (
    <div className="bg-background text-foreground fixed inset-0 overflow-hidden">
      {/* three.js mount + hotspot layer */}
      <div ref={canvasRef} className="absolute inset-0" />
      <div ref={layerRef} className="pointer-events-none absolute inset-0 z-[6]" />

      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(4,10,18,0.55) 100%)',
        }}
      />

      <ExplorerHeader
        copy={copy}
        ready={scene.ready}
        error={scene.error}
        touring={scene.touring}
        onStartTour={scene.startTour}
        onStopTour={scene.stopTour}
        brand={brand}
        tools={tools}
      />
      <ExplorerBottomBar
        locale={locale}
        copy={copy}
        level={scene.level}
        ready={scene.ready}
        error={scene.error}
        touring={scene.touring}
        onGoLevel={scene.goLevel}
      />

      {scene.touring && <TourCaption copy={copy} level={scene.level} />}

      {scene.selection && (
        <CompanyPanel
          companyId={scene.selection}
          role={scene.selectionRole}
          locale={locale}
          onSelect={scene.select}
          onClose={() => scene.select(null)}
        />
      )}

      <BootOverlay copy={copy} ready={scene.ready} error={scene.error} />
    </div>
  );
}
