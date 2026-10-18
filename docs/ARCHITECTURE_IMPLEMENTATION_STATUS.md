# Architecture implementation status — 18 October 2026

## Result

The reconciled implementation now follows the chosen architecture for deterministic evaluation, captured decision inputs, signed historical CIRs, reviewed publication, durable assessment jobs and private retrieval. The work is implemented in isolated branches and verified locally. It has not been pushed, deployed or declared production-ready.

Use [the architecture plan](ARCHITECTURE_PLAN_2026-10-18.md) for the design and research decisions, and [the operations guide](ARCHITECTURE_OPERATIONS.md) for configuration and rollout.

## Provenance and preservation

- Core working directory: `E:/complience/_scratch/complywise-architecture`, branch `architecture/reconciled-core`.
- Reconciled baseline commit: `acbad8f`, integrating scenario `60ecc41245670a76de29008c3515d229cc44feda` and current checkout `f398830`.
- Retrieval working directory: `E:/complience/_scratch/compliancerag-architecture`, branch `architecture/retrieval-base`, starting from `738dc83`.
- The original core checkout remains clean at `f398830`. The original retrieval checkout retains its existing source edits.
- Retrieval's existing uncommitted `server.py`, Dockerfile, JSON-safe indexer/hybrid edits and safe-retrieval tests were copied into the isolated branch as a starting point. Those imported changes are distinguished from the new service indexing/authentication work; they were not authored from scratch in this implementation.

## Implemented and integrated

| Area | Result |
|---|---|
| Decision history | Each fresh evaluation captures raw profile facts, evaluation date, evaluator/release versions, requirement/rule records, evidence, source identity and capture metadata. Results, manifest and CIR seal in one transaction. |
| CIR authority | RFC 8785 canonical bytes, SHA-256 digest, configured HMAC key and key ID; historical key rotation supported. Missing signatures are invalid. No built-in production signing key. |
| Historical reads | CIRs are returned from saved archives. Compliance citations, document/workflow definitions and standards use captured records. An explicit empty/invalid assessment does not fall through to another assessment. |
| Cache validity | Reuse checks profile identity/facts, evaluation date, evaluator version and the catalogue fingerprint. A new source/rule version invalidates the old reusable result. |
| Jobs | Persistent QUEUED/RUNNING/SUCCEEDED/FAILED records; input fingerprints, idempotent retries, three-attempt transient retry, recoverable leases and attempt fencing. API mutation locks protect the active assessment. |
| Frontend | Understanding/discovery/synthesis clients use job status polling when enabled; an explicit ASYNC_DISABLED response preserves synchronous deployments. Network failures do not trigger duplicate synchronous work. |
| Publication | Captured official passage and hash checks, effective dates, executable positive/negative/missing-fact cases, immutable reviewed rule content and version succession. Effective-date tests confirm historical evaluation uses the appropriate version. |
| Source changes | Distinct capture versions produce audited review events with affected rules/run IDs. Reviewed replacements can schedule affected assessments, retaining the original runs. The review UI performs these actions. |
| Retrieval | Actual master KB schema is parsed; indexed BM25 is built once; jurisdiction/domain/date filters precede ranking. The optional local dense path uses RRF and validates corpus/model content hashes. |
| Retrieval boundary | Missing HMAC signatures and replayed nonces fail; request limits are bounded. Catalogue descriptions remain UNVERIFIED; chunk existence does not imply legal currentness. No applicability endpoint is provided. |
| Intake | A shared four-question limit and policy version invalidate old caches. Batch intake reserves discovery questions; sequential clarification prioritizes unresolved rule branches. Deferred gaps remain recorded. |
| Coverage | The business UI states that the recorded catalogue is not exhaustive. Compliance GET does not invent a new applicability evaluation when none is recorded. |
| Database setup | Vector storage is optional in the core; the initial extension migration respects the existing setting. PostgreSQL row locking targets the base rows, including queries with nullable related records. |

## Verification

The machine-readable summaries and raw synthetic retrieval benchmark are in `docs/architecture-evidence/`. The final verification record includes both Python environments, actual PostgreSQL concurrency results, the browser outputs, build output and benchmark limits.

- Full backend regression suite: 1,022 passed and seven skipped on Python 3.11 / Django 5.2.17. The fresh declared Python 3.12.14 runtime with Django 6.0.9 also passed 1,022 tests with the same seven explicit skips. Its exact package versions and outputs are retained in the evidence folder.
- PostgreSQL 16.15: 22 targeted tests passed on both Python/Django environments, including two-worker distinct claims and a single job committed once, plus retry, rollback, source reassessment, publication and signing checks.
- Frontend production build: passed; TypeScript check passed. Targeted lint passed with 15 existing warnings and no errors.
- Client polling: four tests passed, including queued result polling, explicit synchronous fallback, lost-response protection and failure handling.
- Real HTTP integration: the core calls the actual isolated retrieval service with a signature and preserves UNVERIFIED source status.
- Real Chrome + Django + database + worker journey: passed. It displays recorded compliance/coverage, reviews a source change, publishes a tested version, queues and processes reassessment, and confirms the old decision API response is unchanged.
- Browser regressions: 12 passed across the primary journey, grounding, assessment isolation and an explicit retry of a failed background job. These existing regression flows use explicit synthetic API fixtures; they are separate from the real-backend journey above.
- Retrieval: seven new service/index tests passed; two imported JSON cache safety tests passed.
- Local migrations and Django system checks passed; no missing model migrations were detected.
- All 20 document-verification tests passed with the repository-declared Windows OCR dependencies installed.

The seven skipped checks in the SQLite suite are five explicitly live-provider tests and two PostgreSQL-only tests. PostgreSQL-only tests were run separately against a fresh isolated database. No paid provider calls were made for this validation.

## Measured efficiency

The repeatable BM25 benchmark used 5,000 synthetic records and 200 identical exact-token queries, with a state filter. Construction took 334.547 ms and peaked at 6.039 MiB of traced allocations. Query p50 was 0.248 ms and p95 was 0.267 ms. There were zero jurisdiction leaks; all returned top-10 records matched the synthetic label.

These are local, warm, single-process measurements. They do not establish semantic quality, legal recall, concurrent throughput, production capacity or improvement against every alternative. The actual imported catalogue contains 55 description records; they remain unverified. A real-model semantic benchmark is still required before enabling dense retrieval.

## Limits and next release work

- The legal catalogue needs qualified review, dated source verification and a coverage programme. Better software architecture does not verify its legal content.
- Application save guards protect reviewed content/archives, and signatures detect unauthorised payload changes. Database-level administrator tampering, retention and immutable external storage remain separate concerns.
- Tenant API authorization is covered. Database row-level security and a restricted production role have not been installed or certified by these local tests.
- Worker writes currently retain a transaction through the existing orchestrator stage, including network work. This favours recoverability at the current scale; load measurements should determine when to split network work from the commit.
- HMAC replay state is process-local. A multi-replica deployment needs shared replay handling or suitable authenticated infrastructure.
- Rule effective dates are versioned, but requirement-level procedural metadata is still a shared catalogue definition. Independently dated changes to that metadata need separate identifiers or a further versioned-definition design. Existing captured runs preserve their original metadata.
- OCR verification exercised the declared Windows OCR dependencies; Linux container OCR has not been validated.
- Real embedding-model quality, production load, autoscaling, provider availability/cost and backup recovery are unverified.
- A deployed release still needs matching API/worker commits, configured secrets, migration verification, traffic/revision checks and live user-journey evidence. No live service was modified here.
