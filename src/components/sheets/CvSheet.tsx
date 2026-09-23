import { cv } from '@/content';
import type { SheetId } from '@/lib/pile';
import { Highlight } from '../Highlight';
import styles from './CvSheet.module.css';
import sheetStyles from '../Sheet.module.css';

type CvSheetProps = {
  onOpen: (id: SheetId) => void;
};

export function CvSheet({ onOpen }: CvSheetProps) {
  return (
    <div className={sheetStyles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.name}>{cv.name}</h1>
        <p className={styles.tagline}>{cv.tagline}</p>
        <ul className={styles.contact}>
          {cv.contact.map((item) => (
            <li key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : item.label}</li>
          ))}
        </ul>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Education</h2>
        <ul className={styles.entryList}>
          {cv.education.map((entry) => (
            <li key={entry.school} className={styles.entry}>
              <div className={styles.entryRow}>
                <span className={styles.entryTitle}>{entry.school}</span>
                {entry.place ? <span className={styles.entryMeta}>{entry.place}</span> : null}
              </div>
              <div className={styles.entryRow}>
                <span className={styles.entryOrg}>{entry.degree}</span>
                <span className={styles.entryMeta}>{entry.dates}</span>
              </div>
              {entry.modules ? (
                <ul className={styles.modules}>
                  <li>
                    <strong>Relevant Modules:</strong> {entry.modules.join(', ')}
                  </li>
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Experience</h2>
        <ul className={styles.entryList}>
          {cv.experience.map((entry) => (
            <li key={entry.title} className={styles.entry}>
              <div className={styles.entryRow}>
                <span className={styles.entryTitle}>
                  <Highlight color="yellow" onOpen={() => onOpen(entry.opens)}>
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

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Projects</h2>
        <ul className={styles.entryList}>
          {cv.projects.map((project) => (
            <li key={project.title} className={styles.entry}>
              <div className={styles.entryRow}>
                <span className={styles.entryTitle}>
                  {project.opens ? (
                    <Highlight color={project.highlight} onOpen={() => onOpen(project.opens as SheetId)}>
                      {project.title}
                    </Highlight>
                  ) : (
                    <Highlight color={project.highlight} href={project.href as string} icon={project.icon}>
                      {project.title}
                    </Highlight>
                  )}{' '}
                  <span className={styles.entryOrg}>| {project.stack}</span>
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

      <section className={styles.skills}>
        <h2 className={styles.sectionLabel}>Technical Skills</h2>
        <div className={styles.skillsLines}>
          {cv.skills.map((group) => (
            <p key={group.label} className={styles.skillLine}>
              <strong>{group.label}:</strong> {group.items}
            </p>
          ))}
        </div>
      </section>

      <p className={styles.footer}>
        {cv.footer.prefix}{' '}
        <Highlight color="yellow" onOpen={() => onOpen(cv.footer.opens)}>
          {cv.footer.link}
        </Highlight>
      </p>
    </div>
  );
}
