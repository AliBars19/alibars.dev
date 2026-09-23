'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
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

/** ms an incoming sheet takes to settle once bring() starts: instant for reduced motion. */
const SETTLE_MS = 960;
const REDUCED_SETTLE_MS = 200;
const OUT_TO_IN_MS = 440;

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

/** setTimeout scheduling whose pending timers are cleared on pull() and on unmount. */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const at = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current = [...timers.current, id];
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  return { at, clearTimers };
}

/**
 * Resolves the deep-link/reduced-motion state on mount, before the browser
 * paints (see the `usePile` doc comment for why this is a useLayoutEffect).
 * Also removes the `data-top` attribute the pre-hydration script may have
 * set on `<html>` (see layout.tsx), which exists only to keep a non-CV deep
 * link's sheet hidden for the single pre-hydration frame; once React has
 * taken over, the `top` state itself decides what's visible, so the
 * attribute would otherwise linger uselessly for the rest of the session.
 */
function useIntro(at: (ms: number, fn: () => void) => void, setState: Dispatch<SetStateAction<PileState>>, setReducedMotion: (v: boolean) => void) {
  useLayoutEffect(() => {
    const { hashTop, skip, reduced } = resolveIntro();
    setReducedMotion(reduced);
    if (skip) {
      setState((prev) => ({ ...prev, top: hashTop ?? prev.top, phase: 'done' }));
    } else {
      at(120, () => setState((prev) => (prev.phase === 'off' ? { ...prev, phase: 'push' } : prev)));
    }
    document.documentElement.removeAttribute('data-top');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Keeps document title/URL hash in sync with the top sheet. The first run
 * only normalises a load-time hash (e.g. /#cv, /#bogus) with replaceState;
 * every later change from a user bring() pushes a new history entry so
 * browser Back can return to what was on top before. Suppressed while a
 * hashchange arrived mid-move and is waiting in `pendingRef` (code-r2-02):
 * pushing the sheet that just settled would create a spurious history entry
 * a moment before the queued bring() moves on again.
 */
function useHashSync(top: SheetId, phase: Phase, pendingRef: MutableRefObject<SheetId | null>) {
  const didInitRef = useRef(false);

  useEffect(() => {
    if (phase !== 'done') return;
    if (pendingRef.current !== null) return;
    const isInitialSync = !didInitRef.current;
    didInitRef.current = true;
    const hash = hashForSheet(top);
    const current = window.location.hash;
    if (current === hash) return;
    const method = isInitialSync ? window.history.replaceState : window.history.pushState;
    method.call(window.history, null, '', `${window.location.pathname}${hash}`);
  }, [top, phase, pendingRef]);
}

/** Replays a hash queued by usePendingHash below once the in-flight move it interrupted settles. */
function useReplayPending(
  pendingRef: MutableRefObject<SheetId | null>,
  moving: MovingState,
  top: SheetId,
  bring: (k: SheetId) => void
) {
  useEffect(() => {
    if (moving !== null) return;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending && pending !== top) bring(pending);
  }, [moving, top, bring, pendingRef]);
}

/**
 * bring(k)'s out -> in -> settled timing, split out of usePile to keep it
 * under the 50-line function budget. Under reduced motion, skips straight to
 * the 'in' stage (an instant cross-fade, no invisible "out" gap) and settles
 * sooner, matching Sheet.module.css' reduced-motion opacity transition.
 */
function useBring(
  stateRef: MutableRefObject<PileState>,
  reducedMotion: boolean,
  at: (ms: number, fn: () => void) => void,
  setState: Dispatch<SetStateAction<PileState>>
) {
  return useCallback(
    (k: SheetId) => {
      const s = stateRef.current;
      if (!canBring(s, k)) return;
      if (typeof window !== 'undefined' && window.scrollY > 80 && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const prevTop = s.top;
      const startStage = reducedMotion ? 'in' : 'out';
      setState((prev) => ({ ...prev, moving: { k, prev: prevTop, stage: startStage }, touched: true }));
      if (!reducedMotion) {
        at(OUT_TO_IN_MS, () =>
          setState((prev) =>
            prev.moving && prev.moving.k === k ? { ...prev, moving: { k, prev: prevTop, stage: 'in' } } : prev
          )
        );
      }
      at(reducedMotion ? REDUCED_SETTLE_MS : SETTLE_MS, () =>
        setState((prev) => (prev.moving && prev.moving.k === k ? { ...prev, top: k, moving: null } : prev))
      );
    },
    [at, reducedMotion, setState, stateRef]
  );
}

/** Esc brings the CV to the top; hashchange (incl. browser Back) is handled by the caller. */
function usePileKeys(bring: (k: SheetId) => void, onHashChange: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') bring('cv');
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [bring, onHashChange]);
}

/**
 * Phase machine driving the pile: off -> push (120ms) -> [click] -> pull ->
 * done (1000ms), plus bring(k) for pulling a sheet to the top
 * (out at 0ms -> in at 440ms -> settled at 960ms; under reduced motion, an
 * instant cross-fade in -> settled at 200ms, matching Sheet.module.css'
 * reduced-motion opacity transition). Mirrors the reference prototype's
 * Component class timings exactly.
 *
 * The initial state is always the server-rendered default so hydration
 * never mismatches (React error #418): useIntro resolves the real
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
  // A hash that arrived (e.g. browser Back) while a move was already in
  // flight: canBring() rejects bring() during a move, so it's queued here
  // and replayed once the in-flight move settles (code-r2-02).
  const pendingRef = useRef<SheetId | null>(null);

  useIntro(at, setState, setReducedMotion);

  const pull = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'push') return;
    clearTimers();
    setState((prev) => ({ ...prev, phase: 'pull' }));
    at(1000, () => setState((prev) => ({ ...prev, phase: 'done' })));
  }, [at, clearTimers]);

  const bring = useBring(stateRef, reducedMotion, at, setState);

  const onHashChange = useCallback(() => {
    const target = sheetFromHash(window.location.hash) ?? 'cv';
    if (stateRef.current.moving !== null) {
      pendingRef.current = target;
      return;
    }
    bring(target);
  }, [bring]);

  // useHashSync must run before useReplayPending (hook declaration order),
  // so it still sees a non-null pendingRef and skips pushing the sheet that
  // just settled, right before useReplayPending clears it and moves on.
  useHashSync(state.top, state.phase, pendingRef);
  useReplayPending(pendingRef, state.moving, state.top, bring);
  usePileKeys(bring, onHashChange);

  return { state, pull, bring, reducedMotion };
}
