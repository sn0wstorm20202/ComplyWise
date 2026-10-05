# ComplyWise functional hardening — 2026-10-04

## 1. Executive status

**PARTIALLY VERIFIED.** The local product journeys, backend regression suite, browser state machine and live provider capabilities were exercised. Regulatory completeness, expert legal correctness, Google sign-in configuration, delivery channels and deployed RAG internals remain outside the verified scope. This is not a legal-accuracy certification.

Baseline SHA: `e88e7248666057634d1ac807e2dc83c4bafd10cf`. Existing modified/untracked work was preserved. No reset, commit, push, environment-value change, framework migration or broad cleanup occurred. The exact requested `instruction.md` was absent; the existing `frontend/Reference/instruction (1).md` was read instead. Progress lives in `frontend/Reference/task-progress.md`.

Native frontend: `http://localhost:3000`; backend: `http://127.0.0.1:8000`. Runtime database is PostgreSQL with pgvector installed; it is not silently falling back to SQLite. The normal pytest suite deliberately uses its isolated test database. Current runtime contains 93 published requirement records and 34 published rules; these counts are not coverage or accuracy percentages.

## 2. Bugs found and corrected

| Severity / symptom | Root cause and correction | Files / regression evidence |
|---|---|---|
| P0: older assessment answers merged a newer profile and changed other assessments' questions | Services used `current_profile` and business-wide question instances. Answers now merge the requested snapshot and update only its assessment. | `apps/onboarding/services.py`, `domain/intelligence/answer_interpretation.py`; snapshot/answer tests in `test_functional_hardening.py` |
| P0: explicit foreign assessment silently became the latest assessment | Planner substituted the latest assessment; orchestration independently rebuilt context from the latest profile. Foreign IDs now fail closed and stages use the selected snapshot. Later rounds and stop conditions are also scoped. | `apps/onboarding/planner.py`, `domain/intelligence/orchestration.py`; wrong-assessment and requested-snapshot regressions |
| P1: known activity/workforce reappeared as questions | Applicability aliases were missing from planning context; exact-key dedup missed differently named questions. Canonical aliases, identity/wording dedup, known zero/False handling and unresolved-fact filtering added. | `domain/context/business_context.py`, `apps/onboarding/question_policy.py`, `planner.py`; four initial reproductions failed before fixes |
| P1: decimal input unsupported; ambiguous kW/HP answers | Numeric provider types were not mapped at the API boundary; a single numeric field accepted two units in its wording. Wizard contract maps numeric types; connected power is HP consistently. | `domain/intelligence/questionnaire.py`, `businesses/orchestration_views.py`, `question_policy.py`, `BusinessContext.tsx`; numeric/unit regressions and real browser HP question |
| P1: ordinary cooking oil could become a hazardous-waste fact | Model assigned a canonical hazardous key to an ordinary waste-disposal question. A semantic guard keeps that question under contextual waste handling. | `question_policy.py`; cooking-oil regression; restaurant real run |
| P1: last edited answer discarded; starter suggestion unmarked | Wizard returned before saving when all questions were already answered. It now saves edits and requires confirmation of editable starter suggestions. | `data/businessStarters.ts`, `onboarding/page.tsx`, `FifteenQuestionsWizard.tsx`; suggested-answer unit/browser tests |
| P1: wrong/empty standards results | URL assessment was ignored or combined with another business's active assessment; service failure also rendered an empty-state conclusion. Explicit assessment/business scoping, request-version protection, partial-scope response and separate errors now apply. | `apps/standards/views.py`, `intelligence/standards_discovery.py`, standards list/detail pages; standards/isolation tests |
| P1: explanation looked like verified evidence without a source | Modal substituted invented facts, used the description as a verbatim quotation and supplied a verified-authority footer. Those substitutions were removed; actual excerpts and contextual basis are distinct. | `WhyThisAppliesModal.tsx`, `product/RequirementCard.tsx`; modal evidence browser regression |
| P1: workspace navigation lost assessment scope | Requirement/document/workflow links or explicit business URLs reused unrelated active assessment state. Links preserve IDs; explicit foreign business cannot inherit an active assessment. | compliance/documents/workflows/schemes pages, `RequirementCard.tsx`; scope and contextual-document browser checks |
| P1: long discovery aborted at 25 seconds, then another orchestration request continued | Generic browser timeout was shorter than valid discovery. Long-running POSTs have a bounded 180-second budget; actual failures propagate rather than triggering premature competing work. Completion reads canonical persisted results. | `lib/api/orchestration.ts`, `lib/api/discovery.ts`, `onboarding/page.tsx`; failed and completed real-browser artifacts |
| P1: simultaneous first workspace reads returned 409 | Read-then-create raced on the one-per-user constraint. Workspace resolution now uses concurrency-safe `get_or_create`. | `apps/businesses/models.py`; idempotency test and five concurrent real PostgreSQL API reads, all 200 with one workspace row |
| P1: results invented document/deadline counts and certainty claims | Legacy fallback arithmetic and wording were unrelated to saved results. Counts now come from persisted compliance; missing counts are unrecorded; unreviewed items are disclosed. | `AssessmentResultsSummary.tsx`, `onboarding/page.tsx`; zero-count/claim browser assertions |
| P1: unsupported understanding invented Pune/Maharashtra and industrial obligations | Emergency path populated default geography/activity conclusions. It now uses supplied facts, marks local heuristic origin and retains missing geography. | `business_understanding.py`; emergency-context regression |
| P1: negative business description changed search meaning | Manufacturing substring matched “no physical manufacturing”; keyword cleaner removed the hyphen from “non-hazardous.” Negative qualifiers are retained and nonmanufacturing searches use establishment context. | `business_context.py`, `ingestion/query_planner.py`; search/context regressions |
| P1: malformed provider metadata escaped the expected error boundary | Gemini usage metadata and SerpApi search metadata were assumed dictionaries. Wrong shapes now produce classified provider errors; Gemini continues to the next eligible slot. | `gemini_provider.py`, `search_provider.py`; malformed metadata regressions |
| P2: duplicate profile-home requests | Business context fetched before and after auth hydration; Schemes independently fetched the same list. Context waits for auth; Schemes uses the existing context list. | `BusinessContext.tsx`, `schemes/page.tsx`; per-route request-count assertions in `primary-journey.spec.ts` |
| P1: legacy hardcoded credential helper remained in frontend source | Unused `fastDemoLogin` still contained credential login/registration attempts. No caller used it; the helper and public context method were removed. | `AuthContext.tsx`; source/bundle scan and authentication browser checks |
| P1: contextual documents were labelled statutory evidence | Shared card heading said “Statutory Basis” and supplied an invented regulatory-authority fallback. Planning checklists now say “Planning basis”; other records say “Requirement basis.” | `documents/page.tsx`; dedicated contextual-document provenance/assessment browser regression |

No published rule, authentication mechanism, database architecture, Gemini pool, deployed RAG service or working acquisition architecture was replaced. Historical test failures were investigated rather than deleted.

## 3. Dynamic questioning

Before: the existing Precision Workshop assessment had `Q_PRIMARY_ACTIVITY` and `Q_TOTAL_WORKFORCE` despite a saved business description and 18 workers. Two known facts were re-asked. The initial four targeted reproduction tests failed.

After: planner uses the requested profile, description, saved answers, canonical aliases and published-rule AST gaps. Unanswered rule facts and contextual source-discovery gaps are ranked, deduplicated, capped at five and persisted. Other gaps are deferred. Metadata includes `fact_key`, `reason_code`, real rule references when present, `already_known=false` and suggestion origin. Contextual questions are not represented as published-rule decisions. Question policy version 4 invalidates older presentation metadata.

| Business | Questions | Repeated known facts | Context-specific questions | Starter suggestions in this real run |
|---|---:|---:|---:|---:|
| Manufacturing | 2 | 0 | 2 | 0 |
| Restaurant | 3 | 0 | 3 | 0 |
| IT services | 1 | 0 | 1 | 0 |
| Warehouse | 2 | 0 | 2 | 0 |
| Healthcare | 3 | 0 | 3 | 0 |

Topics differed: manufacturing secondary operations/registration context; restaurant used cooking oil, power and kitchen discharge; IT personal client data; warehouse floor area/food-contact packaging; healthcare biomedical waste, wastewater and power. These are observed questions, not independently confirmed legal conclusions. The separate final live browser showed three manufacturing questions and the unambiguous HP input. Restaurant/healthcare wording in the five-business JSON predates the final HP presentation correction; that correction has its own regression and live browser proof.

None of these five live plans needed a starter suggestion, so no positive live suggestion result is claimed. The unit/browser suggestion cases confirm visible, editable preselection, changing False to True, saving the final edit and refresh persistence. Starter suggestions are not confirmed facts until the user saves them.

## 4. Precision Workshop standards

Existing business `09f5d702-f83a-4b1d-bd5e-2c7b31b7a2fa`, assessment `8b0883ed-63f8-47a6-8e08-84874d71eae8` was inspected without changing its profile or password. Actual scoped endpoint returns 200, one contextual item, zero reviewed matches and `PARTIAL_SCOPE`.

Returned item: **General Workshop Safety and Occupational Health Standards**. Origin `LLM_FALLBACK_RESULT`, category `QUALITY_PLANNING`; contextual source reference **National Building Code & Factory Safety Guidelines**. Exact source URL absent; citations empty; mandatory status and published rule version absent. This is not an official standard code, mandatory match or verified citation. The internal UUID identifies saved guidance, not a government-issued standard.

The existing reviewed standard category does not cover this workshop sufficiently. The frontend now exposes contextual relevance/source information, separates errors and respects assessment scope. It does not create a fake BIS match. Honest message: “No reviewed standards matched this assessment within the currently supported knowledge scope. Additional product or quality review may be needed.” Official supporting links cannot be verified for this contextual item because none are recorded. Expert knowledge ingestion/review is required to close that coverage gap.

Evidence: `hardening-runtime-security-final.json`; baseline redundant questions in `hardening-baseline-openai-precision.json`; standards regression/browser results.

## 5. Provider results

Actual `BusinessUnderstandingEngine` prompt and response validator, separate bounded health requests:

| Probe | Final provider/model | Validated | Seconds |
|---|---|---|---:|
| Gemini slot 1 | Gemini / gemini-3.5-flash-lite | yes | 2.436 |
| Gemini slot 2 | Gemini / gemini-3.5-flash-lite | yes | 2.296 |
| Gemini slot 3 | Gemini / gemini-3.5-flash-lite | yes | 2.279 |
| OpenAI independently | OpenAI / gpt-4o-mini | yes | 5.024 |
| Controlled no-eligible-Gemini selection | OpenAI / gpt-4o-mini | yes | 5.167 |

The last selection was a diagnostic control; the OpenAI HTTP request and application validation were real. It was not a real three-key outage. Exact safe attempt telemetry is in `hardening-application-providers-final.json`. All slots showed zero cooldown remaining in the independent probes.

Existing healthy pool rotates 1→2→3→1. A request starts at the next eligible slot and tries each eligible slot once; timeout/network/authentication/quota/rate/unavailability failures cool down slots. Malformed/schema/unusable responses can advance to another slot. Invalid application requests and budget failures stop. Gemini exhaustion reaches OpenAI without reverse recursion. Attempts share one logical request budget. Cooldowns, cursor and budgets are process-local; separate quota projects cannot be established from keys alone.

Deterministic mocks exercised rotation, skip/rejoin, quota/auth/timeouts, malformed/schema/unusable output, all-Gemini→OpenAI and total exhaustion. Live runs observed schema/malformed errors followed by successful later slots. No live quota/authentication outage or total paid-provider exhaustion was deliberately manufactured.

## 6. Search, acquisition and retrieval

SerpApi is the configured search vendor. Backend Google `search.json` adapter uses `SERPAPI_API_KEY` or `SERP_API`, a 20-second timeout and bounded queries/results. Search snippets are candidate context, never source evidence. Independent live search: **3 candidates, 1.082 seconds**; one was unofficial and subject to domain rejection.

| Real capability probe | Result | Acquisition engine / format | Seconds |
|---|---|---|---:|
| BIS static official HTML | accepted, 12,576 text characters | CRAWLEE_HTTP / HTML | 4.605 |
| MSME official notification PDF | accepted, 26,092 characters | CRAWLEE_HTTP / application/pdf | 5.123 |
| CRS BIS browser page | accepted, 7,109 characters | CRAWLEE_BROWSER / HTML | 7.505 |
| Missing BIS document redirecting to homepage | rejected | FAILED_ACQUISITION | 5.186 |
| Unofficial destination | rejected before acquisition | FAILED_ACQUISITION | <0.001 |
| Deployed ComplianceRAG | 2 accepted, 2 rejected passages | external retrieval adapter | 2.292 |

Crawlee 1.7.2, HTTPX HTTP backend, Playwright 1.63.0 with actual Chromium. PDF is a format; it is not labelled browser acquisition. DNS/private-address, credential URL/port, redirects, official domains, MIME/size/text, empty/login/CAPTCHA/boilerplate and content hashes have focused tests. Browser failure/recovery is controlled. Firecrawl has no active provider setting, imports or calls in discovery/provider execution; legacy code remains inert. No hidden Firecrawl fallback was introduced.

Deployed RAG health succeeded separately. In the five business assessments its adapter accepted **zero** passages and rejected three for each case. The pipeline continued with existing published knowledge, accepted captures where available and contextual guidance. This is insufficient retrieval, not a claimed successful evidence match. Local retrieval remains verified-evidence token overlap; pgvector installation does not prove a local vector/reranker stack. The separate deployed service's indexing/embedding internals were not accessible.

Evidence: `hardening-baseline-providers.json`, five-business JSON and focused acquisition/RAG tests.

## 7. Five-business real-provider API E2E

All five used actual password authentication, native runtime PostgreSQL, saved profiles, understand/questions/answers, discovery, synthesis, completion and normal workspace GETs. Profiles and answers were temporary synthetic QA inputs; provider calls and published runtime records were real. QA identities/businesses were removed afterward. IDs below are retained report identities, not permanent demo accounts.

| Business / assessment | Seconds | APPLICABLE / NOT_APPLICABLE / UNVERIFIED | Contextual compliance | Documents / workflows / schemes | Standards reviewed / contextual | Candidates / official candidates / captures |
|---|---:|---|---:|---|---|---|
| Precision Workshop QA — 76fe0e81-37e8-43eb-bdde-bf539acf8252 | 94.600 | 2 / 61 / 30 | 0 | 6 / 18 / 16 | 0 / 1 | 20 / 15 / 2 HTTP |
| Neighbourhood Kitchen QA — 763ed135-a439-471b-ae30-6eb7c308338b | 100.376 | 0 / 63 / 30 | 3 | 3 / 8 / 6 | 0 / 1 | 20 / 8 / 0 |
| Clearpath Digital QA — 43e3430f-8a1b-41ce-a93d-40ea9133466f | 62.991 | 2 / 61 / 30 | 0 | 6 / 7 / 6 | 0 / 1 | 20 / 4 / 2 HTTP |
| City Storage QA — 16414b5e-13bc-4dd6-ba96-fa5e1b0b32db | 78.148 | 2 / 61 / 30 | 0 | 6 / 7 / 6 | 0 / 1 | 20 / 9 / 0 |
| Community Clinic QA — 51273b13-db52-450f-b913-3a7cc3d71b05 | 63.861 | 0 / 63 / 30 | 2 | 2 / 7 / 6 | 0 / 1 | 20 / 3 / 1 HTTP |

All statuses COMPLETED; no NEEDS_INFORMATION decision in these runs. Catalogue decisions include out-of-scope and unreviewed records, not 93 obligations. Workflow/scheme counts are returned workspace records, not completed tasks or established benefits. Calendar events: zero for each; no deadlines were invented. Each dashboard had evaluation state and two or three priority actions. All workspace endpoints returned 200. Completion made zero extra provider calls; workspace GETs made zero provider calls. Ten cross-business/assessment checks returned 404. Snapshot/isolation tests cover same-business historical assessments and separate tenants as well.

Observed failures/retries: manufacturing rejected an oversized PDF and rotated workspace schema failure slot2→slot3; restaurant had a search timeout, blocked/empty captures, malformed guidance slot2→slot3→slot1; IT rejected a blocked source; warehouse had two search timeouts and no accepted capture; healthcare rejected two blocked sources. Discovery states were PARTIAL or FAILED rather than fabricated capture success. Standard suggestions carried no citations or exact source URLs in all five runs. Full provider sequence, questions, answers, per-stage latency and outputs: `hardening-five-businesses-final.json`.

Unmocked Playwright browser, independently: Precision Workshop Browser QA, assessment `7e642717-bf84-46c7-9af9-54df15dc4a32`, three questions, manual login and editable profile, saved results, compliance/documents/workflows/schemes/standards/dashboard/calendar/assistant/settings. Total **245.600 seconds**, including deliberate full route reloads and network-idle waits, not just analysis time. 140 recorded API responses were 200/201, zero page exceptions, zero direct browser provider requests; tablet768/mobile390 standards had no overflow. Temporary identity removed. This run preceded the final Schemes duplicate-request and document-label/link corrections; those corrections have the final browser regression gate. Earlier failed real-browser result and screenshots were retained as evidence of the timeout defect.

## 8. Browser regression and visual QA

Eight baseline failures were reproduced (34 passed, 8 failed). Purposes retained:

| Historical failing contract | Current replacement / status |
|---|---|
| SaaS compliance required four fixed statutory results | Saved scoped result, no injected industrial requirements |
| Workflows expected five fixed schemes and fixed roadmaps | Linked workflow state and honest empty schemes |
| Five demo profiles required seed credentials/intake | Five editable starters, manual authentication, no auto-submit |
| Ambuja exact legal-output seed | Heavy-manufacturing context rejects unrelated seeded requirements |
| Unseen business journey | Own-business state machine and compact editable interview |
| EasternVolt fixed 15 questions/mandatory standards | Contextual quality provenance vs reviewed standards |
| Primary journey with legacy demo account/evidence | Manual auth, suggestions/edits/persistence, actual excerpt handling, all surfaces |
| Refresh expected obsolete question count | Saved answer and suggestion state survives refresh |

All eight passed in the final full run: **43 passed in 3.0 minutes**, including the added document provenance/assessment regression (`hardening-browser-final.txt`). No original failing purpose was deleted or replaced with hardcoded legal success. The new document test initially failed because its assessment fixture variable was undefined; supplying an explicit fixture assessment ID corrected the test without weakening its scope assertion.

Browser suite uses explicit API fixtures for deterministic authentication, upload/review failures, admin creation, review/query/approval concurrency, tenant denial, route state, mobile dialogs, keyboard focus and reduced motion. These are separate from the real-provider browser/API journeys. Screenshots include all 13 requested states under `submission-screenshots`, real user states under `hardening-screenshots`, and a labelled contextual-document fixture. Visual inspection retained warm styling and found the inaccurate result/document labels corrected in this task. Admin screens were fixture-backed; a real external Google login or live human-admin review was not claimed.

## 9. Test results and security

| Layer | Actual run / artifact |
|---|---|
| Focused question/provider/acquisition/RAG/standards/workspace | 92 passed, 10.85s — `hardening-focused-submission.txt` |
| Full backend unit/integration/API | 671 passed, 3 opt-in live skips, 91.54s — `hardening-backend-final-gate.txt` |
| Frontend TypeScript unit tests | 13 passed, 0 skipped — `hardening-frontend-unit-submission.txt` |
| TypeScript | passed — `hardening-typescript-final.txt` |
| Production build | passed, 39 routes — `hardening-build-final.txt` |
| Browser | 43 passed, 3.0m — `hardening-browser-final.txt` |
| Django / migration drift / dependencies | checks clean (16 existing silences); no migration changes; pip check clean |
| Live providers/search/Crawlee/RAG | separate actual probes and five journeys above; not counted as mocked passes |

Lint reports zero errors and 426 warnings (`hardening-lint-final.txt`). Warnings were not suppressed to manufacture a clean result. No new migration was needed for these fixes.

Final runtime scan checked **11** actual configured sensitive values, including `SERP_API` and numbered `GEMINI_API` aliases, against 775 repository text files, 60 frontend JS files and git diff: no matches. Hardcoded demo credential strings were also removed from source/build. `.env` is untouched and excluded from source control. Per-tenant/profile/assessment checks, safe destination tests and role-boundary tests passed. Safe telemetry records provider/slot/model/latency/status/tokens, not keys, private prompts or source bodies. No live provider credential appeared in the captured browser traffic.

## 10. Remaining issues and closure requirements

| Issue | Impact / required closure | Type |
|---|---|---|
| Standards/sector knowledge incomplete | Precision Workshop has no reviewed applicable standard; ingest authoritative product-scope evidence and have an authorized expert publish/review it. No invented match added. | Knowledge/external review |
| Real search/source instability | Restaurant/warehouse captures failed; blocked pages, oversized PDFs and search timeouts remain honest. Review authoritative source coverage/limits; external portals must be available for a fully source-backed fresh journey. | External and bounded adapter limits |
| Google sign-in credentials absent | Set `GOOGLE_AUTH_CLIENT_ID`, `GOOGLE_AUTH_CLIENT_SECRET`, Console consent/client callback configuration and correct backend/frontend callback URLs. Local password auth verified; Google HTTP flow remains fixture-tested only. | External configuration |
| Calendar/mail/storage integrations not all live verified | Calendar refresh token and Azure storage connection are absent. Configure intended delivery/storage credentials and run authorized live delivery/upload checks; document list/check/failure contracts were tested. | External configuration |
| Deployed RAG internals not inspectable | Adapter tested live, but its embedding/index/reranker/data coverage cannot be independently audited from this checkout. Obtain service repository/access. | External access |
| No expert legal benchmark | Prompt/schema/source guards and deterministic execution do not establish legal completeness or semantic accuracy of the existing corpus or model explanations. Expert-labelled review is required. | External review |
| Process-local cooldowns/budgets and heuristic acquisition checks | Multiple workers do not share quota/cooldown state; project quota independence unknown; DNS validation does not pin connections against rebinding. Deployment-scale hardening remains separate. | Internal, later production scope |
| Lint warnings / broad cleanup | Functional pass deliberately did not restructure the repository or remove unrelated warnings. | Intentionally deferred |

The architecture diagram and current-product scenario describe actual connections. Full cleanup, deployment, commit/push, expert verification and pretending all unknown coverage is reviewed were intentionally not performed.
