import { cv } from '@/content';
import type { SheetId } from '@/lib/pile';
import { isPlaceholderUrl } from '@/lib/url';
import { Highlight } from '../Highlight';
import styles from './CvSheet.module.css';

/**
 * The Automated Publishing Platform entry has no `opens` sheet (it links
 * out to GitHub), so while `href` is still a TODO placeholder (owner rule,
 * fix round 4b) the title renders as plain entry-title text: no purple
 * highlight, no icon, no trailing arrow, not a link at all. Filling in a
 * real URL in content.ts makes it a link again automatically.
 */
function ProjectTitle({ project, onOpen }: { project: (typeof cv.projects)[number]; onOpen: (id: SheetId) => void }) {
  if ('opens' in project) {
    return (
      <Highlight color={project.highlight} opens={project.opens} onOpen={() => onOpen(project.opens)}>
        {project.title}
      </Highlight>
    );
  }
  if (isPlaceholderUrl(project.href)) {
    return project.title;
  }
  return (
    <Highlight color={project.highlight} href={project.href} icon={project.icon}>
      {project.title}
    </Highlight>
  );
}

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
                  <ProjectTitle project={project} onOpen={onOpen} />
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
