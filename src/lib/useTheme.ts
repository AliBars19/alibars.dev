'use client';

import { useCallback } from 'react';

const STORAGE_KEY = 'alibars-desk';

export type UseThemeResult = {
  toggle: () => void;
};

/**
 * The `data-desk` attribute on <html> (set by the pre-hydration script in
 * app/layout.tsx, and kept in sync here) is the single source of truth for
 * the current theme; Desk.tsx's CSS keys off that attribute directly rather
 * than component state, so `useTheme` itself needs no `dark`/`label` state
 * to stay in sync with (code-r3-06). `toggle` reads the attribute to
 * compute the next value and writes both it and localStorage.
 */
export function useTheme(): UseThemeResult {
  const toggle = useCallback(() => {
    const isDark = document.documentElement.getAttribute('data-desk') === 'dark';
    const next = !isDark;
    document.documentElement.setAttribute('data-desk', next ? 'dark' : 'light');
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // Storage may be blocked or full (e.g. Safari private mode quota).
      // Persistence is best-effort; the toggle itself must still work.
    }
  }, []);

  return { toggle };
}
