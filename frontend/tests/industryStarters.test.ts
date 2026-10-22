import test from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRY_STARTERS, ADDITIONAL_PROFILE_REFERENCES } from '../data/industryStarters';
import { BUSINESS_STARTERS } from '../data/businessStarters';

test('six existing industry examples plus two researched profiles remain editable facts', () => {
  const names = INDUSTRY_STARTERS.map(profile => profile.businessName);
  for (const name of ['Meridian Pharma', 'VoltGrid Mobility', 'ApexBuild Infrastructure', 'SilkRoute Exports', 'CloudAxis Data', 'Sahaya Microfinance']) {
    assert.ok(names.some(value => value.startsWith(name)));
  }
  assert.equal(INDUSTRY_STARTERS.length, 8);
  assert.equal(new Set([...INDUSTRY_STARTERS, ...BUSINESS_STARTERS].map(profile => profile.presetKey)).size, 15);
  for (const profile of INDUSTRY_STARTERS) {
    assert.equal(profile.pan, '');
    assert.equal(profile.bisRegistration, '');
    assert.deepEqual(profile.presetAnswers, {});
    assert.ok(profile.productDescription && profile.employeeCount > 0 && profile.focus);
  }
  assert.equal(Object.keys(ADDITIONAL_PROFILE_REFERENCES).length, 2);
});

test('importer, food processor and merchant exporter preserve their distinct operating models', () => {
  const profile = (key: string) => INDUSTRY_STARTERS.find(item => item.presetKey === key)!;
  assert.equal(profile('medibridge-imports').tradeIntent, 'IMPORT_ONLY');
  assert.equal(profile('medibridge-imports').manufacturing, false);
  assert.equal(profile('harvestlink-food').tradeIntent, 'NONE');
  assert.equal(profile('harvestlink-food').manufacturing, true);
  assert.equal(profile('silkroute-exports').tradeIntent, 'EXPORT_ONLY');
  assert.equal(profile('silkroute-exports').manufacturing, false);
});
