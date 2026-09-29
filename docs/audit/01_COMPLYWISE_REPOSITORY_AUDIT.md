# 01 — COMPLYWISE REPOSITORY AUDIT
## COMPLETE CODEBASE & IMPLEMENTATION FORENSIC ANALYSIS

**Repository Path:** `E:\complience\ComplyWise`  
**Git Branch:** `feat/api-orchestration`  
**HEAD SHA:** `6b73ced16cb6eeaf4fb3862796b0ab973a55c080`  
**Remote URL:** `https://github.com/sn0wstorm20202/ComplyWise.git`  
**Working Tree Status:** Clean  
**Languages:** Python 3.12+, TypeScript 5.x, SQL, HTML/CSS  
**Frameworks:** Django 5.x, Django REST Framework, Next.js 15.x (React 19), Tailwind CSS  
**Databases:** PostgreSQL (production target with `pgvector>=0.4`), SQLite (local dev fallback)  
**Package Managers:** Python `uv` (`uv.lock`, `pyproject.toml`, `requirements.txt`), Node `npm`/`pnpm` (`frontend/package.json`)  
**Deployment:** Dockerfile (`backend/Dockerfile`), `docker-compose.yml`, `vercel.json`  

---

### 1. Repository Overview & Architecture

ComplyWise is structured as a decoupled monorepo containing:
- `backend/`: Django 5 application implementing REST APIs, business context derivation, deterministic rules evaluation (Engine 2), web acquisition (Crawlee), schemes and standards pipelines, and AI provider integration.
- `frontend/`: Next.js 15 App Router web client providing user onboarding, dashboard, compliance views, documents review, workflows, calendar, and an admin control room.
- `docs/`: Extensive project specifications (PRD, TRD, API orchestration specs, and historical task audits).

```
ComplyWise/
├── backend/
│   ├── api/                 # URL routing root
│   ├── apps/                # Django domain applications
│   │   ├── accounts/        # Auth, User model, API tokens
│   │   ├── businesses/      # Business, ProfileVersion, Assessment, Workspaces
│   │   ├── onboarding/      # SmartQuestionPlan, Adaptive Intake
│   │   ├── knowledge/       # RequirementDefinition, RuleVersion, Vector Store
│   │   ├── evidence/        # Source, Evidence models & citations
│   │   ├── applicability/   # DecisionRun, DecisionResult, Engine 2
│   │   ├── requirements/    # Statutory obligations API views
│   │   ├── documents/       # Document submissions, OCR, verification
│   │   ├── workflows/       # Compliance cases, steps, state machine
│   │   ├── calendar/        # Statutory deadlines, notifications, Google Sync
│   │   ├── schemes/         # Central & State subsidy/incentive engine
│   │   ├── standards/       # BIS, QCO, ISO standards catalog
│   │   ├── dashboard/       # Read-only aggregation & readiness scoring
│   │   ├── ingestion/       # Query planner, candidate scraper, discovery run
│   │   └── regulatory_updates/ # Gazette notifications feed
│   ├── common/              # Enums, base models, auth, envelope utilities
│   ├── config/              # Django settings, WSGI/ASGI configuration
│   ├── domain/              # Pure domain logic decoupled from Django ORM
│   │   ├── acquisition/     # Crawlee provider & HTTP router
│   │   ├── context/         # Business context synthesis & variables
│   │   ├── evaluation/      # AST evaluator, Kleene 3-valued truth logic
│   │   ├── intelligence/    # Orchestrator, discovery, questionnaire, synthesis
│   │   ├── jurisdictions/   # State normalization resolver
│   │   ├── profile/         # 43 canonical variable definitions
│   │   ├── providers/       # LLM provider abstraction (OpenAI, Gemini, Grok)
│   │   └── rules/           # AST validator and operator definitions
│   ├── knowledge_packs/     # Fixture catalogs for 5 sectors across 6 states
│   └── tests/               # 46 test modules
└── frontend/                # Next.js 15 App Router client
```

---

### 2. Comprehensive Apps Audit

#### 2.1 `apps.accounts`
- **Models:** Custom `User` model (`AbstractUser`) extending with `phone_number` and `role` (`FOUNDER`, `COMPLIANCE_OFFICER`, `CONSULTANT`, `ADMIN`).
- **Authentication:** `SafeTokenAuthentication` (reads `Authorization: Bearer <token>` or `Token <token>`), DRF `TokenAuthentication`, and Django `SessionAuthentication`.
- **Views:** `RegisterView`, `LoginView`, `AdminLoginView`, `MeView`, `LogoutView`.
- **Flaws / Risks:** Demo login fallback in frontend registers hardcoded credentials (`demo@complywise.test`) if absent.

#### 2.2 `apps.businesses`
- **Models:**
  - `Business`: Tenant root entity. Links to `owner` (FK User). Includes `is_active` flag.
  - `BusinessMembership`: Role-based access linking additional users to businesses.
  - `BusinessProfileVersion`: Append-only immutable profile snapshot. Carries `version` integer, `variables` JSON dictionary (containing values, origins, and confidence), and `change_note`.
  - `Assessment`: Persistent assessment run record. Links `business`, `profile_version`, `decision_run`, and `discovery_run`. Tracks `step_state` and stage lifecycle.
  - `UserWorkspaceState`: Persists the user's currently active business and assessment IDs.
- **Services / Selectors:** `Business.accessible_to(user)` scopes queries to owned or member businesses.
- **Flaws / Risks:**
  - `Business.resolve_safely(business_id, user)` contains a security hole: when `user` is unauthenticated (`is_auth == False`), it executes `cls.objects.filter(pk=uuid_obj).first()`, returning any business to unauthenticated callers.

#### 2.3 `apps.onboarding`
- **Models:**
  - `SmartQuestionPlan`: Records intake planning rounds for a business.
  - `SmartQuestionInstance`: Concrete generated questions with `target_variable_id`, `category`, `answer_type`, and answered state.
- **Logic:** `apps/onboarding/planner.py` attempts to generate 12–20 questions per round across up to 2 rounds (`TARGET_QUESTIONS_COUNT = 16`).
- **Conflict:** Competes directly with `domain.intelligence.questionnaire.QuestionnaireEngine`, which enforces 5–6 questions.

#### 2.4 `apps.knowledge`
- **Models:**
  - `RequirementDefinition`: Canonical regulatory requirement (`requirement_id`, `name`, `authority`, `jurisdiction`, `domain`, `category`, `status`, `metadata`, `evidence_refs`).
  - `RuleVersion`: Immutable rule version (`rule_id`, `version`, `rule_type`, `result`, `condition_ast`, `status`, `effective_from`, `effective_until`, `evidence_refs`).
  - `RequirementEmbedding`: pgvector embedding store (`VectorField(dimensions=1536)`).
- **Loader:** `apps/knowledge/loader.py` validates fixtures against JSON schemas (`requirements.json`, `rules.json`, `evidence.json`, `sources.json`) and loads them into PostgreSQL.

#### 2.5 `apps.evidence`
- **Models:**
  - `Source`: Official publication identity (`source_id`, `title`, `authority`, `jurisdiction`, `canonical_url`, `content_hash`, `status`, `last_verified_at`).
  - `Evidence`: Atomic evidentiary citation (`evidence_id`, `source`, `locator`, `excerpt`, `content_hash`, `verification_status`, `confidence`, `effective_from`, `effective_until`).
- **Role:** Supplies verified legal citations to `RuleVersion` and `RequirementDefinition`.

#### 2.6 `apps.applicability` (Engine 2)
- **Models:**
  - `DecisionRun`: Execution record (`business`, `profile_version`, `assessment`, `status`, `evaluation_date`).
  - `DecisionResult`: Determination per requirement (`requirement_id`, `requirement_name`, `rule_version`, `status`, `explanation_trace`, `evidence_refs`).
- **Engine Logic (`engine.py`):**
  - Evaluates only `PUBLISHED` requirements and rules.
  - Resolves business state via data-driven jurisdiction registry. Central requirements evaluate pan-India; state requirements require state match.
  - Filters rules by `effective_from` and `effective_until` against `evaluation_date`.
  - Evaluates AST condition tree using Kleene 3-valued logic (`TRUE`, `FALSE`, `UNKNOWN`).
  - Precedence hierarchy: `OVERRIDE (4) > EXEMPTION (3) > EXCEPTION (2) > NORMAL (1)`.
  - Contradictory rules at same precedence produce `CONFLICT_REVIEW`.
  - Evidence gating: `APPLICABLE` requires valid, active, non-expired, non-conflicting, verified evidence records; otherwise demoted to `UNVERIFIED` or `CONFLICT_REVIEW`.
  - `UNKNOWN` resolves to `NEEDS_INFORMATION`. `UNKNOWN` never becomes `FALSE`.

#### 2.7 `apps.requirements`
- **Views:**
  - `BusinessRequirementsView`: Returns evaluated obligations for Screen 08.
  - `BusinessRequirementDetailView`: Answers 4 core questions (Why does this apply? What do I need? What do I do next? Where did this come from?).
- **Flaws / Risks:**
  - Lines 172–205: View contains hardcoded regex filters inspecting business description. If `is_pure_software`, it silently drops factory/pollution rules; if `is_physical_mfg`, it silently drops CERT-In/cybersecurity rules. This bypasses Engine 2 and hardcodes domain logic into presentation views.

#### 2.8 `apps.documents`
- **Models:** `DocumentDefinition`, `DocumentRequirement`, `DocumentSubmission`, `DocumentReview`.
- **Engine:** `ocr_engine.py` (Tesseract / Gemini OCR), `verification.py` (checks validity dates, document type match, issuer authenticity).
- **Flaws / Risks:** 8 API endpoints configured with `permission_classes = [AllowAny]`.

#### 2.9 `apps.workflows`
- **Models:** `ComplianceCase`, `WorkflowDefinition`, `WorkflowStep`, `WorkflowInstance`, `StepExecution`, `ReviewTask`, `HumanReview`, `OutboxEvent`.
- **Services:** `CaseService`, `WorkflowService`, `FormService`, `DispositionService`, `TimelineService`.
- **Flaws / Risks:** Over 15 views configured with `permission_classes = [AllowAny]`. `AdminBusinessOverviewView` takes arbitrary `business_id` without authentication.

#### 2.10 `apps.calendar`
- **Models:** `Deadline`, `NotificationPreference`, `UserGoogleCalendarConnection`, `DeadlineNotificationLog`.
- **Tasks:** `process_deadline_notifications.py` management command checks upcoming deadlines and sends email/in-app alerts.

#### 2.11 `apps.schemes`
- **Models:** `Scheme`, `SchemeVersion` (with SHA-256 `content_hash`, `benefit_details`, `eligibility_criteria`, `diff_summary`), `SchemeSourceSnapshot`, `SchemeRollbackLog`.
- **Engine:** `engine/matcher.py` matches schemes against business scale, sector, and export status.
- **Flaws / Risks:** `BusinessSchemesListView` is `AllowAny`.

#### 2.12 `apps.standards`
- **Models:** `Standard` (IS codes, category, `is_mandatory`, `mandatory_status`, `verification_status`, `testing_requirements`).
- **Views:** Lists statutory vs voluntary standards. `AllowAny` permissions on list view.

#### 2.13 `apps.dashboard`
- **Services:** `get_dashboard_summary()` aggregates readiness score, action required count, upcoming deadlines, and coverage score.
- **Flaws / Risks:** When `assessment_id` is not passed, falls back to `.first()` DecisionRun.

#### 2.14 `apps.ingestion`
- **Models:** `DiscoveryRun`, `CandidateRequirement`.
- **Engines:** `QueryPlanner`, `Ranking`, `AutoIngest`, `Firecrawl`.

---

### 3. Domain Modules Audit (`backend/domain/`)

#### 3.1 `domain.acquisition`
- `BaseWebAcquisitionLayer`: Abstract interface defining `fetch_page(url)` and `crawl(seed_urls)`.
- `CrawleeAcquisitionProvider`: Implements Crawlee Python using `BeautifulSoupCrawler`. Captures `status_code`, cleans text, extracts links, hashes content with SHA-256, records UTC `retrieved_at`, and falls back to `urllib.request`.
- `router.py`: Global provider getter/setter.

#### 3.2 `domain.context`
- `DerivedBusinessContext`: Dataclass summarizing canonical facts (`business_type`, `msme_scale`, `state`, `is_manufacturing`, `is_cross_border`, `known_variable_keys`, `missing_variable_keys`, `operational_facts`).

#### 3.3 `domain.evaluation`
- `evaluator.py`: Pure AST interpreter implementing Kleene 3-valued truth semantics (`TRUE`, `FALSE`, `UNKNOWN`). Preserves full `EvaluationTrace`.
- `truth.py`: Implements Kleene `and_`, `or_`, `not_` truth tables.

#### 3.4 `domain.intelligence`
- `orchestration.py`: Central state machine (`AssessmentStage`, `AssessmentRun`, `LLMFirstStrategy`, `KnowledgeFirstStrategy`, `HybridStrategy`).
- `business_understanding.py`: LLM prompt extracting structured facts from natural language.
- `questionnaire.py`: LLM prompt targeting 5–6 questions with emergency sector fallbacks.
- `answer_interpretation.py`: Translates user answers into structured profile facts.
- `context_merge.py`: Merges facts into `DerivedBusinessContext`.
- `discovery.py`: Discovers regulatory materials from official portals.
- `synthesis.py`: Synthesizes requirements via LLM when rules are absent.

#### 3.5 `domain.profile`
- `variables.py`: Defines 43 canonical variables (`V01`–`V43`), categorizing relevance (`CORE`, `SECTOR_SPECIFIC`, `CONDITIONAL`), types, and validation rules.

#### 3.6 `domain.providers`
- Multi-provider LLM abstraction supporting OpenAI (`gpt-4o`, `gpt-4o-mini`), Google Gemini (`gemini-2.5-flash`), Grok (`grok-beta`).
- `telemetry.py`: Enforces token and financial cost guardrails per assessment.

#### 3.7 `domain.rules`
- `ast.py`: Validates AST syntax. Enforces `MAX_AST_DEPTH = 32`, forbids float literals, validates operands.

---

### 4. Critical Architecture Flaws in ComplyWise

1. **Dual Orchestration Split:** `LLMFirstStrategy` in `orchestration.py` delegates compliance determination to `LiveComplianceSynthesisProvider` (LLM), while `orchestrate_compliance_analysis` delegates to Engine 2 (`ApplicabilityEngine`). In `AssessmentComplianceView`, Engine 2 is prioritized, but LLM synthesis remains an unverified fallback.
2. **View-Level Regex Patches:** `apps/requirements/views.py` injects regex filtering (`is_pure_software` vs `is_physical_mfg`) directly into the HTTP response loop, overriding Engine 2 decisions.
3. **Competing Question Planners:** Two separate engines exist (`onboarding/planner.py` vs `intelligence/questionnaire.py`) with contradictory assumptions (16 questions vs 5–6 questions). Neither can output 0–4 questions.
4. **Permissive Endpoints & Tenancy Bypass:** Over 25 views have `AllowAny` permissions, allowing unauthenticated enumeration of sensitive tenant data.
