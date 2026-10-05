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

## CODEBASE STRUCTURE CLEANUP — 2026-10-04
- [x] C1 inventory/checkpoint: baseline b09dbf43438d032078bc9ab93bcaa60c5c14f65f, clean tree; cleanup playbook and frontend AGENTS read. AST inventory covered 273 backend Python and 216 frontend TypeScript files excluding generated/vendor files. No top-level Python import cycles. One intelligence-to-view helper dependency and four equivalent negation helpers identified; oversized modules and legacy fallbacks traced.
- Files changed: docs/codebase-structure.md and this existing progress file only. Structural assessment precedes code changes; no behavior changed. Keep existing SerpApi/Crawlee and Gemini pool despite historical Firecrawl wording.
- Validation: fresh backend baseline 671 passed/3 opt-in live skips in 54.98s using isolated SQLite; TypeScript passed; frontend unit13 passed; ESLint0 errors426 warnings. Tests/logs in OS temp, not new repository artifacts. No live providers called. Remaining: phased refactors and browser/build regression.
- [x] C2 backend boundary checkpoint: extracted apps/requirements/presentation.py and changed requirements/views.py, businesses/orchestration_views.py, intelligence/document_derivation.py to import metadata/explanations from it. Extracted intelligence/question_types.py, question_validation.py and question_fallbacks.py; questionnaire.py now owns compact lifecycle/persistence and retains existing import exports; answer_interpretation.py imports types directly. Removed the unreferenced old question-generation prompt/JSON cleaner. Structural reason: no intelligence-to-view dependency and explicit active versus historical question paths. Payloads, function bodies, rules, providers and migrations preserved.
- Validation: 119 focused backend/API/provider/intake/document tests passed, one opt-in live skip,13.50s. Ruff passes for the five extracted/rewritten modules; git diff --check passes. Frontend unchanged at this checkpoint; baseline TypeScript/lint applies. Remaining: frontend extraction, duplicated text handling, full backend/browser build.
- [~] C3 frontend extraction: app/onboarding/page.tsx now composes features/onboarding/OnboardingFlow.tsx inside the existing Suspense boundary. BusinessProfileStep.tsx owns profile/starter markup; AssessmentProgress.tsx owns recorded stage rendering; AssessmentDecisionResults.tsx owns deterministic result presentation; profileDefaults.ts owns existing offline options. State, HTTP calls, labels, styling, selected assessment and event sequence retained. Removed two unreferenced browser question generators/unused static step array after repository-wide reference search.
- Verification so far: TypeScript passes; frontend13 unit tests pass; scoped ESLint0 errors31 warnings; git diff --check passes. Extraction boundary/type mistakes were caught by TypeScript and corrected. Focused starter/own-business/browser journey is running before the phase completes. Remaining: dead sequential handler/state and shared helper cleanup.
- [x] C3 frontend checkpoint:4 focused Playwright starter/own-business/main-journey tests passed28.1s using explicit browser API fixtures. Existing API state machine, editable starter and normal workspace navigation exercised. TypeScript/unit gates remain green; no provider or database calls moved into rendering components. Full responsive/auth/admin browser suite pending final gate.
- [x] C4 shared contracts/text checkpoint: one domain/context/activity_text.py owns the equivalent negation behavior used by discovery.py, search_planning.py, synthesis.py and question_fallbacks.py. types/index.ts is now the stable public export barrel for13 domain-owned type modules with type-only dependencies; declarations and consumers preserved. test_status_contract.py now reads declared exports, retaining every existing backend/frontend enum and serializer assertion. Added5 negative-activity regression cases.
- Validation:55 related backend/contract/search/context tests passed7.43s; TypeScript passed; Ruff passes for new helper/test; git diff --check passes. No settings/provider reads or response shapes changed. Remaining: verified dead modules/handlers and final documentation/regression.
- [x] C5 dead-code/duplication checkpoint: removed the eight-file unrouted mock workspace family (ComplianceViews/BISAgent/StandardRow/DocumentRow/WorkflowRow/DeadlineRow/RegulationRow/lib/mockData), verified by TypeScript import resolution plus repository reference search. Removed OnboardingFlow's uncalled sequential handler, private state/setters and unused browser answered-key calculation; real wizard/API answers remain. Added requirements/selectors.py batch reads and shared evidence_citations in presentation.py; both compliance endpoints retain their individual payload projections.
- Validation:46 backend compliance/orchestration/workspace/contract tests passed,one live skip10.01s;103 canonical TypeScript declarations are textually unchanged apart from comments/whitespace; TypeScript and13 frontend tests pass. Scoped lint0 errors; legacy any/type warnings remain. Git diff inspected, no migrations/routes/providers/config changed. Existing literal stdout imports had CRLF-sensitive removal; corrected before final lint. Full suite and browser checkpoint pending.
- [x] C6 documentation checkpoint: README.md/frontend/README.md now explain actual ownership, run/test commands, active SerpApi/Crawlee, rotating Gemini/OpenAI, retrieval limits and environment boundaries. docs/codebase-structure.md includes initial assessment, all domain ownership, exact request/LLM/retrieval/evaluation/workspace traces, frontend boundaries and remaining debt. docs/backend-architecture.mmd shows intake adapter and shared requirement read/presentation modules. ARCHITECTURE.md retained but explicitly historical; unsupported old test/provider/deployment claims are no longer labelled current.
- Validation: documentation paths/current imports inspected;103 TS declarations unchanged; no active Firecrawl or duplicate provider introduced; git diff --check passes. Baseline Ruff824 findings vs current816 (existing broad lint debt); new/extracted modules pass scoped Ruff, no rule suppressions added. Full backend/build checks running; final browser/type/lint/security checks pending.

### 2026-10-04T22:45:25.1740944+05:30 C7 — cleanup validation and handoff
- [x] Final full backend676 passed3 opt-in live skips48.30s; frontend13 passed; TypeScript and production build pass; all43 browser tests pass3.0m against the fresh production build on isolated3001. First full suite had675 passes/one outdated workflow barrel-reader failure; test_compliance_workflows.py now verifies public status export then all original enum assertions, final rerun green. No tests deleted or weakened.
- [x] Django check no issues16 existing silences; migration drift none/applied check passed; no model/migration/auth/provider/config/evaluator changes. Absolute+relative top-level import graph has no cycles and no intelligence-to-view imports.103 canonical TS declarations preserved. Scoped Ruff clean; broad existing Ruff824->816 findings and ESLint426->382 warnings(0 errors) documented, not falsely marked globally clean.
- [x] Screenshot review: editable starter/profile and mobile workflow retain current styling. Network/tenant/assessment isolation/error/review/key navigation purposes exercised by existing full browser/API tests. No actual provider probes rerun; no live health or legal coverage claim. Secret scan11 actual sensitive values across843 repository/bundle text files:0 matches; git diff --check passes. No suppression or debug output added.
- [x] Final ownership/assessment/debt/validation report: docs/codebase-structure.md. Progress history preserved here. Sources changed in coherent backend boundaries, onboarding feature presentation, type contracts/shared helpers, dead mock workspace and documentation groups. Frameworks/database/deployment architecture preserved. Changes remain local, not committed/pushed.
- [!] Automatic approval review rejected optional restart of the existing frontend and shutdown of the QA frontend with "blocked by policy". Rejected command stopped no process. Verified production QA build remains on http://127.0.0.1:3001; existing3000 server not restarted. Existing next-start standalone packaging warning retained, deployment configuration untouched.
- Remaining debt: large planner/orchestrator/calendar/workflow/admin modules and other product pages; constants-only feature folders; legacy fallback compatibility; unused alternative landing/dashboard ownership review; existing JSON any types/global lint debt; historical documentation/artifacts; external provider/knowledge limits and process-local coordination. No indiscriminate rename, abstraction/repository framework or broad deployment rewrite performed.

## SOURCE GROUNDING / STANDARDS / SCHEMES HARDENING — 2026-10-04

- [x] G0 contract and investigation: full new hardening specification read; SHA b09dbf43438d032078bc9ab93bcaa60c5c14f65f, existing uncommitted cleanup preserved. PostgreSQL runtime inspected read-only; existing assessment reproduces smart-meter APPLICABLE from ELECTRONIC/METER substring rule and copied catalogue descriptions (apparel/dyes). No provider credential values printed. Fresh baseline focused backend69 passed7.83s.
- Audit ledger: standards use selected decisions but sparse source projection/metadata mandatory claims; schemes ignore eligibility predicates/currentness/verification and confuse imports with exports; provenance can substitute configured portal or invented eligibility sentence; AST Kleene primitives work but narrative-only product predicates overpromote; LLM validation omits nested explanatory fields; workflow case reuse is business/requirement scoped rather than selected assessment/profile; onboarding restores stale unscoped run ID; starters precede form; analysis lacks persistent wait message. These are confirmed code paths, not a legal-completeness finding.
- [~] G1 implementation ownership: backend standards/schemes/provenance; LLM output/snapshot documents/workflows; frontend state/source/layout/analysis; lead AST integrity/requirement projections/telemetry/integration. No broad cleanup, new database/provider/framework, or business-specific exceptions authorized. Regression/build/browser/live response/source-link verification pending.
- [x] G1 focused correctness gates:11 initial product-scope/source regressions passed4.39s; integrated new AST/provenance/LLM/snapshot suites97 passed1 opt-in skip6.65s. Invalid scope is isolated, narrative-only standard matches remain unverified, typed concrete scope may decide, legacy standard display is downgraded without rewriting its recorded status. Requirement explanations now use saved trace facts instead of unrelated catalogue examples. Source URLs and titles select one persisted citation; application portals remain separate.
- [x] G2 backend ownership fixes: eligibility predicates/currentness/verification and explicit negatives now gate schemes; import-only is not export-only; keyword boundaries prevent IT/EV substring matches; failed acquisition cannot publish VERIFIED; source/evidence projection uses recorded exact URLs and rejects homepage substitutions. Workspace output validates nested text/IDs/quotes/numbers/source references; assessment/profile-specific cases/docs preserve historical facts; unknown outcomes/checklists cannot become mandatory. Agent checkpoints49 backend matching tests and83 grounding/workspace tests passed; full final suite still running.
- [x] G3 frontend gates:16 unit tests, TypeScript and production build passed. Six new browser regressions passed11.8s on fresh production3002: optional starters below primary form, editable values, explicit assessment replaces stale storage, completed snapshot reads, one analysis request and persistent1–2min message, exact bound source/contextual states and stale schemes response rejection. Full browser regression pending. Existing3000/3001 processes preserved; no restart requested.
- [~] G4 real runtime matrix: six synthetic QA businesses running through authenticated native PostgreSQL API views and real configured external providers, with temporary identities removed by diagnostic cleanup. First three completed163.334/102.426/70.961s; provider/schema/acquisition failures retained. These are live API journeys, not browser or expert legal completeness validation. Final counts/timings/provenance/manual source checks pending.
## RESUME STATE — 2026-10-05T08:17+05:30
- [x] R0 continuity inspected: SHA b09dbf43438d032078bc9ab93bcaa60c5c14f65f, dirty tree and prior cleanup/hardening preserved. No reset/revert, migrations or credentials changed. Current AGENTS, progress, reports, partially written schemes provenance and test logs inspected; prior agents reused with distinct ownership.
- Completed evidence: frontend16 unit, TypeScript/build passed; full browser49 passed3.1m. Six real-provider API journeys completed with temporary identities removed. These precede final scheme quarantine/question grounding changes and are not claimed final validation.
- [~] R1 unfinished: active question response validator was shape-only; cached planner restored unsourced explanations; questionnaire version4 bypassed normalization. Implementing generic legal-reference/outcome guard, cache normalization and policy version5. Scheme quarantine is written but focused/full regression still pending.
- Last full backend gate:754 passed2 failed3 opt-in skipped87.60s. Status-GET test expected obsolete re-orchestration503; new standard fixture selected all golden decisions using .get(). Both corrections are present; final full rerun pending. New root18 scope/projection tests passed4.91s; related44 passed1skip5.76s.
- [ ] Next gates: focused new question/quarantine regressions, full backend, settled source screenshots, final real six-business rerun, exact source-link checks, diff/security review and factual hardening report/architecture handoff.

### 2026-10-05 G5 frontend settled-state visual checkpoint
- [x] Resume inspected existing task progress, branch feat/api-orchestration, test code and ignored screenshot artifacts; prior implementation preserved. Only frontend/e2e/source-grounding-hardening.spec.ts changed for screenshot capture and stronger navigation synchronization. Added captures after settled source/evidence assertions, analysis wait assertion and editable starter assertions, with scroll reset before full-page screenshots.
- [x] Exact current command: PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 npx playwright test e2e/source-grounding-hardening.spec.ts --reporter=list. Final result: 6 passed, 11.7s, Chromium production build on existing QA3002. Assertions preserved; detail URL and level-1 heading checks added because the outgoing standards-list source link could satisfy an assertion before App Router finished navigation. No product change or rebuild required.
- [x] Reviewed six ignored screenshots via image inspection: grounding-onboarding-starters-desktop.png, grounding-onboarding-starters-mobile.png, grounding-analysis-wait.png, grounding-standards-source.png, grounding-standard-detail-source.png, grounding-scheme-source-states.png under frontend/test-results. Form/progression precedes optional starters; editable profile and selected starter remain visible; mobile has no horizontal overflow; analysis displays the persistent 1-2 minute message and real awaited status; source cards show exact publication links, contextual/candidate/negative classifications and explicit missing-source/excerpt states. Earlier sticky-header screenshot artifact was corrected by scroll-to-top capture synchronization.
- [x] Read-only cross-agent review: normalized SCHEMES/STANDARDS stages in backend/domain/intelligence/orchestration.py preserve source, evidence, status/eligibility_status, matched facts, origin and rule-version metadata. Dedicated frontend pages consume grounded API projections; onboarding uses stage results for counts only. No code outside assigned browser test/progress changed at this checkpoint.
- Limitation: these are explicit browser API fixtures, not live legal/source/provider verification. No external integration success inferred from screenshots. Live matrix/source validation and final report remain lead-owned.

### 2026-10-05T08:21:33+05:30 G5 — scheme provenance and eligibility checkpoint
- [x] Resumed from actual feat/api-orchestration dirty tree; prior source/projection/AST/cleanup work preserved. Scope stayed in backend schemes/provenance and matching regressions. No provider, authentication, migration, framework or database rewrite.
- Confirmed root causes: optional 'export conformity' wording was misread as an exporter-only applicant restriction; all current legacy scheme terms matched authored HTML fingerprints despite recorded VERIFIED markers. Matching/catalog no longer expose authored fixture terms as sourced recommendations. apps/schemes/provenance.py compares both stored content_hash and rehashed durable version fields against cached authored fixture fingerprints; no business/scheme-name exception. Original database rows and recorded_verification_status remain intact.
- Files changed: apps/schemes/provenance.py, presentation.py, engine/eligibility.py, engine/matcher.py, views.py, pipeline/snapshots_data.py and pipeline/service.py; tests/test_source_matching_hardening.py and test_schemes_pipeline.py. Shared provenance produces UNVERIFIED/AUTHORED_FIXTURE, null source URL/authority, no quoted evidence for quarantined records. Authored-only catalogue returns SOURCE_REVIEW_REQUIRED plus excluded_unreviewed_count. Reviewer edit notes remain diff metadata; authored provenance carries into edited versions without fabricated source quotes. Independently captured synthetic metadata with a different content fingerprint remains available for ordinary matching.
- Historical matching/API/catalog tests now use explicitly synthetic non-authored records to retain jurisdiction/sector/MSME/filtering behavior assertions alongside authored fixtures. Parser/version/hash/rollback fixtures remain historical. New regressions cover optional export conformity, explicit exporter-only exclusion, field fingerprint despite altered recorded hash, unchanged recorded VERIFIED marker, absent quoted evidence, neutral catalogue, non-fixture records and reviewer-edit lineage. A full-suite-sensitive results.get() now selects the fixture's requirement_id explicitly.
- Exact validation: `.venv/Scripts/python.exe -m pytest tests/test_source_matching_hardening.py tests/test_standards_hardening.py tests/test_schemes_pipeline.py -q` => 62 passed in 6.65s. Scoped Ruff for evidence/presentation.py, scheme eligibility/presentation/provenance, standards_discovery.py and the new test module => passed; git diff --check for owned scheme/test paths => passed (only CRLF normalization notices). No live provider call or legal-completeness claim in these focused tests.
- [!] Remaining concern: quarantine deliberately reduces visible reviewed scheme coverage; authoritative acquisition and explicit expert/source review are still required. Old schema does not bind a scheme version to a durable acquisition record/page title, so unavailable capture dates/methods remain null rather than inferred. Root owns final full backend/browser/build gates and external/runtime report.
### 2026-10-05T08:25+05:30 R1 question grounding checkpoint
- [x] Root changed apps/onboarding/question_policy.py, planner.py, domain/intelligence/output_safety.py, questionnaire.py, orchestration.py and tests/test_grounding_snapshot_hardening.py. Active interview validation rejects unsupplied instrument/standard IDs, thresholds and final legal claims; ordinary operational ranges stay valid. Legacy legal preamble can be removed while preserving question/fact identity; unsafe options/questions are not shown; unsupported explanations become source-discovery language. Cached DB plans use the same projection and questionnaire policy5 replaces legacy4 bypass; orchestration persists matching version5.
- [x] Focused question/grounding/planner/related API81passed1opt-in skip6.80s; subsequent final grounding/planner65passed5.24s includes persisted-cache regression; scoped Ruff output_safety/question_policy/newgrounding/newscope tests passed. No model/migration/provider/order/authentication changes. Saved historical questions remain recorded; read projection is cautious.
- [~] Full backend and final six-business real-provider journeys started against these final runtime corrections. Earlier live matrix is pre-quarantine evidence only; final report will distinguish outcomes and retain actual provider/source failures. Full browser49passed plus settled source6passed11.7s remain applicable: no frontend product changes since build.
### 2026-10-05T08:31+05:30 R2 full backend and stale-cache checkpoint
- [x] Full backend782passed3opt-in live skips36.23s. Initial resumed full gate779passed1failed3skip revealed empty assessment initialization was wrongly rejected by the added snapshot guard. Corrected from_business to allow an explicitly empty intake context without inheriting a later business profile; analysis still rejects missing snapshot. Added regression and retained tenant-isolation assertions.
- [x] Related cache/snapshot/API98passed6.18s; sequential cached question projection/onboarding60passed5.38s. GET questions upgrades legacy policy4 safely, counts only answers to returned question IDs, and cannot let an unrelated saved answer imply completion. SCHEMES/STANDARDS API reads delegate to versioned grounded projection rather than return old direct cache; v2 invalidates earlier provenance cache. Sequential next-question uses the same known-fact/source guard instead of raw stored wording.
- [x] Django check no issues16 existing silences; makemigrations --check --dry-run no changes; migrate --check passed. Scoped new/owned helpers+regression Ruff clean; git diff --check clean.
- [~] Source-link runtime probe: PostgreSQL/pgvector healthy, all36active scheme rows match authored fingerprints and are quarantined without DB mutation. Three actual captured URLs returned200 (oneHTML/twoPDF), but the HTML path contains Login.aspx and bypassed URL-shape guard. Correcting backend/frontend generic path-segment handling and regression; initial probe script title-field typo corrected (RetrievedDocument uses source.title).
- [!] Final live matrix restaurant encountered actual all-provider workspace schema/JSON rejection and503; not classified as successful workspace. Targeted bounded diagnostic is checking false-positive versus rightly rejected model claims. Inputs/facts retained; no fake result inserted. Matrix continues remaining businesses; report pending.
### 2026-10-05T08:35+05:30 R3 live grounding diagnosis
- [x] Six resumed real API journeys finished:4completed on published decisions; restaurant/healthcare returned controlled503 during contextual synthesis. All6saved0contextual guidance in this run; no success inferred from transport or200alone. Temporary identities cleaned. Final report preserves this failed run instead of replacing it with later success.
- [x] Two bounded synthetic restaurant diagnostics isolated correctly rejected unsupported monetary/legal details, invented numbers and final applicability. Separate internal false positive reproduced: correctly restated saved annual turnover in INR was rejected as a statutory amount. Targeted observational-fact correction/prompt clarity is underway; no broad monetary acceptance.
- [~] Actual Gemini adapter ignored response_format=json_object in its request while checking JSON only after generation. Added native responseMimeType=application/json for explicitly structured calls, preserving plain calls, rotation/cooldown/budget/OpenAI and grounding validation. Google generateContent GenerationConfig documentation verified; regression request-body test added. Provider/focused validation running; real final retest pending.
- [x] Login.aspx/search.php path source links now rejected in both backend/frontend helper, with regressions. Frontend16unit passed via node --test --experimental-strip-types tests/*.test.ts; TypeScript/build passed. npm test is not configured (initial invocation failed without tests), no package added. Fresh production QA3003 PID14040 started; existing3000/3001/3002 and8000 preserved. Full browser suite on final build running.

### 2026-10-05T08:49+05:30 R4 final-provider and cross-review checkpoint
- [x] Agent financial grounding/prompt fixes are stable: exact named current turnover/investment may be restated, never treated as a fee/subsidy/threshold; suffix of workers cannot be parsed as Rs. Related131 tests passed5.87s. Gemini structured calls now request native application/json; plain completions unchanged. Final pre-cross-review full backend806passed3opt-in live skips40.06s; Django check no issues16silenced, migration drift none/all applied. Scoped new/helper Ruff passed after correcting touched workspace import/one-line formatting warnings; no behavior change in that formatting.
- [x] Final production3003 browser49passed2.8m; frontend16unit/TSC/build passed, full ESLint0errors382warnings. Six fixture screenshots reviewed at desktop/mobile, including loaded standards detail; fixtures are not live legal/provider proof.
- [x] Six real PostgreSQL/API journeys after JSON/prompt corrections completed: Manufacturing53.730s, Restaurant74.287s, IT48.030s, Warehouse46.198s, Healthcare67.444s, EV battery61.591s. Question counts3/3/1/1/3/2, repeated known facts0 and starter suggestions0 each. Contextual compliance counts0/3/2/0/3/2; saved standards/scheme planning1each, reviewed standard matches0.15 cross-business assessment checks404, workspace GETs0provider calls, temporary identities removed. Raw checkpoint: temporary QA six-freeze-final.json/log. No fabricated reviewed schemes;36 authored versions quarantined.
- [!] This live search gate hit actual SerpApi HTTP429/cooldowns. Restaurant obtained5candidates1official, no usable capture; other businesses0candidates/captures. External retrieval remained empty. Workspace completion is not search/acquisition success or legal-completeness proof. Earlier real HTTP capture/source-link probes remain separate evidence.
- [~] Cross-agent review found remaining real gaps: follow_up_questions omitted grounding validation; historical WorkspaceGuidance could bypass current validation; workflow progress/read and step write could cross assessments sharing one profile; documents/workflows could reuse a legacy narrative-only standard's APPLICABLE marker. Explicit owners now fixing only those boundaries and adding regressions; final gates will rerun. Root corrected document derivation/case creation to reuse cautious decision projection and preserve historical rows. Focused77passed6.99s including new legacy standard regression. One initial test command referenced a nonexistent file and ran no tests; corrected command above actually passed.
- [ ] Final scope/cache gates, new browser mutation-switch regressions, documentation/report and final secret/diff review remain unfinished. Existing unrelated cleanup preserved; no reset, environment secret changes, commit/push or architecture rewrite.

### 2026-10-05T09:00+05:30 R5 cross-review corrections and final integration
- [x] Follow-up and cached guidance: output_safety.py/workspace_guidance.py plus new test_workspace_cache_grounding.py now validate typed max5 followups, known false/zero/alias dedup, nested illegal content, current snapshot and recorded passages on historical reuse. Original local IDs/parent links survive valid read projection; invalid history stays stored but is excluded. GET is SELECT-only/no provider, explicit analysis can regenerate, generation metadata/hash includes grounding policy1. Focused159passed7.94s; interim full838passed3skips46.78s. No migrations.
- [x] Backend workflow read and step mutation now scope exact assessment as well as profile; historical narrative-only standards cannot create current workflows. Frontend documents/workflows captured context guards reject late mutation responses; persisted portal checkbox is used after reload. New backend3 regressions reproduced failure before fix; related13passed4.88s. New browser4passed10.5s on fresh3004 PID9172; desktop fixtures cover persisted/late portal response, late upload modal, late completion and late notes. Older3003 test attempt failed hydration because build regeneration invalidated its static chunks; fresh3004 passes without weakening assertions. Final full53browser underway.
- [x] Shared standard_mandatory_status in requirements/presentation.py is now used by standards_discovery, document derivation and case checklist creation: explicit voluntary=False, missing/unbound mandate=None, True only published linked rule, concrete scope and bound reviewed exact-source passage. Metadata alone cannot require a document. Root case_service now reads selected historical facts and recorded trace, treats LLM cases as contextual, never manufactures a statutory mandate when evidence is absent, and displays canonical numeric power as HP. Historical records remain untouched. Focused root legacy/cache/mandate/case61passed11.93s; agent mandate/source73passed5.52s; scoped helper/newtest Ruff passed.
- [x] Independent real application BusinessUnderstandingEngine probes: Gemini original slot1/2/3 validated2.191/2.734/2.510s using gemini-3.5-flash-lite; OpenAI validated5.831s gpt-4o-mini. Each Gemini credential was isolated in a one-slot process setting and reverse fallback disabled; in-process telemetry slot1 denotes the isolated pool, safe report original slot preserves identity. These are actual successes, not forced-outage tests. Pool/error/quota/schema failure tests remain mocked; shared quota project independence unknown.
- [x] docs/source-grounding-hardening-report.md drafted with actual roots/checkpoints/source gaps; docs/backend-architecture.mmd updated for policy5, grounded cache1, exact provenance, authored scheme quarantine, typed scope and read-only status. Secret scan11actual sensitive values including numbered Gemini andSERP aliases,834repository textfiles/60frontendJSfiles/diff => zero matches. Environment untouched. git diff --check passed.
- [~] Final full backend and six-business live gate re-launched after the actual cache/workflow/mandate changes, because earlier real six run does not prove the new read-boundary behavior. Artifacts in temporary complywise-source-grounding-qa: backend-final-integrated.log, browser-final-cross-review.log, six-final-integrated.json/log, provider-freeze.json, final-security.json. Inputs/temporary identities are diagnostic-only and cleaned finally; no hardcoded application result. Exact next unfinished task: inspect final gate outcomes, resolve actual regression if any, finalize report/progress/diff and stop editing.

### 2026-10-05T09:09+05:30 SOURCE GROUNDING HARDENING — FINAL VERIFIED CHECKPOINT / RESUME HANDOFF
- [x] Existing branch/SHA/unrelated dirty cleanup preserved. Focused root causes, source projections, scheme eligibility/provenance quarantine, typed AST scope, grounding including historical cache/followups, selected snapshots, same-profile workflow isolation, late UI mutation guards, onboarding placement and honest analysis/status corrections are implemented and regression-tested. No company-specific rule exception, new legal threshold/source, framework/auth/schema rewrite, environment change, reset, commit or push.
- [x] Final full backend `.venv/Scripts/python.exe -m pytest -q` =>863passed3opt-in live skips55.78s, includes final contextual-case/no-checklist status correction. Frontend `node --test --experimental-strip-types tests/*.test.ts` =>16passed; `npx tsc --noEmit` passed; fresh `npm run build` passed; full `npx eslint .` =>0errors382warnings. Final full `PLAYWRIGHT_BASE_URL=http://localhost:3004 npx playwright test` =>53passed3.2m. Focused/new helpers/tests Ruff passed; baseline lint findings in older backend modules were not broadly cleaned. No failed test was deleted/weakened; initial nonexistent command and stale server/chunk attempts are documented as failures, not passes.
- [x] Final Django check no issues16silenced; makemigrations --check --dry-run no changes; migrate --check passed. Actual readiness8000 and fresh login3004 HTTP200. Native final QA frontend3004 PID9172 works; existing8000/3000/3001/3002/3003 processes preserved. Older QA servers can reference removed build chunks; use3004 for the final build.
- [x] Final six real PostgreSQL/authenticated APIClient/provider journeys COMPLETED: Precision Workshop48.425s, Restaurant49.889s, IT73.031s, Warehouse55.626s, Healthcare58.191s, EV54.721s. Questions2/3/1/2/2/2, repeated knownfacts0 each, suggestions0 each. Different business topics recorded verbatim in docs/source-grounding-validation.json. APPLICABLE counts2/0/2/2/0/6; contextualcompliance0/3/2/0/3/1; totaldocuments6/3/8/6/3/25; workflows2/3/4/2/3/7. No invented calendar events:0 all. Fifteen cross-business checks404; workspace GETs0provider calls; completion extra provider calls0; all temporary QA identities removed.
- [x] Live fallback genuinely exercised: IT workspace Gemini3 schema failure5.135s →Gemini1 schema failure4.083s →Gemini2 validated4.588s; clinic question Gemini2 malformed response →Gemini3 success. Errors were neither hidden nor turned into fake output. Independent slot1/2/3/OpenAI actual application probes recorded in validation JSON; total-exhaustion/quota/timeout simulations remain separately mocked. No provider key/project independence claim.
- [!] Final live source acquisition is NOT verified green: all six SerpApi discovery attempts FAILED withHTTP429/cooldown,0candidates/0accepted/0captures. External retrieval EMPTY with3rejected/0accepted each. Persisted KB/contextual planning continued without pretending acquisition succeeded. Reviewed standard matches0; five contextual quality/support areas, Precision Workshop0 in final model generation with correct PARTIAL_SCOPE.36active authored scheme versions quarantined, history retained. Authoritative source ingestion/expert review and search quota/rate availability remain real blockers to stronger coverage. Remote RAG internals unavailable; no local vector index or legal-completeness claim.
- [x] Durable documentation: docs/source-grounding-hardening-report.md contains exact roots/files/gates/source limits, docs/source-grounding-validation.json retains sanitized real six matrix/provider attempts and separate tests/security gates, docs/backend-architecture.mmd reflects actual active runtime boundaries. Task progress history retained. Final exact-secret scan11values/835repositorytextfiles/60frontendJSbundles/diff =>0matches; git diff --check passed. Credentials never printed/changed.
- [ ] Intentionally not done: broad cleanup, deployment/commit/push, bulk historical data deletion/relabel, new authoritative law/standard/scheme seeding, expert legal completeness benchmark, distributed pool coordination or remote RAG internal audit. Current implementation task has no remaining known failing regression. Next external work: restore SerpApi capacity and ingest/review exact authoritative sector/standard/scheme sources, then rerun the acquisition/retrieval gate; do not redo this completed audit or revert valid changes.
- Final engineering status: **PARTIALLY VERIFIED** — focused implementation/local/backend/frontend/browser/provider gates green; fresh live acquisition and reviewed knowledge completeness explicitly limited. This checkpoint supersedes intermediate pending statements above without erasing their evidence.

### 2026-10-05 resumed contract verification — latency gap
- Continuity: inspected status/diff, complete 1042-line contract, frontend AGENTS, reports, latest temporary backend/browser logs and existing tests/migrations. Prior final 863 backend / 53 browser successes are confirmed; all existing dirty work is preserved. No agents spawned and no audit restarted.
- Next external gate attempted: one configured SerpApi application search returned HTTP429/rate_limit in 0.569s. No credentials/configuration/database content changed. Fresh integrated acquisition remains unavailable.
- New local contract gap: section19 requires separate acquisition, retrieval, answer submission and workspace persistence measurements; existing stage/provider timings do not expose all these phases. Implement additive timing metadata in existing paths, then run focused instrumentation/grounding/API regressions. Historical green results do not yet validate this addition.
- Exact next unfinished local task: phase timing instrumentation and regression validation; subsequent external task remains successful acquisition plus authoritative ingestion/review.

### 2026-10-05 resumed instrumentation milestone
- Added safe phase timers in existing telemetry, acquisition/discovery, synthesis/workspace and answer API paths. Source discovery times the joined parallel batch; captures accumulate actual attempt durations including failures; local/remote retrieval, deterministic evaluation, LLM synthesis and committed workspace persistence are separate. Recorded stage totals exclude user think time. Detailed values persist with discovery/stage records and are returned by read-only status. Timing fields never enter prompts or generation hashes; cached work is not reported as newly executed.
- Focused instrumentation/grounding/cache/orchestration gate:177passed1opt-in skip8.98s. Full backend after timing changes:869passed3opt-in skips43.08s. New helper/test Ruff clean; Django check no issues16silenced, no migration drift/applied check passed. Frontend code unchanged; prior final frontend/build/browser evidence remains separate.
- Final bounded URL check found empty resource-query and search-query loopholes in backend exact_source_url. Fix now written with7 new cases, preserving nonempty exact document IDs and preventing empty IDs from supporting reviewed-source status. This later fix still needs its validation gate.
- Exact next unfinished task: validate URL and mandatory/source regressions, inspect one actual current API timing payload, update report/validation record and final diff review. Live SerpApi remainsHTTP429; reviewed ingestion/expert review is still incomplete.

### 2026-10-05 15:36 IST — resumed final handoff
- [x] Section19 instrumentation and source-query gaps implemented and validated. Final full backend876passed3opt-in skips38.14s; focused source/mandate/API/cache/instrumentation111passed6.55s. New helper/test Ruff, Django/migration checks and diff whitespace checks passed. No new migrations, frontend product edits, agents, resets, commits, pushes, environment changes or server restarts.
- [x] Actual final manufacturing API payload: COMPLETED75.835s; answer submission2217.90ms, joined search419.38ms, regulatory retrieval945.55ms, deterministic evaluation864.46ms, local retrieval136.81ms, synthesis7626.17ms, workspace persistence536.41ms. Workspace GET/provider and completion-extra/provider calls0. Temporary QA identities cleaned. IT79.380s separately verified runtime phase logs before the final completion projection; final manufacturing verifies that projection. No acquisition duration invented when no capture attempted.
- [x] Updated report contains contract-section coverage table and actual remaining gates; validation JSON preserves previous six journeys and adds resumed checks. Fresh secret scan11values/820repositorytextfiles/60frontendJS/diff =>0matches. Prior frontend16unit/TSC/build/ESLint0errors382warnings/browser53 remain recorded earlier successes, not new reruns.
- [!] Still partial: bounded configured SerpApi search and both resumed live journeys returnedHTTP429;0fresh captures, no accepted remote retrieval. Reviewed exact-sector standards/schemes and battery/EPR knowledge coverage require authoritative acquisition/ingestion/expert review. No claim that all contract gates are complete.
- Exact next unfinished task: restore SerpApi capacity externally, then bounded fresh acquisition/retrieval and authoritative source ingestion/review. All known local fixes now pass. Preserve this final code and evidence; do not redo the audit or earlier agent work.
