# 00 — EXECUTIVE SUMMARY
## COMPLYWISE + RAG MASTER FORENSIC PLATFORM AUDIT

**Date:** 2026-09-28  
**Audit Scope:** Full platform forensic architecture, implementation, and boundary inspection across BOTH repositories:  
1. **ComplyWise Repository:** `E:\complience\ComplyWise` (Branch: `feat/api-orchestration`, Commit: `6b73ced16cb6eeaf4fb3862796b0ab973a55c080`)  
2. **ComplianceRag Repository:** `E:\complience\ComplianceRag` (Branch: `main`, Commit: `738dc8354203ea73311077e1b3b9ee6e324d3fbb`)  
**Execution Mode:** Read-Only Audit — Zero Application Source Code Modified.

---

### 1. Executive Verdict

The ComplyWise platform and the separate ComplianceRag engine are currently **completely disconnected islands**. There is **zero integration code, zero API calls, and zero network configuration** linking ComplyWise to ComplianceRag. 

Furthermore, while both repositories contain significant engineering assets, both repositories exhibit **severe architectural deviations** from the core architectural mandate:

> **CORE ARCHITECTURAL MANDATE:**  
> **RAG RETRIEVES.**  
> **RULES DECIDE.**  
> **LLM EXPLAINS.**  
> *RAG must never become the legal applicability engine.*

#### Key Structural Reality:
1. **ComplianceRag is NOT a Service:** ComplianceRag is a standalone CLI script (`main.py`) with ChromaDB and BM25 local caches. It exposes no HTTP REST, gRPC, or queue interface.
2. **ComplianceRag Violates the Core Mandate:** In ComplianceRag (`complywise/analysis/gemini_analyzer.py`), the LLM (Gemini 2.5 Flash) is explicitly instructed to determine legal applicability (`applicable_compliances`, `potentially_applicable`, `not_applicable`). The LLM acts as the judge and jury rather than an explanatory retrieval aid.
3. **ComplyWise Duplicated Retrieval & Ingestion:** Because it cannot call ComplianceRag, ComplyWise built its own internal discovery module (`domain/intelligence/discovery.py`), query planner, ranking logic, and web acquisition layer (`domain/acquisition/crawlee_provider.py` using Crawlee Python).
4. **Engine 2 is Bypassed or Overridden by View Hacks:** While ComplyWise possesses a high-quality deterministic applicability engine (`ApplicabilityEngine` in `apps/applicability/engine.py` with Kleene 3-valued logic and AST evaluation), its static knowledge base only covers 5 sectors in 6 states. When evaluated on SaaS, logistics, or textiles, it has no static rules. In `AssessmentComplianceView`, if Engine 2 has no results, it falls back to LLM compliance synthesis. In `BusinessRequirementsView`, the view layer executes ad-hoc regex keyword filtering (`is_pure_software` vs `is_physical_mfg`) to drop mismatched regulations that the rule base erroneously triggered.
5. **Critical Tenant Isolation & Security Vulnerabilities:** Over 25 API endpoints across `documents`, `schemes`, `standards`, `calendar`, `workflows`, and `assistant` are configured with `permission_classes = [AllowAny]`. Combined with unscoped `.first()` queries and a fallback in `Business.resolve_safely()` that fetches arbitrary businesses for unauthenticated requesters, any caller can inspect and mutate another business's compliance cases, documents, and chat records. In the frontend, `localStorage` is not cleared on logout, causing cross-user data leakage.
6. **Adaptive Questions Invariant Broken:** ComplyWise has two competing question planners (`apps/onboarding/planner.py` targeting 12–20 questions and `domain/intelligence/questionnaire.py` targeting 5–6 questions). Neither engine allows 0, 1, 2, 3, or 4 questions when business facts are already known.

---

### 2. High-Level Metrics

| Metric | ComplyWise | ComplianceRag | Combined |
| :--- | :--- | :--- | :--- |
| **Repository Path** | `E:\complience\ComplyWise` | `E:\complience\ComplianceRag` | 2 Repositories |
| **Language & Stack** | Python 3.12+, Django 5, DRF, Next.js 15 | Python 3.13/3.14, Pydantic, ChromaDB, Google GenAI | Polyglot / Disconnected |
| **Database / Store** | PostgreSQL + pgvector, SQLite fallback | Chroma SQLite, Pickled BM25, Flat JSON | 2 Separate Storage Layers |
| **Automated Tests** | 46 Pytest test files, 5 Playwright suites, 2 Vitest files | 0 Automated Tests (1 smoke script) | Severe Asymmetry |
| **Live API Boundary** | Exposes ~45 REST endpoints | 0 Endpoints (CLI only) | **0% Connected** |
| **Citations / Provenance** | Model-level `Source` & `Evidence` (Engine 2) | Free-text `[KB-n]` & `[WEB-n]` in prompt | Broken at Boundary |
| **P0 Blocker Findings** | 6 | 3 | **9** |
| **P1 Architecture Findings** | 8 | 4 | **12** |
| **P2 Functional Findings** | 7 | 3 | **10** |
| **P3 Hardening Findings** | 5 | 2 | **7** |

---

### 3. Top 10 Platform Blockers

1. **[P0-CW-01] Zero Integration Boundary:** ComplyWise has zero client code or network configuration to call ComplianceRag. ComplianceRag has no server/API.
2. **[P0-RAG-01] LLM Acts as Legal Applicability Engine:** ComplianceRag's `GeminiAnalyzer` prompt directly decides legal applicability rather than performing pure retrieval and factual grounding.
3. **[P0-CW-02] Unauthenticated Cross-Tenant Business Resolution:** `Business.resolve_safely()` returns any business by UUID to unauthenticated callers when paired with `AllowAny` endpoints.
4. **[P0-CW-03] Cross-Tenant Exposure in AI Assistant & Workflows:** `apps/assistant/views.py` and `apps/workflows/views.py` use unscoped `.first()` fallbacks and `AllowAny` permissions, leaking active businesses across users.
5. **[P0-CW-04] Frontend Cross-Tenant Session Contamination:** `AuthContext.tsx` logout does not clear `complywise_active_business_id`, `complywise_active_assessment_id`, or `complywise_cached_businesses` from `localStorage`.
6. **[P0-CW-05] View-Layer Regex Censorship Bypassing Engine 2:** `apps/requirements/views.py` performs hardcoded regex matching on business names to suppress mismatched regulations (e.g. suppressing factory rules for SaaS) rather than using deterministic rule logic.
7. **[P0-CW-06] Non-Adaptive Question Intake:** Question planners enforce rigid question counts (5–6 or 12–20) and cannot evaluate 0–4 questions when profile facts are complete.
8. **[P0-RAG-02] Ingestion Ignores Markdown Knowledge Base:** ComplianceRag's `KBIndexer` only reads `master_kb.json` and completely ignores all structured markdown files in `kb/central_laws/`, `kb/states/`, and `kb/cross_reference/`.
9. **[P0-CW-07] Static Knowledge Base Coverage Vacuum:** Static rules only cover 5 sectors across 6 states; SaaS, cold-chain logistics, and textiles have zero static coverage, forcing fallback to ungrounded LLM synthesis.
10. **[P0-RAG-03] Total Lack of Automated Testing:** ComplianceRag has zero unit, integration, or regression tests, creating extreme risk of silent retrieval regressions.

---

### 4. Target Architecture Gap Summary

| Pipeline Stage | Target Architecture Requirement | Current State | Status |
| :--- | :--- | :--- | :--- |
| **1. Business Description** | Free-text onboarding intake | Captured in onboarding form | **IMPLEMENTED** |
| **2. Business Understanding** | Plain-text to structured facts | `BusinessUnderstandingEngine` extracts JSON | **PARTIAL** |
| **3. Canonical Facts** | Stored in immutable profile version | `BusinessProfileVersion.variables` with provenance | **IMPLEMENTED** |
| **4. Adaptive Questions** | 0 to N questions based on rule gaps | Rigid 5–6 or 12–20 questions; emergency fallback | **BROKEN** |
| **5. Immutable Profile Version** | New version created on material answer | Version incremented; variables stored | **IMPLEMENTED** |
| **6. Search Planning** | Structured query generation from gaps | Generated in `search_planning.py` & normalizer | **DUPLICATED** |
| **7. RAG Retrieval** | Hybrid BGE-M3 + BM25 + RRF | Implemented in ComplianceRag, but isolated | **ISOLATED** |
| **8. Official Acquisition** | Crawlee verified web acquisition | Implemented in ComplyWise; absent in RAG | **DUPLICATED** |
| **9. Verified Evidence** | SHA-256 hash, authority, effective dates | Rich in ComplyWise models; string-only in RAG | **PARTIAL** |
| **10. Engine 2 Applicability** | Deterministic AST evaluation (Rules Decide) | Engine 2 is sound, but bypassed by LLM fallback & view regex | **BROKEN / BYPASSED** |
| **11. DecisionRun / CIR** | Canonical source of truth | `DecisionRun` / `DecisionResult` exists; CIR model missing | **PARTIAL** |
| **12. Schemes & Standards** | Deterministic eligibility & statutory status | Implemented in `apps/schemes` & `apps/standards` | **PARTIAL** |
| **13. Workflows & Calendar** | Derived from applicable obligations | Implemented in `apps/workflows` & `apps/calendar` | **IMPLEMENTED** |
| **14. User Dashboard** | Reads strictly from Engine 2 / CIR | Reads DecisionResults, but falls back to mock data | **UNSAFE / PARTIAL** |
| **15. Admin Control Room** | Full inspection of AST trace & evidence | Admin view shows workflow cases, not AST traces | **BROKEN** |
