import { describe, expect, it } from 'vitest';
import { imageSlotStyle } from './imageSlot';

describe('imageSlotStyle', () => {
  it('reproduces the reference _applyView math for the GPS polaroid crop (161x348 asset, s:1.8 x:+18 y:+50, square frame)', () => {
    // Reference (image-slot.js _applyView, ~lines 1034-1040):
    //   base = max(fw/iw, fh/ih); k = base * s;
    //   width = iw*k/fw*100 + '%'; height = ih*k/fh*100 + '%';
    //   left = (50+x) + '%'; top = (50+y) + '%';
    // For a square frame (fw === fh), base reduces to 1/min(iw, ih).
    const style = imageSlotStyle({ naturalWidth: 161, naturalHeight: 348 }, { scale: 1.8, x: 18, y: 50 });
    expect(style.width).toBe('180%');
    expect(Number(style.height.replace('%', ''))).toBeCloseTo(389.0683, 3);
    expect(style.left).toBe('68%');
    expect(style.top).toBe('100%');
    expect(style.position).toBe('absolute');
    expect(style.transform).toBe('translate(-50%, -50%)');
  });

  it('at scale 1, x:0, y:0 (no pan) the image exactly covers the square frame, centred', () => {
    const style = imageSlotStyle({ naturalWidth: 400, naturalHeight: 200 }, { scale: 1, x: 0, y: 0 });
    // The narrower dimension (height, 200) sets the cover baseline, so
    // width overflows: base = 1/200, k = 1/200, width = 400/200*100 = 200%,
    // height = 200/200*100 = 100%.
    expect(style.width).toBe('200%');
    expect(style.height).toBe('100%');
    expect(style.left).toBe('50%');
    expect(style.top).toBe('50%');
  });
});
