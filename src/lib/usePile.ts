'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { canBring, hashForSheet, sheetFromHash, type MovingState, type SheetId } from './pile';

export type Phase = 'off' | 'push' | 'pull' | 'done';

export type PileState = {
  top: SheetId;
  phase: Phase;
  moving: MovingState;
  /** True after the first successful bring(); never resets within a page session. */
  touched: boolean;
};

export type UsePileResult = {
  state: PileState;
  pull: () => void;
  bring: (k: SheetId) => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initialTop(): SheetId {
  if (typeof window === 'undefined') return 'cv';
  return sheetFromHash(window.location.hash) ?? 'cv';
}

/**
 * Phase machine driving the pile: off -> push (120ms) -> [click] -> pull ->
 * done (1000ms), plus bring(k) for pulling a sheet to the top
 * (out at 0ms -> in at 440ms -> settled at 960ms). Mirrors the reference
 * prototype's Component class timings exactly.
 */
export function usePile(): UsePileResult {
  const [state, setState] = useState<PileState>(() => {
    const deepLink = typeof window !== 'undefined' && window.location.hash;
    const skipIntro = Boolean(deepLink) || prefersReducedMotion();
    return { top: initialTop(), phase: skipIntro ? 'done' : 'off', moving: null, touched: false };
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Mirrors `state` synchronously so bring()/pull() can read the latest
  // value without depending on the setState functional-updater timing
  // (scheduling setTimeout as a side effect *inside* an updater is unsafe:
  // React may invoke updaters more than once, or defer them).
  const stateRef = useRef(state);
  stateRef.current = state;

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // Intro: schedule the push transition unless we already skipped to 'done'.
  useEffect(() => {
    setState((s) => {
      if (s.phase !== 'off') return s;
      at(120, () => setState((prev) => (prev.phase === 'off' ? { ...prev, phase: 'push' } : prev)));
      return s;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pull = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'push') return;
    clearTimers();
    setState((prev) => ({ ...prev, phase: 'pull' }));
    at(1000, () => setState((prev) => ({ ...prev, phase: 'done' })));
  }, [at, clearTimers]);

  const bring = useCallback(
    (k: SheetId) => {
      const s = stateRef.current;
      if (!canBring(s, k)) return;
      if (typeof window !== 'undefined' && window.scrollY > 80 && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const prevTop = s.top;
      setState((prev) => ({ ...prev, moving: { k, prev: prevTop, stage: 'out' }, touched: true }));
      at(440, () =>
        setState((prev) =>
          prev.moving && prev.moving.k === k ? { ...prev, moving: { k, prev: prevTop, stage: 'in' } } : prev
        )
      );
      at(960, () =>
        setState((prev) => (prev.moving && prev.moving.k === k ? { ...prev, top: k, moving: null } : prev))
      );
    },
    [at]
  );

  // Keep document.title and the URL hash in sync with the top sheet.
  useEffect(() => {
    if (state.phase !== 'done') return;
    const hash = hashForSheet(state.top);
    const current = window.location.hash;
    if (current !== hash) {
      const method = current ? window.history.pushState : window.history.replaceState;
      method.call(window.history, null, '', `${window.location.pathname}${hash}`);
    }
  }, [state.top, state.phase]);

  // Esc brings the CV to the top; hashchange/back button call bring().
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') bring('cv');
    };
    const onHashChange = () => {
      const next = sheetFromHash(window.location.hash) ?? 'cv';
      bring(next);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [bring]);

  useEffect(() => clearTimers, [clearTimers]);

  return { state, pull, bring };
}
