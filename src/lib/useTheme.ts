'use client';

import { useCallback, useState } from 'react';
import { site } from '@/content';

const STORAGE_KEY = 'alibars-desk';

function readInitialDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-desk') === 'dark';
}

export type UseThemeResult = {
  dark: boolean;
  label: string;
  toggle: () => void;
};

/**
 * Reads its initial value from the `data-desk` attribute the pre-hydration
 * script (app/layout.tsx) already set from localStorage / prefers-color-scheme,
 * so there is no flash and no extra render on mount. Persists on toggle.
 */
export function useTheme(): UseThemeResult {
  const [dark, setDark] = useState<boolean>(readInitialDark);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-desk', next ? 'dark' : 'light');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      }
      return next;
    });
  }, []);

  return { dark, label: dark ? site.themeLabels.dark : site.themeLabels.light, toggle };
}
