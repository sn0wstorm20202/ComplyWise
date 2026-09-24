import { test, expect } from '@playwright/test';

test.describe('EasternVolt EV Technologies Regression Test', () => {
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

  test('EasternVolt EV Charger Manufacturer: 15-Question LLM Intake & Requisite Standards Mapping', async ({ page }) => {
    test.setTimeout(240000);

    // 1. Navigate to fresh onboarding
    await page.goto('/onboarding?new=true');

    // 2. Fill Custom Business Profile for EasternVolt
    const nameInput = page.locator('input[placeholder*="Apex Biotech"], input[placeholder*="Enterprise Name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('EasternVolt EV Technologies Pvt. Ltd.');

    // Select Legal Constitution: Private Limited
    const selects = page.locator('select');
    await selects.nth(0).selectOption('PRIVATE_LIMITED');

    // Select State: West Bengal
    await selects.nth(1).selectOption('WEST_BENGAL');

    // Fill District: Howrah
    const districtInput = page.locator('input[placeholder*="Ahmedabad"], input[placeholder*="District"], input[placeholder*="Pune"]').first();
    await districtInput.fill('Howrah');

    // Select Lifecycle Stage: Operational
    await selects.nth(3).selectOption('OPERATIONAL');

    // Fill Employee Count: 85 workers
    const employeeInput = page.locator('input[placeholder*="45"], input[placeholder*="Employees"], input[placeholder*="workers"]').first();
    if (await employeeInput.isVisible()) {
      await employeeInput.fill('85');
    }

    // Submit Step 1
    await page.locator('button:has-text("Continue to Products")').click();

    // 3. Step 2: Products & Activities Description
    await expect(page.locator('h1:has-text("Products & Activities")')).toBeVisible({ timeout: 15000 });
    const descTextarea = page.locator('textarea').first();
    await descTextarea.fill(
      'Design, manufacturing, and assembly of commercial AC and DC fast electric vehicle charging stations (EVSE) and power electronics with 85 workers and 900 kW connected power load in Howrah industrial belt, West Bengal. Exporting 20% of finished commercial EV chargers to Nepal and Bhutan.'
    );

    // Trade Intent: Select Exporter / Import-Export
    const tradeSelect = page.locator('select').first();
    if (await tradeSelect.isVisible()) {
      await tradeSelect.selectOption({ label: 'Export only' });
    }

    // Submit Step 2
    await page.locator('button:has-text("Generate Smart Questions")').click();

    // 4. Verify Operational Briefing / Business Understanding Card
    const proceedToQBtn = page.locator('button:has-text("Begin 15-Question Regulatory Assessment")');
    await expect(proceedToQBtn).toBeVisible({ timeout: 25000 });

    // 5. Proceed to 15-Question Questionnaire
    await proceedToQBtn.click();

    // If preparation card is visible, click Generate 15 Questions if available
    const genBtn = page.locator('button:has-text("Generate 15 Questions")');
    if (await genBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await genBtn.click();
    }

    // 6. Strict Verification: NO AST / Internal Rule Engine Strings Leaked
    await expect(page.locator('h2:has-text("Your 15 Compliance Questions"), h2:has-text("15-Question Statutory Assessment"), p:has-text("15-Question Statutory Assessment")').first()).toBeVisible({ timeout: 45000 });
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('ADAPTIVE RULE ENGINE');
    expect(bodyText).not.toContain('Sequential AST-Driven Discovery');
    expect(bodyText).not.toContain('Statutory Variable Determination');
    expect(bodyText).not.toContain('0 statutory variables resolved');
    expect(bodyText).not.toContain('Kleene AST logic');

    // 7. Verify Exactly 15 Questions Rendered
    const stepPills = page.locator('button[title*="Question"]');
    await expect(stepPills).toHaveCount(15);

    // 8. Step Through and Answer Questions
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
        await textInput.fill('Compliant industrial operations in Howrah');
      }

      await page.waitForTimeout(300);

      // Click Next / Submit button
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

      // Wait for the next question to load — the button becomes disabled during
      // the API call then re-enables when the next question renders.
      // Use a generous timeout to handle slow backend (DB pool pressure).
      await page.waitForTimeout(500);
      await expect(
        page.locator('button:has-text("Save & Next Question"), button:has-text("Analyze Regulatory Compliance")').first()
      ).toBeEnabled({ timeout: 20000 });
    }

    // 9. Wait for Analysis and Initial Results
    await expect(
      page.locator('h1:has-text("Initial Results"), h2:has-text("Compliance Profile"), h2:has-text("Executive Operational Briefing"), h2:has-text("Statutory Applicability Results")').first()
    ).toBeVisible({ timeout: 120000 });

    // 10. Navigate to /compliance to inspect full statutory table and standards
    await page.goto('/compliance');
    await expect(page.locator('h1:has-text("Statutory Requirements")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("View Details"), a:has-text("View Details"), div:has-text("View Details")').first()).toBeVisible({ timeout: 25000 });

    const complianceContent = await page.innerText('body');

    // Strict Negative Assertion: NO Food packaging, NO drinking water, NO fasteners, NO automotive OEM production
    expect(complianceContent).not.toContain('Packaged Drinking Water');
    expect(complianceContent).not.toContain('IS 10500');
    expect(complianceContent).not.toContain('IS 10146');
    expect(complianceContent).not.toContain('IS 9845');
    expect(complianceContent).not.toContain('IS 1367');
    expect(complianceContent).not.toContain('IS 1363');
    expect(complianceContent).not.toContain('IATF 16949');

    // Strict Positive Assertion: EV Charging Standards present (IS 17017)
    expect(complianceContent).toMatch(/IS 17017|EV Charging|Electric Vehicle/i);

    // Authority Assertion: West Bengal Authorities & DGFT
    expect(complianceContent).toMatch(/West Bengal|WBPCB|wbpcb\.gov\.in|Factories|Directorate of Factories/i);
    expect(complianceContent).toMatch(/DGFT|Import Export Code|IEC/i);

    // E-Waste EPR obligation present
    expect(complianceContent).toMatch(/E-Waste|EPR|Extended Producer Responsibility/i);

    // 11. Navigate to /standards to inspect dedicated standards catalog
    await page.goto('/standards');
    await expect(page.locator('body')).toContainText(/IS 17017/i, { timeout: 20000 });
    const standardsContent = await page.innerText('body');
    expect(standardsContent).toMatch(/IS 17017/i);
    expect(standardsContent).not.toContain('Packaged Drinking Water');
    expect(standardsContent).not.toContain('IS 10500');
    expect(standardsContent).not.toContain('IS 10146');
    expect(standardsContent).not.toContain('IS 9845');
    expect(standardsContent).not.toContain('IS 1367');
    expect(standardsContent).not.toContain('IS 1363');
    expect(standardsContent).not.toContain('IATF 16949');
  });
});
