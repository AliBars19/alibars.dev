import { note } from '@/content';
import styles from './StickyNote.module.css';

export function StickyNote() {
  return <p className={styles.note}>{note}</p>;
}
