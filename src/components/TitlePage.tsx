import { title } from '@/content';
import styles from './TitlePage.module.css';

type TitlePageProps = {
  pulling: boolean;
  zIndex: number;
  onDismiss: () => void;
};

export function TitlePage({ pulling, zIndex, onDismiss }: TitlePageProps) {
  const transform = pulling ? 'translate(-130vw,3%) rotate(-7deg)' : 'rotate(.4deg)';
  return (
    <button
      type="button"
      className={`${styles.titlePage} js-title-page`}
      style={{ zIndex, transform }}
      onClick={onDismiss}
    >
      <span className={styles.kicker}>{title.kicker}</span>
      <span className={styles.body}>
        <h1 className={styles.name}>{title.name}</h1>
        <p className={styles.line}>{title.line}</p>
        <span className={styles.cta}>{title.cta}</span>
      </span>
    </button>
  );
}
