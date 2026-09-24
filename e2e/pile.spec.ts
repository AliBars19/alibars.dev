import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type ElementHandle, type Page } from '@playwright/test';

const OUT_DIR = join(process.cwd(), 'out');
const STICKY_NOTE_TEXT = '.js-stage >> text=psst: click anything highlighted';

/**
 * document.elementFromPoint skips elements with pointer-events:none, so a
 * hit test against the (pointer-events:none) sticky note always "sees
 * through" it to whatever sits underneath - even when the note is the
 * thing actually painted on top there (code-r7-04). Temporarily flip the
 * note's pointer-events to 'auto' for the duration of one elementFromPoint
 * call, restoring it in a finally block, so a visual-coverage check can
 * tell "note painted over X" apart from "note genuinely isn't there".
 */
async function hitsSelectorPastNote(
  page: Page,
  noteHandle: ElementHandle | null,
  point: { x: number; y: number },
  selector: string
): Promise<boolean> {
  if (noteHandle) {
    return noteHandle.evaluate(
      (el, { x, y, selector }) => {
        const original = (el as HTMLElement).style.pointerEvents;
        (el as HTMLElement).style.pointerEvents = 'auto';
        try {
          const hit = document.elementFromPoint(x, y);
          return hit != null && hit.closest(selector) != null;
        } finally {
          (el as HTMLElement).style.pointerEvents = original;
        }
      },
      { x: point.x, y: point.y, selector }
    );
  }
  return page.evaluate(
    ({ x, y, selector }) => {
      const hit = document.elementFromPoint(x, y);
      return hit != null && hit.closest(selector) != null;
    },
    { x: point.x, y: point.y, selector }
  );
}

/**
 * Waits for the sticky note's entry animation (`noteIn`, StickyNote.module.css)
 * to finish before any position/hit-test measurement is taken. Sampling while
 * the note is still animating from translateY(12px) to its settled position
 * measures a transient location, not the real one, and can hide a genuine
 * regression (code-r8-02).
 */
async function waitForNoteAnimations(page: Page): Promise<void> {
  const note = page.locator(STICKY_NOTE_TEXT);
  if (!(await note.count())) return;
  await note.first().evaluate((el) =>
    Promise.all(
      (el.closest('[class*="note"]') ?? el)
        .getAnimations({ subtree: true })
        .map((a) => a.finished)
    )
  );
}

/** The client rect of the sticky note's first rendered text line, via a Range over its (single) text node. */
async function noteFirstLineRect(
  page: Page
): Promise<{ left: number; top: number; width: number; height: number } | null> {
  const note = page.locator(STICKY_NOTE_TEXT);
  if (!(await note.count())) return null;
  const handle = await note.first().elementHandle();
  if (!handle) return null;
  return handle.evaluate((el) => {
    const textNode = el.firstChild;
    if (!textNode) return null;
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rects = Array.from(range.getClientRects());
    if (rects.length === 0) return null;
    const first = rects[0];
    return { left: first.left, top: first.top, width: first.width, height: first.height };
  });
}

/** Every built HTML file's raw source, keyed by its path relative to out/. */
function builtHtmlFiles(): Map<string, string> {
  const files = new Map<string, string>();
  for (const name of readdirSync(OUT_DIR)) {
    if (!name.endsWith('.html')) continue;
    files.set(name, readFileSync(join(OUT_DIR, name), 'utf-8'));
  }
  return files;
}

/** Collects every `pageerror` (uncaught exception) fired on `page`. */
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test.describe('the pile', () => {
  test('intro -> click title -> CV visible -> click Crumbify highlight -> Crumbify on top with hash -> Esc -> CV', async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    const titlePage = page.getByRole('button', { name: /click to open/ });
    await expect(titlePage).toBeVisible();

    await titlePage.click();
    await expect(titlePage).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();

    await page.getByRole('link', { name: /Founder & Lead Engineer/ }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Crumbify' })).toBeVisible();
    await expect(page).toHaveURL(/#crumbify$/);
    await expect(page).toHaveTitle('Crumbify · Ali Bars');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    await expect(page).toHaveTitle('Ali Bars');
    expect(errors).toEqual([]);
  });

  test('a deep link skips the intro and opens that sheet directly', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/#video');
    await expect(page.getByRole('heading', { level: 2, name: 'Audio in, lyric video out.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /click to open/ })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('at 390px, there is no horizontal scroll and the tabs form a row above the pile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#cv');
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    // The root has overflow-x:hidden (per the handoff), so jittered filler
    // sheets may extend a few px past the viewport edge without the page
    // actually becoming horizontally scrollable. Assert scrolling itself is
    // impossible rather than that content never exceeds the viewport.
    const canScrollHorizontally = await page.evaluate(() => {
      window.scrollTo(500, 0);
      return window.scrollX > 0;
    });
    expect(canScrollHorizontally).toBe(false);

    const navBox = await nav.boundingBox();
    const stageBox = await page.locator('.js-stage').boundingBox();
    expect(navBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    // The tab row sits above (tucked flush with) the top of the pile itself
    // (not just somewhere inside <main>), with a couple of px of slack for
    // subpixel rounding.
    if (navBox && stageBox) {
      expect(navBox.y + navBox.height).toBeLessThanOrEqual(stageBox.y + 2);
    }
  });

  test('at 390px, the pile does not jump when the intro ends: the mobile tab row reserves its space from the first paint (slice-rvat-02)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const stage = page.locator('.js-stage');
    // Document-relative top, not viewport-relative: dismissing the intro
    // also moves focus onto the CV sheet, which scrolls the page, so a
    // plain getBoundingClientRect() before/after would conflate "the pile
    // moved" with "the page scrolled". Adding scrollY isolates the pile's
    // own layout position, which is what slice-rvat-02 is about.
    const docTop = () => stage.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

    const titlePage = page.getByRole('button', { name: /click to open/ });
    await expect(titlePage).toBeVisible();
    // Wait for the 120ms push transition (and layout/fonts) to settle
    // before taking the "before" measurement, so this isn't measuring a
    // not-yet-laid-out first frame.
    await page.waitForTimeout(200);
    const beforeTop = await docTop();

    await titlePage.click();
    await page.waitForTimeout(1100);

    const afterTop = await docTop();
    expect(afterTop).toBeCloseTo(beforeTop, 0);
  });

  test('tabs navigate between sheets and back pills return to the CV', async ({ page }) => {
    await page.goto('/#cv');
    await page.getByRole('button', { name: 'racing' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'City Racing' })).toBeVisible();
    await expect(page).toHaveURL(/#racing$/);

    await page.getByRole('button', { name: '← back to CV' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
  });

  test('hovering a desktop tab offsets it by translateX(3px)', async ({ page }) => {
    await page.goto('/#cv');
    const tab = page.locator('[data-variant="desktop"]').getByRole('button', { name: 'racing' });
    await expect(tab).toBeVisible();
    await tab.hover();
    await expect.poll(() => tab.evaluate((el) => getComputedStyle(el).transform)).toBe(
      'matrix(1, 0, 0, 1, 3, 0)'
    );
  });

  test('theme toggle flips the label and persists (dark desk, not just the label) across reload', async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await page.goto('/#cv');
    const toggle = page.getByRole('button', { name: /Lights (off|on)/ });
    await expect(toggle).toHaveAccessibleName('Lights off');
    await expect(page.locator('html')).toHaveAttribute('data-desk', 'light');
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Lights on');
    await expect(page.locator('html')).toHaveAttribute('data-desk', 'dark');

    await page.reload();
    await expect(page.getByRole('button', { name: /Lights (off|on)/ })).toHaveAccessibleName('Lights on');
    await expect(page.locator('html')).toHaveAttribute('data-desk', 'dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
    expect(bg).toContain('gradient');
    expect(errors).toEqual([]);
  });

  test('a system dark-mode preference (no stored value) loads the dark desk with no console error', async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    const errors = trackPageErrors(page);
    await page.goto('/#cv');
    await expect(page.locator('html')).toHaveAttribute('data-desk', 'dark');
    await expect(page.getByRole('button', { name: /Lights on/ })).toBeVisible();
    expect(errors).toEqual([]);
    await context.close();
  });

  test('a dark OS preference shows "Lights on" from the very first paint, before hydration runs', async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    // Abort every JS chunk outright so React never hydrates: goto('load')
    // alone still waits for async chunks to finish loading (they just no
    // longer run), so reading the label after goto would otherwise observe
    // the post-hydration DOM even for the old, React-driven label
    // (code-r3-02).
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await page.goto('/#cv');
    const firstPaintText = await page.getByRole('button', { name: /Lights (off|on)/ }).innerText();
    expect(firstPaintText).toBe('Lights on');
    // Proves the page really is un-hydrated: the desktop tab row only ever
    // mounts once phase reaches 'done', which needs React running (the
    // mobile row, unlike this one, is in the static HTML from the start so
    // it does not distinguish hydration state).
    expect(await page.evaluate(() => document.querySelectorAll('nav[data-variant="desktop"]').length)).toBe(0);
    await context.close();
  });

  test('with storage blocked, a dark OS preference still applies and a deep link still skips the intro', async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    const errors = trackPageErrors(page);
    await page.goto('/#about');
    await expect(page.locator('html')).toHaveAttribute('data-desk', 'dark');
    await expect(page.getByRole('heading', { level: 2, name: 'Off the page' })).toBeVisible();
    await expect(page.getByRole('button', { name: /click to open/ })).toHaveCount(0);
    expect(errors).toEqual([]);
    await context.close();
  });

  test('a deep link sets data-top before hydration so the requested sheet paints first (slice-gpi-03)', async ({
    page,
  }) => {
    // A MutationObserver is unreliable here: the pre-hydration script's
    // setAttribute and usePile's mount-effect removeAttribute can both
    // happen inside the same task, before any microtask (observer
    // callback) gets to run. Intercepting setAttribute itself is exact.
    await page.addInitScript(() => {
      (window as unknown as { __sawDataTop?: string }).__sawDataTop = undefined;
      const original = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function (name: string, value: string) {
        if (this === document.documentElement && name === 'data-top') {
          (window as unknown as { __sawDataTop?: string }).__sawDataTop = value;
        }
        return original.call(this, name, value);
      };
    });
    await page.goto('/#about');
    await expect(page.getByRole('heading', { level: 2, name: 'Off the page' })).toBeVisible();
    const saw = await page.evaluate(() => (window as unknown as { __sawDataTop?: string }).__sawDataTop);
    expect(saw).toBe('about');
  });

  test('a reduced-motion load hydrates with no error and starts done (no title page)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = trackPageErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    await expect(page.getByRole('button', { name: /click to open/ })).toHaveCount(0);
    expect(errors).toEqual([]);
    await context.close();
  });

  test('a /#racing deep link hydrates with no console error', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/#racing');
    await expect(page.getByRole('heading', { level: 2, name: 'City Racing' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a deep link keeps document.title on the sheet title (Next metadata does not reset it)', async ({
    page,
  }) => {
    await page.goto('/#racing');
    await expect(page).toHaveTitle('City Racing · Ali Bars');
    // Give Next's own metadata title node a chance to clobber it, as it did
    // before the fix (observed ~50-100ms after Pile's effect first ran).
    await page.waitForTimeout(1100);
    await expect(page).toHaveTitle('City Racing · Ali Bars');
  });

  test('a deep-link title survives heavy CPU throttling and never flickers back to "Ali Bars" (round-3: slice-NOT-FIXED-01 / code-r3-01 and duplicates)', async ({
    page,
    context,
  }) => {
    // Records every value document.title ever takes, so a transient
    // flicker back to 'Ali Bars' fails the test even if the final title
    // (checked below) happens to be correct.
    await page.addInitScript(() => {
      (window as unknown as { __titleLog: string[] }).__titleLog = [];
      const record = () => (window as unknown as { __titleLog: string[] }).__titleLog.push(document.title);
      const observer = new MutationObserver(record);
      const attach = () => {
        if (document.head) observer.observe(document.head, { childList: true, subtree: true, characterData: true });
        else requestAnimationFrame(attach);
      };
      attach();
      record();
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    await page.goto('/#racing');
    await page.waitForTimeout(3000);
    await expect(page).toHaveTitle('City Racing · Ali Bars');

    const log: string[] = await page.evaluate(() => (window as unknown as { __titleLog: string[] }).__titleLog);
    const firstCorrect = log.findIndex((t) => t === 'City Racing · Ali Bars');
    expect(firstCorrect).toBeGreaterThanOrEqual(0);
    expect(log.slice(firstCorrect)).not.toContain('Ali Bars');
  });

  test('dismissing the title page with the keyboard moves focus into the CV, not past it', async ({ page }) => {
    await page.goto('/');
    const titlePage = page.getByRole('button', { name: /click to open/ });
    await expect(titlePage).toBeVisible();
    // The title page is present (but off-screen) even during the 'off'
    // phase; wait for the 120ms push transition to actually finish so
    // Enter/Space (which only takes effect once the intro is pulled) lands.
    await page.waitForTimeout(200);
    await titlePage.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1100);
    const focusedInCv = await page.evaluate(() => {
      const cv = document.getElementById('sheet-cv');
      return !!cv && (document.activeElement === cv || cv.contains(document.activeElement));
    });
    expect(focusedInCv).toBe(true);
  });

  test('a /#cv deep link hydrates with no console error', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/#cv');
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('an unknown hash plays the intro normally, with no console error', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/#bogus');
    await expect(page.getByRole('button', { name: /click to open/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('loading /#cv normalises the URL to / without adding a history entry Back has to skip', async ({
    page,
  }) => {
    await page.goto('/#cv');
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    // The load-time hash must be *replaced*, not pushed: only the initial
    // about:blank entry plus this one page entry should exist, and a
    // straight-through pushState bug would produce the same final URL while
    // adding a second entry (code-r2-07).
    expect(await page.evaluate(() => history.length)).toBe(2);
  });

  test('opening a sheet from the CV pushes history, so Back returns to the CV', async ({ page }) => {
    await page.goto('/#cv');
    await page.getByRole('button', { name: 'racing' }).click();
    await expect(page).toHaveURL(/#racing$/);

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('on a deep-link load, the tab layer fades to opacity 0 while a sheet is moving', async ({ page }) => {
    await page.goto('/#crumbify');
    const nav = page.locator('[data-variant="desktop"]');
    // The <nav> container itself is a zero-size positioning box (its <button>
    // children are absolutely positioned outside it), so assert visibility
    // via a tab button, not the container.
    await expect(page.locator('[data-variant="desktop"]').getByRole('button', { name: 'about' })).toBeVisible();
    await page.getByRole('button', { name: 'about' }).click();
    await expect.poll(() => nav.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  });

  test('on the mobile tab row, opacity fades instead of blinking during a move', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#crumbify');
    const nav = page.locator('[data-variant="mobile"]');
    await expect(nav).toBeVisible();
    // Guards the fix itself (slice-r2-03), not just its end state: an
    // instant opacity 1 -> 0 change also ends at '0' with no transition at
    // all (code-r3-03).
    expect(await nav.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain('opacity');
    expect(await nav.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0.2s');
    await page.getByRole('button', { name: 'about' }).click();
    await expect.poll(() => nav.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  });

  test('in dark mode, a CV contact link keeps the dark focus outline (not the near-invisible light one)', async ({
    page,
  }) => {
    await page.goto('/#cv');
    await page.locator('html').evaluate((el) => el.setAttribute('data-desk', 'dark'));
    const link = page.getByRole('link', { name: 'alibars999@gmail.com' });
    await link.focus();
    const outlineColor = await link.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(outlineColor).toBe('rgb(28, 27, 25)');
  });

  test('in dark mode, a keyboard-focused tab shows the visible dark outline, not the near-invisible light one (behaviour-01)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#cv');
    await page.locator('html').evaluate((el) => el.setAttribute('data-desk', 'dark'));
    const desktopTab = page.locator('nav[data-variant="desktop"] button').first();
    await desktopTab.focus();
    const desktopOutline = await desktopTab.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(desktopOutline).toBe('rgb(232, 228, 220)');

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileTab = page.locator('nav[data-variant="mobile"] button').first();
    await mobileTab.focus();
    const mobileOutline = await mobileTab.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(mobileOutline).toBe('rgb(232, 228, 220)');
  });

  test('Racing telemetry/GPS leads render at font-weight 600, matching the prototype (slice-r2-02)', async ({
    page,
  }) => {
    await page.goto('/#racing');
    const lead = page.locator('strong', { hasText: 'Live telemetry.' });
    await expect(lead).toBeVisible();
    const weight = await lead.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(weight).toBe('600');
  });

  test('CV highlights stay inline (not a centred block) at narrow widths (slice-cvcr-02)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/#cv');
    const link = page.getByRole('link', { name: /Data Acquisition & Firmware Engineer/ });
    await expect(link).toBeVisible();
    const display = await link.evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe('inline');
    const textAlign = await link.evaluate((el) => getComputedStyle(el).textAlign);
    expect(textAlign).not.toBe('center');
  });

  test('download CV link points at the redacted PDF and is not intercepted by the router', async ({ page }) => {
    await page.goto('/#cv');
    const link = page.getByRole('link', { name: 'Download CV (PDF)' });
    await expect(link).toHaveAttribute('href', '/Ali_Bars_CV.pdf');
    await expect(link).toHaveAttribute('download', '');
  });

  const INK = 'rgb(28, 27, 25)';

  test('all 4 CV yellow highlights keep ink text colour at rest, on hover and on focus, and the background changes on hover (slice-cvcr4-01 / code-r4-02)', async ({
    page,
  }) => {
    // The Automated Publishing Platform highlight (the only purple one) is
    // excluded here: its GitHub URL is still a TODO placeholder as of this
    // round, so per the owner rule (fix round 4b) it renders as plain text,
    // not a highlight link. See the dedicated test below.
    await page.goto('/#cv');
    const highlightNames = [
      /Founder & Lead Engineer/,
      /Data Acquisition & Firmware Engineer/,
      /Video Automation Pipeline/,
      /motorsport \/ F1, music, esports/,
    ];
    for (const name of highlightNames) {
      const link = page.getByRole('link', { name });
      await expect(link).toBeVisible();
      const restColor = await link.evaluate((el) => getComputedStyle(el).color);
      const restBg = await link.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(restColor).toBe(INK);

      await link.hover();
      // The background change runs on `transition: background 0.2s`
      // (Highlight.module.css), so poll instead of reading immediately
      // after hover() (which can catch the transition mid-flight, or even
      // its very first, still-rest-coloured frame).
      await expect
        .poll(() => link.evaluate((el) => getComputedStyle(el).backgroundColor))
        .not.toBe(restBg);
      const hoverColor = await link.evaluate((el) => getComputedStyle(el).color);
      expect(hoverColor).toBe(INK);

      await link.focus();
      const focusColor = await link.evaluate((el) => getComputedStyle(el).color);
      expect(focusColor).toBe(INK);

      // Move off so the next highlight's rest state isn't polluted by a
      // lingering :hover from this iteration.
      await page.mouse.move(0, 0);
    }
  });

  test('the sheet container keeps no visible outline after a keyboard-driven bring() settles (regression for slice-new-01 / code-r4-02)', async ({
    page,
  }) => {
    await page.goto('/#cv');
    const founderLink = page.getByRole('link', { name: /Founder & Lead Engineer/ });
    await founderLink.focus();
    await page.keyboard.press('Enter');
    const sheet = page.locator('#sheet-crumbify');
    await expect(sheet).toBeVisible();
    // Wait for the move to settle (SETTLE_MS) so #sheet-crumbify is the
    // element that actually received the programmatic focus() (usePile
    // moves focus once bring() finishes).
    await page.waitForTimeout(1000);
    await expect(sheet).toBeFocused();
    const outlineStyle = await page.evaluate(
      () => getComputedStyle(document.activeElement as Element).outlineStyle
    );
    expect(outlineStyle).toBe('none');
  });

  test('under reduced motion, a sheet swap is a real cross-fade: the incoming sheet passes through a partial opacity instead of a hard cut (behaviour-03 / code-r4-01 / code-r7-02)', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/#cv');
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    const incoming = page.locator('#sheet-crumbify');

    // code-r7-02: a single opacity read after a fixed 50ms sleep is flaky -
    // under load the read can land before the 'in' stage commits (opacity
    // still 0) or after the ~0.2s transition has already finished (opacity
    // back to 1). Sample every animation frame on the page itself instead,
    // so the check is a genuine intermediate-value proof rather than a
    // timing guess.
    await incoming.evaluate((el) => {
      const win = window as unknown as { __opacitySamples: number[] };
      win.__opacitySamples = [];
      const SAMPLE_LIMIT = 60;
      const tick = () => {
        win.__opacitySamples.push(Number(getComputedStyle(el).opacity));
        if (win.__opacitySamples.length < SAMPLE_LIMIT) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await page.getByRole('button', { name: 'crumbify' }).click();
    await page.waitForFunction(() => {
      const win = window as unknown as { __opacitySamples: number[] };
      return win.__opacitySamples.length >= 60;
    });

    const samples = await page.evaluate(() => (window as unknown as { __opacitySamples: number[] }).__opacitySamples);
    const sawPartialOpacity = samples.some((v) => v > 0 && v < 1);
    expect(sawPartialOpacity, `expected an intermediate opacity in samples: ${samples.join(', ')}`).toBe(true);
    await context.close();
  });

  test('no href in the built out/ HTML contains a TODO placeholder (owner rule, fix round 4b)', () => {
    const files = builtHtmlFiles();
    expect(files.size).toBeGreaterThan(0);
    for (const [name, html] of files) {
      const hrefMatches = html.match(/href="[^"]*"/g) ?? [];
      const placeholderHrefs = hrefMatches.filter((h) => h.includes('TODO'));
      expect(placeholderHrefs, `${name} has a placeholder href: ${placeholderHrefs.join(', ')}`).toEqual([]);
    }
  });

  test('the Crumbify CTA row and the Video GitHub CTA are hidden while their URLs are still TODO placeholders, and the Automated Publishing Platform title is plain text, not a link', async ({
    page,
  }) => {
    await page.goto('/#crumbify');
    await expect(page.getByRole('heading', { level: 2, name: 'Crumbify' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get it on the App Store/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /View on GitHub/ })).toHaveCount(0);

    await page.goto('/#video');
    await expect(page.getByRole('heading', { level: 2, name: 'Audio in, lyric video out.' })).toBeVisible();
    await expect(page.getByRole('link', { name: /View the code on GitHub/ })).toHaveCount(0);

    await page.goto('/#cv');
    await expect(page.getByRole('link', { name: /Automated Publishing Platform/ })).toHaveCount(0);
    await expect(page.getByText('Automated Publishing Platform')).toBeVisible();
  });

  const MOBILE_TAB_WIDTHS = [360, 390, 430, 480, 520, 560, 599];
  const MOBILE_TAB_COUNT = 5;

  for (const width of MOBILE_TAB_WIDTHS) {
    test(`at ${width}px, every mobile tab stays hit-testable above the sticky note on /#cv (slice-rvat5-01)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/#cv');
      const nav = page.locator('nav[data-variant="mobile"]');
      // code-r7-03: nav.toBeVisible() passes on the pre-hydration SSR
      // markup too (opacity:0 still counts as "visible"), and it stays
      // aria-hidden until usePile reaches phase 'done'. Wait for hydration
      // to actually clear aria-hidden, then require the full tab count,
      // before counting/clicking - otherwise the count can read 0 on a
      // run that starts before React has attached.
      await expect(nav).not.toHaveAttribute('aria-hidden', 'true');
      const tabs = nav.getByRole('button');
      await expect(tabs).toHaveCount(MOBILE_TAB_COUNT);
      const count = await tabs.count();

      // code-r8-01: a plain elementFromPoint always "sees through" the note
      // (pointer-events:none), so it can never detect the note painting over
      // a tab. Toggle the note interactive for the duration of each hit test
      // instead, same as the note-text coverage check below.
      await waitForNoteAnimations(page);
      const noteHandle = await page.locator(STICKY_NOTE_TEXT).first().elementHandle();

      for (let i = 0; i < count; i += 1) {
        const tab = tabs.nth(i);
        const box = await tab.boundingBox();
        expect(box).not.toBeNull();
        if (!box) continue;
        const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const hitsTab = await hitsSelectorPastNote(page, noteHandle, centre, 'nav[data-variant="mobile"] button');
        expect(hitsTab, `tab index ${i} at ${width}px is not hit-testable at its centre`).toBe(true);
      }

      const lastTab = tabs.nth(count - 1);
      const label = (await lastTab.textContent())?.trim();
      await lastTab.click();
      await expect(page).toHaveURL(new RegExp(`#${label}$`));
    });
  }

  const NOTE_TEXT_COVERAGE_WIDTHS = [540, 560, 580, 599];

  for (const width of NOTE_TEXT_COVERAGE_WIDTHS) {
    test(`at ${width}px, the sticky note's first text line is never visually covered by the mobile tab row, and there is no horizontal scroll (code-r7-04 / slice-r7-01)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/#cv');
      const nav = page.locator('nav[data-variant="mobile"]');
      await expect(nav).not.toHaveAttribute('aria-hidden', 'true');
      await expect(nav.getByRole('button')).toHaveCount(MOBILE_TAB_COUNT);

      const canScrollHorizontally = await page.evaluate(() => {
        window.scrollTo(500, 0);
        return window.scrollX > 0;
      });
      expect(canScrollHorizontally, `note position at ${width}px causes horizontal scroll`).toBe(false);

      // code-r8-02: the note is still mid-way through its 0.6s noteIn entry
      // animation right after aria-hidden clears, so measuring immediately
      // samples a transient (higher) position instead of the settled one.
      await waitForNoteAnimations(page);
      const rect = await noteFirstLineRect(page);
      expect(rect, `sticky note text not found at ${width}px`).not.toBeNull();
      if (!rect) return;

      // The old check used elementFromPoint against the note directly,
      // which is always skipped (pointer-events:none) and so could never
      // fail (code-r7-04). Toggle the note interactive for the duration of
      // each sample and require none of them to resolve inside the mobile
      // tab row, sampling across the whole width of the first line, not
      // just its centre.
      const note = page.locator(STICKY_NOTE_TEXT);
      const noteHandle = await note.first().elementHandle();
      const y = rect.top + rect.height / 2;
      const SAMPLE_STEPS = 20;
      for (let i = 0; i <= SAMPLE_STEPS; i += 1) {
        const x = rect.left + (rect.width * i) / SAMPLE_STEPS;
        const hitsNav = await hitsSelectorPastNote(page, noteHandle, { x, y }, 'nav[data-variant="mobile"]');
        expect(
          hitsNav,
          `note's first text line at fraction ${i}/${SAMPLE_STEPS} is covered by the mobile tab row at ${width}px`
        ).toBe(false);
      }
    });
  }

  const GITHUB_LINK_TEST_WIDTHS = [560, 600, 640];

  for (const width of GITHUB_LINK_TEST_WIDTHS) {
    // Unlike the mobile-tab-row / note text-coverage check above, this test
    // is about actual click routing, not visual coverage: the note is
    // pointer-events:none, so document.elementFromPoint (which a real click
    // resolves through the same way) correctly "sees past" it to whatever
    // is underneath, with no toggle needed. code-r7-04 only replaced the
    // dead visual-coverage assertion above; this click-interception check
    // stays as it was and keeps passing.
    test(`at ${width}px, the sticky note does not intercept clicks on the CV's GitHub contact link (behaviour-03)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/#cv');
      const link = page.getByRole('link', { name: 'github.com/AliBars19' });
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;

      // Sample several points along the link, not just its centre, since an
      // overlapping note only needs to steal part of the link's box.
      const fractions = [0.1, 0.3, 0.5, 0.7, 0.9];
      for (const f of fractions) {
        const point = { x: box.x + box.width * f, y: box.y + box.height / 2 };
        const hitsLink = await page.evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el?.closest('a[href="https://github.com/AliBars19"]') != null;
        }, point);
        expect(hitsLink, `point at fraction ${f} along the GitHub link at ${width}px resolves to the sticky note, not the link`).toBe(
          true
        );
      }
    });
  }
});
