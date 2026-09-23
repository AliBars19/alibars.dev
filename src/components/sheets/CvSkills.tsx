import { cv } from '@/content';
import styles from './CvSheet.module.css';

export function CvSkills() {
  return (
    <section className={styles.skills}>
      <h2 className={styles.sectionLabel}>Technical Skills</h2>
      <div className={styles.skillsLines}>
        {cv.skills.map((group) => (
          <p key={group.label} className={styles.skillLine}>
            <span className={styles.label}>{group.label}:</span> {group.items}
          </p>
        ))}
      </div>
    </section>
  );
}
