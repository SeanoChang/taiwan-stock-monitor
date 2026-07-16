'use client';

// Interactive island for the home page: the Silicon Stack 3D explorer,
// ported from the Claude Design project. Composition of the scene hook,
// HUD chrome and the company detail panel.

import { useRef } from 'react';
import {
  BootOverlay,
  ExplorerBottomBar,
  ExplorerHeader,
  TourCaption,
} from '@/components/explorer/hud';
import { CompanyPanel } from '@/components/explorer/company-panel';
import { useScene } from '@/components/explorer/use-scene';
import type { Locale } from '@/lib/i18n/config';

export interface SiliconStackExplorerProps {
  locale: Locale;
  accent?: string;
  autoRotate?: boolean;
  startLevel?: number;
}

export function SiliconStackExplorer({
  locale,
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
        locale={locale}
        ready={scene.ready}
        error={scene.error}
        touring={scene.touring}
        onStartTour={scene.startTour}
        onStopTour={scene.stopTour}
      />
      <ExplorerBottomBar
        locale={locale}
        level={scene.level}
        ready={scene.ready}
        error={scene.error}
        touring={scene.touring}
        onGoLevel={scene.goLevel}
      />

      {scene.touring && <TourCaption locale={locale} level={scene.level} />}

      {scene.selection && (
        <CompanyPanel
          companyId={scene.selection}
          role={scene.selectionRole}
          locale={locale}
          onSelect={scene.select}
          onClose={() => scene.select(null)}
        />
      )}

      <BootOverlay locale={locale} ready={scene.ready} error={scene.error} />
    </div>
  );
}
