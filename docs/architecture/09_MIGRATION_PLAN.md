# 09. COMPLYWISE STRANGLER MIGRATION PLAN
## INCREMENTAL REFACTORING, LEGACY RETIREMENT & EXECUTION ROADMAP

- **Document ID**: `CW-MIG-2026-V1`
- **Precedence Level**: **LEVEL 9**
- **Status**: MANDATORY / ROADMAP
- **Effective Date**: September 28, 2026
- **Strategy**: Strangler Fig Pattern (No greenfield rewrite; continuous test-gated transitions)
- **Hard Rule**: Zero production feature implementation or code modification during Phase 1.

---

## 1. COMPONENT CLASSIFICATION MATRIX

Every legacy subsystem is classified into a strict operational disposition:

| Subsystem / Component | Disposition | Current State `[CURRENT]` | Target State `[TARGET]` | Transition Mechanism `[MIGRATION]` | Removal Condition |
|---|---|---|---|---|---|
| **Engine 2 AST Evaluator** | **KEEP** | Mathematically sound; implements 3-valued Kleene logic | Sole statutory applicability authority | Preserve engine; remove view-layer bypasses | N/A (Core Component) |
| **Gemini Integration** | **ADAPT** | Mixed authority; LLM output used for compliance status | Intelligence-only: fact extraction, question phrasing, layperson explanations | Refactor prompt templates; strip legal status prompts | Immediate removal of legal decision prompts |
| **ComplianceRag Retrieval** | **ADAPT & MIGRATE** | Standalone script; reads `master_kb.json`; binary pickle cache | Private microservice; hierarchical chunking; SQLite/SafeTensors storage | Wrap in FastAPI service; replace pickle serialization | Deprecate CLI entry point |
| **Pickle Caches (`*.pkl`)** | **DELETE & MIGRATE** | Binary pickle files tracked in git (`cache/*.pkl`) | SQLite FTS5 / SafeTensors index store | Write migration script to export BM25 to SQLite; `git rm` pickles | Immediate deletion upon SQLite index generation |
| **Hardcoded 15 Questions** | **DELETE** | `questionnaire.py:1470` discards non-15 question sets | Dynamic 0–4 question generation based on AST unknown variables | Remove `if len(questions) != 15` gate; wire gap analyzer | Phase 4 test verification |
| **Frontend Mock Fallback** | **DELETE** | `BusinessContext.tsx` falls back to 658-line "Acme Textiles" mock | Explicit error cards with retry buttons and diagnostic correlation IDs | Delete `userProfileHomeData.ts`; update error boundaries | Phase 2 frontend hardening |
| **View-Layer Regex Filters** | **DELETE** | `requirements/views.py` & `compliance/page.tsx` regex bypasses | Applicability evaluated exclusively by Engine 2 AST rules | Delete `is_pure_software` / `is_physical_mfg` regex functions | Verification of golden profile test cases |
| **`ComplianceCase` Model** | **DEPRECATE & MIGRATE**| Competing legacy case entity queried by admin overview | Unified Compliance Intelligence Record (CIR) + `DecisionResult` | Create read-adapter redirecting case queries to CIR; archive table | Phase 7 CIR consolidation |
| **Admin Overview View** | **ADAPT** | Queries `compliance_cases`; ignores Engine 2; `AllowAny` | Queries `CIR` and `DecisionRun`; full AST trace inspection; `IsAdminUser` | Rewrite view handler to read `DecisionResult` for active assessment | Phase 2 permission hardening |
| **Tenant Resolver** | **ADAPT** | `Business.resolve_safely()` leaks to anonymous callers | `Business.resolve_authorized()` strictly enforcing principal membership | Replace implementation; enforce `IsAuthenticated` across views | Phase 2 security release |
| **`evidence_refs` JSON** | **MIGRATE** | Unstructured `JSONField(default=list)` on `DecisionResult` | Typed many-to-many relationship to `EvidenceChunk` | Backfill relational junction table from JSON arrays | Phase 7 database migration |
| **Legacy Knowledge Packs** | **MIGRATE** | Static YAML packs covering only 5 industrial sectors | Unified gazette-backed AST rule repository | Ingest and validate packs into relational `RuleVersion` store | Phase 7 knowledge migration |

---

## 2. 10-PHASE DEPENDENCY-AWARE ROADMAP

```
Phase 0 [DONE]    : Forensic Architecture Reconnaissance
      │
      ▼
Phase 1 [ACTIVE]  : Engineering Constitution, Contracts & Governance Specification
      │
      ▼
Phase 2           : Perimeter Security, Multi-Tenant Isolation & Sanitization
      │
      ▼
Phase 3           : Canonical Business Profile & Structured Fact Extraction
      │
      ▼
Phase 4           : Adaptive Questioning Engine (0-4 Decision-Directed Flow)
      │
      ▼
Phase 5           : ComplianceRag Industrialization (Pickle Purge & Legal Chunking)
      │
      ▼
Phase 6           : Typed ComplyWise ↔ ComplianceRag Private Service Integration
      │
      ▼
Phase 7           : Engine 2 Authority Consolidation & CIR Database Models
      │
      ▼
Phase 8           : Operational Projections (Workflows, Calendar, Schemes, Standards)
      │
      ▼
Phase 9           : Frontend & Admin Scrutiny Portal Refinement
      │
      ▼
Phase 10          : Golden Profile Benchmarking, Retrieval Evaluation & Security Audit
```

---

## 3. DETAILED PHASE SPECIFICATIONS & TEST GATES

### PHASE 0: FORENSIC RECONNAISSANCE [COMPLETED]
- **Deliverables**: `docs/architecture/PHASE_0_INDUSTRIAL_ARCHITECTURE_RECON.md`.
- **Exit Criteria**: All repos fingerprinted, 18 master findings verified, read-only policy maintained.

### PHASE 1: ENGINEERING CONSTITUTION & TARGET ARCHITECTURE [CURRENT]
- **Deliverables**: Consolidated numbered architecture documents (`00` through `10`) in `docs/architecture/`.
- **Exit Criteria**: Explicit contracts established; zero production code changes.

### PHASE 2: SECURITY, TENANT ISOLATION & SANITIZATION
- **Prerequisites**: Phase 1 approval.
- **Scope**:
  1. Patch `Business.resolve_safely()` -> Replace with `resolve_authorized()`.
  2. Remove `.first()` fallbacks in `apps/assistant/views.py` and `apps/workflows/views.py`.
  3. Strip `AllowAny` across 50 production view classes; enforce `IsAuthenticated` + object-level permissions.
  4. Purge `frontend/data/userProfileHomeData.ts` and remove silent mock failovers.
  5. Fix frontend logout to clear `localStorage` active business caches.
- **Test Gate**: Automated multi-tenant exploitation tests (`_scratch/prove_leak.py`) must fail to leak data and return HTTP 401/403/404.

### PHASE 3: CANONICAL BUSINESS PROFILE & FACT EXTRACTION
- **Prerequisites**: Phase 2 security baseline.
- **Scope**:
  1. Implement typed Pydantic `CanonicalFact` and `BusinessProfileVersion` schemas.
  2. Update `business_understanding.py` prompt to extract numerical facts (load, workers, boiler, effluent).
  3. Wire unit normalizers (kVA -> HP, sq meters -> sq ft, Lakhs/Crores -> INR).
  4. Enforce immutable profile versioning on answer submission.
- **Test Gate**: Textile test description extracts 480 kVA, 165 workers, and 3 TPH boiler into verified canonical facts.

### PHASE 4: ADAPTIVE QUESTIONING (0–4 FLOW)
- **Prerequisites**: Phase 3 canonical profile.
- **Scope**:
  1. Remove `if len(questions) != 15` discard check in `questionnaire.py:1470`.
  2. Implement gap analyzer that inspects candidate rule ASTs against known profile variables.
  3. Support dynamic 0–4 question generation targeting missing variables only.
- **Test Gate**: Probe 2 test case with 6 questions persists and renders without falling back to Q01–Q15. Fully specified profile triggers 0 questions.

### PHASE 5: COMPLIANCERAG INDUSTRIALIZATION
- **Prerequisites**: Independent Python service setup.
- **Scope**:
  1. Purge `cache/bm25_index.pkl` and `cache/metadata_store.pkl` from git.
  2. Implement SQLite FTS5 / SafeTensors BM25 index storage.
  3. Implement hierarchical statutory chunker (Act -> Chapter -> Section -> Clause).
  4. Strip legal status prompts (`APPLICABLE` / `NOT_APPLICABLE`) from `gemini_analyzer.py`.
- **Test Gate**: Retrieval tests pass without invoking `pickle.load`.

### PHASE 6: TYPED RAG ↔ COMPLYWISE INTEGRATION
- **Prerequisites**: Phase 5 RAG service.
- **Scope**:
  1. Stand up ComplianceRag private HTTP service.
  2. Build authenticated `RetrievalProvider` client in ComplyWise (`X-ComplyWise-Signature`).
  3. Wire `RegulatoryDiscoveryStage` to query `/v1/retrieval/candidates`.
- **Test Gate**: ComplyWise dynamically discovers candidate rules from ComplianceRag across private network.

### PHASE 7: ENGINE 2 CONSOLIDATION & CIR MODELS
- **Prerequisites**: Phase 6 candidate integration.
- **Scope**:
  1. Implement `ComplianceIntelligenceRecord` (CIR) database models.
  2. Enforce `Assessment.decision_run` as mandatory Foreign Key.
  3. Delete view-layer regex bypasses in `requirements/views.py` and `compliance/page.tsx`.
  4. Direct admin overview to read `CIR` and `DecisionResult`.
- **Test Gate**: All statutory obligations are derived strictly from Engine 2 AST evaluation.

### PHASE 8: OPERATIONAL PROJECTIONS
- **Prerequisites**: Phase 7 CIR models.
- **Scope**:
  1. Derive workflow action items directly from CIR `APPLICABLE` determinations.
  2. Calculate statutory deadlines from versioned `DeadlineRule` entities.
  3. Evaluate MSME schemes and voluntary standards from canonical profile facts.
- **Test Gate**: Calendar feeds and workflow tasks update deterministically when profile changes.

### PHASE 9: FRONTEND & ADMIN SCRUTINY PORTAL
- **Prerequisites**: Phase 8 projections.
- **Scope**:
  1. Update Next.js client to consume `/api/v2/assessments/{id}/compliance/` (CIR projection).
  2. Implement visual AST evaluation trace debugger in Admin portal.
  3. Add official gazette URL links and exact legal clause drawer to UI.
- **Test Gate**: End users can click and inspect exact gazette PDF sources for every applicable requirement.

### PHASE 10: GOLDEN PROFILES & EVALUATION BENCHMARKS
- **Prerequisites**: All preceding phases.
- **Scope**:
  1. Execute regression test suites across Golden Profiles (Textile, Pharma, SaaS, Logistics, Food).
  2. Benchmark retrieval metrics ($Recall@20 \ge 0.90$, $nDCG@10 \ge 0.85$).
  3. Execute automated penetration test verifying multi-tenant isolation.
- **Test Gate**: 100% pass rate on golden profiles; zero tenancy leaks; zero unverified legal decisions.
