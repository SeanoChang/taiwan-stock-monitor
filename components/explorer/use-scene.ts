'use client';

// Scene lifecycle hook for the Silicon Stack 3D explorer.
// Owns the three.js scene handle, level/selection state and the guided tour.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { SceneApi } from '@/lib/scene/silicon-stack-scene';
import type { Locale, LStr } from '@/lib/i18n/config';

export interface ExplorerScene {
  ready: boolean;
  error: boolean;
  level: number;
  selection: string | null;
  selectionRole: LStr | null;
  touring: boolean;
  goLevel: (i: number) => void;
  select: (id: string | null, role?: LStr | null) => void;
  startTour: () => void;
  stopTour: () => void;
}

export interface UseSceneOptions {
  locale: Locale;
  accent?: string;
  autoRotate?: boolean;
  startLevel?: number;
}

const TOUR_STEP_MS = 10_000;
const LAST_LEVEL = 3;

export function useScene(
  canvasRef: RefObject<HTMLDivElement | null>,
  layerRef: RefObject<HTMLDivElement | null>,
  { locale, accent = '#ffb703', autoRotate = true, startLevel = 0 }: UseSceneOptions,
): ExplorerScene {
  const apiRef = useRef<SceneApi | null>(null);
  const tourRef = useRef(false);
  const tourTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [level, setLevel] = useState(startLevel);
  const [selection, setSelection] = useState<string | null>(null);
  const [selectionRole, setSelectionRole] = useState<LStr | null>(null);
  const [touring, setTouring] = useState(false);

  const stopTour = useCallback(() => {
    clearTimeout(tourTimer.current);
    tourRef.current = false;
    setTouring(false);
  }, []);

  // recursive step kept in a ref (assigned post-commit) per hooks rules
  const tourStepRef = useRef<(i: number) => void>(() => {});
  useEffect(() => {
    tourStepRef.current = (i: number) => {
      if (i > LAST_LEVEL) { stopTour(); return; }
      apiRef.current?.goLevel(i);
      tourTimer.current = setTimeout(() => { if (tourRef.current) tourStepRef.current(i + 1); }, TOUR_STEP_MS);
    };
  }, [stopTour]);

  const startTour = useCallback(() => {
    if (!apiRef.current) return;
    tourRef.current = true;
    setTouring(true);
    setSelection(null);
    tourStepRef.current(0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/scene/silicon-stack-scene')
      .then(({ createScene }) => {
        if (cancelled || !canvasRef.current || !layerRef.current) return;
        apiRef.current = createScene({
          container: canvasRef.current,
          layer: layerRef.current,
          accent,
          autoRotate,
          startLevel: Math.max(0, Math.min(LAST_LEVEL, startLevel)),
          locale,
          onLevel: setLevel,
          onSelect: (id, role) => { setSelection(id); setSelectionRole(role); },
          onReady: () => setReady(true),
          onInteract: () => { if (tourRef.current) stopTour(); },
        });
      })
      .catch((e) => {
        console.error('[silicon-stack] scene failed to start', e);
        setError(true);
        setReady(true);
      });
    return () => {
      cancelled = true;
      clearTimeout(tourTimer.current);
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // The scene is created exactly once; live options are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { apiRef.current?.setAccent(accent); }, [accent]);
  useEffect(() => { apiRef.current?.setAutoRotate(autoRotate); }, [autoRotate]);
  useEffect(() => { apiRef.current?.setLocale(locale); }, [locale]);

  const goLevel = useCallback((i: number) => { apiRef.current?.goLevel(i); }, []);
  const select = useCallback((id: string | null, role: LStr | null = null) => {
    setSelection(id);
    setSelectionRole(role);
  }, []);

  return { ready, error, level, selection, selectionRole, touring, goLevel, select, startTour, stopTour };
}
