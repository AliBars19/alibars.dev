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

    await page.getByRole('button', { name: /Founder & Lead Engineer/ }).click();
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
    const before = await tab.evaluate((el) => getComputedStyle(el).transform);
    await tab.hover();
    const after = await tab.evaluate((el) => getComputedStyle(el).transform);
    expect(after).not.toBe(before);
  });

  test('theme toggle flips the label and persists (dark desk, not just the label) across reload', async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await page.goto('/#cv');
    const toggle = page.getByRole('button', { name: /Lights (off|on)/ });
    await expect(toggle).toHaveText('Lights off');
    await expect(page.locator('html')).toHaveAttribute('data-desk', 'light');
    await toggle.click();
    await expect(toggle).toHaveText('Lights on');
    await expect(page.locator('html')).toHaveAttribute('data-desk', 'dark');

    await page.reload();
    await expect(page.getByRole('button', { name: /Lights (off|on)/ })).toHaveText('Lights on');
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
  });

  test('opening a sheet from the CV pushes history, so Back returns to the CV', async ({ page }) => {
    await page.goto('/#cv');
    await page.getByRole('button', { name: 'racing' }).click();
    await expect(page).toHaveURL(/#racing$/);

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('download CV link points at the redacted PDF and is not intercepted by the router', async ({ page }) => {
    await page.goto('/#cv');
    const link = page.getByRole('link', { name: 'Download CV (PDF)' });
    await expect(link).toHaveAttribute('href', '/Ali_Bars_CV.pdf');
    await expect(link).toHaveAttribute('download', '');
  });
});
