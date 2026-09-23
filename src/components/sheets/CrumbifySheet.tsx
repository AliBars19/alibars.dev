import { crumbify } from '@/content';
import { GithubIcon } from '../GithubIcon';
import { ProjectHeader } from '../ProjectHeader';
import sheetStyles from '../Sheet.module.css';
import styles from './CrumbifySheet.module.css';

const ROTATIONS = ['rotate(-2deg)', 'rotate(1deg) translateY(10px)', 'rotate(-1deg)'];

export function CrumbifySheet({ onBack }: { onBack: () => void }) {
  return (
    <div className={sheetStyles.wrapWide}>
      <ProjectHeader date={crumbify.date} onBack={onBack} />
      <h2 className={sheetStyles.h2}>{crumbify.title}</h2>
      <p className={styles.intro}>{crumbify.intro}</p>

      <div className={styles.ctas}>
        <a
          className={`${styles.cta} ${styles.appStore}`}
          href={crumbify.ctas[0]?.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {crumbify.ctas[0]?.label}
        </a>
        <a
          className={`${styles.cta} ${styles.github}`}
          href={crumbify.ctas[1]?.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubIcon size={20} />
          View on GitHub
        </a>
      </div>

      <div className={styles.screenshots}>
        {crumbify.screenshots.map((src, i) => (
          <div className={styles.shot} key={src} style={{ transform: ROTATIONS[i] }}>
            <span className={styles.tape} aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Crumbify app screenshot ${i + 1}`} />
          </div>
        ))}
      </div>

      <div className={styles.hood}>
        <h3 className={styles.hoodLabel}>{crumbify.underTheHoodLabel}</h3>
        {crumbify.specs.map((spec) => (
          <div className={styles.row} key={spec.k}>
            <span className={styles.rowKey}>{spec.k}</span>
            <div className={styles.rowValue}>
              <span>{spec.v}</span>
              <span className={styles.rowTech}>{spec.tech}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
