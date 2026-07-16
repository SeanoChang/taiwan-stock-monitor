'use client';

// HUD chrome for the 3D explorer: header, level rail, hints, tour caption
// and boot overlays. Pure presentation over the scene hook's state.

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/site/brand';
import { LocaleToggle } from '@/components/site/locale-toggle';
import { NavLinks } from '@/components/site/nav-links';
import { HINTS, LEVELS, TOUR } from '@/lib/data/silicon-stack';
import { pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';
import { cn } from '@/lib/utils';

interface HudProps {
  locale: Locale;
  level: number;
  ready: boolean;
  error: boolean;
  touring: boolean;
  onGoLevel: (i: number) => void;
  onStartTour: () => void;
  onStopTour: () => void;
}

export function ExplorerHeader({ locale, ready, error, touring, onStartTour, onStopTour }: Omit<HudProps, 'level' | 'onGoLevel'>) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-8 py-6">
      <Brand locale={locale} tagline />
      <div className="pointer-events-auto flex items-center gap-2.5">
        <LocaleToggle locale={locale} />
        <NavLinks locale={locale} current="/" />
        <Badge variant="outline" className="rounded-full border-border px-2.5 py-1 text-[10.5px] font-normal tracking-wide text-foreground/45">
          {t('illustrative', locale)}
        </Badge>
        {!touring && ready && !error && (
          <Button size="sm" onClick={onStartTour} className="rounded-full text-xs font-semibold tracking-wide">
            {t('guidedTour', locale)}
          </Button>
        )}
        {touring && (
          <Button variant="outline" size="sm" onClick={onStopTour} className="rounded-full border-foreground/30 bg-transparent text-xs font-semibold">
            {t('exitTour', locale)}
          </Button>
        )}
      </div>
    </header>
  );
}

export function ExplorerBottomBar({ locale, level, ready, error, touring, onGoLevel }: Omit<HudProps, 'onStartTour' | 'onStopTour'>) {
  const current = LEVELS[level] ?? LEVELS[0];
  const smallLine = locale === 'zh'
    ? `${current.name.en.toUpperCase()} · ${current.scale}`
    : `${current.zh} · ${current.scale}`;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end gap-5 px-8 pb-7">
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.22em] text-primary">{smallLine}</p>
        <h1 className={cn('mb-2 whitespace-nowrap text-[clamp(19px,2.6vw,30px)] leading-tight tracking-tight', locale === 'zh' ? 'font-normal' : 'font-light')}>
          {pick(current.name, locale)}
        </h1>
        <p className="max-w-[340px] text-[12.5px] leading-normal text-foreground/60">{pick(current.blurb, locale)}</p>
      </div>

      <nav className="ss-veil pointer-events-auto flex flex-none items-center gap-1.5 rounded-full border px-2.5 py-2" aria-label="zoom levels">
        {level > 0 && ready && !error && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGoLevel(level - 1)}
            title={t('zoomOutTitle', locale)}
            className="mr-1 h-8 rounded-full bg-secondary text-xs font-semibold text-foreground/75"
          >
            {t('zoomOut', locale)}
          </Button>
        )}
        {LEVELS.map((lv, i) => {
          const active = i === level;
          const label = locale === 'zh' ? lv.zh : lv.name.en.replace('The ', '').replace('Inside the ', '');
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
              <span className={cn('size-[7px] flex-none rounded-full', active ? 'bg-primary' : 'bg-foreground/25')} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 justify-end">
        {!touring && ready && !error && (
          <p className="max-w-[210px] pb-1 text-right text-[11.5px] leading-relaxed tracking-wide text-foreground/45">
            {pick(HINTS[level] ?? HINTS[0], locale)}
          </p>
        )}
      </div>
    </div>
  );
}

export function TourCaption({ locale, level }: { locale: Locale; level: number }) {
  return (
    <figure className="ss-panel ss-veil absolute bottom-[92px] left-1/2 z-[11] w-[calc(100%-48px)] max-w-[620px] -translate-x-1/2 rounded-[14px] border px-5 py-4 text-center text-[14.5px] leading-relaxed text-foreground/90">
      {pick(TOUR[level], locale)}
    </figure>
  );
}

export function BootOverlay({ locale, ready, error }: { locale: Locale; ready: boolean; error: boolean }) {
  if (ready && !error) return null;
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-background">
      {!error ? (
        <>
          <div className="flex items-baseline gap-2.5">
            <span className="text-lg font-bold tracking-[0.18em]">SILICON STACK</span>
            <span className="text-[13px] tracking-[0.32em] text-foreground/50">矽鏈</span>
          </div>
          <div className="size-[26px] animate-[spin_0.9s_linear_infinite] rounded-full border-2 border-foreground/15 border-t-primary" />
          <p className="text-xs tracking-wide text-foreground/50">{t('preparing', locale)}</p>
        </>
      ) : (
        <p className="max-w-[380px] px-10 text-center text-sm leading-relaxed text-foreground/75">
          {t('loadError', locale)}
        </p>
      )}
    </div>
  );
}
