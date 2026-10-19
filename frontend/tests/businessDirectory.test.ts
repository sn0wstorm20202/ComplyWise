import test from 'node:test';
import assert from 'node:assert/strict';
import { businessesApi } from '../lib/api/businesses';

test('workspace bootstrap does not walk all 432 administrator businesses', async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input) => {
    calls.push(String(input));
    return new Response(JSON.stringify({ data: {
      businesses: [{ id: 'selected', name: 'Synthetic selected business' }],
      total_businesses: 432, matching_businesses: 432, next_business_page: 2,
    }, meta: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  try {
    const page = await businessesApi.getProfileHome('selected');
    assert.equal(calls.length, 1);
    assert.equal(page.next_business_page, 2);
    assert.equal(new URL(calls[0]).searchParams.get('business_id'), 'selected');
    await businessesApi.getProfileHome('selected', 3, 'Sahaya');
    assert.equal(calls.length, 2);
    assert.equal(new URL(calls[1]).searchParams.get('business_page'), '3');
    assert.equal(new URL(calls[1]).searchParams.get('search'), 'Sahaya');
  } finally {
    globalThis.fetch = original;
  }
});
