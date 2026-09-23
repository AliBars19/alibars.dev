'use client';

import { useEffect, useRef } from 'react';
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
  const { state, pull, bring, reducedMotion } = usePile();
  const { top, phase, moving, touched } = state;
  const prevTopRef = useRef(top);

  useEffect(() => {
    if (phase === 'done') document.title = sheetTitles[top];
  }, [top, phase]);

  // After a bring() completes, the previous top sheet's content unmounts
  // (SheetFrame only renders children when visible), which drops focus to
  // <body>. Move it to the new top sheet's container so keyboard users
  // continue from the page they just opened, instead of restarting at the
  // top of the document.
  useEffect(() => {
    if (prevTopRef.current === top) return;
    prevTopRef.current = top;
    if (!touched || phase !== 'done') return;
    if (document.activeElement !== document.body) return;
    document.getElementById(`sheet-${top}`)?.focus({ preventScroll: true });
  }, [top, touched, phase]);

  const showIntro = phase !== 'done';
  const pileTransform = phase === 'off' ? 'translateX(-130vw)' : 'translateX(0)';
  const showTabs = phase === 'done';
  const showNote = phase === 'done' && !touched && top === 'cv';

  return (
    <main className={styles.main}>
      <div className={styles.stageWrap}>
        {showTabs ? <Tabs top={top} moving={moving} onSelect={bring} variant="mobile" /> : null}
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
