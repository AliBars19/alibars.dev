import { cv } from '@/content';
import type { SheetId } from '@/lib/pile';
import { Highlight } from '../Highlight';
import styles from './CvSheet.module.css';

export function CvExperience({ onOpen }: { onOpen: (id: SheetId) => void }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionLabel}>Experience</h2>
      <ul className={styles.entryList}>
        {cv.experience.map((entry) => (
          <li key={entry.title} className={styles.entry}>
            <div className={styles.entryRow}>
              <span className={styles.entryTitle}>
                <Highlight color="yellow" opens={entry.opens} onOpen={() => onOpen(entry.opens)}>
                  {entry.title}
                </Highlight>
              </span>
              <span className={styles.entryMeta}>{entry.dates}</span>
            </div>
            <div className={styles.entryRow}>
              <span className={styles.entryOrg}>{entry.org}</span>
              <span className={styles.entryMeta}>{entry.place}</span>
            </div>
            <ul className={styles.bullets}>
              {entry.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
