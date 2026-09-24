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

    // Check for Operational Briefing Card and proceed to 15 questions
    const proceedToQBtn = page.locator('button:has-text("Begin 15-Question Regulatory Assessment")');
    await expect(proceedToQBtn).toBeVisible({ timeout: 25000 });
    await proceedToQBtn.click();

    // Step 3: Wait for 15-Question Wizard to load
    await expect(
      page.locator('h2:has-text("Your 15 Compliance Questions"), h2:has-text("15-Question Statutory Assessment"), p:has-text("15-Question Statutory Assessment")').first()
    ).toBeVisible({ timeout: 35000 });

    // Step through questions and submit
    for (let i = 0; i < 22; i++) {
      const boolYesBtn = page.locator('button:has-text("Yes —"), button:has-text("Yes")').first();
      const optionBtn = page.locator('div.space-y-2\\.5 button').first();
      const numInput = page.locator('input[type="number"]').first();
      const dateInput = page.locator('input[type="date"]').first();
      const textInput = page.locator('textarea, input[placeholder*="details"]').first();

      if (await boolYesBtn.isVisible()) {
        await boolYesBtn.click();
      } else if (await optionBtn.isVisible()) {
        await optionBtn.click();
      } else if (await numInput.isVisible()) {
        await numInput.fill('10');
      } else if (await dateInput.isVisible()) {
        await dateInput.fill('2026-01-01');
      } else if (await textInput.isVisible()) {
        await textInput.fill('Compliant industrial operations');
      }

      await page.waitForTimeout(300);

      const actionBtn = page.locator('button:has-text("Analyze Regulatory Compliance"), button:has-text("Save & Next Question")').first();
      if (!(await actionBtn.isVisible())) break;
      const isFinal = (await actionBtn.innerText()).includes('Analyze');
      await expect(actionBtn).toBeEnabled({ timeout: 8000 });
      await actionBtn.click();
      if (isFinal) break;

      await page.waitForTimeout(500);
      await expect(
        page.locator('button:has-text("Save & Next Question"), button:has-text("Analyze Regulatory Compliance")').first()
      ).toBeEnabled({ timeout: 20000 });
    }

    // 4. Verify Executive Compliance Summary / Initial Results
    await expect(
      page.locator('h1:has-text("Initial Results"), h2:has-text("Compliance Profile"), h2:has-text("Executive Operational Briefing"), h2:has-text("Statutory Applicability Results")').first()
    ).toBeVisible({ timeout: 120000 });
    await expect(page.locator(':has-text("Intelligence Summary")').first()).toBeVisible({ timeout: 10000 });

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
