# Codebase structure and ownership

## Cleanup baseline — 2026-10-04

Baseline commit: `b09dbf43438d032078bc9ab93bcaa60c5c14f65f`; working tree clean.
Read `frontend/Reference/complywise-codebase-structure-cleanup.md` before editing.
The historical Firecrawl examples in that guide do not override the current
SerpApi → Crawlee acquisition path. Firecrawl remains retired.

### Initial structural assessment

1. **Repository shape:** Django modular monolith (`backend/apps`, `domain`,
   `common`, `config`) and Next.js App Router (`frontend/app`, `components`,
   `context`, `lib/api`). Most `frontend/features` files currently only contain
   constants. Tests live in `backend/tests`, `frontend/tests`, and `frontend/e2e`.
2. **Boundary problems:** document derivation imports metadata helpers from
   `apps.requirements.views`; assessment views reuse the same view helpers.
   The onboarding route owns API sequencing, state, rendering, profile options,
   and unused browser-side question generation.
3. **Duplication:** equivalent negation stripping in four intelligence modules;
   repeated decision/evidence presentation in two endpoints; historical emergency
   question generators alongside the active compact planner.
4. **Largest files:** questionnaire 2,897 lines; onboarding planner 1,774;
   assessment orchestration 1,615; calendar services 1,401; workflow views 1,261.
   Frontend onboarding 2,340; admin case detail 1,526; types barrel 1,498;
   documents 1,234; schemes 1,176. Size alone is not a reason to split a file.
5. **Dependency risk:** intelligence → API-view helper is a concrete inversion.
   AST inspection found no top-level Python import cycles. Deferred imports in
   orchestration are intentional and need runtime tests, not blind removal.
6. **Order:** fix view-helper ownership; separate questionnaire contracts,
   validation and historical fallback from active lifecycle; extract onboarding
   responsibilities; consolidate equivalent helpers; remove proven dead code;
   align documentation and run regression gates.

### Baseline validation

- Backend: 671 passed, 3 opt-in live tests skipped, 54.98 seconds, isolated SQLite.
- Frontend unit tests: 13 passed. TypeScript passed.
- ESLint: 0 errors, 426 warnings. Existing warning debt is not a green lint claim.
- No live provider requests were needed for this structural baseline.

### Scope guardrails

Preserve routes, response shapes, tenant/assessment scope, database models and
migrations, authentication, provider rotation, retrieval, deterministic evaluation,
and the current visual identity. Keep tests for historical question contracts;
isolate their implementation rather than deleting coverage. Do not reorganize
all apps or introduce repositories, factories, queues, or framework replacements.

The implementation map remains `docs/backend-architecture.mmd`. Task history
remains in `frontend/Reference/task-progress.md`.

## Backend ownership

| Boundary | Responsibility and first file to inspect |
|---|---|
| `config` | API composition (`api_urls.py`), runtime configuration (`settings.py`) |
| `accounts` | Password/token APIs (`views.py`), Google OAuth (`google_auth.py`), identities |
| `businesses` | Business/membership/profile/assessment models; `orchestration_views.py` is the assessment HTTP adapter |
| `onboarding` | `planner.py` selects and persists gaps; `question_policy.py` deduplicates canonical facts; `services.py` saves answers |
| `evidence` | Source identity, excerpts and provenance models |
| `knowledge` | Published requirement/rule models and knowledge-pack loading |
| `applicability` | `engine.py` coordinates published-rule/evidence evaluation and decision persistence |
| `requirements` | Workspace read APIs; `selectors.py` batches definitions/evidence; `presentation.py` renders metadata and recorded explanations |
| `documents` | Upload/storage, OCR, precheck, verification and document APIs |
| `workflows` | Cases, steps, transitions, reviewer disposition and execution services |
| `calendar` | Recorded deadlines, notifications, channel delivery and preferences |
| `schemes` | Source pipeline, normalization and eligibility matching |
| `standards` | Scoped standard-category knowledge and contextual quality guidance APIs |
| `ingestion` | Query planning, SerpApi discovery, capture persistence, extraction, quarantine and authorized review |
| `assistant` | Source-grounded conversational application service |
| `dashboard` | Read aggregation, without provider calls during ordinary workspace GETs |
| `regulatory_updates` | Persisted regulatory change summaries and APIs |
| `domain/providers` | Vendor HTTP boundaries, response validation, rotation, budgets and safe telemetry |
| `domain/acquisition` | Crawlee routing, destination/content validation and acquisition result contracts |
| `domain/context` | Canonical profile construction and shared business activity text handling |
| `domain/rules`, `domain/evaluation` | AST, evaluator and three-valued truth implementation |
| `domain/intelligence` | Understanding, orchestration, retrieval and workspace derivation/guidance |
| `common` | Cross-domain envelopes, permissions, authentication primitives and enums |

The empty `apps/acquisition` directory is not a second acquisition implementation.
The active acquisition boundary is `domain/acquisition`; no empty modules were added.

## Trace a feature

1. **HTTP:** `config/urls.py` → `config/api_urls.py` → an app's URL/view module.
2. **Assessment:** `apps/businesses/orchestration_views.py` →
   `domain/intelligence/orchestration.py` (`AssessmentOrchestrator`, strategies,
   completion facade) → the existing intelligence stages and persistence models.
3. **Questions:** active `QuestionnaireEngine` in `questionnaire.py` →
   `apps/onboarding/planner.py` → known facts/rule gaps → `question_policy.py` →
   saved plan. `question_types.py` supplies the contract. `question_validation.py`
   and `question_fallbacks.py` preserve historical imports/tests, not a competing
   active planner. `answer_interpretation.py` imports the contracts directly.
4. **LLM:** application prompt/schema → `domain/providers/registry.py` →
   `gemini_provider.py` → eligible rotated slots → final `openai_provider.py`.
   Provider failures, budgets and structured validation stay at their existing
   boundary. The Grok registry option is preserved.
5. **Acquisition:** ingestion query planner → `search_provider.py` (SerpApi) →
   official candidate policy → Crawlee provider/router → normalized persisted
   captures → claim extraction → unverified candidates → authorized publication.
   `apps/ingestion/firecrawl.py` is a disabled compatibility boundary only.
6. **Retrieval:** `regulatory_retrieval.py` calls the configured external
   ComplianceRAG adapter; local verified evidence retrieval is preserved.
   `workspace_guidance.py` fills uncovered context with structured, separately
   originated planning guidance. It does not publish deterministic rules.
7. **Applicability:** `domain/rules/ast.py` → `domain/evaluation/evaluator.py` /
   `truth.py` → `apps/applicability/engine.py` → `DecisionRun` / `DecisionResult`.
8. **Workspace reads:** existing scoped views obtain saved decisions/guidance;
   requirement selectors and presentation helpers share batch retrieval and exact
   citation construction without importing HTTP views into intelligence code.

These are the existing integration and persistence boundaries. No second provider
registry, retrieval implementation, state manager or ORM repository was introduced.

## Frontend ownership

`app/onboarding/page.tsx` composes the feature under its existing client/Suspense
boundary. `features/onboarding/OnboardingFlow.tsx` owns state, route restoration,
API sequencing and transitions. `BusinessProfileStep.tsx` owns editable starter
and profile rendering; `AssessmentProgress.tsx` renders recorded stages;
`AssessmentDecisionResults.tsx` renders recorded decisions. Presentation modules
do not fetch data. `profileDefaults.ts` contains the pre-existing offline option
contract; that behavior was not replaced during cleanup.

All browser backend communication continues through `lib/api/client.ts` and the
endpoint clients exported by `lib/api/index.ts`. Other large routes retain their
current implementations; creating a feature facade without separating a real
responsibility would merely relocate their complexity.

`types/index.ts` is the stable public barrel. Thirteen domain modules own the 103
unchanged declarations, with type-only dependencies. The backend contract test
reads the barrel's declared modules and retains its enum/serializer assertions.
Request/response representations that actually differ are not merged.

## Cleanup performed

- Removed intelligence → requirement HTTP-view imports.
- Isolated questionnaire contracts, validation and historical fallback generators
  from the active lifecycle. Existing import exports and historical tests remain.
- Shared requirement/evidence batch reads and citation presentation between two
  workspace endpoints, preserving their separate response projections.
- Replaced four equivalent activity negation helpers with one owned implementation.
- Extracted onboarding presentation and made the route a composition entry point.
- Removed two uncalled browser question generators, an uncalled sequential-answer
  handler, its unused state and answered-key calculation.
- Removed the unrouted mock workspace family and its private `lib/mockData.ts`.
  Import resolution and text reference searches found no callers outside that family.
- Updated current README navigation; retained old architecture as a labelled
  historical snapshot. Audit logs/screenshots were not reorganized or discarded.

## Remaining technical debt

- The active onboarding planner, assessment orchestrator, calendar services,
  workflow/admin views and several product pages still have large responsibilities.
  Their next decomposition needs explicit use-case/presentation contracts.
- Most other feature folders remain constants-only. They should become real feature
  boundaries when those routes are decomposed, rather than empty forwarding layers.
- Historical backend fallback contracts and unused alternative landing/dashboard
  components remain where deletion needs additional ownership or compatibility review.
- Existing weak TypeScript JSON types and lint warnings remain. Backend-wide Ruff
  is not clean at baseline; safe new/extracted modules are checked separately.
- Tests mostly remain in their existing locations. Moving them adds no useful
  coverage, and opt-in live checks remain separate from deterministic regressions.
- Provider cooldowns/budgets remain process-local and external service/knowledge
  coverage limits from the functional audit remain; cleanup does not verify or
  change those integrations.

## Final validation — 2026-10-04

| Gate | Current result |
|---|---|
| Full backend regression | **676 passed, 3 opt-in live skips**, 48.30 seconds; isolated SQLite |
| Related backend checkpoints | 119 passed/1 live skip; 55 passed; 46 passed/1 live skip |
| Frontend Node tests | **13 passed** |
| TypeScript | Passed after extraction, contract moves and final changes |
| Production Next.js build | Passed; compiled application used by final browser QA |
| Full Playwright suite | **43 passed**, 3.0 minutes, fresh production server on port 3001 |
| Browser coverage | Auth, starters, own business, resumed questions, workspace, review/admin, failures, desktop/tablet/mobile, keyboard, reduced motion and landing regression |
| Screenshot inspection | Editable starter/profile and mobile workflow screenshots reviewed; existing styling retained |
| Django check | No issues; 16 pre-existing silenced checks |
| Migration drift / applied migrations | No changes detected; `migrate --check` passed; no migration files modified |
| Python import graph | No top-level absolute/relative cycles; no intelligence → HTTP-view imports |
| Canonical TS declaration parity | All **103 declarations unchanged** apart from comments/whitespace |
| Scoped Ruff | Passed for new/extracted backend modules and the new activity-text test |
| Repository-wide Ruff | **Not clean:** 824 baseline → 816 current findings; existing debt retained without suppressions |
| ESLint | **0 errors, 382 warnings**, down from 426 baseline warnings |
| Git whitespace check | Passed |
| Secret-value scan | 11 configured sensitive values checked against 843 repository/bundle text files; no matches |

The first full backend run found one additional workflow contract test reading
declarations directly from the old barrel. It now asserts that `status.ts` is
publicly exported before comparing the same nine workflow enums. No assertions
or tests were removed. The full rerun above includes that correction.

Playwright accepts optional `PLAYWRIGHT_BASE_URL`; its default remains port 3000.
This allowed testing the actual new build on port 3001 without relying on a
previously running server's cached modules. Browser API fixtures and mocked
backend/provider tests do not establish live integration health. No live provider
probes were rerun because provider behavior was not changed.

Validation logs are in the OS temporary directory under
`complywise-cleanup-*.txt` / `.json`; screenshots and browser reports remain in
the existing ignored frontend test-output directories. No new audit-artifact
sprawl or credentials were committed. Changes remain local and uncommitted.

Automatic approval review rejected the optional server restart/shutdown command
with `blocked by policy`; no processes were stopped by that command. The verified
QA build remains running on `http://127.0.0.1:3001`. The existing port-3000 server
was not restarted. `next start` also emitted the existing standalone-output
packaging warning; this task did not change deployment configuration.
