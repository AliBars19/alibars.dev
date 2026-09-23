import { racing } from '@/content';
import { ProjectHeader } from '../ProjectHeader';
import sheetStyles from '../Sheet.module.css';
import styles from './RacingSheet.module.css';

export function RacingSheet({ onBack }: { onBack: () => void }) {
  const { scale } = racing.gps.imageCrop;
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
              // Reference stores this crop as scale 1.8 / offset x +18% / y +50%
              // (design_handoff .../reference/.image-slots.state.json), which the
              // reference runtime applies as a pan on top of an object-fit:cover
              // baseline. The source asset is a low-res phone photo of a laptop
              // screen (161x348px; the handoff flags it for replacement with a
              // higher-res original from Ali), so we reproduce the *intent* here
              // (zoom into the on-screen map, centred on the GPS track) via
              // object-position, tuned to frame the map instead of the laptop
              // bezel/keyboard visible in the source.
              style={{ objectPosition: '58% 22%', transform: `scale(${scale})` }}
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
