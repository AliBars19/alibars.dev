'use client';

import { useEffect } from 'react';
import { sheetTitles } from '@/content';
import { fillerSheets, sheetStyle, thickness, type SheetId } from '@/lib/pile';
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
  const { state, pull, bring } = usePile();
  const { top, phase, moving, touched } = state;

  useEffect(() => {
    if (phase === 'done') document.title = sheetTitles[top];
  }, [top, phase]);

  const showIntro = phase !== 'done';
  const pileTransform = phase === 'off' ? 'translateX(-130vw)' : 'translateX(0)';
  const showTabs = phase === 'done';
  const showNote = phase === 'done' && !touched && top === 'cv';

  return (
    <main className={styles.main}>
      <div className={styles.stageWrap}>
        {showTabs ? <Tabs top={top} moving={moving} onSelect={bring} zIndex={M + 1} /> : null}
        <div className={`${styles.stage} js-stage`} style={{ transform: pileTransform }}>
          <div className={styles.thickness} style={{ transform: `translate(5px, ${THICKNESS}px)` }} />
          {FILLERS.map((f) => (
            <div key={f.id} className={styles.filler} style={{ zIndex: f.z, background: f.bg, transform: f.transform }} />
          ))}

          {SHEET_RENDER_ORDER.map((id) => {
            const style = sheetStyle(id, { top, moving }, M);
            return (
              <SheetFrame key={id} id={id} style={style} cv={id === 'cv'}>
                {id === 'cv' ? <CvSheet onOpen={bring} /> : null}
                {id === 'crumbify' ? <CrumbifySheet onBack={() => bring('cv')} /> : null}
                {id === 'racing' ? <RacingSheet onBack={() => bring('cv')} /> : null}
                {id === 'video' ? <VideoSheet onBack={() => bring('cv')} /> : null}
                {id === 'about' ? <AboutSheet onBack={() => bring('cv')} /> : null}
              </SheetFrame>
            );
          })}

          {showIntro ? (
            <TitlePage pulling={phase === 'pull'} zIndex={M + 10} onDismiss={pull} />
          ) : null}
        </div>
        {showNote ? <StickyNote /> : null}
      </div>
    </main>
  );
}
