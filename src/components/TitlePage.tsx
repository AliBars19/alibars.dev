import type { KeyboardEvent } from 'react';
import { title } from '@/content';
import styles from './TitlePage.module.css';

type TitlePageProps = {
  pulling: boolean;
  zIndex: number;
  onDismiss: () => void;
};

/**
 * A `role="button"` container rather than an actual <button>: a <button>'s
 * content model only allows phrasing content, so wrapping an <h1> in one is
 * invalid HTML and hides the heading from assistive tech (it's flattened
 * into the button's own accessible name instead). This keeps the heading
 * exposed while staying keyboard-operable (Tab + Enter/Space dismiss it,
 * same as click).
 */
export function TitlePage({ pulling, zIndex, onDismiss }: TitlePageProps) {
  const transform = pulling ? 'translate(-130vw,3%) rotate(-7deg)' : 'rotate(.4deg)';

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onDismiss();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.titlePage} js-title-page`}
      style={{ zIndex, transform }}
      onClick={onDismiss}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.kicker}>{title.kicker}</span>
      <span className={styles.body}>
        <h1 className={styles.name}>{title.name}</h1>
        <p className={styles.line}>{title.line}</p>
        <span className={styles.cta}>{title.cta}</span>
      </span>
    </div>
  );
}
