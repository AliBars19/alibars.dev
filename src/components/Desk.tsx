'use client';

import { site } from '@/content';
import { useTheme } from '@/lib/useTheme';
import styles from './Desk.module.css';

/**
 * Both theme-label spans render unconditionally; Desk.module.css hides
 * whichever one doesn't match `[data-desk]` on `<html>`. `<html>`'s
 * attribute is set by the pre-hydration script before first paint (see
 * layout.tsx), so a dark-OS visitor sees the correct "Lights on" label
 * immediately, with no client-side flash. `useTheme` has no `label`/`dark`
 * state of its own for the same reason: `data-desk` on <html> is the single
 * source of truth, and `toggle` is the only thing this component needs.
 */
export function Desk() {
  const { toggle } = useTheme();
  return (
    <header className={styles.header}>
      <span className={styles.brand}>{site.domain}</span>
      <a className={styles.download} href={site.downloadCvHref} download>
        {site.downloadCvLabel}
      </a>
      <button type="button" className={styles.toggle} onClick={toggle}>
        <span className={styles.labelLight}>{site.themeLabels.light}</span>
        <span className={styles.labelDark}>{site.themeLabels.dark}</span>
      </button>
    </header>
  );
}
