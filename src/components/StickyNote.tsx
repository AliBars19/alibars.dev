import { note } from '@/content';
import styles from './StickyNote.module.css';

// A plain <div>, not a <p>: the UA stylesheet gives <p> a default 1em
// margin, which would shift the note's border box down from the spec's
// exact top:-22px.
export function StickyNote() {
  return <div className={styles.note}>{note}</div>;
}
