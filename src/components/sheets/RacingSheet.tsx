import { racing } from '@/content';
import { ProjectHeader } from '../ProjectHeader';
import sheetStyles from '../Sheet.module.css';
import styles from './RacingSheet.module.css';

export function RacingSheet({ onBack }: { onBack: () => void }) {
  const { scale, x, y } = racing.gps.imageCrop;
  return (
    <div className={sheetStyles.wrapWide}>
      <ProjectHeader date={racing.date} onBack={onBack} />
      <h2 className={sheetStyles.h2}>{racing.title}</h2>
      <p className={styles.subtitle}>{racing.subtitle}</p>

      <div className={styles.heroWrap}>
        <span className={`${styles.tape} ${styles.tapeLeft}`} aria-hidden="true" />
        <span className={`${styles.tape} ${styles.tapeRight}`} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={racing.hero} alt="City Racing Formula Student car" />
      </div>

      <p className={styles.paragraph}>
        <strong>{racing.telemetry.lead}</strong> {racing.telemetry.text}
      </p>

      <div className={styles.grid}>
        <p className={styles.paragraph}>
          <strong>{racing.gps.lead}</strong> {racing.gps.text}
        </p>
        <div className={styles.polaroid}>
          <div className={styles.polaroidFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={racing.gps.image}
              alt="GPS lap trace overlaid on the FSUK circuit map"
              style={{ transform: `scale(${scale}) translate(${x}%, ${y}%)` }}
            />
          </div>
        </div>
      </div>

      <p className={styles.website}>
        {racing.website.prefix}{' '}
        <a href={racing.website.href} target="_blank" rel="noopener noreferrer">
          {racing.website.label}
        </a>
      </p>
    </div>
  );
}
