import { crumbify } from '@/content';
import { GithubIcon } from '../GithubIcon';
import styles from './CrumbifySheet.module.css';

/** Split out of CrumbifySheet to keep that function under the 50-line budget (code-r3-05). */
export function CrumbifyCtas() {
  return (
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
  );
}
