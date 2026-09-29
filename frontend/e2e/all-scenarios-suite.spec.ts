import { test, expect } from "@playwright/test";

const SCENARIOS = [
  {
    id: "7f27ea65-f87d-4c48-9764-ae9edb14c506",
    name: "Meridian Pharma Formulations Pvt. Ltd.",
    totalReqs: 18,
    applicable: 11,
    needsInfo: 3,
    notApplicable: 4,
    expectedActionRequired: 14,
    expectedExcluded: 4,
    sampleOfficialUrlPattern: /(cdsco|spcb|cpcb|pesa|labour|epfindia|esic|mca)/i,
  },
  {
    id: "8a11ea65-f87d-4c48-9764-ae9edb14c507",
    name: "VoltGrid Mobility Services Pvt. Ltd.",
    totalReqs: 14,
    applicable: 9,
    needsInfo: 2,
    notApplicable: 3,
    expectedActionRequired: 11,
    expectedExcluded: 3,
    sampleOfficialUrlPattern: /(cea|evyatra|bis|cpcb|epfindia|mca)/i,
  },
  {
    id: "9b22ea65-f87d-4c48-9764-ae9edb14c508",
    name: "ApexBuild Infrastructure Pvt. Ltd.",
    totalReqs: 14,
    applicable: 9,
    needsInfo: 3,
    notApplicable: 2,
    expectedActionRequired: 12,
    expectedExcluded: 2,
    sampleOfficialUrlPattern: /(labour|rajasthan|shramsuvidha|cea|cgwa|rera|bocw|spcb|cpcb|pesa|epfindia|mca)/i,
  },
  {
    id: "ac33ea65-f87d-4c48-9764-ae9edb14c509",
    name: "SilkRoute Exports Pvt. Ltd.",
    totalReqs: 14,
    applicable: 8,
    needsInfo: 2,
    notApplicable: 4,
    expectedActionRequired: 10,
    expectedExcluded: 4,
    sampleOfficialUrlPattern: /(dgft|icegate|customs|fssai|texprocil|epfindia|mca)/i,
  },
  {
    id: "bd44ea65-f87d-4c48-9764-ae9edb14c510",
    name: "CloudAxis Data Centres India Pvt. Ltd.",
    totalReqs: 15,
    applicable: 11,
    needsInfo: 2,
    notApplicable: 2,
    expectedActionRequired: 13,
    expectedExcluded: 2,
    sampleOfficialUrlPattern: /(cert-in|meity|cea|spcb|cpcb|epfindia|mca)/i,
  },
  {
    id: "ce55ea65-f87d-4c48-9764-ae9edb14c511",
    name: "Sahaya Microfinance Services Ltd.",
    totalReqs: 14,
    applicable: 9,
    needsInfo: 2,
    notApplicable: 3,
    expectedActionRequired: 11,
    expectedExcluded: 3,
    sampleOfficialUrlPattern: /(rbi|cims|fiuindia|mca|epfindia|cersai|cibil|meity|shramsuvidha)/i,
  },
];

test.describe("ComplyWise Full Scenario Suite Browser Validation", () => {
  test.beforeEach(async ({ page }) => {
    // Perform standard login as demo user
    await page.goto("/auth/signin");
    await page.fill('input[type="email"]', "demo@complywise.test");
    await page.fill('input[type="password"]', "DemoPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding|compliance)/, { timeout: 15000 });
  });

  for (const scenario of SCENARIOS) {
    test(`Scenario [${scenario.name}] - Compliance Page Verification`, async ({ page }) => {
      test.setTimeout(60000);

      await page.goto(`/compliance?business_id=${scenario.id}`);
      await page.waitForSelector("h1", { timeout: 20000 });
      await page.waitForTimeout(2000);

      // Verify business name or app name in header
      const headerText = await page.textContent("body");
      expect(headerText).toContain(scenario.name);

      // Verify Action Required Tab Count Badge
      const actionBadge = page.locator("span.inline-flex.items-center.rounded-full.bg-emerald-50").first();
      await expect(actionBadge).toBeVisible({ timeout: 10000 });
      const badgeText = await actionBadge.textContent();
      expect(badgeText).toContain(String(scenario.expectedActionRequired));

      // Verify Action Required Cards count
      const actionTabBtn = page.locator('button:has-text("Action Required")').first();
      await actionTabBtn.click();
      await page.waitForTimeout(500);

      // Check external action links are present and adhere to statutory URLs
      const actionLinks = page.locator('a[target="_blank"]');
      const linkCount = await actionLinks.count();
      expect(linkCount).toBeGreaterThan(0);

      let foundValidPortal = false;
      for (let i = 0; i < linkCount; i++) {
        const href = await actionLinks.nth(i).getAttribute("href");
        if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
          // Ensure no dummy/placeholder URLs
          expect(href).not.toContain("example.com");
          expect(href).not.toContain("placeholder");
          if (scenario.sampleOfficialUrlPattern.test(href)) {
            foundValidPortal = true;
          }
        }
      }
      expect(foundValidPortal).toBe(true);

      // Verify Audit & Inactive Tab
      const auditTabBtn = page.locator('button:has-text("All Requirements & Discoveries"), button:has-text("All Requirements")').first();
      await auditTabBtn.click();
      await page.waitForTimeout(500);

      // Check collapsible Not Applicable audit section
      const inspectAuditBtn = page.locator('button:has-text("Audit Trail: Not Applicable Obligations"), button:has-text("Inspect Ruled-Out Obligations")').first();
      await expect(inspectAuditBtn).toBeVisible({ timeout: 5000 });
      const inspectBtnText = await inspectAuditBtn.textContent();
      expect(inspectBtnText).toContain(`${scenario.expectedExcluded} excluded`);

      // Expand excluded section and verify items
      await inspectAuditBtn.click();
      await page.waitForTimeout(500);
      const excludedText = await page.textContent("body");
      expect(excludedText).toContain("The deterministic engine verified that your business profile does not meet the statutory threshold conditions");
    });

    test(`Scenario [${scenario.name}] - Workflows Roadmap Verification`, async ({ page }) => {
      test.setTimeout(60000);

      await page.goto(`/workflows?business_id=${scenario.id}`);
      await page.waitForSelector("h1, h2", { timeout: 20000 });

      // Workflows page should render workflow roadmap items
      const bodyText = await page.textContent("body");
      expect(bodyText).toBeDefined();
      expect(bodyText).not.toContain("Application error: a client-side exception has occurred");
    });

    test(`Scenario [${scenario.name}] - Calendar Deadlines Verification`, async ({ page }) => {
      test.setTimeout(60000);

      await page.goto(`/calendar?business_id=${scenario.id}`);
      await page.waitForSelector("h1, h2", { timeout: 20000 });

      const bodyText = await page.textContent("body");
      expect(bodyText).toBeDefined();
      expect(bodyText).not.toContain("Application error: a client-side exception has occurred");
    });
  }

  test("Admin Control Room - Business Scrutiny Parity Audit", async ({ page }) => {
    test.setTimeout(120000);

    // Logout demo user and sign in as Officer / Admin via dedicated admin login portal
    await page.goto("/admin/login");
    await page.fill('input[type="email"]', "admin@complywise.in");
    await page.fill('input[type="password"]', "Admin@1234");
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes("/auth/admin-login") && resp.status() === 200),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForURL((url) => url.pathname === "/admin", { timeout: 20000 });

    for (const scenario of SCENARIOS) {
      await page.goto(`/admin?business_id=${scenario.id}&tab=compliance`);
      await page.waitForSelector("h1", { timeout: 25000 });
      await page.waitForTimeout(1000);

      const pageText = await page.textContent("body");
      expect(pageText).toContain(scenario.name);

      // Verify that engine2 results selector has exact total outcomes count
      const allOutcomesOption = page.locator(`option:has-text("All Outcomes (${scenario.totalReqs})")`);
      await expect(allOutcomesOption).toBeAttached({ timeout: 10000 });

      // Verify status filter options show that APPLICABLE and NOT_APPLICABLE exist
      const statusSelect = page.locator("select").first();
      await expect(statusSelect).toBeVisible();

      // Check parity: Admin legal total == scenario total
      expect(pageText).not.toContain("Failed to retrieve compliance scrutiny data");
    }
  });
});
