# ComplyWise API Orchestration — Architecture & Specification

## 1. Executive Summary

The **ComplyWise API Orchestration Engine** provides a resilient, provider-agnostic, multi-stage assessment coordinator for regulatory compliance, statutory applicability, standards matching, and business scheme evaluation.

This architecture decouples domain execution into discrete, idempotent, observable pipeline stages coordinated by a central state machine. It introduces explicit **Runtime Mode Separation** allowing the system to run in:
1. **`LLM_FIRST`** (Active default for demo/hackathon): Dynamic, generalized live extraction, web discovery, and compliance synthesis across arbitrary business verticals without requiring pre-compiled static rule dictionaries.
2. **`KNOWLEDGE_FIRST`**: Deterministic evaluation against pre-compiled static domain knowledge packs, legacy rule trees, and static compliance matrices.
3. **`HYBRID`**: Combined mode executing knowledge pack validation first, followed by live LLM-driven discovery for unmapped regulatory jurisdictions.

All runtime modes produce unified, standard-format assessment artifacts, ensuring that downstream systems (Workflows, Calendar, Dashboards, Assistant) and frontend user interfaces operate against consistent data contracts without exposing internal execution strategies.

---

## 2. Assessment Lifecycle State Machine

### 2.1 Stages Definition

The assessment lifecycle consists of 17 distinct stages enumerated in `AssessmentStage`:

| Stage Enum | Value | Description | Terminal? |
| :--- | :--- | :--- | :--- |
| `INITIALIZE` | `initialize` | Validates business context, budget allocations, idempotency keys, and registers initial run state. | No |
| `BUSINESS_UNDERSTANDING` | `business_understanding` | Normalizes and deepens business profile (entity type, activities, scale, turnover, jurisdictions). | No |
| `QUESTION_GENERATION` | `question_generation` | Dynamically produces 15 high-leverage contextual compliance questions tailored to the business. | No |
| `ANSWER_COLLECTION` | `answer_collection` | Accepts structured responses from onboarding, questionnaire, or profile synthesis. | No |
| `ANSWER_INTERPRETATION` | `answer_interpretation` | Parses raw responses, extracts compliance-relevant attributes, flags ambiguities and omissions. | No |
| `CONTEXT_SYNTHESIS` | `context_synthesis` | Aggregates business facts, operational realities, geographic scope, and hazard classifications. | No |
| `REGULATORY_DISCOVERY` | `regulatory_discovery` | Conducts targeted live search/retrieval across central, state, and local regulatory mandates. | No |
| `COMPLIANCE_SYNTHESIS` | `compliance_synthesis` | Synthesizes obligations, identifies governing acts/rules, computes applicability score. | No |
| `SCHEMES` | `schemes` | Evaluates eligibility across Central and State government schemes via the live scheme pipeline. | No |
| `STANDARDS` | `standards` | Evaluates voluntary and mandatory standards (ISO, BIS, OSHA, FSSAI hygiene ratings, etc.). | No |
| `DOCUMENTS` | `documents` | Compiles statutory documentation checklist, required permits, registrations, and licenses. | No |
| `WORKFLOW` | `workflow` | Generates prioritized remediation actions, compliance workflows, and milestone roadmaps. | No |
| `CALENDAR` | `calendar` | Projects recurring statutory deadlines, filing windows, renewal schedules, and alert triggers. | No |
| `DASHBOARD` | `dashboard` | Aggregates assessment insights into unified compliance posture, risk rating, and metrics. | No |
| `ASSISTANT` | `assistant` | Hydrates the conversational AI assistant with assessment context, legal citations, and action cards. | No |
| `COMPLETED` | `completed` | Assessment run has successfully executed all required stages; artifacts sealed and frozen. | **Yes** (Success) |
| `FAILED` | `failed` | Unrecoverable error encountered or budget exceeded; details recorded with safe user error message. | **Yes** (Failure) |

### 2.2 Transition Rules

1. **Monotonic Progression**: Under standard execution, stages transition sequentially:
   $$\text{INIT} \rightarrow \text{UNDERSTAND} \rightarrow \text{Q\_GEN} \rightarrow \text{A\_COLL} \rightarrow \text{A\_INTERP} \rightarrow \text{CTX\_SYN} \rightarrow \text{REG\_DISC} \rightarrow \text{COMPL\_SYN} \rightarrow \text{SCHEMES} \rightarrow \text{STANDARDS} \rightarrow \text{DOCS} \rightarrow \text{WF} \rightarrow \text{CAL} \rightarrow \text{DASH} \rightarrow \text{ASST} \rightarrow \text{COMPLETED}$$
2. **Terminal Boundaries**:
   - `COMPLETED` and `FAILED` cannot transition to any other stage. Attempts raise `OrchestrationConflictError`.
3. **Failure Transition**:
   - Any stage experiencing an unhandled exception or non-retryable failure transitions directly to `FAILED`.
   - Partial stage artifacts completed prior to failure remain preserved in `step_state`.
4. **Idempotent Re-entry**:
   - Calling `create_run` with an existing `idempotency_key` returns the existing `AssessmentRun` without re-initializing or mutating stage progression.

### 2.3 Stage Result Contract

Each stage returns a standardized `StageResult` dataclass serialized to JSON:

```json
{
  "stage": "business_understanding",
  "status": "completed",
  "data": {
    "normalized_profile": {
      "name": "Acme Dairy",
      "sector": "food_processing",
      "state": "Maharashtra"
    }
  },
  "error": null,
  "warnings": [],
  "metrics": {
    "duration_ms": 142.5,
    "tokens_used": 0,
    "estimated_cost_usd": 0.0,
    "llm_calls": 0
  },
  "provenance": {
    "strategy": "LLM_FIRST",
    "correlation_id": "corr-f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "timestamp": 1774312800.0
  }
}
```

---

## 3. Runtime Mode Separation Architecture

### 3.1 Strategy Pattern Hierarchy

The orchestration engine implements the Gang of Four Strategy Pattern via `AssessmentStrategy`:

```
                    ┌─────────────────────────┐
                    │   AssessmentStrategy    │
                    │         (ABC)           │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────┴─────────┐   ┌─────────┴──────────┐   ┌────────┴─────────┐
│ LLMFirstStrategy │   │KnowledgeFirstStrat │   │  HybridStrategy  │
└──────────────────┘   └────────────────────┘   └──────────────────┘
```

- **`LLMFirstStrategy`** (*Default for Demo/Hackathon*):
  - Prioritizes dynamic LLM extraction and live regulatory discovery.
  - Generates adaptive, context-specific questions rather than fixed static lists.
  - Ingests unstructured profile data, extracts applicable statutory regimes, and synthesizes obligations dynamically.
  - Interfaces with live Scheme Pipeline and Standards Engine adapters.
- **`KnowledgeFirstStrategy`** (*Baseline / Enterprise Mode*):
  - Routes directly to static domain knowledge packs located in `backend/domain/knowledge/packs/`.
  - Executes rule-tree matches against pre-configured sector matrices.
  - Zero dynamic LLM queries required for core compliance determination; guaranteed deterministic output.
- **`HybridStrategy`** (*Future Enriched Mode*):
  - Runs deterministic Knowledge Pack analysis as a baseline foundation.
  - Dispatches targeted LLM queries only for ambiguous, newly gazetted, or unmapped jurisdictions.

### 3.2 Strategy Selection Mechanism

The strategy is resolved at runtime through `get_assessment_strategy(name=None)`:
1. If `name` is explicitly passed (e.g. via internal administrative trigger or test harness), that strategy is loaded.
2. Otherwise, reads the Django setting `ASSESSMENT_STRATEGY`, configured via environment variable:
   ```bash
   ASSESSMENT_STRATEGY=LLM_FIRST   # (Default: LLM_FIRST)
   ```
3. If an unrecognized strategy is requested, `ValueError` is raised immediately, preventing silent fallbacks to invalid configurations.

---

## 4. Provider Integration Boundaries

To maintain zero vendor lock-in and prevent cross-app coupling, all domain intelligence integrates via explicit provider interfaces:

### 4.1 Schemes Provider Interface (`SchemeProvider`)
- **Contract**:
  ```python
  class SchemeProvider(ABC):
      @abstractmethod
      def evaluate_schemes(self, context: OrchestrationContext) -> Dict[str, Any]: ...
  ```
- **Adapter**: `LiveSchemeAdapter`
  - Reuses the existing `domain.schemes.pipeline.SchemeDiscoveryPipeline`.
  - Ingests `business_profile` and evaluates live Central & Maharashtra schemes, returning matched schemes with eligibility scores, benefit summaries, and application URLs.
  - Fully backward compatible with Step 00 schemes work.

### 4.2 Standards Engine Interface (`StandardsProvider`)
- **Contract**:
  ```python
  class StandardsProvider(ABC):
      @abstractmethod
      def evaluate_standards(self, context: OrchestrationContext) -> Dict[str, Any]: ...
  ```
- **Adapter**: `StandardsEngineAdapter`
  - Maps business industry, scale, and operational risk to mandatory (e.g., FSSAI Schedule 4, BIS mandatory marks) and voluntary standards (e.g., ISO 22000, ISO 9001).

### 4.3 Regulatory Discovery Provider Interface (`RegulatoryDiscoveryProvider`)
- **Contract**:
  ```python
  class RegulatoryDiscoveryProvider(ABC):
      @abstractmethod
      def discover_regulations(self, query: str, context: OrchestrationContext) -> Dict[str, Any]: ...
  ```
- **Adapter**: `WebDiscoveryAdapter`
  - Prepares the integration boundary for Step 03 live Firecrawl regulatory search.
  - Coordinates search term generation, search execution, source deduplication, and regulatory document extraction.

### 4.4 Compliance Synthesis Provider Interface (`ComplianceSynthesisProvider`)
- **Contract**:
  ```python
  class ComplianceSynthesisProvider(ABC):
      @abstractmethod
      def synthesize_compliance(self, context: OrchestrationContext, discovered_data: Dict[str, Any]) -> Dict[str, Any]: ...
  ```
- **Adapter**: `LLMSynthesisAdapter`
  - Prepares the integration boundary for Step 04 compliance synthesis.
  - Routes prompt construction to the unified `domain.providers` router, enforcing structured JSON output extraction without vendor SDK imports.

---

## 5. Error Hierarchy, Timeout, and Retry Policy

### 5.1 Error Hierarchy

All orchestration exceptions derive from `OrchestrationError`:

```
OrchestrationError (base: retryable=False, user_message=...)
├── ProviderUnavailableError       (retryable=True,  503)
├── ProviderTimeoutError           (retryable=True,  504)
├── ProviderRateLimitError         (retryable=True,  429)
├── StructuredOutputInvalidError   (retryable=True,  502)
├── StageInputInvalidError         (retryable=False, 400)
├── StageOutputInvalidError        (retryable=False, 502)
├── DiscoveryUnavailableError      (retryable=False, 503)
├── OrchestrationConflictError     (retryable=False, 409)
└── BudgetExceededError            (retryable=False, 402/429)
```

### 5.2 Timeout and Backoff Policy

- **Stage Timeouts**:
  - Light stages (Initialize, Profile, Standards): 10 seconds.
  - Heavy stages (Discovery, Synthesis, Schemes): 30–60 seconds.
- **Retry Mechanics**:
  - Only exceptions marked `retryable=True` are retried.
  - Exponential backoff with jitter: $T_{\text{wait}} = \text{base\_delay} \times 2^{\text{attempt}} + \text{jitter}$.
  - Maximum retry attempts: 3.
  - Terminal non-retryable errors abort immediately and mark stage as `FAILED`.

---

## 6. Telemetry & Budget Guardrails

### 6.1 Telemetry Integration
- Every run generates a unique `correlation_id` (format: `corr-<uuid4>`).
- Propagated through all stage executions, provider calls, and audit logs.
- Emits structured timing metrics (`duration_ms`), token counts (`tokens_used`), and cost estimates (`estimated_cost_usd`).
- Integrates with `domain.telemetry` span tracking.

### 6.2 Budget Guardrails
Guards against runaway LLM invocation costs through per-assessment hard limits configured in settings:
- `MAX_LLM_CALLS_PER_ASSESSMENT = 15`
- `MAX_TOTAL_TOKENS_PER_ASSESSMENT = 50,000`
- `MAX_ESTIMATED_COST_PER_ASSESSMENT = 0.50` (USD)

The orchestrator checks budgets before invoking LLM stages:
```python
if run.total_llm_calls >= MAX_LLM_CALLS_PER_ASSESSMENT:
    raise BudgetExceededError(...)
```

---

## 7. Idempotency & Concurrency Control

- **Storage Engine**: Leverages the existing `apps.businesses.models.Assessment.step_state` JSON field, avoiding schema modifications or database migrations.
- **Idempotency Key**: Generated by client or derived from `business_id` + run parameters.
- **Duplicate Protection**:
  - `AssessmentOrchestrator.create_run()` queries existing runs for the same business with the active `idempotency_key`.
  - If a matching run exists, the existing run is returned immediately with `is_new=False`.
  - If a stage transition is attempted on a `COMPLETED` or `FAILED` run, an `OrchestrationConflictError` is raised.

---

## 8. API Endpoints Specification

### 8.1 Create / Resume Orchestrated Assessment
- **URL**: `POST /api/v1/assessments/` or `POST /api/v1/businesses/<business_id>/assessments/orchestrate/`
- **Headers**:
  - `Authorization: Bearer <JWT>`
  - `X-Idempotency-Key: <UUID>` (Optional)
- **Request Body**:
  ```json
  {
    "business_id": "7f8c12a4-...",
    "idempotency_key": "user-client-req-001",
    "strategy": "LLM_FIRST"
  }
  ```
- **Response (201 Created / 200 OK)**:
  ```json
  {
    "assessment_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "business_id": "7f8c12a4-...",
    "status": "in_progress",
    "current_stage": "initialize",
    "correlation_id": "corr-c73a5c8e-3294-4d89-8d76-e17f098fe7e5",
    "strategy": "LLM_FIRST",
    "total_llm_calls": 0,
    "total_tokens_used": 0,
    "estimated_cost_usd": 0.0,
    "step_state": { ... },
    "created_at": "2026-09-23T01:30:00Z",
    "updated_at": "2026-09-23T01:30:00Z"
  }
  ```

### 8.2 Get Orchestrated Assessment Status
- **URL**: `GET /api/v1/assessments/<assessment_id>/`
- **Headers**:
  - `Authorization: Bearer <JWT>`
- **Response (200 OK)**:
  Returns current run state, completed stages, stage execution results, and progress metrics.

---

## 9. Knowledge Pack Preservation & Isolation

Existing knowledge packs in `backend/domain/knowledge/packs/` remain 100% intact:
- `dairy_processing.json`
- `general_retail.json`
- `restaurant.json`
- `textile_garments.json`

These packs are completely preserved and encapsulated inside `KnowledgeFirstStrategy`. No files were deleted, renamed, or modified.

---

## 10. Frontend Safety & Information Hiding

To ensure a seamless, professional user experience:
1. **No Mode Leaks**: The frontend UI never displays internal implementation labels such as "LLM Mode", "Knowledge Base Mode", or "Mock Mode".
2. **No Model Leaks**: Internal provider names (e.g. "Grok 2.0", "Gemini 1.5 Pro", "OpenAI GPT-4o") and raw prompt templates are stripped from public client responses.
3. **Unified UX**: Progress indicators display neutral stage titles ("Analyzing business operations", "Evaluating applicable regulations", "Discovering government schemes").

---

## 11. Playwright Setup Requirements for Step 05

For End-to-End browser verification in Step 05, Playwright must be installed in the backend or frontend environment.

### Prerequisites & Installation Plan:
1. **Python Playwright Installation**:
   ```bash
   pip install playwright pytest-playwright
   playwright install chromium --with-deps
   ```
2. **Target Test Scope**:
   - Verify complete onboarding to assessment lifecycle flow in browser.
   - Assert that no internal architecture details leak into UI elements.
   - Verify dynamic question rendering and questionnaire submission.
   - Assert compliance summary and scheme cards render accurately.

---

## 12. Step 02 — AI Business Understanding & 15-Question Intelligence

### 12.1 Business Understanding Architecture
The `BusinessUnderstandingEngine` (`backend/domain/intelligence/business_understanding.py`) analyzes raw business profiles, constitutions, locations, and plain-text activity descriptions to determine the real-world operational reality:
- **Strict Output Schema**:
  ```json
  {
    "business_type": "Manufacturing Enterprise",
    "primary_activity": "Design and assembly of 65W GaN fast chargers",
    "products": ["65W Fast Charger", "USB-PD Adapters"],
    "manufacturing_or_service": "MANUFACTURING",
    "market": "EXPORT",
    "geography": {
      "state": "Maharashtra",
      "district": "Pune",
      "industrial_zone_status": "APPROVED_ESTATE"
    },
    "trade_intent": "EXPORT_ONLY",
    "operational_characteristics": [
      "SMT assembly lines",
      "Wave soldering and VOC ventilation",
      "Electronic component testing"
    ],
    "likely_regulatory_domains": [
      "BIS Compulsory Registration Scheme (CRS)",
      "State Pollution Control Board (Consent to Establish/Operate)",
      "E-Waste Management Rules (EPR Authorization)"
    ],
    "important_unknowns": [
      "Sanctioned electrical load in HP",
      "Total and contract workforce count",
      "Capital investment in plant and machinery"
    ],
    "normalized_facts": []
  }
  ```
- **Strict Guardrail**: Strictly does NOT declare legal applicability, statutory approvals, or exemptions.

### 12.2 15-Question Generation Engine
The `QuestionnaireEngine` (`backend/domain/intelligence/questionnaire.py`) generates **EXACTLY 15 contextual compliance questions** in a **single LLM call**:
- **Dynamic Formulation**: Questions dynamically target the critical unknowns identified during business understanding.
- **Structured Question Contract**: Every question includes `question_id` (Q01–Q15), `question`, `category`, `answer_type` (TEXT, NUMBER, BOOLEAN, SINGLE_SELECT, MULTI_SELECT, DATE, CURRENCY, PERCENTAGE), `required`, `options`, `unit`, `help_text`, `reason`, and `order`.
- **Quality & Diversity**: Different industries receive sector-tailored questions (e.g. Cement receives clinker/quarrying/emission questions and NEVER drinking-water or dairy questions; Electronics receives BIS CRS/SMT/E-waste questions; Food receives FSSAI/cold-chain questions).
- **Emergency Fallback**: If LLM provider fails (503, 429, timeout) or output is malformed, a deterministic emergency fallback generates 15 sector-tailored questions, ensuring the live demo never crashes.
- **Idempotency & Persistence**: Persisted in `SmartQuestionPlan` and 15 `SmartQuestionInstance` rows. Subsequent calls return the cached 15 questions with 0 LLM calls.

### 12.3 Answer Collection & Structured Interpretation
The `AnswerInterpreter` (`backend/domain/intelligence/answer_interpretation.py`):
- **Zero LLM Calls on Answer Entry**: Answers are validated, type-coerced, and saved into DB and assessment state without invoking an LLM.
- **Structured Interpretation**: Translates answers into structured compliance facts (`connected_power_load`, `total_worker_count`, `has_contract_workers`, `plant_machinery_investment`, `annual_turnover`, `trade_intent`, `export_intent`, `hazardous_waste_generation`, `plastic_packaging_used`, `effluent_generation`).

### 12.4 Multi-Layer Precedence Merge & Provenance
The Context Merge Engine (`backend/domain/intelligence/context_merge.py`) synthesizes a canonical `EnrichedBusinessContext`:
- **Precedence Hierarchy**:
  $$\text{EXPLICIT USER ANSWER (100)} > \text{INTERPRETED ANSWER (90)} > \text{BUSINESS PROFILE (80)} > \text{DERIVED FACT (70)} > \text{LLM INFERENCE (50)}$$
- **Guarantee**: LLM inference CANNOT overwrite an explicit user answer or confirmed database profile attribute.
- **Provenance Tracking**: Every fact tracks its source (`USER_ANSWER`, `BUSINESS_PROFILE`, `DERIVED_FACT`, `LLM_BUSINESS_UNDERSTANDING`) and confidence level (`EXPLICIT`, `HIGH`, `INFERRED`).

### 12.5 Step 02 API Endpoints
All endpoints enforce JWT authentication, tenant isolation, and clean user-safe envelopes:
- `POST /api/v1/assessments/<id>/understand/` — Executes Business Understanding stage.
- `POST /api/v1/assessments/<id>/questions/generate/` — Generates & persists exactly 15 questions in 1 LLM call (idempotent).
- `GET /api/v1/assessments/<id>/questions/` — Retrieves the 15 questions, answer states, progress, and next question.
- `POST /api/v1/assessments/<id>/answers/` — Submits single or batch answers (0 LLM calls).
- `GET /api/v1/assessments/<id>/context/` — Returns the canonical enriched business context with provenance summary.

