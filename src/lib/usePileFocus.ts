'use client';

import { useEffect, useRef } from 'react';
import type { SheetId } from './pile';
import type { Phase } from './usePile';

/**
 * After a bring() completes, the previous top sheet's content unmounts
 * (SheetFrame only renders children when visible), which drops focus to
 * <body>. Move it to the new top sheet's container so keyboard users
 * continue from the page they just opened, instead of restarting at the
 * top of the document. Split out of Pile to keep it under the 50-line
 * function budget (code-r3-05).
 */
export function useFocusOnTopChange(top: SheetId, touched: boolean, phase: Phase) {
  const prevTopRef = useRef(top);

  useEffect(() => {
    if (prevTopRef.current === top) return;
    prevTopRef.current = top;
    if (!touched || phase !== 'done') return;
    if (document.activeElement !== document.body) return;
    document.getElementById(`sheet-${top}`)?.focus({ preventScroll: true });
  }, [top, touched, phase]);
}

/**
 * Dismissing the title page (click or Enter/Space) unmounts it while it
 * still has focus, so the next Tab would otherwise start at <body> and
 * skip straight to the divider tabs, past the whole CV. Move focus onto
 * the revealed sheet's container (tabIndex=-1, see SheetFrame) the moment
 * the intro's 'pull' stage finishes.
 */
export function useFocusAfterIntro(phase: Phase, top: SheetId) {
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (prevPhase !== 'pull' || phase !== 'done') return;
    if (document.activeElement !== document.body) return;
    document.getElementById(`sheet-${top}`)?.focus({ preventScroll: true });
  }, [phase, top]);
}
