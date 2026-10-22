import test from 'node:test';
import assert from 'node:assert/strict';
import { runAssessmentJob } from '../lib/api/assessmentJobs';
import { orchestrationApi } from '../lib/api/orchestration';

type Call = { url: string; method: string };
async function transport(handler: (call: Call) => Response | Promise<Response>, check: (calls: Call[]) => Promise<void>) {
  const original = globalThis.fetch;
  const calls: Call[] = [];
  globalThis.fetch = async (url, options) => {
    const call = { url: String(url), method: options?.method || 'GET' };
    calls.push(call);
    return handler(call);
  };
  try { await check(calls); } finally { globalThis.fetch = original; }
}
const data = (value: unknown) => Response.json({ data: value });
const unavailable = () => Response.json({ error: { code: 'ASYNC_DISABLED', message: 'Disabled' } }, { status: 503 });

test('disabled background processing uses synchronous execution without any job POST', async () => {
  await transport(() => data({ background_processing_enabled: false }), async calls => {
    let executions = 0;
    assert.equal(await runAssessmentJob('synthetic', 'REGULATORY_DISCOVERY', async () => { executions++; return 'saved'; }), 'saved');
    assert.equal(executions, 1);
    assert.deepEqual(calls.map(call => call.method), ['GET']);
  });
});
test('enabled processing returns durable job results without synchronous execution', async () => {
  await transport(call => call.method === 'GET' ? data({ background_processing_enabled: true }) :
    data({ job_id: 'synthetic-job', status: 'SUCCEEDED', result: 'saved' }), async calls => {
    assert.equal(await runAssessmentJob('synthetic', 'COMPLIANCE_SYNTHESIS', async () => { throw new Error('Duplicate execution'); }), 'saved');
    assert.deepEqual(calls.map(call => call.method), ['GET', 'POST']);
  });
});

test('an unavailable supervised worker never starts synchronous work or submits a job', async () => {
  await transport(() => data({ background_processing_enabled: true, worker_ready: false }), async calls => {
    let executions = 0;
    await assert.rejects(runAssessmentJob('synthetic', 'REGULATORY_DISCOVERY', async () => { executions++; }), /temporarily unavailable/);
    assert.equal(executions, 0);
    assert.deepEqual(calls.map(call => call.method), ['GET']);
  });
});

test('question generation submits the supported queued stage and preserves its result', async () => {
  await transport(call => call.method === 'GET' ? data({ background_processing_enabled: true, worker_ready: true }) :
    data({ job_id: 'synthetic-questions', status: 'SUCCEEDED', result: { questions: [], total_questions: 0 } }), async calls => {
    const result = await orchestrationApi.generateQuestions('synthetic');
    assert.deepEqual(result, { questions: [], total_questions: 0 });
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => !String(call.url).includes('/questions/generate/')));
  });
});
for (const failureStage of ['capability', 'submission']) {
  test(`${failureStage} network failure does not start synchronous work`, async () => {
    await transport(call => {
      if (failureStage === 'submission' && call.method === 'GET') return data({ background_processing_enabled: true });
      throw new TypeError('Synthetic network failure');
    }, async () => {
      let executions = 0;
      await assert.rejects(runAssessmentJob('synthetic', 'REGULATORY_DISCOVERY', async () => { executions++; return 'duplicate'; }), /Synthetic network failure/);
      assert.equal(executions, 0);
    });
  });
}
test('an explicit disabled response during a configuration change falls back once', async () => {
  await transport(call => call.method === 'GET' ? data({ background_processing_enabled: true }) : unavailable(), async () => {
    let executions = 0;
    await runAssessmentJob('synthetic', 'REGULATORY_DISCOVERY', async () => { executions++; });
    assert.equal(executions, 1);
  });
});
test('older APIs remain compatible through their explicit disabled response', async () => {
  await transport(call => call.method === 'GET' ? Response.json({ error: { code: 'METHOD_NOT_ALLOWED' } }, { status: 405 }) : unavailable(), async calls => {
    assert.equal(await runAssessmentJob('synthetic', 'BUSINESS_UNDERSTANDING', async () => 'saved'), 'saved');
    assert.deepEqual(calls.map(call => call.method), ['GET', 'POST']);
  });
});
test('malformed capability responses and failed jobs do not invoke a second execution', async () => {
  for (const malformed of [true, false]) {
    await transport(call => call.method === 'GET' ? data(malformed ? {} : { background_processing_enabled: true }) :
      data({ status: 'FAILED', error: { code: 'STAGE_FAILED', message: 'Synthetic stage failure' } }), async () => {
      let executions = 0;
      await assert.rejects(runAssessmentJob('synthetic', 'REGULATORY_DISCOVERY', async () => { executions++; }));
      assert.equal(executions, 0);
    });
  }
});
test('a synchronous stage failure propagates without retrying or submitting a job', async () => {
  await transport(() => data({ background_processing_enabled: false }), async calls => {
    let executions = 0;
    await assert.rejects(runAssessmentJob('synthetic', 'REGULATORY_DISCOVERY', async () => { executions++; throw new Error('Synthetic stage failure'); }), /Synthetic stage failure/);
    assert.equal(executions, 1);
    assert.deepEqual(calls.map(call => call.method), ['GET']);
  });
});
