/**
 * Reproduces the design handoff's image-slot crop math exactly, for a
 * square (1:1) frame. Ported from
 * design_handoff_alibars_portfolio/reference/image-slot.js `_applyView`
 * (~lines 1000-1060) and `_geom` (~lines 977-986):
 *
 *   base = max(fw/iw, fh/ih)   // cover baseline
 *   k = base * view.scale
 *   width  = iw*k/fw * 100%    height = ih*k/fh * 100%
 *   left   = (50+view.x)%      top    = (50+view.y)%
 *
 * and the reference's own CSS for `.frame img` (image-slot.js:299):
 * `position:absolute; transform:translate(-50%,-50%)`. This is what makes
 * an off-centre pan (view.x/view.y != 0) actually shift the visible crop
 * once the image is scaled: `object-position` has no effect on the axis
 * `object-fit:cover` already stretches to fill (see docs/review round 4,
 * slice-rv-gps-crop-01).
 */

export type ImageSlotAsset = { naturalWidth: number; naturalHeight: number };

/** Pan/zoom, in the reference's own coordinate system: x/y are frame-% offsets from centre. */
export type ImageSlotView = { scale: number; x: number; y: number };

export type ImageSlotStyle = {
  position: 'absolute';
  width: string;
  height: string;
  left: string;
  top: string;
  transform: string;
};

/** Rounds to 4 decimal places, clean enough for CSS while avoiding float noise like 179.99999999999997. */
function pct(n: number): string {
  return `${Math.round(n * 10000) / 10000}%`;
}

export function imageSlotStyle(asset: ImageSlotAsset, view: ImageSlotView): ImageSlotStyle {
  const { naturalWidth: iw, naturalHeight: ih } = asset;
  // fw === fh === 1 for a square (aspect-ratio: 1/1) frame, so
  // max(fw/iw, fh/ih) reduces to 1/min(iw, ih).
  const base = 1 / Math.min(iw, ih);
  const k = base * view.scale;
  return {
    position: 'absolute',
    width: pct(iw * k * 100),
    height: pct(ih * k * 100),
    left: pct(50 + view.x),
    top: pct(50 + view.y),
    transform: 'translate(-50%, -50%)',
  };
}
