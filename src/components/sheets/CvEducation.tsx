import { cv } from '@/content';
import styles from './CvSheet.module.css';

export function CvEducation() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionLabel}>Education</h2>
      <ul className={styles.entryList}>
        {cv.education.map((entry) => (
          <li key={entry.school} className={styles.entry}>
            {entry.place ? (
              <>
                <div className={styles.entryRow}>
                  <span className={styles.entryTitle}>{entry.school}</span>
                  <span className={styles.entryMeta}>{entry.place}</span>
                </div>
                <div className={styles.entryRow}>
                  <span className={styles.entryOrg}>{entry.degree}</span>
                  <span className={styles.entryMeta}>{entry.dates}</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.entryRow}>
                  <span className={styles.entryTitle}>{entry.school}</span>
                  <span className={styles.entryMeta}>{entry.dates}</span>
                </div>
                <span className={styles.entryOrg}>{entry.degree}</span>
              </>
            )}
            {entry.modules ? (
              <ul className={styles.modules}>
                <li>
                  <span className={styles.label}>Relevant Modules:</span> {entry.modules.join(', ')}
                </li>
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
