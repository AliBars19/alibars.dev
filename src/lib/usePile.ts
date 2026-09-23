'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  reducedMotion: boolean;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The one place that decides whether a load skips the intro: a hash that
 * names a real sheet, or a reduced-motion preference. The pre-hydration
 * script (app/layout.tsx) checks the same sheet-id whitelist against the
 * same hash, so the very first paint and this mount-time effect agree, and
 * an *unknown* hash (e.g. `#bogus`) plays the intro normally instead of
 * jumping straight to the CV.
 */
function resolveIntro(): { hashTop: SheetId | null; skip: boolean; reduced: boolean } {
  const reduced = prefersReducedMotion();
  const hashTop = sheetFromHash(window.location.hash);
  return { hashTop, skip: hashTop !== null || reduced, reduced };
}

const SSR_STATE: PileState = { top: 'cv', phase: 'off', moving: null, touched: false };

/** Debounced setTimeout scheduling that always clears its own timers on unmount. */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  return { at, clearTimers };
}

/**
 * Keeps document title/URL hash in sync with the top sheet. The first run
 * only normalises a load-time hash (e.g. /#cv, /#bogus) with replaceState;
 * every later change from a user bring() pushes a new history entry so
 * browser Back can return to what was on top before.
 */
function useHashSync(top: SheetId, phase: Phase) {
  const didInitRef = useRef(false);

  useEffect(() => {
    if (phase !== 'done') return;
    const isInitialSync = !didInitRef.current;
    didInitRef.current = true;
    const hash = hashForSheet(top);
    const current = window.location.hash;
    if (current === hash) return;
    const method = isInitialSync ? window.history.replaceState : window.history.pushState;
    method.call(window.history, null, '', `${window.location.pathname}${hash}`);
  }, [top, phase]);
}

/** Esc brings the CV to the top; hashchange (incl. browser Back) calls bring(). */
function usePileKeys(bring: (k: SheetId) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') bring('cv');
    };
    const onHashChange = () => {
      bring(sheetFromHash(window.location.hash) ?? 'cv');
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [bring]);
}

/**
 * Phase machine driving the pile: off -> push (120ms) -> [click] -> pull ->
 * done (1000ms), plus bring(k) for pulling a sheet to the top
 * (out at 0ms -> in at 440ms -> settled at 960ms). Mirrors the reference
 * prototype's Component class timings exactly.
 *
 * The initial state is always the server-rendered default so hydration
 * never mismatches (React error #418): a useLayoutEffect resolves the real
 * deep-link/reduced-motion state on mount, before the browser paints, using
 * the `[data-intro='skip']` CSS in globals.css to keep the pre-hydration
 * frame hidden in the meantime.
 */
export function usePile(): UsePileResult {
  const [state, setState] = useState<PileState>(SSR_STATE);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Mirrors `state` synchronously so bring()/pull() can read the latest
  // value without depending on the setState functional-updater timing
  // (scheduling setTimeout as a side effect *inside* an updater is unsafe:
  // React may invoke updaters more than once, or defer them).
  const stateRef = useRef(state);
  stateRef.current = state;
  const { at, clearTimers } = useTimers();

  useLayoutEffect(() => {
    const { hashTop, skip, reduced } = resolveIntro();
    setReducedMotion(reduced);
    if (skip) {
      setState((prev) => ({ ...prev, top: hashTop ?? prev.top, phase: 'done' }));
    } else {
      at(120, () => setState((prev) => (prev.phase === 'off' ? { ...prev, phase: 'push' } : prev)));
    }
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

  useHashSync(state.top, state.phase);
  usePileKeys(bring);

  return { state, pull, bring, reducedMotion };
}
