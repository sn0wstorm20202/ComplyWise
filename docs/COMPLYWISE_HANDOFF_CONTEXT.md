# COMPLYWISE — ENGINEERING HANDOFF CONTEXT & ARCHITECTURAL AUDIT

**Target Audience:** Lead Engineers, Backend Architects, Frontend Engineers, Intelligence Pipeline Developers  
**Author:** Senior Software Architect & Codebase Auditor  
**Date:** September 2026  
**Document Location:** `docs/COMPLYWISE_HANDOFF_CONTEXT.md`  
**Repository Branch:** `feat/api-orchestration` (Active) / `main` (Reference)  

---

## 1. Executive Summary

ComplyWise is an industrial-grade, India-focused statutory compliance intelligence platform designed to replace manual regulatory consulting for Indian founders and enterprises. The platform's foundational motto is:

> **RAG retrieves. Rules decide. LLM explains.**

The founder provides raw business facts (operations, manufacturing activities, scale, power, location, and trade). The platform is responsible for deriving legal applicability through deterministic evaluation engines, backed by verifiable evidence retrieved from statutory gazettes, state pollution control boards, municipal authorities, and regulatory portals. The founder is **never** expected to self-diagnose whether a license, factory registration, consent, or standard applies to them.

### Key Audit Findings
1. **Critical Question Bug Identified:**
   - **[CONFIRMED BUG]** In [questionnaire.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/intelligence/questionnaire.py#L1470), the question engine generates 5–6 questions via LLM, but line 1470 unconditionally asserts `if len(questions) != 15: questions = generate_emergency_15_questions(...)`. Because `len(questions)` is 5 or 6, the system **always discards the LLM-tailored questions** and executes the hardcoded 15-question fallback!
   - In that fallback, Q01 (connected electrical load), Q02 (total workforce count), Q03 (premises), and Q11 (factory floor area) are hardcoded. Even if a founder provides: *"connected load is 480 kVA, factory area is 97,000 m², workforce is 165"*, the system asks these identical questions again.
   - In [business_context.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/context/business_context.py#L202-L255), free-text parsing is absent: the `product_description` string is not parsed into structured numerical facts (power, area, workers, shifts), so `already_known_facts` passed to question generators remains empty.

2. **Admin Dashboard Disconnect:**
   - **[CONFIRMED BUG]** The Admin Control Room ([frontend/app/admin/page.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/app/admin/page.tsx) and [backend/apps/workflows/views.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/workflows/views.py#L780)) is disconnected from the active assessment truth.
   - Admin overview queries `business.compliance_cases.all()` directly. If compliance cases have not been explicitly generated into the operational case table, admin views show **zero compliance requirements**, even when Engine 2 has evaluated 9 applicable mandates for the business's active assessment!
   - Admin has no Assessment selector, cannot inspect Schemes or Standards for a business, and cannot inspect the retrieved evidence chunks that triggered the system's applicability determinations.

3. **Status of Stabilization:**
   - Critical data-flow priority inversions (where the LLM synthesis cache was overriding Engine 2 deterministic results) have been fixed in [orchestration_views.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/businesses/orchestration_views.py) and [compliance/page.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/app/compliance/page.tsx).
   - Assessment creation idempotency has been added to prevent duplicate empty assessments.
   - Crawlee web-acquisition layer is implemented behind `BaseWebAcquisitionLayer` in `backend/domain/acquisition/`.
   - All 60 applicability engine tests and 10 regression audit tests pass. Next.js builds cleanly across all 31 routes.

---

## 2. What ComplyWise Is

ComplyWise automates the regulatory lifecycle for Indian commercial enterprises across Central, State, and Municipal jurisdictions.

### Core Value Proposition
- **Founder-Facing:** An intelligent intake flow that ingests basic business identity, location, and operational descriptions, asks a minimal number of non-redundant adaptive questions (0 to 4), and outputs an authoritative Compliance Matrix, Government Schemes Matcher, Voluntary Standards Roadmap, Document Repository, and Statutory Calendar.
- **Officer/Admin-Facing:** An internal Scrutiny Desk and Review Control Room where compliance officers review uploaded applicant filings, verify document authenticity via OCR extracts, inspect statutory citations, issue queries, approve or reject submissions, and manage statutory deadlines.

---

## 3. Intended Product Flow

```
USER BUSINESS CONTEXT (Name, Constitution, State, District, Turnover)
  ↓
BUSINESS DESCRIPTION (Free-text operations, processes, machinery, materials)
  ↓
BUSINESS UNDERSTANDING (Sector ontology, activity extraction, entities)
  ↓
CANONICAL BUSINESS FACTS (Normalized variables: load, area, workers, shifts)
  ↓
MINIMAL ADAPTIVE QUESTIONS (0 to 4 questions strictly for unresolved decision variables)
  ↓
PROFILE VERSION (Immutable snapshot with provenance)
  ↓
BUSINESS-AWARE RETRIEVAL (Search planning constrained by facts)
  ↓
WEB / OFFICIAL SOURCE DISCOVERY (Crawlee official portal ingestion)
  ↓
VERIFIED EVIDENCE (Evidence chunks with checksum, authority, locator)
  ↓
ENGINE 2 APPLICABILITY (Deterministic AST evaluation under Kleene 3-valued logic)
  ↓
COMPLIANCE INTELLIGENCE RECORD (CIR / DecisionResults)
  ↓
COMPLIANCE / SCHEMES / STANDARDS / WORKFLOWS / CALENDAR
  ↓
USER DASHBOARD & COMPLIANCE MATRIX
  ↓
ADMIN CONTROL ROOM & SCRUTINY REVIEW (Operating on the SAME assessment truth)
```

---

## 4. Current Repository Architecture

The platform is structured as a modular Django REST Framework backend coupled to a Next.js 16 (Turbopack) frontend:

```
D:\SIH\Branches\ComplyWise\
├── backend/
│   ├── apps/
│   │   ├── accounts/          # User & staff auth, Token authentication, RBAC
│   │   ├── businesses/        # Business entity, Assessment lifecycle, BusinessProfileVersion
│   │   ├── onboarding/        # SmartQuestionPlan, SmartQuestionInstance, adaptive services
│   │   ├── knowledge/         # RequirementDefinition, RuleVersion (AST logic)
│   │   ├── evidence/          # Statutory evidence storage, locator anchors, sources
│   │   ├── applicability/     # Engine 2: DecisionRun, DecisionResult (CIR)
│   │   ├── requirements/      # BusinessComplianceListView, compliance serializers
│   │   ├── documents/         # DocumentRequirement, DocumentSubmission, OCR inspection
│   │   ├── workflows/         # ComplianceCase, ReviewTask, HumanReview, transitions
│   │   ├── calendar/          # Statutory deadlines, notifications, Google Calendar sync
│   │   ├── schemes/           # Government scheme matching engine (incentives/subsidies)
│   │   ├── standards/         # BIS/ISO/QCO voluntary and mandatory standards matching
│   │   ├── dashboard/         # Aggregated metrics, category breakdown, readiness score
│   │   └── ingestion/         # Knowledge pack ingestion, coverage assessment
│   ├── common/                # Enums, envelope formatting, permissions
│   ├── config/                # settings.py, urls.py, wsgi.py
│   ├── domain/
│   │   ├── acquisition/       # Crawlee web acquisition layer (base.py, crawlee_provider.py)
│   │   ├── context/           # business_context.py (DerivedBusinessContext)
│   │   ├── evaluation/        # evaluator.py (AST evaluation), truth.py (Kleene 3-valued logic)
│   │   ├── intelligence/      # Orchestrator, synthesis, discovery, questionnaire, search_planning
│   │   ├── jurisdictions/     # normalize_jurisdiction, state registry
│   │   ├── profile/           # variables.py (PROFILE_VARIABLES V01-V19, coerce_value)
│   │   ├── providers/         # LLM provider abstraction (OpenAI, Gemini, Grok)
│   │   └── rules/             # ast.py (AST schema validation, AST operators)
│   ├── knowledge_packs/       # Catalogs, statutory portals, Maharashtra manufacturing fixtures
│   └── tests/                 # 42+ pytest test suites
├── frontend/
│   ├── app/
│   │   ├── admin/             # Control Room, cases queue, business overview, login
│   │   ├── auth/              # Sign-in (user & officer tabs), register
│   │   ├── onboarding/        # 5-step onboarding wizard
│   │   ├── dashboard/         # Business dashboard, health cards, quick drawers
│   │   ├── compliance/        # Compliance Matrix (Action Required, Under Review, Discovered)
│   │   ├── schemes/           # Matched government schemes
│   │   ├── standards/         # BIS/ISO standards matrix
│   │   ├── documents/         # Document repository, upload, pre-check status
│   │   ├── workflows/         # Step-by-step interactive compliance execution
│   │   └── calendar/          # Deadline calendar, notification settings
│   ├── components/            # AppShell, AdminShell, DashboardView, FifteenQuestionsWizard
│   ├── context/               # BusinessContext.tsx (tenant workspace state, active entity)
│   └── lib/                   # api client, auth, orchestration, authorityPortals
└── docs/                      # PRD, TRD, Audit Instructions, Full Audit Report
```

---

## 5. Actual Runtime Data Flow

### The Onboarding Journey
1. **Step 1 — Business Profile:** User fills Entity Name, Legal Constitution, State, District, Industrial Siting, Stage, Investment, Turnover, and Worker Count. Form calls `POST /api/v1/businesses/` and creates `BusinessProfileVersion` (v1).
2. **Step 2 — Products & Operations:** User enters a free-text description of operations and trade intent. Calls `PATCH /api/v1/businesses/{id}/` and updates profile with `product_description`.
3. **Step 3 — Questions:**
   - Calls `POST /api/v1/assessments/{id}/orchestration/generate-questions/`.
   - `AssessmentOrchestrator` invokes `QuestionnaireEngine.generate_questionnaire()`.
   - Generates questions, saves to `SmartQuestionPlan` and `SmartQuestionInstance`.
   - User answers sequentially via `POST /api/v1/assessments/{id}/orchestration/submit-answer/`.
   - Each answer creates a new immutable `BusinessProfileVersion` (v2, v3, ...).
4. **Step 4 — Regulatory Analysis:**
   - Executes 8-stage pipeline: `business_understanding` → `question_generation` → `regulatory_discovery` → `compliance_synthesis` → `schemes` → `standards` → `workflow` → `calendar`.
   - Runs `ApplicabilityEngine.evaluate_business_profile()` to generate `DecisionRun` and `DecisionResult` records in PostgreSQL.
5. **Step 5 — Results & Hand-off:**
   - User reviews initial summary and enters `/dashboard` or `/compliance`.

---

## 6. Business / Assessment / Profile Version Model

### [CURRENT IMPLEMENTATION]
* **`Business`:** The root tenant entity (`id`, `name`, `owner`, `is_active`, `created_at`).
* **`BusinessProfileVersion`:** An immutable snapshot of business facts at a point in time:
  - `version`: Integer sequence (1, 2, 3...).
  - `variables`: JSON dictionary holding variable entries. Format:
    ```json
    {
      "state": {"value": "MAHARASHTRA", "origin": "USER_PROVIDED", "recorded_at": "..."},
      "total_worker_count": {"value": 165, "origin": "USER_PROVIDED", "recorded_at": "..."}
    }
    ```
* **`Assessment`:** Represents a compliance evaluation run for a business:
  - `assessment_number`: Incremental index per business.
  - `status`: `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`.
  - `profile_version`: Foreign key to the `BusinessProfileVersion` evaluated.
  - `decision_run`: Foreign key to Engine 2 `DecisionRun`.
  - `stage_metadata`: JSON dictionary caching outputs of orchestration stages.

### [ROOT CAUSE: Stale Assessment Linking]
The foreign key `Assessment.decision_run` was historically only assigned during explicit assessment completion (`AssessmentCompleteView`). If an assessment remained `IN_PROGRESS` or the evaluation was triggered mid-flow, `assessment.decision_run` was `None`. This has been mitigated by querying `DecisionRun.objects.filter(assessment=assessment).order_by('-created_at').first()`, but the FK must be set whenever `ApplicabilityEngine` completes.

---

## 7. Onboarding Flow

```
[Step 1: Identity & Scale] -> [Step 2: Operations Description] -> [Step 3: Questions] -> [Step 4: Real Analysis] -> [Step 5: Compliance Matrix]
```

### [CONFIRMED BUG: Front-to-Back Flow Mismatch]
- The frontend component is explicitly titled [FifteenQuestionsWizard.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/components/onboarding/FifteenQuestionsWizard.tsx). It shows a progress counter hardcoded to 15 questions (`Math.round(((idx + 1) / questions.length) * 100)`).
- The prompt instructs: *"The onboarding questionnaire is currently too long and too repetitive... The system asks a small number of high-value follow-up questions, generally around 3–4 or fewer. 0 questions if enough information already exists."*
- Currently, the frontend and backend are both locked into forcing a question set instead of evaluating whether the business description already satisfies all required AST variables.

---

## 8. Current Question Engine

### [CURRENT IMPLEMENTATION]
Located in [backend/domain/intelligence/questionnaire.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/intelligence/questionnaire.py).

Two question generators exist:
1. `QuestionnaireEngine.generate_questionnaire()`:
   - Constructs a prompt incorporating `already_known_facts`.
   - Calls the configured LLM provider (temperature=0.2).
   - Validates JSON output via `validate_and_normalize_questions()`.
2. `generate_emergency_questions()` / `generate_emergency_15_questions()`:
   - Deterministic sector-branching fallback based on keyword matching (`is_software`, `is_food`, `is_battery`, `is_logistics`, `is_textile`).

---

## 9. Critical Question Duplication Problem

### [CONFIRMED BUG & ROOT CAUSE]
The user reported that when entering:
> *"We operate a textile dyeing and weaving mill in Telangana. The facility is approximately 97,000 m², connected load is 480 kVA, we employ 165 people, operate two shifts, use dyeing chemicals, and generate industrial wastewater."*

The platform repeatedly asked:
1. *"What is your power load?"*
2. *"What is your factory area?"*
3. *"How many workers do you have?"*
4. *"Do you perform dyeing?"*

### Exact Root Causes Traced:
1. **The 15-Question Guard Trap:**
   - In `backend/domain/intelligence/questionnaire.py`:
     - Line 101: `RULES: 1. You must generate between 5 and 6 questions...`
     - Line 1470:
       ```python
       # Enforce exactly 15 questions
       if len(questions) != 15:
           questions = generate_emergency_15_questions(context, understanding)
       ```
     - **Mechanism:** The LLM obeys the prompt and returns 5 or 6 questions. Line 1470 checks `len(questions) != 15`, which evaluates to `True`. The system **discards the LLM's tailored questions and invokes `generate_emergency_15_questions()`**.
     - In `generate_emergency_15_questions()` (lines 827–850), Q01 (power load), Q02 (workforce), Q03 (premises), and Q11 (floor area) are **hardcoded in Python**. They are returned to the user regardless of what was written in the description.

2. **Absence of Free-Text Entity Extraction:**
   - `build_business_context()` in [business_context.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/context/business_context.py#L202) only copies values from `profile.variables`.
   - When the founder writes *"connected load is 480 kVA"* in the Step 2 text box, the frontend sends this as `product_description`.
   - No parsing service extracts `connected_power_load = 480`, `facility_area = 97000`, `total_worker_count = 165`, or `dyeing_activity = True` from that text before questioning starts.
   - Consequently, `context.operational_facts["connected_power_load"]` remains `None`.
   - When `already_known_facts` is passed to the LLM (or checked in code), the variables are missing, so the engine treats them as unknown.

---

## 10. Expected 3–4 Question Product Model

### [INTENDED BEHAVIOR]
The onboarding questioning stage must operate as a **dynamic delta-resolver**:
1. **Input:** Structured profile variables + Extracted free-text facts + Knowledge pack required variables.
2. **Evaluation:** For each candidate rule applicable to the sector/state, inspect its AST condition (e.g. `(AND (GREATER_THAN total_worker_count 9) (EQUALS boiler_present true))`).
3. **Delta Detection:** If `total_worker_count` is already known (165), that branch of the AST is already resolved (`True`). It **must never generate a question**.
4. **Targeted Questions:** If `boiler_present` is unknown and would flip an obligation from `UNKNOWN` to `APPLICABLE`, the engine formulates a question for `boiler_present`.
5. **Question Budget:**
   - **0 questions:** If the description and profile provided enough facts to evaluate all high-confidence rules.
   - **1–3 questions:** If only 1 to 3 critical variables (e.g. boiler pressure, hazardous chemical storage volume, DG set capacity) remain unresolved.
   - **Max 4 questions:** The engine terminates questioning as soon as critical variables are answered.

---

## 11. Business Description → Canonical Facts

### [CURRENT IMPLEMENTATION vs INTENDED]

| Fact / Variable | Canonical Key | Current Extraction | Required Extraction from Text |
| :--- | :--- | :--- | :--- |
| Workforce Count | `total_worker_count` | Only from Step 1 input box | Regex / LLM parser: `(\d+)\s*(?:workers\|employees\|people\|staff)` |
| Connected Power | `connected_power_load` | Only from Step 1 input box | Regex / LLM parser: `(\d+(?:\.\d+)?)\s*(?:kva\|hp\|kw)` (normalized to HP/kVA) |
| Facility Area | `facility_area` | **Not in schema** | Extract area + unit (`sq ft`, `sq m`, `acres`) into normalized sq metres |
| Dyeing Operations | `dyeing_activity` | Basic keyword check | Detected in `detected_activities` list; must set canonical boolean |
| Boiler Present | `boiler_present` | Question Q13 only | Extract from mention of `boiler`, `steam generator`, `thermic fluid` |
| Wastewater Discharge | `effluent_emission_generation` | Question only | Extract from mention of `industrial wastewater`, `effluent`, `etp`, `zero liquid discharge` |
| Shifts Operated | `shifts_count` | **Not in schema** | Extract `(\d+)\s*shifts` |

### Provenance and Unit Normalization
All extracted facts must record:
* `value`: Normalized numerical or enum value.
* `raw_unit`: e.g. `"kVA"`, `"sq ft"`.
* `canonical_unit`: e.g. `"HP"`, `"sq_metres"`.
* `confidence`: `0.0` to `1.0`.
* `origin`: `EXTRACTED_FROM_DESCRIPTION` vs `USER_PROVIDED`.

---

## 12. Ontology / Business Understanding

### [CURRENT IMPLEMENTATION]
Located in `backend/domain/intelligence/business_understanding.py`:
- `BusinessUnderstandingProvider.analyze()` calls LLM to produce `BusinessUnderstandingResult`:
  - `business_type`: e.g. `MANUFACTURING`.
  - `primary_activity`: e.g. `Textile Processing`.
  - `products`: list of strings.
  - `trade_intent`: `DOMESTIC`, `EXPORT`, etc.
  - `likely_regulatory_domains`: list of domains (`POLLUTION_CONTROL`, `FACTORIES_ACT`).
  - `important_unknowns`: list of strings describing missing data.

### [RECOMMENDATION]
The output of `business_understanding` must directly emit a structured dictionary of **extracted canonical profile variables** that automatically merges into `BusinessProfileVersion` before questioning begins.

---

## 13. Retrieval Architecture

### [CURRENT IMPLEMENTATION]
Located in `backend/domain/intelligence/discovery.py` and `search_planning.py`:
1. `SearchPlanner.create_search_plan()` generates targeted search queries based on:
   - Jurisdiction (`state`, `district`).
   - Industry sector.
   - Identified operations.
2. Retrieval executes against official government domains registered in `STATUTORY_PORTALS` and `STATUTORY_PORTAL_REGISTRY` in [catalogs.py](file:///D:/SIH/Branches/ComplyWise/backend/knowledge_packs/catalogs.py).

---

## 14. Crawlee Integration

### [CURRENT IMPLEMENTATION]
Located in [backend/domain/acquisition/](file:///D:/SIH/Branches/ComplyWise/backend/domain/acquisition/):
- `BaseWebAcquisitionLayer` (base.py): Abstract base class defining `fetch_page(url)` and `crawl_domain(start_url)`.
- `CrawleeAcquisitionProvider` (crawlee_provider.py):
  - Uses Crawlee Python architecture.
  - Features fast HTTP crawling with automatic fallback to browser rendering when JavaScript execution is required.
  - Normalizes crawled pages into `WebAcquisitionResult`:
    - `url`, `resolved_url`, `domain`.
    - `title`, `text_content`, `links`.
    - `content_hash` (SHA-256 for provenance tracking).
    - `retrieved_at` (ISO timestamp).
    - `acquisition_tier` (`HTTP` vs `BROWSER`).
- **Safety Guarantee:** Crawlee only acquires and hashes evidence. It **never evaluates legal applicability**.

---

## 15. Evidence / Source Validation

### [CURRENT IMPLEMENTATION]
- Models in `apps.evidence.models`: `Source`, `EvidenceChunk`.
- Every statutory claim must be anchored to an authoritative source record.
- If web retrieval discovers a regulatory requirement that is not confirmed in the deterministic knowledge base, it is flagged as:
  - `status`: `"UNVERIFIED"`
  - `verification_status`: `"PRELIMINARY / UNVERIFIED"`
- This ensures hallucinated or unverified internet data cannot trigger false legal mandates.

---

## 16. Engine 2 — Deterministic Applicability

### [CURRENT IMPLEMENTATION]
Located in [backend/apps/applicability/engine.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/applicability/engine.py):
- Evaluates `RuleVersion` AST expressions against `BusinessProfileVersion.variables`.
- Uses Kleene 3-valued logic (`True`, `False`, `UNKNOWN`) via [evaluator.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/evaluation/evaluator.py).
- **Rule Outcomes:**
  - `True` → **`APPLICABLE`**
  - `False` → **`NOT_APPLICABLE`**
  - `UNKNOWN` → **`NEEDS_INFORMATION`**
- **Strict Integrity Constraint:** `UNKNOWN` is **never converted to `False`**. Missing facts produce `NEEDS_INFORMATION` so the system knows what to ask or flag for review.

---

## 17. Compliance Intelligence Record (CIR)

### [CURRENT IMPLEMENTATION]
The CIR is persisted as `DecisionRun` and `DecisionResult` records:
- `DecisionRun`: Tied to `Business`, `Assessment`, and `BusinessProfileVersion`.
- `DecisionResult`:
  - `requirement_id`: e.g. `REQ-MPCB-CTE`.
  - `requirement_name`: e.g. `MPCB Consent to Establish (CTE)`.
  - `status`: `APPLICABLE`, `NOT_APPLICABLE`, `NEEDS_INFORMATION`, `CONFLICT_REVIEW`, `UNVERIFIED`.
  - `basis`: Explanation of variables evaluated.
  - `trace`: Evaluation steps with variable values used.
  - `rule_version`: Link to immutable rule logic evaluated.

---

## 18. Compliance Frontend

### [CURRENT IMPLEMENTATION]
Located in [frontend/app/compliance/page.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/app/compliance/page.tsx):
- Loads canonical compliance items via `api.compliance.list(bizId, { assessment_id })`.
- Segregates requirements into 3 clear UI tabs:
  1. **Action Required:** `APPLICABLE` and `NEEDS_INFORMATION` mandates.
  2. **Under Review:** `UNVERIFIED` and `CONFLICT_REVIEW` candidate claims.
  3. **Audit Trail (Collapsible):** `NOT_APPLICABLE` obligations with proof of non-applicability.
- Features Provenance Modal showing official portal links, citations, and evaluation basis.

---

## 19. Schemes (Government Benefits & Subsidies)

### [CURRENT IMPLEMENTATION]
Located in [backend/apps/schemes/engine/matcher.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/schemes/engine/matcher.py) and [frontend/app/schemes/page.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/app/schemes/page.tsx):
- Evaluates enterprise eligibility for Central and State incentive schemes (e.g. Maharashtra Textile Policy, PM Mega Integrated Textile Region, MSME Interest Subvention).
- Uses `DerivedBusinessContext` and `assessment_id` scoping.
- Classifies schemes by:
  - `eligible`: Clear eligibility.
  - `potential`: Missing one non-critical condition.
  - `ineligible`: Disqualified by turnover/investment/location.

---

## 20. Standards (Voluntary & Mandatory Conformity)

### [CURRENT IMPLEMENTATION]
Located in `backend/apps/standards/` and `frontend/app/standards/page.tsx`:
- Matches BIS Indian Standards (IS), Quality Control Orders (QCO), and international standards (ISO 9001, ISO 14001, OEKO-TEX for textiles).
- Distinguishes mandatory technical standards (QCO certification required before market placement) from voluntary competitiveness standards.

---

## 21. Documents

### [CURRENT IMPLEMENTATION]
Located in `backend/apps/documents/` and `frontend/app/documents/page.tsx`:
- Pre-registers required documents based on applicable compliance mandates (e.g. Factory Layout Plan, Water Potability IS 10500 Report, Site Siting Certificate).
- Tracks upload status: `PENDING` → `UPLOADED` → `PRECHECK_PASSED` → `UNDER_HUMAN_REVIEW` → `APPROVED`.
- Scoped to `ComplianceCase` and `Business`.

---

## 22. Workflows (Interactive Execution)

### [CURRENT IMPLEMENTATION]
Located in `backend/apps/workflows/` and `frontend/app/workflows/page.tsx`:
- Converts statutory mandates into interactive multi-step compliance workflows:
  - Step 1: Document preparation.
  - Step 2: Online portal submission on official gateway (with direct external deep link).
  - Step 3: Fee payment receipt & challan archival.
  - Step 4: Departmental inspection & query response.
  - Step 5: Final license upload & expiry tracking.
- Progress updates mutate `ComplianceCase` and advance state deterministically.

---

## 23. Calendar

### [CURRENT IMPLEMENTATION]
Located in `backend/apps/calendar/` and `frontend/app/calendar/page.tsx`:
- Computes statutory deadlines (annual returns, boiler inspections, consent renewals, advance tax).
- Tracks in-app notification dispatch and integrates with Google Calendar API.
- All deadline records are tenant-isolated and scoped to business cases.

---

## 24. Current Admin Architecture

### [CURRENT IMPLEMENTATION]
Located in `frontend/app/admin/` and backend views in `backend/apps/workflows/views.py`:
- **Auth Guard:** [AdminShell.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/components/AdminShell.tsx) checks `is_staff || is_superuser` from `api.auth.me()`. Unauthorized visitors redirect to `/admin/login`.
- **Navigation:**
  - Control Room (`/admin`): High-level operational summary cards and review queue.
  - Review Queue (`/admin/cases?status=HUMAN_REVIEW`): Cases awaiting officer determination.
  - All Cases (`/admin/cases`): Search and filter compliance cases across enterprises.
  - Businesses & Profiles (`/admin/businesses`): Enterprise registry and profile overview.

---

## 25. Admin UI / Workflow Problems

### [CONFIRMED BUG & ROOT CAUSE AUDIT TABLE]

| Area | Current Implementation | Current Problem | Root Cause | Recommended Next Action |
| :--- | :--- | :--- | :--- | :--- |
| **Business Selector** | Table of businesses in `/admin/businesses` | Cannot switch active business context cleanly | Admin operates globally without pinning an active business workspace | Add persistent Active Business header bar on admin pages |
| **Assessment Selector** | **Absent** | Admin views all-time aggregated cases; cannot view a specific assessment | Backend overview endpoints do not accept `assessment_id` query param | Add `?assessment_id=` to all admin endpoints and add an Assessment dropdown in admin UI |
| **Compliance Review** | Shows `business.compliance_cases.all()` | Shows 0 items if cases haven't been generated, ignoring Engine 2 results | Reads from workflow case table instead of Engine 2 `DecisionResult` records | Display both: Automated System Applicability (CIR) + Operational Case Workflows |
| **Schemes** | **Absent from Admin** | Admin cannot inspect matched government schemes | No admin scheme overview view exists | Add Scheme Eligibility review tab to `/admin/businesses/[id]` |
| **Standards** | **Absent from Admin** | Admin cannot inspect matched BIS/ISO standards | No admin standards overview view exists | Add Standards review tab to `/admin/businesses/[id]` |
| **Evidence** | Shows only user document submissions | Admin cannot inspect statutory gazette citations or Crawlee extracts | Endpoint only serializes `DocumentSubmission`, not `EvidenceChunk` | Add Evidence Inspection Drawer showing source URL, content hash, and citation text |
| **Documents** | List of uploaded files with OCR text | No visual inline document previewer | Raw download links only; officer cannot view PDF side-by-side with OCR | Embed PDF/image preview pane alongside OCR text in Quick Review modal |
| **Workflows** | Approve / Query / Reject modals | Remarks do not enforce structured query categories | Action updates case status but does not notify user via calendar/in-app alert | Link officer review actions to automatic user task notifications |
| **Calendar** | Shows deadline list | Admin cannot create ad-hoc statutory deadlines for a business | `createDeadline` API exists but has no UI trigger in admin overview | Add "Add Statutory Deadline" button to Admin Business Overview |
| **Profile / Facts** | Shows raw key-value table | Does not show which facts were user-supplied vs extracted vs inferred | Does not display fact confidence or source text excerpt | Add Provenance badges (`FORM_INPUT`, `EXTRACTED_FROM_TEXT`, `INFERRED`) |

### Separation of System Result vs Admin Disposition
* **[INTENDED BEHAVIOR]** The admin must never overwrite the automated engine output:
  - **System Result:** `APPLICABLE` (Computed by Engine 2 rules).
  - **Admin Disposition:** `CONFIRMED_REQUIRED`, `WAIVED_WITH_JUSTIFICATION`, `NEEDS_ADDITIONAL_EVIDENCE`.
* The current data model in [apps/workflows/models.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/workflows/models.py) supports `CaseRequirementDisposition`, but the admin UI does not yet expose the waiver workflow cleanly.

---

## 26. Data Isolation Risks

### [AUDIT FINDINGS]
1. **Unsafe `.first()` Fallbacks:**
   - In `backend/apps/requirements/views.py` (lines 145–158): If no `assessment_id` is supplied, it falls back to `DecisionRun.objects.filter(business=business).order_by('-created_at').first()`. While scoped to the same business, it can return an older assessment's run if a newer one was started.
   - **Fix Applied:** Calls now explicitly pass `assessment_id` from URL params or context.
2. **Tenant Scoping:**
   - All backend queries in `businesses`, `requirements`, `documents`, `schemes`, `standards`, and `calendar` enforce `Business.resolve_safely(business_id, request.user)` or `Business.accessible_to(request.user)`.
   - Admin views require `request.user.is_staff` or `is_superuser`.
3. **Frontend Cache Leakage:**
   - Resolved in `frontend/context/BusinessContext.tsx` by clearing active business state and cache whenever switching companies.

---

## 27. LLM-Heavy Areas

| Stage / Component | Current LLM Role | Risk | Recommended Deterministic Guard |
| :--- | :--- | :--- | :--- |
| **Business Understanding** | Classifies sector and extracts products | Hallucination of regulated activities | Constrain output to a fixed ontology taxonomy of 28 Indian industrial sectors |
| **Question Generation** | Formulates questions from description | Inconsistency, redundant questioning | **Replace with deterministic AST gap-analysis**: only ask when a rule AST is `UNKNOWN` |
| **Search Planning** | Generates web search queries | Drifting into irrelevant queries | Restrict query generation to official authority portal domains |
| **Compliance Synthesis** | Summarizes why requirement applies | Hallucinated tech mandates for physical mills | **Deprecate for applicability**: Rules decide; LLM only formats the markdown explanation |
| **Scheme Matching** | Evaluates subsidy eligibility | Over-optimistic benefit claims | Deterministic rule matching against published policy investment/turnover criteria |
| **Standards Matching** | Recommends BIS standards | Recommending irrelevant ISOs | Keyword and HS Code matching against BIS published catalog |

---

## 28. Known Bugs / Technical Debt

1. **Hardcoded 15-Question Fallback:**
   - In [backend/domain/intelligence/questionnaire.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/intelligence/questionnaire.py#L1470), line 1470 forces exactly 15 questions, bypassing LLM-tailored questioning.
2. **Free-Text Entity Parser Missing:**
   - No regex or structured entity extraction service parses electrical load, workforce, area, or activities from `product_description` into `profile.variables`.
3. **Admin Overview Missing Assessment Scoping:**
   - `AdminBusinessOverviewView` in [backend/apps/workflows/views.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/workflows/views.py#L780) does not filter by `assessment_id`.
4. **Temporary Regex Filters in Views:**
   - Temporary regex filters (`is_physical_mfg`, `is_pure_software`) were previously added to `views.py` and `compliance/page.tsx` to suppress tech/cybersecurity claims for mills. These must be replaced with proper rule preconditions in the knowledge pack ASTs.

---

## 29. Raw Repository Integration Plan

### Physical Location
The reference/raw repository is located at:
`D:\SIH\ComplyWise` (on branch `main`).

### Component Comparison

| Component | Raw Repository (`main`) | Current Working Repo (`feat/api-orchestration`) | Recommendation |
| :--- | :--- | :--- | :--- |
| **Orchestration Engine** | Milestone Step 02 initial skeleton | 8-Stage Assessment Orchestration pipeline | **PRESERVE CURRENT**: Current is significantly more mature |
| **Questionnaire Engine** | 15-Question initial implementation | Idempotent generation with preset support | **REFACTOR CURRENT**: Replace 15-question trap with 0–4 delta resolver |
| **Web Acquisition** | Mock / HTTP requests | Crawlee provider with HTTP + Playwright fallback | **PRESERVE CURRENT**: Integrated under `domain/acquisition/` |
| **Knowledge Packs** | Core central statutory packs | Added Maharashtra manufacturing fixtures | **MERGE**: Combine fixtures into canonical seed catalog |
| **Admin Scrutiny Desk** | Basic review queue | Complete 360-degree review desk & modal actions | **PRESERVE CURRENT**: Has full approve/query/reject workflows |
| **Docker / Deployment** | Has `docker-compose.yml`, Dockerfile | Local virtualenv tooling | **PORT FROM RAW**: Import Docker configuration into current repo |
| **Frontend Sync** | Standard Next.js | Dynamic Category Breakdown, Provenance Modals | **PRESERVE CURRENT**: Fully wired to DRF API endpoints |

---

## 30. Recommended Implementation Order

### Step 1: Business Description Fact Extractor (Backend)
- Implement `extract_facts_from_description(text: str) -> dict[str, Any]` in `backend/domain/context/fact_extraction.py`.
- Parse numerical values and units: connected load (`kVA`, `HP`), workforce count, floor area (`sq m`, `sq ft`), boiler presence, wastewater generation.
- Merge extracted facts into `BusinessProfileVersion` (v1) immediately upon Step 2 completion.

### Step 2: Fix Questionnaire 15-Question Enforcement
- In `backend/domain/intelligence/questionnaire.py`:
  - Delete line 1470 (`if len(questions) != 15:`).
  - Adopt a dynamic budget (0 to 4 questions max).
  - If all critical variables for candidate rules are resolved, return `[]` (0 questions).
- Update `frontend/components/onboarding/FifteenQuestionsWizard.tsx` to handle variable question counts (1 to 4) smoothly without assuming a 15-question progress bar.

### Step 3: Admin Assessment Scoping & Review Alignment
- In `backend/apps/workflows/views.py`:
  - Update `AdminBusinessOverviewView` to accept `?assessment_id=`.
  - Include Engine 2 `DecisionResult` records (CIR) alongside operational `compliance_cases`.
  - Include matched Schemes and Standards in the payload.
- In `frontend/app/admin/businesses/[id]/page.tsx`:
  - Add Assessment Selector dropdown.
  - Add Schemes and Standards tabs.
  - Add Evidence Citation Drawer.

### Step 4: Knowledge AST Clean-up
- Ensure CERT-In and DPDP rules in knowledge fixtures explicitly mandate digital/IT/telecom variables, ensuring industrial mills never evaluate them as applicable.
- Remove temporary regex keyword guards from `views.py` and `compliance/page.tsx`.

---

## 31. Files / Modules / APIs to Study First

1. **Questionnaire Pipeline:**
   - [backend/domain/intelligence/questionnaire.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/intelligence/questionnaire.py) (Lines 97–180, 812–850, 1344–1475)
   - [backend/apps/onboarding/services.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/onboarding/services.py)
   - [frontend/components/onboarding/FifteenQuestionsWizard.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/components/onboarding/FifteenQuestionsWizard.tsx)
2. **Context & Fact Aggregation:**
   - [backend/domain/context/business_context.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/context/business_context.py)
   - [backend/domain/profile/variables.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/profile/variables.py)
3. **Applicability & CIR:**
   - [backend/apps/applicability/engine.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/applicability/engine.py)
   - [backend/domain/evaluation/evaluator.py](file:///D:/SIH/Branches/ComplyWise/backend/domain/evaluation/evaluator.py)
4. **Admin Review Layer:**
   - [backend/apps/workflows/views.py](file:///D:/SIH/Branches/ComplyWise/backend/apps/workflows/views.py) (Lines 780–950)
   - [frontend/app/admin/businesses/[id]/page.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/app/admin/businesses/%5Bid%5D/page.tsx)
   - [frontend/components/AdminShell.tsx](file:///D:/SIH/Branches/ComplyWise/frontend/components/AdminShell.tsx)

---

## 32. Database / Schema Considerations

* **PostgreSQL / Supabase:** The target production database. Uses connection pooling (`DATABASE_CONN_MAX_AGE=0` in `.env`).
* **Python 3.11 Driver Compatibility:** Ensure `psycopg` and `psycopg-binary` are version-aligned (both `3.3.6`). Never mix Python 3.12 wheel binaries into the Python 3.11 virtualenv.
* **Variable Origin Tracking:** Always preserve `origin` when storing variables:
  - `USER_PROVIDED`: Entered explicitly in a form field.
  - `EXTRACTED_FROM_DESCRIPTION`: Parsed from free text.
  - `INFERRED_BY_RULE`: Derived through AST evaluation.

---

## 33. Testing Strategy

Run tests using the project virtual environment Python:

```powershell
# In D:\SIH\Branches\ComplyWise\backend:
& "D:\SIH\Branches\ComplyWise\backend\.venv\Scripts\python.exe" -m pytest tests/test_applicability_engine.py tests/test_audit_instruction_regression.py -q
```

* **Constraint:** Do not use Playwright or browser UI automation tests for verification. Rely on Django unit/integration tests and Next.js type-checking (`npx tsc --noEmit` / `npm run build`).

---

## 34. Manual Validation Plan

Use these 4 specific enterprise use-cases for manual verification:

1. **Textile Weaving & Dyeing Mill (e.g. Ichalkaranji Mills, Maharashtra / Telangana):**
   - **Input:** 480 kVA load, 97,000 m² area, 165 workers, dyeing chemicals, industrial wastewater.
   - **Expectation:** 0 to 2 questions max (e.g. boiler type). Never ask power, area, or worker count.
   - **Applicable Output:** MPCB CTE/CTO, Hazardous Waste, Boiler Registration, Factory License, Textile Cess, EPF, ESI, POSH. **Zero cybersecurity/CERT-In claims.**
2. **Pharmaceutical Formulation Unit (e.g. Hyderabad / Gujarat):**
   - **Input:** API manufacturing, cleanrooms, 85 workers, solvent recovery.
   - **Expectation:** Questions about drug license categories (Form 25/28), GMP compliance. Never ask for FSSAI food license.
3. **Cold-Chain Logistics Hub (e.g. Kolkata / West Bengal):**
   - **Input:** Refrigerated warehouse, 40 reefer trucks, perishable transport.
   - **Expectation:** Questions about temperature regime and fleet permits. Never ask about industrial factory boilers.
4. **SaaS / Digital Platform (e.g. Bangalore / Pune):**
   - **Input:** B2B cloud software, AWS hosting, remote workforce.
   - **Expectation:** DPDP Act, GST LUT, Shops & Establishments. **Never ask about factory licenses, boiler registration, or effluent discharge.**

---

## 35. Open Questions / Unknowns

1. **[UNKNOWN / NEEDS INVESTIGATION]** Does the product owner intend to support multi-language free-text descriptions (e.g. Hindi/Marathi descriptions) in Step 2, or is English free-text parsing sufficient for Phase 1?
2. **[UNKNOWN / NEEDS INVESTIGATION]** Will the Admin Scrutiny Desk require multi-officer concurrent assignment locks (preventing two officers from reviewing the same document simultaneously)?

---

## 36. Handoff Summary for Next Engineer

Welcome to ComplyWise. The platform has a powerful, well-structured domain core:
* **The Rules Engine (Engine 2)** operates cleanly on mathematical AST logic.
* **The Tenant Isolation Model** is secure across users, businesses, and assessments.
* **The Crawlee Web Acquisition Layer** is established and verified.

**Your primary objective:** Fix the intake data flow so the free-text description is parsed into canonical facts, delete the hardcoded 15-question trap, and connect the Admin Control Room to the active assessment's Engine 2 truth. Follow the step-by-step implementation order in Section 30.

*“RAG retrieves. Rules decide. LLM explains.”*
