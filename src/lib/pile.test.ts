import { describe, expect, it } from 'vitest';
import {
  SHEET_IDS,
  canBring,
  fillerSheets,
  hashForSheet,
  jitter,
  sheetFromHash,
  sheetStyle,
  thickness,
} from './pile';

describe('jitter', () => {
  it('is deterministic and matches the prototype formula for filler ids', () => {
    // Reference formula (design_handoff .../reference/Interactive CV v3.dc.html):
    // jitter(id){ let i=0; for (const ch of id) i=(i*31+ch.charCodeAt(0))%997;
    //   return { r:(((i*37)%13)-6)*0.55, x:(((i*53)%9)-4)*3.5, y:(((i*29)%7)-3)*2.5 }; }
    function reference(id: string) {
      let i = 0;
      for (const ch of id) i = (i * 31 + ch.charCodeAt(0)) % 997;
      return {
        r: (((i * 37) % 13) - 6) * 0.55,
        x: (((i * 53) % 9) - 4) * 3.5,
        y: (((i * 29) % 7) - 3) * 2.5,
      };
    }
    for (let n = 0; n < 8; n++) {
      const id = `f${n}`;
      expect(jitter(id)).toEqual(reference(id));
    }
  });

  it('returns the same value on repeated calls (fixed per sheet)', () => {
    expect(jitter('f3')).toEqual(jitter('f3'));
  });
});

describe('thickness', () => {
  it('is 18 for the default pileSize of 16', () => {
    expect(thickness(16)).toBe(18);
  });

  it('caps pileSize at 60', () => {
    expect(thickness(60)).toBe(thickness(200));
  });

  it('matches Math.round(min(pileSize,60)*0.9)+4', () => {
    expect(thickness(4)).toBe(Math.round(Math.min(4, 60) * 0.9) + 4);
    expect(thickness(40)).toBe(Math.round(Math.min(40, 60) * 0.9) + 4);
  });
});

describe('fillerSheets', () => {
  it('caps at 8 sheets even for a larger pileSize', () => {
    expect(fillerSheets(16)).toHaveLength(8);
    expect(fillerSheets(4)).toHaveLength(4);
  });

  it('cycles backgrounds through the 4 paper-alt tokens and z-indexes 1..m', () => {
    const tones = ['var(--paper-alt-1)', 'var(--paper-alt-2)', 'var(--paper-alt-3)', 'var(--paper-alt-4)'];
    const fillers = fillerSheets(8);
    fillers.forEach((f, i) => {
      expect(f.z).toBe(i + 1);
      expect(f.bg).toBe(tones[i % 4]);
      expect(f.transform).toContain('translate(');
      expect(f.transform).toContain('rotate(');
    });
  });
});

describe('sheetStyle (z-index table)', () => {
  const m = 8;

  it('top sheet with no move in progress is visible at z=m+2, straight transform', () => {
    const style = sheetStyle('cv', { top: 'cv', moving: null }, m);
    expect(style.visible).toBe(true);
    expect(style.z).toBe(m + 2);
    expect(style.transform).toBe('translate(0,0) rotate(-.4deg)');
  });

  it('non-top, non-moving sheet is hidden', () => {
    const style = sheetStyle('crumbify', { top: 'cv', moving: null }, m);
    expect(style.visible).toBe(false);
    expect(style.z).toBe(0);
  });

  it('a hidden sheet already rests at opacity 0 under reduced motion, so a swap into it is a real 0->1 fade, not a same-commit no-op (behaviour-03 / code-r4-01)', () => {
    const reduced = sheetStyle('crumbify', { top: 'cv', moving: null }, m, true);
    expect(reduced.visible).toBe(false);
    expect(reduced.opacity).toBe(0);
    // Without reduced motion, hidden sheets are still fully opaque (they
    // are covered by transform, not opacity, so a hidden opacity of 1 is
    // harmless and correct there).
    const normal = sheetStyle('crumbify', { top: 'cv', moving: null }, m, false);
    expect(normal.opacity).toBe(1);
  });

  it('moving.k in "out" stage is visible at z=m+1, off to the right', () => {
    const style = sheetStyle(
      'crumbify',
      { top: 'cv', moving: { k: 'crumbify', prev: 'cv', stage: 'out' } },
      m
    );
    expect(style.visible).toBe(true);
    expect(style.z).toBe(m + 1);
    expect(style.transform).toBe('translate(112%,-3%) rotate(5deg)');
  });

  it('moving.k in "in" stage is visible at z=m+3, straight transform', () => {
    const style = sheetStyle(
      'crumbify',
      { top: 'cv', moving: { k: 'crumbify', prev: 'cv', stage: 'in' } },
      m
    );
    expect(style.visible).toBe(true);
    expect(style.z).toBe(m + 3);
    expect(style.transform).toBe('translate(0,0) rotate(-.4deg)');
  });

  it('moving.prev is visible at z=m+2 (stays under the incoming sheet)', () => {
    const style = sheetStyle(
      'cv',
      { top: 'cv', moving: { k: 'crumbify', prev: 'cv', stage: 'out' } },
      m
    );
    expect(style.visible).toBe(true);
    expect(style.z).toBe(m + 2);
  });

  it('a sheet unrelated to a move stays hidden', () => {
    const style = sheetStyle(
      'about',
      { top: 'cv', moving: { k: 'crumbify', prev: 'cv', stage: 'out' } },
      m
    );
    expect(style.visible).toBe(false);
  });

  it('every non-moving state is fully opaque, with or without reducedMotion', () => {
    expect(sheetStyle('cv', { top: 'cv', moving: null }, m).opacity).toBe(1);
    expect(sheetStyle('cv', { top: 'cv', moving: null }, m, true).opacity).toBe(1);
  });

  it('under reducedMotion, moving.k in "out" stays at the resting transform and fades out', () => {
    const style = sheetStyle(
      'crumbify',
      { top: 'cv', moving: { k: 'crumbify', prev: 'cv', stage: 'out' } },
      m,
      true
    );
    expect(style.transform).toBe('translate(0,0) rotate(-.4deg)');
    expect(style.opacity).toBe(0);
    expect(style.visible).toBe(true);
  });

  it('under reducedMotion, moving.k in "in" stays at the resting transform, fully opaque', () => {
    const style = sheetStyle(
      'crumbify',
      { top: 'cv', moving: { k: 'crumbify', prev: 'cv', stage: 'in' } },
      m,
      true
    );
    expect(style.transform).toBe('translate(0,0) rotate(-.4deg)');
    expect(style.opacity).toBe(1);
  });

  it('without reducedMotion, moving.k in "out" still slides off to the right, fully opaque', () => {
    const style = sheetStyle(
      'crumbify',
      { top: 'cv', moving: { k: 'crumbify', prev: 'cv', stage: 'out' } },
      m,
      false
    );
    expect(style.transform).toBe('translate(112%,-3%) rotate(5deg)');
    expect(style.opacity).toBe(1);
  });
});

describe('canBring', () => {
  it('allows bringing a non-top sheet when idle and intro finished', () => {
    expect(canBring({ phase: 'done', top: 'cv', moving: null }, 'crumbify')).toBe(true);
  });

  it('refuses when intro has not finished', () => {
    expect(canBring({ phase: 'push', top: 'cv', moving: null }, 'crumbify')).toBe(false);
  });

  it('refuses when a move is already running', () => {
    expect(
      canBring(
        { phase: 'done', top: 'cv', moving: { k: 'about', prev: 'cv', stage: 'out' } },
        'crumbify'
      )
    ).toBe(false);
  });

  it('refuses when the sheet is already on top', () => {
    expect(canBring({ phase: 'done', top: 'cv', moving: null }, 'cv')).toBe(false);
  });
});

describe('hash <-> SheetId', () => {
  it('maps every sheet id to its hash', () => {
    expect(hashForSheet('cv')).toBe('');
    expect(hashForSheet('crumbify')).toBe('#crumbify');
    expect(hashForSheet('racing')).toBe('#racing');
    expect(hashForSheet('video')).toBe('#video');
    expect(hashForSheet('about')).toBe('#about');
  });

  it('parses a hash back to a SheetId', () => {
    expect(sheetFromHash('#crumbify')).toBe('crumbify');
    expect(sheetFromHash('#racing')).toBe('racing');
    expect(sheetFromHash('#video')).toBe('video');
    expect(sheetFromHash('#about')).toBe('about');
    expect(sheetFromHash('#cv')).toBe('cv');
  });

  it('returns null for an empty, unknown, or malformed hash', () => {
    expect(sheetFromHash('')).toBeNull();
    expect(sheetFromHash('#')).toBeNull();
    expect(sheetFromHash('#unknown')).toBeNull();
  });

  it('lists all sheet ids in tab order', () => {
    expect(SHEET_IDS).toEqual(['cv', 'crumbify', 'racing', 'video', 'about']);
  });
});
