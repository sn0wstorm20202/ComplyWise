# 10. COMPLYWISE PHASE 1 VALIDATION REPORT
## ARCHITECTURAL CONSOLIDATION VERIFICATION & PHASE 2 ENTRY AUDIT

- **Document ID**: `CW-VAL-2026-V1`
- **Precedence Level**: **LEVEL 10**
- **Status**: APPROVED
- **Date**: September 28, 2026
- **Auditor**: Principal Software Architect & Core Architecture Team
- **Target Repositories**:
  - `ComplyWise` (`E:\complience\ComplyWise`, branch `feat/api-orchestration` @ `6b73ced`)
  - `ComplianceRag` (`E:\complience\ComplianceRag`, branch `main` @ `738dc83`)
- **Execution State**: Strictly Read-Only (Zero production code modifications; zero migrations)

---

## A. REPOSITORY VERIFICATION SUMMARY

Both repositories were subjected to independent static analysis, git history examination, and runtime inspection in an isolated scratch environment (`E:\complience\_scratch`):
- **Total Non-Ignored Files Inspected**: 769 files (632 in ComplyWise, 137 in ComplianceRag).
- **Working Tree Integrity**: Completely clean in both repositories. Zero tracked modifications.
- **Test Suite Baseline**:
  - ComplyWise Backend: 566 tests collected; 538 passed, 2 failed on SQLite semantics, 9 skipped, 17 Windows OS file locking cleanup errors.
  - ComplianceRag: 1 test file (19 lines), passing sentence-transformer vector encoding only.

---

## B. PHASE 0 CLAIM VERIFICATION TABLE

Every major architectural claim from the Phase 0 reconnaissance was independently re-evaluated against the codebase:

| Claim ID | Category | Claim Statement | Code Verification Status | Exact File:Line Evidence |
|---|---|---|---|---|
| **C-SEC-01** | Security | Anonymous callers bypass tenancy in `Business.resolve_safely()` | **VERIFIED** | `apps/businesses/models.py:105-115` (Unscoped fallback at line 108) |
| **C-SEC-02** | Security | Assistant chat falls back to `Business.objects.first()` | **VERIFIED** | `apps/assistant/views.py:75` |
| **C-SEC-03** | Security | ComplianceRag loads tracked binary pickle caches | **VERIFIED** | `ComplianceRag/complywise/retrieval/indexer.py:240,242`, `hybrid.py:63,65` |
| **C-ENG-01** | Authority | View-layer regexes bypass Engine 2 applicability logic | **VERIFIED** | `apps/requirements/views.py:183-205`, `frontend/app/compliance/page.tsx:192-205` |
| **C-RAG-01** | Authority | ComplianceRag prompts Gemini to decide statutory status | **VERIFIED** | `ComplianceRag/complywise/analysis/gemini_analyzer.py:56-140` |
| **C-INT-01** | Integration | ComplyWise and ComplianceRag have zero runtime integration | **VERIFIED** | Cross-repo grep across `backend/`: 0 imports, 0 HTTP endpoints, 0 shared DB |
| **C-ONB-01** | Product | `questionnaire.py:1470` discards non-15 question outputs | **VERIFIED** | `domain/intelligence/questionnaire.py:1469-1471` (`if len(questions) != 15:`) |
| **C-CIR-01** | Architecture | Compliance Intelligence Record (CIR) does not exist in code | **VERIFIED** | Repository-wide grep: 0 class definitions across Python and TypeScript |
| **C-FND-01** | Frontend | Frontend silently falls back to 658 lines of mock data | **VERIFIED** | `frontend/data/userProfileHomeData.ts`, `BusinessContext.tsx:68-75` |
| **C-FND-02** | Frontend | Logout leaves active business ID cached in `localStorage` | **VERIFIED** | `frontend/context/AuthContext.tsx:166-178` |
| **C-EVD-01** | Data | `DecisionResult.evidence_refs` is an unindexed JSONField | **VERIFIED** | `apps/applicability/models.py:89` (`models.JSONField(default=list)`) |
| **C-ENG-02** | Logic | Engine 2 preserves Kleene 3-valued logic internally | **VERIFIED** | `domain/evaluation/evaluator.py`, `truth.py` (UNKNOWN never coerced to False) |

---

## C. CONFIRMED P0 / P1 FINDINGS

1. **ARCH-SEC-001 (P0)**: Multi-tenant isolation bypass in `Business.resolve_safely()` for unauthenticated callers.
2. **ARCH-SEC-002 (P0)**: Arbitrary business state leakage via `Business.objects.filter(is_active=True).first()` in assistant and workflow views.
3. **ARCH-SEC-003 (P0)**: Insecure deserialization of tracked git artifacts (`cache/*.pkl`) in ComplianceRag.
4. **ARCH-ENG-001 (P0)**: View-layer regex bypass (`is_pure_software`) overriding Engine 2 deterministic applicability.
5. **ARCH-RAG-001 (P0)**: ComplianceRag prompts Gemini directly to declare legal applicability (`APPLICABLE` / `NOT_APPLICABLE`).
6. **ARCH-INT-001 (P0)**: Complete architectural decoupling (zero runtime integration) between ComplyWise and ComplianceRag.
7. **ARCH-SEC-004 (P1)**: Pervasive `AllowAny` permission classes across 50 production view classes.
8. **ARCH-SEC-005 (P1)**: SSRF vulnerability in `crawlee_provider.py` lacking IP/domain restrictions.
9. **ARCH-CIR-001 (P1)**: Complete absence of the foundational `ComplianceIntelligenceRecord` (CIR) domain entity.
10. **ARCH-ONB-001 (P1)**: Rigid 15-question hard boundary silently discarding tailored LLM questionnaires.
11. **ARCH-FND-001 (P1)**: Stealth fallback to 658-line static mock dataset ("Acme Textiles") on API errors.
12. **ARCH-EVD-001 (P1)**: Relational integrity collapse in evidence chains via unstructured `JSONField`.

---

## D. CONTRADICTIONS & DISCREPANCIES RECORDED

1. **Initial Audit Report C5 Contradiction**: The initial handoff report claimed anonymous callers received `None` from `Business.resolve_safely()`. Code inspection and empirical shell execution proved this was **CONTRADICTED**: anonymous callers bypass the scoped tenant check (`if is_auth and not is_staff:`) and fall through to global lookups, leaking tenant data.
2. **ChromaDB Vector Store Claim**: Handoff documentation claimed ComplianceRag uses ChromaDB for persistent vector search. Inspection reveals an in-memory FAISS / NumPy vector index serialized to local disk.
3. **CIR Documentation vs. Codebase**: Extensive architecture documentation described the Compliance Intelligence Record (CIR) as the core data transfer object. In reality, zero lines of CIR implementation exist in the codebase.

---

## E. FINAL SOURCE-OF-TRUTH DECISIONS

1. **Applicability Truth**: `apps/applicability/models.py:DecisionResult` evaluated by `ApplicabilityEngine` (Engine 2) is the **exclusive statutory truth**. All view regexes, frontend heuristics, and synthesis fallbacks are stripped of legal authority.
2. **Operational Profile Truth**: `apps/businesses/models.py:BusinessProfileVersion` is the **exclusive fact truth**. Ad-hoc dictionaries and unversioned profile variables are prohibited.
3. **Workflow & Deadlines Truth**: Derived exclusively from the `ComplianceIntelligenceRecord` (CIR) projection. The legacy `ComplianceCase` table is formally deprecated.

---

## F. FINAL AUTHORITY HIERARCHY

$$\text{Official Gazette / Statute} \longrightarrow \text{Verified Evidence Chunk} \longrightarrow \text{Versioned Rule AST} \longrightarrow \text{Engine 2 Evaluator} \longrightarrow \text{DecisionResult / CIR} \longrightarrow \text{Projections \& UI}$$

**Intelligence Segregation**:
- Gemini operates strictly on **Intelligence** (understanding free text, extracting facts, phrasing questions, explaining outcomes).
- ComplianceRag operates strictly on **Retrieval** (finding candidate rules and evidence chunks).
- Engine 2 operates strictly on **Authority** (mathematically deciding applicability).

---

## G. SECURITY INVARIANTS

1. Zero unauthenticated tenant resolution.
2. Zero implicit or default business selection (`.first()` is banned).
3. Every business-scoped request must resolve: $\text{Principal} \longrightarrow \text{Business} \longrightarrow \text{Assessment} \longrightarrow \text{Profile Version}$.
4. All cache keys must be strictly tenant-scoped.
5. Insecure deserialization (`pickle.load`) is permanently prohibited.
6. Web acquisition must enforce SSRF domain allowlists and RFC-1918 / AWS IMDS IP blocks.

---

## H. GOLDEN BUSINESS PROFILES BENCHMARK SUITE

To ensure the platform deterministically produces correct compliance obligations without hardcoding company names, six golden profiles are established:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SIX CANONICAL REGRESSION PROFILES                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. PROFILE A : Pure SaaS / Cloud Software (No physical manufacturing)       │
│ 2. PROFILE B : Textile Weaving & Dyeing Mill (Heavy water, boiler, power)   │
│ 3. PROFILE C : Pharma Formulation (Oral solid dosage, cleanroom, wastewater)│
│ 4. PROFILE D : Cold-Chain Logistics (Refrigeration, fleet, warehousing)     │
│ 5. PROFILE E : Food Processing Enterprise (Boiler, effluent, FSSAI)         │
│ 6. PROFILE F : Healthcare Technology / MedTech (ISO 13485, CDSCO devices)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Deep Dive: Profile B (Textile Weaving & Dyeing Mill)
- **Input Reality**: Surat, Gujarat; 165 workers; 480 kVA (643.7 HP); 97,000 sq ft; 3 TPH boiler; on-site ETP; fabric wet dyeing.
- **Architectural Expectations**:
  1. *Understanding*: Must extract load (480 kVA), workers (165), boiler (3 TPH), and effluent into canonical facts without re-asking them.
  2. *Adaptive Questioning*: Should ask 0–2 targeted questions (e.g. boiler fuel type, daily water consumption in KLD).
  3. *Candidate Discovery*: Must retrieve GPCB Water/Air Consent rules, DISH Factory License, and Indian Boiler Regulations.
  4. *Engine 2 Decisions*:
     - `REQ-GPCB-CTE`: **APPLICABLE** (Effluent == true, State == GJ).
     - `REQ-GUJ-FACTORY-LICENSE`: **APPLICABLE** (Workers >= 10 with power).
     - `REQ-GUJ-BOILER-REG`: **APPLICABLE** (Boiler == true, Steam generation).
     - `REQ-DGFT-IEC`: **NOT_APPLICABLE** (No export/import intent declared).
     - `REQ-CERT-IN-CYBERSECURITY`: **NOT_APPLICABLE** (Not a critical information infrastructure / pure IT entity).

### Deep Dive: Profile C (Pharmaceutical Formulation Facility)
- **Input Reality**: Hyderabad, Telangana; 164 workers; 480 kW; 95,000 sq ft; oral solid dosage (tablets/capsules); no API synthesis; no injectables; industrial effluent; imported excipients.
- **Architectural Expectations**:
  1. *Understanding*: Classifies primary activity as pharmaceutical formulation (secondary manufacturing). Flags import intent.
  2. *Adaptive Questioning*: Targets pharmaceutical cleanroom classifications and trade import scopes.
  3. *Engine 2 Decisions*:
     - `REQ-TSPCB-CTE`: **APPLICABLE** (State == TS, Red/Orange industrial category).
     - `REQ-TEL-FACTORY-LICENSE`: **APPLICABLE** (Workers >= 10 with power).
     - `REQ-CDSCO-MFG-LICENSE`: **APPLICABLE** (Form 25 / 28 Drugs & Cosmetics Act).
     - `REQ-DGFT-IEC`: **APPLICABLE** (Import intent == true).
     - `REQ-PESO-PETROLEUM`: **NOT_APPLICABLE** (No bulk solvent / API chemical storage).

---

## I. OPEN ARCHITECTURAL RISKS & OPEN QUESTIONS

1. **Production Upstream Gazette Feed**: A continuous ingestion mechanism for daily state gazette notifications must be established (manual legal curation vs. automated crawler).
2. **Worker Process Queue**: Transitioning synchronous LLM/RAG pipeline stages to asynchronous background workers (Celery + Redis) must be scheduled for Phase 3.
3. **Legacy `ComplianceCase` Deprecation Window**: Two release cycles are allocated to maintain read-model compatibility while admin views migrate to CIR.

---

## J. PHASE 2 ENTRY CRITERIA

Phase 1 is complete. Entry into **Phase 2 (Perimeter Security, Multi-Tenant Isolation & Sanitization)** is authorized upon meeting the following gates:
- [x] All 10 consolidated Phase 1 architecture documents authored and verified.
- [x] Zero production repository code modified during Phase 1.
- [x] 22 Non-Negotiable Invariants ratified in `01_ENGINEERING_CONSTITUTION.md`.
- [x] Clean, uncommitted working tree confirmed across both repositories.

**PHASE 1 COMPLETE — READY FOR PHASE 2 IMPLEMENTATION.**
