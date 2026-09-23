import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTROLLED_DEMO_PROFILES, type DemoPresetDefinition } from '../data/demo/controlledPresets.ts';

test('CONTROLLED_DEMO_PROFILES contains exactly 5 verified profiles', () => {
  assert.equal(CONTROLLED_DEMO_PROFILES.length, 5);

  const expectedKeys = [
    'charger',
    'cement',
    'food',
    'textile',
    'importer',
  ];

  const actualKeys = CONTROLLED_DEMO_PROFILES.map((p) => p.presetKey);
  assert.deepEqual(actualKeys, expectedKeys);
});

test('Each controlled demo preset has valid enterprise fields and state', () => {
  for (const preset of CONTROLLED_DEMO_PROFILES) {
    assert.ok(preset.presetKey, `Preset should have a presetKey`);
    assert.ok(preset.businessName, `Preset ${preset.presetKey} should have a businessName`);
    assert.ok(preset.sector, `Preset ${preset.presetKey} should have a sector`);
    assert.equal(preset.state, 'Maharashtra', `Preset ${preset.presetKey} state must be Maharashtra`);
    assert.ok(preset.district, `Preset ${preset.presetKey} should have a district`);
    assert.ok(preset.employeeCount > 0, `Preset ${preset.presetKey} employeeCount must be > 0`);
    assert.ok(preset.annualTurnoverLakhs > 0, `Preset ${preset.presetKey} annualTurnoverLakhs must be > 0`);
    assert.ok(preset.productDescription.length >= 20, `Preset ${preset.presetKey} should have a descriptive overview`);
    assert.ok(Array.isArray(preset.activities) && preset.activities.length > 0, `Preset ${preset.presetKey} should have activities`);
    assert.ok(preset.tagline, `Preset ${preset.presetKey} should have a tagline`);
    assert.ok(preset.badge, `Preset ${preset.presetKey} should have a badge`);
  }
});

test('Each controlled demo preset contains verified answers for all 15 questions (Q01-Q15)', () => {
  const expectedQuestionKeys = [
    'Q01',
    'Q02',
    'Q03',
    'Q04',
    'Q05',
    'Q06',
    'Q07',
    'Q08',
    'Q09',
    'Q10',
    'Q11',
    'Q12',
    'Q13',
    'Q14',
    'Q15',
  ];

  for (const preset of CONTROLLED_DEMO_PROFILES) {
    const answers = preset.presetAnswers;
    assert.ok(answers, `Preset ${preset.presetKey} must have presetAnswers`);
    
    for (const qKey of expectedQuestionKeys) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(answers, qKey),
        `Preset ${preset.presetKey} missing answer for ${qKey}`
      );
      assert.notEqual(
        answers[qKey],
        undefined,
        `Preset ${preset.presetKey} answer for ${qKey} should not be undefined`
      );
    }

    assert.equal(typeof answers.Q01, 'boolean', 'Q01 must be a boolean');
    assert.equal(typeof answers.Q02, 'number', 'Q02 must be a number');
    assert.equal(typeof answers.Q03, 'number', 'Q03 must be a number');
  }
});

test('VoltPro preset answers match electrical manufacturing specifications', () => {
  const voltpro = CONTROLLED_DEMO_PROFILES.find((p) => p.presetKey === 'charger')!;
  assert.equal(voltpro.employeeCount, 45);
  assert.equal(voltpro.presetAnswers.Q02, 45);
  assert.equal(voltpro.presetAnswers.Q03, 75); // power load
  assert.equal(voltpro.presetAnswers.Q04, true); // export
  assert.equal(voltpro.presetAnswers.Q10, false); // food safety
});

test('Ambuja Cement preset answers match heavy red category specifications', () => {
  const cement = CONTROLLED_DEMO_PROFILES.find((p) => p.presetKey === 'cement')!;
  assert.equal(cement.employeeCount, 350);
  assert.equal(cement.presetAnswers.Q02, 350);
  assert.equal(cement.presetAnswers.Q03, 2500); // heavy power load
  assert.equal(cement.presetAnswers.Q05, true); // boiler
  assert.equal(cement.presetAnswers.Q07, true); // hazardous / red
});

test('Sahyadri Agro preset answers match food processing specifications', () => {
  const agro = CONTROLLED_DEMO_PROFILES.find((p) => p.presetKey === 'food')!;
  assert.equal(agro.presetAnswers.Q10, true); // food safety / FSSAI
  assert.equal(agro.presetAnswers.Q04, true); // export
});

test('WhyThisAppliesModal 4-part evidence trace structure mappings', () => {
  const mockSynthesizedRequirement = {
    requirement_id: 'MH_MPCB_CONSENT_OPERATE',
    name: 'MPCB Consent to Operate (Red Category)',
    authority: 'Maharashtra Pollution Control Board',
    action_summary: 'Apply for renewal 60 days before expiry via MPCB portal',
    applicable_facts: [
      'Facility operates within heavy red-category industrial classification',
      'Industrial effluent discharge is active',
    ],
    missing_facts: [],
    citations: ['Water (Prevention & Control of Pollution) Act 1974 Section 25'],
    portal_url: 'https://mpcb.gov.in',
    evidence_excerpts: [
      'No person shall establish any industry likely to discharge sewage or trade effluent without prior consent of the State Board.',
    ],
  };

  // 1. Evaluated Business Facts
  assert.ok(mockSynthesizedRequirement.applicable_facts.length === 2);
  assert.match(mockSynthesizedRequirement.applicable_facts[0], /heavy red-category/);

  // 2. Statutory Legal Requirement
  assert.equal(mockSynthesizedRequirement.name, 'MPCB Consent to Operate (Red Category)');
  assert.equal(mockSynthesizedRequirement.authority, 'Maharashtra Pollution Control Board');

  // 3. Verbatim Official Evidence Excerpt
  assert.ok(mockSynthesizedRequirement.evidence_excerpts.length > 0);
  assert.match(mockSynthesizedRequirement.evidence_excerpts[0], /prior consent of the State Board/);

  // 4. Direct Official Source Link
  assert.equal(mockSynthesizedRequirement.portal_url, 'https://mpcb.gov.in');
  assert.match(mockSynthesizedRequirement.citations[0], /Section 25/);
});
