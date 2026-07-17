import 'server-only';

// Locale-resolved copy for the explorer HUD. Resolving it on the server keeps
// the bilingual level dataset and the UI dictionary out of the island's bundle;
// the client only ever sees the flat strings for the active locale.

import { HINTS, LEVELS, TOUR } from '@/lib/data/silicon-stack';
import { pick } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { t } from '@/lib/i18n/dict';

export interface ExplorerLevelCopy {
  key: string;
  /** short label on the level rail */
  rail: string;
  /** cross-language kicker above the title, e.g. "THE DATA CENTER · ≈ 2 m" */
  scaleLine: string;
  title: string;
  blurb: string;
  hint: string;
  tour: string;
}

export interface ExplorerCopy {
  levels: ExplorerLevelCopy[];
  guidedTour: string;
  exitTour: string;
  zoomOut: string;
  zoomOutTitle: string;
  preparing: string;
  loadError: string;
}

export function explorerCopy(locale: Locale): ExplorerCopy {
  return {
    levels: LEVELS.map((lv, i) => ({
      key: lv.key,
      rail: locale === 'zh' ? lv.zh : lv.name.en.replace('The ', '').replace('Inside the ', ''),
      scaleLine:
        locale === 'zh' ? `${lv.name.en.toUpperCase()} · ${lv.scale}` : `${lv.zh} · ${lv.scale}`,
      title: pick(lv.name, locale),
      blurb: pick(lv.blurb, locale),
      hint: pick(HINTS[i] ?? HINTS[0], locale),
      tour: pick(TOUR[i], locale),
    })),
    guidedTour: t('guidedTour', locale),
    exitTour: t('exitTour', locale),
    zoomOut: t('zoomOut', locale),
    zoomOutTitle: t('zoomOutTitle', locale),
    preparing: t('preparing', locale),
    loadError: t('loadError', locale),
  };
}
