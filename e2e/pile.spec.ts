import { expect, test, type Page } from '@playwright/test';

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
    // Slow the script down so the pre-hydration (CSS-only) frame is
    // actually observable instead of racing past it.
    await page.route('**/*.js', async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.continue();
    });
    await page.goto('/#cv');
    const firstPaintText = await page.getByRole('button', { name: /Lights (off|on)/ }).innerText();
    expect(firstPaintText).toBe('Lights on');
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
});
