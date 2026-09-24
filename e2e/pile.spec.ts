import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const OUT_DIR = join(process.cwd(), 'out');

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

  test('under reduced motion, a sheet swap is a real cross-fade: the incoming sheet passes through a partial opacity instead of a hard cut (behaviour-03 / code-r4-01)', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/#cv');
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    const incoming = page.locator('#sheet-crumbify');

    await page.getByRole('button', { name: 'crumbify' }).click();
    // Sample "about" 50ms after the click, mid-way through the 0.2s
    // reduced-motion opacity transition (out at 0ms, in ~16ms later).
    await page.waitForTimeout(50);
    const opacity = Number(await incoming.evaluate((el) => getComputedStyle(el).opacity));

    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
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

  for (const width of MOBILE_TAB_WIDTHS) {
    test(`at ${width}px, every mobile tab stays hit-testable above the sticky note on /#cv (slice-rvat5-01)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/#cv');
      const nav = page.locator('nav[data-variant="mobile"]');
      await expect(nav).toBeVisible();
      const tabs = nav.getByRole('button');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i += 1) {
        const tab = tabs.nth(i);
        const box = await tab.boundingBox();
        expect(box).not.toBeNull();
        if (!box) continue;
        const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const hitsTab = await page.evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el?.closest('nav[data-variant="mobile"] button') != null;
        }, centre);
        expect(hitsTab, `tab index ${i} at ${width}px is not hit-testable at its centre`).toBe(true);
      }

      // The note must not visually cover any mobile tab label. A raw
      // bounding-box overlap is not itself coverage (the note can sit
      // behind a tab, painted-over, with no visible clash) - what matters
      // is which element actually wins the paint wherever the two boxes
      // overlap. Sample the centre of each box's intersection and require
      // the tab, not the note, to be on top there.
      const note = page.locator('.js-stage >> text=psst: click anything highlighted');
      if (await note.count()) {
        const noteBox = await note.first().boundingBox();
        if (noteBox) {
          for (let i = 0; i < count; i += 1) {
            const box = await tabs.nth(i).boundingBox();
            if (!box) continue;
            const ix1 = Math.max(box.x, noteBox.x);
            const iy1 = Math.max(box.y, noteBox.y);
            const ix2 = Math.min(box.x + box.width, noteBox.x + noteBox.width);
            const iy2 = Math.min(box.y + box.height, noteBox.y + noteBox.height);
            if (ix2 <= ix1 || iy2 <= iy1) continue; // no geometric overlap at all
            const point = { x: (ix1 + ix2) / 2, y: (iy1 + iy2) / 2 };
            const tabWinsHere = await page.evaluate(({ x, y }) => {
              const el = document.elementFromPoint(x, y);
              return el?.closest('nav[data-variant="mobile"] button') != null;
            }, point);
            expect(tabWinsHere, `tab index ${i} at ${width}px is visually covered by the sticky note`).toBe(true);
          }
        }
      }

      const lastTab = tabs.nth(count - 1);
      const label = (await lastTab.textContent())?.trim();
      await lastTab.click();
      await expect(page).toHaveURL(new RegExp(`#${label}$`));
    });
  }
});
