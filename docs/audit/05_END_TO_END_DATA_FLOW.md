# 05 — END-TO-END DATA FLOW AUDIT
## COMPLETE LIFECYCLE DATA PROPAGATION TRACE

**Audit Focus:** Forensic trace of business variables, identifiers, and evidentiary records from onboarding intake to dashboard and admin presentation.

---

### 1. Conceptual vs Real Implementation Data Flow

#### Conceptual Target Pipeline:
```
BUSINESS INPUT
      ↓
BUSINESS UNDERSTANDING
      ↓
CANONICAL BUSINESS FACTS
      ↓
ADAPTIVE QUESTIONS (0 to N)
      ↓
IMMUTABLE PROFILE VERSION
      ↓
BUSINESS-AWARE RETRIEVAL (RAG)
      ↓
OFFICIAL SOURCE DISCOVERY
      ↓
CRAWLEE / WEB ACQUISITION
      ↓
VERIFIED EVIDENCE (Hashes & Dates)
      ↓
ENGINE 2 — DETERMINISTIC APPLICABILITY (AST & Kleene Logic)
      ↓
DECISION RUN (Immutable Audit)
      ↓
COMPLIANCE INTELLIGENCE RECORD (CIR)
      ↓
SCHEMES · STANDARDS · WORKFLOWS · CALENDAR
      ↓
USER DASHBOARD & ADMIN CONTROL ROOM
```

#### Current Reality in Code:
```mermaid
sequenceDiagram
    autonumber
    actor Founder as Business Founder
    participant UI as Frontend (Next.js)
    participant API as ComplyWise DRF Views
    participant BU as Business Understanding (LLM)
    participant QGen as Questionnaire Engine (LLM)
    participant PV as Profile Version (DB)
    participant Disc as Discovery Provider
    participant Crawl as Crawlee / HTTP Fallback
    participant E2 as Engine 2 (Applicability Engine)
    participant ViewPatch as Requirements View (Regex Patch)
    participant RAG as ComplianceRag (CLI - Disconnected)

    Founder->>UI: Enter free-text description, name, state
    UI->>API: POST /api/v1/businesses/orchestration/runs
    API->>BU: Extract structured facts from free text
    BU-->>API: JSON: {business_type, primary_activity, products, facts}
    API->>PV: Create BusinessProfileVersion (v1)
    
    API->>QGen: Generate questions (forces 5-6 questions)
    QGen-->>UI: Return Q01-Q06
    Founder->>UI: Submit answers
    UI->>API: POST /answers
    API->>PV: Create BusinessProfileVersion (v2)
    
    alt In-Process Discovery (ComplyWise)
        API->>Disc: Generate queries
        Disc->>Crawl: Fetch official URLs
        Crawl-->>Disc: HTML text, SHA-256 hash
    else RAG Execution (ComplianceRag)
        Note over RAG: Completely isolated! Never invoked by API.
    end
    
    API->>E2: evaluate_business_profile(v2)
    E2->>E2: Evaluate AST rules against variables
    E2-->>API: DecisionRun + DecisionResults
    
    UI->>API: GET /api/v1/businesses/{id}/requirements
    API->>ViewPatch: Intercept DecisionResults
    Note over ViewPatch: View regex inspects description!<br/>Drops Factory/Pollution if SaaS;<br/>Drops CERT-In if Manufacturing!
    ViewPatch-->>UI: Return filtered requirements
    UI-->>Founder: Render Dashboard & Requirements
```

---

### 2. Stage-by-Stage Forensic Trace

#### Stage 1: Business Input → Business Understanding
- **Input:** Founder enters company name, state, legal constitution, and plain-text business description in `frontend/app/onboarding/page.tsx`.
- **API Call:** `POST /api/v1/businesses/orchestration/runs`
- **Execution:** `BusinessUnderstandingEngine.analyze_business()` invokes LLM (`gpt-4o` / `gemini-2.5-flash`).
- **Data Extracted:**
  - `business_type`: e.g. "Services", "Manufacturing"
  - `primary_activity`: Concise statement
  - `products`: Array of strings
  - `manufacturing_or_service`: Enum (`MANUFACTURING`, `SERVICE`, `TRADING`, `HYBRID`)
  - `trade_intent`: Enum (`DOMESTIC_ONLY`, `EXPORT_ONLY`, `IMPORT_AND_EXPORT`)
  - `operational_characteristics`: e.g. `["cloud_hosting", "cross_border_data"]`
  - `normalized_facts`: Key-value pairs with source `LLM_BUSINESS_UNDERSTANDING`.
- **Finding:** Extraction is successful, but facts remain in memory and assessment `step_state` until merged.

#### Stage 2: Business Understanding → Adaptive Questions
- **Input:** Business understanding JSON + known operational facts.
- **Execution:** `QuestionnaireEngine.generate_questionnaire()`
- **Flaw / Invariant Violation:**
  - The system prompt explicitly commands: `RULES: 1. You must generate between 5 and 6 questions (minimum 5, maximum 6). Not 15, not 10. EXACTLY 5 or 6 questions.`
  - If a business has already supplied workforce count, power load, and export status in the description, the prompt still forces generation of 5–6 questions.
  - Zero, 1, 2, 3, or 4 questions are structurally impossible.
  - Furthermore, `apps/onboarding/planner.py` exists as a second, competing question planner that attempts to generate 12–20 questions per round.

#### Stage 3: Answer Collection → Context Merge → Immutable Profile Version
- **Input:** User answers submitted via `POST /api/v1/businesses/orchestration/runs/{id}/answers`.
- **Execution:** `AnswerInterpreter.interpret_answers_to_facts()` translates answer choices into canonical variable keys (`total_worker_count`, `installed_power_hp`, `annual_turnover`).
- **Persistence:** `build_canonical_enriched_context()` updates `BusinessProfileVersion.variables`.
- **Provenance:** Variables store origin (`USER_PROVIDED`), confidence (`1.0`), and timestamp. A new immutable `BusinessProfileVersion` (e.g. `v2`) is saved.

#### Stage 4: Profile Version → Search Planning & Web Acquisition
- **Input:** Enriched `DerivedBusinessContext`.
- **ComplyWise Implementation:**
  - `LiveRegulatoryDiscoveryProvider` (`domain/intelligence/discovery.py`) formats search queries.
  - Passes seed URLs to `CrawleeAcquisitionProvider` (`domain/acquisition/crawlee_provider.py`).
  - Crawlee executes `BeautifulSoupCrawler` or falls back to `urllib.request`.
  - Generates `WebAcquisitionResult` with SHA-256 `content_hash` and UTC `retrieved_at`.
- **RAG Implementation:**
  - Completely detached. Runs offline via SerpApi and ChromaDB.

#### Stage 5: Evidence → Engine 2 Deterministic Applicability
- **Input:** `BusinessProfileVersion` variables dictionary.
- **Execution:** `ApplicabilityEngine.evaluate_business_profile()` in `apps/applicability/engine.py`.
- **Rule Matching:**
  - Selects all `PUBLISHED` `RequirementDefinition` records.
  - Resolves business state against requirement jurisdiction. Central applies pan-India; state requires match.
  - Filters `RuleVersion` by effective date window (`effective_from <= eval_date <= effective_until`).
  - Evaluates condition AST via `evaluate_ast()` with Kleene 3-valued logic.
  - Resolves precedence: `OVERRIDE (4) > EXEMPTION (3) > EXCEPTION (2) > NORMAL (1)`.
  - Checks supporting `Evidence` records: if missing, expired, future, or unverified, demotes status from `APPLICABLE` to `UNVERIFIED` or `CONFLICT_REVIEW`.
  - Persists `DecisionRun` (status `COMPLETED`) and bulk creates `DecisionResult` records.
- **Status Integrity:** `UNKNOWN` always produces `NEEDS_INFORMATION`. `UNKNOWN` never becomes `FALSE`.

#### Stage 6: DecisionResult → API Presentation & View-Layer Patching
- **Expected Data Flow:**
  `DecisionResult` → `BusinessRequirementsView` → JSON Envelope → Frontend.
- **Actual Reality in Code (`apps/requirements/views.py`):**
  - View loads `DecisionResult` records.
  - Lines 172–188: View inspects business description and variables using regex:
    ```python
    is_pure_software = bool(re.search(r"\b(software|saas|platform|app|web|digital...)\b", desc_lower))
    is_physical_mfg = any(mfg_kw in desc_lower for mfg_kw in ["mill", "textile", "weaving", "spinning", "factory"...])
    ```
  - Lines 196–205: View filters out results before returning them to client:
    ```python
    if is_pure_software and any(term in combined for term in ["FACTORY", "FACTORIES", "CTE", "CTO", "POLLUTION", "SPCB", "BOILER"]):
        continue
    if is_physical_mfg and any(term in combined for term in ["CERT-IN", "CERTIN", "CYBERSECURITY", "DPDP", "DATA FIDUCIARY"]):
        continue
    ```
- **Architectural Violation:** Domain evaluation is hijacked by the presentation layer. The view overrides Engine 2 decisions using ad-hoc text matching.

#### Stage 7: Schemes, Standards, Workflows, Calendar
- **Schemes (`apps/schemes/`):** Matched deterministically by scale, turnover, and sector.
- **Standards (`apps/standards/`):** Filtered into statutory (mandatory) vs voluntary.
- **Workflows (`apps/workflows/`):** Derived from applicable requirements; creates `ComplianceCase` instances.
- **Calendar (`apps/calendar/`):** Derives filing due dates and notifies user via background job.

#### Stage 8: Frontend Dashboard & Admin Control Room
- **Frontend Dashboard:**
  - Calls `api.dashboard.getSummary()`.
  - If backend returns empty results or encounters latency, falls back to `userProfileHomeData.ts` (658 lines of hardcoded mock businesses).
- **Admin Control Room:**
  - Displays `ComplianceCase` workflows and document submissions.
  - **Does NOT display** `DecisionRun`, `DecisionResult`, AST evaluation traces, or rule versions. Admin cannot verify Engine 2 truth.

---

### 3. Comprehensive Context Propagation Table

| Variable / Identifier | Onboarding | Business Understanding | Canonical Facts | Adaptive Questions | Search & Crawlee | Engine 2 Evaluation | CIR / DecisionResult | Presentation Views | Frontend Client | Admin Control Room |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `user_id` | PRESENT | LOST | DERIVED | LOST | LOST | LOST | LOST | LOST (`AllowAny`) | PRESENT | LOST (`AllowAny`) |
| `business_id` | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT (in localStorage) | PRESENT (unscoped) |
| `assessment_id` | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT | PARTIAL (optional query param) | PARTIAL (in localStorage) | LOST |
| `profile_version_id` | PRESENT | DERIVED | PRESENT | DERIVED | LOST | PRESENT | PRESENT | LOST | LOST | PARTIAL |
| `jurisdiction` | PRESENT | PRESENT | PRESENT | DERIVED | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT | PRESENT |
| `business_type` | PRESENT | DERIVED | PRESENT | DERIVED | PRESENT | PRESENT | PRESENT | DERIVED | PRESENT | PRESENT |
| `primary_activity`| PRESENT | DERIVED | PRESENT | DERIVED | PRESENT | PRESENT | PRESENT | DERIVED | PRESENT | PRESENT |
| `products` | PRESENT | DERIVED | PRESENT | DERIVED | PRESENT | PRESENT | PRESENT | DERIVED | PRESENT | PRESENT |
| `canonical_facts` | MISSING | DERIVED | PRESENT | DERIVED | PRESENT | PRESENT | PRESENT | FILTERED (regex patch) | PRESENT | PARTIAL |
