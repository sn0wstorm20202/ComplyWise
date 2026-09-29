# 03. COMPLYWISE SOURCE-OF-TRUTH MATRIX
## CANONICAL ENTITY OWNERSHIP, AUTHORITY LEVELS & COMPETING TRUTH RECONCILIATION

- **Document ID**: `CW-SOT-2026-V1`
- **Precedence Level**: **LEVEL 3**
- **Status**: MANDATORY / AUTHORITATIVE
- **Effective Date**: September 28, 2026
- **Core Principle**: Exactly ONE authoritative owner per business-critical concept. Zero ambiguity. Zero competing truths.

---

## 1. COMPREHENSIVE CANONICAL SOURCE-OF-TRUTH MATRIX

| Concept / Entity | Authority Level | Authoritative Owner | Permitted Writers | Authorized Readers | Versioning Model | Cacheability & Invalidation | Auditability Requirements | Current vs. Target Migration Status |
|---|---|---|---|---|---|---|---|---|
| **Business Identity** | **PRIMARY** (Core Tenancy) | `apps/businesses/models.py:Business` | Registration API, Business Onboarding Controller | All tenant-scoped services | Mutable metadata; immutable UUID | Cached per Tenant UUID; invalidated on profile edit | Full audit trail on creation/modification | `[CURRENT]` Leaks to anon<br>`[TARGET]` Strict principal scoping |
| **Business Profile Facts** | **PRIMARY** (Operational Truth) | `apps/businesses/models.py:BusinessProfileVersion` | Profile Normalizer, Answer Ingestion Pipeline | Engine 2, CIR, Discovery, Schemes | Strictly immutable integer version ($v1, v2, ...$) | Invariant per Version ID; immutable | Full provenance per fact (source, confidence, timestamp) | `[CURRENT]` Ad-hoc JSON dicts<br>`[TARGET]` Typed Pydantic schema |
| **Assessment State** | **PRIMARY** (Workflow State) | `apps/businesses/models.py:Assessment` | Assessment Orchestrator | UI Controllers, Admin Scrutiny, CIR | State machine versioned by run timestamp | Cacheable per Assessment UUID + State | Stage transition log with correlation ID | `[CURRENT]` Nullable decision_run<br>`[TARGET]` Mandatory Foreign Key |
| **Canonical Fact Definitions** | **CANONICAL DEFINITION** | `domain/ontology/` (Target Pydantic Schema) | Core Architecture Team | Understanding, Questioning, Engine 2 | SemVer schema releases | In-memory code constant | Versioned in git | `[CURRENT]` 0 central schema<br>`[TARGET]` Pydantic v2 ontology |
| **Regulatory Requirements** | **PRIMARY** (Legal Registry) | `apps/requirements/models.py:RequirementDefinition` | Knowledge Migration, Admin Knowledge Desk | Engine 2, CIR, UI Projections | Requirement Code + Status | Cached in Redis/Memory; invalidated on publish | Publication date, issuing authority, gazette ref | `[CURRENT]` DB + YAML duplication<br>`[TARGET]` Unified requirement store |
| **Statutory Rules (AST)** | **PRIMARY** (Statutory Logic) | `apps/requirements/models.py:RuleVersion` | Knowledge Engineering Pipeline | Engine 2 Rule Evaluator | Numerical versioning per requirement | Cached per RuleVersion ID; immutable | Cryptographically signed rule authoring | `[CURRENT]` Sound AST in DB<br>`[TARGET]` Retained as sole rule source |
| **Applicability Decision** | **ABSOLUTE AUTHORITY** (Statutory Status) | `apps/applicability/models.py:DecisionResult` | `ApplicabilityEngine` (Engine 2) ONLY | CIR Engine, Assessment Views, Audit Desk | Tied to `DecisionRun` & `RuleVersion` | Immutable per DecisionRun UUID | Evaluation trace, variable snapshot, evidence link | `[CURRENT]` Overridden by regex<br>`[TARGET]` Exclusive legal authority |
| **Decision Execution Run** | **PRIMARY** (Execution Event) | `apps/applicability/models.py:DecisionRun` | `ApplicabilityEngine` (Engine 2) ONLY | Assessment Pipeline, Admin Portal | Immutable UUID per run | Immutable | Execution duration, engine version, profile version | `[CURRENT]` Disconnected from admin<br>`[TARGET]` Linked to CIR |
| **Compliance Intelligence** | **AUTHORITATIVE PROJECTION** | `domain/intelligence/cir.py:ComplianceIntelligenceRecord` | CIR Aggregator Service ONLY | UI Dashboard, Admin Control, Projections | Versioned snapshot per Assessment Run | Cached per Assessment UUID + CIR Hash | Content hash, timestamp, signature | `[CURRENT]` Entity does not exist<br>`[TARGET]` Core intelligence projection |
| **Regulatory Evidence** | **EVIDENTIARY AUTHORITY** | `ComplianceRag` Evidence Store | Ingestion Pipeline, Gazette Harvester | RAG Service, Engine 2, Admin Auditor | Chunk ID + Content Hash | Immutable chunk cache | SHA-256 hash, official source URL, gazette ref | `[CURRENT]` Pickled cache in git<br>`[TARGET]` SQLite FTS5 / SafeTensors |
| **Candidate Discovery** | **PROBABILISTIC DISCOVERY** (No Authority) | `ComplianceRag` Candidate API | Hybrid Search Engine | Orchestration Pipeline (Engine 1) | Ephemeral query execution | Cacheable per Profile Hash (TTL: 24h) | Query plan, search terms, candidate score | `[CURRENT]` Disconnected CLI<br>`[TARGET]` Private RPC microservice |
| **Government Schemes** | **DETERMINISTIC PROJECTION** | `apps/schemes/pipeline/` | Scheme Rule Evaluator | Dashboard Schemes Tab | Scheme Rule Version | Cached per Profile Version | Scheme eligibility evaluation trace | `[CURRENT]` Unlinked heuristic<br>`[TARGET]` Canonical fact consumer |
| **Voluntary Standards** | **DETERMINISTIC PROJECTION** | `apps/standards/` | Standards Rule Evaluator | Dashboard Standards Tab | Standard Rule Version | Cached per Profile Version | Mandatory QCO vs voluntary distinction | `[CURRENT]` Unlinked heuristic<br>`[TARGET]` Canonical fact consumer |
| **Statutory Deadlines** | **OPERATIONAL PROJECTION** | `apps/calendar/models.py:CaseDeadline` | Calendar Projection Engine | User Calendar, iCal Exporter | Derived from CIR + Business Events | Cached per Business ID + Year | Calculation formula, trigger event timestamp | `[CURRENT]` Linked to legacy cases<br>`[TARGET]` Derived from CIR |
| **Natural Language Explanations** | **EXPLANATORY ONLY** (No Authority) | Gemini Explanation Service | Gemini API Wrapper | Presentation Layer | Ephemeral per CIR Version | Cached per CIR Hash + Model Version | Prompt template, model parameters, latency | `[CURRENT]` Explains & assigns status<br>`[TARGET]` Explanation only |
| **User Dashboard View** | **READ-ONLY PROJECTION** | `frontend/app/compliance/page.tsx` | Next.js Server Components / React Query | End User Browser | Synced to CIR Version | Browser query cache (TTL: 5m) | Render timestamp | `[CURRENT]` Mock failover + regex<br>`[TARGET]` Pure projection of CIR |
| **Admin Control Room** | **AUDIT PROJECTION** | `apps/admin_portal/` | Django Admin & Custom Scrutiny Views | Compliance Officers | Synced to CIR Version | Uncached / Live DB Queries | Admin user ID, audit remarks, override log | `[CURRENT]` Queries legacy cases<br>`[TARGET]` Direct AST/CIR scrutiny |
| **Legacy Compliance Cases** | **DEPRECATED STORE** (Zero Authority) | `apps/workflows/models.py:ComplianceCase` | Legacy Workflow Commands | Admin Overview, Legacy Views | Unversioned mutable records | Do not cache | Historic creation log | `[CURRENT]` Competes with Engine 2<br>`[TARGET]` Phased deprecation |

---

## 2. COMPETING SOURCES OF TRUTH & RECONCILIATION

### Conflict SOT-01: `ComplianceCase` vs. `DecisionResult`
- **Conflict**: Admin overview queries `ComplianceCase.objects.filter(business=biz)`, while the orchestration engine writes to `DecisionResult`.
- **Current Repository Truth**: Both tables exist independently. Admin views see legacy cases that ignore Engine 2 outcomes.
- **Canonical Decision**: `DecisionResult` (and its projection, the `CIR`) is the **sole statutory truth**. `ComplianceCase` is deprecated.
- **Reason**: Maintaining two independent tables for statutory obligations causes administrative audit drift.
- **Migration Impact**: Phase 7 creates a read-adapter redirecting `ComplianceCase` queries to `CIR`; Phase 8 archives the legacy table.

### Conflict SOT-02: Gemini Legal Applicability vs. Engine 2
- **Conflict**: ComplianceRag prompts Gemini to output `APPLICABLE`, `POTENTIALLY_APPLICABLE`, or `NOT_APPLICABLE` (`gemini_analyzer.py:56-140`).
- **Current Repository Truth**: Generative model acts as legal arbiter in ComplianceRag.
- **Canonical Decision**: Engine 2 AST evaluation is the **sole legal applicability authority**.
- **Reason**: Probabilistic models hallucinate legal exemptions, lack deterministic reproducibility, and cannot provide mathematical proof traces.
- **Migration Impact**: Immediate prohibition in Phase 1; prompt template stripped of legal verdict instructions in Phase 5.

### Conflict SOT-03: View-Layer Regex Filters vs. Engine 2
- **Conflict**: `apps/requirements/views.py:183-205` applies `is_pure_software` and `is_physical_mfg` regex checks, overriding Engine 2 determinations.
- **Current Repository Truth**: Regex filters strip valid factory and environmental obligations post-evaluation.
- **Canonical Decision**: Engine 2 AST rules are the **sole applicability authority**. View-layer regexes are eliminated.
- **Reason**: Siting and manufacturing preconditions must be evaluated as explicit AST logic nodes, not view-layer overrides.
- **Migration Impact**: Preconditions verified in knowledge packs; regex functions deleted in Phase 7.

### Conflict SOT-04: Frontend Mock Data Fallback vs. Backend API Truth
- **Conflict**: `frontend/context/BusinessContext.tsx:68-75` catches API errors and populates the UI with 658 lines of mock "Acme Textiles" data.
- **Current Repository Truth**: Mock data silently conceals backend failures from users.
- **Canonical Decision**: The API returning CIR state is the **sole truth**. API failures render explicit error cards.
- **Reason**: Silent failovers to mock data create false impressions of compliance and deceive users regarding statutory standing.
- **Migration Impact**: Delete `frontend/data/userProfileHomeData.ts` and update error boundaries in Phase 2.

### Conflict SOT-05: Synthesis Cache Fallback vs. Engine 2
- **Conflict**: `apps/orchestration_views.py:474-679` calculates `applicable_count` and marks requirements `APPLICABLE` from LLM synthesis text when `DecisionRun` is missing.
- **Current Repository Truth**: View assigns compliance status without an Engine 2 run.
- **Canonical Decision**: Engine 2 is the **sole source**. If `DecisionRun` is absent, return HTTP 409 (`DECISION_NOT_AVAILABLE`).
- **Reason**: Prevents unverified LLM text summaries from masquerading as confirmed statutory determinations.
- **Migration Impact**: Remove Priority 2 synthesis fallback in Phase 2.
