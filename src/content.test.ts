import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isPlaceholderUrl } from './lib/url';
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

  it('every conditionally-hidden URL is either a real https URL or a placeholder that isPlaceholderUrl recognises, and any remaining placeholder is marked with a TODO(ali) comment', () => {
    // These are exactly the fields the app gates on isPlaceholderUrl (see
    // CrumbifyCtas.tsx, CvProjects.tsx, VideoSheet.tsx): an external
    // project's href, the Crumbify CTA hrefs, and the video CTA href. This
    // asserts the invariant, not which specific ones are still TODO, so
    // filling in a placeholder never breaks this test.
    const externalProjectHrefs = cv.projects
      .filter((p): p is typeof p & { href: string } => 'href' in p && typeof p.href === 'string')
      .map((p) => p.href);
    const hrefs = [...externalProjectHrefs, ...crumbify.ctas.map((c) => c.href), video.cta.href];

    const contentSource = readFileSync(join(process.cwd(), 'src/content.ts'), 'utf-8');
    for (const href of hrefs) {
      expect(href.startsWith('https://') || isPlaceholderUrl(href)).toBe(true);
      if (isPlaceholderUrl(href)) {
        const idx = contentSource.indexOf(href);
        expect(idx).toBeGreaterThan(-1);
        const before = contentSource.slice(Math.max(0, idx - 200), idx);
        expect(before).toMatch(/TODO\(ali\)/);
      }
    }
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
    // src/lib/imageSlot.ts's `_applyView` reproduction: no derived,
    // hand-tuned objectPosition value.
    expect(racing.gps.imageCrop).toEqual({ scale: 1.8, x: 18, y: 50, naturalWidth: 161, naturalHeight: 348 });
  });
});
