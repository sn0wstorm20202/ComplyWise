import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's test runner imports the original TypeScript source.
import { googleAuthStartUrl } from "../lib/googleAuthNavigation.ts";

test("Google authorization starts on the configured backend, bypassing frontend rewrites", () => {
  const url = new URL(googleAuthStartUrl(
    "https://backend.example.test/api/v1/", "https://frontend.example.test/api/v1", "browser-bound",
  ));
  assert.equal(url.origin, "https://backend.example.test");
  assert.equal(url.pathname, "/api/v1/auth/google/start");
  assert.equal(url.searchParams.get("handoff_challenge"), "browser-bound");
});

test("Google authorization preserves the local API fallback and encodes the challenge", () => {
  const url = new URL(googleAuthStartUrl(undefined, "http://127.0.0.1:8000/api/v1", "a+b"));
  assert.equal(url.origin, "http://127.0.0.1:8000");
  assert.equal(url.searchParams.get("handoff_challenge"), "a+b");
});
