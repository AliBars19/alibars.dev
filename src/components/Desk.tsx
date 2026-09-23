'use client';

import { site } from '@/content';
import { useTheme } from '@/lib/useTheme';
import styles from './Desk.module.css';

export function Desk() {
  const { label, toggle } = useTheme();
  return (
    <header className={styles.header}>
      <span className={styles.brand}>{site.domain}</span>
      <a className={styles.download} href={site.downloadCvHref} download>
        {site.downloadCvLabel}
      </a>
      <button type="button" className={styles.toggle} onClick={toggle}>
        {label}
      </button>
    </header>
  );
}
