import { expect, test } from '@playwright/test';

test.describe('visual verification screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
  });

  test('01 title page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /click to open/ })).toBeVisible();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/screenshots/01-title-page.png' });
  });

  test('02 cv top', async ({ page }) => {
    await page.goto('/#cv');
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'docs/screenshots/02-cv-top.png', fullPage: true });
  });

  test('03 crumbify', async ({ page }) => {
    await page.goto('/#crumbify');
    await expect(page.getByRole('heading', { level: 2, name: 'Crumbify' })).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/03-crumbify.png', fullPage: true });
  });

  test('04 racing', async ({ page }) => {
    await page.goto('/#racing');
    await expect(page.getByRole('heading', { level: 2, name: 'City Racing' })).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/04-racing.png', fullPage: true });
  });

  test('05 video', async ({ page }) => {
    await page.goto('/#video');
    await expect(page.getByRole('heading', { level: 2, name: 'Audio in, lyric video out.' })).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/05-video.png', fullPage: true });
  });

  test('06 about', async ({ page }) => {
    await page.goto('/#about');
    await expect(page.getByText('Off the page')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/06-about.png', fullPage: true });
  });

  test('07 dark desk', async ({ page }) => {
    await page.goto('/#cv');
    await page.getByRole('button', { name: /Lights off/ }).click();
    await expect(page.getByRole('button', { name: /Lights on/ })).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/07-dark-desk.png', fullPage: true });
  });

  test('08 mobile cv 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#cv');
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeVisible();
    // Let the sticky note's 0.6s fade-in (@keyframes noteIn) finish before
    // capturing, otherwise the screenshot catches it mid-fade.
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'docs/screenshots/08-mobile-cv-390.png', fullPage: true });
  });
});
