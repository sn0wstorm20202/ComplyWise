import test from "node:test";
import assert from "node:assert/strict";
import { request, ApiError } from "../lib/api/client";

test("deadline covers a stalled response body even when an external signal is supplied", async () => {
  const original = globalThis.fetch;
  const external = new AbortController();
  globalThis.fetch = async (_url, options) => ({
    status: 200, ok: true,
    json: () => new Promise((_resolve, reject) => {
      options!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {once:true});
    }),
  } as Response);
  try {
    await assert.rejects(request("/synthetic", {signal:external.signal, timeoutMs:20}),
      (error: unknown) => error instanceof ApiError && error.code === "TIMEOUT");
    assert.equal(external.signal.aborted, false);
  } finally { globalThis.fetch = original; }
});

test("caller cancellation aborts the actual fetch without misreporting a timeout", async () => {
  const original = globalThis.fetch;
  const external = new AbortController();
  globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {once:true});
  });
  try {
    const pending = request("/synthetic", {signal:external.signal, timeoutMs:1000});
    external.abort();
    await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === "AbortError");
  } finally { globalThis.fetch = original; }
});
