import { site } from '@/content';
import styles from './BackPill.module.css';

export function BackPill({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.pill} onClick={onClick}>
      {site.backToCv}
    </button>
  );
}
