import { cv } from '@/content';
import type { SheetId } from '@/lib/pile';
import { Highlight } from '../Highlight';
import styles from './CvSheet.module.css';

export function CvFooter({ onOpen }: { onOpen: (id: SheetId) => void }) {
  return (
    <p className={styles.footer}>
      {cv.footer.prefix}{' '}
      <Highlight color="yellow" opens={cv.footer.opens} onOpen={() => onOpen(cv.footer.opens)}>
        {cv.footer.link}
      </Highlight>
    </p>
  );
}
