import { test, expect, type Page } from '@playwright/test';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  return errors;
}

async function chapter(page: Page, index: number) {
  await page.evaluate(i => {
    const film = document.querySelector<HTMLElement>('.product-film')!;
    window.scrollTo(0, film.getBoundingClientRect().top + scrollY + (film.offsetHeight - innerHeight) * (i + .28) / 18);
  }, index);
  await expect(page.locator('.product-film')).toHaveAttribute('data-phase', String(index));
  await page.waitForTimeout(1500); // Allow the scrub to settle before measuring.
}

test('desktop film retains objects through facts, evaluation, evidence and workspace', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('.product-film')).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(247, 245, 239)');
  await expect(page.locator('h1')).toHaveText(/Behind every\s*business is a\s*rulebook\./);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Playfair Display/);
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'test-results/physical-hero.png' });
  const dossier = await page.locator('[data-world-object="business"]').elementHandle();
  const passage = await page.locator('[data-world-object="clause-rule"]').elementHandle();
  const decision = await page.locator('[data-world-object="decision-task"]').elementHandle();
  await chapter(page, 2);
  await page.getByRole('button', { name: 'LOCATION Maharashtra' }).hover();
  await expect(page.locator('.film-extracted-word').filter({ hasText: 'Maharashtra' })).toHaveAttribute('data-highlighted', 'true');
  const aligned = await page.locator('.film-extracted-word').evaluateAll(words => words.every(word => {
    const text = word.textContent || '';
    const label = text.includes('Maharashtra') ? '0' : text.includes('manufacture') ? '1' : text.includes('private') ? '2' : '3';
    const target = document.querySelector(`[data-fact="${label}"]`)!.getBoundingClientRect();
    const rect = word.getBoundingClientRect();
    return rect.left >= target.left - 2 && rect.right <= target.right + 8 && rect.top >= target.top && rect.bottom <= target.bottom;
  }));
  expect(aligned).toBe(true);
  await page.screenshot({ path: 'test-results/physical-facts.png' });
  await chapter(page, 4);
  const answer = page.locator('.film-answer');
  await answer.click();
  await expect(answer).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Business profile updated', { exact: true })).toBeVisible();
  await chapter(page, 5);
  await expect(page.locator('.film-question')).toBeHidden();
  await chapter(page, 6);
  await expect(page.locator('.document-flap')).toBeHidden();
  await chapter(page, 7);
  expect(await passage!.evaluate(node => node.isConnected)).toBe(true);
  expect(await page.locator('.film-rule-card').evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThan(400);
  await chapter(page, 8);
  for (const check of await page.locator('.condition-check').all()) await expect(check).toHaveCSS('opacity', '1');
  await expect(page.locator('.film-decision-label')).toBeVisible();
  await page.screenshot({ path: 'test-results/physical-decision.png' });
  await chapter(page, 9);
  await page.locator('.film-evidence-sheet').hover();
  await expect(page.locator('.film-evidence-sheet mark').first()).toHaveCSS('background-color', 'rgb(220, 234, 226)');
  await page.screenshot({ path: 'test-results/physical-evidence.png' });
  await chapter(page, 11);
  expect(await decision!.evaluate(node => node.isConnected)).toBe(true);
  await expect(page.getByRole('tab', { name: 'Compliance', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.film-task-details')).toBeVisible();
  const docked = await page.locator('.film-task').evaluate(node => {
    const task = node.getBoundingClientRect(), slot = document.querySelector('.film-task-dock')!.getBoundingClientRect();
    return Math.abs(task.top + task.height / 2 - slot.top - slot.height / 2) < 5;
  });
  expect(docked).toBe(true);
  await page.screenshot({ path: 'test-results/physical-workspace.png' });
  await chapter(page, 12);
  await expect(page.getByRole('tabpanel')).toContainText('Business profile & workshop layout');
  await page.getByRole('tab', { name: 'Documents', exact: true }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Workflows', exact: true })).toHaveAttribute('aria-selected', 'true');
  await chapter(page, 14);
  await expect(page.getByRole('tab', { name: 'Calendar', exact: true })).toHaveAttribute('aria-selected', 'true');
  await chapter(page, 15);
  await page.getByRole('tab', { name: 'Standards', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText(/standards/i);
  await chapter(page, 16);
  await expect(page.getByRole('heading', { name: 'The rules decide. The AI explains.' })).toBeVisible();
  await chapter(page, 0);
  expect(await dossier!.evaluate(node => node.isConnected)).toBe(true);
  await expect(page.locator('.film-dossier')).toHaveCSS('height', '355px');
  expect(await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => href && !document.querySelector(href)))).toEqual([]);
  await expect(page.locator('header').getByRole('link', { name: 'Explore Workspace' })).toHaveAttribute('href', '/dashboard');
  await expect(page.locator('header').getByRole('link', { name: 'Sign In', exact: true })).toHaveAttribute('href', '/auth/signin');
  expect(errors).toEqual([]);
});

test('keyboard chapters and motion changes cleanly replace the pinned scene', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.product-film')).toBeVisible();
  const next = page.getByRole('button', { name: 'NEXT CHAPTER' });
  await next.focus(); await next.press('Enter');
  await expect(page.locator('.product-film')).toHaveAttribute('data-phase', '1');
  await expect(next).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.film-static')).toBeVisible();
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('#story .film-dossier')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('.film-static')).toBeVisible();
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('mobile keeps the story, touch controls and workspace without pinning', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.film-static')).toBeVisible();
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.custom-story-cursor')).toBeHidden();
  await page.screenshot({ path: 'test-results/physical-mobile.png' });
  const menu = page.getByRole('button', { name: 'Toggle navigation menu' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Evidence', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Select example: ₹18 Cr' }).click();
  await expect(page.locator('.film-answer')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#workspace').getByRole('tab', { name: 'Calendar', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Check progress with your team');
  await page.screenshot({ path: 'test-results/physical-mobile-workspace.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('reduced motion keeps evidence, keyboard FAQ and the local business preview', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.story-status-dot')).toHaveCSS('animation-name', 'none');
  const headings = page.locator('.film-static h2');
  expect(await headings.count()).toBeGreaterThanOrEqual(10);
  for (const heading of await headings.all()) await expect(heading).toBeVisible();
  await expect(page.locator('#evidence .film-evidence-sheet')).toBeVisible();
  const question = page.getByRole('button', { name: 'Can I see where a requirement came from?' });
  await question.focus(); await question.press('Enter');
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#faq-answer-2')).toBeVisible();
  const trigger = page.getByRole('button', { name: /See what applies to your business/i });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close modal' })).toBeFocused();
  await page.getByLabel('Full Name').fill('Asha Shah');
  await page.getByLabel('Work email').fill('asha@example.com');
  await page.getByLabel('Business name').fill('Example Manufacturing');
  await page.getByRole('button', { name: 'Preview business details' }).click();
  await expect(page.getByText('Your business details are ready')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});
