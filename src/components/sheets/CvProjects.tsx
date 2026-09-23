import { cv } from '@/content';
import type { SheetId } from '@/lib/pile';
import { Highlight } from '../Highlight';
import styles from './CvSheet.module.css';

export function CvProjects({ onOpen }: { onOpen: (id: SheetId) => void }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionLabel}>Projects</h2>
      <ul className={styles.entryList}>
        {cv.projects.map((project) => (
          <li key={project.title} className={styles.entry}>
            <div className={styles.entryRow}>
              <span>
                <span className={styles.entryTitle}>
                  {'opens' in project ? (
                    <Highlight color={project.highlight} opens={project.opens} onOpen={() => onOpen(project.opens)}>
                      {project.title}
                    </Highlight>
                  ) : (
                    <Highlight color={project.highlight} href={project.href} icon={project.icon}>
                      {project.title}
                    </Highlight>
                  )}
                </span>{' '}
                <span className={styles.projectStack}>| {project.stack}</span>
              </span>
              <span className={styles.entryMeta}>{project.year}</span>
            </div>
            <ul className={styles.bullets}>
              {project.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
