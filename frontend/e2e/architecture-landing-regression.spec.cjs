const { test, expect } = require('@playwright/test');
for (const width of [1440, 390]) {
  test(`existing landing CSS and CTA routes remain intact at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.landing-story')).toHaveCSS('background-color', 'rgb(247, 245, 239)');
    await expect(page.locator('header').first()).toHaveCSS('position', 'fixed');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('header a[href="/dashboard"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
