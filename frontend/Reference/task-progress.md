# ComplyWise — Task Progress / Resume Log

> This file is maintained by the coding agent during the audit + fix.
>
> **Rule:** Update this file immediately after every meaningful task. Never wait until the end.
>
> If the task stops unexpectedly, the next agent must read this file first and resume from the first incomplete task.

---

# Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[!]` Blocked / requires external configuration
- `[?]` Needs investigation

---

# Phase 0 — Baseline

- [x] Read `instruction.md`
- [x] Inspect repository structure
- [x] Identify frontend framework/version
- [x] Identify backend framework/version
- [x] Identify database
- [x] Identify authentication implementation
- [x] Identify LLM providers/models
- [x] Identify RAG/retrieval implementation
- [x] Identify Firecrawl/Crawly implementation
- [x] Identify rule/applicability engine
- [x] Identify admin verification implementation
- [x] Identify all frontend routes
- [x] Identify API endpoints used by the frontend
- [x] Establish current build/test baseline

### Baseline notes

Initial and final results are recorded below. Final consolidated report: [product-architecture-audit.md](product-architecture-audit.md). Remaining unchecked per-route/performance items are not a claim of untested coverage; the report states exactly which scenarios were exercised.

- Build:
- Tests:
- Console errors:
- Broken routes:
- Known backend failures:
- Known frontend failures:
- Known environment/configuration gaps:

---

# Phase 1 — Architecture Audit

- [x] Frontend architecture audit
- [x] Backend architecture audit
- [x] API contract audit
- [x] Database/schema relationship audit
- [x] Authentication/session audit
- [x] Business/profile/assessment relationship audit
- [x] Requirement/evidence/decision relationship audit
- [x] Admin/user data synchronization audit
- [x] LLM pipeline audit
- [x] Retrieval/RAG audit
- [x] Firecrawl/Crawly audit
- [x] Rule-engine audit
- [x] Caching/state-management audit
- [x] Error/loading/empty-state audit
- [x] Latency/performance audit
- [x] Security/permission audit

### Architecture findings

| Area | Status | Problem | Fix | Verification |
|---|---|---|---|---|
| Frontend | | | | |
| Backend | | | | |
| Database | | | | |
| Auth | | | | |
| LLM | | | | |
| Retrieval | | | | |
| Scraping | | | | |
| Rules | | | | |
| Admin | | | | |
| Performance | | | | |

---

# Phase 2 — Dashboard

- [x] Restore previous interactive dashboard structure
- [x] Connect widgets to real persisted data
- [x] Remove fabricated metrics
- [x] Implement real loading states
- [x] Implement real empty states
- [x] Implement real error/retry states
- [x] Implement contextual navigation
- [x] Verify dashboard after profile changes
- [x] Verify dashboard after admin decisions
- [x] Verify responsive dashboard
- [x] Verify reduced-motion dashboard

### Dashboard result

- Previous visual workflow restored:
- Data sources verified:
- Fabricated/static values removed:
- Remaining issues:

---

# Phase 3 — Schemes

- [x] Remove dark/black business-context block
- [x] Apply light premium product theme
- [x] Standardize scheme colour semantics
- [x] Improve business-profile selector
- [ ] Show benefit/match before secondary metadata
- [x] Preserve eligibility/evidence/source
- [x] Test empty scheme result
- [x] Test filtering
- [x] Test business switching
- [ ] Test source/history dialogs

---

# Phase 4 — Standards

- [x] Audit standards API
- [x] Audit standards matching logic
- [x] Fix false populated results
- [x] Implement correct no-match state
- [x] Fix search stale-result behaviour
- [x] Fix error state
- [x] Fix standard detail lookup
- [x] Preserve citations/evidence
- [x] Test a business with standards
- [x] Test a business without standards

---

# Phase 5 — Onboarding

- [x] Audit current onboarding stages
- [x] Preserve useful basic business profile fields
- [x] Preserve business description
- [x] Preserve import/export information
- [x] Audit LLM business understanding
- [x] Audit canonical fact extraction
- [x] Implement decision-critical question selection
- [x] Limit normal adaptive questions to 0–5
- [x] Prefer multiple-choice/chips/ranges
- [x] Remove unnecessary questions
- [x] Preserve answers on failure
- [x] Implement retry
- [x] Test 0-question case
- [x] Test 1–5-question cases
- [x] Test missing-information state

### Onboarding findings

- Current number of questions: 0–5 on the normal assessment path.
- New maximum: five; no padding to fifteen.
- Legacy helper/preset definitions retained for the deferred cleanup.
- Decision-critical variables:
- Unnecessary questions removed:
- LLM responsibilities:
- Deterministic responsibilities:

---

# Phase 6 — Firecrawl / Crawly / Regulatory Retrieval

- [x] Identify actual scraping provider/package
- [x] Verify environment configuration
- [x] Verify source URL selection
- [x] Verify official-domain restrictions
- [x] Verify extraction
- [!] Verify JS-rendered page handling — optional Crawlee/browser runtime not installed; HTTP alternative verified
- [x] Verify PDF/document handling
- [x] Verify retries/timeouts
- [x] Verify rate limits
- [x] Verify duplicate detection
- [x] Verify metadata extraction
- [x] Verify source versioning
- [ ] Verify publication/effective dates
- [x] Verify provenance persistence
- [x] Verify knowledge persistence
- [x] Verify retrieval uses persisted scraped content
- [x] Test successful scrape
- [x] Test failed scrape
- [x] Test timeout
- [x] Test stale source
- [x] Test duplicate source

### Scraping audit

- Provider:
- Working path:
- Broken path:
- Source registry:
- Persistence location:
- Provenance location:
- Retry strategy:
- Cache strategy:
- Major fixes:
- Remaining limitations:

---

# Phase 7 — Compliance / Accuracy

- [x] Audit deterministic applicability engine
- [x] Verify threshold evaluation
- [x] Verify exemptions
- [x] Verify jurisdiction
- [x] Verify effective dates
- [x] Verify entity/activity conditions
- [x] Verify UNKNOWN handling
- [x] Verify KNOWLEDGE_NOT_COVERED handling
- [x] Verify evidence attachment
- [x] Verify source/version attachment
- [x] Prevent LLM-only applicability decisions
- [x] Test applicable result
- [x] Test not-applicable result
- [x] Test missing-fact result
- [x] Test uncovered-knowledge result

### Accuracy findings

---

# Phase 8 — Admin Verification

- [x] Audit admin queue
- [x] Audit admin business selection
- [x] Audit requirement review
- [x] Audit evidence viewer
- [x] Audit approve action
- [x] Audit reject action
- [x] Audit modify action
- [x] Verify database persistence
- [x] Verify reviewer identity
- [x] Verify timestamp
- [x] Verify audit trail
- [x] Verify user-side propagation
- [x] Verify profile-version relationship
- [x] Verify stale-assessment handling
- [x] Fix permission boundaries
- [x] Simplify admin UI information hierarchy

### Admin findings

- Main broken path:
- Database persistence problem:
- User propagation problem:
- UI clutter problem:
- Fix implemented:
- Verification:

---

# Phase 9 — Authentication / Google Auth

- [x] Audit existing authentication
- [x] Preserve current authentication
- [x] Implement Google OAuth
- [x] Implement secure callback
- [x] Implement verified-email handling
- [x] Implement existing-account handling
- [x] Prevent duplicate users
- [x] Implement exact duplicate-registration message:
  `The user already exists. Please sign in.`
- [!] Test Google login — implementation/security tests pass; live OAuth requires external client/Console setup
- [x] Test Google failure
- [x] Test existing email
- [x] Test logout/session
- [x] Remove forgot-password UI/routes
- [x] Verify protected routes

### Google Auth environment

| Variable | Frontend/Backend | Secret? | Purpose | Required |
|---|---|---:|---|---|
| | | | | |

### Google Console configuration

- Authorized JavaScript origins:
- Authorized redirect URIs:
- Production callback:
- Local callback:
- Additional configuration:

---

# Phase 10 — Performance / UX

- [ ] Measure initial load
- [ ] Measure authentication
- [ ] Measure onboarding
- [x] Measure LLM analysis
- [x] Measure scraping
- [x] Measure retrieval
- [x] Measure assessment
- [ ] Measure dashboard
- [ ] Measure admin queue
- [ ] Measure admin decisions
- [ ] Measure standards
- [ ] Measure schemes
- [x] Remove duplicate requests
- [x] Add safe caching
- [ ] Add pagination where necessary
- [x] Add skeletons/progress states
- [x] Fix slow interactions
- [x] Verify no fake progress

### Performance findings

---

# Phase 11 — Full Route / UX Audit

- [x] Landing
- [x] Sign in
- [x] Register
- [x] Admin login
- [x] Onboarding
- [x] Dashboard
- [x] Business profile
- [x] Business detail
- [x] Compliance
- [x] Requirement detail
- [x] Documents
- [x] Document detail
- [x] Workflows
- [x] Workflow detail
- [x] Applications
- [x] Cases
- [x] Case detail
- [x] Calendar
- [x] Notifications
- [x] Standards
- [x] Standard detail
- [x] Schemes
- [x] Regulatory updates
- [x] Regulatory update detail
- [x] Assistant
- [x] Settings
- [x] Admin
- [x] Admin businesses
- [x] Admin business detail
- [x] Admin cases
- [x] Admin case detail
- [x] All aliases/parameterized routes

For every route verify:

- [ ] Loading
- [ ] Empty
- [ ] Error
- [ ] Success
- [ ] Permission denied
- [ ] Mobile
- [ ] Keyboard
- [ ] Reduced motion
- [ ] No console errors
- [ ] No horizontal overflow

---

# Phase 12 — Final Verification

- [x] Build passes
- [x] TypeScript passes
- [x] Critical lint errors = 0
- [x] Unit tests pass
- [x] Integration/API tests pass
- [x] Browser tests pass
- [x] Authentication tests pass
- [x] Onboarding tests pass
- [x] Scraping tests pass
- [x] Compliance tests pass
- [x] Admin persistence tests pass
- [x] User/admin synchronization tests pass
- [x] Responsive tests pass
- [x] Reduced-motion tests pass
- [x] No critical console errors
- [x] No critical broken routes
- [x] No fabricated fallback records
- [x] No unresolved critical data-integrity bugs

---

# Final Architecture Report

## Overall status

`READY FOR REVIEW — targeted architecture implementation complete; external integration setup remains`

## Critical problems found

1.
2.
3.

## Critical fixes completed

1.
2.
3.

## Remaining blockers

1.
2.
3.

## Known limitations

1.
2.
3.

## External configuration required

1.
2.
3.

## Google Auth environment variables

Document the exact variables actually used by the final code.

## Final test summary

- Build:
- Unit:
- Integration:
- E2E:
- Auth:
- Scraping:
- Compliance:
- Admin:
- Mobile:
- Accessibility:
- Console errors:

## Final user journey verification

`Registration → Profile → Description → Adaptive Questions → Retrieval → Scraping → Assessment → Dashboard → Admin Verification → Updated User Result`

Result:

## Last completed task

`A12 — final architecture report and complete regression verification`

## Current task

`Complete — see product-architecture-audit.md for validated behavior and external limitations`

## Next task

`External Google OAuth/Calendar configuration; Phase B cleanup remains deferred`

## Resume instruction

If execution stops, start from **Current task** and inspect all unchecked items before making new changes.

## Active audit — 2026-10-03

- [x] Read the complete authoritative instruction and existing progress log before edits.
- [x] Inspected all three reference screenshots and preserved existing uncommitted product changes.
- [x] Inventoried 37 frontend page files (including aliases) and backend modular apps/API mounts.
- Baseline: Next 16.3.4 / React 19.2.8 / Tailwind 4; Django 6.0.8 / DRF; PostgreSQL + pgvector configured. No new framework/design system planned.
- Initial findings: password/token authentication exists, Google sign-in is missing; duplicate registration message differs from specification; several questionnaire paths enforce 15 questions; standards discovery labels generated citations verified; workspace context silently suppresses request errors and can retain stale assessment IDs.
- Current task: complete baseline builds/tests and inspect rule, ingestion, review and frontend contracts before fixes.
- Next task: prioritize safety fixes (deterministic decisions, provenance, standards, persisted reviews), then onboarding/auth/dashboard/UI integration and full validation.
- No completion claims yet. External provider credentials will never be logged or committed.

### Task A1 — permission and decision boundaries implemented
- Removed anonymous admin/case/deadline mutations and the workflow resolver's fallback to the first business; user case/document requests are tenant-scoped.
- Added reviewer role permissions, case row locking, review decision validation, cross-case document rejection, and prevented escalation from approving documents.
- Corrected duplicate-email registration text and race handling.
- Replaced live LLM legal determinations with persisted ApplicabilityEngine results connected to the assessment/profile; disabled automatic publication of generated knowledge and fabricated statutory-catalog evidence fallback.
- Verification pending: focused regression tests will follow. Existing shared DB records were not rewritten or reclassified.
- Current task: standards matching, bounded decision-critical questions, capture provenance and knowledge review.

### Task A2 — standards and onboarding safety implemented
- Standards business matching now requires an actual APPLICABLE decision, published STANDARD definition and verified active evidence; no substring catalogue fallback. Unknown/inaccessible businesses receive 404.
- Normal adaptive intake is capped at five across the assessment, selects unresolved rule/source-search gaps, suppresses known facts and no longer pads the questionnaire to a fixed size.
- Question answers persist to immutable profile versions and link the assessment to the new snapshot. Arbitrary question IDs are rejected.
- Automated/UX verification pending; frontend zero-question transition and capture/review persistence are next.

### SIH behavior override — accepted during active implementation
- Latest user instruction overrides coverage dead ends: retrieve/evaluate first, then persist structured LLM contextual guidance for gaps and integrate it into the normal workspace.
- Two origins remain explicit internally: DETERMINISTIC_KB_RESULT and LLM_FALLBACK_RESULT. LLM guidance must never acquire fake rule/evidence IDs or verified metadata. Published deterministic knowledge and reviewer decisions take precedence.
- Add optional editable industry starter profiles; arbitrary businesses use the real pipeline.
- Required new tests: covered business + arbitrary business, persisted guidance across compliance/documents/workflows/standards/schemes, no fabricated citations/URLs, hybrid precedence.
- Completed baseline: TypeScript passed; backend baseline 555 passed / 2 failed / 9 skipped (555.6s). Existing failures: Assessment.stage_metadata attribute access and dashboard cross-assessment fallback. Both identified for correction.
- Google OAuth server code + frontend handoff implemented; dependency/migrations/tests pending. Four exact GOOGLE_AUTH_* settings added only to .env.example, no actual secrets edited.

### Task A3 — persisted SIH contextual workspace implemented
- Added assessment/profile-scoped WorkspaceGuidance, isolated from published knowledge, rules and Evidence. Generation runs after retrieval/evaluation; workspace reads do not invoke providers.
- Structured validation assigns application IDs, strips unverified hyperlinks, rejects unlinked document/workflow items, and retains deterministic title precedence. Failed/malformed provider output is retried and never replaced with fabricated data.
- Integrated saved guidance into synthesis, compliance list/detail, documents, workflows, standards, schemes and dashboard next steps. Removed cross-assessment fallback in the analysis facade/dashboard.
- Onboarding now accepts 0–5 questions and advances immediately when no material questions remain. Failed progress saves remain visible; removed the fake demo-business ID in analysis.
- Django system checks passed; business guidance migration generated. New persistence/isolation/no-fake-evidence regression tests and TypeScript validation running.
- Current task: verify integrations, editable starter profiles, admin knowledge review, source/review/auth regression tests and complete workspace UX.

### Task A4 — workspace integrity and UX verification
- Restored interactive activity/document/case-status dashboard widgets using persisted data, including an activity drawer and real navigation. Counts distinguish uploaded files, reviewer approvals, case completion and rule applicability.
- Replaced starter selection with six editable business profiles and an unrestricted own-business option; removed fabricated questionnaire answer prefilling.
- BusinessContext now exposes loading/retry errors, rejects stale request completions, validates the selected assessment against its business, and no longer replaces real data with a demo profile or cached synthesis metrics.
- Schemes business panel contrast fixed; standards and compliance requests now preserve assessment scope and avoid stale request results. Suggested guidance joins the primary next-step list without fake authority links.
- Added reviewer role serialization; restored HMAC document preview access without putting reusable API tokens in iframe URLs. Fixed nonexistent risk_level field in admin catalogue query.
- Full intermediate backend suite: 505 passed, 56 failed, 9 skipped. Most failing legacy tests require fixed 15-question intake, fabricated offline scheme/standards data or publication of LLM claims; these contracts conflict with the new instruction and require replacement fixtures/assertions. Other failures are being investigated; this is not a passing completion state.
- Current task: genuine document-upload persistence, contextual workflow progress, knowledge review propagation, updated meaningful regression tests, runtime/browser checks.

### Task A5 — stored documents, workflow progress and architecture map
- Document uploads now create actual versioned submissions and files; automated checks no longer mark reviewer approval or invent reference/expiry metadata. Storage failure is an error, not a successful response.
- Workflow updates validate real steps and persist case state; knowledge-review queue records explicit reviewer publication with source/capture checks and audit events.
- Removed browser document-provider secret configuration and credential-bearing preview URLs.
- New architecture-preservation override accepted; broad cleanup is deferred. Actual pre-edit architecture map saved in docs/architecture-gap-audit.md.
- Found missing multi-key Gemini support, broken OpenAI-to-Gemini kwargs, response-validation bypass and unsafe vendor error details. Minimal provider-boundary fixes and offline failure matrix are now being verified.
- Actual environment selects OpenAI and has one Gemini key; no wired vector/BM25/reranking implementation found in this checkout or inspected local branch refs. Deployed RAG location requested; existing evidence retrieval is preserved.
- Current task: provider matrix, captured-context/retrieval recovery, API workspace continuity and architecture diagram.

### Task A6 — provider chain and persistence checks passed
- Provider boundary: 41 focused checks passed, including first/second/third-slot success, exhausted Gemini → OpenAI, malformed output, cooldown, safe classification and no recursion. Runtime remains configured OpenAI → one Gemini slot; no real keys were printed or changed.
- Architecture connections + Google OAuth: 16 checks passed. Verified retrieval context reaches generation, retrieval infrastructure failure preserves fallback, empty claim extraction retains source capture, Firecrawl failure reuses the same snapshot, successful fallback persists through normal APIs, final exhaustion returns controlled 503, OAuth state/nonce/browser-bound ticket/replay protection and exact duplicate message.
- Workspace write/reload checks: 20 checks passed including the above plus real document bytes/versioning, reviewer approval propagation, general business-record vault, filing-state persistence and workflow completion/reopen.
- Frontend production build passed; Django checks passed. Additive OAuth/guidance/capture migrations applied successfully to the configured PostgreSQL database after confirming zero duplicate case-insensitive email groups.
- Actual backend architecture diagram added at docs/backend-architecture.mmd. Vector/hybrid RAG cannot be claimed as connected in this checkout; existing verified-evidence retrieval is preserved.
- Removed forced duplicate onboarding discovery and unsupported procedural fees/timelines from derived workflows; legacy template definitions remain for the later cleanup/review phase.
- Current task: scraping recovery/latency validation, operational review propagation, runtime/browser tests and complete regression suite.

### Task A7 — runtime and browser verification
- Restarted both native servers after migrations: backend 127.0.0.1:8000, frontend localhost:3000; no Docker.
- Live configured OpenAI readiness request succeeded (gpt-4o-mini; ~2.94 seconds). No provider credentials or business prompts logged.
- Playwright product workspace suite passed 19/19 using installed Chrome; includes keyboard navigation, mobile drawer, onboarding saves, upload failure/persistence identity, admin review, route rendering at desktop/tablet/mobile and reduced motion. Initial browser launch failure was missing bundled Chromium, resolved using installed Chrome without changing dependencies.
- Focused backend architecture/lifecycle suite: 91 passed, one legacy expectation failed (cross-tenant file lookup expected 403; correctly returns non-disclosing 404). Test updated to assert scoped behavior plus unauthenticated invalid-signature 401.
- Firecrawl calls now share a per-call time budget; independent searches run concurrently while all database writes stay on the request thread. Captures preserve the actual acquisition provider.
- Crawlee browser requests now use PlaywrightCrawler when installed, corrected its timeout argument and added real PDF extraction to HTTP acquisition; optional package/browser availability remains an external runtime condition.
- Current task: operational-review propagation, full-suite contract corrections, live scraping result, final architecture verification.

### Task A8 — assessment boundaries and regression audit
- Focused architecture suite passed 95 tests; full-suite run exposed 42 failures (561 passed, 8 skipped), which are being triaged rather than reported as a passing product.
- Corrected assessment profile display and discovery selection to use the saved snapshot; workspace switching awaits the server write and documents reject stale list responses.
- Analysis facade endpoints now return controlled 503 after provider exhaustion, with assessment ownership validation.
- Storage exhaustion has a specific safe 503 response; reviewer disposition audit records previous/current treatment and remains separate from deterministic truth.
- Fixed a real compact-interview prioritization gap: general rules previously consumed all five slots before contextual sector facts. Two source-discovery questions now remain available; 12 sector/planner regression tests passed.
- Scheme ingestion/versioning tests now use explicit synthetic fixture HTML instead of calling live portals or expecting production fake snapshots. All 12 scheme/reviewer connection tests passed.
- Automated tests now isolate external credentials; separately opted-in live integration retains runtime config. No environment secrets changed.
- Current task: remaining legacy accuracy contracts, acquisition recovery tests, final regression/build/browser run and final audit documentation.

### Task A9 — accuracy fixtures and complete route verification
- Frontend production build passed all 39 routes; both frontend unit suites passed (13 checks); refreshed Chrome workspace tests passed 19/19 with no console/runtime errors in the tested routes.
- Acquisition recovery tests passed: missing optional browser engine uses real HTTP content, Firecrawl scrape failure persists recovered official content, unofficial redirects are rejected.
- Compact intake and provider/API regressions passed 25 checks; sector planner regression passed 12.
- Replaced obsolete static-standard assertions with saved-decision/evidence tests covering publication state, profile applicability, missing facts, source verification, tenant/assessment scope and rejection of fabricated model metadata.
- Fixed legacy test-data leakage: module-scoped knowledge loading outside test transactions was contaminating unrelated tests; fixture now rolls back per test. Updated affected question-count and no-auto-publication contracts without re-enabling fabricated content.
- Corrected facade discovery snapshot selection to use persisted summary metadata (DiscoveryRun has no profile FK); added regression for actual captures reaching the model and saved profile serialization.
- Backend checks and migration drift checks passed. Full backend suite is rerunning; no whole-suite pass is claimed yet.
- Current task: final backend regression results, actual-provider arbitrary-business smoke, runtime readiness and final documentation.


### Task A10 — real-provider journey and document extraction
- The full backend suite passed 610 checks before enabling missing image/PDF dependencies. The separately opted-in arbitrary-business test passed with the real configured OpenAI provider in 30.50 seconds; test data was isolated from shared user records.
- The live test exposed empty generated document/workflow arrays. Missing children now become linked business-information checklists and practical next steps, without invented government forms, dates or URLs. Added a regression for that exact gap.
- Added the dependencies already required by existing PDF/image extraction: pypdf, Pillow and Windows-only winsdk. Native image tests now run and pass instead of skipping for missing Pillow.
- Found and removed metadata-only simulated OCR text, routed document interpretation through the configured provider chain with response validation, and separated preliminary check success from human verification. No-file metadata cannot produce verified evidence.
- Current task: final full regression, refreshed frontend build/browser checks, native server restart and architecture documentation.


### Task A11 — updated environment and deployed RAG connected
- The user's updated .env contains GEMINI_API1, GEMINI_API2 and COMPLIANCERAG_URL. The earlier one-slot/no-service finding describes the previous configuration, not this update.
- Existing numbered key aliases are now loaded dynamically and deduplicated. Three distinct Gemini slots are configured; the explicit LLM_PROVIDER=openai selection remains unchanged.
- Probed the actual deployed service: /health succeeds (four indexed chunks / four requirements); POST /retrieval/search returns real chunk/source metadata. Added a bounded adapter to that confirmed contract without rebuilding the service or local retrieval.
- Remote results enter discovery and structured workspace context, and their original source identities/excerpts are retained in assessment/guidance metadata. They do not automatically publish local rules/evidence.
- The service returned Gujarat-specific sources for a Maharashtra context; the adapter now enforces recognizable source jurisdiction. Live Gujarat match succeeds, Maharashtra excludes that source, arbitrary Kerala workshop returns empty retrieval and continues to planning.
- Provider/RAG/architecture connection tests passed 39 checks. Google Calendar client settings are present; Google Auth client settings remain missing and are separate integrations.
- Current task: rerun the complete backend suite and actual-provider journey with the deployed retrieval connection, restart the backend with the updated environment, finish documentation.


### Task A12 — final verification and handoff
- Complete backend suite: **632 passed, 4 skipped**, 31.30 seconds; skips are opt-in live checks. Actual-provider arbitrary-business journey separately passed in 34.49 seconds after the deployed retrieval connection.
- All three configured Gemini slots passed bounded live requests. Current explicit selection remains OpenAI primary, then Gemini slots 1–3; selecting Gemini uses the pool then OpenAI final fallback.
- Frontend build/TypeScript passed all 39 routes; frontend unit checks 13 passed; Chrome product suite 19 passed; landing regression 2 passed. ESLint has zero errors and 421 warnings, retained for the deferred cleanup.
- Actual PDF extraction and native image/orientation tests pass. Missing OCR preserves the real upload with PRECHECK_ERROR/human review, not a fabricated pass.
- Django system checks, migration drift and dependency checks passed; git diff --check passed.
- Both native servers restarted with latest code/environment. Backend http://127.0.0.1:8000 and frontend http://localhost:3000 return HTTP 200; readiness confirms PostgreSQL/pgvector, not SQLite.
- Final report: product-architecture-audit.md. Actual Mermaid diagram: ../../docs/backend-architecture.mmd. The earlier architecture-gap-audit.md is explicitly a historical baseline with the updated configuration connection noted.
- Required Google Auth variables/client Console setup, missing Calendar tokens, live Firecrawl scrape timeout/HTTP recovery, external RAG internals and other limits are documented. No secrets printed or .env values edited.
- Status: repository implementation and verification complete with documented external setup limits. No broad directory cleanup, framework migration, commit or push performed. The separate cleanup phase remains deferred.


## FINAL SUBMISSION POLISH — START

- [~] 2026-10-04T16:50:25 P0: baseline SHA e88e7248666057634d1ac807e2dc83c4bafd10cf. Large pre-existing modified/untracked tree preserved; no reset or staging.
- Read instruction (1).md and cleanup playbook in frontend/Reference. Exact instruction.md and cleanup-prompt filename absent; latest user prompt takes precedence. Historical test counts are not current verification.
- Runtime environment selects Gemini; GEMINI_API_KEY + GEMINI_API1 + GEMINI_API2 configured. Existing pool is sequential, process-local cooldown; round-robin missing. OpenAI configured. Secrets not printed.
- Acquisition: active Firecrawl search/scrape; SERP_API credential exists but vendor/adapter unidentified. Python Crawlee/Playwright absent. Remote COMPLIANCERAG_URL configured, internals external.
- Six editable starter profiles on user onboarding/add-business; no admin creation UI or renewable-energy starter.
- Planned: P1 starters; P2 explicit search adapter + actual Crawlee and Firecrawl disconnection; P3 round-robin bounded pool; P4 schemas/prompt guardrails; P5-P8 regression/live/browser/documentation; P9 only proven obsolete task-related branches; P10 honest freeze.

### 2026-10-04T16:53:07 P1 — starter integration [~]
- Files: frontend/data/businessStarters.ts, components/onboarding/DemoPresetSelector.tsx, app/onboarding/page.tsx, components/product/AdminBusinessCreation.tsx, app/admin/businesses/page.tsx; backend/apps/businesses/admin_creation.py, config/api_urls.py.
- Starter selector now visible without opening a disclosure; renewable-energy starter; own-business clears inherited facts. Admin form reuses profiles with editable fields and manual owner credentials. Atomic server creation restricted to platform superuser; no generated credentials/token or automatic assessment. Reviewer entry links to normal onboarding.
- Reason: hidden onboarding controls and absent admin creation. Verification pending API/browser checks; no completion claimed.
- Search vendor confirmed by user: SerpApi (serpapi.com); SERP_API is its backend credential alias.

### 2026-10-04T16:59:31 P2/P3 — acquisition and Gemini [~]
- Files: ingestion/search_provider.py, ingestion/services.py, ingestion/firecrawl.py, domain/intelligence/discovery.py, domain/acquisition/crawlee_provider.py, config/settings.py, pyproject.toml, requirements.txt; providers/gemini_provider.py, providers/http.py, intelligence/orchestration.py; tests/conftest.py, tests/test_provider_fallback_chain.py; frontend/onboarding labels.
- SerpApi REST search.json using organic_results; backend alias SERP_API. Live bounded search returned 3 URLs in 1.01s. Search snippets never become captures. Firecrawl adapter replaced by non-network retired boundary and removed from discovery/settings.
- Crawlee 1.7.2 + Python Playwright 1.63.0 installed; Chromium binary installed. Real BIS capture CRAWLEE_HTTP 200, 13,905 text chars, ~5.04s including redirect. HTTP/browser modes use same official/DNS/redirect/content policy; raw/normalized hashes, MIME, size and mode persisted. Browser/PDF probes pending.
- Gemini healthy starting-slot round-robin, cooldown skip/reentry, one attempt per eligible slot, OpenAI final fallback; invalid application requests stop. Safe telemetry retains actual slot vs attempt. 22 mocked provider tests passed (backend cwd). Shared-project quota independence unknown; cursor/cooldown remain process-local.
- Isolated Crawlee request queues added after live probe showed default queue retained prior requests. More tests pending.

### 2026-10-04T17:06:52 P4 — evidence/output constraints [~]
- Files: domain/intelligence/output_safety.py; prompts in business_understanding.py, questionnaire.py, synthesis.py, workspace_guidance.py; onboarding/planner.py, ingestion/claim_extraction.py, assistant/services.py; provider OpenAI validation/attempt budget; common/health.py; tests/test_submission_polish.py and acquisition fixtures.
- Prompts share explicit supplied-fact/evidence constraints. Question/schema validation is inside fallback boundary. Claim extraction requires exact quotes and supported procedural detail. Workspace validation rejects invented URLs, legal IDs, verification and unsupported specific sections/forms/durations. Guidance remains separate from rules.
- 52 focused mocked/local checks passed, including admin atomic creation/permission, search failure/redaction, capture rejection and provider rotation. TypeScript completed with no errors. First full-suite collection exposed a prompt insertion syntax error before dataclass; corrected and compileall passed. Full suite rerun pending.
- No claim that schema or prompts prove semantic/legal accuracy. Official-source capture quality, RAG internals and expert corpus review remain separate gates.

### 2026-10-04T17:10:02 P5 — regression and classification gap [~]
- Full current local backend suite: 653 passed, 1 failed, 3 opt-in live skips in 68.82s. Failing standards test expected fake metadata to be silently stripped; new validation intentionally rejects it. Updated the test to verify rejection and no persisted guidance. No whole-suite green claim yet.
- Found an actual correctness issue: derive_msme_scale treated one missing input as zero and used 2020 limits for current profiles. Changed domain/context/business_context.py to require both facts; revised 2025 limits independently verified against Ministry of MSME Chennai official definition page, retaining an explicit historical as_of option. Classification remains an aid, not registration/eligibility proof. Added boundary/missing-fact tests.
- Browser QA started against native servers; full gate is ongoing.

### 2026-10-04 P6 — scoped duplicate work and result identity [~]
- Files: backend/domain/intelligence/orchestration.py; apps/businesses/serializers.py, orchestration_views.py; frontend/app/onboarding/page.tsx; tests/test_submission_polish.py. Reuse the onboarding assessment under a business lock instead of creating a second run; merge UI checkpoints without erasing server stage metadata; reuse understanding; remove competing background question generation. Scheme/standard stages use the selected assessment and actual citations, preserving contextual origin and unknown mandatory status. Empty cached sections stay cached.
- 80 focused local/mock tests passed, one opt-in live skip in 5.78 seconds before final result-label refinements; complete regression pending.
- Real probes: all three Gemini slots succeeded; SerpApi returned three URLs; deployed RAG returned two accepted context rows; Crawlee browser acquired CRSBIS. A missing BIS path redirected to its homepage and was incorrectly accepted. Added soft-homepage redirect rejection; initial PDF target was unreachable, replaced with confirmed Ministry PDF. Initial failures preserved in docs/final-submission-acquisition.json.

### 2026-10-04 P7 — current verification [~]
- Full local backend regression: 656 passed, three opt-in live skips, 99.86 seconds. Unit/API/provider/tenant/persistence tests use isolated SQLite; runtime remains PostgreSQL. Browser fixture suite: 22 passed in 2.2 minutes, desktop/tablet/mobile/reduced motion, keyboard, upload/error and reviewer flows. Frontend unit tests: 13 passed. TypeScript passed.
- Actual provider API journey: Kerala leather repair/upcycling, assessment 29caa110-fde1-4f7a-8124-b6c1d5b7b820; two questions; Gemini slots 1,2,3; 21.342s pipeline /25.77s test. SerpApi ran six queries, 20 unique candidates, seven official candidates; all three attempted captures rejected, zero deterministic decisions; three contextual compliance/document/workflow items and one scheme/standard persisted. This is isolated real-provider API testing, not covered production KB or real browser authentication.
- Real acquisition found Impit TLS incompatibility on Ministry PDF. Installed Crawlee HTTPX extra and changed HTTP transport within existing Crawlee boundary. Static HTML, official PDF and actual browser CRSBIS now succeed; missing-document homepage and unofficial URL reject. Thin HTML shells route once into actual browser acquisition within remaining budget. Source dates are not guessed.
- Latest resume audit found React state timing blocked resumed questions. Pass resolved business/run IDs explicitly; removed stale Generate 15 Questions label. Empty deterministic run is reusable, not repeatedly re-evaluated; stage narratives distinguish preparation from statutory filings. Added browser regression/screenshots; final targeted rerun pending.
- Updated dependency lock. Native DB migration applies only ingestion.0004_alter_discoveryrun_provider; no database redesign.

### 2026-10-04 P7 — real runtime gap and corrections [~]
- Real PostgreSQL has 93 published requirements and 34 published rules; pgvector is installed. Temporary authenticated QA manufacturing journey uses these existing records and deletes only its QA account/business afterwards. First diagnostic attempts exposed helper response-envelope and unknown profile-key mistakes, corrected; these were probe defects, not application successes.
- Next runtime journey saw three actual Gemini provider-unavailable attempts for workspace guidance. OpenAI was incorrectly blocked because attempts consumed the five-call assessment budget. Files: domain/providers/telemetry.py, gemini_provider.py, openai_provider.py, intelligence/orchestration.py; tests/test_provider_fallback_chain.py. Logical request IDs now keep bounded fallback attempts in one call budget; token/cost limits remain. Non-LLM scheme/standard reads are not blocked by that budget. 38 focused provider/orchestrator tests passed, including max-one-logical-request with three Gemini failures followed by OpenAI. New runtime probe pending.
- Screenshots exposed missing ui-input styles in new admin form and hardcoded 36-scheme claims. Fixed product.css/Overlay.tsx/AdminBusinessCreation.tsx and schemes/page.tsx using existing tokens. Dialog header stays accessible; starter receives initial focus. Four targeted browser tests passed in20.1s; resume dedup also fixes development effect replay. All 13 requested screenshot states captured; visual review ongoing.
- Production build passed. ESLint initially scanned generated Playwright report and CJS test configuration; scope TS overrides and ignore generated reports, allow require in actual .cjs files. Current lint: zero errors,419 warnings (deferred cleanup).
- Full browser inventory also contains historical tests requiring missing demo accounts/business IDs and fixed15-question presets/legal outputs. The current full run exposes their failures; no fake accounts/results restored. Those checks are not represented as current green gates.

### 2026-10-04 P7/P8 — budget and context limits [~]
- Full runtime manufacturing probe showed workspace prompt repeated full captured content (over41k input tokens), exceeding20k assessment token budget. Added bounded structured excerpt projection in workspace_guidance.py; full normalized captures remain persisted. Added limit/non-mutation regression. Inputs/source identity are not replaced by invented summaries.
- QA diagnostic cleanup encountered WorkspaceGuidance profile PROTECT; fixed explicit QA-scoped guidance removal before deleting its temporary business/account. Previous exact QA account cleaned successfully; production records retained. No database relationship changed to make cleanup easier.
- New logical-request fallback test passes: three Gemini failures reach OpenAI even with max-one-logical-call; next logical request remains budget blocked. Provider cost/token limits still enforced.
- Screenshot review: existing warm identity intact; admin fields now styled with existing tokens/sticky dialog header. Changed Boolean question labels to Yes/No, avoiding unsupported applicability language. Mobile/fullpage fixed-header position can reflect screenshot scroll position; viewport regression confirms no horizontal clipping.

## FINAL SUBMISSION FREEZE — 2026-10-04

- Baseline/current commit SHA: e88e7248666057634d1ac807e2dc83c4bafd10cf. Existing modified/untracked work preserved; no commit/push/reset.
- [x] P1: seven visible editable user/add-business/admin starters, own-business clear, no autofilled credentials/answers; API permission/atomic tests and browser chooser/create/resume verified.
- [x] P2: SerpApi adapter confirmed by user and live probes; actual Crawlee1.7.2 HTTPX and Playwright Chromium acquisition; HTTP/PDF/browser/rejected-source probes verified. Firecrawl has no active runtime/network fallback. Old local credential left untouched and unused.
- [x] P3: Gemini primary, three configured slots, healthy rotation/cooldown, bounded attempts, OpenAI final fallback, logical-request budget fix. All slots individually live; real malformed response rotation observed;38 focused mocked provider/orchestrator checks passed. Shared quota bucket independence unknown.
- [x] P4: prompt constraints, schemas, verbatim claim validation, unsupported URL/ID/detail rejection, contextual origin; bounded input context and existing shape preserved;47 focused context/retrieval contracts passed. Semantic legal accuracy not claimed.
- [x] P5/P6: real arbitrary API workspace and actual PostgreSQL/published-KB API journey completed; assessment reuse, checkpoint protection, cached understanding/questions/empty decisions, reduced prompt duplication. Real latency/failures recorded, not hidden.
- [~] P7: final backend658 passed,3 live opt-in skips,36.45s; frontend13 unit checks; build/TypeScript39 routes passed; lint0 errors419 warnings; updated production browser26 passed1.3m. Full historical browser42 checks:34 passed8 failed. No aggregate-all-green claim.
- [x] Runtime covered journey: assessment ee5d95e9-8c9d-4c9e-be91-7c934886ecec; five questions; COMPLETED;6 APPLICABLE/57 NOT_APPLICABLE/30 UNVERIFIED; 102.308s; actual API login, profile, questions, synthesis, all workspace sections200; temporary QA account/business removed. Final search timeout/oversized captures rejected, zero captures in this run; deterministic existing knowledge remained usable. Real provider guidance rotated slot3 malformed→slot1 malformed→slot2 validated.
- [x] Arbitrary isolated real-provider assessment documented in docs/final-submission-live-assessment.json; two questions, normal persisted workspace with3 compliance/documents/workflows,1 scheme/standard; completed and no duplicate provider/discovery on completion. Test1 passed85.97s. Read that JSON for authoritative ID; no stale ID reused as a result.
- [x] P8: docs/backend-architecture.mmd active SerpApi/Crawlee, actual Gemini bounded rotated pool, contextual guidance and tenant persistence; frontend/Reference/current-product-scenario.md actual26-part scenario; docs/final-submission-report.md full changes/tests/limits/rollback.13 requested screenshot states captured and reviewed; admin border/header and hardcoded catalogue count fixes verified.
- [x] P9 scoped only: inert Firecrawl boundary, removed active imports/config, dependency lock, linter generated-report/CJS scope, task-related labels/imports. No broad cleanup or schema redesign.
- [x] Security/gates: actual11 sensitive env values absent from repository text/diff/frontend JS; .env untracked. Django check no issues16 existing silences; migration drift none; only ingestion0004 applied; pip check clean; git diff --check clean. Current URLs frontend localhost:3000/backend127.0.0.1:8000 return200; PostgreSQL/pgvector readiness confirmed. Native servers restarted with current code; no Docker.
- [!] Remaining submission gate:8 historical browser checks require obsolete seed credentials/business IDs/15-question legal output assumptions. They were run and failed; not silently skipped or satisfied with fabricated results. Full real-provider browser-login journey remains unverified independently; actual runtime API auth journey passed.
- [!] External: Google Auth client/Console production setup, Calendar/mail delivery tokens/channels, deployed browser/OS dependencies, independent expert corpus/coverage/evidence audit. Deployed RAG adapter live but service internals unavailable.
- [ ] Intentionally not completed: broad restructuring, distributed quotas/cooldowns/budgets, durable raw capture archive, expert legal-accuracy benchmark, deployment changes, commit/push.
- P10 honest freeze: implemented/tested current product with explicit remaining gates, not certified full submission readiness.

## FINAL FUNCTIONAL HARDENING — 2026-10-04 START
- [x] H0: current git/runtime re-inspected; SHA unchanged and existing dirty work preserved. PostgreSQL/pgvector readiness succeeds; native servers active. Authoritative instruction (1).md, scenario, report, diagram, progress, provider/planner/standards/tests read. Requested exact instruction.md still absent.
- [x] H1 reproductions: four new tests FAILED before fixes (docs/hardening-reproduction-tests.txt); alias dedup, wrong snapshot, cross-assessment answer mutation, foreign assessment substitution. Runtime Precision Workshop saved redundant workforce/activity questions. Backend has one contextual quality suggestion with no reviewed matching standard; no legal absence conclusion.
- [x] H1 focused fix gate:69 passed5.10s (docs/hardening-focused.txt), isolated mocked/local tests. Files: domain/context/business_context.py, apps/onboarding/planner.py/question_policy.py/services.py, intelligence/answer_interpretation.py/questionnaire.py, businesses/orchestration_views.py, tests/test_functional_hardening.py. Snapshot-scoped planning/answers, alias dedup, typed metadata and explicit question basis. New frontend suggestion/edit/standards changes require browser verification.
- [x] H2 provider baseline: three Gemini slots actual bounded JSON success; live independent OpenAI structured output validated2.847s; forced no-eligible Gemini selection followed by real OpenAI validated1.536s. Simulated selection and real final provider distinguished. Artifacts hardening-baseline-providers.json /hardening-baseline-openai-precision.json.
- [~] H3: standards scope/provenance, starter suggestions, full browser contract repair, five real journeys, regression/security/runtime restart pending. No new full-suite success claimed.

### 2026-10-04 H3/H4 — actual hardening regression gates
- [x] All five real native/PostgreSQL API journeys completed; distinct question sets, no repeated known canonical facts, no provider calls during workspace GETs or repeated completion. Actual acquisition failures and malformed/schema provider attempts retained in reports, not hidden. Final re-run is underway after negative-activity/search corrections.
- [x] New snapshot and emergency-understanding regressions:8 passed4.51s; focused search/context/provider set:58 passed6.36s. Orchestration now uses the selected snapshot; later question rounds are assessment-scoped. Local emergency understanding no longer invents Pune/Maharashtra, approved industrial estate or industrial obligations.
- [x] Actual BusinessUnderstandingEngine prompt/schema passed on Gemini slots1/2/3 (2.666/2.066/2.295s), independent OpenAI5.937s and controlled no-eligible-Gemini to real OpenAI4.733s. Selection was simulated; final OpenAI request was real. Quota-bucket independence remains unknown.
- [x] Current full backend re-run668 passed3 opt-in skips46.92s; frontend13 actual TypeScript unit checks passed. Initial backend scan failed because one new browser fixture used Windows encoding, corrected to UTF-8 without changing assertions.
- [~] Full browser run41 passed1 failed3.2m; remaining failure was an own-business test selector (State vs Operating state), corrected. New full browser run and real unmocked browser/manual-login journey active.
- [x] Files touched for functional defects: intelligence/orchestration.py/business_understanding.py, context/business_context.py, ingestion/query_planner.py/search_provider.py, providers/gemini_provider.py, onboarding/planner.py; RequirementCard/WhyThisAppliesModal and compliance/documents/workflows/schemes pages. Contextual descriptions are no longer rendered as verbatim evidence; no synthetic fact trace or verified-authority fallback. Cross-business URL scope excludes unrelated active assessments.
- [~] Screenshot review, final provider/five-business outputs, final security scans, diagram/scenario/report updates pending. No broad cleanup, secret change, commit or push.

### 2026-10-04 H5 — unmocked browser exposes hidden runtime defects
- [x] Mocked full browser42 passed2.7m, including the eight repaired historical contracts; actual unmocked browser/manual auth then completed backend assessment but failed its expected summary selector. Screenshot/log review exposed real25-second browser timeout during longer discovery, simultaneous fresh-user workspace creation409, and fabricated fallback metrics in legacy results (documents/workflows/deadlines). No live browser success claimed yet. Probe cleanup initially failed; exact temporary identity cleanup and re-run pending.
- [~] Fixes: models.UserWorkspaceState uses concurrent-safe get_or_create; long-running acquisition/synthesis/completion POSTs have180s bounded browser budget and no premature client fallback; onboarding reads canonical persisted compliance after completion. Removed invented result counts/zero-hallucination claims and preserves contextual origin. Connected-load field now asks HP only; question policy4 invalidates earlier presentation metadata. New unit/browser assertions and full regression pending.

### 2026-10-04 H6 — real browser and final regression evidence
- [x] Restarted native Django/Next with current fixes. Actual unmocked browser journey completed131.733s: manual registration/login, editable manufacturing starter, three unresolved questions, canonical assessment summary and nine workspace routes. All70 recorded API responses200/201; zero page exceptions and zero direct browser calls to Gemini/OpenAI/SerpApi. Tablet768/mobile390 standards have no horizontal overflow. Temporary cleanup command's trailing CLI argument was invalid; isolated cleanup repair pending, not claimed removed.
- [x] Complete backend671 passed3 opt-in skips91.54s (hardening-backend-final-gate.txt); complete browser42 passed3.1m (hardening-browser-final-gate.txt). Django checks clean16 silences; migration drift none; dependency check clean. TypeScript/build passed before H6 follow-up. Lint0 errors428 warnings.
- [x] Read-only actual Precision Workshop standards endpoint200: one contextual workshop-safety suggestion; zero reviewed matches; PARTIAL_SCOPE with truthful review note. Source reference is contextual, exact URL/citations absent; no supporting official hyperlink invented. Runtime PostgreSQL/pgvector and93 published requirements/34 rules confirmed. Eight actual configured sensitive values absent from757 repository text files,60 frontend JS chunks and git diff.
- [~] Real network traces also exposed two identical profile-home GETs per full route load: BusinessProvider fetched before authentication hydration and again after. H6 follow-up gates pending: wait for auth hydration; keep canonical power HP in profile display; remove unused fastDemoLogin with hardcoded credentials from public bundle; replace mandatory-filings summary label and show unreviewed items. Files: AuthContext.tsx, BusinessContext.tsx, AssessmentResultsSummary.tsx, standards/page.tsx, primary-journey.spec.ts, diagnostic scripts. No broader refactor. Existing test file CRLF-only whitespace warning also requires normalization.

### 2026-10-04 19:48 +05:30 H7 — final functional scope corrections
- [x] Real unmocked browser re-run245.6s including deliberate full reloads and network-idle waits across all workspace pages; zero page exceptions,140 API responses200/201, no direct external-provider browser traffic. Exact temporary identity and owned businesses removed successfully. Power question now HP only. Actual public captures retained; no production business modified. Artifact hardening-real-browser.json.
- [x] Authentication hydration prevents the mount/token duplicate fetch. New per-route request assertion exposed Schemes' separate duplicate profile-home fetch; page now uses BusinessProvider's existing tenant-scoped list. Full42 browser tests then passed2.9m. This is request correction, not a new state architecture.
- [x] Latest actual application provider re-probe reports final provider/model from safe telemetry: Gemini1/2/3 validated2.436/2.296/2.279s; independent OpenAI5.024s; controlled unavailable Gemini selection reaches real OpenAI5.167s. Final fallback now correctly recorded as OpenAI/gpt-4o-mini, rather than the initially requested Gemini model. Selection control is not a live outage.
- [x] Focused question/provider/acquisition/RAG/standards/workspace regression92 passed10.85s. Full backend remains671 passed3 opt-in skips; later backend edits only diagnostic telemetry/reporting. Build/TypeScript green39 routes; lint0 errors426 warnings; git diff --check clean after normalization. Removed hardcoded demo credentials absent from source and frontend chunks.
- [~] Visual review of actual documents exposed contextual checklist cards labelled Statutory Basis and requirement links losing assessment_id. Documents page now says Planning basis/Requirement basis, preserves assessment scope and avoids invented authority fallback. New browser regression and final43-test full run pending. All requested screenshot states captured; actual and fixture captures remain distinguished. Diagram updated with question fact gaps/dedup/suggestions and concurrent workspace resolution.

## FINAL FUNCTIONAL HARDENING FREEZE — 2026-10-04

- [x] Repository/runtime audit, reproducible bug inventory and minimal fixes completed. SHA remains e88e7248666057634d1ac807e2dc83c4bafd10cf; existing dirty tree preserved. `.env` untouched; no reset, commit/push, migration/framework/database replacement or broad cleanup.
- [x] Snapshot/answer/question isolation: selected immutable profile throughout orchestration, no foreign-assessment substitution, later rounds and instance updates scoped. Identity/alias dedup, known False/zero retained, at most five unresolved questions, policy4, numeric input contract and consistent HP. Exact files/tests/roots in docs/functional-hardening-report.md.
- [x] Starter suggestion confirmation/edit/refresh and last-answer edits verified in unit/browser tests. Real five-business plans contained zero suggestions, honestly recorded rather than forcing a redundant question. Actual question counts Manufacturing2, Restaurant3, IT1, Warehouse2, Healthcare3; repeated known facts0 each. Ten cross-business assessment checks404; no duplicate completion/provider work and no provider calls on workspace GETs.
- [x] Five real native PostgreSQL/API/provider journeys COMPLETED94.600/100.376/62.991/78.148/63.861s; full counts, IDs, failures, telemetry in hardening-five-businesses-final.json. All had93 engine catalogue decisions including30 UNVERIFIED, not93 obligations. Three used accepted HTTP captures; restaurant/warehouse captures failed. All five external RAG assessment results empty after filtering. Published KB/contextual guidance continued; no fabricated evidence/deadlines. Temporary QA records removed.
- [x] Real unmocked browser/manual login completed245.600s including deliberate full reloads/network-idle waits; three HP/contextual questions, canonical persisted summary and nine workspace pages.140 recorded API responses200/201; zero page exceptions/direct provider calls; no standards overflow768/390. Cleanup uses explicit safe QA ownership check; temporary identity removed. This live run preceded final Schemes duplicate GET and document label/link corrections, subsequently verified by the final browser gate.
- [x] Actual BusinessUnderstandingEngine provider probes: Gemini1/2/3 validated2.436/2.296/2.279s, OpenAI independently5.024s, controlled no-eligible-Gemini selection→real OpenAI5.167s; final provider/model safely captured. Healthy rotation, failure skip/cooldown/rejoin, malformed/schema/error classes, logical-budget chain, OpenAI once and total failure verified by mocks. Live malformed/schema errors retained. Quota-project independence unknown; controls are not claimed real outages.
- [x] Live SerpApi3 candidates1.082s; Crawlee1.7.2 HTTPX HTML4.605s, official PDF5.123s with HTTP engine/application-pdf, actual Chromium browser7.505s. Missing document/unofficial source rejected; empty/blocked/private/oversized/browser-failure paths tested. Deployed RAG capability2 accepted2 rejected2.292s; internals unavailable. Firecrawl inactive, no hidden runtime fallback.
- [x] Standards Precision Workshop exact saved assessment API200: one contextual quality suggestion, zero reviewed matches, PARTIAL_SCOPE. No exact URL/citations, no mandatory assertion. List/detail honors requested scope, error separate from empty, source reference/relevance displayed. Documents distinguish planning/requirement basis and preserve assessment links; modal never substitutes invented fact trace/quoted description/verified source footer. Counts and uncertain items honest.
- [x] Final focused92 passed10.85s; complete backend671 passed3 opt-in live skips91.54s; frontend13 passed; TypeScript/build passed39 routes; ESLint0 errors426 warnings. Final complete browser43 passed3.0m, including all eight historical purposes and new contextual-document scope check. New test's initial undefined assessment fixture corrected explicitly; assertions retained. Artifacts hardening-*-final/submission files and engineering report distinguish mocked, local, live and deployed checks.
- [x] Desktop/tablet/mobile, keyboard/dialog focus, reduced motion, onboarding, auth/register/duplicate/protected/logout, workspace errors/uploads, admin starters/review/permissions and landing CSS/CTA routes exercised by browser suite. Real and fixture screenshots reviewed; corrected inaccurate summary/document labels. No global skills/workflows introduced.
- [x] Current PostgreSQL/pgvector readiness healthy; Django check no issues16 existing silences; migration drift none/all applied; pip check clean; git diff --check clean. Final secret scan includes11 actual sensitive values/numbered Gemini and SERP aliases,775 text files/60 frontend JS files/diff, zero matches. Hardcoded credential helper removed and absent from bundle. Native frontend3000/backend8000 remain running with current application code.
- [x] Documentation: docs/backend-architecture.mmd shows actual question gaps/dedup, selected snapshot, concurrent workspace, existing retrieval/acquisition/rotating-provider/workspace boundaries. frontend/Reference/current-product-scenario.md updated; docs/functional-hardening-report.md contains ten requested factual sections. Prior submission report marked historical, not reused as current evidence.
- [!] External/knowledge limits: Google Auth client credentials/Console setup missing; Calendar delivery token/mail/object-storage live setup not verified; reviewed standard/sector coverage requires authoritative ingestion/expert review; SerpApi/official portals had real timeouts/blocked captures; deployed RAG internals unavailable. No expert legal accuracy/completeness benchmark.
- [ ] Intentionally not performed: broad cleanup, distributed budget/cooldown coordination, independent quota-project proof, durable raw archive, deployed RAG internals audit, deployment changes, live external Google/delivery/storage or live human-admin review, commit/push. These are not disguised as verified gates.
- Final engineering status: PARTIALLY VERIFIED, local functional fixes/regression and stated real-provider journeys verified with explicit coverage/integration limits. No fully-complete or legal-certainty claim.
