import { expect, test, type Page } from '@playwright/test';
import { fixtureAssessmentId, fixtureBusinessId, fixtureLogin, functionalFixture } from './support/functionalFixture';

const nextAssessment = '66666666-6666-4666-8666-666666666666';
const documentId = 'synthetic-shared-checklist';
const uploadVerification = {
  verified: false, status: 'NEEDS_REVIEW', overall_status: 'WARNING', timestamp: '2026-10-05T00:00:00Z',
  irrelevant_document_flag: false, flag_message: '', recommendations: [],
  admin_verification: { status: 'PENDING_REVIEW', message: 'Synthetic upload awaits review' },
  ocr_analysis: { status: 'NOT_CHECKED', file_name: 'synthetic.pdf', detected_headers: [],
    detected_reference_id: '', detected_authority: '', extracted_tokens: [], tokens_count: 0, text_snippet: '' },
  checks: Object.fromEntries(['file_type', 'field_completeness', 'format_and_expiry', 'ai_relevance'].map(id => [id, {
    id, title: 'Synthetic test check', passed: false, status: 'WARNING', message: 'Synthetic fixture', issues: [], warnings: [],
  }])),
};

async function switchAssessment(page: Page, section: 'documents' | 'workflows') {
  await page.evaluate(({ section, business, assessment }) => {
    window.history.pushState(null, '', `/${section}?business_id=${business}&assessment_id=${assessment}`);
  }, { section, business: fixtureBusinessId, assessment: nextAssessment });
}

async function documentFixture(page: Page) {
  await functionalFixture(page); await fixtureLogin(page);
  await page.route('**/businesses/*/documents?**', async route => {
    const current = new URL(route.request().url()).searchParams.get('assessment_id') === nextAssessment;
    await route.fulfill({ json: { data: {
      business_id: fixtureBusinessId, evaluated: true, upload_available: true, documents: [{
        id: documentId, name: current ? 'Current assessment checklist' : 'Previous assessment checklist',
        requirement_id: 'synthetic-requirement', category: 'PLANNING_CHECKLIST', authority: 'Synthetic authority',
        status: 'NOT_UPLOADED', portal_uploaded: current,
      }], total_count: 1, requirements_without_checklist: [],
    } } });
  });
  await page.goto(`/documents?business_id=${fixtureBusinessId}&assessment_id=${fixtureAssessmentId}`);
  await expect(page.getByText('Previous assessment checklist', { exact: true })).toBeVisible();
}

test('persisted filing status and a late failed toggle stay scoped to the selected assessment', async ({ page }) => {
  await documentFixture(page);
  let started = false; let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/documents/portal-status', async route => {
    expect(route.request().postDataJSON().assessment_id).toBe(fixtureAssessmentId);
    started = true; await pending;
    await route.fulfill({ status: 500, json: { error: { code: 'TEST_FAILURE', message: 'Synthetic failed write' } } });
  });
  await page.getByRole('checkbox').check();
  await expect.poll(() => started).toBe(true);
  await switchAssessment(page, 'documents');
  await expect(page.getByText('Current assessment checklist', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox')).toBeChecked();
  release(); await page.waitForLoadState('networkidle');
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.getByText("Your filing status wasn't saved. Please try again.")).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox')).toBeChecked();
});

test('late document upload confirmation cannot open a previous assessment verification modal', async ({ page }) => {
  await documentFixture(page);
  let started = false; let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/documents/upload', async route => {
    expect(route.request().postData()).toContain(fixtureAssessmentId);
    started = true; await pending;
    await route.fulfill({ json: { data: {
      document: { id: documentId, name: 'Previous assessment upload' },
      verification: uploadVerification,
    } } });
  });
  await page.getByRole('button', { name: 'Upload Statutory Document', exact: true }).click();
  await page.getByRole('textbox', { name: 'Document name' }).fill('Synthetic previous document');
  await page.getByRole('textbox', { name: 'Requirement reference' }).fill('synthetic-requirement');
  await page.getByRole('textbox', { name: 'Issuing authority' }).fill('Synthetic authority');
  await page.getByRole('textbox', { name: 'Document reference number' }).fill('synthetic-reference');
  await page.getByLabel('Valid until').fill('2027-01-01');
  await page.getByLabel('Document file').setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF synthetic browser fixture') });
  await page.getByRole('button', { name: 'Submit & Run Software Verification' }).click();
  await expect.poll(() => started).toBe(true);
  await switchAssessment(page, 'documents');
  await expect(page.getByText('Current assessment checklist', { exact: true })).toBeVisible();
  release(); await page.waitForLoadState('networkidle');
  await expect(page.getByRole('dialog', { name: 'Document verification result' })).not.toBeVisible();
  await expect(page.getByText('Previous assessment upload', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Current assessment checklist', { exact: true })).toBeVisible();
});

for (const operation of ['completion', 'notes'] as const) {
  test(`late workflow ${operation} cannot update another assessment with the same workflow identifier`, async ({ page }) => {
    await functionalFixture(page); await fixtureLogin(page);
    await page.route('**/businesses/*/workflows?**', async route => {
      const current = new URL(route.request().url()).searchParams.get('assessment_id') === nextAssessment;
      await route.fulfill({ json: { data: { available: true, business_name: 'Synthetic business', workflows: [{
        id: 'shared-synthetic-workflow', requirement_id: 'synthetic-requirement',
        title: current ? 'Current assessment process' : 'Previous assessment process',
        authority: 'Synthetic authority', category: 'COMPLIANCE', result_origin: 'LLM_FALLBACK_RESULT',
        status: 'NOT_STARTED', current_step: 1, total_steps: 2, progress_percent: 0,
        steps: [{ step: 1, title: 'Gather information', status: 'NOT_STARTED' }, { step: 2, title: 'Review information', status: 'NOT_STARTED' }],
      }] } } });
    });
    let started = false; let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/workflows/step', async route => {
      expect(route.request().postDataJSON().assessment_id).toBe(fixtureAssessmentId);
      started = true; await pending;
      await route.fulfill({ json: { data: { workflow_id: 'shared-synthetic-workflow', status: 'COMPLETED' } } });
    });
    await page.goto(`/workflows?business_id=${fixtureBusinessId}&assessment_id=${fixtureAssessmentId}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Previous assessment process' })).toBeVisible();
    await page.getByPlaceholder('e.g. ARN-2026-98124 or Portal Reg ID').fill('Previous assessment reference');
    await page.getByRole('button', { name: operation === 'completion' ? 'Mark Step as Completed ✓' : 'Save Reference Notes Only' }).click();
    await expect.poll(() => started).toBe(true);
    await switchAssessment(page, 'workflows');
    await expect(page.getByRole('heading', { level: 2, name: 'Current assessment process' })).toBeVisible();
    release(); await page.waitForLoadState('networkidle');
    await expect(page.getByText('Stage 1 of 2', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('e.g. ARN-2026-98124 or Portal Reg ID')).toHaveValue('');
    await expect(page.getByRole('status')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark Step as Completed ✓' })).toBeEnabled();
  });
}
