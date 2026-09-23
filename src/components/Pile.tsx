'use client';

import { sheetTitles } from '@/content';
import { fillerSheets, sheetStyle, thickness, type SheetId } from '@/lib/pile';
import { useFocusAfterIntro, useFocusOnTopChange } from '@/lib/usePileFocus';
import { usePile } from '@/lib/usePile';
import { SheetFrame } from './SheetFrame';
import { StickyNote } from './StickyNote';
import { Tabs } from './Tabs';
import { TitlePage } from './TitlePage';
import { AboutSheet } from './sheets/AboutSheet';
import { CrumbifySheet } from './sheets/CrumbifySheet';
import { CvSheet } from './sheets/CvSheet';
import { RacingSheet } from './sheets/RacingSheet';
import { VideoSheet } from './sheets/VideoSheet';
import styles from './Pile.module.css';

const PILE_SIZE = 16;
const FILLERS = fillerSheets(PILE_SIZE);
const M = FILLERS.length;
const THICKNESS = thickness(PILE_SIZE);

// Back-to-front DOM order for equal z-index ties, matching the reference
// prototype: About, Video, Racing, Crumbify, CV.
const SHEET_RENDER_ORDER: SheetId[] = ['about', 'video', 'racing', 'crumbify', 'cv'];

export function Pile() {
  const { state, pull, bring, reducedMotion } = usePile();
  const { top, phase, moving, touched } = state;

  useFocusOnTopChange(top, touched, phase);
  useFocusAfterIntro(phase, top);

  const showIntro = phase !== 'done';
  const pileTransform = phase === 'off' ? 'translateX(-130vw)' : 'translateX(0)';
  const showTabs = phase === 'done';
  const showNote = phase === 'done' && !touched && top === 'cv';

  return (
    <main className={styles.main}>
      {/* React 19 hoists this into <head>; it is the only <title> node in
          the document (layout.tsx's static metadata carries no `title`), so
          nothing else can ever clobber it, at any CPU speed (slice-gpi-02 /
          behaviour-02 and duplicates). Before the intro finishes this
          renders the same 'Ali Bars' the static HTML already had. */}
      <title>{phase === 'done' ? sheetTitles[top] : 'Ali Bars'}</title>
      <div className={styles.stageWrap}>
        <Tabs top={top} moving={moving} onSelect={bring} variant="mobile" hidden={showIntro} />
        <div className={`${styles.stage} js-stage`} style={{ transform: pileTransform }}>
          <div className={styles.thickness} style={{ transform: `translate(5px, ${THICKNESS}px)` }} />
          {FILLERS.map((f) => (
            <div key={f.id} className={styles.filler} style={{ zIndex: f.z, background: f.bg, transform: f.transform }} />
          ))}

          {SHEET_RENDER_ORDER.map((id) => {
            const style = sheetStyle(id, { top, moving }, M, reducedMotion);
            return (
              <SheetFrame key={id} id={id} style={style} cv={id === 'cv'} inert={showIntro}>
                {id === 'cv' ? <CvSheet onOpen={bring} /> : null}
                {id === 'crumbify' ? <CrumbifySheet onBack={() => bring('cv')} /> : null}
                {id === 'racing' ? <RacingSheet onBack={() => bring('cv')} /> : null}
                {id === 'video' ? <VideoSheet onBack={() => bring('cv')} /> : null}
                {id === 'about' ? <AboutSheet onBack={() => bring('cv')} /> : null}
              </SheetFrame>
            );
          })}

          {showTabs ? <Tabs top={top} moving={moving} onSelect={bring} zIndex={M + 1} variant="desktop" /> : null}
          {showIntro ? (
            <TitlePage pulling={phase === 'pull'} zIndex={M + 10} onDismiss={pull} />
          ) : null}
          {showNote ? <StickyNote /> : null}
        </div>
      </div>
    </main>
  );
}
