import { expect, test } from '@playwright/test';
import { completeFixtureJourney, fixtureLogin, functionalFixture, fixtureRequirement } from './support/functionalFixture';

test('an explicit retry refreshes a failed durable job without calling synchronous stages', async ({ page }) => {
  const fixture = await functionalFixture(page);
  let discoveryAttempts = 0;
  let refreshObserved = false;
  await page.route('**/assessments/*/jobs/', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { data: { background_processing_enabled: true } } });
      return;
    }
    const body = route.request().postDataJSON();
    let result: unknown = {};
    let failed = false;
    if (body.stage === 'BUSINESS_UNDERSTANDING') result = { primary_activity: 'Synthetic service', business_type: 'Services', products: [], operational_characteristics: [], important_unknowns: [] };
    if (body.stage === 'REGULATORY_DISCOVERY') {
      discoveryAttempts++;
      failed = discoveryAttempts === 1;
      if (!failed) refreshObserved = body.force_refresh === true && Boolean(route.request().headers()['idempotency-key']);
      result = { sources: [], queries: [], status: 'PARTIAL', source_count: 0 };
    }
    if (body.stage === 'COMPLIANCE_SYNTHESIS') result = { requirements: [fixtureRequirement], summary: { total_applicable: 0, total_needs_info: 1, total_not_applicable: 0, high_priority_count: 0 } };
    await route.fulfill({ json: { data: { job_id: 'synthetic-durable-job', status: failed ? 'FAILED' : 'SUCCEEDED', result: failed ? null : result, error: failed ? { code: 'STAGE_FAILED', message: 'Synthetic durable operation failed.' } : null } } });
  });
  await fixtureLogin(page);
  const journey = completeFixtureJourney(page);
  await expect(page.getByRole('alert').filter({ hasText: 'Your answers are preserved' })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /Try again/i }).click();
  await journey;
  expect(discoveryAttempts).toBe(2);
  expect(refreshObserved).toBe(true);
  expect(fixture.requests.filter(request => /\/(regulatory-discovery|compliance-synthesis)$/.test(request.path))).toEqual([]);
});
