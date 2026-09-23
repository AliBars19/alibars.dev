import { describe, expect, it } from 'vitest';
import { about, crumbify, cv, note, racing, site, tabs, title, video } from './content';

function allStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') acc.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, acc));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => allStrings(v, acc));
  return acc;
}

describe('content', () => {
  it('has no em dashes anywhere in the copy', () => {
    const all = allStrings({ site, title, note, tabs, cv, crumbify, racing, video, about });
    for (const s of all) expect(s).not.toContain('—');
  });

  it('never mentions a phone number', () => {
    const all = allStrings({ site, title, note, tabs, cv, crumbify, racing, video, about }).join(' ');
    // A phone number would show up as a run of 10+ digits (with optional
    // separators); nothing in this content should match that shape.
    expect(all).not.toMatch(/(\+?\d[\d\s-]{9,}\d)/);
  });

  it('City Racing CV entry ends July 2026 and has exactly two bullets', () => {
    const racingEntry = cv.experience.find((e) => e.opens === 'racing');
    expect(racingEntry?.dates).toBe('Aug. 2025 – July 2026');
    expect(racingEntry?.bullets).toHaveLength(2);
    expect(racingEntry?.bullets.some((b) => b.includes('csg.racing'))).toBe(false);
  });

  it('Racing page keeps the July 2026 date and the csg.racing website line', () => {
    expect(racing.date).toBe('Aug. 2025 – July 2026');
    expect(racing.website.label).toBe('csg.racing');
    expect(racing.website.href).toBe('https://csg.racing');
  });

  it('download CV points at the redacted PDF with the download attribute contract', () => {
    expect(site.downloadCvHref).toBe('/Ali_Bars_CV.pdf');
  });

  it('marks unknown URLs with a TODO placeholder', () => {
    const project = cv.projects.find((p) => p.title === 'Automated Publishing Platform');
    expect(project && 'href' in project ? project.href : undefined).toMatch(/^#TODO-/);
    expect(crumbify.ctas[0]?.href).toMatch(/^#TODO-/);
    expect(video.cta.href).toMatch(/^#TODO-/);
  });

  it('has exactly 5 tabs matching the sheet ids', () => {
    expect(tabs.map((t) => t.id)).toEqual(['cv', 'crumbify', 'racing', 'video', 'about']);
  });

  it('every project entry has exactly one of opens or href (discriminated union contract, code-14)', () => {
    for (const project of cv.projects) {
      const hasOpens = 'opens' in project && project.opens !== undefined;
      const hasHref = 'href' in project && project.href !== undefined;
      expect(hasOpens).not.toBe(hasHref);
    }
  });

  it('racing GPS crop reproduces the reference image-slot values exactly, in its own coordinate system (slice-rv-gps-crop-01)', () => {
    // scale/x/y are the reference's literal pan (.image-slots.state.json:
    // cv-racing-gps { s:1.8, x:18, y:50 }); naturalWidth/naturalHeight are
    // the actual asset's pixel dimensions, both fed verbatim into
    // src/lib/imageSlot.ts's `_applyView` reproduction — no derived,
    // hand-tuned objectPosition value.
    expect(racing.gps.imageCrop).toEqual({ scale: 1.8, x: 18, y: 50, naturalWidth: 161, naturalHeight: 348 });
  });
});
