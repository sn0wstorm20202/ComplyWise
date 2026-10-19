# Assessment processing mode discovery — 19 October 2026

## Problem
The frontend attempted POST /api/v1/assessments/{id}/jobs/ for each assessment stage even when the Azure deployment explicitly disabled background workers. The backend correctly returned ASYNC_DISABLED with HTTP 503, and the client then used its synchronous fallback. The avoidable failed request was visible in the browser network panel.

## Fix
The same authorized endpoint now supports a read-only GET returning background_processing_enabled with HTTP 200 and no-store caching. The client checks this before submitting any job. A disabled deployment executes the existing synchronous stage directly; an enabled deployment retains durable job submission, polling and idempotency.

Network errors, authentication/authorization failures, invalid capability responses and failed jobs never initiate a second synchronous operation. During rolling upgrades, older APIs that return HTTP 405 for GET remain compatible with the original explicit ASYNC_DISABLED fallback. An explicit disablement between GET and POST is also handled. The backend's POST guard remains intact for stale clients; job processing is not enabled without a worker.

No background workers, account credentials, assessment facts, stored results or demo flags were changed. No schema migration is required. The user-provided assessment was not rerun.

## Validation
- Full backend suite: 1,051 passed, 10 optional/integration checks skipped.
- Focused durable-job/backend capability tests: 10 passed.
- Frontend transport regressions: 8 passed; verify no jobs POST in synchronous mode, no duplicate execution on failures, enabled mode and compatibility behavior.
- TypeScript type check and targeted lint passed.
- Existing browser journey fixtures were updated for explicit capability discovery; they were not run locally for this release.

## Release
Code revision: 141c0de4c20bff8df48a363521d3c42b390fb88a on architecture/reconciled-core.
GitHub image build: 39258553081.
Both existing Azure apps successfully rolled out the source-matched images. Database readiness returned HTTP 200. Live verification authenticated as the existing non-privileged demo user, then invoked the actual frontend runAssessmentJob helper against the production API. It made one GET capability request (HTTP 200), selected the synchronous callback exactly once, and made zero jobs POSTs and zero expected 503 requests.

The callback was a dispatch-only verification stub: no provider processing or saved assessment was changed. This verifies mode negotiation, not a new external-provider assessment journey. The user's submitted assessment was not rerun. The temporary GitHub registry secret was removed after the successful build.

Existing tabs must refresh to load the updated frontend. Old clients retain their original explicit disabled-mode response until refreshed.
The existing frontend/backend URLs remain unchanged.
