import test from 'node:test';
import assert from 'node:assert/strict';
import { selectWorkspaceAssessment } from '../lib/workspaceSelection';
import type { AssessmentSummary } from '../types';

test('validated saved workspace needs no assessment-list request and supersedes stale cache', async () => {
  const workspace = { active_business_id: 'business-one', active_assessment_id: 'saved-historical', redirect_target: 'DASHBOARD', redirect_url: '/dashboard' };
  const selection = await selectWorkspaceAssessment('business-one', workspace, 'stale-draft', async () => {
    throw new Error('Unnecessary serial request');
  });
  assert.equal(selection, 'saved-historical');
});

test('switching businesses validates cached assessment against that business only', async () => {
  const workspace = { active_business_id: 'other-business', active_assessment_id: 'other-assessment', redirect_target: 'DASHBOARD', redirect_url: '/dashboard' };
  const assessments = [{ id: 'correct-assessment' }] as AssessmentSummary[];
  let requests = 0;
  const selection = await selectWorkspaceAssessment('business-one', workspace, 'other-assessment', async businessId => {
    assert.equal(businessId, 'business-one'); requests++; return assessments;
  });
  assert.equal(selection, 'correct-assessment');
  assert.equal(requests, 1);
  assert.equal(await selectWorkspaceAssessment('fresh-business', undefined, null, async () => []), null);
});
