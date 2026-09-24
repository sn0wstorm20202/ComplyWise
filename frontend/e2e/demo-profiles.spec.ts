import { test, expect } from '@playwright/test';

test.describe('Demo Profiles & Non-Preset Verification', () => {
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
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });
  });

  test('Five Controlled Demo Profiles Load and Present Contextual Questionnaire', async ({ page }) => {
    test.setTimeout(180000);

    const profiles = [
      { key: 'charger', name: 'VoltPro Power Technologies' },
      { key: 'cement', name: 'Ambuja Heritage Cement' },
      { key: 'food', name: 'Sahyadri Agro Fruits' },
      { key: 'textile', name: 'Ichalkaranji Dyeing' },
      { key: 'importer', name: 'NexGen Electronics Import' },
    ];

    for (const prof of profiles) {
      await page.goto('/onboarding?new=true');
      const card = page.locator(`button:has-text("${prof.name}")`).first();
      await expect(card).toBeVisible({ timeout: 10000 });
      await card.click();

      // Submit Step 1
      const step1Submit = page.locator('form button[type="submit"]').first();
      await expect(step1Submit).toBeEnabled();
      await step1Submit.click();

      // Wait for Step 2
      await expect(page.locator('h1:has-text("Products & Activities")')).toBeVisible({ timeout: 15000 });

      // Submit Step 2
      await page.locator('button:has-text("Generate Smart Questions")').click();

      // Check for Operational Briefing Card and proceed if present
      const proceedToQBtn = page.locator('button:has-text("Begin 15-Question Regulatory Assessment")');
      try {
        await proceedToQBtn.waitFor({ state: 'visible', timeout: 20000 });
        await proceedToQBtn.click();
      } catch {}

      // Verify Step 3 is reached
      await expect(
        page.locator('h1:has-text("15-Question Statutory Assessment"), h2:has-text("15-Question Statutory Assessment"), h2:has-text("Preparing Your 15-Question Regulatory Assessment"), h1:has-text("Smart Questions")').first()
      ).toBeVisible({ timeout: 25000 });
    }
  });

  test('Ambuja Cement Regression: No Unrelated Requirements in Rendered UI', async ({ page }) => {
    test.setTimeout(180000);
    await page.goto('/onboarding?new=true');
    await page.waitForTimeout(1000);

    // Select Cement preset
    const cementCard = page.locator('button:has-text("Ambuja Heritage Cement")').first();
    await expect(cementCard).toBeVisible({ timeout: 20000 });
    await cementCard.click();

    // Submit Step 1
    const step1Submit = page.locator('form button[type="submit"]').first();
    await expect(step1Submit).toBeEnabled({ timeout: 10000 });
    await step1Submit.click();

    // Wait for Step 2 and submit
    await expect(page.locator('h1:has-text("Products & Activities")')).toBeVisible({ timeout: 25000 });
    await page.locator('button:has-text("Generate Smart Questions")').click();

    // Wait for Operational Briefing Card and proceed
    const proceedToQBtn = page.locator('button:has-text("Begin 15-Question Regulatory Assessment")');
    await expect(proceedToQBtn).toBeVisible({ timeout: 40000 });
    await proceedToQBtn.click();

    // Step 3: Wait for 15-Question Wizard to load
    await expect(
      page.locator('h2:has-text("Your 15 Compliance Questions"), h2:has-text("15-Question Statutory Assessment"), p:has-text("15-Question Statutory Assessment")').first()
    ).toBeVisible({ timeout: 50000 });

    const prefillBtn = page.locator('button:has-text("Prefill All 15 Verified Answers")');
    if (await prefillBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
      await prefillBtn.click();
      await page.waitForTimeout(1000);
    }

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
        await numInput.fill('100');
      } else if (await dateInput.isVisible()) {
        await dateInput.fill('2026-01-01');
      } else if (await textInput.isVisible()) {
        await textInput.fill('Compliant industrial operations');
      }

      await page.waitForTimeout(200);

      const actionBtn = page.locator('button:has-text("Analyze Regulatory Compliance"), button:has-text("Save & Next Question")').first();
      if (!(await actionBtn.isVisible())) break;
      const isFinal = (await actionBtn.innerText()).includes('Analyze');
      await expect(actionBtn).toBeEnabled({ timeout: 8000 });
      await actionBtn.click();
      if (isFinal) break;

      await page.waitForTimeout(400);
      await expect(
        page.locator('button:has-text("Save & Next Question"), button:has-text("Analyze Regulatory Compliance")').first()
      ).toBeEnabled({ timeout: 20000 });
    }

    // Wait for Initial Results
    await expect(
      page.locator('h1:has-text("Initial Results"), h2:has-text("Compliance Profile"), h2:has-text("Statutory Applicability Results")').first()
    ).toBeVisible({ timeout: 120000 });

    // Navigate to /compliance to inspect full table
    await page.goto('/compliance');
    await expect(page.locator('h1:has-text("Statutory Requirements")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("View Details"), a:has-text("View Details"), div:has-text("View Details")').first()).toBeVisible({ timeout: 25000 });

    const bodyText = await page.innerText('body');

    // Strict assertions: Cement plant in Chandrapur must NOT have dairy, drinking water, restaurant, textile dyeing
    expect(bodyText).not.toContain('Dairy Processing & Milk Safety');
    expect(bodyText).not.toContain('Packaged Drinking Water Standard');
    expect(bodyText).not.toContain('Restaurant & Eating House License');
    expect(bodyText).not.toContain('Textile Wet Processing Effluent Standard');

    // Must contain heavy mineral / industrial air / consent requirements
    expect(bodyText).toMatch(/(Pollution Control|Consent|Air|Water|Factories)/i);
  });

  test('Non-Preset Unseen Business Profile Completes Full Journey', async ({ page }) => {
    test.setTimeout(180000);
    await page.goto('/onboarding?new=true');
    await page.waitForTimeout(1200);

    // Custom Profile: Industrial Battery Management System Manufacturer in Pune
    const nameInput = page.locator('input[placeholder*="Apex Biotech"], input[placeholder*="Enterprise Name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('AuraVolt Battery Management Systems Pvt Ltd');

    // Select Legal Constitution
    await page.locator('select').nth(0).selectOption('PRIVATE_LIMITED');

    // Select State
    await page.locator('select').nth(1).selectOption('MAHARASHTRA');

    // Fill District
    const districtInput = page.locator('input[placeholder*="Ahmedabad"], input[placeholder*="Pune"], input[placeholder*="District"]').first();
    await districtInput.fill('Pune MIDC');

    // Select Industrial Zone
    await page.locator('select').nth(2).selectOption('INSIDE_NOTIFIED_INDUSTRIAL_AREA');

    // Select Lifecycle Stage
    await page.locator('select').nth(3).selectOption('OPERATIONAL');

    // Submit Step 1
    const step1Submit = page.locator('form button[type="submit"], button:has-text("Continue to Products")').first();
    await expect(step1Submit).toBeEnabled({ timeout: 10000 });
    await step1Submit.click();

    // Step 2: Fill custom product description
    await expect(page.locator('h1:has-text("Products & Activities")')).toBeVisible({ timeout: 20000 });
    const descTextarea = page.locator('textarea').first();
    await descTextarea.fill('Design and assembly of industrial lithium-ion battery management systems in Pune MIDC, exporting 25% of electronic BMS controllers to Germany.');

    // Submit Step 2
    await page.locator('button:has-text("Generate Smart Questions")').click();

    // Wait for Operational Briefing Card and proceed
    const proceedToQBtn = page.locator('button:has-text("Begin 15-Question Regulatory Assessment")');
    await expect(proceedToQBtn).toBeVisible({ timeout: 40000 });
    await proceedToQBtn.click();

    // Step 3: Answer 15 questions to advance to analysis
    await expect(
      page.locator('h2:has-text("Your 15 Compliance Questions"), h2:has-text("15-Question Statutory Assessment"), p:has-text("15-Question Statutory Assessment")').first()
    ).toBeVisible({ timeout: 50000 });

    for (let i = 0; i < 22; i++) {
      const boolYesBtn = page.locator('button:has-text("Yes, Applicable"), button:has-text("Yes —")').first();
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
        await textInput.fill('Operational industrial facility in Pune MIDC');
      }

      await page.waitForTimeout(300);
      const actionBtn = page.locator('button:has-text("Analyze Regulatory Compliance"), button:has-text("Save & Next Question")').first();
      if (!(await actionBtn.isVisible())) {
        break;
      }
      const isFinal = (await actionBtn.innerText()).includes('Analyze');
      await expect(actionBtn).toBeEnabled({ timeout: 8000 });
      await actionBtn.click();
      if (isFinal) {
        break;
      }
      await page.waitForTimeout(1000);
    }

    // Wait for Initial Results
    await expect(
      page.locator('h1:has-text("Initial Results"), h2:has-text("Compliance Profile"), h2:has-text("Statutory Applicability Results")').first()
    ).toBeVisible({ timeout: 120000 });
  });
});
