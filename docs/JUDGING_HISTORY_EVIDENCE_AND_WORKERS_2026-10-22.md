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

## Regional validation finding

The East Asia worker could process persisted jobs, but its provider requests fell back to local heuristics. Direct tests inside the container established OpenAI HTTP 403 with code unsupported_country_region_territory and Gemini HTTP 400 with FAILED_PRECONDITION and a regional restriction. The same credentials completed a local provider request successfully. Configuration presence/model-list access was therefore insufficient proof of usable generation.

The supported worker target is Korea Central, which is listed by [OpenAI](https://help.openai.com/en/articles/5347006-openai-api-supported-countries-and-territories) and [Google](https://ai.google.dev/gemini-api/docs/available-regions). The public frontend/API URLs stay unchanged. Provider-backed question generation joins the three existing queued stages; deterministic answer interpretation stays local. The student subscription's one-standard-environment quota requires replacing the temporary East Asia worker environment rather than retaining two running workers. No provider key is changed or printed.

## Verified deployment — 22 October 2026

The user approved the Korea worker deployment with the explicit condition that the judges' link stay unchanged. The temporary East Asia worker app and its empty standard environment were removed; deletion completed before provisioning the replacement. The pre-existing Express environments and unrelated services were retained.

- Frontend: `https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io`, image source `8112778d52cd749cf3d55c8fc110282bfde47ffa`. This final frontend change makes the prepared walkthrough button restore its two snapshots even after the selectors change on the same URL.
- API: `https://complywise-backend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io`, backend source `d648ac4bec9f78514ff306cf137202b202b8a3de`, same-digest `-workers` image tag. Express required a changed image URI to refresh its runtime settings; the live authenticated capability response, rather than control-plane configuration alone, confirmed activation.
- Worker: `complywise-assessment-worker` in `complywise-worker-korea-standard`, Korea Central, standard WorkloadProfiles Consumption, 0.5 CPU / 1 GiB, min/max replicas 1, no ingress. Its backend release matches the API. Existing database, provider configuration and signing keys were preserved. No new public worker URL was created.
- Live API: `background_processing_enabled=true`, `worker_ready=true`; demo mode remains enabled. Heartbeat matching is required before accepting new operations. A worker outage remains an explicit availability error rather than an unsafe second execution path.

The internal isolated worker check completed in 18.251 seconds with one attempt. A separate real HTTP submission returned 202 in 3.406 seconds, resumed the same job on duplicate submission, and completed in 18.717 seconds with one attempt. Both saved facts with `LLM_BUSINESS_UNDERSTANDING` provenance. These verify actual provider generation from Korea, rather than the East Asia heuristic fallback. They are narrowly scoped operational checks, not a claim that every provider, stage or possible business has been tested. The test businesses were archived after terminal completion. The six original judging businesses were not rewritten.

### Measured release reads

These measurements were taken after worker activation from the local verification client, with three concurrent reads and 20 warm samples per route. Every first read and all 60 warm reads returned HTTP 200. Network travel is included; provider-driven generation is outside this read budget.

| Read route | Warm p95 | Warm maximum | Budget p95 / maximum |
| --- | ---: | ---: | ---: |
| Saved dashboard | 6.750 s | 7.582 s | 10 / 15 s |
| Saved comparison | 2.792 s | 3.285 s | 8 / 12 s |
| Job status / capability | 2.539 s | 3.494 s | 3 / 6 s |

All six original judging dashboards also returned 200 with unchanged saved run IDs and action counts (14, 11, 12, 10, 13, 11). Their concurrent and repeated reads stayed below 6.571 seconds. Read-only database verification recomputed all 16 recorded canonical content hashes: 13 pre-existing archives plus the three new walkthrough archives matched their captured hashes. No queued or running jobs remained at the final audit.

### Test and browser evidence

- Backend suite: **1,063 passed, 10 optional/integration skips**. The skipped checks are listed in the saved output; they are not counted as passing. A separate real PostgreSQL check exercised assessment lock contention, immediate duplicate-operation reuse, competing consumers and expired-lease recovery.
- Frontend transport checks cover disabled-mode compatibility, queued question generation, unavailable-worker handling and avoiding duplicate execution after network errors. TypeScript and targeted comparison-page lint passed. The final frontend and backend images built successfully in GitHub Actions run `39754574858`; the deployed backend remains the matching `d648ac4` API/worker release because the later change affected only frontend behaviour and deployment tooling/tests.
- Live browser verification showed factory applicability changing `NOT_APPLICABLE → APPLICABLE`, then `APPLICABLE → NEEDS_INFORMATION` when production power became unknown. Recorded evidence dates, review gaps and the distinction between applicability and completion were visible. The prepared button correctly reset the pair on the same route.
- [Evidence directory](architecture-evidence/judging-history-2026-10-22/) contains timings, worker results, safe deployment metadata, PostgreSQL results, archive checks and screenshots. Provider keys and authentication tokens are excluded. The temporary GitHub registry build secret was removed after the successful build.

For judging, enter the existing demo account, open **Dashboard → Compare saved assessments → Merchant export → manufacturing walkthrough**, then change **After** to snapshot 3 to inspect uncertainty. These are fictional saved inputs evaluated by the shared engine; the comparison feature is authorized by business and is available for other accounts with two sealed runs. Existing six-case demo login and starter profiles are retained.

The catalogue still has source review and coverage gaps, which the UI now exposes. Applicability does not certify legal completeness, filing or authority approval. This release establishes sampled read budgets and a supervised durable worker; it does not eliminate provider latency, certify production capacity, install a full alerting service, or promise a bug-free system. The single worker deliberately limits concurrency for the judging deployment; measure queue age before increasing replicas or making capacity claims.
