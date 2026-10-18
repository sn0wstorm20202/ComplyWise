import { afterEach, expect, test } from "bun:test";
import { runAssessmentJob } from "./assessmentJobs.ts";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });
const response = (data, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { "Content-Type": "application/json" } });

test("queued work polls the same job and returns its saved result", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([String(url), options?.method]);
    return calls.length === 1
      ? response({ job_id: "synthetic-job", status: "QUEUED", retry_after_seconds: 1, result: null })
      : response({ job_id: "synthetic-job", status: "SUCCEEDED", result: { saved: true } });
  };
  let legacyCalls = 0;
  const result = await runAssessmentJob("synthetic-assessment", "COMPLIANCE_SYNTHESIS", async () => { legacyCalls++; });
  expect(result).toEqual({ saved: true });
  expect(calls[1][0]).toEndWith("/jobs/synthetic-job/");
  expect(calls[0][1]).toBe("POST");
  expect(legacyCalls).toBe(0);
});

test("only an explicit disabled response uses the synchronous deployment", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: "ASYNC_DISABLED", message: "Disabled" } }), { status: 503 });
  expect(await runAssessmentJob("fixture", "REGULATORY_DISCOVERY", async () => ({ fallback: true }))).toEqual({ fallback: true });
});

test("a lost network response never starts a duplicate synchronous operation", async () => {
  let called = false;
  globalThis.fetch = async () => { throw new TypeError("Synthetic network failure"); };
  await expect(runAssessmentJob("fixture", "REGULATORY_DISCOVERY", async () => { called = true; })).rejects.toThrow("Synthetic network failure");
  expect(called).toBe(false);
});

test("persisted failures and missing results cannot appear successful", async () => {
  globalThis.fetch = async () => response({ job_id: "fixture", status: "FAILED", result: null, error: { code: "STAGE_FAILED", message: "Synthetic failed operation" } });
  await expect(runAssessmentJob("fixture", "COMPLIANCE_SYNTHESIS", async () => ({}))).rejects.toThrow("Synthetic failed operation");
  globalThis.fetch = async () => response({ job_id: "fixture", status: "SUCCEEDED", result: null });
  await expect(runAssessmentJob("fixture", "COMPLIANCE_SYNTHESIS", async () => ({}))).rejects.toThrow("incomplete result");
});
