# ComplyWise submission verification — 2026-10-04

Historical submission-pass report. Current functional fixes and re-run evidence are in [functional-hardening-report.md](functional-hardening-report.md) and `frontend/Reference/task-progress.md`; test counts and browser limitations below describe the earlier pass, not the current gate.

## Status

Implementation preserves the existing architecture and dirty working tree at baseline SHA e88e7248666057634d1ac807e2dc83c4bafd10cf. The current product has verified local, browser-fixture and real-provider journeys. **The entire historical browser suite is not green: 34 passed /8 failed.** No blanket submission-ready or legal-accuracy certification is made.

## Implemented

- Visible editable seven-profile chooser and own-business reset: frontend/data/businessStarters.ts, components/onboarding/DemoPresetSelector.tsx, app/onboarding/page.tsx. Same chooser for adding a business and admin creation.
- Admin creation: frontend/components/product/AdminBusinessCreation.tsx, app/admin/businesses/page.tsx; backend/apps/businesses/admin_creation.py and config/api_urls.py. Superuser-only transaction; manual existing/new owner credentials; immutable initial profile; no privilege grant or token return. Reviewer shortcut opens normal onboarding.
- SerpApi search adapter: backend/apps/ingestion/search_provider.py; active integration in ingestion/services.py, intelligence/discovery.py, settings, health. Firecrawl network logic retired; zero active search/acquisition/vendor fallback calls. Legacy migration/history/test filenames preserved where appropriate.
- Real Crawlee: domain/acquisition/crawlee_provider.py; dependency pins in requirements.txt, pyproject.toml, uv.lock. HTTPX transport fixes observed Ministry PDF TLS failure; browser rendering fixes thin HTTP shells. Isolated request queues avoid reused requests. Source/domain/public destination/redirect/MIME/text/size/hash guards; missing-document homepage redirect rejected. Source + RetrievedDocument and existing review boundaries retained.
- Gemini healthy round robin, cooldown and bounded pool: providers/gemini_provider.py, openai_provider.py, http.py, telemetry.py. Logical request IDs prevent three failures from consuming the logical-call limit before OpenAI. Workspace section reads do not fail just for an exhausted LLM budget.
- Output/evidence constraints: intelligence/output_safety.py and prompts in business_understanding.py, questionnaire.py, synthesis.py, workspace_guidance.py, onboarding/planner.py, ingestion/claim_extraction.py, assistant/services.py. Application validation lives inside provider fallback attempts; exact claim quotations and unsupported-detail rejection. Contextual guidance remains separate from published rules.
- Actual gaps: assessment adoption under lock; protected server checkpoint metadata; understanding reuse; no competing question generation; resume state/effect replay fix; selected assessment scheme/standard scoping; no fake STD evidence IDs; contextual/unknown statuses preserved; empty result caches reused. Files: orchestration.py, businesses/serializers.py, frontend/onboarding.
- Prompt-size fix: repeated full discovery documents and detailed decisions produced >41k input tokens in runtime QA. Bounded structured evidence excerpts plus compact published decision identity/status reduce the observed successful guidance input to6927 tokens. Full captures stay persisted. Regression preserves downstream context shapes.
- Form/screenshot fixes: product.css, Overlay.tsx, AdminBusinessCreation.tsx; sticky dialog heading, actual styled input borders, selected starter focus. Boolean labels are Yes/No; no implied applicability. Schemes removed hardcoded36-count claims.
- Coarse MSME classifier requires both facts and uses current2025 classification, retaining historical as_of; not entitlement/registration. Revised limits independently checked against the [Ministry of MSME definition](https://msmedi-chennai.gov.in/GARMS_Admin/MSMEdefinition.aspx) and its [official notification](https://msmedi-chennai.gov.in/GARMS_Admin/basictools/images/MSME%20GazetteNotification-S.O-no-1364-E-dated-21.03.2025-Revised-Definition.pdf). Existing legal AST rules were not republished.

## Acquisition

Search vendor confirmed by the user: **SerpApi**, Google engine, GET [search.json contract](https://serpapi.com/search-api). Setting SERPAPI_API_KEY, existing SERP_API alias accepted. Backend only,20s timeout, max three parallel query workers, bounded results, no automatic retry storm. Auth/rate cooldown60s process-local. HTTP errors classified as authentication/rate/unavailable/invalid request; upstream credential-bearing URLs/bodies are not logged.

Crawlee Python1.7.2, Playwright1.63.0, Chromium installed; HTTPX HTTP backend, real browser backend.30s per acquisition budget, no vendor fallback; HTTP thin-shell rendering uses remaining budget. Raw hash, normalized hash, final URL, redirect chain, mode, MIME and size retained. Dates not guessed. Captures currently serial and capped per discovery. Search snippets never become evidence.

Real bounded capability probes (not one shared assessment):

| Probe | Result | Mode/provider | Seconds |
|---|---|---|---:|
| search | SUCCESS | serpapi | 0.332 |
| static_html | SUCCESS | CRAWLEE_HTTP | 8.081 |
| official_pdf | SUCCESS | CRAWLEE_HTTP | 6.674 |
| failed_source | FAILED | FAILED_ACQUISITION | 6.348 |
| unofficial_destination | FAILED | FAILED_ACQUISITION | 0.0 |
| js_official_page | SUCCESS | CRAWLEE_BROWSER | 8.175 |
| gemini_slot | SUCCESS |  | 0.952 |
| gemini_slot | SUCCESS |  | 1.866 |
| gemini_slot | SUCCESS |  | 0.944 |
| deployed_rag | SUCCESS |  | 0.952 |

Initial Impit PDF failure and soft-homepage capture defect are preserved in earlier acquisition reports; current HTTPX PDF probe succeeded. The final runtime journey had a SerpApi timeout and oversized source rejections; zero successful captures there, honestly recorded. Separate arbitrary-business live journey and capability probes succeeded in acquisition. Firecrawl .env credential may remain unused; no settings read or runtime invocation.

## Gemini

Current LLM_PROVIDER=gemini; three distinct configured keys through GEMINI_API_KEY, GEMINI_API1, GEMINI_API2. GEMINI_API_KEYS / numbered aliases also accepted. Current live model gemini-3.5-flash-lite. Healthy starts rotate1→2→3→1; failed/temporarily unavailable slots skipped until eligible. Every eligible slot attempted once per request; malformed/schema/refusal output rotates; invalid application requests and budgets stop. OpenAI final fallback has recursion disabled. Explicit OpenAI-primary compatibility remains available. Shared quota-project independence unverified; key rotation does not create quota.

Actual final runtime sequence: gemini slot 1 (SUCCESS, validated) → gemini slot 2 (SUCCESS, validated) → gemini slot 3 (ERROR, malformed_response) → gemini slot 1 (ERROR, malformed_response) → gemini slot 2 (SUCCESS, validated).

All three slots separately passed live bounded requests. Forced three-slot quota failures and OpenAI success verified with mocks, including one-logical-call budget regression. Real total outage/OpenAI failure was not deliberately induced with live paid providers. Safe telemetry includes slot/model/attempt/latency/status/failure/tokens when returned; failed-response token accounting and model price estimates are not a verified billing ledger. Pool/budgets are process-local.

## Hallucination controls and result origin

Search/RAG provide context; existing engine evaluates published rules; LLM understands/extracts/explains/plans. New discovery is quarantined; exact excerpts required before candidate persistence. Contextual schemas reject fabricated URLs, IDs, verification and unsupported specific sections/forms/durations. Guidance cannot publish a rule or set VERIFIED. Source-backed decisions take precedence over planning. Source capture validity is heuristic; schemas/prompts cannot prove legal correctness or replace expert review.

## Real end-to-end tests

**Arbitrary context, isolated test database:** assessment e2e51011-abbf-4bae-a2d0-d36ffaac3d62, Kerala leather repair/upcycling; 3 questions; COMPLETED; 81.143s pipeline,85.97s complete pytest including setup. Real SerpApi/Gemini/Crawlee/RAG attempted. Counts: {"compliance_items": 5, "documents": 5, "workflows": 5, "schemes": 1, "standards": 1}. Zero deterministic decisions because no published rules seeded. Ordinary compliance/documents/workflows persisted and GETs, schemes/standards/calendar/dashboard returned200. Calendar remains empty if no supported dates. Completion facade generated no extra provider call or DiscoveryRun. See final-submission-live-assessment.json for actual provider attempts, acquisition modes and failures.

**Runtime PostgreSQL with existing published knowledge:** synthetic Gujarat packaged-spice manufacturing workshop; assessment ee5d95e9-8c9d-4c9e-be91-7c934886ecec; 5 generated questions; COMPLETED; 102.308s. Login, canonical profile API, understanding/questions/answers, retrieval/acquisition, synthesis/completion, compliance/documents/workflows/schemes/standards/calendar/dashboard all returned successfully. Engine counts: {"APPLICABLE": 6, "NOT_APPLICABLE": 57, "NEEDS_INFORMATION": 0, "UNVERIFIED": 30}. Guidance counts: {"compliance_items": 0, "documents": 0, "workflows": 0, "schemes": 1, "standards": 2}. Acquisition: [{"status": "FAILED", "query_count": 6, "candidate_count": 20, "official_candidates": 2, "captures": 0, "modes": [], "error": "Query 'Legal Metrology packaged commo...' failed: SerpApi timed out.; Source capture rejected: Source was empty or exceeded the capture byte limit.; Source capture rejected: Source was empty or exceeded the capture byte limit."}]. Real Gemini malformed outputs rotated until validated success. Temporary QA account/business explicitly removed; public capture/source records may remain. Existing database contained93 published requirements /34 published rules; test validates the application's current dataset, not an expert-labelled correctness benchmark.

**Failure cases:** mocked provider quota/timeout/auth/network/schema/all-provider exhaustion; search errors; blocked/unofficial/empty/captcha captures; persisted recovery; total failure preserves inputs; tenant/assessment isolation. Runtime encountered actual Gemini503 and malformed outputs, source timeouts/TLS/size rejection; all observations retained. Historical first diagnostic envelope/unknown-key/cleanup errors corrected; no unsuccessful probe called success.

## Browser QA

Production Next build; desktop1440, tablet768, mobile390, reduced motion, keyboard/modal focus, overflow and warm CSS checks. Updated product tests cover auth presentation/session, protected/reviewer boundaries, editable starter/admin creation, profile failure retention, resume dedup, answers/acquisition failure, compliance/evidence, documents/upload failure, workflows, schemes/standards, notifications, assistant failure, settings, admin review and operational approval/query requests. Browser tests use explicitly mocked API fixtures and do not establish real-provider browser success.

All13 requested states captured in docs/submission-screenshots (login, starters, autofill, questions, loading, compliance, documents, workflows, schemes, standards, dashboard, admin creation, review), with additional mobile/admin field images. Images inspected; missing admin borders and hardcoded catalogue claims corrected. Fixed-header position in a fullpage image can reflect scroll position; viewport checks verify layout fit. Native runtime API login was tested; a fully real-provider browser-login journey is not independently completed.

Full historical inventory:42 tests,34 passed,8 failed (docs/final-polish-browser-production.txt). Failures are compliance-workflows-sync(two fixed Storyloom requirements/schemes), demo-profiles(three missing old preset/login/15-question scenarios), easternvolt-ev(old EV fixture/15-question), primary-journey(old live seed flow), ux-security-resilience refresh(old seed/intake). Updated resume, evidence/status and arbitrary-real API coverage do not erase these failures. Historical tests were preserved; no insecure demo account or fabricated expected legal result was restored.

## Tests and engineering gates

- Backend latest:658 passed,3 opt-in live skips,36.45s. Isolated SQLite tests, separately from runtime PostgreSQL; unit/API/provider/search/acquisition/RAG/applicability/workspace/tenant/admin/auth tests included. See final-polish-backend-freeze.txt.
- Focused logical-budget/provider orchestration:38 passed; bounded context/retrieval contracts:47 passed. These are subsets, not added to the full-suite count.
- Separate real-provider isolated API test:1 passed,85.97s. Separate real runtime diagnostic:successful102.308s final journey. Separate deployed RAG probe accepted2 passages, rejected2; external service internals unavailable.
- Frontend unit tests:13 passed. Production build and its TypeScript gate passed39 routes. ESLint0 errors /419 warnings, cleanup deferred. Final updated production browser gate:26 passed in1.3m (24 product checks +2 landing checks), recorded separately in final-polish-browser-freeze.txt.
- Django check: no issues with16 existing silences; migration drift none. Applied only ingestion0004 default-provider metadata migration. pip check no broken dependencies. uv lock updated for actual Crawlee extras.
- Secret scan:11 configured sensitive values checked against tracked/untracked repository text, diff and frontend static JS:zero matches; .env untracked. Provider secrets stay backend-side. Browser fixture network is not independent server security auditing.

## Not implemented / why / remaining gates

- Entire historical browser suite repair/fixtures:8 failures remain; old fixed15-question/seed assumptions conflict with current intake and honest data. A maintained live-browser fixture/account contract is still needed.
- Google OAuth live/production setup: Google Auth client settings are separate from Calendar and currently not configured. Password auth remains functional. No Cloud Console or deployed environment was changed.
- Expert legal accuracy/corpus completeness, all93 evidence chains independently human audited, jurisdiction/content relevance benchmark: no labelled reference corpus or legal review supplied. No fabricated accuracy percentage.
- Deployed frontend/backend/RAG internal embedding/chunk/BM25/vector/reranking evaluation and durable raw archive: outside locally inspectable checkout. Preserve working external service; no imaginary local vector deployment.
- Distributed quotas/cooldown/budgets, worker/outbox, production email/calendar tokens and guaranteed retry/delivery: existing limitations, not silently rewritten for submission.
- Full cleanup, broad directory renaming, schema redesign, framework migration, automatic legal publication, fake sample answers/results: intentionally not implemented.

## Rollback

Requested separate cleanup-prompt file was absent; instruction (1).md and the present cleanup playbook were read. Broad cleanup remains deferred.

No blanket git reset/revert: large pre-existing work must survive. To disable new live acquisition safely, remove/unset SERPAPI_API_KEY and SERP_API in backend deployment and restart. SerpApi unavailable uses existing persisted knowledge/contextual behavior; missing key does not reactivate Firecrawl. Firecrawl legacy module remains inert. To bypass Gemini pool set LLM_PROVIDER=openai; this uses existing OpenAI-primary path, which can fall back to Gemini unless its keys are also removed. To disable all external LLM calls remove provider keys; controlled failure/known-rule paths remain. Restore a previous curated release only through reviewed per-file changes; additive ingestion migration needs no rollback for provider disabling.

Fresh host: install locked backend dependencies and run python -m playwright install chromium (Linux runtime libraries separately when needed). Configure backend DB/Gemini/OpenAI/SerpApi/RAG settings; frontend NEXT_PUBLIC_API_BASE_URL points at deployed Django. Local .env does not configure a separate production host.

Environment names: DATABASE_URL; LLM_PROVIDER; GEMINI_API_KEY/GEMINI_API1/GEMINI_API2 or GEMINI_API_KEYS; GEMINI_MODEL; GEMINI_KEY_COOLDOWN_SECONDS; OPENAI_API_KEY/OPENAI_MODEL; SERPAPI_API_KEY or SERP_API; SEARCH_TIMEOUT_SECONDS; ACQUISITION_TIMEOUT_SECONDS; COMPLIANCERAG_URL/COMPLIANCERAG_TIMEOUT_SECONDS; NEXT_PUBLIC_API_BASE_URL. Google Auth: GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_CLIENT_SECRET, GOOGLE_AUTH_REDIRECT_URI, GOOGLE_AUTH_FRONTEND_CALLBACK_URL. Calendar uses its own GOOGLE_CALENDAR_CLIENT_ID/SECRET and refresh/channel settings. No secret values reproduced.

## Native servers at handoff

Frontend http://localhost:3000 runs the verified production Next build; backend http://127.0.0.1:8000 runs Django without Docker. Both return200. Readiness confirms PostgreSQL and pgvector, not local SQLite. No commit or push performed; existing working tree preserved.
