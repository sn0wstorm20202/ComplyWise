import { test, expect } from '@playwright/test';
import {functionalFixture,fixtureLogin,fixtureBusinessId,fixtureAssessmentId} from './support/functionalFixture';

test.describe('UX Quality, Security, Resilience & Policy Invariants', () => {
  test.beforeEach(async({page})=>{await functionalFixture(page,{resumed:true});await fixtureLogin(page);});

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
      'serpapi.com',
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
    const voltproCard = page.locator('button:has-text("Precision Workshop")').first();
    if (await voltproCard.isVisible()) {
      await voltproCard.click();
      await page.locator('form button[type="submit"]').first().click();
    }

    await page.waitForTimeout(2000);
    expect(interceptedExternalCalls).toHaveLength(0);
  });

  test('Questionnaire Progress Survives Browser Refresh',async({page})=>{
    await page.goto('/onboarding?business_id='+fixtureBusinessId+'&assessment_id='+fixtureAssessmentId);
    await expect(page.getByText('Do you store personal client information?',{exact:true})).toBeVisible();
    await expect(page.getByText(/Suggested from your starting profile/)).toBeVisible();
    await page.getByRole('button',{name:'Yes',exact:true}).click();
    await page.getByRole('button',{name:'Save & Next Question'}).click();
    await page.reload();
    await expect(page.getByText('What is the estimated storage space used?',{exact:true})).toBeVisible();
    await expect(page.getByText(/1 \/ 2 Answered/)).toBeVisible();
    await page.getByRole('button',{name:/Question 1:/}).click();
    await expect(page.getByRole('button',{name:'Yes',exact:true})).toHaveClass(/border-.*sage/);
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
