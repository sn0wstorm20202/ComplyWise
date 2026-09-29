# 04. COMPLYWISE DOMAIN BOUNDARIES & DEPENDENCY GOVERNANCE
## SUBSYSTEM ENCAPSULATION, CONCENTRIC LAYERS & IMPORT DIRECTION SPECIFICATION

- **Document ID**: `CW-DOM-2026-V1`
- **Precedence Level**: **LEVEL 4**
- **Status**: MANDATORY / NORMATIVE
- **Effective Date**: September 28, 2026
- **Architecture Standard**: Clean Architecture / Domain-Driven Design (DDD)
- **Core Rule**: High-level domain policies must never depend on low-level presentation, database, or infrastructure adapters.

---

## 1. ARCHITECTURAL LAYERS & DEPENDENCY RULES

The platform is organized into five concentric layers. Dependencies may only point **inward** toward the core domain:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 5: PRESENTATION (Next.js Frontend, Admin Portal, CLI Tools)           │
├─────────────────────────────────────────────────────────────────────────────┤
│ LAYER 4: API & CONTROLLERS (DRF Views, Serializers, Authentication Guards)  │
├─────────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: APPLICATION SERVICES (Pipeline Orchestration, Task Coordinators)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: DOMAIN SERVICES (Engine 2 Evaluator, Profile Normalizer, CIR)      │
├─────────────────────────────────────────────────────────────────────────────┤
│ LAYER 1: CORE DOMAIN MODELS & CONTRACTS (Canonical Facts, AST, Entities)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dependency Inversion Rules
1. **Domain Models must never import from Application or API layers**: `domain/evaluation/` or `apps/businesses/models.py` must never import DRF serializers, view classes, or HTTP request objects.
2. **Engine 2 must never depend on Gemini or RAG**: The applicability engine must remain an isolated mathematical function: $f(\text{RuleAST}, \text{ProfileVersion}) \longrightarrow \text{DecisionResult}$.
3. **Frontend must never import backend business logic**: The client renders JSON projections and must never contain duplicated statutory rules, regex filters, or applicability heuristics.
4. **No circular dependencies between Django apps**: Apps must communicate across defined service interfaces rather than executing cross-app model mutations.

---

## 2. THE 18 INDUSTRIAL DOMAIN MODULES

### 1. `accounts` (Identity & Access)
- **Responsibility**: User authentication, password management, JWT issuance, MFA, RBAC roles.
- **Owns**: `User`, `Membership`, `Role`, `TokenBlacklist`.
- **Must Not Own**: Business metadata, assessment state, tenant data resolution.
- **Inputs**: Credentials, refresh tokens, registration payloads.
- **Outputs**: Validated `Principal`, JWT tokens, session context.
- **Dependencies**: None (Layer 1 Core).
- **State**: `[CURRENT]` Operational; `[TARGET]` MFA hardening.

### 2. `businesses` (Tenancy & Profiles)
- **Responsibility**: Organization identity, multi-tenant isolation, canonical business profile versions.
- **Owns**: `Business`, `BusinessMembership`, `Assessment`, `BusinessProfileVersion`.
- **Must Not Own**: Compliance decision logic, question generation, workflow tasks.
- **Inputs**: Organization metadata, structured profile updates.
- **Outputs**: Authorized `TenantContext`, immutable `ProfileVersion` snapshots.
- **Dependencies**: `accounts`.
- **State**: `[CURRENT]` Critical leak in `resolve_safely`; `[TARGET]` Strict `resolve_authorized()`.

### 3. `onboarding` (Fact Ingestion & Wizard)
- **Responsibility**: Wizard state management, multi-step profile intake, question-answer coordination.
- **Owns**: `OnboardingSession`, `WizardDraft`.
- **Must Not Own**: Questionnaire generation logic, statutory rule ASTs.
- **Inputs**: User form submissions, free-text operational descriptions.
- **Outputs**: Raw input payloads passed to Understanding and Adaptive Questioning.
- **Dependencies**: `businesses`, `accounts`.
- **State**: `[CURRENT]` Hardcoded 15 questions; `[TARGET]` Dynamic 0–4 intake.

### 4. `understanding` (Business Understanding & Fact Extraction)
- **Responsibility**: Converting unconstrained business descriptions into structured operational facts.
- **Owns**: Extraction prompt templates, fact normalizers, unit converters, fact provenance trackers.
- **Must Not Own**: Legal applicability decisions, candidate requirement selection.
- **Inputs**: Free-text business description, industry selection, entity type.
- **Outputs**: Validated `CanonicalFact` dictionary with source provenance.
- **Dependencies**: `providers/llm`, `businesses`.
- **State**: `[CURRENT]` Qualitative text only; `[TARGET]` Quantitative numerical extraction.

### 5. `questioning` (Adaptive Question Engine)
- **Responsibility**: Identifying material factual unknowns required by candidate rules and generating 0–4 targeted questions.
- **Owns**: Unknowns analyzer, question prioritization logic, `SmartQuestionPlan`, `SmartQuestionInstance`.
- **Must Not Own**: Hardcoded 15-question quotas, legal decision logic.
- **Inputs**: Candidate requirement ASTs, current `BusinessProfileVersion`.
- **Outputs**: Prioritized list of 0–4 `SmartQuestion` objects.
- **Dependencies**: `businesses`, `requirements`, `providers/llm`.
- **State**: `[CURRENT]` Line 1470 discard bug; `[TARGET]` 0–4 gap-driven flow.

### 6. `knowledge` (Statutory Rules & Definitions)
- **Responsibility**: Storage, validation, and versioning of statutory requirements and compiled AST rules.
- **Owns**: `RequirementDefinition`, `RuleVersion`, `KnowledgePackRegistry`.
- **Must Not Own**: Dynamic business state, user evaluation results.
- **Inputs**: Validated YAML rule manifests, gazette citations, schema versions.
- **Outputs**: Compiled, immutable `RuleVersion` entities ready for Engine 2 evaluation.
- **Dependencies**: None (Core Regulatory Domain).
- **State**: `[CURRENT]` 5 static packs; `[TARGET]` Consolidated gazette-backed AST store.

### 7. `retrieval` (ComplianceRag Integration Client)
- **Responsibility**: Communicating with the private ComplianceRag service to retrieve evidence and candidate requirements.
- **Owns**: Typed RAG client, query planners, evidence cache adapters.
- **Must Not Own**: In-process index generation, legal applicability decisions.
- **Inputs**: Canonical profile facts, state, sector, regulatory domains.
- **Outputs**: `CandidateRequirement` IDs, `EvidencePack` objects with content hashes.
- **Dependencies**: `businesses`, external `ComplianceRag` private service.
- **State**: `[CURRENT]` Zero runtime integration; `[TARGET]` Private mTLS/HMAC client.

### 8. `applicability` (Engine 2 Deterministic Rule Engine)
- **Responsibility**: Executing compiled AST rules against immutable business profiles using 3-valued Kleene logic.
- **Owns**: `ApplicabilityEngine`, `Evaluator`, `TruthTable`, `DecisionRun`, `DecisionResult`.
- **Must Not Own**: Network calls, LLM invocations, regex filtering, presentation formatting.
- **Inputs**: `BusinessProfileVersion`, List of candidate `RuleVersion` ASTs.
- **Outputs**: Set of `DecisionResult` entities (`APPLICABLE`, `NOT_APPLICABLE`, `NEEDS_INFORMATION`).
- **Dependencies**: `businesses`, `knowledge`. **ZERO DEPENDENCY ON LLM OR RAG.**
- **State**: `[CURRENT]` Sound engine bypassed by views; `[TARGET]` Sole uncompromised authority.

### 9. `cir` (Compliance Intelligence Record)
- **Responsibility**: Aggregating assessment results into an authoritative, versioned compliance snapshot.
- **Owns**: `ComplianceIntelligenceRecord`, CIR serializer, content hash signing.
- **Must Not Own**: Rule evaluation, workflow task execution.
- **Inputs**: `Assessment`, `DecisionRun`, `DecisionResult` set.
- **Outputs**: Immutable `CIR` document.
- **Dependencies**: `businesses`, `applicability`.
- **State**: `[CURRENT]` Does not exist in code; `[TARGET]` Core intelligence projection.

### 10. `schemes` (Government Incentives & Subsidies)
- **Responsibility**: Evaluating enterprise eligibility for central and state MSME financial incentives.
- **Owns**: `SchemeDefinition`, `SchemeEligibilityEvaluator`, `SchemeResult`.
- **Must Not Own**: Mandatory compliance rules, core business profile state.
- **Inputs**: `BusinessProfileVersion`, `CIR`.
- **Outputs**: List of eligible schemes with incentive amounts and criteria traces.
- **Dependencies**: `businesses`, `cir`.
- **State**: `[CURRENT]` Semi-isolated crawler; `[TARGET]` Clean CIR consumer.

### 11. `standards` (Voluntary & Mandatory Product Standards)
- **Responsibility**: Differentiating between mandatory Quality Control Orders (QCOs) and voluntary quality standards (ISO, BIS).
- **Owns**: `StandardDefinition`, `StandardEvaluator`, `StandardResult`.
- **Must Not Own**: General factory or environmental law.
- **Inputs**: `BusinessProfileVersion` (product tags, HSN codes), `CIR`.
- **Outputs**: Mandatory vs. voluntary standards classification.
- **Dependencies**: `businesses`, `cir`.
- **State**: `[CURRENT]` Basic heuristic; `[TARGET]` Clean CIR consumer.

### 12. `documents` (Evidence & Verification)
- **Responsibility**: Document upload, storage, OCR extraction, and document-to-requirement matching.
- **Owns**: `Document`, `DocumentRequirement`, `DocumentVerificationJob`.
- **Must Not Own**: Regulatory rule authoring, applicability decisions.
- **Inputs**: Uploaded files (PDF, PNG), `CIR` requirement obligations.
- **Outputs**: Verified compliance documents linked to requirements.
- **Dependencies**: `businesses`, `cir`.
- **State**: `[CURRENT]` Upload works; `[TARGET]` Linked directly to CIR obligations.

### 13. `workflows` (Operational Action Engine)
- **Responsibility**: Managing operational tasks, filing steps, owner assignment, and statutory clearance tracking.
- **Owns**: `WorkflowAction`, `FilingTask`, `ActionStateMachine`.
- **Must Not Own**: Deciding whether an obligation applies to the business.
- **Inputs**: `CIR` applicable obligations.
- **Outputs**: Operational task queues and audit milestones.
- **Dependencies**: `businesses`, `cir`.
- **State**: `[CURRENT]` Legacy `ComplianceCase` mutator; `[TARGET]` Pure projection of CIR.

### 14. `calendar` (Statutory Deadlines & Projections)
- **Responsibility**: Calculating statutory deadlines, filing schedules, renewal alerts, and exporting iCal streams.
- **Owns**: `DeadlineRule`, `ScheduledDeadline`, `CalendarEvent`.
- **Must Not Own**: Applicability determinations.
- **Inputs**: `CIR` determinations, enterprise milestone dates (e.g. factory commissioning date).
- **Outputs**: Chronological deadline feeds and alert notifications.
- **Dependencies**: `businesses`, `cir`.
- **State**: `[CURRENT]` Deadlines linked to legacy cases; `[TARGET]` Derived from CIR.

### 15. `explanation` (Assistant & Rationale Generator)
- **Responsibility**: Translating complex Engine 2 execution traces into plain-language summaries for business owners.
- **Owns**: Assistant chatbot controller, explanation prompt templates, conversational context.
- **Must Not Own**: Computing applicability, altering compliance status.
- **Inputs**: `CIR` determinations, evaluation traces, user query.
- **Outputs**: Natural language explanation anchored strictly to verified evidence.
- **Dependencies**: `businesses`, `cir`, `providers/llm`.
- **State**: `[CURRENT]` Leaks via `.first()`; `[TARGET]` Authorized, CIR-anchored.

### 16. `admin_portal` (Audit Desk & Rule Debugger)
- **Responsibility**: Back-office compliance officer tools, AST visual inspection, manual review workflows.
- **Owns**: Scrutiny views, AST debug UI, knowledge authoring review queues.
- **Must Not Own**: Alternative compliance decision rules.
- **Inputs**: Live database records across all modules.
- **Outputs**: Auditor review decisions, approved knowledge updates.
- **Dependencies**: All domain modules (Presentation Layer).
- **State**: `[CURRENT]` `AllowAny` + legacy case views; `[TARGET]` Scrutiny room reading CIR.

### 17. `acquisition` (Official Source Crawling & Ingestion)
- **Responsibility**: Controlled harvesting of official gazette PDFs and regulatory notifications.
- **Owns**: Crawler configurations, SSRF guards, domain allowlists, document download queues.
- **Must Not Own**: Business-facing APIs, applicability logic.
- **Inputs**: Whitelisted regulatory portal URLs, gazette RSS feeds.
- **Outputs**: Raw statutory PDF/HTML artifacts passed to ComplianceRag.
- **Dependencies**: None (Infrastructure Layer).
- **State**: `[CURRENT]` Unrestricted Crawlee; `[TARGET]` SSRF-hardened perimeter.

### 18. `providers` (External Service Abstractions)
- **Responsibility**: Decoupling domain logic from third-party vendor SDKs (Gemini, OpenAI, Storage).
- **Owns**: `LLMProvider`, `StorageProvider`, `EmbeddingProvider` abstract interfaces and concrete adapters.
- **Must Not Own**: Business logic, domain rules.
- **Inputs**: Raw prompts, files, messages.
- **Outputs**: Normalized responses, structured output DTOs.
- **Dependencies**: None (Infrastructure Layer).
- **State**: `[CURRENT]` Functional registry; `[TARGET]` Maintained as vendor isolation layer.

---

## 3. PERMITTED VS. FORBIDDEN DEPENDENCY FLOWS

```
ALLOWED:
  API Controllers ──> Application Services ──> Domain Services ──> Domain Entities
  Orchestrator    ──> Understanding        ──> providers/llm
  Orchestrator    ──> Questioning          ──> providers/llm
  Orchestrator    ──> Retrieval            ──> ComplianceRag Service
  Orchestrator    ──> Engine 2             ──> Knowledge ASTs
  CIR             ──> Workflows, Calendar, Schemes, Standards

STRICTLY FORBIDDEN:
  Engine 2 ──x──> providers/llm       (Engine 2 must never call an LLM)
  Engine 2 ──x──> ComplianceRag       (Engine 2 evaluates locally; does not retrieve)
  Engine 2 ──x──> API Views           (Engine 2 is purely domain logic)
  Frontend ──x──> Engine 2            (Frontend never evaluates rules directly)
  Frontend ──x──> Regex Filters       (Frontend never overrides backend truth)
  Workflows──x──> Legal Decision      (Workflows only project CIR truth)
```
