import { BackPill } from './BackPill';
import styles from './ProjectHeader.module.css';

export function ProjectHeader({ date, onBack }: { date?: string; onBack: () => void }) {
  return (
    <div className={styles.header}>
      <BackPill onClick={onBack} />
      {date ? <span>{date}</span> : null}
    </div>
  );
}
