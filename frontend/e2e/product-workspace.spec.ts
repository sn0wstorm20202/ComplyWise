import { test, expect, type Page, type Route } from '@playwright/test';

const businessId = '11111111-1111-4111-8111-111111111111';
const business = { id: businessId, name: 'Workspace Test Business', state: 'MH', district: 'Pune', is_active: true, profile_version: 1, assessment_count: 0, created_at: '2026-01-01', updated_at: '2026-01-01' };
const preferences = { email_enabled: true, calendar_enabled: false, in_app_enabled: true, language: 'en' };
const notification = { id: 'notice-1', requirement_id: 'example-requirement', deadline_date: '2026-12-01', offset_days: 7, channel: 'IN_APP', status: 'DELIVERED', event_type: 'UPCOMING', priority: 'HIGH', language: 'en', subject_or_title: 'Review your evidence', recipient: '', is_read: false, read_at: null, attempt_count: 1, failure_reason: '', provider: 'test', created_at: '2026-10-03', details: {} };
const workflow = { id: 'workflow-1', title: 'Prepare business evidence', authority: 'Example authority', category: 'COMPLIANCE', requirement_id: 'example-requirement', current_step: 1, total_steps: 2, progress_percent: 0, status: 'NOT_STARTED', steps: [{ step: 1, step_number: 1, title: 'Gather evidence', description: 'Collect your supporting records.', status: 'NOT_STARTED', documents_required: [] }, { step: 2, step_number: 2, title: 'Review records', description: 'Review the collected evidence.', status: 'NOT_STARTED', documents_required: [] }] };
const caseRecord = { id: 'case-1', case_number: 'CW-TEST-001', business: businessId, business_name: business.name, requirement_id_code: 'example-requirement', requirement_name: 'Example evidence review', authority: 'Example authority', status_code: 'HUMAN_REVIEW', priority: 'MEDIUM', documents_count: 1, documents_verified_count: 0, opened_at: '2026-10-01', updated_at: '2026-10-03', workflow_steps: [], document_requirements: [], form_submissions: [], available_transitions: [], external_statuses: [] };
const submission = { id: 'submission-1', file_name: 'business-evidence.txt', mime_type: 'text/plain', version_number: 1, file_size_bytes: 100, status_code: 'HUMAN_REVIEW', created_at: '2026-10-03' };
const documentRequirement = { id: 'doc-1', name: 'Business evidence', status_code: 'UPLOADED', latest_submission: submission, submissions: [submission] };

type Options = { empty?: boolean; staff?: boolean; platform?: boolean; signedOut?: boolean; respond?: (route: Route, path: string) => Promise<boolean> };
async function workspace(page: Page, options: Options = {}) {
  await page.addInitScript(({id,signedOut}) => { if(!signedOut) localStorage.setItem('complywise_token', 'browser-fixture-token'); localStorage.setItem('complywise_active_business_id', id); }, {id:businessId,signedOut:options.signedOut});
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '').replace(/\/$/, '');
    if (await options.respond?.(route, path)) return;
    const businesses = options.empty ? [] : [business];
    let data: unknown = {};
    if (path === '/auth/me') data = { id: 'user-1', email: 'workspace@example.test', full_name: 'Alex Owner', is_staff: options.staff || false, is_superuser: options.platform || false };
    else if (path === '/user/profile') data = { businesses, recent_assessments: [] };
    else if (path === '/businesses') data = businesses;
    else if (path === '/user/workspace') data = { active_business_id: options.empty ? null : businessId, active_assessment_id: null };
    else if (path === `/businesses/${businessId}`) data = business;
    else if (path.endsWith('/profile')) data = { current_version: { version: 1, variables: { state: { value: 'MH' }, district: { value: 'Pune' }, product_description: { value: 'Business services' } } }, history: [] };
    else if (path === '/profile/variables' || path.endsWith('/assessments')) data = [];
    else if (path.endsWith('/dashboard')) data = { business_id: businessId, business_name: business.name, has_evaluation: false, metrics: {}, priority_actions: [], upcoming_deadlines: [], schemes_preview: [], compliance_readiness: null };
    else if (path.endsWith('/preferences')) data = preferences;
    else if (path.endsWith('/notifications/summary')) data = { total: 1, unread_count: 1, urgent_count: 1, overdue_count: 0, upcoming_count: 1, by_priority: {}, by_channel: {} };
    else if (path.endsWith('/notifications')) data = { count: 1, notifications: [notification] };
    else if (path.endsWith('/compliance')) data = { business_id: businessId, requirements: [], count: 0 };
    else if (path.endsWith('/documents')) data = { business_id: businessId, available: true, upload_available: true, documents: [], total_count: 0, requirements_without_checklist: [] };
    else if (path.endsWith('/workflows')) data = { available: true, business_id: businessId, business_name: business.name, workflows: [workflow] };
    else if (path.endsWith('/calendar')) data = { business_id: businessId, events: [], count: 0, covers: [], not_covered: [], not_covered_reason: '' };
    else if (path === '/standards/search') data = { standards: [], count: 0, catalogue_available: true };
    else if (path.endsWith('/schemes') || path.endsWith('/catalog')) data = { available: true, schemes: [], count: 0, business_name: business.name };
    else if (path === '/admin/cases/summary') data = { total_cases: 1, human_review_cases: 1, action_required_cases: 0, completed_cases: 0 };
    else if (path === '/admin/cases' || path === '/admin/cases/review-queue') data = { cases: [caseRecord], total_count: 1, queue_count: 1 };
    else if (path === '/admin/businesses') data = { businesses, total_count: businesses.length };
    else if (path === `/admin/businesses/${businessId}`) data = { business, profile: { version_number: 1, answered_variables: [] }, profile_history: [], compliance_cases: [], uploaded_documents: [], summary: {} };
    else if (path === '/admin/cases/case-1/packet') data = { case: {...caseRecord, document_requirements: [documentRequirement]}, document_requirements: [documentRequirement], dispositions: [], queries: [], deadlines: [], audit_events: [], business: business };
    else if (path === '/cases/case-1') data = {...caseRecord, document_requirements: [documentRequirement]};
    else if (path.endsWith('/timeline')) data = [];
    else if (path.endsWith('/cases')) data = { cases: [], count: 0, status_summary: {} };
    await route.fulfill({ json: { data, meta: {} } });
  });
}
async function fail(route: Route) { await route.fulfill({ status: 503, json: { error: { code: 'UNAVAILABLE', message: 'Test service temporarily unavailable', details: [] } } }); }

test('workspace navigation supports keyboard, modal focus and mobile drawer', async ({ page }) => {
  await workspace(page);
  await page.goto('/dashboard');
  const trigger = page.getByRole('button', { name: 'Search workspace', exact: true });
  await trigger.focus(); await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Find your workspace' });
  await expect(dialog.getByRole('textbox')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
  await page.keyboard.press('Control+k');
  await dialog.getByRole('textbox').fill('settings');
  await dialog.getByRole('button', { name: /Settings Workspace preferences/ }).click();
  await expect(page).toHaveURL(/settings/); await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open mobile navigation' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Documents', exact: true }).click();
  await expect(page).toHaveURL(/documents/); await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('onboarding saves supplied facts, keeps unknown figures absent, and progresses to products', async ({ page }) => {
  let profile: { variables?: Record<string, unknown> } = {};
  let profileFails = true;
  const assessment = { id: '22222222-2222-4222-8222-222222222222', business_id: businessId, assessment_number: 1, status: 'IN_PROGRESS', current_step: 2, step_state: {} };
  await workspace(page, { respond: async (route,path) => {
    const method = route.request().method();
    if(path === '/businesses' && method === 'POST') { await route.fulfill({json:{data:business}}); return true; }
    if(path.endsWith('/profile') && method === 'POST') { profile = route.request().postDataJSON(); if (profileFails) await fail(route); else await route.fulfill({json:{data:{version:1,variables:profile.variables}}}); return true; }
    if((path.endsWith('/assessments') && method === 'POST') || path.includes('/assessments/'+assessment.id)) { await route.fulfill({json:{data:assessment}}); return true; }
    return false;
  } });
  await page.setViewportSize({width:390,height:844}); await page.goto('/onboarding?new=true');
  await page.getByRole('textbox',{name:'Business name',exact:true}).fill('Workspace Test Business');
  await page.getByRole('combobox',{name:'Legal constitution'}).selectOption('PRIVATE_LIMITED');
  await page.getByRole('combobox',{name:'Operating state'}).selectOption('MAHARASHTRA');
  await page.getByRole('textbox',{name:'District',exact:true}).fill('Pune');
  await page.getByRole('combobox',{name:'Lifecycle stage'}).selectOption('OPERATIONAL');
  await page.getByRole('button',{name:/Continue to Products/}).click();
  await expect(page.locator('main').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Business name',exact:true})).toHaveValue('Workspace Test Business');
  await expect(page.getByRole('heading',{name:'What does your business do?'})).not.toBeVisible();
  profileFails = false; await page.getByRole('button',{name:/Continue to Products/}).click();
  await expect(page.getByRole('heading',{name:'What does your business do?'})).toBeVisible();
  expect(profile.variables).toMatchObject({state:{value:'MAHARASHTRA'},legal_constitution:{value:'PRIVATE_LIMITED'}});
  expect(profile.variables).not.toHaveProperty('annual_turnover'); expect(profile.variables).not.toHaveProperty('total_worker_count');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('settings save real preferences, preserve failed edits, and retry load errors', async ({ page }) => {
  let loadFails = true, saveFails = true, saved: unknown;
  await workspace(page, { respond: async (route, path) => {
    if (!path.endsWith('/preferences')) return false;
    if (route.request().method() === 'GET' && loadFails) { await fail(route); return true; }
    if (route.request().method() !== 'GET') { saved = route.request().postDataJSON(); if (saveFails) await fail(route); else await route.fulfill({ json: { data: saved } }); return true; }
    return false;
  } });
  await page.goto('/settings'); await expect(page.locator('main').getByRole('alert')).toBeVisible();
  loadFails = false; await page.getByRole('button', { name: /Try again/i }).click();
  const email = page.getByRole('checkbox', { name: /Email Receive reminders/ });
  await expect(email).toBeChecked(); const save = page.getByRole('button', { name: 'Save changes' });
  await expect(save).toBeDisabled(); await email.uncheck(); await save.click();
  await expect(page.locator('main').getByRole('alert')).toBeVisible(); await expect(email).not.toBeChecked(); await expect(save).toBeEnabled();
  saveFails = false; await save.click(); await expect(page.getByText('Preferences saved', { exact: true })).toBeVisible();
  expect(saved).toMatchObject({ email_enabled: false }); await expect(save).toBeDisabled();
});

test('failed keyboard mark-read restores the alert and unread count', async ({ page }) => {
  await workspace(page, { respond: async (route, path) => { if (path.endsWith('/notice-1/read')) { await fail(route); return true; } return false; } });
  await page.goto('/notifications');
  const row = page.getByRole('group', { name: /Review your evidence, unread/ });
  await row.focus(); await row.press('Enter');
  await expect(page.locator('main').getByRole('alert')).toBeVisible(); await expect(row).toHaveAttribute('tabindex', '0');
  await expect(page.getByRole('button', { name: 'Unread (1)' })).toBeVisible();
});

test('failed Copilot requests preserve the prompt without fabricating advice', async ({ page }) => {
  await workspace(page, { respond: async (route, path) => { if(path === '/assistant/chat') { await fail(route); return true; } return false; } });
  await page.goto('/assistant');
  const input = page.locator('form input'); await input.fill('Which sources support this decision?'); await input.press('Enter');
  await expect(page.locator('main').getByRole('alert')).toBeVisible(); await expect(input).toHaveValue('Which sources support this decision?');
  await expect(page.getByRole('log')).not.toContainText('Mandatory Conformity Scheme');
});

test('empty accounts and unknown IDs show honest states', async ({ page }) => {
  await workspace(page, { empty: true });
  await page.goto('/business-profile'); await expect(page.getByRole('heading', { name: 'Your business starts here.' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText('VoltPro');
  await page.goto('/documents/unknown'); await expect(page.getByRole('heading', { name: "This document isn't available." })).toBeVisible();
  await page.goto('/standards/unknown'); await expect(page.getByRole('heading', { name: "This standard isn't available." })).toBeVisible();
  await page.goto('/compliance/unknown'); await expect(page.getByRole('heading', { name: "This requirement isn't available." })).toBeVisible();
  await expect(page.locator('main')).not.toContainText('RULE-BIS-DET-01');
  await page.goto('/workflows'); await expect(page.locator('main')).not.toContainText('Loading your');
});

test('workflow step completion is saved before progress advances', async ({ page }) => {
  let payload: unknown;
  await workspace(page, { respond: async (route, path) => { if (path.endsWith('/workflows/step')) { payload = route.request().postDataJSON(); await route.fulfill({ json: { data: { status: 'COMPLETED', progress_percent: 50, current_step: 2 } } }); return true; } return false; } });
  await page.goto('/workflows'); await expect(page.getByText('Gather evidence', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /Mark.*Completed/i }).click();
  await expect(page.getByText(/Step 1 updated to Completed/)).toBeVisible();
  expect(payload).toMatchObject({ workflow_id: 'workflow-1', step_number: 1, status: 'COMPLETED' });
});

test('upload failure keeps the file and never adds a successful document', async ({ page }) => {
  let uploadStarted = false;
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await workspace(page, { respond: async (route, path) => { if(path.endsWith('/documents/upload')) { uploadStarted = true; await pending; await fail(route); return true; } return false; } });
  await page.goto('/documents');
  await page.getByRole('button', { name: 'Upload Statutory Document', exact: true }).click();
  await page.getByRole('textbox', { name: 'Document name', exact: true }).fill('Business evidence test');
  await page.getByRole('textbox', { name: 'Requirement reference' }).fill('example-requirement');
  await page.getByRole('textbox', { name: 'Issuing authority' }).fill('Example authority');
  await page.getByRole('textbox', { name: 'Document reference number' }).fill('REF-TEST-001');
  await page.getByLabel('Valid until', { exact: true }).fill('2027-12-31');
  await page.getByLabel('Document file', { exact: true }).setInputFiles({ name: 'evidence.txt', mimeType: 'text/plain', buffer: Buffer.from('Illustrative test evidence. Reference REF-TEST-001.') });
  await page.getByRole('button', { name: 'Submit & Run Software Verification' }).click();
  await expect.poll(() => uploadStarted).toBe(true);
  await expect(page.getByText(/Uploading and checking your document/)).toBeVisible();
  release(); await expect(page.locator('main').getByRole('alert')).toBeVisible();
  expect(await page.getByLabel('Document file').evaluate(input => (input as HTMLInputElement).files?.[0]?.name)).toBe('evidence.txt');
  await expect(page.getByText(/Uploading and checking your document/)).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Business evidence test' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit & Run Software Verification' })).toBeEnabled();
});

test('document results disclose server checks and keep the persisted record identity', async ({ page }) => {
  const check = {passed:false,status:'WARNING',message:'Illustrative server check: review the record.',issues:[],warnings:[]};
  const verification = {verified:false,overall_status:'WARNING',status:'NEEDS_REVIEW',timestamp:'2026-10-03',irrelevant_document_flag:false,flag_message:'',checks:{file_type:check,field_completeness:check,format_and_expiry:check,ai_relevance:check},recommendations:['Review the supporting record.']};
  await workspace(page,{respond:async(route,path)=>{if(path.endsWith('/documents/upload')){await route.fulfill({json:{data:{document:{id:'server-document-1',name:'Illustrative uploaded record',status:'NEEDS_REVIEW'},verification}}});return true;}return false;}});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/documents'); await page.getByRole('button',{name:'Upload Statutory Document',exact:true}).click();
  await page.getByRole('textbox',{name:'Document name',exact:true}).fill('Illustrative uploaded record');
  await page.getByRole('textbox',{name:'Requirement reference'}).fill('example-requirement');
  await page.getByRole('textbox',{name:'Issuing authority'}).fill('Example authority');
  await page.getByRole('textbox',{name:'Document reference number'}).fill('TEST-001');
  await page.getByLabel('Valid until',{exact:true}).fill('2027-12-31');
  await page.getByLabel('Document file',{exact:true}).setInputFiles({name:'record.txt',mimeType:'text/plain',buffer:Buffer.from('Illustrative browser test record.')});
  await page.getByRole('button',{name:'Submit & Run Software Verification'}).click();
  const dialog = page.getByRole('dialog',{name:'Document verification result'});
  await expect(dialog.getByRole('heading',{name:'Your document check'})).toBeVisible();
  await expect(dialog.getByText('Review the supporting record.',{exact:true})).toBeVisible();
  const detail = dialog.getByRole('button',{name:'Document checks · supporting detail'});
  await expect(detail).toHaveAttribute('aria-expanded','false'); await detail.click();
  await expect(dialog.getByText(check.message).first()).toBeVisible();
  expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await dialog.getByRole('button',{name:'Return to document vault'}).click();
  await expect(page.getByRole('link',{name:'View'}).first()).toHaveAttribute('href','/documents/server-document-1');
});

test('contextual document checklist keeps its assessment and never becomes statutory evidence', async ({page}) => {
  const assessmentId='22222222-2222-4222-8222-222222222222';
  await workspace(page,{respond:async(route,path)=>{
    if(path.endsWith('/documents')){
      await route.fulfill({json:{data:{available:true,upload_available:true,documents:[{id:'planning-document',name:'Illustrative preparation record',category:'PLANNING_CHECKLIST',requirement_id:'planning-fixture',requirement_name:'Illustrative contextual suggestion',status:'NOT_UPLOADED',notes:'Suggested preparation only; confirm filing needs.'}],total_count:1,requirements_without_checklist:[]}}});
      return true;
    }
    return false;
  }});
  await page.goto('/documents?assessment_id='+assessmentId);await page.waitForLoadState('networkidle');
  await expect(page.getByText('Planning basis',{exact:true})).toBeVisible();
  await expect(page.getByText('Contextual preparation guidance',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Illustrative contextual suggestion',exact:true})).toHaveAttribute('href',`/compliance/planning-fixture?business_id=${businessId}&assessment_id=${assessmentId}`);
  await expect(page.locator('main')).not.toContainText('Statutory Basis');
  await page.screenshot({path:'../docs/hardening-screenshots/09-contextual-document-basis-fixture.png',fullPage:true});
});

test('auth modes share the product brand and work with keyboard on small screens', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.setViewportSize({width:320,height:780});await page.goto('/auth/signin');
  await expect(page.getByRole('link',{name:'ComplyWise home'})).toBeVisible();
  const show=page.getByRole('button',{name:'Show password'});await show.focus();await show.press('Enter');
  await expect(page.getByRole('textbox',{name:'Password',exact:true})).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByRole('textbox',{name:'Full name'})).toBeVisible();
  await page.getByRole('button',{name:'Reviewer',exact:true}).click();await expect(page.getByRole('heading',{name:'Compliance review sign-in'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});

test('reviewer login establishes the shared session before opening the business workspace', async ({ page }) => {
  await workspace(page,{staff:true,signedOut:true,respond:async(route,path)=>{if(path==='/auth/admin-login'){await route.fulfill({json:{data:{token:'reviewer-test-token',user:{id:'user-1',email:'reviewer@example.test',full_name:'Alex Reviewer',is_staff:true}}}});return true;}return false;}});
  await page.goto('/admin/login');
  await page.getByRole('textbox',{name:'Staff email address'}).fill('reviewer@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Test-only-password');
  await page.getByRole('button',{name:'Sign in to review workspace'}).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole('link',{name:'Open business workspace'}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading',{name:business.name})).toBeVisible();
});

test('standards search clears previous records and compliance reveals source evidence', async ({ page }) => {
  const evidence = { evidence_id: 'evidence-test', source_title: 'Illustrative source', locator: 'Example clause', excerpt: 'Illustrative source passage for this browser test.', authority: 'Example authority', verification_status: 'UNVERIFIED', canonical_url: 'https://example.org/source' };
  await workspace(page, { respond: async (route, path) => {
    if(path === '/standards/search') { const empty = new URL(route.request().url()).searchParams.get('query') === 'no-match'; await route.fulfill({ json: { data: { standards: empty ? [] : [{ requirement_id: 'standard-test', title: 'Example standard', authority: 'Example authority', jurisdiction: 'CENTRAL', domain: 'Test', description: 'Illustrative test record.', citations: [evidence] }], catalogue_available: true } } }); return true; }
    if(path.endsWith('/compliance')) { await route.fulfill({ json: { data: { business_id: businessId, count: 1, requirements: [{ requirement_id: 'requirement-test', name: 'Example requirement', authority: 'Example authority', status: 'APPLICABLE', category: 'COMPLIANCE', jurisdiction: 'CENTRAL', description: 'Illustrative test requirement.', evidence_count: 1, citations: [evidence] }] } } }); return true; }
    return false;
  } });
  await page.goto('/standards'); await expect(page.getByText('Example standard', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search standards' }).fill('no-match'); await page.locator('form').getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('No reviewed standards matched')).toBeVisible(); await expect(page.getByText('Example standard', { exact: true })).not.toBeVisible();
  await page.goto('/compliance'); const disclosure = page.getByRole('button', { name: 'Why it applies · evidence & next steps' });
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false'); await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true'); await expect(page.getByText(evidence.excerpt)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open workflow', exact: true })).toHaveAttribute('href', /requirement_id=requirement-test/);
});

test('compliance preserves backend decisions and failed loads never become sample assessments', async ({ page }) => {
  let unavailable = false;
  const names = ['Factory license · illustrative test', 'FSSAI central · illustrative test', 'FSSAI state · illustrative test'];
  await workspace(page, { respond: async (route, path) => {
    if (path === `/businesses/${businessId}`) { await route.fulfill({json:{data:{...business,name:'Software test business'}}}); return true; }
    if (path.endsWith('/compliance')) {
      if (unavailable) await fail(route);
      else await route.fulfill({json:{data:{business_id:businessId,count:3,requirements:names.map((name,index)=>({requirement_id:`example-${index}`,name,status:'APPLICABLE',authority:index ? 'FSSAI' : 'Example authority',category:'COMPLIANCE',jurisdiction:'Not provided',description:'Illustrative test response; not regulatory advice.',citations:[],evidence_count:0}))}}});
      return true;
    }
    return false;
  } });
  await page.goto('/compliance');
  for (const name of names) await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
  unavailable = true; await page.reload();
  await expect(page.locator('main').getByRole('alert')).toBeVisible();
  for (const name of names) await expect(page.getByRole('heading',{name,exact:true})).not.toBeVisible();
  await expect(page.locator('main')).not.toContainText('Official Gazette / BIS Schedule');
});

test('requirement detail preserves recorded decisions and discloses rules without guessing a fee or filing procedure', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await workspace(page,{respond:async(route,path)=>{if(path.endsWith('/compliance/example-record')) { await route.fulfill({json:{data:{requirement_id:'example-record',name:'Illustrative recorded requirement',authority:'Example authority',status:'NEEDS_INFORMATION',why_it_applies:{summary:'More business information is needed.',matched_rule_id:'example-rule'},evidence_refs:[{id:'reference-only'}],penalty_notice:'A penalty is not a filing fee.'}}});return true;}return false;}});
  await page.setViewportSize({width:390,height:844});await page.goto('/compliance/example-record');
  await expect(page.getByRole('heading',{name:'Illustrative recorded requirement'})).toBeVisible();
  await expect(page.getByText('More business information is needed.')).toBeVisible();
  await expect(page.getByText('Information Needed',{exact:true})).toBeVisible();
  const disclosure=page.getByRole('button',{name:'Assessment rule · supporting detail'});await expect(disclosure).toHaveAttribute('aria-expanded','false');await disclosure.click();
  await expect(page.getByText('Matched Rule ID: example-rule')).toBeVisible();
  await expect(page.getByText('Source passage not recorded.')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('A penalty is not a filing fee.');
  await expect(page.getByRole('link',{name:'Official Statutory Portal',exact:false})).not.toBeVisible();
  await expect(page.locator('main')).not.toContainText('VERIFIED ·');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});

test('staff case review requires a reason and explicit submission; denied users see no review data', async ({ page }) => {
  let submitted = false;
  await workspace(page, { staff: true, respond: async (route, path) => { if(path === '/admin/cases/case-1/reject') { submitted = true; await route.fulfill({ json: { data: { message: 'Recorded', case: caseRecord } } }); return true; } return false; } });
  await page.goto('/admin/cases/case-1');
  await page.getByRole('button', { name: /Reject/i }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Record reviewer decision' }); await expect(dialog).toBeVisible(); expect(submitted).toBe(false);
  await dialog.getByRole('button', { name: 'Submit REJECT' }).click(); expect(submitted).toBe(false);
  await dialog.locator('textarea').fill('Evidence is incomplete; provide the missing signed record.');
  await dialog.getByRole('button', { name: 'Submit REJECT' }).click(); await expect.poll(() => submitted).toBe(true);
  await page.unrouteAll(); await workspace(page);
  await page.goto('/admin/cases'); await expect(page).toHaveURL(/admin\/login\?error=unauthorized/); await expect(page.getByText('CW-TEST-001')).not.toBeVisible();
});

for (const action of ['APPROVE', 'QUERY'] as const) {
  test(`reviewer ${action.toLowerCase()} preserves submission identity and concurrency`, async ({ page }) => {
    let recorded: Record<string, unknown> | null = null;
    await workspace(page, {staff:true,respond:async(route,path)=>{ if(path === `/admin/cases/case-1/${action.toLowerCase()}`) { recorded = route.request().postDataJSON(); await route.fulfill({json:{data:{message:'Recorded',case:caseRecord}}}); return true; } return false; }});
    await page.goto('/admin/cases/case-1');
    const trigger = page.getByRole('button',{name:action === 'APPROVE' ? 'Approve Document' : 'Raise Clarification Query'}).first();
    await expect(trigger).toBeVisible(); await trigger.click();
    const dialog = page.getByRole('dialog',{name:'Record reviewer decision'});
    await dialog.locator('textarea').first().fill('Reviewed the supporting evidence.');
    await dialog.getByRole('button',{name:`Submit ${action}`}).click();
    await expect.poll(()=>recorded).not.toBeNull(); expect(recorded).toMatchObject({submission_id:'submission-1'});
  });
}

test('admin query navigation reloads the correct queue and detail routes fit mobile', async ({ page }) => {
  const calls: string[] = [], errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await workspace(page,{staff:true,respond:async(_route,path)=>{calls.push(path);return false;}});
  await page.goto('/admin/cases'); await expect(page.getByText('All compliance cases', {exact:true})).toBeVisible();
  await page.getByRole('navigation',{name:'Review navigation',exact:true}).getByRole('link',{name:'Review queue'}).click();
  await expect(page).toHaveURL(/status=HUMAN_REVIEW/); await expect.poll(()=>calls.includes('/admin/cases/review-queue')).toBe(true);
  await page.setViewportSize({width:390,height:844});
  for (const path of ['/admin','/admin/businesses',`/admin/businesses/${businessId}`,'/admin/cases/case-1',`/businesses/${businessId}`,'/cases/case-1','/workflows/case-1']) {
    await page.goto(path); await expect(page.locator('main')).toBeVisible();
    expect(errors,`Runtime errors on ${path}`).toEqual([]);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),{message:path}).toBe(true);
  }
});

test('product routes render across desktop, tablet and mobile with reduced motion', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await workspace(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/dashboard', '/compliance', '/documents', '/workflows', '/calendar', '/notifications', '/standards', '/schemes', '/regulatory-updates', '/assistant', '/business-profile', '/settings', '/applications', '/cases']) {
      await page.goto(path); await expect(page.locator('main')).toBeVisible();
      expect(errors, `Runtime errors on ${path} at ${width}px`).toEqual([]);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), { message: `${path} at ${width}px should fit the viewport` }).toBe(true);
      await expect(page.locator('.cw-product')).toHaveCSS('background-color', 'rgb(247, 245, 239)');
    }
  }
  expect(errors).toEqual([]);
});

// Visual fixtures test presentation only; real integration results are recorded separately.
test('visible starter autofill is editable, does not submit, and own business clears facts', async ({page}) => {
  let writes = 0;
  await workspace(page, {respond:async(route,path)=>{ if(route.request().method()==='POST' && path==='/businesses') writes++; return false; }});
  await page.goto('/onboarding?new=true');
  const starter = page.getByRole('button', {name:/Restaurant.*Neighbourhood Kitchen/});
  await expect(starter).toBeVisible();
  await page.screenshot({path:'../docs/submission-screenshots/02-starter-selection.png',fullPage:true});
  await starter.click();
  await expect(starter).toHaveAttribute('aria-pressed','true');
  const name = page.getByRole('textbox',{name:'Business name',exact:true});
  await expect(name).toHaveValue('Neighbourhood Kitchen');
  await name.fill('Edited Neighbourhood Kitchen'); expect(writes).toBe(0);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'../docs/submission-screenshots/03-autofilled-onboarding.png',fullPage:true});
  await page.getByRole('button',{name:/Start.*own business/i}).click();
  await expect(name).toHaveValue('');
  await expect(page.getByRole('combobox',{name:'Operating state'})).toHaveValue('');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'../docs/submission-screenshots/onboarding-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('platform admin creates editable starting profile without autofilling credentials',async({page})=>{
  let saved: {name?:string;profile?:unknown;new_user?:unknown;owner_email?:string} = {};
  await workspace(page,{staff:true,platform:true,respond:async(route,path)=>{if(path==='/admin/businesses/create'){ saved=route.request().postDataJSON(); await route.fulfill({json:{data:{business}}});return true;}return false;}});
  await page.goto('/admin/businesses');
  await page.getByRole('button',{name:'Create business',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Create business'});
  await dialog.getByRole('button',{name:/Renewable Energy.*Sunpath Energy/}).click();
  await expect(dialog.getByRole('textbox',{name:'Business name',exact:true})).toHaveValue('Sunpath Energy');
  await expect(dialog.getByRole('textbox',{name:'Owner email',exact:true})).toHaveValue('');
  await dialog.getByRole('checkbox',{name:'Create a new user account'}).check();
  await expect(dialog.getByLabel('Initial password')).toHaveValue('');
  await dialog.getByRole('checkbox',{name:'Create a new user account'}).uncheck();
  await dialog.getByRole('textbox',{name:'Business name',exact:true}).fill('Edited Energy Business');
  await dialog.getByRole('textbox',{name:'Owner email',exact:true}).fill('owner@example.test');
  await page.screenshot({path:'../docs/submission-screenshots/admin-business-fields.png',fullPage:true});
  await dialog.evaluate(element=>element.scrollTop=0);
  await page.screenshot({path:'../docs/submission-screenshots/12-admin-business-creation.png',fullPage:true});
  await dialog.getByRole('button',{name:'Save business',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  expect(saved.name).toBe('Edited Energy Business'); expect(saved.new_user).toBeUndefined();
  expect(saved.profile).toMatchObject({variables:{product_description:{value:expect.stringContaining('solar')}}});
});

test('submission workspace screenshot inventory retains warm styling and clear states',async({page})=>{
  await workspace(page,{staff:true,platform:true});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [file,route] of [['06-compliance','compliance'],['07-documents','documents'],['08-workflows','workflows'],['09-schemes','schemes'],['10-standards','standards'],['11-dashboard','dashboard'],['13-admin-review','admin/cases/case-1']] as const){
    await page.goto('/'+route); await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('Loading your');
    await page.screenshot({path:'../docs/submission-screenshots/'+file+'.png',fullPage:true});
  }
  expect(errors).toEqual([]);
});

test('resumed assessment restores questions once and preserves answers on acquisition failure',async({page})=>{
 const id='22222222-2222-4222-8222-222222222222';let questions=0;let discovery=0;
 const assessment={id,business_id:businessId,assessment_number:1,status:'IN_PROGRESS',current_step:3,step_state:{}};
 await workspace(page,{respond:async(route,path)=>{
   if(path.endsWith('/questions')){questions++;await route.fulfill({json:{data:{questions:[{question_id:'test-question',question:'Do you use hazardous materials?',category:'ENVIRONMENT',answer_type:'BOOLEAN',required:true,options:[{value:'YES',label:'Yes'},{value:'NO',label:'No'}],is_answered:false}],total_questions:1,answered_count:0}}});return true;}
   if(path.endsWith('/regulatory-discovery')){discovery++;await new Promise(resolve=>setTimeout(resolve,1200));await fail(route);return true;}
   if(path.endsWith('/compliance-synthesis') || path.endsWith('/analysis/orchestrate')){await fail(route);return true;}
   if(path.endsWith('/answers')){await route.fulfill({json:{data:{saved:true}}});return true;}
   if(path.includes('/assessments/'+id)){await route.fulfill({json:{data:assessment}});return true;}
   return false;
 }});
 await page.goto('/onboarding?business_id='+businessId+'&assessment_id='+id);
 await expect(page.getByText('Do you use hazardous materials?',{exact:true})).toBeVisible();
 await page.screenshot({path:'../docs/submission-screenshots/04-adaptive-questions.png',fullPage:true});
 await page.getByRole('button',{name:'No',exact:true}).click();
 await page.getByRole('button',{name:/Analyze Regulatory Compliance/}).click();
 await expect(page.getByRole('heading',{name:'Building Your Compliance Plan'})).toBeVisible();
 await page.screenshot({path:'../docs/submission-screenshots/05-analysis-loading.png',fullPage:true});
 await expect(page.getByRole('alert').first()).toBeVisible();expect(questions).toBe(1);expect(discovery).toBe(1);
 await expect(page.getByText('Do you use hazardous materials?',{exact:true})).toBeVisible();
});

test('login screenshot contains loaded global styles',async({page})=>{
 await workspace(page,{signedOut:true});await page.goto('/login');
 await expect(page.locator('form').getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
 await page.screenshot({path:'../docs/submission-screenshots/01-login.png',fullPage:true});
});
