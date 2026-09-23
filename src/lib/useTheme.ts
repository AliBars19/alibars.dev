'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { site } from '@/content';

const STORAGE_KEY = 'alibars-desk';

export type UseThemeResult = {
  dark: boolean;
  label: string;
  toggle: () => void;
};

/**
 * Initialises to `false`, the same default the server renders (the
 * pre-hydration script in app/layout.tsx only runs in the browser, so SSR
 * always outputs the light desk). A mount-time layout effect then syncs from
 * the `data-desk` attribute that script already set on `<html>`, before
 * paint, so the first client render matches the static HTML exactly and
 * there is no hydration mismatch or visible flash.
 */
export function useTheme(): UseThemeResult {
  const [dark, setDark] = useState(false);
  // Mirrors `dark` synchronously so toggle() can compute the next value
  // without depending on it (keeping the callback identity stable) or
  // reaching into the setState updater, where a side effect could run twice
  // under React's dev-mode double-invocation.
  const darkRef = useRef(dark);
  darkRef.current = dark;

  useLayoutEffect(() => {
    if (document.documentElement.getAttribute('data-desk') === 'dark') {
      setDark(true);
    }
  }, []);

  const toggle = useCallback(() => {
    const next = !darkRef.current;
    setDark(next);
    document.documentElement.setAttribute('data-desk', next ? 'dark' : 'light');
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // Storage may be blocked or full (e.g. Safari private mode quota).
      // Persistence is best-effort; the toggle itself must still work.
    }
  }, []);

  return { dark, label: dark ? site.themeLabels.dark : site.themeLabels.light, toggle };
}
