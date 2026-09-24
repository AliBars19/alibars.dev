import { video } from '@/content';
import { isPlaceholderUrl } from '@/lib/url';
import { GithubIcon } from '../GithubIcon';
import { ProjectHeader } from '../ProjectHeader';
import sheetStyles from '../Sheet.module.css';
import styles from './VideoSheet.module.css';

export function VideoSheet({ onBack }: { onBack: () => void }) {
  return (
    <div className={sheetStyles.wrapWide}>
      <ProjectHeader date={video.date} onBack={onBack} />
      <h2 className={sheetStyles.h2}>{video.title}</h2>

      <div className={styles.grid}>
        <div className={styles.polaroid}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={video.sample} alt="Frame from a finished lyric video" />
        </div>
        <div className={styles.stats}>
          {video.stats.map((stat) => (
            <div className={styles.statRow} key={stat.l}>
              <span className={styles.statValue}>{stat.v}</span>
              <span className={styles.statLabel}>{stat.l}</span>
            </div>
          ))}
          <a className={styles.tiktok} href={video.tiktok.href} target="_blank" rel="noopener noreferrer">
            {video.tiktok.label}
          </a>
        </div>
      </div>

      {video.body.map((paragraph) => (
        <p className={styles.paragraph} key={paragraph}>
          {paragraph}
        </p>
      ))}

      {/* Owner rule (fix round 4b): hidden while video.cta.href is still a TODO placeholder. */}
      {!isPlaceholderUrl(video.cta.href) && (
        <a className={styles.cta} href={video.cta.href} target="_blank" rel="noopener noreferrer">
          {video.cta.icon === 'github' && <GithubIcon size={20} />}
          {video.cta.label}
        </a>
      )}
    </div>
  );
}
