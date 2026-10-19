# Operating the reconciled architecture

This is the architecture operations guide. The initial implementation was verified locally; the later judge-demo Azure rollout and its Azure Express limitations are recorded in [the 19 October release report](AZURE_ARCHITECTURE_DEMO_RELEASE_2026-10-19.md). That deployment enables demo mode and keeps background jobs disabled.

## Release units

Deploy the API and worker from the same core commit and environment configuration. Deploy the retrieval service from its corresponding architecture branch. Build the frontend with the intended backend URL. Use a release-specific COMPLYWISE_VERSION and record both core and retrieval commit IDs in deployment metadata.

The core branch is `architecture/reconciled-core`, in `E:/complience/_scratch/complywise-architecture`.
The retrieval branch is `architecture/retrieval-base`, in `E:/complience/_scratch/compliancerag-architecture`.

## Configuration

| Setting | Purpose |
|---|---|
| DATABASE_URL | PostgreSQL for durable workers and concurrent requests |
| COMPLYWISE_DEMO_MODE=False | General operation; demo fixtures require explicit opt-in |
| ENABLE_ASSESSMENT_JOBS=False initially | Enable after the worker from the same release is running |
| CIR_AUTHORITY_KEY | Private signing key from the deployment secret store; never a repository default |
| CIR_SIGNING_KEY_ID | Current key identifier stored with newly signed CIRs |
| CIR_VERIFICATION_KEYS | JSON object retaining older key IDs and keys while historical signatures need verification |
| COMPLIANCERAG_URL and COMPLIANCERAG_KEY | Private retrieval URL and matching server HMAC key |
| ENABLE_PGVECTOR=False | The core does not need vector storage for deterministic decisions or database jobs |
| BACKEND_INTERNAL_URL | Required for a production frontend build |
| RAG_DENSE_ARTIFACT and RAG_EMBEDDING_MODEL_PATH | Optional retrieval-only configuration, enabled together after offline validation |

An empty CIR key produces an unsigned saved record. Verification reports it invalid; a content hash is not a substitute for an authority signature. Set and retain keys before evaluating production records. Adding a key later does not silently rewrite old archives.

The retrieval server refuses startup without its key. The default HTTP retrieval path requires no embedding model download. It labels imported catalogue descriptions UNVERIFIED and does not assert that their text is a verbatim statute.

## Apply and run

From the core backend directory:

```text
python manage.py migrate --noinput
python manage.py check
python manage.py process_assessment_jobs
```

Run the last command as a separately supervised worker process using the same image and database as the API. Continuous operation requires PostgreSQL. `--once` is available for local SQLite verification. Do not enable the API job feature without a worker; queued operations remain persisted until a worker processes them.

The schema adds decision manifests/CIR archives, assessment jobs, rule review records and source-change events. Existing historical runs are not backfilled with invented provenance. A legacy run can be projected once, but remains marked LEGACY_UNPINNED; a fresh evaluation is required for a captured manifest.

The initial pgvector migration now respects ENABLE_PGVECTOR. This corrects fresh database setup; it neither drops an existing extension nor changes applied migration history. If vector storage is enabled later on an already migrated database, provision the extension explicitly through the database administrator.

## Jobs and retries

- POST `/api/v1/assessments/{id}/jobs/` with BUSINESS_UNDERSTANDING, REGULATORY_DISCOVERY or COMPLIANCE_SYNTHESIS.
- HTTP 202 supplies Location and Retry-After. GET the job resource to observe QUEUED, RUNNING, SUCCEEDED or FAILED.
- The default retry key derives from the saved input fingerprint. Repeated requests for unchanged inputs return the same operation. A reused explicit key for different inputs is rejected.
- A deliberate force refresh requires a new Idempotency-Key. A terminal failed job remains terminal for that key; a new explicit refresh starts a new operation. The frontend discovery/synthesis clients support this refresh path.
- Transient provider/network failures retry up to three attempts with backoff. Expired claims can recover; attempt fencing prevents an older claim from committing a newer attempt.
- The worker holds the assessment and job locks while the existing stage runs and commits its writes together with success. External reads may repeat after a crash. This is at-least-once delivery, not exactly-once execution.
- Assessment answer/stage APIs serialize their writes with workers and reject changes while a job is pending. This protects the current orchestration path; unrelated administrative bulk writes must follow the same locking discipline.
- Workers use configured provider credentials. Request-scoped browser provider keys are not persisted into jobs.

Monitor the age of the oldest queued operation, expired RUNNING leases, failed operation counts, attempts, stage duration and worker restarts. The release includes persisted status and error codes, not a production monitoring installation or autoscaling policy.

## Source changes and publication

The review workspace shows changed captures and their affected rule/run counts. A reviewer records NO_RULE_CHANGE or UPDATE_REQUIRED with a reason. Publication requires an official captured source, a verbatim persisted passage, effective dates, an AST and executable positive/negative/missing-fact cases.

Reusing an existing requirement/rule identifier publishes the next rule version. The evaluator uses the newest published version effective on its evaluation date. Old reviewed rule content and old CIRs are retained.

After publishing replacement versions citing the new verified capture, the reviewer can schedule affected assessments. Duplicate scheduling returns the same operations. Busy assessments are reported for later retry. Legacy runs with no assessment link and archived assessments are not automatically scheduled. Publication and reassessment are separate recorded actions.

## Retrieval and optional dense indexing

Default serving:

```text
python server.py --host 0.0.0.0 --port 8100
```

Use a private network and TLS termination. HMAC replay tracking is in the serving process and is not a shared replay store across replicas. The inherited signature format binds timestamp, nonce and body; it is not a full service-mesh identity system.

An optional offline build is available:

```text
python tools/build_dense_artifact.py --model-path <local-model-directory> --output <artifact.json>
```

Install the model's dependencies in the retrieval environment and provision the model locally first. The builder and loader do not download models. Artifacts must match the exact corpus hash and the contents of the local model directory; malformed or non-finite vectors are rejected. Real-model quality and capacity were not validated in this implementation.

For multiple serving replicas, implement a shared replay store or authenticated infrastructure suitable for that deployment. Do not interpret the single-process checks as proof of a distributed replay guarantee.

## Verification and rollout

### Dated procedural information

Apply knowledge migration 0005 before running the updated API and worker. It creates RequirementRevision and an optional rule link. It does not invent dates or reviewer provenance for legacy definitions. Definitions without revisions retain their previous behaviour until reviewed publication creates their first release. Before that first release date, fresh evaluations report the versioned requirement as UNVERIFIED. Saved historical assessments are unchanged.

The reviewer form accepts optional required_documents/application_steps text lists and statutory_fee/validity_period/deadline_notes text. Explicit empty lists clear a checklist. Unspecified fields inherit the available release effective at the new start date, never a future release. Nonempty captured candidate document lists also update the checklist. Supporting evidence is retained when inheriting fields. Dates apply to both the published rule and procedural revision. Applicability conditions remain separately reviewed rule inputs.

An ended or withdrawn latest procedural release does not revive an older open-ended record. Publish a replacement with reviewed evidence to restore coverage. Catalogue fingerprints include procedural revisions and statuses, so changes invalidate reuse. Ordinary model save guards are application controls, not database administrator restrictions.

### Release checks

Run the backend suite, PostgreSQL concurrency tests, frontend build and browser flows against the intended release. Verify migration success and the API/worker release IDs before switching traffic. Confirm a real assessment reaches a saved decision and appears in the intended user's workspace, then test worker recovery and an unchanged historical record.

Provision and test browser binaries and Linux OCR dependencies in the actual deployment image. An installed Playwright Python package or passing Windows OCR tests do not establish those container capabilities.

Database row security, a restricted runtime database role, production load targets, backup restoration, actual embedding quality and live provider behaviour are separate validation items. See the status report for what has actually been exercised locally.
