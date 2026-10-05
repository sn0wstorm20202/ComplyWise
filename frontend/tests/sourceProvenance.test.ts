import test from 'node:test';
import assert from 'node:assert/strict';
import { exactSourceUrl, schemeClassification, standardClassification } from '../lib/sourceProvenance.ts';

test('source links preserve the exact recorded document and never synthesize a portal', () => {
  const exact = 'https://example.gov.in/publications/guideline.pdf#page=4';
  assert.equal(exactSourceUrl(exact), exact);
  assert.equal(exactSourceUrl('https://example.gov.in/?document_id=123'), 'https://example.gov.in/?document_id=123');
  assert.equal(exactSourceUrl('https://example.gov.in/Login.aspx/path/to/circular'), null);
  assert.equal(exactSourceUrl('https://example.gov.in/search.php?document=123'), null);
  for (const missing of [undefined, null, '', 'https://example.gov.in/', 'https://example.gov.in/home', 'https://example.gov.in/content/global/en/home.html', 'https://example.gov.in/en/index.aspx', 'https://example.gov.in/search?q=standard', 'example.gov.in/document.pdf', 'Source (https://example.gov.in/document.pdf)', 'javascript:alert(1)', 'https://user:password@example.gov.in/document.pdf']) {
    assert.equal(exactSourceUrl(missing), null);
  }
});

test('standard classification requires reviewed applicability and preserves contextual status', () => {
  assert.match(standardClassification('CONTEXTUAL', true), /no reviewed standard or mandatory status established/);
  assert.match(standardClassification(undefined, true), /not established/);
  assert.match(standardClassification('CANDIDATE', true), /need review/);
  assert.match(standardClassification('REVIEWED_APPLICABLE', false), /voluntary/);
  assert.match(standardClassification('REVIEWED_APPLICABLE', true), /Mandatory within the recorded rule scope/);
});

test('scheme classification separates candidates, contradictions and contextual guidance from eligibility', () => {
  assert.match(schemeClassification('CANDIDATE'), /eligibility not established/);
  assert.match(schemeClassification('NOT_ELIGIBLE'), /Not eligible/);
  assert.match(schemeClassification('EXPIRED_OR_NOT_CURRENT'), /Expired/);
  assert.equal(schemeClassification('EVIDENCE_SUPPORTED', 'LLM_FALLBACK_RESULT'), 'Contextual support area');
  assert.equal(schemeClassification('EVIDENCE_SUPPORTED'), 'Evidence-supported eligibility');
  assert.equal(schemeClassification('APPLICABLE'), 'Eligibility not established');
});
