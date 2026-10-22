# Saved-history comparison, evidence and durable workers

## Design and research

The ordinary evaluator and its immutable profile/manifest/CIR remain authoritative. Comparison is a read-only projection of two sealed runs in the same authorized business; it never invokes a provider, reseals a legacy record or changes the active workspace. Uncertainty and requirements present on only one side remain explicit. The UI distinguishes changed facts from recorded rule inputs and does not assert causality when knowledge, evaluator, mode or evaluation date differs. This follows the provenance principle that each revision is a separate entity, described in the [W3C PROV primer](https://www.w3.org/TR/prov-primer/).

Evidence metadata comes from the saved manifest, including publication, effective and retrieval dates. Missing dates remain “Not recorded”. Reviewed source passages, legal applicability, document review, filing progress and authority approval are different states. Existing curated scenario results remain labelled demo examples. The comparison uses accessible table headers, labelled selectors and non-interrupting status messages, following [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

The prepared walkthrough has three fictional snapshots of one business: merchant export with no production power, manufacturing with recorded production power, and manufacturing with power information unknown. It uses the ordinary evaluator against the existing catalogue, with no new legal rules, citations or fixed successful outcomes. It exposes incomplete rule coverage and unverified evidence instead of concealing them. Preparing it is idempotent and does not overwrite prior saved cases.

For long assessments, reuse the durable database queue, retry keys, attempt fencing and transactional writes already present. [Django tasks documentation](https://docs.djangoproject.com/en/6.0/topics/tasks/) explicitly requires an execution backend/worker; introducing its API alone would not provide execution. PostgreSQL [row locking and skip_locked](https://docs.djangoproject.com/en/6.0/ref/models/querysets/#select-for-update) support independent consumers. No Redis/Celery or second queue is introduced.

[Azure Express](https://learn.microsoft.com/en-us/azure/container-apps/express-overview) is request-driven and excludes jobs. The supported continuous-worker target is a standard WorkloadProfiles Consumption app with no ingress and min/max replicas 1, using the exact API image and existing database/provider/signing configuration. [Azure scaling guidance](https://learn.microsoft.com/en-us/azure/container-apps/scale-app) requires a positive minimum or suitable event scaler for an ingress-free service. This adds a small always-running worker; it is separate from HTTP scaling. There is no new public worker endpoint.

## Acceptance criteria

- Same-business authorization on both runs; comparison GETs leave profiles, manifests and CIR hashes unchanged.
- Unknown, false and zero remain distinct; unresolved and unevaluated rows stay visible.
- Evidence dates are not inferred from evaluation or retrieval dates; applicability never implies verified completion.
- API job submission is enabled only after a fresh heartbeat from the same release. Worker loss yields an explicit availability response rather than silently starting duplicate synchronous work.
- Existing six judging cases retain their saved run IDs and action counts; existing frontend URL remains unchanged.
- Backend/transport tests, production build, PostgreSQL worker checks, live browser comparison and measured read-budget probes pass before recording a successful rollout.

## Initial read budget

`ops/read-latency-budget.json` and `ops/probe_read_latency.py` define and enforce sampled release acceptance: 20 warm reads per route, concurrency 3, no failed reads, separate first-read measurement, p95/max limits of 10/15 seconds for dashboards, 8/12 for comparisons and 3/6 for job-status reads. These are initial engineering budgets informed by the preceding release, not a contractual SLO or capacity certification. [Google SRE guidance](https://sre.google/workbook/implementing-slos/) recommends measuring user journeys and refining objectives with observed traffic. Browser, network and cold-start latency remain separate from the server timing header.

The API logs route templates, status, duration, request ID and release; it does not log raw paths, query strings, tokens or business facts. `Server-Timing` gives server duration. Aggregate these logs by release/route for an operational SLO; local process counters are not treated as a distributed monitor.

## Rollout and rollback

1. Run the tests and build both images. Apply additive businesses migration 0006 before starting the worker. Existing API code ignores the new table.
2. Deploy the new API with jobs still disabled, retaining the URL and settings. Deploy its matching worker using `ops/deploy_assessment_worker.py` against a ready standard environment.
3. Verify same-release heartbeat, durable completion and existing archive integrity. Then enable ENABLE_ASSESSMENT_JOBS and ASSESSMENT_WORKER_HEALTH_REQUIRED on the API. Frontend polling resumes the persisted job without a second execution path.
4. If the worker fails, stop accepting new jobs and retain queued operations for recovery. Do not execute a job synchronously after a network timeout. Disable jobs explicitly only after assessing queued/running work; rollback API/worker images together. Retain signing keys and the additive table. Do not rewrite historical archives.

Deployment and live results will be recorded after verification.
