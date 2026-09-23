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
      if (await proceedToQBtn.isVisible({ timeout: 5000 })) {
        await proceedToQBtn.click();
      }

      // Verify Step 3 is reached
      await expect(
        page.locator('h1:has-text("Smart Questions"), h1:has-text("Statutory Variable Determination"), h2:has-text("Questions")').first()
      ).toBeVisible({ timeout: 20000 });
    }
  });

  test('Ambuja Cement Regression: No Unrelated Requirements in Rendered UI', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/onboarding?new=true');

    // Select Cement preset
    const cementCard = page.locator('button:has-text("Ambuja Heritage Cement")').first();
    await cementCard.click();

    // Submit Step 1
    await page.locator('form button[type="submit"]').first().click();

    // Wait for Step 2 and submit
    await expect(page.locator('h1:has-text("Products & Activities")')).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Generate Smart Questions")').click();

    // Check for Operational Briefing Card
    const proceedToQBtn = page.locator('button:has-text("Begin 15-Question Regulatory Assessment")');
    if (await proceedToQBtn.isVisible({ timeout: 5000 })) {
      await proceedToQBtn.click();
    }

    // Step 3: Advance to analysis
    const prefillBtn = page.locator('button:has-text("Prefill All 15 Verified Answers")');
    const buildPlanBtn = page.locator('button:has-text("Build My Compliance Plan")');

    if (await prefillBtn.isVisible()) {
      await prefillBtn.click();
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

    // Wait for Initial Results
    await expect(page.locator('h1:has-text("Initial Results"), h2:has-text("Compliance Profile")').first()).toBeVisible({ timeout: 60000 });

    // Navigate to /compliance to inspect full table
    await page.goto('/compliance');
    await page.waitForTimeout(1500);

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
    test.setTimeout(120000);
    await page.goto('/onboarding?new=true');

    // Custom Profile: Industrial Battery Management System Manufacturer in Pune
    const nameInput = page.locator('input[placeholder*="Apex Biotech"], input[placeholder*="Enterprise Name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('AuraVolt Battery Management Systems Pvt Ltd');

    // Select Legal Constitution
    await page.locator('select').nth(0).selectOption('PRIVATE_LIMITED');

    // Select State
    await page.locator('select').nth(1).selectOption('MAHARASHTRA');

    // Fill District
    const districtInput = page.locator('input[placeholder*="Ahmedabad"], input[placeholder*="Pune"]').first();
    await districtInput.fill('Pune MIDC');

    // Select Lifecycle Stage
    await page.locator('select').nth(3).selectOption('OPERATIONAL');

    // Submit Step 1
    await page.locator('button:has-text("Continue to Products")').click();

    // Step 2: Fill custom product description
    await expect(page.locator('h1:has-text("Products & Activities")')).toBeVisible({ timeout: 15000 });
    const descTextarea = page.locator('textarea').first();
    await descTextarea.fill('Design and assembly of industrial lithium-ion battery management systems in Pune MIDC, exporting 25% of electronic BMS controllers to Germany.');

    // Submit Step 2
    await page.locator('button:has-text("Generate Smart Questions")').click();

    // Check for Operational Briefing Card
    const proceedToQBtn = page.locator('button:has-text("Begin 15-Question Regulatory Assessment")');
    try {
      await proceedToQBtn.waitFor({ state: 'visible', timeout: 15000 });
      await proceedToQBtn.click();
    } catch {
      // Auto-transitioned or already at questions
    }

    // Step 3: Advance to analysis
    const prefillBtn = page.locator('button:has-text("Prefill All 15 Verified Answers")');
    try {
      await prefillBtn.waitFor({ state: 'visible', timeout: 10000 });
      await prefillBtn.click();
    } catch {
      // Continue if already prefilled
    }

    const buildPlanBtn = page.locator('button:has-text("Build My Compliance Plan"), button:has-text("Analyze Regulatory Compliance")').first();
    await expect(buildPlanBtn).toBeVisible({ timeout: 25000 });
    await buildPlanBtn.click();

    // Wait for Initial Results
    await expect(page.locator('h1:has-text("Initial Results"), h2:has-text("Compliance Profile")').first()).toBeVisible({ timeout: 60000 });
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Initial Results|Compliance Profile|Summary/ }).first()).toBeVisible();
  });
});
