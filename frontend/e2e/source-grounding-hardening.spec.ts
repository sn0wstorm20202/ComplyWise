import { test, expect } from '@playwright/test';
import { functionalFixture, fixtureLogin, fixtureBusinessId, fixtureAssessmentId } from './support/functionalFixture';

// Explicit fixtures exercise frontend contracts; they are not regulatory knowledge.
const source = { id: 'synthetic-source', title: 'Illustrative recorded publication', authority: 'Synthetic authority', url: 'https://example.org/publications/guideline.pdf#page=4', canonical_url: 'https://example.org/publications/guideline.pdf', source_type: 'OFFICIAL_DOCUMENT', evidence_status: 'VERIFIED', reviewed: true, retrieved_at: '2026-10-04T04:00:00Z' };
const evidence = [{ source_id: source.id, evidence_id: 'synthetic-evidence', excerpt: 'Illustrative captured excerpt for this browser fixture.', location: 'Page 4' }];

test('primary business form precedes optional starters and starter values remain editable', async ({ page }) => {
  const state = await functionalFixture(page); await fixtureLogin(page); await page.goto('/onboarding?new=true');
  const form = page.locator('main form').first();
  const starters = page.getByRole('region', { name: 'Optional starting profiles' });
  await expect(form).toBeVisible(); await expect(starters).toBeVisible();
  expect(await form.evaluate((node) => Boolean(node.compareDocumentPosition(document.querySelector('[aria-label="Optional starting profiles"]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(page.getByRole('heading', { name: 'Need a head start? Use a starter profile' })).toBeVisible();
  await page.getByRole('button', { name: /Manufacturing Unit Precision Workshop/ }).click();
  await page.getByRole('textbox', { name: 'Business name', exact: true }).fill('Editable supplied business');
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue('Editable supplied business');
  expect(state.requests.filter(item => item.path === '/businesses' && item.method === 'POST')).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/grounding-onboarding-starters-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('textbox', { name: 'Business name', exact: true })).toHaveValue('Editable supplied business');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/grounding-onboarding-starters-mobile.png', fullPage: true });
});

test('explicit resumed assessment overrides stale storage and analysis shows honest wait with one request', async ({ page }) => {
  const state = await functionalFixture(page, { resumed: true }); await fixtureLogin(page);
  const staleId = '33333333-3333-4333-8333-333333333333';
  await page.addInitScript(id => localStorage.setItem('complywise_active_assessment_id', id), staleId);
  let completeAnalysis!: () => void;
  const pending = new Promise<void>(resolve => { completeAnalysis = resolve; });
  let analysisCalls = 0;
  await page.route('**/analysis/orchestrate', async route => {
    analysisCalls += 1;
    expect(route.request().postDataJSON().assessment_id).toBe(fixtureAssessmentId);
    await pending;
    await route.fulfill({ json: { data: { stages: [{ name: 'Workspace preparation', status: 'COMPLETED', detail: 'Recorded fixture result' }], decision_run: { id: 'recorded-decision', results: [] }, executive_summary: {}, discovery: {} } } });
  });
  await page.goto(`/onboarding?business_id=${fixtureBusinessId}&assessment_id=${fixtureAssessmentId}`);
  await expect(page.getByText('Do you store personal client information?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await page.getByRole('button', { name: 'Save & Next Question' }).click();
  await page.locator('input[type="number"]').fill('25');
  await page.getByRole('button', { name: /Analyze Regulatory Compliance/ }).click();
  await expect(page.getByRole('status')).toHaveText('Your compliance analysis may take up to 1–2 minutes. Please keep this page open while we verify sources and build your workspace.');
  await expect(page.getByText('Building your assessment workspace from the saved analysis…')).toBeVisible();
  expect(analysisCalls).toBe(1);
  expect(state.requests.filter(item => item.path.includes(staleId))).toHaveLength(0);
  expect(state.requests.filter(item => item.path.endsWith('/answers'))).toHaveLength(2);
  expect(state.requests.filter(item => item.path.endsWith('/regulatory-discovery'))).toHaveLength(1);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/grounding-analysis-wait.png', fullPage: true });
  completeAnalysis();
  await expect(page.getByRole('heading', { name: /Compliance (?:Profile|Plan) for/ })).toBeVisible();
});

test('completed assessment opens its recorded decision without re-evaluating the mutable business', async ({ page }) => {
  const state = await functionalFixture(page); state.assessment.status = 'COMPLETED'; state.assessment.current_step = 5; state.assessment.decision_run_id = 'recorded-decision';
  let recordedReads = 0;
  await page.route('**/decisions/recorded-decision', async route => { recordedReads += 1; await route.fulfill({ json: { data: { id: 'recorded-decision', results: [] } } }); });
  await fixtureLogin(page); await page.goto(`/onboarding?business_id=${fixtureBusinessId}&assessment_id=${fixtureAssessmentId}`);
  await expect(page.getByRole('heading', { name: /Compliance (?:Profile|Plan) for/ })).toBeVisible();
  await expect.poll(() => recordedReads).toBe(1);
  expect(state.requests.filter(item => item.path.endsWith('/evaluate'))).toHaveLength(0);
});

test('standards expose exact bound source and do not turn contextual quality into mandatory status', async ({ page }) => {
  await functionalFixture(page); await fixtureLogin(page);
  await page.route('**/standards/search**', async route => route.fulfill({ json: { data: { standards: [{ requirement_id: 'source-standard', title: 'Illustrative product safety review', description: 'Synthetic standard scope', authority: 'Synthetic authority', jurisdiction: 'CENTRAL', domain: 'PRODUCT_SAFETY', category: 'STANDARD', status: 'CONTEXTUAL', is_mandatory: true, source, evidence, citations: [], citation_count: 0 }], catalogue_available: false } } }));
  await page.goto('/standards');
  await expect(page.locator('main')).toContainText('no reviewed standard or mandatory status established');
  await expect(page.getByRole('link', { name: 'View source ↗', exact: true })).toHaveAttribute('href', source.url);
  await expect(page.locator('[aria-label="Source provenance"]')).toContainText(source.title);
  await expect(page.locator('[aria-label="Source provenance"]')).toContainText(evidence[0].excerpt);
  await page.screenshot({ path: 'test-results/grounding-standards-source.png', fullPage: true });
  await page.getByRole('link', { name: /View details/ }).click();
  await expect(page).toHaveURL(/\/standards\/source-standard\?/);
  await expect(page.getByRole('heading', { level: 1, name: 'Illustrative product safety review' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View source ↗', exact: true })).toHaveAttribute('href', source.url);
  await expect(page.locator('[aria-label="Source provenance"]')).toContainText(evidence[0].excerpt);
  await page.screenshot({ path: 'test-results/grounding-standard-detail-source.png', fullPage: true });
});

test('scheme candidate and contradictory states retain exact source while generic homepage stays unlinked', async ({ page }) => {
  await functionalFixture(page); await fixtureLogin(page);
  await page.route('**/businesses/*/schemes**', async route => route.fulfill({ json: { data: { available: true, business_name: 'Synthetic current business', schemes: [
    { id: 'candidate', title: 'Illustrative investment programme', benefit_summary: 'Recorded candidate benefit', authority: 'Synthetic authority', eligibility_status: 'CANDIDATE', relevance_rationale: 'State matches; project eligibility still needs review.', source, evidence, action_url: 'https://example.org/application' },
    { id: 'contradiction', title: 'Illustrative export programme', benefit_summary: 'Synthetic candidate', authority: 'Synthetic authority', eligibility_status: 'NOT_ELIGIBLE', relevance_rationale: 'The assessment records no exports.', source: { ...source, id: 'missing-source', url: null, canonical_url: 'https://example.org/' }, evidence: [{ source_id: 'other-source', excerpt: 'Unbound excerpt must not appear.' }], source_url: 'https://example.org/', action_url: '' },
  ], count: 2 } } }));
  await page.goto('/schemes');
  await expect(page.locator('main')).toContainText('Candidate — eligibility not established');
  await expect(page.locator('main')).toContainText('Not eligible within this assessment');
  await expect(page.locator('main')).not.toContainText('applicable schemes');
  await expect(page.locator('main')).not.toContainText('Why Your Business Qualifies');
  await expect(page.getByRole('link', { name: 'View source ↗', exact: true })).toHaveAttribute('href', source.url);
  await expect(page.locator('main')).toContainText('Source link not recorded for this result.');
  await expect(page.locator('main')).not.toContainText('Unbound excerpt must not appear.');
  await expect(page.locator('main').locator('a[href="https://example.org/"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Application information' })).toHaveAttribute('href', 'https://example.org/application');
  await page.screenshot({ path: 'test-results/grounding-scheme-source-states.png', fullPage: true });
});

test('a late schemes response cannot overwrite a newly selected business assessment', async ({ page }) => {
  await functionalFixture(page); await fixtureLogin(page);
  const otherBusiness = '44444444-4444-4444-8444-444444444444';
  const otherAssessment = '55555555-5555-4555-8555-555555555555';
  let releaseOld!: () => void;
  let oldStarted = false;
  const oldPending = new Promise<void>(resolve => { releaseOld = resolve; });
  await page.route('**/businesses/*/schemes**', async route => {
    const url = new URL(route.request().url());
    const old = url.pathname.includes(fixtureBusinessId);
    if (old) { oldStarted = true; await oldPending; }
    else expect(url.searchParams.get('assessment_id')).toBe(otherAssessment);
    await route.fulfill({ json: { data: { available: true, business_name: old ? 'Old business' : 'New business', schemes: [{ id: old ? 'old' : 'new', title: old ? 'Old assessment candidate' : 'New assessment candidate', benefit_summary: 'Synthetic candidate', authority: 'Synthetic authority', eligibility_status: 'CANDIDATE', action_url: '' }], count: 1 } } });
  });
  await page.goto('/schemes'); await expect.poll(() => oldStarted).toBe(true);
  await page.evaluate(({ business, assessment }) => window.history.pushState(null, '', `/schemes?business_id=${business}&assessment_id=${assessment}`), { business: otherBusiness, assessment: otherAssessment });
  await expect(page.getByRole('heading', { name: 'New assessment candidate' })).toBeVisible();
  releaseOld(); await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'New assessment candidate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Old assessment candidate' })).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
