# Architecture implementation status — 16 October 2026

## Baseline reconciliation

Work is isolated on `architecture/reconciled-core`, based on scenario branch
`60ecc41245670a76de29008c3515d229cc44feda`, integrating current checkout `f398830`.
The original checkout and ComplianceRag working changes are untouched.

The ingestion merge preserves parallel acquisition, primary-official-source checks,
HTTP status/content validation, and acquisition timing. The workspace isolation test
now expects 404 for inaccessible businesses and assessments, matching the existing
non-enumeration contract.

Validation: 90 backend tests passed across phase-two security, admin control room,
workspace persistence, API orchestration step two, regulatory discovery, Google
authentication, and demo reviewer authentication. This is not a full-suite, frontend,
PostgreSQL, browser, or deployment verification. Imported changes have existing
whitespace diagnostics in account/settings/test files and Markdown hard breaks.

## Remaining implementation and verification

- Immutable evaluation manifests: pin profile, evaluator, rule and evidence versions;
  preserve historical CIR payloads and verify signatures with configured keys.
- Knowledge publication: reviewed rule releases, effective dates, boundary-case tests,
  source change detection, impact tracking and reassessment.
- Durable background jobs: persisted progress, safe retries, worker recovery and UI
  status integration for slow assessment operations.
- Retrieval: connect and benchmark hybrid retrieval with jurisdiction/date filtering;
  report coverage limitations independently of search scores.
- Tenant isolation: retain exact resource authorization and evaluate PostgreSQL
  row-level policies under a restricted runtime role.
- Reconcile question limits and all remaining documented architecture gaps.
- Run integrated backend/frontend/browser checks and PostgreSQL-specific tests.
- Verify release provenance and deployment separately; no deployment was performed.

Demo mode remains isolated and available pending the user's preference. Completing
the software does not constitute qualified legal approval of the regulatory corpus.

## Research basis

- https://www.openpolicyagent.org/docs/management-decision-logs
- https://learn.microsoft.com/en-us/azure/architecture/microservices/
- https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide
- https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking
- https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- https://docs.celeryq.dev/en/latest/userguide/tasks.html
