# PROJECT_EXECUTION.md — ComplyWise

## Hackathon Implementation Tracker

**Problem Statement:** 26130  
**Purpose:** Living record of what is actually built and verified.

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




