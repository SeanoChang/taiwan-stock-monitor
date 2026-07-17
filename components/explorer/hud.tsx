'use client';

// HUD chrome for the 3D explorer: header, level rail, hints, tour caption
// and boot overlays. Pure presentation over the scene hook's state and the
// server-resolved copy — the static chrome arrives as pre-rendered slots.

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { ExplorerCopy } from '@/components/explorer/explorer-copy';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface HudProps {
  locale: Locale;
  copy: ExplorerCopy;
  level: number;
  ready: boolean;
  error: boolean;
  touring: boolean;
  onGoLevel: (i: number) => void;
  onStartTour: () => void;
  onStopTour: () => void;
}

interface ExplorerHeaderProps extends Omit<HudProps, 'locale' | 'level' | 'onGoLevel'> {
  /** server-rendered: brand lockup and tagline */
  brand: ReactNode;
  /** server-rendered: locale toggle, nav and the illustrative-data badge */
  tools: ReactNode;
}

export function ExplorerHeader({
  copy,
  ready,
  error,
  touring,
  onStartTour,
  onStopTour,
  brand,
  tools,
}: ExplorerHeaderProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-8 py-6">
      {brand}
      <div className="pointer-events-auto flex items-center gap-2.5">
        {tools}
        {!touring && ready && !error && (
          <Button
            size="sm"
            onClick={onStartTour}
            className="rounded-full text-xs font-semibold tracking-wide"
          >
            {copy.guidedTour}
          </Button>
        )}
        {touring && (
          <Button
            variant="outline"
            size="sm"
            onClick={onStopTour}
            className="border-foreground/30 rounded-full bg-transparent text-xs font-semibold"
          >
            {copy.exitTour}
          </Button>
        )}
      </div>
    </header>
  );
}

export function ExplorerBottomBar({
  locale,
  copy,
  level,
  ready,
  error,
  touring,
  onGoLevel,
}: Omit<HudProps, 'onStartTour' | 'onStopTour'>) {
  const current = copy.levels[level] ?? copy.levels[0];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end gap-5 px-8 pb-7">
      <div className="min-w-0 flex-1">
        <p className="text-primary mb-1.5 text-[11px] font-semibold tracking-[0.22em]">
          {current.scaleLine}
        </p>
        <h1
          className={cn(
            'mb-2 text-[clamp(19px,2.6vw,30px)] leading-tight tracking-tight whitespace-nowrap',
            locale === 'zh' ? 'font-normal' : 'font-light',
          )}
        >
          {current.title}
        </h1>
        <p className="text-foreground/60 max-w-[340px] text-[12.5px] leading-normal">
          {current.blurb}
        </p>
      </div>

      <nav
        className="ss-veil pointer-events-auto flex flex-none items-center gap-1.5 rounded-full border px-2.5 py-2"
        aria-label="zoom levels"
      >
        {level > 0 && ready && !error && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGoLevel(level - 1)}
            title={copy.zoomOutTitle}
            className="bg-secondary text-foreground/75 mr-1 h-8 rounded-full text-xs font-semibold"
          >
            {copy.zoomOut}
          </Button>
        )}
        {copy.levels.map((lv, i) => {
          const active = i === level;
          return (
            <button
              key={lv.key}
              onClick={() => onGoLevel(i)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold tracking-wide transition-colors',
                active ? 'bg-accent text-foreground' : 'text-foreground/55 hover:text-foreground',
              )}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={cn(
                  'size-[7px] flex-none rounded-full',
                  active ? 'bg-primary' : 'bg-foreground/25',
                )}
              />
              {lv.rail}
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 justify-end">
        {!touring && ready && !error && (
          <p className="text-foreground/45 max-w-[210px] pb-1 text-right text-[11.5px] leading-relaxed tracking-wide">
            {current.hint}
          </p>
        )}
      </div>
    </div>
  );
}

export function TourCaption({ copy, level }: Pick<HudProps, 'copy' | 'level'>) {
  return (
    <figure className="ss-panel ss-veil text-foreground/90 absolute bottom-[92px] left-1/2 z-[11] w-[calc(100%-48px)] max-w-[620px] -translate-x-1/2 rounded-[14px] border px-5 py-4 text-center text-[14.5px] leading-relaxed">
      {copy.levels[level].tour}
    </figure>
  );
}

export function BootOverlay({ copy, ready, error }: Pick<HudProps, 'copy' | 'ready' | 'error'>) {
  if (ready && !error) return null;
  return (
    <div className="bg-background absolute inset-0 z-30 flex flex-col items-center justify-center gap-4">
      {!error ? (
        <>
          <div className="flex items-baseline gap-2.5">
            <span className="text-lg font-bold tracking-[0.18em]">SILICON STACK</span>
            <span className="text-foreground/50 text-[13px] tracking-[0.32em]">矽鏈</span>
          </div>
          <div className="border-foreground/15 border-t-primary size-[26px] animate-[spin_0.9s_linear_infinite] rounded-full border-2" />
          <p className="text-foreground/50 text-xs tracking-wide">{copy.preparing}</p>
        </>
      ) : (
        <p className="text-foreground/75 max-w-[380px] px-10 text-center text-sm leading-relaxed">
          {copy.loadError}
        </p>
      )}
    </div>
  );
}
