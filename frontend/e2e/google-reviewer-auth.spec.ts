import { test, expect } from "@playwright/test";
import { functionalFixture } from "./support/functionalFixture";

for (const route of ["/auth/signin?mode=officer", "/admin/login"]) {
  test(`demo reviewer autofills editable fields without submitting ${route}`, async ({ page }) => {
    let loginRequests = 0;
    await page.route("**/api/v1/auth/**", async intercepted => {
      const path = new URL(intercepted.request().url()).pathname;
      if (path.endsWith("demo-reviewer-credentials")) {
        await intercepted.fulfill({ json: { data: { email: "reviewer-demo@example.test", password: "synthetic-browser-fixture" }, meta: {} } });
      } else {
        if (path.endsWith("admin-login")) loginRequests++;
        await intercepted.fulfill({ status: 401, json: { error: { code: "AUTHENTICATION_FAILED", message: "Fixture login rejected." } } });
      }
    });
    await page.goto(route);
    const email = page.locator('input[type="email"]');
    const password = page.locator('input[autocomplete="current-password"]');
    await expect(email).toHaveValue("");
    await expect(password).toHaveValue("");
    await page.getByRole("button", { name: "Use Demo Reviewer Credentials" }).click();
    await expect(email).toHaveValue("reviewer-demo@example.test");
    await expect(password).toHaveValue("synthetic-browser-fixture");
    expect(loginRequests).toBe(0);
    await email.fill("edited-reviewer@example.test");
    await expect(email).toHaveValue("edited-reviewer@example.test");
    await page.locator('form button[type="submit"]').click();
    if (route.startsWith("/auth/signin")) {
      await expect(page.getByRole("heading", { name: "Authentication Notice" })).toBeVisible();
      await page.locator("summary").filter({ hasText: "Details" }).click();
    }
    await expect(page.getByText("Fixture login rejected.", { exact: true })).toBeVisible();
    expect(loginRequests).toBe(1);
  });
}

test("disabled demo access leaves manual credentials intact", async ({ page }) => {
  await page.route("**/api/v1/auth/demo-reviewer-credentials", intercepted => intercepted.fulfill({
    status: 403, json: { error: { code: "DEMO_DISABLED", message: "Demo reviewer access is not enabled." } },
  }));
  await page.goto("/auth/signin?mode=officer");
  const email = page.locator('input[type="email"]');
  await email.fill("manual-reviewer@example.test");
  await page.getByRole("button", { name: "Use Demo Reviewer Credentials" }).click();
  await expect(page.getByText("Demo reviewer access is not enabled.", { exact: true })).toBeVisible();
  await expect(email).toHaveValue("manual-reviewer@example.test");
});

test("Google browser handoff exchanges once and opens the authenticated workspace", async ({ page }) => {
  await functionalFixture(page, { resumed: true });
  await page.addInitScript(() => sessionStorage.setItem("complywise_google_verifier", "synthetic-handoff-verifier"));
  let exchanges = 0;
  await page.route("**/api/v1/auth/google/exchange", async intercepted => {
    exchanges++;
    expect(intercepted.request().postDataJSON()).toEqual({ ticket: "synthetic-ticket", verifier: "synthetic-handoff-verifier" });
    await intercepted.fulfill({ json: { data: {
      token: "explicit-browser-fixture-token", is_new_user: false,
      user: { id: "synthetic-user", email: "browser-fixture@example.test", full_name: "Fixture Owner", is_staff: false, is_superuser: false },
    }, meta: {} } });
  });
  await page.goto("/auth/google/callback#ticket=synthetic-ticket");
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(exchanges).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem("complywise_google_verifier"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("complywise_token"))).toBe("explicit-browser-fixture-token");
});
