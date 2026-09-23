import { test, expect } from '@playwright/test';

test.describe('Primary End-to-End User Journey', () => {
  test('Complete flow: Auth -> Onboarding -> Questions -> Live Results -> 4-Part Trace Modal -> Operational Surfaces', async ({ page }) => {
    test.setTimeout(120000);

    // 1. Authentication / Sign-in
    await page.goto('/auth/signin');
    await expect(page).toHaveTitle(/ComplyWise/i);

    const fastDemoBtn = page.locator('button:has-text("Fast Demo Login")');
    if (await fastDemoBtn.isVisible()) {
      await fastDemoBtn.click();
    } else {
      await page.fill('input[type="email"]', 'demo@complywise.test');
      await page.fill('input[type="password"]', 'DemoPassword123!');
      await page.click('button[type="submit"]');
    }

    // Wait for navigation after login
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

    // 2. Navigate to Onboarding with fresh state
    await page.goto('/onboarding?new=true');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // 3. Select VoltPro Power Technologies Preset
    const voltproCard = page.locator('button:has-text("VoltPro Power Technologies")').first();
    await expect(voltproCard).toBeVisible({ timeout: 10000 });
    await voltproCard.click();

    // Verify fields populated
    const bizNameInput = page.locator('input[placeholder*="Enterprise Name"], input[value*="VoltPro"]').first();
    await expect(bizNameInput).toHaveValue(/VoltPro Power Technologies/i);

    // Submit Step 1
    const step1Submit = page.locator('form button[type="submit"]').first();
    await expect(step1Submit).toBeEnabled();
    await step1Submit.click();

    // Wait for Step 2 to mount
    await expect(page.locator('h1:has-text("Products & Activities")')).toBeVisible({ timeout: 15000 });

    // Submit Step 2 Products form
    await page.locator('button:has-text("Generate Smart Questions")').click();

    // Check for Operational Briefing Card and proceed if present
    const proceedToQBtn = page.locator('button:has-text("Begin 15-Question Regulatory Assessment")');
    if (await proceedToQBtn.isVisible({ timeout: 10000 })) {
      await proceedToQBtn.click();
    }

    // Step 3: Questions Wizard or Sequential AST Resolver
    const prefillBtn = page.locator('button:has-text("Prefill All 15 Verified Answers")');
    const buildPlanBtn = page.locator('button:has-text("Build My Compliance Plan")');

    if (await prefillBtn.isVisible()) {
      await prefillBtn.click();
      const pills = page.locator('div.grid-cols-15 button');
      if ((await pills.count()) > 0) {
        await pills.last().click();
      }
      const analyzeBtn = page.locator('button:has-text("Analyze Regulatory Compliance")');
      if (await analyzeBtn.isVisible()) {
        await analyzeBtn.click();
      }
    } else if (await buildPlanBtn.isVisible()) {
      await buildPlanBtn.click();
    } else {
      await expect(buildPlanBtn).toBeVisible({ timeout: 15000 });
      await buildPlanBtn.click();
    }

    // 4. Verify Executive Compliance Summary / Initial Results
    await expect(page.locator('h1:has-text("Initial Results"), h2:has-text("Compliance Profile")').first()).toBeVisible({ timeout: 60000 });
    await expect(page.locator('text=Intelligence Summary')).toBeVisible();

    // 5. Open "Why does this apply?" 4-Part Evidence Trace Modal (on Compliance page)
    await page.goto('/compliance');
    await expect(page.locator('body')).not.toBeEmpty();

    const whyApplyBtn = page.locator('button:has-text("Why does this apply?"), button:has-text("Statutory Trace"), button:has-text("Why It Applies")').first();
    if (await whyApplyBtn.isVisible({ timeout: 15000 })) {
      await whyApplyBtn.click();

      // Verify trace modal elements
      const modal = page.locator('div[role="dialog"], div.fixed').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      await expect(modal.locator('text=Evaluated Business Facts')).toBeVisible();
      await expect(modal.locator('text=Deterministic Scope & Applicability Authority')).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"], button:has-text("✕")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // 6. Operational Surfaces Navigation Verification
    const surfaces = [
      '/dashboard',
      '/schemes',
      '/standards',
      '/documents',
      '/workflows',
      '/calendar',
      '/assistant',
    ];

    for (const surface of surfaces) {
      await page.goto(surface);
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
      const heading = page.locator('h1, h2, header').first();
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });
});
