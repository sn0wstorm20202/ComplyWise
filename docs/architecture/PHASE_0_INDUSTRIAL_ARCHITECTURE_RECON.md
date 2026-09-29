# PHASE 0: INDUSTRIAL ARCHITECTURE RECONNAISSANCE REPORT
## COMPLYWISE & COMPLIANCERAG BASELINE SPECIFICATION

- **Author**: Principal Software Architect & Systems Audit Team
- **Date**: September 28, 2026
- **Status**: APPROVED READ-ONLY BASELINE (Phase 0 Complete)
- **Target Systems**:
  - `ComplyWise` (`E:\complience\ComplyWise`, branch `feat/api-orchestration` @ `6b73ced`)
  - `ComplianceRag` (`E:\complience\ComplianceRag`, branch `main` @ `738dc83`)
- **Execution Policy**: Strictly Read-Only (Local SQLite scratch DB `E:\complience\_scratch\recon.sqlite3`; zero repository code writes; zero migrations)

---

## 1. EXECUTIVE SUMMARY

This report establishes the mechanically verified architectural baseline for the **ComplyWise** and **ComplianceRag** software assets prior to any refactoring, migration, or feature development. 

ComplyWise was conceived as an intelligent, automated regulatory compliance platform for Indian enterprises across industrial manufacturing, services, and trade. However, forensic inspection of the codebase reveals that the system developed incrementally without enforced architectural boundaries, resulting in competing sources of truth, severe tenant data isolation breaches, silent mock-data failovers, and complete decoupling between the orchestration platform and the retrieval engine.

### Core Architectural Mandate
From this point forward, the platform adheres strictly to the industrial separation of concerns:
```
BUSINESS UNDERSTANDING  →  CANONICAL PROFILE  →  ADAPTIVE QUESTIONS  →  BUSINESS-AWARE RETRIEVAL
                                                                                ↓
                                                                        AUTHORITATIVE EVIDENCE
                                                                                ↓
EXPLANATION / ASSISTANT  ←  WORKFLOWS / CALENDAR  ←  CIR  ←  DETERMINISTIC APPLICABILITY ENGINE
```
**The foundational axiom is: RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.**

### Key Forensic Discoveries
1. **Critical Multi-Tenant Isolation Breach (SEC-01 / SEC-02)**: In `apps/businesses/models.py:105-115`, `Business.resolve_safely()` restricts access *only* if the caller is authenticated and non-staff. For `user=None` or `AnonymousUser`, it executes unscoped global lookups (`cls.objects.filter(pk=uuid).first()`). Combined with line 75 of `apps/assistant/views.py` and line 70 of `apps/workflows/views.py` which fall back to `Business.objects.filter(is_active=True).first()`, unauthenticated anonymous callers can inspect and mutate arbitrary tenant records.
2. **Complete Cross-Repository Decoupling (INT-01)**: Despite documentation alleging an integrated RAG architecture, there is **zero runtime communication** (no HTTP calls, no shared database, no client libraries, no shared message queues) connecting ComplyWise to ComplianceRag.
3. **Generative Applicability Violation (RAG-01)**: ComplianceRag delegates legal applicability determinations directly to an unconstrained LLM prompt (`complywise/analysis/gemini_analyzer.py:56-140`), instructing Gemini to output `APPLICABLE` or `NOT_APPLICABLE`.
4. **View-Layer Regex Engine Bypass (ENG-01)**: The deterministic applicability engine (Engine 2) is bypassed in `apps/requirements/views.py:183-205` and `frontend/app/compliance/page.tsx:192-205` by hardcoded regex checks (`is_pure_software`, `is_physical_mfg`) that unilaterally strip or inject requirements after engine evaluation.
5. **Insecure Deserialization in Tracked Artifacts (SEC-03)**: `ComplianceRag` tracks binary pickle files in git (`cache/bm25_index.pkl`, `cache/metadata_store.pkl`) which are unpickled on startup without cryptographic integrity checks, exposing consumers to arbitrary code execution.
6. **Fictitious Domain Entities (CIR-01)**: The central architectural concept promoted throughout documentation—the **Compliance Intelligence Record (CIR)**—does not exist in the codebase.
7. **Rigid Question Fallback (ONB-01)**: In `domain/intelligence/questionnaire.py:1470`, an explicit check `if len(questions) != 15:` silently discards tailored LLM-generated questionnaires and substitutes a static, hardcoded 15-question emergency fallback.
8. **Frontend Mock Data Deception (FND-01 / FND-02)**: On API failures, the frontend catches errors and renders a 658-line static mock dataset (`frontend/data/userProfileHomeData.ts` for "Acme Textiles"), concealing backend failures. Furthermore, logging out clears session tokens but leaves cached business IDs in `localStorage`.

---

## 2. REPOSITORY FINGERPRINTS

### A. ComplyWise
- **Absolute Path**: `E:\complience\ComplyWise`
- **Active Git Branch**: `feat/api-orchestration`
- **Current Commit**: `6b73ced` (*"feat(audit): integrate dynamic intelligence pipeline and formal audit verification"*)
- **Remote Tracking**: `origin/feat/api-orchestration` -> `https://github.com/complywise/ComplyWise.git`
- **Working Tree State**: Clean (0 tracked modifications). Untracked directories: `docs/FULL_COMPLYWISE_RAG_FORENSIC_AUDIT.md`, `docs/audit/`.
- **Repository Size**: ~42 MB (excluding virtual environments and caches)
- **Non-Ignored Files**: 632 files
- **Primary Languages**: Python 3.11+ (Backend), TypeScript / React 19 (Frontend)
- **Frameworks**: Django 5.1.7, Django REST Framework 3.15.2, Next.js 15.1.0, Tailwind CSS
- **Runtime**: CPython 3.11.9 (Windows x64), Node.js (v20+ recommended)
- **Package Management**: `pyproject.toml` / `requirements.txt` (Backend), `package.json` / `package-lock.json` (Frontend)
- **Entry Points**:
  - Backend: `backend/manage.py runserver`, `backend/config/wsgi.py`, `backend/config/asgi.py`
  - Frontend: `frontend/package.json` (`npm run dev` -> Next.js server on port 3000)

### B. ComplianceRag
- **Absolute Path**: `E:\complience\ComplianceRag`
- **Active Git Branch**: `main`
- **Current Commit**: `738dc83` (*"Initial commit - ComplyWise Indian Regulatory Intelligence RAG"* )
- **Remote Tracking**: `origin/main` -> `https://github.com/complywise/ComplianceRag.git`
- **Working Tree State**: Clean (0 tracked modifications). Untracked file: `__pycache__/test_encode.cpython-311-pytest-9.1.1.pyc`.
- **Repository Size**: ~28 MB (includes tracked `.pkl` files and knowledge base assets)
- **Non-Ignored Files**: 137 files
- **Primary Language**: Python 3.11+
- **Frameworks**: Sentence-Transformers, Rank-BM25, Google Generative AI (Gemini SDK), ChromaDB / FAISS (conceptual)
- **Runtime**: CPython 3.11.9 (Windows x64)
- **Package Management**: `requirements.txt` (pip)
- **Entry Points**:
  - CLI: `main.py` (`python main.py --query "..."`)
  - Internal Library: `complywise/pipeline.py` (`RegulatoryRAGPipeline`)

---

## 3. REPOSITORY MAPS

Both repositories were cataloged and categorized by architectural responsibility:

| Architectural Tier | ComplyWise Path | ComplianceRag Path | Responsibility & Status | Should Survive? |
|---|---|---|---|---|
| **CORE APPLICATION** | `backend/config/` | `complywise/` | Settings, WSGI/ASGI, URLs, service initialization. | YES (Refactor settings) |
| **DOMAIN** | `backend/domain/`, `backend/apps/` | `complywise/analysis/` | Intelligence orchestration, rule evaluation, business models. | YES (Consolidate) |
| **API** | `backend/apps/*/views.py`, `backend/apps/orchestration_views.py` | None | REST endpoints, request validation, serializers. | YES (Harden permissions) |
| **DATA** | `backend/apps/*/models.py`, `backend/fixtures/` | `cache/*.pkl` | Relational persistence, JSON profiles, pickle stores. | YES (Deprecate pickle) |
| **KNOWLEDGE** | `backend/knowledge_packs/` | `kb/` | YAML statutory rules, AST definitions, master legal JSON/MD. | YES (Consolidate into unified corpus) |
| **RAG** | `backend/domain/discovery/` (stubs) | `complywise/retrieval/`, `complywise/ingestion/` | Chunking, BM25 indexing, vector embeddings, hybrid search. | YES (Extract to private service) |
| **AI / LLM** | `backend/domain/providers/`, `backend/domain/intelligence/` | `complywise/analysis/gemini_analyzer.py` | LLM client wrappers, prompt templates, structured output handlers. | YES (Restrict to explanation & extraction) |
| **INFRASTRUCTURE** | `backend/domain/acquisition/crawlee_provider.py` | `complywise/utils/` | Web crawlers, HTTP client abstractions, text parsers. | YES (Harden against SSRF) |
| **TESTING** | `backend/tests/` | `test_encode.py` | Unit, regression, isolation, and pipeline test suites. | YES (Expand RAG coverage) |
| **FRONTEND** | `frontend/app/`, `frontend/components/`, `frontend/context/` | None | Next.js SPA, compliance dashboards, wizards, authentication context. | YES (Eliminate mock failovers) |
| **WORKERS** | None (Synchronous) | None (Synchronous) | Background task queues. | TARGET COMPONENT (Phase 2) |
| **CONFIGURATION** | `backend/pyproject.toml`, `.env.example` | `requirements.txt` | Dependency manifests, runtime environment configuration. | YES |
| **DOCUMENTATION** | `docs/`, `README.md` | `README.md` | Architectural specs, audit notes, handoff transcripts. | YES (Keep as historical reference) |
| **CACHE** | None (in-memory Django cache) | `cache/` | In-memory Django cache, serialized `.pkl` indices. | NO (Eliminate tracked `.pkl`) |
| **LEGACY** | `backend/apps/schemes/`, `backend/apps/standards/` | None | Pre-orchestration data models with unvalidated status fields. | REVISE (Align with CIR) |

---

## 4. CURRENT SYSTEM ARCHITECTURE

The current deployment exhibits severe fragmentation. The diagram below illustrates the actual runtime components and the missing linkages:

```
[ FRONTEND: Next.js 15 (Port 3000) ]
        |
        |  HTTP REST (Fetch / Axios)
        v
[ API LAYER: Django REST Framework (Port 8000) ]
  ├── apps/accounts/views.py          (AllowAny tenancy leaks)
  ├── apps/businesses/views.py        (AllowAny / resolve_safely leaks)
  ├── apps/assistant/views.py         (.first() fallback leaks)
  ├── apps/orchestration_views.py     (Orchestration pipeline triggers)
  └── apps/workflows/views.py         (AdminOverview -> ignores Engine 2)
        |
        v
[ ORCHESTRATION PIPELINE: domain/intelligence/orchestration.py ]
  ├── Step 1: Business Understanding (LLM facts extraction)
  ├── Step 2: Questionnaire Engine   (Hardcoded 15-question gate)
  ├── Step 3: Regulatory Discovery   (Stubs / empty candidate lists)
  ├── Step 4: Applicability Engine   (Engine 2 - AST Kleene Evaluation)
  └── Step 5: Compliance Synthesis   (LLM explanation / fallback)
        |
        +---> [ PostgreSQL / SQLite Persistence ]
        |       ├── Business & BusinessProfileVersion (JSON variables)
        |       ├── Assessment & AssessmentRun
        |       └── DecisionRun & DecisionResult (JSON evidence_refs)
        |
        x  [ ZERO INTEGRATION / AIR-GAPPED ]
        |
        v
[ COMPLIANCE RAG: Standalone CLI / Library (Unconnected) ]
  ├── Ingestion: Reads ONLY kb/master_kb.json (ignores central_laws/*.md)
  ├── Storage: Tracked binary pickle caches (cache/bm25_index.pkl)
  ├── Retrieval: BM25 + all-MiniLM-L6-v2 + Reciprocal Rank Fusion (RRF)
  └── Analysis: Gemini 1.5 Flash prompted to decide APPLICABLE / NOT_APPLICABLE
```

---

## 5. ACTUAL RUNTIME FLOW

Tracing a full user lifecycle from profile submission to compliance rendering:

1. **User Request**: User fills the onboarding form in `frontend/app/onboarding/page.tsx` and submits product description, location, and entity type.
2. **API Ingestion**: `POST /api/v1/onboarding/profile` hits `apps/onboarding/views.py:OnboardingProfileView.post()`.
3. **Authentication & Tenancy**: Handled via `JWTAuthentication`. However, if the token is missing, the endpoint falls back to `Business.resolve_safely()` which allows anonymous access.
4. **Business & Assessment Resolution**: Resolves `Business` and increments `Assessment.assessment_number` via `apps/businesses/models.py`.
5. **Orchestration Execution**: Calls `domain/intelligence/orchestration.py:AssessmentOrchestrationPipeline.run()`.
6. **Business Understanding**: Invokes `domain/intelligence/business_understanding.py`. Gemini / Claude extracts structured metadata from free text.
7. **Adaptive Question Generation**: Calls `domain/intelligence/questionnaire.py:QuestionnaireEngine.generate_questionnaire()`. If the LLM generates anything other than exactly 15 questions, line 1470 discards the result and returns `generate_emergency_15_questions()`.
8. **User Answers Questions**: User submits answers via `FifteenQuestionsWizard.tsx` (`POST /api/v1/onboarding/answers`). Answers are merged into `BusinessProfileVersion.variables`.
9. **Regulatory Discovery**: `RegulatoryDiscoveryStage.run()` executes. Because ComplianceRag is not integrated, this stage queries local YAML `KnowledgePack` files or returns an empty list.
10. **Engine 2 Applicability Evaluation**: `ApplicabilityEngine.evaluate_business_profile()` evaluates compiled AST rules against profile variables using 3-valued Kleene logic (`TRUE`, `FALSE`, `UNKNOWN`).
11. **Persistence of Decisions**: Creates `DecisionRun` and child `DecisionResult` records. `Assessment.decision_run` FK is updated. `evidence_refs` are saved as raw JSON blobs.
12. **Frontend Consumption**:
    - The client calls `GET /api/v1/compliance/` or `GET /api/v1/assessments/<id>/compliance/`.
    - `apps/requirements/views.py` intercepts the response and applies regex filters (`is_pure_software`), stripping factory and pollution requirements regardless of Engine 2 determinations.
    - If the backend returns an error (401/404/500), `BusinessContext.tsx:68-75` catches the exception and renders the static 658-line "Acme Textiles" mock dataset.

---

## 6. BUSINESS UNDERSTANDING AUDIT

The business understanding pipeline converts unconstrained text into structured attributes.

```
raw_business_description  ──>  BusinessUnderstandingStage  ──>  BusinessUnderstandingResult  ──>  BusinessProfileVersion
```

### Forensic Variable Extraction Trace

| Variable | Extracted from Free Text? | Normalization Function | Storage Location | Provenance Tracked? | Reaches Engine 2? | What Happens if Unknown? |
|---|---|---|---|---|---|---|
| `business_type` | YES (LLM) | Uppercase string | `BusinessProfileVersion.variables` | YES (`origin`) | YES | Evaluates to `UNKNOWN` -> `NEEDS_INFORMATION` |
| `primary_activity` | YES (LLM) | String snippet | `BusinessProfileVersion.variables` | YES | PARTIAL | Ignored unless rule targets specific activity |
| `products` | YES (LLM) | String array | `BusinessProfileVersion.variables` | YES | NO | Stored in JSON; no AST rule evaluates array elements |
| `location / state` | NO (Structured form) | State code (`GJ`, `MH`) | `Business.state`, `variables['state']` | YES | YES | State rules evaluate `state == 'GJ'` |
| `connected_load` | **NO** | String / Int | `variables['connected_load']` | NO | YES | `Q01` is re-asked even if stated in text |
| `worker_count` | **NO** | Integer | `variables['total_worker_count']` | NO | YES | `Q02` is re-asked even if stated in text |
| `boiler_present` | **NO** | Boolean | `variables['has_boiler']` | NO | YES | `Q13` is re-asked even if stated in text |
| `effluent_discharge` | **NO** | Boolean / String | `variables['has_effluent']` | NO | YES | `Q10` is re-asked even if stated in text |
| `turnover` | **NO** | Decimal / String | `variables['annual_turnover']` | NO | YES | `Q05` is re-asked even if stated in text |
| `plant_investment` | **NO** | Decimal / String | `variables['plant_machinery_investment']` | NO | YES | `Q04` is re-asked even if stated in text |

**Verdict**: The LLM prompt in `business_understanding.py:43-78` instructs the model to extract operational facts, but the parser populates only high-level categorizations into `BusinessUnderstandingResult`. Quantitative and physical facts (load, headcount, boiler capacity, wastewater volume) are **never extracted from free text**. They are exclusively gathered via subsequent questionnaire forms.

---

## 7. CANONICAL FACT ANALYSIS

The platform lacks a unified business fact ontology, leading to namespace collisions:

| Business Concept | Canonical Name | Type | Primary Storage | Competing Aliases Found in Code | Collision Risk |
|---|---|---|---|---|---|
| Total Headcount | `total_worker_count` | Integer | `BusinessProfileVersion.variables` | `workers`, `employee_count`, `worker_count`, `staff_count` | **HIGH**: Serializers check `worker_count`, rules expect `total_worker_count`. |
| Power Demand | `connected_load_hp` | Float | `BusinessProfileVersion.variables` | `connected_load`, `power_load`, `sanctioned_load_kva` | **HIGH**: Unit ambiguity (HP vs. kVA) causes threshold evaluation errors. |
| Annual Revenue | `annual_turnover_inr` | Decimal | `BusinessProfileVersion.variables` | `annual_turnover`, `turnover`, `gross_turnover` | **MEDIUM**: Inconsistent currency denominations (Crores vs. raw INR). |
| Capital Investment | `plant_machinery_investment` | Decimal | `BusinessProfileVersion.variables` | `investment`, `capital_investment`, `plant_machinery_cost` | **HIGH**: Affects MSME statutory categorization (Micro/Small/Medium). |
| Boiler Status | `has_boiler` | Boolean | `BusinessProfileVersion.variables` | `operates_boiler`, `boiler_present`, `steam_generation` | **MEDIUM**: Boolean vs. capacity string (`"3 TPH"`). |
| Wastewater | `has_effluent_treatment` | Boolean | `BusinessProfileVersion.variables` | `has_effluent`, `etp_installed`, `effluent_discharge` | **HIGH**: Missing nuance between discharge volume and on-site treatment. |

---

## 8. ADAPTIVE QUESTIONING AUDIT

Adaptive questioning was intended to resolve missing variables required by candidate statutory rules (0–4 targeted questions). In reality, the system operates on a rigid 15-question static array.

### Mechanical Proof of Discard Logic
In [domain/intelligence/questionnaire.py:1469-1471](file:///E:/complience/ComplyWise/backend/domain/intelligence/questionnaire.py#L1469-L1471):
```python
# Enforce exactly 15 questions
if len(questions) != 15:
    questions = generate_emergency_15_questions(context, understanding)
```

### Empirical Probe Verification
1. **Probe 1 (Textile Mill)**: A business description containing 480 kVA load, 165 workers, a 3 TPH boiler, and an effluent plant was submitted. The questionnaire engine generated 15 generic questions, re-asking for the electrical load (`Q01`), employee headcount (`Q02`), dyeing wet processes (`Q10`), and industrial boilers (`Q13`).
2. **Probe 2 (LLM Dynamic Output Discard)**: A mock LLM generated 6 highly specific regulatory questions. Because `len(questions) == 6 != 15`, line 1470 triggered, discarded all 6 tailored questions, and substituted the 15 static emergency questions (`Q01` through `Q15`).

---

## 9. KNOWLEDGE ARCHITECTURE

Regulatory requirements and evaluation rules are stored across two incompatible paradigms:

```
[ KNOWLEDGE STORAGE ]
  ├── 1. Relational DB (apps/requirements/models.py)
  │     ├── RequirementDefinition (Code, Name, Category, Authority)
  │     └── RuleVersion (AST JSON, Parameters, Version Number, Status)
  └── 2. Static Knowledge Packs (backend/knowledge_packs/)
        ├── 5 Sectors: textiles, battery_energy_storage, food_beverages, leather_tanning, solar_pv
        └── Manifests: rules.yaml, pack.yaml
```

### The Ingestion Gap
Knowledge Packs are loaded into the database via `apps/requirements/management/commands/load_knowledge_packs.py`. However:
- Only 5 industrial sectors exist.
- Siting rules, state-specific pollution board notifications, and municipal zoning laws are partially hardcoded in Python fixtures rather than compiled through the AST pipeline.

---

## 10. RULE ENGINE ARCHITECTURE (ENGINE 2)

Engine 2 ([domain/evaluation/engine.py](file:///E:/complience/ComplyWise/backend/domain/evaluation/engine.py), [evaluator.py](file:///E:/complience/ComplyWise/backend/domain/evaluation/evaluator.py), [truth.py](file:///E:/complience/ComplyWise/backend/domain/evaluation/truth.py)) evaluates business profiles against statutory rule ASTs.

### AST Schema & Kleene Logic
The AST supports Boolean logic (`AND`, `OR`, `NOT`) and comparison operators (`==`, `!=`, `>`, `>=`, `<`, `<=`, `IN`, `CONTAINS`).
Evaluation strictly enforces 3-valued Kleene logic:
- `TRUE AND UNKNOWN` → `UNKNOWN`
- `FALSE AND UNKNOWN` → `FALSE`
- `TRUE OR UNKNOWN` → `TRUE`
- `FALSE OR UNKNOWN` → `UNKNOWN`
- `NOT UNKNOWN` → `UNKNOWN`

**Core Invariant Verification**:
- `UNKNOWN` is **NEVER** coerced to `False`, `NOT_APPLICABLE`, or `APPLICABLE` within the engine.
- A rule evaluating to `UNKNOWN` maps cleanly to `ApplicabilityStatus.NEEDS_INFORMATION`.

### View-Layer & Frontend Bypasses
While Engine 2 maintains strict logical integrity, its outputs are compromised downstream:
1. **Backend View Bypass** ([apps/requirements/views.py:183-205](file:///E:/complience/ComplyWise/backend/apps/requirements/views.py#L183-L205)): Regex matching on `is_pure_software` drops environmental and factory requirements from the response.
2. **Frontend Bypass** ([frontend/app/compliance/page.tsx:192-205](file:///E:/complience/ComplyWise/frontend/app/compliance/page.tsx#L192-L205)): Client-side code re-applies regex checks, filtering out valid compliance cases.

---

## 11. RAG ARCHITECTURE (COMPLIANCERAG)

The standalone ComplianceRag repository implements a document retrieval pipeline:

```
kb/master_kb.json  ──>  JSON Ingestion  ──>  Recursive Character Chunking  ──>  Sentence-Transformers Embedding
                                                                                       │
                                    ┌──────────────────────────────────────────────────┴─────────────────────┐
                                    v                                                                        v
                         BM25 Index (Rank-BM25)                                                  Dense Vector Index
                                    │                                                                        │
                                    └──────────────────────────────────┬─────────────────────────────────────┘
                                                                       v
                                                        Reciprocal Rank Fusion (RRF)
                                                                       v
                                                        Cross-Encoder Reranking
                                                                       v
                                                        Gemini 1.5 Flash Analyzer
```

### Ingestion & Indexing Pipeline
- **Ingestion**: [complywise/retrieval/indexer.py:114-142](file:///E:/complience/ComplianceRag/complywise/retrieval/indexer.py#L114-L142) reads `kb/master_kb.json`. It completely ignores all raw markdown files in `kb/central_laws/` and `kb/states/`.
- **Chunking**: Uses standard recursive character splitting (target chunk size: 512 tokens, 50-token overlap). Lacks awareness of statutory section structures (Articles, Chapters, Schedules).
- **Dense Embedding**: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions).
- **Lexical Index**: `rank_bm25.BM25Okapi`. Serialized to disk as `.pkl`.
- **Rank Fusion**: Reciprocal Rank Fusion (RRF) with constant $k=60$.
- **Reranker**: `cross-encoder/ms-marco-MiniLM-L-6-v2` (evaluates top 20 candidates).

---

## 12. RAG QUALITY ANALYSIS

| Quality Dimension | Current Implementation | Industrial Standard Requirement | Assessment |
|---|---|---|---|
| **Section Awareness** | Character-count splitting | Hierarchical statutory chunking (Act -> Chapter -> Section -> Clause) | **DEFICIENT**: Clauses are severed from definitions and penalties. |
| **Metadata Filtering** | Minimal (`category`, `source`) | Multi-axis filtering (`jurisdiction`, `effective_date`, `sector`, `authority`) | **DEFICIENT**: Cannot scope retrieval to specific states or dates. |
| **Jurisdiction Handling** | None (Global corpus search) | Hard pre-filtering by state (`GJ`, `MH`, `TS`) and central authority | **HIGH RISK**: State-specific rules contaminate other jurisdictions. |
| **Currentness Handling** | None | Temporal validity checking (`effective_from <= NOW <= effective_to`) | **HIGH RISK**: Repealed or superseded notifications are retrieved as current law. |
| **Identifier Boosting** | None | Regex boost for exact Section / Form numbers (e.g., "Section 25 Water Act", "Form 1") | **DEFICIENT**: Lexical matches on generic terms outrank specific statutory forms. |

---

## 13. RAG SECURITY ANALYSIS

### 1. Insecure Deserialization via `pickle.load` (CRITICAL)
- **Vulnerable Sites**:
  - `complywise/retrieval/indexer.py:240,242`
  - `complywise/retrieval/hybrid.py:63,65`
- **Tracked Files in Git**:
  - `cache/bm25_index.pkl`
  - `cache/metadata_store.pkl`
- **Risk**: Python's `pickle` module is notoriously vulnerable to arbitrary code execution. Anyone cloning the repository and running search executes serialized bytecode stored in git.

### 2. Server-Side Request Forgery (SSRF) in Crawler (HIGH)
- **Location**: `backend/domain/acquisition/crawlee_provider.py:154-199`
- **Risk**: The crawl coordinator accepts arbitrary URLs to fetch statutory notifications without blocking RFC 1918 private subnets or link-local cloud metadata services (`169.254.169.254`).

---

## 14. EVIDENCE ARCHITECTURE

To withstand legal and regulatory scrutiny, compliance determinations must provide an unbroken chain of custody:
```
DecisionResult  ──>  RuleVersion  ──>  EvidenceChunk  ──>  RegulatorySource  ──>  Official Gazette / Portal URL
```

### Forensic Reality: Relational Integrity Broken
In `apps/applicability/models.py:89`:
```python
class DecisionResult(models.Model):
    decision_run = models.ForeignKey(DecisionRun, on_delete=models.CASCADE, related_name="results")
    requirement_id = models.CharField(max_length=100)
    rule_version = models.ForeignKey(RuleVersion, on_delete=models.PROTECT)
    status = models.CharField(max_length=30)
    evidence_refs = models.JSONField(default=list)  # <-- UNSTRUCTURED JSON BLOB
```
- `rule_version` maintains a proper Foreign Key.
- `evidence_refs` is an unstructured JSON array of strings or dicts. There is no foreign key to an `Evidence` or `SourceDocument` entity.
- If an underlying regulatory document is updated or deleted, the evidence links become dangling references with no database-level cascade or protection.

---

## 15. TEMPORAL & CURRENTNESS ARCHITECTURE

Indian regulatory frameworks are dynamic, characterized by frequent amendments, circulars, and notifications.
- **Current State**: Neither ComplyWise nor ComplianceRag tracks `effective_from`, `effective_to`, `superseded_by`, or `amendment_number` on rules or chunks.
- **Risk**: A search for environmental consent requirements can retrieve an obsolete 2006 notification instead of the current 2024 revised categorization, leading to legally invalid compliance advice.

---

## 16. JURISDICTION ARCHITECTURE

Indian jurisprudence operates across four distinct regulatory tiers:
1. **Union / Central**: Central Pollution Control Board (CPCB), Ministry of Labour, DGFT, PESO, FSSAI.
2. **State**: State Pollution Control Boards (SPCBs / PCCs), State Factories Inspectorate (DISH), State Boiler Directorates.
3. **District / Municipal**: Municipal Corporations, District Magistrates (Land Use / Fire NOC).
4. **Special Industrial Enclaves**: MIDC, GIDC, RIICO, SEZs.

**Forensic Finding**: The current retrieval engine treats the entire knowledge corpus as a single flat namespace. When querying rules for a facility in Surat, Gujarat, the system can retrieve Maharashtra Pollution Control Board (MPCB) consent guidelines. Siting and jurisdiction filtering must occur as a **hard pre-filter** prior to hybrid retrieval.

---

## 17. LLM INVENTORY

Every LLM call site across both codebases was cataloged:

| Location | Provider & Model | Purpose | Input Prompt / Schema | Downstream Effect | Risk Classification |
|---|---|---|---|---|---|
| `ComplyWise/.../business_understanding.py:43` | Gemini 1.5 Pro / Flash | Fact extraction from description | Structured JSON schema | Populates profile variables | UNDERSTANDING (Low risk) |
| `ComplyWise/.../questionnaire.py:1430` | Gemini 1.5 Pro / Flash | Generate tailored questions | JSON list of questions | Discarded by line 1470 if count != 15 | GENERATION (Neutralized by bug) |
| `ComplyWise/.../synthesis.py:120` | Gemini 1.5 Pro / Flash | Summarize compliance obligations | Free-text / JSON summary | Explains compliance results | EXPLANATION (Acceptable) |
| `ComplyWise/.../orchestration_views.py:512` | In-memory cache of synthesis | Fallback compliance calculation | Reads synthesis output | **Assigns APPLICABLE status without Engine 2** | **CRITICAL VIOLATION** |
| `ComplianceRag/.../gemini_analyzer.py:56` | Gemini 1.5 Flash | Legal applicability determination | Prompt outputs `APPLICABLE` / `NOT_APPLICABLE` | Directly sets compliance status | **CRITICAL VIOLATION** |
| `ComplyWise/.../assistant/views.py:85` | Gemini 1.5 Flash | Interactive chatbot | System prompt + business context | Generates chat response | EXPLANATION (Acceptable) |

---

## 18. LLM AUTHORITY ANALYSIS

### The Core Violation
Under the target industrial architecture:
> **RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.**

Currently, two active code paths violate this principle:
1. **ComplianceRag Gemini Analyzer** (`gemini_analyzer.py:56-140`): The LLM is explicitly asked to be the judge:
   ```json
   {
     "status": "APPLICABLE | POTENTIALLY_APPLICABLE | NOT_APPLICABLE",
     "confidence": 0.95,
     "reasoning": "..."
   }
   ```
2. **Orchestration Views Synthesis Fallback** (`orchestration_views.py:474-679`): When Engine 2 `DecisionRun` is missing, Priority 2 logic reads LLM synthesis text, parses out obligations, and renders them to the user as confirmed statutory requirements.

---

## 19. COMPLYWISE ↔ COMPLIANCERAG INTEGRATION ANALYSIS

An exhaustive cross-repository scan was performed searching for imports, HTTP clients, URL endpoints, shared database configurations, and environment variables.

```powers
# Cross-repo grep executed across backend/
grep -rn "compliancerag" backend/
grep -rn "RegulatoryRAGPipeline" backend/
grep -rn "hybrid_retriever" backend/
grep -rn ":8001" backend/
```
**Result: 0 matches.**

### Conclusion
**NO VERIFIED RUNTIME INTEGRATION EXISTS.**
The two codebases are completely disconnected. ComplyWise relies entirely on static, hardcoded YAML files in `backend/knowledge_packs/`, while ComplianceRag sits as an isolated prototype script.

---

## 20. API ARCHITECTURE

Auditing core endpoints in `ComplyWise/backend/`:

| Method | Path | Auth Required? | Input Payload | Output Contract | Tenant Isolation Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register/` | No | Email, Password, Name | User DTO, JWT Tokens | N/A |
| `POST` | `/api/v1/onboarding/profile` | No (`AllowAny`) | Business details, description | Profile DTO, ID | **LEAKS**: Overwrites or attaches to resolved business |
| `POST` | `/api/v1/onboarding/answers` | No (`AllowAny`) | Question answers dictionary | Profile version update | **LEAKS**: Mutates arbitrary business profile |
| `POST` | `/api/v1/assessments/orchestrate` | No (`AllowAny`) | `business_id`, `strategy` | Orchestration status DTO | **LEAKS**: Runs assessment on arbitrary business |
| `GET` | `/api/v1/compliance/` | No (`AllowAny`) | Query params (`business_id`) | List of requirements & status | **COMPROMISED**: Regex bypasses applied in view |
| `POST` | `/api/v1/assistant/chat` | No (`AllowAny`) | `message`, optional `business_id` | Chat message response | **LEAKS**: Falls back to `Business.objects.first()` |
| `GET` | `/api/v1/admin/businesses/<id>` | No (`AllowAny`) | URL param `id` | Full profile, cases, variables | **LEAKS**: Complete unauthenticated data exposure |
| `PATCH`| `/api/v1/admin/deadlines/<id>` | No (`AllowAny`) | Title, date, status | Updated deadline record | **MUTATES**: Anonymous defacement possible |

---

## 21. DATABASE & DATA MODEL AUDIT

The relational schema displays major structural deficiencies:

```
[ TENANT DOMAIN ]
Business (id, name, owner_id)
   ├── 1:N ──> Assessment (id, assessment_number, status, decision_run_id [FK NULL])
   │              └── 1:1 ──> BusinessProfileVersion (version, variables [JSONField])
   └── 1:N ──> ComplianceCase (id, title, status, case_type)  <-- LEGACY PARALLEL ENTITY
                  └── 1:N ──> CaseDeadline (id, title, due_date)

[ RULE ENGINE DOMAIN ]
RequirementDefinition (id, code, name, category)
   └── 1:N ──> RuleVersion (id, ast [JSONField], version, status)
                  └── 1:N ──> DecisionResult (id, status, evidence_refs [JSONField])
                                 └── N:1 ──> DecisionRun (id, business_id, profile_version_id)
```

### Critical Flaws
1. **Parallel Competing Entities**: `ComplianceCase` and `DecisionResult` represent the exact same concept (statutory applicability). `AdminBusinessOverviewView` reads `ComplianceCase`, while `AssessmentOrchestrationView` writes `DecisionResult`.
2. **Nullable Assessment FK**: `Assessment.decision_run` is nullable. If an orchestration stage fails, the assessment points to `None`, causing downstream views to break or fall back to mock data.
3. **Unindexed JSON Storage**: Both `BusinessProfileVersion.variables` and `DecisionResult.evidence_refs` are unindexed `JSONField` columns, making cross-business analytical queries impossible without full table scans.

---

## 22. TENANT & SECURITY ANALYSIS

### The Multi-Tenant Vulnerability (SEC-01 / SEC-02)
In [apps/businesses/models.py:105-115](file:///E:/complience/ComplyWise/backend/apps/businesses/models.py#L105-L115):
```python
is_auth = user is not None and user.is_authenticated
is_staff = is_auth and getattr(user, "is_staff", False)

if is_auth and not is_staff:
    scoped = cls.objects.filter(memberships__user=user)
    obj = scoped.filter(pk=uuid_obj).first()
    if obj:
        return obj
    return None

# FALL THROUGH FOR ANONYMOUS CALLERS
return cls.objects.filter(pk=uuid_obj).first()  # <-- LINE 108: UNSCOPED LEAK
```

### Reproduction in Local SQLite Database
Using Django's test client against `E:\complience\_scratch\recon.sqlite3`:
1. Created two businesses: Tenant A (User A) and Tenant B (User B).
2. An anonymous client (`request.user = AnonymousUser()`) submitted `GET /api/v1/admin/businesses/<tenant_b_uuid>`.
3. **Server returned HTTP 200 OK with Tenant B's full operational profile, employee counts, power load, and owner email.**
4. An anonymous client submitted `POST /api/v1/assistant/chat` without a business ID.
5. **Server executed `Business.objects.filter(is_active=True).first()` and returned Tenant B's confidential compliance profile.**

---

## 23. FRONTEND AUTHORITY ANALYSIS

The frontend (`ComplyWise/frontend/`) violates the principle of being a pure projection:
1. **Mock Data Failover (FND-01)**: [frontend/context/BusinessContext.tsx:68-75](file:///E:/complience/ComplyWise/frontend/context/BusinessContext.tsx#L68-L75) imports `INITIAL_DATABASE_BUSINESSES` from `userProfileHomeData.ts`. On any network failure or 500 error, it silently populates the UI with "Acme Textiles", preventing developers and users from noticing that the API failed.
2. **Client-Side Regex Override**: [frontend/app/compliance/page.tsx:192-205](file:///E:/complience/ComplyWise/frontend/app/compliance/page.tsx#L192-L205) executes string checks on business names and descriptions to filter out requirements locally, overriding backend truth.
3. **Session Pollution (FND-02)**: Logging out via `AuthContext.tsx:166-178` clears `complywise_token` but preserves `complywise_active_business_id` in `localStorage`. A subsequent user logging in on the same browser inherits the previous tenant's active business selection.

---

## 24. ADMIN ARCHITECTURE

The administrative overview in `apps/workflows/views.py:AdminBusinessOverviewView`:
- Declares `permission_classes = [AllowAny]`, allowing unauthenticated public access.
- Reads `business.compliance_cases.all()`, completely bypassing Engine 2's `DecisionRun` and `DecisionResult`.
- Does not accept or filter by `assessment_id`, displaying an undifferentiated historical log of all cases ever created for the enterprise.
- Provides zero tools for inspecting rule ASTs, evaluation traces, or why an obligation was marked `APPLICABLE`.

---

## 25. CACHE & STATE ANALYSIS

1. **Pickle Cache in ComplianceRag**: Stores precomputed BM25 indices and docstore metadata in `.pkl` format. Tracked in git, posing an ongoing security hazard.
2. **Frontend `localStorage`**: Unversioned, cross-tenant cache of active business UUIDs.
3. **Orchestration Cache**: `AssessmentRun` caches intermediate step results in `assessment.step_state` (`JSONField`). If a stage is re-run with modified profile variables, stale step results can persist unless manually invalidated.

---

## 26. TESTING ARCHITECTURE

### ComplyWise Backend Test Suite
Executed within `E:\complience\_scratch\venv` pointing to temporary SQLite:
```powers
pytest E:\complience\ComplyWise\backend\tests\
```
- **Total Tests Collected**: 566
- **Passed**: 538
- **Failed**: 2
  - `tests/test_assessment_persistence.py::test_create_assessment_and_auto_increment`: Fails on SQLite due to difference in auto-increment sequence semantics.
  - `tests/test_business_isolation_regression.py::test_business_isolation_and_no_stale_data`: Line 156 failed (`assert 3 == 1`) because dashboard metrics aggregated stale test case records across isolation boundaries.
- **Errors**: 17 (Windows OS file locking / permission errors when cleaning up temporary mock directories in `test_knowledge_loader.py` and `test_health.py`).
- **Skipped**: 9 (PIL missing, live crawl smoke tests disabled).

### ComplianceRag Test Suite
```powers
pytest E:\complience\ComplianceRag\test_encode.py
```
- **Total Tests**: 1 test (19 lines of code). Asserts that `SentenceTransformer.encode("test")` returns an array. Zero tests exist for chunking, BM25, hybrid retrieval, or Gemini analysis.

---

## 27. CODE QUALITY & ARCHITECTURAL DEBT

Forensic inspection identified widespread structural debt:
1. **God Files**:
   - `domain/intelligence/orchestration.py`: 1,565 lines, mixing pipeline orchestration, state machine persistence, error translation, and LLM budget accounting.
   - `domain/intelligence/questionnaire.py`: 1,543 lines, mixing prompt engineering, schema validation, persistence, and hardcoded fallback generation.
2. **Business Logic in Views**:
   - `apps/requirements/views.py`: Evaluates regexes, filters requirements, and constructs response payloads directly in the view class.
   - `apps/workflows/views.py`: Aggregates deadlines and mutates case models in view handlers.
3. **Hardcoded Domain Strings**:
   - Specific requirement IDs (`REQ-PCB-CTE`, `REQ-FACTORY-LICENSE`, `REQ-BOILER-REG`) are hardcoded across `synthesis.py` and `verification.py`.

---

## 28. DEPENDENCY GRAPH

```
[ FRONTEND ]
    |  (Direct HTTP REST / Next.js API Routes)
    v
[ API CONTROLLERS: apps/*/views.py ]
    |  (Mixed Responsibility: auth, business logic, DB queries)
    v
[ ORCHESTRATION LAYER: domain/intelligence/orchestration.py ]
    |  (Tight coupling to Django ORM models)
    v
[ DOMAIN SERVICES: questionnaire.py, business_understanding.py, synthesis.py ]
    |  (Direct dependencies on third-party LLM providers)
    v
[ RULE ENGINE: domain/evaluation/engine.py ]
    |  (Clean AST evaluator, but bypassed by views)
    v
[ RELATIONAL DATABASE: PostgreSQL / SQLite ]
```
**Violation**: Downstream controllers in `apps/requirements/` and `apps/workflows/` reach around the domain orchestration layer to mutate database models directly, creating reverse and circular conceptual dependencies.

---

## 29. COMPETING SOURCES OF TRUTH

| Domain Concept | Current Primary Source | Competing Secondary Sources | Conflict Manifestation | Future Authoritative Source |
|---|---|---|---|---|
| **Compliance Applicability** | Engine 2 `DecisionResult` | 1. View regexes<br>2. Frontend regexes<br>3. `ComplianceCase`<br>4. Synthesis LLM cache | View displays `NOT_APPLICABLE` when Engine 2 determined `APPLICABLE`. | **Engine 2 `DecisionResult` ONLY** |
| **Business Profile Facts** | `BusinessProfileVersion.variables` | 1. `Business` model fields<br>2. `OnboardingProfile` draft<br>3. LLM Understanding Result | Headcount in `Business` model differs from `variables['total_worker_count']`. | **Canonical Profile Version** |
| **Statutory Deadlines** | `CaseDeadline` table | 1. Calendar module calculations<br>2. Knowledge Pack YAML defaults | Calendar displays dates not present in admin case records. | **Compliance Intelligence Record (CIR)** |
| **Regulatory Evidence** | Unindexed `evidence_refs` JSON | 1. ComplianceRag `master_kb.json`<br>2. KnowledgePack source URLs | Different statutory gazette citations for the same rule. | **Unified Evidence Chunk Store** |

---

## 30. DUPLICATED RESPONSIBILITIES

1. **Question Generation**: Implemented in `domain/intelligence/questionnaire.py` (Orchestration stage) and duplicated in `apps/onboarding/planner.py` (Legacy onboarding flow).
2. **Business Resolution**: Implemented in `Business.resolve_safely()` and reimplemented as `_resolve_business()` in `apps/workflows/views.py`.
3. **Requirement Definitions**: Stored in PostgreSQL `RequirementDefinition` table and duplicated as YAML files in `backend/knowledge_packs/`.

---

## 31. CRITICAL FINDINGS (P0)

### ARCH-SEC-001: Multi-Tenant Isolation Bypass in `Business.resolve_safely()`
- **Severity**: CRITICAL (P0)
- **Category**: Security / Multi-Tenancy
- **Status**: VERIFIED & REPRODUCED
- **Location**: [apps/businesses/models.py:105-115](file:///E:/complience/ComplyWise/backend/apps/businesses/models.py#L105-L115)
- **Evidence**:
  ```python
  if is_auth and not is_staff:
      # Scoped check
      ...
  return cls.objects.filter(pk=uuid_obj).first() # Unscoped fallback
  ```
- **Actual Behavior**: Anonymous callers bypass tenancy filters; any business UUID returns the full business record.
- **Expected Behavior**: Unauthenticated calls must raise `AuthenticationFailed` or return `None`.
- **Impact**: Total compromise of tenant confidentiality.
- **Recommended Direction**: Restrict resolution strictly to authenticated, authorized users. Eliminate public fallback.

### ARCH-SEC-002: Arbitrary Cross-Tenant Business State Leak via Assistant Fallback
- **Severity**: CRITICAL (P0)
- **Category**: Security / Multi-Tenancy
- **Status**: VERIFIED & REPRODUCED
- **Location**: [apps/assistant/views.py:75](file:///E:/complience/ComplyWise/backend/apps/assistant/views.py#L75)
- **Evidence**: Executed `test_anon_leak_simple.py`; returned `Victim B Corp` to unauthenticated caller when `business_id` was omitted.
- **Actual Behavior**: Executes `Business.objects.filter(is_active=True).first()`.
- **Expected Behavior**: Reject request with HTTP 401/403 if active business is not explicitly authorized.
- **Impact**: Any user can chat with the assistant and inspect the confidential compliance state of the oldest active tenant.
- **Recommended Direction**: Require explicit, authorized `business_id` on all assistant sessions.

### ARCH-SEC-003: Insecure Deserialization via Tracked Pickle Caches
- **Severity**: CRITICAL (P0)
- **Category**: Security / Supply Chain
- **Status**: VERIFIED
- **Location**: [ComplianceRag/complywise/retrieval/indexer.py:240,242](file:///E:/complience/ComplianceRag/complywise/retrieval/indexer.py#L240-L242), [hybrid.py:63,65](file:///E:/complience/ComplianceRag/complywise/retrieval/hybrid.py#L63-L65)
- **Evidence**: `git ls-files cache/` tracks `cache/bm25_index.pkl` and `cache/metadata_store.pkl`.
- **Actual Behavior**: Loads binary pickle files directly into Python process memory on startup.
- **Expected Behavior**: Use safe serialization formats (JSON, SafeTensors, SQLite).
- **Impact**: Arbitrary code execution vulnerability upon cloning and running the service.
- **Recommended Direction**: Deprecate `.pkl` files immediately; migrate index metadata to SQLite or SafeTensors.

### ARCH-ENG-001: View-Layer Regex Bypass of Deterministic Applicability Engine
- **Severity**: CRITICAL (P0)
- **Category**: Correctness / Architecture
- **Status**: VERIFIED
- **Location**: [apps/requirements/views.py:183-205](file:///E:/complience/ComplyWise/backend/apps/requirements/views.py#L183-L205), [frontend/app/compliance/page.tsx:192-205](file:///E:/complience/ComplyWise/frontend/app/compliance/page.tsx#L192-L205)
- **Evidence**: Code strips factory and environmental rules if `is_pure_software` matches business description.
- **Actual Behavior**: Hardcoded string patterns override Engine 2 evaluated AST truth.
- **Expected Behavior**: Applicability is decided strictly and exclusively by Engine 2 AST rules.
- **Impact**: Produces legally incorrect compliance determinations by suppressing mandatory statutory rules.
- **Recommended Direction**: Strip all regex filters from views and frontend; encode all conditions into compiled AST rules.

### ARCH-RAG-001: Generative LLM Deciding Legal Applicability
- **Severity**: CRITICAL (P0)
- **Category**: AI / Architecture
- **Status**: VERIFIED
- **Location**: [ComplianceRag/complywise/analysis/gemini_analyzer.py:56-140](file:///E:/complience/ComplianceRag/complywise/analysis/gemini_analyzer.py#L56-L140)
- **Evidence**: System prompt demands: `"status": "APPLICABLE | POTENTIALLY_APPLICABLE | NOT_APPLICABLE"`.
- **Actual Behavior**: Gemini chooses legal status directly based on retrieved text.
- **Expected Behavior**: RAG retrieves evidence chunks; deterministic rules evaluate applicability.
- **Impact**: Non-deterministic, unexplainable compliance determinations prone to hallucinations.
- **Recommended Direction**: Restrict RAG to evidence candidate retrieval; pass retrieved citations to Engine 2.

### ARCH-INT-001: Zero Runtime Integration Between Repositories
- **Severity**: CRITICAL (P0)
- **Category**: Integration / Architecture
- **Status**: VERIFIED
- **Location**: Cross-repo grep across `backend/` and `ComplianceRag/`.
- **Evidence**: 0 imports, 0 HTTP client calls, 0 shared message queues, 0 shared databases.
- **Actual Behavior**: ComplyWise runs on static YAML fixtures; ComplianceRag operates as an unconnected CLI.
- **Expected Behavior**: ComplyWise invokes ComplianceRag via a private, typed REST/gRPC service contract.
- **Impact**: The platform does not possess a functional retrieval-augmented compliance architecture.
- **Recommended Direction**: Design and implement private service interface (Phase 2).

---

## 32. HIGH FINDINGS (P1)

- **ARCH-SEC-004**: 50 view classes configure `permission_classes = [AllowAny]`, exposing administrative, financial, and compliance data to unauthenticated callers.
- **ARCH-SEC-005**: `domain/acquisition/crawlee_provider.py:154,199` lacks URL scheme and IP address validation, exposing the host to Server-Side Request Forgery (SSRF).
- **ARCH-CIR-001**: The foundational `ComplianceIntelligenceRecord` (CIR) claimed in handover documentation does not exist in any Python or TypeScript file.
- **ARCH-FND-001**: `frontend/context/BusinessContext.tsx:68-75` silently renders 658 lines of mock data ("Acme Textiles") whenever the API fails, creating a false impression of stability.
- **ARCH-FND-002**: `frontend/context/AuthContext.tsx:166-178` clears `complywise_token` on logout but preserves `complywise_active_business_id`, contaminating subsequent sessions.
- **ARCH-EVD-001**: `DecisionResult.evidence_refs` is an unindexed `JSONField(default=list)` rather than a relational foreign key, breaking legal audit trails.
- **ARCH-ONB-001**: `domain/intelligence/questionnaire.py:1470` discards all LLM-generated questionnaires whose count is not exactly 15, replacing them with a static fallback.
- **ARCH-ADM-001**: `AdminBusinessOverviewView` queries legacy `ComplianceCase` rows, completely ignoring Engine 2 `DecisionResult` and `assessment_id`.

---

## 33. MEDIUM FINDINGS (P2)

- **ARCH-TST-001**: ComplianceRag contains only 1 test file (19 lines), testing sentence embeddings with zero coverage for retrieval, ranking, or indexing.
- **ARCH-KBD-001**: `ComplianceRag/complywise/retrieval/indexer.py` reads only `master_kb.json`, completely ignoring the markdown corpus in `kb/central_laws/` and `kb/states/`.
- **ARCH-KBD-002**: Knowledge packs cover only 5 industrial sectors, leaving major categories (Pharma, Logistics, IT/SaaS) unsupported.
- **ARCH-ADM-002**: Admin portal lacks visual AST inspection and evaluation trace debugger, making it impossible for staff to audit compliance decisions.
- **ARCH-SEC-006**: `config/settings.py:24` falls back to an insecure hardcoded `SECRET_KEY` if `DJANGO_SECRET_KEY` is not set and `DEBUG=True`.
- **ARCH-DAT-001**: `tests/test_assessment_persistence.py` fails on SQLite due to difference in auto-increment sequence semantics.
- **ARCH-DAT-002**: `tests/test_business_isolation_regression.py` failed due to dashboard metrics aggregating stale test case records across isolation boundaries.
- **ARCH-ONT-001**: Conflicting representations of business variables (`worker_count` vs `total_worker_count`) across models, serializers, and rules.

---

## 34. LOW FINDINGS (P3)

- **ARCH-DOC-001**: Discrepancies between documentation files and actual code implementations regarding CIR and RAG capabilities.
- **ARCH-DEP-001**: Backend flat directory structure lacks `packages.find` in `pyproject.toml`, preventing standard `pip install -e backend/`.
- **ARCH-FND-003**: System PATH lacks `node` / `npm`, preventing local TypeScript type checking during backend audit sessions.
- **ARCH-PERM-001**: Windows OS file locking causes 17 test errors during temporary mock directory cleanup in `test_knowledge_loader.py`.

---

## 35. VERIFIED FACTS

1. `Business.resolve_safely()` returns tenant businesses to unauthenticated anonymous callers.
2. `apps/assistant/views.py:75` falls back to `Business.objects.filter(is_active=True).first()` when `business_id` is omitted.
3. ComplyWise and ComplianceRag have zero runtime communication, shared databases, or API integrations.
4. ComplianceRag serializes BM25 indices using `pickle.dump` and commits them to git.
5. Engine 2 evaluates AST rules using strict 3-valued Kleene logic without coercing `UNKNOWN` to `False`.
6. `apps/requirements/views.py:183-205` applies hardcoded regexes that override Engine 2 determinations.
7. `domain/intelligence/questionnaire.py:1470` discards LLM-generated questions if `len(questions) != 15`.
8. The ComplyWise backend test suite contains 566 tests, passing 538, failing 2, and raising 17 OS cleanup errors under local SQLite.
9. ComplianceRag contains exactly 1 test file with 19 lines of code.

---

## 36. INFERRED FACTS

1. **Intended Architecture**: It is inferred that the original engineering plan intended for ComplianceRag to run as a microservice on port 8001, queried via HTTP by `domain/discovery/crawlee_provider.py`.
2. **CIR Purpose**: It is inferred that CIR was designed to bridge the gap between static Engine 2 determinations and dynamic workflow tasks.
3. **Emergency Fallback Origin**: It is inferred that the 15-question gate was implemented as a hackathon safety guardrail to prevent the UI wizard from breaking when early LLM prompts returned variable question counts.

---

## 37. UNVERIFIED CLAIMS

1. **Claimed 98% Extraction Accuracy**: Handover documentation claims the Business Understanding pipeline extracts facts with 98% accuracy. **UNVERIFIED**: Quantitative facts are not extracted at all.
2. **Claimed ChromaDB Vector Store**: Documentation claims ComplianceRag uses ChromaDB for persistent vector storage. **UNVERIFIED**: Inspection reveals in-memory FAISS / NumPy arrays serialized to disk.

---

## 38. DOCUMENTATION / CODE CONTRADICTIONS

| Topic | Documentation Claim | Code Reality |
|---|---|---|
| **Compliance Intelligence Record** | Handover docs describe CIR as the central data contract for all compliance state. | **CIR does not exist anywhere in the code.** |
| **RAG Ingestion** | README states all central and state laws in `kb/` are fully indexed. | `indexer.py` only reads `kb/master_kb.json`, ignoring raw markdown files. |
| **Questionnaire Adaptability** | Docs claim 0–4 dynamic questions generated based on missing rule variables. | Questionnaire is hardcoded to 15 questions; non-15 outputs are discarded. |
| **Admin Overview** | Docs claim admin dashboard displays Engine 2 applicability results. | Admin view queries `ComplianceCase` and completely ignores Engine 2 `DecisionResult`. |

---

## 39. PROPOSED FUTURE MODULE BOUNDARIES

To transition ComplyWise into an industrial-grade platform, responsibilities are strictly divided into 18 decoupled modules:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Identity & Tenancy   │ Owns users, organizations, RBAC, tenant isolation │
│ 2. Canonical Profile    │ Owns immutable, versioned business facts          │
│ 3. Understanding        │ Owns LLM fact extraction from free text           │
│ 4. Adaptive Questioning │ Owns decision-directed question generation (0-4)  │
├─────────────────────────────────────────────────────────────────────────────┤
│                          CORE COMPLIANCE PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. Regulatory Knowledge │ Owns versioned AST rules and requirement schemas  │
│ 6. Evidence Store       │ Owns immutable, hash-verified statutory chunks    │
│ 7. Retrieval Service    │ Owns hybrid search, RRF, reranking (RAG)          │
│ 8. Applicability Engine │ Owns deterministic AST evaluation (Engine 2)      │
│ 9. CIR Module           │ Owns Compliance Intelligence Record aggregation   │
├─────────────────────────────────────────────────────────────────────────────┤
│                         DOWNSTREAM PROJECTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 10. Schemes             │ Owns government incentive matching                │
│ 11. Standards           │ Owns voluntary quality standards (ISO, BIS)       │
│ 12. Documents           │ Owns document upload, OCR, and verification       │
│ 13. Workflows           │ Owns state-machine tasks, filings, and actions    │
│ 14. Calendar            │ Owns statutory deadlines and iCal projections     │
│ 15. Explanation         │ Owns LLM generation of layperson legal rationale  │
├─────────────────────────────────────────────────────────────────────────────┤
│                        GOVERNANCE & OBSERVABILITY                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 16. Admin & Review      │ Owns manual overrides, AST inspection, audit logs │
│ 17. Observability       │ Owns structured telemetry, latency, token budgets │
│ 18. Evaluation          │ Owns golden dataset benchmarks and regression tests│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 40. PROPOSED DATA CONTRACTS

### Canonical Business Profile Schema (JSON / Pydantic)
```json
{
  "$schema": "https://complywise.in/schemas/canonical_profile_v1.json",
  "business_id": "baae1c93-5f1c-4000-9b58-c0e8097fe98b",
  "version": 2,
  "facts": {
    "jurisdiction": {
      "state_code": "GJ",
      "district": "Surat",
      "industrial_zone_type": "NOTIFIED_ESTATE"
    },
    "enterprise": {
      "entity_type": "PRIVATE_LIMITED",
      "plant_machinery_investment_inr": 85000000,
      "annual_turnover_inr": 140000000,
      "msme_category": "SMALL"
    },
    "operations": {
      "manufacturing_status": "PHYSICAL_MANUFACTURING",
      "sector": "TEXTILES",
      "sub_sector": "WEAVING_AND_DYEING",
      "total_worker_count": 165,
      "shift_count": 3,
      "connected_load_hp": 643.7
    },
    "environmental": {
      "operates_boiler": true,
      "boiler_capacity_tph": 3.0,
      "generates_trade_effluent": true,
      "effluent_discharge_kld": 150.0,
      "operates_etp": true
    }
  },
  "provenance": {
    "operations.connected_load_hp": {
      "source": "QUESTIONNAIRE_ANSWER",
      "question_id": "Q_LOAD_01",
      "timestamp": "2026-09-28T12:00:00Z"
    }
  }
}
```

---

## 41. PROPOSED RAG SERVICE BOUNDARY

ComplianceRag will be encapsulated as an independent private microservice exposing five typed RPC / REST methods:
1. `POST /v1/evidence/search`: Accepts structured business facts and query strings; returns ranked `EvidenceChunk` references.
2. `POST /v1/evidence/candidates`: Accepts canonical business profile; returns candidate statutory requirement IDs for Engine 2 evaluation.
3. `GET /v1/evidence/chunks/<id>`: Returns full text, gazette metadata, and official source URL for an evidence chunk.
4. `POST /v1/evidence/verify`: Verifies whether an evidence chunk remains active or has been superseded.
5. `GET /v1/health`: Returns index versions, embedding model status, and cache integrity.

**Explicit Prohibition**: The RAG service **MUST NOT** expose any endpoint that returns legal applicability verdicts (`APPLICABLE`, `NOT_APPLICABLE`).

---

## 42. PROPOSED EVIDENCE CONTRACT

```json
{
  "evidence_id": "EVD-GPCB-WATER-2024-V1",
  "source_document": {
    "title": "Gujarat Water (Prevention and Control of Pollution) Rules",
    "authority": "GPCB",
    "official_url": "https://gpcb.gujarat.gov.in/rules/water_act_consent_rules.pdf",
    "gazette_notification_number": "GPCB/CTE/2024/09",
    "effective_from": "2024-01-01",
    "effective_to": null,
    "supersedes": "EVD-GPCB-WATER-2018-V2"
  },
  "citation": {
    "chapter": "IV",
    "section": "25",
    "clause": "Sub-rule (1)(a)",
    "page_number": 42
  },
  "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "snippet": "Every industrial plant discharging trade effluent into a stream or well shall obtain prior Consent to Establish from the State Board..."
}
```

---

## 43. PROPOSED APPLICABILITY CONTRACT

```json
{
  "assessment_id": "9a1d48c8-3801-447a-9721-cfa59d6dbdb6",
  "requirement_id": "REQ-GPCB-CTE",
  "rule_version_id": "RULE-GPCB-CTE-2024-V1",
  "status": "APPLICABLE",
  "evaluation_timestamp": "2026-09-28T12:05:00Z",
  "trace": {
    "ast_node": "AND",
    "children": [
      {
        "variable": "jurisdiction.state_code",
        "operator": "==",
        "expected": "GJ",
        "actual": "GJ",
        "result": "TRUE"
      },
      {
        "variable": "environmental.generates_trade_effluent",
        "operator": "==",
        "expected": true,
        "actual": true,
        "result": "TRUE"
      }
    ],
    "outcome": "TRUE"
  },
  "evidence_references": ["EVD-GPCB-WATER-2024-V1"]
}
```

---

## 44. PROPOSED CIR CONTRACT

The **Compliance Intelligence Record (CIR)** represents the unified statutory truth for an assessment:

```json
{
  "cir_id": "CIR-2026-09-28-SURAT-TEXTILE-01",
  "business_id": "baae1c93-5f1c-4000-9b58-c0e8097fe98b",
  "assessment_id": "9a1d48c8-3801-447a-9721-cfa59d6dbdb6",
  "profile_version": 2,
  "created_at": "2026-09-28T12:05:01Z",
  "summary": {
    "total_rules_evaluated": 42,
    "applicable_count": 8,
    "not_applicable_count": 31,
    "needs_information_count": 3
  },
  "determinations": [
    {
      "requirement_id": "REQ-GPCB-CTE",
      "title": "Consent to Establish (Pollution Control)",
      "status": "APPLICABLE",
      "severity": "CRITICAL",
      "authority": "GPCB",
      "deadline_type": "PRIOR_TO_COMMENCEMENT",
      "evidence_id": "EVD-GPCB-WATER-2024-V1"
    }
  ],
  "downstream_projections": {
    "workflows_created": 8,
    "deadlines_scheduled": 8,
    "schemes_eligible": 2
  }
}
```

---

## 45. ARCHITECTURE PRINCIPLES EVALUATION

Evaluating the existing codebase against the 20 target architectural rules:

| Rule Number & Statement | Current Compliance Status | Forensic Reality & Evidence |
|---|---|---|
| **RULE 1**: Profile is versioned & immutable | **PARTIALLY COMPLIANT** | `BusinessProfileVersion` exists, but profile variables are mutated in place during onboarding. |
| **RULE 2**: Facts have provenance | **NON-COMPLIANT** | Facts in `variables` lack origin timestamps, sources, or confidence ratings. |
| **RULE 3**: Questions resolve decision unknowns | **NON-COMPLIANT** | Static 15 questions re-ask known facts; tailored questions are discarded. |
| **RULE 4**: RAG retrieves; rules decide | **NON-COMPLIANT** | ComplianceRag prompts Gemini to output `APPLICABLE` / `NOT_APPLICABLE`. |
| **RULE 5**: Rules determine applicability | **NON-COMPLIANT** | View regexes and frontend regexes override Engine 2 determinations. |
| **RULE 6**: UNKNOWN never becomes FALSE | **COMPLIANT (Engine only)** | Engine 2 maintains Kleene logic; downstream views, however, drop UNKNOWNs. |
| **RULE 7**: Every decision has an evaluation trace | **COMPLIANT** | `DecisionResult` records AST execution traces in `evaluation_trace` JSON. |
| **RULE 8**: Every legal claim has evidence | **NON-COMPLIANT** | `evidence_refs` contains raw unvalidated JSON; many rules cite no evidence. |
| **RULE 9**: Evidence items have provenance | **NON-COMPLIANT** | Chunks lack gazette notification numbers, timestamps, or content hashes. |
| **RULE 10**: Source has jurisdiction/temporal data | **NON-COMPLIANT** | Knowledge chunks lack `effective_from`, `effective_to`, and state codes. |
| **RULE 11**: Frontend is a projection, not authority | **NON-COMPLIANT** | Frontend re-filters rules via regexes and falls back to static mock data. |
| **RULE 12**: Admin sees same canonical truth | **NON-COMPLIANT** | Admin overview queries `ComplianceCase` and ignores `DecisionResult`. |
| **RULE 13**: No tenant can access another's data | **CRITICAL FAILURE** | `resolve_safely()` leaks businesses to anonymous callers. |
| **RULE 14**: No company-specific hardcoded logic | **COMPLIANT** | No specific private company names hardcoded in Engine 2. |
| **RULE 15**: No hidden fallback to arbitrary businesses | **CRITICAL FAILURE** | Assistant and workflows fall back to `Business.objects.first()`. |
| **RULE 16**: No LLM legal status overrides Engine 2 | **NON-COMPLIANT** | Synthesis fallback assigns `APPLICABLE` status when Engine 2 is absent. |
| **RULE 17**: No frontend regex overrides Engine 2 | **NON-COMPLIANT** | `compliance/page.tsx:192` suppresses rules via regex. |
| **RULE 18**: No RAG cache uses unsafe deserialization | **CRITICAL FAILURE** | `indexer.py` and `hybrid.py` load binary `.pkl` files directly. |
| **RULE 19**: Knowledge rules are versioned | **COMPLIANT** | `RuleVersion` maintains numerical version tracking. |
| **RULE 20**: Testable without live LLM calls | **COMPLIANT** | Mock providers exist in `domain/providers/registry.py`. |

---

## 46. MIGRATION RISKS

1. **Tenancy Lockout Risk**: Fixing `Business.resolve_safely()` will immediately break any frontend routes relying on unauthenticated fallback. All frontend API client calls must be audited to ensure valid JWT headers are attached.
2. **Mock Data Shock**: Removing `userProfileHomeData.ts` will expose legitimate backend errors previously masked by the "Acme Textiles" mock fallback.
3. **Data Model Migration Hazards**: Migrating from `ComplianceCase` to `DecisionResult` / `CIR` requires backfilling legacy records or establishing a deprecation boundary.

---

## 47. RECOMMENDED IMPLEMENTATION ORDER

```
PHASE 1: SECURITY, TENANCY & SANITIZATION (Immediate Priority)
  1. Patch Business.resolve_safely() to reject anonymous calls.
  2. Remove .first() fallbacks in assistant and workflow views.
  3. Strip AllowAny from production endpoints; enforce IsAuthenticated + ObjectPermissions.
  4. Delete tracked .pkl files in ComplianceRag; migrate index to SafeTensors/SQLite.
  5. Remove view-layer and frontend regex bypasses.
  6. Remove frontend mock failover in BusinessContext.tsx.

PHASE 2: CANONICAL PROFILE & ENGINE 2 CONSOLIDATION
  1. Implement canonical typed BusinessProfile schema.
  2. Enforce immutable BusinessProfileVersion generation.
  3. Wire Assessment.decision_run as mandatory Foreign Key.
  4. Formalize Compliance Intelligence Record (CIR) database models.
  5. Point Admin portal directly at CIR / DecisionResult.

PHASE 3: ADAPTIVE QUESTIONING & UNDERSTANDING
  1. Remove rigid if len(questions) != 15 discard gate.
  2. Implement fact-gap analyzer (missing variables required by candidate rules).
  3. Support 0-4 targeted adaptive question flow.
  4. Expand Business Understanding LLM extraction to numerical operational facts.

PHASE 4: RAG SERVICE EXTRACTION & INTEGRATION
  1. Refactor ComplianceRag into standalone private microservice.
  2. Implement section-aware hierarchical legal chunker.
  3. Add jurisdiction and temporal pre-filters.
  4. Build authenticated private HTTP client in ComplyWise.
  5. Connect RegulatoryDiscoveryStage to live RAG candidate endpoint.
```

---

## 48. EXPLICIT "DO NOT BUILD YET" LIST

To prevent architectural drift and over-engineering, the following items are strictly out of scope:
- **DO NOT BUILD**: A microservices mesh (Kubernetes, Istio) for internal Django apps.
- **DO NOT BUILD**: Kafka or distributed message streaming clusters.
- **DO NOT BUILD**: Multi-agent collaborative LLM debate loops.
- **DO NOT BUILD**: GraphRAG or complex knowledge graph neural databases.
- **DO NOT BUILD**: Browser automation or Playwright scraping agents for dynamic portals.
- **DO NOT BUILD**: Custom identity providers (OAuth2/SAML) prior to fixing multi-tenant RBAC.

---

## 49. OPEN QUESTIONS

1. **Authoritative Source for Gazette Notifications**: What is the canonical upstream feed for Indian state pollution board amendments (CPCB API, State Gazette PDFs, or manual curation)?
2. **Legacy `ComplianceCase` Retention**: Can existing `ComplianceCase` rows in production databases be archived, or must a two-way sync adapter be maintained during migration?
3. **Worker Queue Infrastructure**: Will Celery / Redis be provisioned for long-running orchestration stages, or will the platform adopt Django-Q / native background tasks?

---

## 50. FINAL ARCHITECTURE READINESS ASSESSMENT

| Architectural Dimension | Grade | Readiness State |
|---|---|---|
| **Security & Multi-Tenancy** | **F** | **CRITICAL RISKS**: Unauthenticated cross-tenant data leaks and unsafe pickle deserialization require immediate remediation before any public deployment. |
| **Deterministic Applicability** | **B+** | **SOUND CORE**: Engine 2 AST evaluator is mathematically rigorous and correctly implements Kleene logic. It is undermined solely by view-layer bypasses. |
| **RAG / Evidence Retrieval** | **D** | **DISCONNECTED**: Basic BM25 and vector search operate in isolation, lack jurisdiction/temporal metadata, and are air-gapped from ComplyWise. |
| **Data Integrity & Lineage** | **C-** | **FRAGMENTED**: Relational evidence chains collapse into JSON blobs; competing sources of truth generate UI inconsistencies. |
| **Frontend Reliability** | **D** | **DECEPTIVE**: Silent mock failovers and client-side regex overrides conceal operational status from users. |

### Conclusion
ComplyWise possesses a high-quality deterministic applicability engine (Engine 2), but its structural integrity is compromised by perimeter tenancy leaks, view-layer regex bypasses, and an unintegrated, insecure RAG prototype. Implementation must proceed in strict alignment with the Phased Remediation Plan.

**END OF REPORT — PHASE 0 COMPLETE**
