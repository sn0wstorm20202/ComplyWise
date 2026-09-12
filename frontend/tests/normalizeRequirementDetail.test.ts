import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRequirementDetail } from '../lib/normalizeRequirementDetail.ts';

test('normalizeRequirementDetail handles null/undefined input without crashing', () => {
  const res = normalizeRequirementDetail(null, 'CENTRAL_FSSAI_STATE_LICENSE');
  assert.equal(res.requirement_id, 'CENTRAL_FSSAI_STATE_LICENSE');
  assert.ok(res.why_it_applies);
  assert.equal(typeof res.why_it_applies.summary, 'string');
  assert.ok(res.why_it_applies.summary.length > 0);
  assert.ok(Array.isArray(res.what_you_need.documents));
  assert.ok(Array.isArray(res.what_to_do_next.steps));
  assert.ok(Array.isArray(res.statutory_evidence));
  assert.equal(res.evidence_count, 0);
});

test('normalizeRequirementDetail prevents crash when why_it_applies is undefined (Crash Reproduction Test)', () => {
  // This was the EXACT payload that crashed RequirementDetailContent in production:
  const rawDataFromBackendOrDemo = {
    requirement_id: 'CENTRAL_FSSAI_STATE_LICENSE',
    name: 'FSSAI State Manufacturing License',
    authority: 'Food Safety and Standards Authority of India (FSSAI)',
    applicability_statement: 'Business processes agricultural food ingredients in Maharashtra.',
    status: 'APPLICABLE',
    // why_it_applies is missing
  };
  const res = normalizeRequirementDetail(rawDataFromBackendOrDemo, 'CENTRAL_FSSAI_STATE_LICENSE');
  assert.ok(res.why_it_applies, 'why_it_applies must be defined');
  assert.equal(typeof res.why_it_applies.summary, 'string');
  assert.equal(res.why_it_applies.summary, 'Business processes agricultural food ingredients in Maharashtra.');
  assert.deepEqual(res.why_it_applies.rule_evaluations, []);
});

test('normalizeRequirementDetail parses full backend contract accurately', () => {
  const fullBackend = {
    requirement_id: 'CENTRAL_FACTORIES_ACT',
    name: 'Factory Registration and License',
    authority: 'Directorate of Industrial Safety and Health (DISH)',
    why_it_applies: {
      summary: 'Power load exceeds 10 HP with 20+ workers on site.',
      matched_rule_id: 'RULE_FACT_01',
      matched_rule_type: 'DETERMINISTIC',
      rule_evaluations: [{ rule_id: 'RULE_FACT_01', status: 'MATCHED' }],
      conflicts: [],
    },
    what_you_need: {
      documents: ['Form 1 Notice of Occupation', 'Approved Factory Plans'],
      documents_available: true,
      statutory_fee_estimate: 'INR 15,000',
      validity_period: '5 Years',
      renewal_period_years: 5,
    },
    what_to_do_next: {
      steps: ['Apply on DISH portal', 'Schedule physical inspection'],
      steps_available: true,
      official_portal: 'https://dish.maharashtra.gov.in',
    },
    statutory_evidence: [
      {
        evidence_id: 'SEC_6_FACT_ACT',
        source_title: 'Factories Act 1948 Section 6',
        authority: 'DISH',
        locator: 'Section 6(1)',
        excerpt: 'Registration and licensing of factories.',
        verification_status: 'VERIFIED',
      },
    ],
  };
  const res = normalizeRequirementDetail(fullBackend, 'CENTRAL_FACTORIES_ACT');
  assert.equal(res.why_it_applies.summary, 'Power load exceeds 10 HP with 20+ workers on site.');
  assert.equal(res.why_it_applies.matched_rule_id, 'RULE_FACT_01');
  assert.equal(res.what_you_need.documents.length, 2);
  assert.equal(res.what_to_do_next.steps.length, 2);
  assert.equal(res.statutory_evidence.length, 1);
  assert.equal(res.evidence_count, 1);
});

test('normalizeRequirementDetail gracefully parses legacy format', () => {
  const legacyData = {
    requirement_id: 'LEGACY_REQ_001',
    explanation_trace: {
      rule_id: 'LEGACY_RULE_99',
      reason: 'Legacy rule matched operational criteria',
      ast_logic: 'power_load > 20',
    },
    required_documents: ['Electricity bill', 'GST Certificate'],
    application_steps: ['File paper return with inspector'],
    evidence_refs: [{ id: 'LEGACY_CIT_1', locator: 'Section 4' }],
  };
  const res = normalizeRequirementDetail(legacyData, 'LEGACY_REQ_001');
  assert.equal(res.why_it_applies.summary, 'Legacy rule matched operational criteria');
  assert.equal(res.why_it_applies.matched_rule_id, 'LEGACY_RULE_99');
  assert.deepEqual(res.what_you_need.documents, ['Electricity bill', 'GST Certificate']);
  assert.deepEqual(res.what_to_do_next.steps, ['File paper return with inspector']);
  assert.equal(res.statutory_evidence.length, 1);
});
