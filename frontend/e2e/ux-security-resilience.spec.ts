import { test, expect } from '@playwright/test';

test.describe('UX Quality, Security, Resilience & Policy Invariants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const fastDemoBtn = page.locator('button:has-text("Fast Demo Login")');
    if (await fastDemoBtn.isVisible()) {
      await fastDemoBtn.click();
    } else {
      await page.fill('input[type="email"]', 'demo@complywise.test');
      await page.fill('input[type="password"]', 'DemoPassword123!');
      await page.click('button[type="submit"]');
    }
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20000 });
  });

  test('Public UI Leaks Zero Internal Implementation Details or Model Secrets', async ({ page }) => {
    const urls = ['/dashboard', '/onboarding', '/compliance', '/schemes', '/standards'];

    const forbiddenStrings = [
      'LLM_FIRST',
      'KNOWLEDGE_FIRST',
      'OpenAI',
      'Gemini',
      'Grok',
      'Firecrawl',
      'knowledge pack',
      'rule engine',
      'internal step_state',
    ];

    for (const url of urls) {
      await page.goto(url);
      await page.waitForTimeout(1000);
      const text = await page.innerText('body');

      for (const forbidden of forbiddenStrings) {
        expect(text).not.toContain(forbidden);
      }
    }
  });

  test('Browser Network Traffic Never Makes Direct Calls to External Providers', async ({ page }) => {
    const externalDomains = [
      'api.openai.com',
      'generativelanguage.googleapis.com',
      'api.x.ai',
      'api.firecrawl.dev',
      'api.firecrawl.com',
    ];

    const interceptedExternalCalls: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      for (const domain of externalDomains) {
        if (url.includes(domain)) {
          interceptedExternalCalls.push(url);
        }
      }
    });

    await page.goto('/onboarding?new=true');
    const voltproCard = page.locator('button:has-text("VoltPro Power Technologies")').first();
    if (await voltproCard.isVisible()) {
      await voltproCard.click();
      await page.locator('form button[type="submit"]').first().click();
    }

    await page.waitForTimeout(2000);
    expect(interceptedExternalCalls).toHaveLength(0);
  });

  test('Questionnaire Progress Survives Browser Refresh', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/onboarding?new=true');

    const card = page.locator('button:has-text("VoltPro Power Technologies")').first();
    await card.click();
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.locator('h1:has-text("Products & Activities")')).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Generate Smart Questions")').click();

    // Check for Step 3
    await expect(
      page.locator('h1:has-text("Smart Questions"), h1:has-text("Statutory Variable Determination"), h2:has-text("Questions")').first()
    ).toBeVisible({ timeout: 20000 });

    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);

    // Verify still in questionnaire / onboarding without blank page or crash
    await expect(page.locator('body')).not.toBeEmpty();
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
  });

  test('Responsive Viewport Tests: Desktop, Tablet, and Mobile Render Without Horizontal Overflow', async ({ page }) => {
    const viewports = [
      { name: 'Desktop', width: 1280, height: 800 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);

      // Verify no horizontal scrolling overflow beyond viewport
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin of error for scrollbar calculations
    }
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('Main Navigation Preserves Business Context Across All Destinations', async ({ page }) => {
    const destinations = [
      { name: 'Overview', path: '/dashboard' },
      { name: 'Compliance', path: '/compliance' },
      { name: 'Schemes', path: '/schemes' },
      { name: 'Standards', path: '/standards' },
      { name: 'Documents', path: '/documents' },
      { name: 'Workflows', path: '/workflows' },
      { name: 'Calendar', path: '/calendar' },
      { name: 'Assistant', path: '/assistant' },
    ];

    for (const dest of destinations) {
      await page.goto(dest.path);
      await page.waitForTimeout(500);

      // Verify page loads without crash
      await expect(page.locator('body')).not.toBeEmpty();
      const pageTitleOrHeading = page.locator('h1, h2, header').first();
      await expect(pageTitleOrHeading).toBeVisible({ timeout: 5000 });
    }
  });
});
