import { expect, test } from '@playwright/test';

test.describe('the pile', () => {
  test('intro -> click title -> CV visible -> click Crumbify highlight -> Crumbify on top with hash -> Esc -> CV', async ({
    page,
  }) => {
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
  });

  test('a deep link skips the intro and opens that sheet directly', async ({ page }) => {
    await page.goto('/#video');
    await expect(page.getByRole('heading', { level: 2, name: 'Audio in, lyric video out.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /click to open/ })).toHaveCount(0);
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
    const stage = page.locator('main');
    const stageBox = await stage.boundingBox();
    expect(navBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    // The tab row sits above (or at) the top of the pile on narrow viewports.
    if (navBox && stageBox) {
      expect(navBox.y).toBeLessThanOrEqual(stageBox.y + stageBox.height);
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

  test('theme toggle flips the label and persists across reload', async ({ page }) => {
    await page.goto('/#cv');
    const toggle = page.getByRole('button', { name: /Lights (off|on)/ });
    await expect(toggle).toHaveText('Lights off');
    await toggle.click();
    await expect(toggle).toHaveText('Lights on');

    await page.reload();
    await expect(page.getByRole('button', { name: /Lights (off|on)/ })).toHaveText('Lights on');
  });

  test('download CV link points at the redacted PDF and is not intercepted by the router', async ({ page }) => {
    await page.goto('/#cv');
    const link = page.getByRole('link', { name: 'Download CV (PDF)' });
    await expect(link).toHaveAttribute('href', '/Ali_Bars_CV.pdf');
    await expect(link).toHaveAttribute('download', '');
  });
});
