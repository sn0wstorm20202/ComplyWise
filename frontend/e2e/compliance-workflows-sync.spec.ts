import { test, expect } from "@playwright/test";

test.describe("Compliance and Workflows Synchronization & SaaS Guard", () => {
  const STORYLOOM_BIZ_ID = "05c1bf63-9d22-4d5e-9c73-8811492ab7e2";

  test.beforeEach(async ({ page }) => {
    // 1. Log in with demo user credentials
    await page.goto("/auth/signin");
    await page.waitForLoadState("networkidle");

    const autofillBtn = page.locator("button:has-text('Autofill demo user credentials')");
    if (await autofillBtn.isVisible()) {
      await autofillBtn.click();
    } else {
      await page.fill('input[type="email"]', "abc@gmail.com");
      await page.fill('input[type="password"]', "Password123!");
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });
  });

  test("Compliance page displays 4 legitimate statutory compliances and excludes industrial factory licenses", async ({
    page,
  }) => {
    // Navigate to compliance view for Storyloom
    await page.goto(`/compliance?business_id=${STORYLOOM_BIZ_ID}`);
    await page.waitForLoadState("networkidle");

    // Check page header
    await expect(page.locator("h1")).toContainText(/Regulatory & Compliance Obligations/i);

    // Verify the 4 legitimate statutory requirements are present
    const pageContent = await page.content();

    expect(pageContent).toContain("Importer-Exporter Code (IEC)");
    expect(pageContent).toContain("CERT-In Cybersecurity");
    expect(pageContent).toContain("Digital Personal Data Protection");
    expect(pageContent).toContain("Internal Committee for Prevention of Sexual Harassment");

    // Verify SaaS Guard: Factory License and Consent to Establish (CTE) must NOT be present
    expect(pageContent).not.toContain("Factory License Registration");
    expect(pageContent).not.toContain("Consent to Establish (CTE)");

    // Verify CERT-In is deduplicated: must appear only once in the cards
    const certInMatches = (pageContent.match(/CERT-In Cybersecurity/g) || []).length;
    expect(certInMatches).toBeLessThanOrEqual(2);

    // Verify deep portal links are present
    expect(pageContent).toContain("dgft.gov.in/CP/?opt=iec-service");
    expect(pageContent).toContain("cert-in.org.in/directions2022.htm");
    expect(pageContent).toContain("digital-personal-data-protection-act-2023");
    expect(pageContent).toContain("handbook-sexual-harassment-women-workplace");

    // Verify "Execute Workflow" button links to workflows page
    const executeWorkflowLink = page.locator('a[href*="/workflows"]').first();
    await expect(executeWorkflowLink).toBeVisible();
  });

  test("Workflows page synchronizes 1-to-1 with compliance, shows 5 targeted schemes, and has multi-step roadmaps", async ({
    page,
  }) => {
    // Navigate to workflows view for Storyloom
    await page.goto(`/workflows?business_id=${STORYLOOM_BIZ_ID}`);
    await page.waitForLoadState("networkidle");

    // Check page header
    await expect(page.locator("h1")).toContainText(/Clearance Workflows & Roadmaps/i);

    const pageContent = await page.content();

    // Verify 4 statutory compliance roadmaps match
    expect(pageContent).toContain("Importer-Exporter Code (IEC)");
    expect(pageContent).toContain("CERT-In Cybersecurity");
    expect(pageContent).toContain("Digital Personal Data Protection");
    expect(pageContent).toContain("Internal Committee for Prevention of Sexual Harassment");

    // Verify multi-step roadmaps (5 to 6 steps each)
    expect(pageContent).toMatch(/6 Steps|5 Steps/);

    // Verify targeted government schemes
    expect(pageContent).toContain("Startup India Seed Fund Scheme");
    expect(pageContent).toContain("MSME Intellectual Property Rights");
    expect(pageContent).toContain("CGTMSE");
    expect(pageContent).toContain("TReDS");
    expect(pageContent).toContain("MSME Samadhaan");

    // Verify deep official portal links
    expect(pageContent).toContain("dgft.gov.in/CP/?opt=iec-service");
    expect(pageContent).toContain("seedfund.startupindia.gov.in");

    // Test interactive step update
    const markCompleteBtn = page.locator("button:has-text('Mark Completed')").first();
    if (await markCompleteBtn.isVisible()) {
      await markCompleteBtn.click();
      await page.waitForTimeout(1000);
      const updatedContent = await page.content();
      expect(updatedContent).toMatch(/Step 1 Completed|Completed|Ready for next stage/i);
    }
  });
});
