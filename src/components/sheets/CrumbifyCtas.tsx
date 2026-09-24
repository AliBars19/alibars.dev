import { crumbify } from '@/content';
import { isPlaceholderUrl } from '@/lib/url';
import { GithubIcon } from '../GithubIcon';
import styles from './CrumbifySheet.module.css';

/**
 * Split out of CrumbifySheet to keep that function under the 50-line budget
 * (code-r3-05). Owner rule (fix round 4b): a CTA whose URL is still a TODO
 * placeholder does not render; if both are placeholders the whole row is
 * omitted so no empty gap is left in its place.
 */
export function CrumbifyCtas() {
  const appStore = crumbify.ctas[0];
  const github = crumbify.ctas[1];
  const showAppStore = appStore !== undefined && !isPlaceholderUrl(appStore.href);
  const showGithub = github !== undefined && !isPlaceholderUrl(github.href);

  if (!showAppStore && !showGithub) return null;

  return (
    <div className={styles.ctas}>
      {showAppStore && (
        <a
          className={`${styles.cta} ${styles.appStore}`}
          href={appStore.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {appStore.label}
        </a>
      )}
      {showGithub && (
        <a className={`${styles.cta} ${styles.github}`} href={github.href} target="_blank" rel="noopener noreferrer">
          {github.icon === 'github' && <GithubIcon size={20} />}
          {github.label}
        </a>
      )}
    </div>
  );
}
