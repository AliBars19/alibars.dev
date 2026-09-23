import { about } from '@/content';
import { ProjectHeader } from '../ProjectHeader';
import sheetStyles from '../Sheet.module.css';
import styles from './AboutSheet.module.css';

const SIDES = [styles.polaroidLeft, styles.polaroidRight];

export function AboutSheet({ onBack }: { onBack: () => void }) {
  return (
    <div className={sheetStyles.wrapWide}>
      <ProjectHeader onBack={onBack} />

      <div className={styles.polaroids}>
        {about.photos.map((photo, i) => (
          <div className={`${styles.polaroid} ${SIDES[i]}`} key={photo.src}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.src} alt={photo.caption} />
            <span className={styles.caption}>{photo.caption}</span>
          </div>
        ))}
      </div>

      <h2 className={styles.h2}>{about.title}</h2>
      <p className={styles.body}>{about.body}</p>

      <div className={styles.chips}>
        {about.chips.map((chip) => (
          <span className={styles.chip} key={chip}>
            {chip}
          </span>
        ))}
      </div>

      <p className={styles.contact}>
        {about.contact.prefix} <a href={`mailto:${about.contact.email}`}>{about.contact.email}</a>
      </p>
    </div>
  );
}
