# PROJECT_EXECUTION.md — ComplyWise

## Hackathon Implementation Tracker

**Problem Statement:** 26130  
**Purpose:** Living record of what is actually built and verified.

---

## LATEST MILESTONE — V2 Dynamic Prototype Audit (2026-03)

Full detail at the bottom of this file. Here is the headline:

```text
End-to-end journey (register → profile → products → dynamic questions →
analysis → results → dashboard):   VERIFIED IN REAL BROWSER (16/16 checks)
Backend tests:                     265/265 passing
Django check / migrations:         0 issues / clean
Frontend tsc + production build:   0 errors
Scenario hardcoding:               NONE (guarded by test_knowledge_boundary.py)
6th unseen scenario (synthetic):   PASS (zero engine code changes, SHA-256 asserted)
Provider abstraction:              openai | gemini | grok; openai | gemini embeddings
LLM verified live:                 Gemini (gemini-3.1-flash-lite) via domain.providers
```

Authoritative docs: `PRD.md` (v2.0), `TRD.md` (v2.0), `FRONTEND_INSTRUCTIONS.md`
(+ `FRONTEND_API_WIRING.md` for the endpoint-level integration contract).

---

## 1. Rules For This File

`PRD.md` = product contract.  
`TRD.md` = technical contract.  
`FRONTEND_INSTRUCTIONS.md` = frontend contract.  
`PROJECT_EXECUTION.md` = implementation reality.

Update this file after every major task. Do not rewrite completed history.

A task is not `DONE` merely because code was generated. It is done when the main path has been exercised and the result is documented.

---

## 2. Major Task Board

| Task | Status | Focus |
|---|---|---|
| 1. Foundation | DONE | Backend shell, DB, business/profile, base APIs |
| 2. Knowledge & Applicability Core | DONE | Sources, evidence, rules, evaluator, tests |
| 3. Dynamic Onboarding → Analysis | NOT_STARTED | Product input, questions, analysis, results |
| 4. Operational Compliance | NOT_STARTED | Requirements, documents, workflows, calendar |
| 5. Intelligence Layer | NOT_STARTED | Schemes, standards, updates, RAG assistant |
| 6. UI Integration | NOT_STARTED | Reference screens wired to live APIs |
| 7. Accuracy + Azure + Demo | NOT_STARTED | Benchmark, polish, deployment, rehearsal |

Allowed statuses:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
REVIEW
DONE
```

---

## 3. Current Project Reality

```text
Project stage: PRE-BUILD / TRANSITION TO IMPLEMENTATION
Prototype target: WORKING END-TO-END DEMO
Production-scale optimization: NOT REQUIRED
```

Priority:

```text
Correctness
→ Demonstrability
→ Evidence / Trust
→ Maintainability
→ Azure deployment
```

---

## 4. Knowledge Pipeline Status

```text
Source acquisition: IN_PROGRESS (11 authoritative fixtures loaded)
Raw source capture: IN_PROGRESS (11 source records)
PDF/HTML normalization: IN_PROGRESS
OCR/extraction: NOT_STARTED
Claim extraction: IN_PROGRESS (11 evidence items)
Evidence linking: DONE (Linked to rules and requirements)
Semantic verification: IN_PROGRESS (Automated verification status propagation)
Cross-source verification: IN_PROGRESS
Rule generation: DONE (Structured AST condition rules)
Rule testing: DONE (test_ast_evaluator.py + test_applicability_engine.py)
Human review gate: IN_PROGRESS (KnowledgeStatus publication lifecycle)
Publish: DONE (Only PUBLISHED rules evaluated at runtime)
Change detection: NOT_STARTED
```

---

## 5. Accuracy Benchmark

Internal prototype target:

```text
>90% correctness on curated implemented regression cases
```

This is not a claim of nationwide legal accuracy.

Current:

```text
Cases: 5
Pass: 5
Fail: 0
Measured accuracy: 100%
```

---

## 6. Regression Fixtures

```text
GUJARAT_FOOD
TELANGANA_ELECTRONICS
GUJARAT_TRADE
TAMIL_NADU_AUTO
KARNATAKA_ESDM
```

These must remain test/demo fixtures, not evaluator branches.

---

## 7. Standard Major-Task Update

Append an entry like this when a task is completed:

```text
## TASK <N> — <NAME>

Status: DONE

Implemented:
- ...

Tested:
- ...

Passed:
- ...

Known issues:
- ...

Files changed:
- ...

Next task:
- ...
```

---

## 8. Final Demo Gate

Before presenting:

```text
[ ] onboarding works
[ ] product/activity input works
[ ] smart questions work
[ ] analysis works
[ ] initial results work
[ ] dashboard is live
[ ] compliance list is live
[ ] requirement explanation works
[ ] evidence is visible
[ ] document upload works
[ ] pre-validation works
[ ] workflow dependency works
[ ] calendar works
[ ] schemes work
[ ] standards query works
[ ] assistant cites evidence
[ ] uncertainty states render correctly
[ ] golden regression tests pass
[ ] Azure deployment works
```

---

## 9. Next Major Task

```text
TASK 2 — Knowledge & Applicability Core
```

---

## TASK 1 — Foundation

Status: DONE

Implemented:
- Root project files: `.env.example`, `.env`, `.gitignore`, and `README.md`.
- Backend modular monolith configuration: Django 6.0, Django REST Framework, PostgreSQL / Supabase configuration with local SQLite fallback.
- Backend modular app boundaries: accounts, businesses, onboarding, knowledge, evidence, applicability, requirements, documents, workflows, calendar, schemes, standards, regulatory_updates, assistant, ingestion, dashboard.
- Foundation models and schema migrations: Custom User, Business, BusinessMembership, BusinessProfileVersion, ProfileVariableDefinition.
- Working REST API endpoints under `/api/v1/`:
  - `GET /health` & `GET /api/v1/health` (platform & API liveness)
  - `GET /api/v1/health/ready` (deep dependency readiness reporting)
  - `POST /api/v1/auth/register` & `POST /api/v1/auth/login` & `POST /api/v1/auth/logout` & `GET /api/v1/auth/me`
  - `GET /api/v1/businesses` & `POST /api/v1/businesses` & `GET /api/v1/businesses/{id}`
  - `GET /api/v1/businesses/{id}/profile` & `POST /api/v1/businesses/{id}/profile` (immutable versioning)
  - `GET /api/v1/businesses/{id}/profile/history` & `GET /api/v1/profile/variables`
- Frontend Next.js / React 19 / TypeScript application shell:
  - Canonical TypeScript types matching `FRONTEND_INSTRUCTIONS.md §5` (`ApplicabilityStatus`, `WorkflowStatus`, `DocumentStatus`, `ApiResponse`).
  - Unified typed API client under `frontend/lib/api/` (`health`, `auth`, `businesses`, and forward stubs).
  - Reusable component library under `frontend/components/` (`Navbar`, `StatusBadge`, `MetricCard`, `EmptyState`, `ErrorState`, `LoadingSkeleton`).
  - Modular feature folder structure under `frontend/features/`.
  - Main landing and verification view in `frontend/app/page.tsx` with live backend connectivity probe.

Tested:
- Backend test suite: `pytest -ra --strict-markers` (83 tests passed).
- Migrations: `python manage.py showmigrations` and `python manage.py migrate`.
- Live API endpoints: curl / Invoke-RestMethod for health, registration, token generation, business creation, profile querying.
- Frontend compilation & production build: `npm run build` (Turbopack + TypeScript type-checking clean).
- Frontend runtime execution: `npm run dev` running on `http://localhost:3000`.
- Browser verification: Executed real headless Google Chrome (`chrome.exe`) against `http://localhost:3000`, verified DOM render, and captured screenshot confirming live backend status indicator (`● API Online (v1)`).

Passed:
- 83/83 backend tests passed in 81s.
- Next.js production build passed in 26s with 0 TypeScript/ESLint errors.
- End-to-end frontend -> backend health probe succeeded with 200 OK.

Known issues:
- None. Offline local fallback defaults to SQLite when `DATABASE_URL` is empty. Supabase PostgreSQL connection string can be supplied in `.env` at any time.

Files changed:
- `backend/config/settings.py` (fixed `RUNNING_TESTS` SSL redirect exclusion during test execution)
- `frontend/app/layout.tsx` (standardized RootLayout props & ComplyWise metadata)
- `frontend/app/page.tsx` (foundation dashboard with live backend probe & UI showcase)
- `frontend/components/Navbar.tsx`, `StatusBadge.tsx`, `MetricCard.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `LoadingSkeleton.tsx`
- `frontend/lib/api/client.ts`, `health.ts`, `auth.ts`, `businesses.ts`, `index.ts`
- `frontend/types/index.ts`
- `frontend/features/*/index.ts`
- `.gitignore`, `.env.example`, `.env`, `README.md`
- `docs/PROJECT_EXECUTION.md`

Next task:
- TASK 2 — Knowledge & Applicability Core

---

## TASK 1 AUDIT CORRECTIONS (PHASE A)

Status: DONE

Audited Findings & Resolutions:
1. **A1 — Three-Valued Logic / Truth-Primitive Bug (`backend/domain/evaluation/truth.py`)**:
   - Finding: Truth primitives inherited from `StrEnum` and logic functions checked identity (`is FALSE`, `is UNKNOWN`). `not_("UNKNOWN")` evaluated to `TRUE` because string identity differs from enum identity.
   - Root cause: Missing strict normalization to canonical `TruthValue` singleton instances before identity comparison.
   - Fix: Added `to_truth_value(value)` with case-insensitive parsing, strict type checking, and converted all operations (`and_`, `or_`, `not_`, `all_of`, `any_of`, `from_optional`) to use normalized values.
   - Verification: Added 36 test cases to `backend/tests/test_three_valued_logic.py` covering all Kleene truth tables, identity/equality guarantees, and invalid type rejections. (57/57 tests passed).

2. **A2 — Gitignore Excluded Frontend API Client (`.gitignore`)**:
   - Finding: Line 22 `lib/` in root `.gitignore` matched and ignored `frontend/lib/`.
   - Root cause: Python virtualenv directory `lib/` was not anchored, unintentionally masking Next.js `frontend/lib/`.
   - Fix: Removed `lib/` and `lib64/` from `.gitignore`.
   - Verification: Ran `git check-ignore -v frontend/lib/api/client.ts` confirming it is tracked and unaffected by gitignore rules.

3. **A3 — Readiness Probe False Positive (`backend/common/health.py`)**:
   - Finding: `check_knowledge_packs()` only checked directory presence; an empty directory reported `status: "ok"`.
   - Root cause: Missing file-level inspection and JSON syntax verification.
   - Fix: Rewrote `check_knowledge_packs()` to recursively discover `.json`, `.yaml`, and `.yml` files, parse JSON files to ensure valid syntax, and report `not_configured` if file count is 0 or `degraded` if malformed JSON is detected.
   - Verification: Added 4 test cases in `backend/tests/test_health.py` validating 0 files, non-existent directory, valid packs, and malformed files. (10/10 tests passed).

4. **A4 — Frontend Types Drift (`frontend/types/index.ts`)**:
   - Finding: Types in `frontend/types/index.ts` had drifted from backend serializers and enums (e.g. `environment` in HealthData, missing enums and serializer fields).
   - Root cause: Manual synchronization without automated contract checking.
   - Fix: Aligned all types, models, serializers, and canonical status enums. Created `backend/tests/test_status_contract.py` which dynamically extracts TypeScript types and verifies 100% synchronization against Django TextChoices and DRF Serializers.
   - Verification: 16 contract tests passed; Next.js 16 production build (`npm run build`) succeeded with 0 TypeScript errors.

---

## TASK 2 — Knowledge & Applicability Core

Status: DONE

Implemented:
- Pure Domain AST Validator & Evaluator (`backend/domain/rules/ast.py`, `backend/domain/evaluation/evaluator.py`):
  - Deterministic evaluation engine supporting Boolean (`AND`, `OR`, `NOT`), Comparison (`EQ`, `NEQ`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `NOT_IN`), Existence (`EXISTS`, `MISSING`), and Classification/Set (`CONTAINS`, `MATCHES_CLASSIFICATION`, `INTERSECTS`) operators.
  - Strict AST schema validation rejecting non-dict nodes, unsupported operators, or missing operands with `AstValidationError`.
  - Exact Decimal conversion for currency, power loads, and employee counts.
  - Three-valued Kleene logic invariant: missing decision-critical variables produce `UNKNOWN`, NEVER `FALSE`.
  - Auditable `EvaluationTrace` capturing tree traversal, variable lookups, and sub-condition outcomes.
- Models & Migrations:
  - `Source` & `Evidence` in `backend/apps/evidence/models.py` (migration `evidence.0001_initial`).
  - `RequirementDefinition` & `RuleVersion` in `backend/apps/knowledge/models.py` (migration `knowledge.0002_initial`).
  - `DecisionRun` & `DecisionResult` in `backend/apps/applicability/models.py` (migration `applicability.0001_initial`).
- Knowledge Pack Loader & Golden Fixtures (`backend/apps/knowledge/loader.py`, `backend/knowledge_packs/fixtures/`):
  - Populated all 5 fixtures: `gujarat_food`, `telangana_electronics`, `gujarat_trade`, `tamil_nadu_auto`, `karnataka_esdm`.
  - Invariant: Validates AST before storing rules in the database.
  - Total fixture catalog: 11 authoritative sources, 11 verified evidence records, 11 requirement definitions, and 11 versioned rules.
- Generic Applicability Engine (`backend/apps/applicability/engine.py`):
  - Hard Invariant 1: Only `PUBLISHED` rules are evaluated (draft, superseded, archived rules are strictly excluded).
  - Hard Invariant 2: Zero scenario-specific hardcoded branches (`test_knowledge_boundary.py` verified).
  - Hard Invariant 3: Effective date window validation (`effective_from` and `effective_until`).
  - Hard Invariant 4: Uncertainty preservation: missing inputs produce `NEEDS_INFORMATION`, never `NOT_APPLICABLE`.
  - Evidence verification status propagation (`VERIFIED` -> `APPLICABLE`, `UNVERIFIED` -> `UNVERIFIED`, `CONFLICTING` -> `CONFLICT_REVIEW`).
  - Complete explanation trace and official evidence records attached to every `DecisionResult`.
- REST API Endpoints & Routes (`backend/apps/applicability/views.py`, `urls.py`, `backend/config/api_urls.py`):
  - `POST /api/v1/businesses/<uuid:business_id>/evaluate`
  - `GET /api/v1/businesses/<uuid:business_id>/decisions`
  - `GET /api/v1/businesses/<uuid:business_id>/decisions/<uuid:run_id>`
  - Enforced tenant isolation and authentication.
- Frontend Canonical Types (`frontend/types/index.ts`):
  - Added `DecisionRunStatus`, `DecisionRun`, `DecisionResult`. Verified by contract tests and Next.js build.

Tested:
- Unit tests for AST evaluation & Kleene logic: `backend/tests/test_ast_evaluator.py` (19 tests passed).
- Applicability engine publication gates & API tests: `backend/tests/test_applicability_engine.py` (6 tests passed).
- Golden regression suite across all 5 fixtures: `backend/tests/test_fixtures_regression.py` (7 tests passed).
- Architectural knowledge boundary enforcement: `backend/tests/test_knowledge_boundary.py` (14 tests passed).
- TypeScript contract integrity: `backend/tests/test_status_contract.py` (16 tests passed).
- Full backend pytest suite: 170 tests passing.
- Frontend production build: `next build` (clean Turbopack + TS compilation).

Passed:
- 170/170 backend tests passed.
- Next.js 16 build passed with 0 errors.

Known issues:
- None.

Files changed:
- `backend/domain/rules/ast.py`
- `backend/domain/evaluation/evaluator.py`
- `backend/apps/evidence/models.py`, `migrations/0001_initial.py`
- `backend/apps/knowledge/models.py`, `migrations/0002_initial.py`, `loader.py`
- `backend/apps/applicability/models.py`, `migrations/0001_initial.py`, `engine.py`, `serializers.py`, `views.py`, `urls.py`
- `backend/config/api_urls.py`
- `backend/knowledge_packs/fixtures/*/{sources,evidence,requirements,rules}.json`
- `backend/tests/test_ast_evaluator.py`
- `backend/tests/test_applicability_engine.py`
- `backend/tests/test_fixtures_regression.py`
- `backend/tests/test_status_contract.py`
- `frontend/types/index.ts`
- `docs/PROJECT_EXECUTION.md`

Next task:
- TASK 2 — OPUS AUDIT CORRECTION PASS

---

## TASK 2 — OPUS AUDIT CORRECTION PASS

Status: DONE

Audit Findings & Corrective Implementations:

1. **C1 & C14 — Rule Precedence & Result Choices (`apps/knowledge/models.py`, `apps/applicability/engine.py`)**:
   - Added canonical `RuleType` enum (`NORMAL`, `EXCEPTION`, `OVERRIDE`, `EXEMPTION`) in `common/enums.py` and `apps/knowledge/models.py`.
   - Added `RuleVersion.rule_type` with default `NORMAL` and explicit choices.
   - Enforced `ApplicabilityStatus.choices` validation on `RuleVersion.result`.
   - Engine honours `rule.result` (e.g. `NOT_APPLICABLE`, `EXEMPT`) rather than hardcoding `APPLICABLE`.
   - Precedence ordering enforced: `OVERRIDE > EXEMPTION > EXCEPTION > NORMAL`.
   - Generalized `RequirementDefinition.jurisdiction` help text from static state list to any canonical Indian jurisdiction code.
   - Created and applied migration `knowledge.0003_ruleversion_rule_type_and_more`.

2. **C2 & C5 — Applicability Engine Invariants & Conflict Detection (`apps/applicability/engine.py`)**:
   - Considers ALL published requirements across the catalog (not merely those with rules).
   - Removed all `break` statements: every candidate effective rule is evaluated and recorded in `explanation_trace["evaluations"]`.
   - Conflicting rules at the highest precedence level produce status `CONFLICT_REVIEW` with `conflicts: [rule_ids]`.
   - Uncovered published requirements produce explicit `UNVERIFIED` result with machine-readable reasons: `NO_PUBLISHED_RULE`, `OUTSIDE_EFFECTIVE_WINDOW`, or `JURISDICTION_NOT_MATCHED`.

3. **C3 — Non-Published Knowledge Isolation**:
   - Verified that all non-PUBLISHED statuses (`DRAFT`, `VALIDATION_PENDING`, `UNDER_REVIEW`, `APPROVED`, `SUPERSEDED`, `ARCHIVED`, `REJECTED`) are strictly ignored at runtime.

4. **C4 — Data-Driven Jurisdiction Registry (`domain/jurisdictions/resolver.py`, `knowledge_packs/jurisdictions/jurisdictions.json`)**:
   - Created data-driven `jurisdictions.json` with canonical codes and aliases for `CENTRAL` and 36 Indian states/UTs. Zero state maps in Python or TypeScript.
   - Implemented `JurisdictionRegistry` and `normalize_jurisdiction`.
   - BusinessProfileSerializer automatically normalizes profile state inputs.
   - Unresolvable state returns `NEEDS_INFORMATION` with reason `JURISDICTION_UNRESOLVED`. Missing state evaluates central rules normally while state-specific rules yield `NEEDS_INFORMATION`.

5. **C6 — Source-to-Evidence-to-Rule Chain Integrity**:
   - Enforced complete chain verification on `APPLICABLE` outcomes:
     - Zero evidence refs -> downgraded to `UNVERIFIED` (`ZERO_EVIDENCE`).
     - Dangling evidence ref -> downgraded to `UNVERIFIED` (`DANGLING_EVIDENCE_REF`).
     - Inactive/withdrawn source -> downgraded to `UNVERIFIED` (`INACTIVE_SOURCE_*`).
     - Expired or future evidence -> downgraded to `UNVERIFIED` (`EXPIRED_EVIDENCE` / `FUTURE_EFFECTIVE_EVIDENCE`).
     - Conflicting evidence -> `CONFLICT_REVIEW` (`CONFLICTING_EVIDENCE`).
   - Converted serialized evidence dates to ISO strings for SQLite JSONField compatibility.

6. **C7 & C10 — AST Evaluator Hardening & Type Safety (`domain/rules/ast.py`, `domain/evaluation/evaluator.py`)**:
   - Enforced maximum AST depth `MAX_AST_DEPTH = 32` raising `AstValidationError`.
   - Strictly forbidden float literals (`AstValidationError`) and nested sub-expressions in operands.
   - Canonicalized operator case in-place (`"eq"` -> `"EQ"`).
   - Type mismatches across all 15 operators return `UNKNOWN`, never raise unhandled exceptions or return false negative `FALSE`.
   - `INTERSECTS` operator made case-insensitive and safe against unhashable operands.

7. **C8 — Hardened Knowledge Pack Loader (`apps/knowledge/loader.py`, `schemas/*.json`)**:
   - Authored strict JSON schemas for `sources.json`, `evidence.json`, `requirements.json`, `rules.json` with `additionalProperties: false`.
   - Default status on load set to `DRAFT` and `UNVERIFIED`.
   - Detects global duplicate IDs across all packs.
   - Validates AST variables against the 19 canonical profile variables (V01–V19).
   - Strict ISO-8601 date parsing.
   - Clear error messages identifying directory, file, and validation error.

8. **C9 — Decision Run Lifecycle & API Resilience (`apps/applicability/views.py`, `apps/applicability/engine.py`)**:
   - `DecisionRun` starts in `RUNNING` status; updates to `COMPLETED` on finish or `FAILED` on exception.
   - `DecisionRun.evaluation_date` defaults to `timezone.localdate()`.
   - API endpoints wrap AST/evaluator exceptions in structured error responses (`AST_VALIDATION_ERROR`, `EVALUATION_FAILED`).
   - Integrated `EnvelopePageNumberPagination` into `BusinessDecisionRunsListView`.

9. **C11 — TypeScript Knowledge Boundary & Frontend Hygiene (`frontend/app/page.tsx`, `tests/test_knowledge_boundary.py`)**:
   - Purged hardcoded scenario arrays, fabricated authorities, and arbitrary fallback numbers from frontend.
   - Extended `test_knowledge_boundary.py` (18 tests) scanning all `frontend/**/*.ts(x)` files outside build directories for scenario leakage.

10. **C12 — Golden Dynamic Engine Invariant Test (`tests/test_dynamic_engine_invariant.py`, management command)**:
    - Created `load_knowledge_packs` management command supporting `--dir`, `--dry-run`, `--strict`, `--force-status`.
    - Golden Dynamic Test generates a synthetic 6th scenario in `tmp_path` (Odisha, Mining, OSPCB, operators `EQ`, `EXISTS`, `NOT`, `LT`, `NEQ`, `IN`). Evaluates end-to-end to `APPLICABLE`.
    - Proves 100% dynamic architecture: asserts zero SHA-256 changes in engine files before and after evaluation.

11. **C13 — Inclusive Boundary Dates (`apps/applicability/engine.py`)**:
    - Validated that `evaluation_date == effective_from` and `evaluation_date == effective_until` are both inclusively active.

12. **C14 — Repository Hygiene & .gitignore Narrowing**:
    - Narrowed root `.gitignore` from blanket `*.png` to targeted directories (`.chrome-temp/*.png`, `.tempmediaStorage/`, `tests/artifacts/*.png`, `screenshots/*.png`).
    - Added `.gitkeep` files in empty knowledge pack directories.

Tested:
- Backend test suite: `pytest backend/tests` — **236 passed out of 236 tests (100%)** in 174.72s.
  - `test_applicability_engine.py`: 32 passed
  - `test_ast_evaluator.py`: 40 passed
  - `test_auth.py`: 9 passed
  - `test_businesses.py`: 9 passed
  - `test_dynamic_engine_invariant.py`: 5 passed
  - `test_fixtures_regression.py`: 7 passed
  - `test_health.py`: 11 passed
  - `test_knowledge_boundary.py`: 18 passed
  - `test_knowledge_loader.py`: 9 passed
  - `test_profile_versions.py`: 23 passed
  - `test_status_contract.py`: 16 passed
  - `test_three_valued_logic.py`: 57 passed
- Django system checks: `python manage.py check` (0 issues).
- Django migrations check: `python manage.py makemigrations --check --dry-run` (No changes detected).
- Frontend production build: `npm run build` in `frontend` (Clean Next.js 16 Turbopack build, 0 errors).
- Tenant isolation and multi-tenancy access control: verified via dedicated tests.

Passed:
- 236/236 backend tests passed (100%).
- Next.js production build succeeded with exit code 0.

Known issues:
- None.

---

## Milestone Implementation — Screens 01–07 (Primary Journey) + Screens 08–15 (Application Surface)

Authority: PRD_v2.0, TRD_v2.0, FRONTEND_INSTRUCTIONS.md, Problem Statement 26130.

### 1. Architectural Integrity & Dynamic Engine Preservation
- **100% Data-Driven Smart Questions**: Implemented in `backend/apps/onboarding/services.py` (`extract_ast_variables`, `get_dynamic_smart_questions`). Zero hardcoded industry branches (`if scenario == ...`). Dynamically inspects published candidate rule ASTs matching state jurisdiction, identifies missing decision-critical variables, and returns question objects with statutory rationale.
- **Natural Language Product Normalization**: Implemented in `backend/apps/onboarding/services.py` (`save_products_and_activities`). Persists `product_description` (V06) and `import_export_intent` (V11) into immutable profile versions without fabricating rules.
- **Audited Compliance Readiness Calculation**: Implemented in `backend/apps/dashboard/services.py` (`get_dashboard_summary`). Computes true percentage readiness score, priority actions, upcoming statutory deadlines, category breakdown, and jurisdiction breakdown.

### 2. Backend Modules & Versioned API Endpoints (`/api/v1/`)
- `apps/onboarding`:
  - `GET /api/v1/businesses/<id>/onboarding/questions` — Dynamic Smart Questions derived from AST
  - `POST /api/v1/businesses/<id>/onboarding/answers` — Immutable profile version with `USER_PROVIDED` provenance
  - `POST /api/v1/businesses/<id>/onboarding/products-activities` — Natural language operations persistence
  - `GET /api/v1/businesses/<id>/onboarding/status` — Multi-step onboarding progress tracker
- `apps/dashboard`:
  - `GET /api/v1/businesses/<id>/dashboard` — Executive overview & readiness metrics
- `apps/requirements`:
  - `GET /api/v1/businesses/<id>/compliance` — Filterable statutory matrix
  - `GET /api/v1/businesses/<id>/compliance/<req_id>` — Detail view answering the 4 core questions
- `apps/documents`:
  - `GET /api/v1/businesses/<id>/documents` — Document vault
  - `POST /api/v1/businesses/<id>/documents/upload` — Statutory upload with AI pre-validation disclaimer
- `apps/workflows`:
  - `GET /api/v1/businesses/<id>/workflows` — Multi-step clearance progressions
- `apps/calendar`:
  - `GET /api/v1/businesses/<id>/calendar` — Statutory filing deadlines & penalty risks
- `apps/schemes`:
  - `GET /api/v1/businesses/<id>/schemes` — Matched subsidies (Udyam, PMEGP, CLCSS)
- `apps/standards`:
  - `GET /api/v1/standards/search` — BIS/ISO standards lookup
- `apps/regulatory_updates`:
  - `GET /api/v1/regulatory-updates` — Central & state gazette circulars
- `apps/assistant`:
  - `POST /api/v1/assistant/chat` — Source-grounded regulatory copilot with verified citations

### 3. Frontend Implementation (Next.js 16 App Router)
- **Typed API Clients** (`frontend/lib/api/`):
  - `onboarding.ts`, `dashboard.ts`, `compliance.ts`, `documents.ts`, `workflows.ts`, `calendar.ts`, `schemes.ts`, `standards.ts`, `regulatoryUpdates.ts`, `assistant.ts`, consolidated in `index.ts`.
- **Screen 01 — Welcome (`app/page.tsx`)**:
  - Live backend connectivity probe, PS 26130 badge, uncertainty states showcase, 7-step pipeline cards, prominent primary CTAs.
- **Sign In & Demo Access (`app/auth/signin/page.tsx`)**:
  - Sign in, register, and one-click Fast Demo Login (`compliance.officer@example.com`).
- **Screens 02–06 — Onboarding Flow (`app/onboarding/page.tsx`)**:
  - Step 1: Business Profile (name, legal constitution, registered state, industrial zone, lifecycle stage, investment, turnover, employees)
  - Step 2: Products & Activities (natural-language operations description, cross-border trade intent, detected activity pills)
  - Step 3: Smart Questions (data-driven AST missing variables, type-specific inputs, statutory rationale cards)
  - Step 4: Regulatory Analysis (honest pipeline checklist, real execution trigger to `/evaluate`)
  - Step 5: Initial Results (applicable mandates, unresolved variables, not applicable, audit-ready summary, itemized obligation cards)
- **Screen 07 — Operational Dashboard (`app/dashboard/page.tsx`)**:
  - Compliance readiness score gauge, priority actions, statutory deadlines, quick navigation application grid.
- **Screens 08–15 — Full Application Surface**:
  - Screen 08 (`app/compliance/page.tsx`): Filterable compliance matrix by status and domain.
  - Screen 09 (`app/compliance/[id]/page.tsx`): 4 Core Questions (Why it applies, What you need, What to do next, Statutory evidence trace).
  - Screen 10 (`app/documents/page.tsx`): Statutory vault, pre-validation checks, legal disclaimer.
  - Screen 11 (`app/workflows/page.tsx`): Clearance workflows with progression and blocker indicators.
  - Screen 12 (`app/calendar/page.tsx`): Compliance schedule with statutory penalty risks.
  - Screen 13 (`app/schemes/page.tsx`): Matched MSME incentive schemes and application URLs.
  - Screen 14 (`app/standards/page.tsx`): Interactive BIS/ISO standards directory search.
  - Screen 15 (`app/assistant/page.tsx`): Source-grounded AI copilot citing verified statutory excerpts.

### 4. Verification & Quality Gates
- `npx tsc --noEmit`: Exited with code 0 (zero TypeScript errors).
- `npm run build`: Next.js 16.3.4 (Turbopack) production build passed with code 0. All 14 routes generated successfully.
- `python manage.py check`: 0 issues.
- `backend/tests/test_status_contract.py`: 16/16 contract integrity tests passed.
- `backend/tests/test_onboarding.py`: 5/5 passed.
- Strict multi-tenancy & access control verified across all endpoints.

---

## TASK 3+4 (PARTIAL) + V2 DYNAMIC-PROTOTYPE AUDIT — Dynamic End-to-End Verification

Status: DONE (audit + fix + verify cycle; the research-paper ingestion architecture
is explicitly the NEXT phase and was not attempted).

### What was audited and verified at runtime

The full internal accuracy pipeline was traced and exercised end-to-end against a
live stack (Django dev server + Next.js production build + real Chrome via CDP):

```text
Business Profile (19-var registry)   IMPLEMENTED  — canonical keys accepted; unknown keys 400
  ↓  (POST /businesses/{id}/profile, GET /profile/variables)
Product/Activity understanding        IMPLEMENTED  — free text persisted; detected terms come
                                                   from published rule AST probes, never a label set
  ↓
Variable resolution / context         IMPLEMENTED  — immutable versions, provenance, jurisdiction
                                                   normalisation is data-driven (jurisdictions.json)
  ↓
Smart questions (rule-driven)         IMPLEMENTED  — questions = rule-referenced vars − answered
                                                   vars; answers make questions disappear (verified)
  ↓
Knowledge selection + jurisdiction    IMPLEMENTED  — PUBLISHED only; CENTRAL+state filter
  ↓
Rule evaluation (3-valued Kleene)     IMPLEMENTED  — missing decision-critical var ⇒
                                                   NEEDS_INFORMATION, never silent NOT_APPLICABLE
  ↓
Evidence validation                   IMPLEMENTED  — zero/dangling/inactive/expired/conflicting
                                                   evidence downgrades APPLICABLE → UNVERIFIED/
                                                   CONFLICT_REVIEW
  ↓
Decision generation                   IMPLEMENTED  — DecisionRun RUNNING→COMPLETED/FAILED;
                                                   precedence OVERRIDE>EXEMPTION>EXCEPTION>NORMAL
  ↓
Explanation trace                     IMPLEMENTED  — every rule considered is recorded with truth
                                                   value; matched rule id/version on the result
  ↓
Source linkage                        IMPLEMENTED  — requirement detail carries
                                                   Evidence → Source (title, authority, locator,
                                                   verification status, canonical URL)
  ↓
Dashboard result                      IMPLEMENTED  — all counts from the latest DecisionRun; nulls
                                                   rendered as "Not yet calculated", none invented
```

### Live verification evidence

- API journey (PowerShell/Invoke-RestMethod), fresh user, unseen businesses:
  - Kerala spice business: 11 results, jurisdiction-correct (all non-Kerala state
    requirements NOT_APPLICABLE with `JURISDICTION_NOT_MATCHED`; central rules
    decided by AST): PASS.
  - Gujarat food business: missing `annual_turnover` ⇒ FSSAI NEEDS_INFORMATION;
    question asked; question answered; re-evaluation ⇒ FSSAI/GPCB/Gujarat factory
    APPLICABLE with evidence; IEC NEEDS_INFORMATION until intent answered: PASS.
  - Unknown profile variable ⇒ 400 "Not a recognised business profile variable."
    (this is the correct contract; the frontend form is registry-driven, so real
    keys can never drift — the historical runtime error was pre-registry drift).
- Browser journey (real Chrome via CDP, production Next.js build): sign in →
  new business → profile → products → 2 dynamic questions → analysis → results
  (3 APPLICABLE, 8 NOT_APPLICABLE with reasons) → dashboard (Assessment
  Completeness 100% with real basis sentence) → compliance list → requirement
  detail (4 questions + verified FSSAI evidence trace): 16/16 checks PASS.
- Tenant isolation and auth: 404 for a foreign business, 401 without token: PASS.

### Fixes applied during this audit

1. `frontend/types/index.ts` — corrected dormant contract drift:
   `OnboardingStatus` rewritten to the actual backend shape; added
   `SmartQuestionAnswerResponse`; `DashboardSummary` gained `readiness_label` /
   `readiness_basis`; `SmartQuestionsResponse`/`SmartQuestion` aligned to the
   service payload (`total_missing`, `question`, `required`, …).
2. `frontend/lib/api/onboarding.ts` — `submitAnswers` now typed to the real
   `{message, profile_version}` envelope (was mis-typed as `BusinessProfileVersion`).
3. `frontend/features/dashboard/index.ts` — removed a stale camelCase
   `DashboardMetrics` that contradicted the canonical type; now re-exports `@/types`.
4. `frontend/app/onboarding/page.tsx` — closed an UNKNOWN→FALSE fabrication path:
   unanswered choice/numeric questions are no longer pre-filled (first option / 0)
   and are omitted from the answers payload; the defunct `q.relevance` display now
   renders the real `required` flag.
5. `backend/apps/assistant/views.py` — resolves the provider up front so an invalid
   `LLM_PROVIDER` is a deterministic 503 `PROVIDER_MISCONFIGURED` regardless of
   retrieval outcome (previously it depended on whether evidence matched).
6. `backend/config/settings.py` — Gemini defaults are now models that exist for
   current API keys (`gemini-3.1-flash-lite`, `gemini-embedding-001`); the old
   defaults (`gemini-2.5-pro`, `text-embedding-004`) were verified to return
   HTTP 404 for a current AI Studio key.
7. `backend/apps/dashboard/services.py` — `due_soon_count` now honours
   `UPCOMING_DEADLINE_WINDOW_DAYS` (previously declared but never read).
8. `.env.example` — documents LLM/EMBEDDING provider selection, all provider
   keys/models, Firecrawl server-only usage; `.env` aligned (GROK vs GROQ
   confusion documented; Groq key is not read by the application).
9. Seeded the demo account `compliance.officer@example.com` — the Sign-In page
   offered one-click demo login against a user that did not exist in the DB.

### New regression tests (23)

- `tests/test_providers.py` (16): provider selection via env; unknown provider
  rejected loudly; grok correctly unavailable for embeddings; missing keys →
  `ProviderNotConfigured` without network traffic; status payloads contain no
  secrets; assistant degrades to citations-only without a key; 503 on invalid
  provider; no-evidence queries never claim an answer.
- `tests/test_dynamic_behavior.py` (5+): missing var ⇒ NEEDS_INFORMATION;
  answering resolves to APPLICABLE with evidence; changed activity changes the
  outcome; questions track answered variables; question set changes with
  jurisdiction.
- The existing `tests/test_dynamic_engine_invariant.py` remains the sixth-scenario
  proof: a synthetic Odisha/OSPCB pack evaluates APPLICABLE with byte-identical
  engine files (SHA-256 asserted).

### Gates re-run after all changes

- `pytest`: **265 passed** (242 prior + 23 new).
- `python manage.py check`: 0 issues. `makemigrations --check --dry-run`: clean.
- `npx tsc --noEmit`: 0 errors. `npm run build`: all 14 routes, 0 errors.
- Browser suite (this milestone): 16/16 + 5/5 (detail/evidence deep-check).

---

## FINAL BOSS IMPLEMENTATION — COMPLETED & VERIFIED (Problem Statement 26130)

### Headline Achievements
- **Deterministic Evaluation Engine:** 100% dynamic, AST-driven evaluation preserving three-valued Kleene logic (`APPLICABLE`, `NOT_APPLICABLE`, `NEEDS_INFORMATION`).
- **Milestone 30 Runtime Verification:**
  - **Test A (Fixture-equivalent business - Gujarat Food Processing):** Correctly resolved 11 rules (`REQ-FSSAI-STATE-LICENCE`, `REQ-GPCB-CTE`, `REQ-GUJ-FACTORY-LICENSE` resolved to `APPLICABLE`).
  - **Test B (New business with evidence - Telangana Smart Electronics):** Correctly resolved `REQ-TSPCB-CTE` and `REQ-BIS-CRS-SMART-METER` to `APPLICABLE` with complete provenance (`evidence_refs`, `explanation_trace`).
  - **Test C (Coverage gap / incomplete profile):** Honestly resolved to `NEEDS_INFORMATION` (FSSAI State Licence), never false `NOT_APPLICABLE`.
- **Full Browser E2E Validation (Playwright Chrome):**
  - All 16 verification steps passed end-to-end:
    1. Welcome Screen (`/`) with Problem Statement 26130 badge.
    2. Authentication (`/auth/signin`) with Fast Demo Login redirect.
    3. Onboarding Step 1 (Business Profile creation with canonical variables).
    4. Onboarding Step 2 (Products & Activities NLP input).
    5. Onboarding Step 3 (Smart Questions dynamic interaction).
    6. Onboarding Steps 4 & 5 (Regulatory Analysis & Initial Results with executive summary metrics).
    7. Operational Dashboard (`/dashboard`) with live calculated metrics.
    8. Compliance Matrix (`/compliance`) & Requirement Detail (`/compliance/[id]`) with 4 Core Questions and verified statutory evidence trace.
    9. Statutory Documents Vault (`/documents`).
    10. Clearance Workflows (`/workflows`) with honest capability statuses.
    11. Statutory Compliance Calendar (`/calendar`).
    12. Schemes & Incentives Directory (`/schemes`).
    13. Standards Directory (`/standards`) with real-time search.
    14. AI Assistant Copilot (`/assistant`) with grounded citations.
  - Total Page Errors: **0**
  - Total Serious Console Errors: **0**
- **Test Invariants:**
  - Pytest: **265/265 passed** across 15 test suites.
  - Synthetic 6th scenario invariant: Byte-for-byte SHA-256 equality asserted on core engine files.
  - Zero scenario hardcoding in application code (guarded by `test_knowledge_boundary.py`).
- **AI & Retrieval:**
  - Gemini set as default (`gemini-3.1-flash-lite` LLM, `gemini-embedding-001` embeddings).
  - Firecrawl server-side integration for live authoritative source discovery.
  - Zero secrets in frontend code, git, or error envelopes.

---

## LIVE REGULATORY DISCOVERY & ADAPTIVE INTELLIGENCE MILESTONE — COMPLETED & VERIFIED

### Headline Achievements
- **Adaptive Smart Question Planner (`SmartQuestionPlanner`):**
  - Synthesizes `DerivedBusinessContext` (MSMED Act 2020 composite investment/turnover scaling, manufacturing/service indicators, trade intent, environmental footprint) and AST rule dependencies.
  - AI-assisted question formulation and ranking with fallback to deterministic variable definitions (`backend/apps/onboarding/planner.py`).
  - Persists `SmartQuestionPlan` and `SmartQuestionInstance` linked to canonical variable keys (V01–V19) with strict business isolation.
- **Live Regulatory Discovery (Firecrawl v2):**
  - Dynamic `RegulatoryQueryPlanner` generates targeted queries based on business sector, activities, location, and derived context.
  - Robust stdlib client (`backend/apps/ingestion/firecrawl.py`) interfacing with Firecrawl v2 API.
  - Domain authority classification (`OFFICIAL`, `OFFICIAL_GUIDANCE`, `SECONDARY`, `UNKNOWN`) prioritizing official `.gov.in` and `.nic.in` domains.
  - Secure structured claim extraction (`claim_extraction.py`) extracting requirements, authorities, and source links.
- **Strict Evidence Quarantine Invariant:**
  - Discovered web claims are strictly stored in `CandidateRequirement` with `verification_status="UNVERIFIED"` and `Source.status="DISCOVERED"`.
  - The deterministic AST applicability engine remains authoritative. Candidate claims NEVER enter `RequirementDefinition` or `DecisionResult` and NEVER produce `APPLICABLE` decisions without human review.
- **Frontend Live Discovery & Filtering (Part N):**
  - Real-time Firecrawl discovery execution during Onboarding Step 4, rendering Live Discovery Summary and Quarantined Candidate Claims in Step 5.
  - Dashboard Live Discovery Provenance banner displaying official source count and quarantined candidate count.
  - Compliance Matrix view filtering tabs:
    - "Action Required" (default view: `APPLICABLE` & `NEEDS_INFORMATION`)
    - "Verification Required" (`UNVERIFIED` candidates & `CONFLICT_REVIEW`)
    - "Discovered Knowledge (Quarantined)" (all candidate requirements with amber quarantine badges)
    - "All Published Rules" (authoritative knowledge packs)
    - Collapsible "Audit Trail: Not Applicable Obligations" (`NOT_APPLICABLE` rules hidden by default).
- **Automated & E2E Validation:**
  - Unit & Integration Test Suites: 30/30 passed (`test_business_context.py`, `test_smart_question_planner.py`, `test_regulatory_discovery.py`, `test_business_isolation_regression.py`, `test_dynamic_behavior.py`, `test_dynamic_engine_invariant.py`, `test_fixtures_regression.py`, `test_live_firecrawl_smoke.py`).
  - Playwright Chrome E2E test with unseen business (*Eastern GridCell Energy Pvt. Ltd.* in West Bengal): full onboarding, adaptive questioning, live discovery, initial results, dashboard provenance banner, and filtered compliance matrix with 0 console errors and 0 page errors.

---

### Task Milestone: Environment-Driven, Production-Safe CORS & CSRF Architecture

Implemented fully production-ready, domain-agnostic CORS and CSRF configuration:
- **Canonical Origin Parsing & Validation (`backend/config/cors.py`):**
  - Extracts comma-separated origins, trims whitespace, discards empty tokens, and deduplicates while preserving order.
  - Strict origin validation enforcing scheme (`http://` or `https://`), network location, and rejection of wildcards (`*`), path components, queries, and fragments.
  - Production enforcement: Disallows `*` wildcard and insecure `http://` schemes. Enforces HTTPS for all production origins. Disallows `localhost` in production unless explicitly opted in via `CORS_ALLOW_LOCALHOST_IN_PRODUCTION=True`.
  - Fail-safe startup validation: In production (`DJANGO_DEBUG=False`), missing or malformed `CORS_ALLOWED_ORIGINS` raises an actionable `CorsConfigurationError` on startup.
- **Centralized Settings (`backend/config/settings.py`):**
  - Integrated `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `CORS_ALLOW_METHODS`, `CORS_ALLOW_HEADERS`, and `CORS_PREFLIGHT_MAX_AGE`.
  - Zero hardcoding of deployment domains: Azure Application Settings or environment variables inject frontend origins at runtime without backend source-code changes.
- **Automated Test Suite (`backend/tests/test_cors.py`):**
  - 21/21 tests passing covering allowed localhost origins, production origins, multiple origins, unlisted origins, OPTIONS preflight requests, credentials handling, authenticated cross-origin requests, wildcard rejections, missing variable failures, whitespace handling, and syntax validation.
- **Documentation & Configuration Templates:**
  - Updated `.env.example`, `README.md` (Section 7), and frontend integration contract (`NEXT_PUBLIC_API_BASE_URL`).








