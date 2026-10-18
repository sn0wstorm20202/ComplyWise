import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

test('real browser review publishes a version and queues reassessment while history survives', async ({ page, request }) => {
  test.skip(!process.env.ARCHITECTURE_BROWSER_FIXTURE, 'Requires an isolated real backend and synthetic fixture seed.');
  const fixture = JSON.parse(readFileSync(process.env.ARCHITECTURE_BROWSER_FIXTURE!, 'utf8'));
  const api = process.env.ARCHITECTURE_API_URL || 'http://127.0.0.1:8017/api/v1';
  const headers = { Authorization: `Token ${fixture.token}` };
  await page.addInitScript(token => localStorage.setItem('complywise_token', token), fixture.token);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`/compliance?business_id=${fixture.business_id}&assessment_id=${fixture.assessment_id}`);
  await expect(page.getByRole('note')).toContainText('recorded knowledge catalogue');
  await expect(page.getByText('Synthetic browser obligation', { exact: true }).first()).toBeVisible();
  const before = await request.get(`${api}/businesses/${fixture.business_id}/decisions/${fixture.original_run_id}`, { headers });
  expect(before.ok()).toBeTruthy();
  const original = await before.json();
  await page.goto('/admin/knowledge');
  await page.getByRole('button', { name: 'Review source change' }).click();
  await page.getByLabel('Reason', { exact: true }).fill('Synthetic source change reviewed during browser verification.');
  await page.getByRole('button', { name: 'Save source review', exact: true }).click();
  await expect(page.getByText('Rule update required', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Review passage' }).click();
  await page.getByRole('combobox', { name: 'Decision', exact: true }).selectOption('PUBLISH');
  await page.getByLabel('Catalogue requirement identifier').fill('SYNTHETIC-BROWSER');
  await page.getByLabel('Rule identifier', { exact: true }).fill('SYNTHETIC-BROWSER');
  await page.getByLabel('Reviewed applicability condition').fill(JSON.stringify({ op: 'EQ', left: { var: 'synthetic_fact' }, right: true }));
  await page.getByLabel('Effective from', { exact: true }).fill('2026-01-01');
  await page.getByLabel('Executable review examples').fill(JSON.stringify([
    { kind: 'positive', facts: { synthetic_fact: true }, expected_truth: 'TRUE' },
    { kind: 'negative', facts: { synthetic_fact: false }, expected_truth: 'FALSE' },
    { kind: 'missing', facts: {}, expected_truth: 'UNKNOWN' },
  ]));
  await page.getByLabel('Reason', { exact: true }).fill('Synthetic replacement verified against captured passage and examples.');
  await page.getByRole('button', { name: 'Save review', exact: true }).click();
  await expect(page.getByText('No source reviews waiting.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Review source change' }).click();
  await page.getByRole('button', { name: 'Schedule affected assessments' }).click();
  await expect(page.getByRole('status').filter({ hasText: '1 reassessment operations recorded' })).toBeVisible();
  const duplicate = await request.post(`${api}/admin/knowledge/source-changes/${fixture.change_id}/reassess`, { headers });
  expect(duplicate.status()).toBe(202);
  const jobId = (await duplicate.json()).data.job_ids[0];
  execFileSync(process.env.ARCHITECTURE_PYTHON!, ['manage.py', 'process_assessment_jobs', '--once'], {
    cwd: path.resolve(process.cwd(), '../backend'), env: process.env, timeout: 60000, stdio: 'pipe',
  });
  const status = await request.get(`${api}/assessments/${fixture.assessment_id}/jobs/${jobId}/`, { headers });
  expect((await status.json()).data.status).toBe('SUCCEEDED');
  const archive = await request.get(`${api}/businesses/${fixture.business_id}/decisions/${fixture.original_run_id}`, { headers });
  expect(archive.ok()).toBeTruthy();
  expect((await archive.json()).data).toEqual(original.data);
  expect(errors).toEqual([]);
});
