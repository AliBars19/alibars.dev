/**
 * Pure logic for "the pile": deterministic filler jitter, thickness, and the
 * z-index/transform table that drives which sheet is visible and where.
 * No React here on purpose (see usePile.ts for the stateful phase machine).
 */

export const SHEET_IDS = ['cv', 'crumbify', 'racing', 'video', 'about'] as const;
export type SheetId = (typeof SHEET_IDS)[number];

export type MovingState = { k: SheetId; prev: SheetId; stage: 'out' | 'in' } | null;

export type PileTopState = {
  top: SheetId;
  moving: MovingState;
};

export type CanBringState = PileTopState & {
  phase: 'off' | 'push' | 'pull' | 'done';
};

export type Jitter = { r: number; x: number; y: number };

/**
 * Deterministic per-id jitter used for filler sheets, ported verbatim from
 * the design handoff prototype so the pile looks identical to the reference.
 */
export function jitter(id: string): Jitter {
  let i = 0;
  for (const ch of id) i = (i * 31 + ch.charCodeAt(0)) % 997;
  return {
    r: (((i * 37) % 13) - 6) * 0.55,
    x: (((i * 53) % 9) - 4) * 3.5,
    y: (((i * 29) % 7) - 3) * 2.5,
  };
}

const FILLER_TONES = [
  'var(--paper-alt-1)',
  'var(--paper-alt-2)',
  'var(--paper-alt-3)',
  'var(--paper-alt-4)',
] as const;

export type FillerSheet = { id: string; z: number; bg: string; transform: string };

/** Blank, non-content sheets that fill out the visual thickness of the pile. */
export function fillerSheets(pileSize: number): FillerSheet[] {
  const m = Math.min(pileSize, 8);
  return Array.from({ length: m }, (_, i) => {
    const id = `f${i}`;
    const j = jitter(id);
    return {
      id,
      z: i + 1,
      bg: FILLER_TONES[i % FILLER_TONES.length] as string,
      transform: `translate(${j.x}px,${j.y}px) rotate(${j.r}deg)`,
    };
  });
}

/** T = round(min(pileSize,60)*0.9)+4; default pileSize 16 -> 18. */
export function thickness(pileSize: number): number {
  return Math.round(Math.min(pileSize, 60) * 0.9) + 4;
}

const STRAIGHT_TRANSFORM = 'translate(0,0) rotate(-.4deg)';
const OUT_TRANSFORM = 'translate(112%,-3%) rotate(5deg)';

export type SheetStyle = {
  transform: string;
  z: number;
  visible: boolean;
  opacity: number;
};

/**
 * Per-sheet transform/z-index/visibility for a given content sheet id.
 * Mirrors the prototype's `sheet(id, m)`:
 *  - moving.k / 'out'  -> z = m+1, slid out to the right
 *  - moving.k / 'in'   -> z = m+3, back at the straight position
 *  - moving.prev, or top with no move -> z = m+2, straight position
 *  - anything else -> hidden
 *
 * Under `reducedMotion`, sheets never translate off-stage: a swap is an
 * instant cross-fade instead, driven by `opacity` (Sheet.module.css swaps
 * its transition to `opacity` under the same media query).
 */
export function sheetStyle(id: SheetId, state: PileTopState, m: number, reducedMotion = false): SheetStyle {
  const { top, moving } = state;
  if (moving && moving.k === id) {
    if (moving.stage === 'out') {
      return reducedMotion
        ? { transform: STRAIGHT_TRANSFORM, z: m + 1, visible: true, opacity: 0 }
        : { transform: OUT_TRANSFORM, z: m + 1, visible: true, opacity: 1 };
    }
    return { transform: STRAIGHT_TRANSFORM, z: m + 3, visible: true, opacity: 1 };
  }
  if ((moving && moving.prev === id) || (!moving && top === id)) {
    return { transform: STRAIGHT_TRANSFORM, z: m + 2, visible: true, opacity: 1 };
  }
  return { transform: STRAIGHT_TRANSFORM, z: 0, visible: false, opacity: 1 };
}

/** Guards for bring(k): intro must be done, no move in flight, k not already on top. */
export function canBring(state: CanBringState, k: SheetId): boolean {
  return state.phase === 'done' && state.moving === null && state.top !== k;
}

export function hashForSheet(id: SheetId): string {
  return id === 'cv' ? '' : `#${id}`;
}

export function sheetFromHash(hash: string): SheetId | null {
  const clean = hash.replace(/^#/, '');
  if (clean === '') return null;
  return (SHEET_IDS as readonly string[]).includes(clean) ? (clean as SheetId) : null;
}
