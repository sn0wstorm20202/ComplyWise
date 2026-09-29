# COMPLYWISE ARCHITECTURAL CONFLICT REGISTER
## FORMAL TRACKING, RECONCILIATION & RESOLUTION MATRIX

- **Document ID**: `CW-CONF-2026-V1`
- **Precedence Level**: **LEVEL 10 (AUDIT & RECONCILIATION)**
- **Status**: RATIFIED
- **Date**: September 28, 2026
- **Architecture Mandate**: Explicitly document every historical, specification, and implementation conflict, along with the canonical architectural decision.

---

## 1. RECONCILED CONFLICT ENTRIES

### CONFLICT API-001: RFC 7807 Envelope Structure Mismatch
- **Source A**: Handover notes and early drafts claiming strict RFC 7807 compliance.
- **Source B**: Draft API specification wrapping errors in a custom nested `{"error": { ... }}` envelope.
- **Conflict**: RFC 7807 defines top-level keys (`type`, `title`, `status`, `detail`, `instance`). Wrapping them in `{"error": ...}` breaks RFC 7807 parsers.
- **Current Repository Truth**: Ad-hoc DRF error dictionaries without standard error schemas.
- **Canonical Decision**: Adopt pure RFC 7807 Problem Details at the root of the JSON response. ComplyWise extensions (`code`, `correlation_id`, `timestamp`) exist as top-level extension members per RFC 7807 Section 3.2.
- **Reason**: Standard compliance with API gateways, client SDKs, and observability scrapers.
- **Affected Documents**: `06_API_CONTRACTS.md`, `ADR-006`.
- **Migration Impact**: Frontend API client error interceptor must be updated to read top-level `type`, `title`, `detail`, and `code`.

---

### CONFLICT API-002: 403 Forbidden vs. 404 Not Found Tenancy Semantics
- **Source A**: Generic security guidance suggesting HTTP 403 Forbidden for all unauthorized tenant requests.
- **Source B**: OWASP API Security Top 10 recommendations regarding Broken Object-Level Authorization (BOLA) and resource enumeration.
- **Conflict**: Returning HTTP 403 when an unauthorized user queries another tenant's business UUID confirms that the UUID exists in the database.
- **Current Repository Truth**: `apps/businesses/models.py:108` returns the business object directly to anonymous callers.
- **Canonical Decision**: 
  - Cross-tenant business/assessment query: **HTTP 404 (`NOT_FOUND`)** (conceals resource existence).
  - Authenticated member lacking role permission for an internal action: **HTTP 403 (`UNAUTHORIZED`)**.
- **Reason**: Completely prevents malicious actors from enumerating valid enterprise UUIDs across the platform.
- **Affected Documents**: `06_API_CONTRACTS.md`, `07_SECURITY_MODEL.md`, `ADR-007`.
- **Migration Impact**: Test suites and client error handlers must expect 404 for unauthorized object access.

---

### CONFLICT RAG-001: Competing Endpoint Naming (`retrieval/candidates` vs. `evidence/candidates`)
- **Source A**: `RAG_SERVICE_CONTRACT.md` early draft using `POST /v1/retrieval/candidates`.
- **Source B**: Initial architecture notes using `POST /v1/evidence/candidates`.
- **Conflict**: Parallel competing endpoint paths for the same candidate discovery responsibility.
- **Current Repository Truth**: ComplianceRag has 0 HTTP endpoints (CLI script only).
- **Canonical Decision**: Establish `POST /v1/retrieval/candidates` as the canonical endpoint. Candidate discovery is a retrieval operation, while `/v1/evidence/` is reserved for verbatim chunk retrieval (`/v1/evidence/chunks/{id}`) and verification (`/v1/evidence/verify`).
- **Reason**: Clear semantic separation between candidate generation (retrieval) and citation lookup (evidence).
- **Affected Documents**: `08_RAG_SERVICE_CONTRACT.md`, `02_TARGET_ARCHITECTURE.md`, `ADR-003`.
- **Migration Impact**: Private FastAPI microservice implementation in Phase 5 will implement `POST /v1/retrieval/candidates`.

---

### CONFLICT RAG-002: MiniLM vs. BGE Implementation Claim
- **Source A**: Documentation claiming ComplianceRag uses BGE-M3 / BGE-Large dense embeddings.
- **Source B**: Actual repository source code (`complywise/retrieval/dense.py`).
- **Conflict**: Discrepancy between documentation claims and verified code.
- **Current Repository Truth**: Code uses `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions) and `cross-encoder/ms-marco-MiniLM-L-6-v2`.
- **Canonical Decision**: The normative architecture specifies the capability requirement for dense vector embeddings without hardcoding the model. Current implementation remains `all-MiniLM-L6-v2`. Any migration to BGE-M3 requires empirical benchmark verification per Rule 20.
- **Reason**: Prevents breaking existing vector indices until comparative retrieval benchmarks are executed in Phase 10.
- **Affected Documents**: `08_RAG_SERVICE_CONTRACT.md`, `01_ENGINEERING_CONSTITUTION.md`.
- **Migration Impact**: Benchmarking scheduled for Phase 10 before any model replacement.

---

### CONFLICT SEC-001: mTLS vs. HMAC Service Authentication
- **Source A**: Cloud infrastructure draft proposing mTLS only.
- **Source B**: Application security draft proposing application-layer HMAC tokens.
- **Conflict**: Ambiguity over which layer enforces service-to-service integrity between ComplyWise and ComplianceRag.
- **Current Repository Truth**: Zero inter-service communication exists.
- **Canonical Decision**: Implement **Defense-in-Depth**: mTLS at the transport layer (private network encryption and mutual server authentication) combined with HMAC-SHA256 request signing at the application layer (`X-ComplyWise-Signature`).
- **Reason**: Protects against compromised internal network proxies and ensures cryptographic request non-repudiation.
- **Affected Documents**: `07_SECURITY_MODEL.md`, `08_RAG_SERVICE_CONTRACT.md`, `ADR-005`.
- **Migration Impact**: Shared secret configuration provisioned during Phase 6 integration.

---

### CONFLICT DATA-001: Compliance Intelligence Record (CIR) Target vs. Code Reality
- **Source A**: Handover documentation describing CIR as the core compliance data entity.
- **Source B**: Repository source code.
- **Conflict**: CIR is extensively documented but does not exist in any Python or TypeScript file.
- **Current Repository Truth**: Zero lines of CIR code exist.
- **Canonical Decision**: Formally ratify CIR as the target domain entity. Acknowledge that in current state it is absent. Implement CIR models in Phase 7 as the authoritative projection of `DecisionResult`.
- **Reason**: Required to bridge the gap between static Engine 2 rule evaluation and downstream operational workflows/deadlines.
- **Affected Documents**: `02_TARGET_ARCHITECTURE.md`, `03_SOURCE_OF_TRUTH.md`, `05_DATA_CONTRACTS.md`, `ADR-008`.
- **Migration Impact**: Model implementation scheduled for Phase 7.

---

### CONFLICT DATA-002: `evidence_refs` JSON vs. Relational Evidence Chain
- **Source A**: `apps/applicability/models.py:DecisionResult` using `evidence_refs = models.JSONField(default=list)`.
- **Source B**: Industrial architecture standard demanding verifiable legal audit chains.
- **Conflict**: Storing citations as untyped JSON dictionaries allows dangling references and prevents foreign-key cascade integrity.
- **Current Repository Truth**: `evidence_refs` is an unindexed JSON array.
- **Canonical Decision**: Transition `evidence_refs` into a typed Many-to-Many junction relationship linking `DecisionResult` to an immutable, content-addressed `EvidenceChunk` model.
- **Reason**: Statutory compliance claims must withstand regulatory audit; evidence links must be relationally enforced.
- **Affected Documents**: `05_DATA_CONTRACTS.md`, `09_MIGRATION_PLAN.md`, `ADR-011`.
- **Migration Impact**: Backfill migration script scheduled for Phase 7.

---

### CONFLICT ARCH-001: Target Microservice vs. Current Decoupled State
- **Source A**: Marketing and architecture documentation describing ComplyWise as an active RAG-powered compliance engine.
- **Source B**: Cross-repository source code analysis.
- **Conflict**: Repositories are 100% disconnected with zero runtime communication.
- **Current Repository Truth**: Standalone silos. ComplyWise queries static YAML files; ComplianceRag runs as an offline CLI.
- **Canonical Decision**: Explicitly classify the integrated microservice as `[TARGET]` architecture. Current state is recorded as disconnected. Integration is executed in Phase 6 across a typed private interface.
- **Reason**: Absolute architectural honesty; zero pretense of non-existent production capabilities.
- **Affected Documents**: `00_ARCHITECTURE_INDEX.md`, `02_TARGET_ARCHITECTURE.md`, `09_MIGRATION_PLAN.md`, `10_VALIDATION_REPORT.md`.
- **Migration Impact**: Phase 6 dedicated to building the typed HTTP client and wiring the discovery stage.

---

### CONFLICT SOT-001: `ComplianceCase` vs. `DecisionResult`
- **Source A**: `apps/workflows/models.py:ComplianceCase` and `AdminBusinessOverviewView`.
- **Source B**: `apps/applicability/models.py:DecisionResult` and `ApplicabilityEngine`.
- **Conflict**: Two competing database models represent statutory obligations. Admin overview displays legacy cases and ignores Engine 2 results.
- **Current Repository Truth**: Both tables exist and diverge.
- **Canonical Decision**: `DecisionResult` (and its projection, the CIR) is established as the **sole statutory truth**. `ComplianceCase` is deprecated.
- **Reason**: Eliminates split-brain compliance reporting between users and compliance officers.
- **Affected Documents**: `03_SOURCE_OF_TRUTH.md`, `09_MIGRATION_PLAN.md`.
- **Migration Impact**: Admin view rewritten in Phase 2; table archived in Phase 8.

---

### CONFLICT SOT-002: Gemini Statutory Applicability vs. Engine 2
- **Source A**: `ComplianceRag/complywise/analysis/gemini_analyzer.py` prompting Gemini to output `APPLICABLE` / `NOT_APPLICABLE`.
- **Source B**: `ComplyWise/backend/domain/evaluation/engine.py` (Engine 2).
- **Conflict**: LLM generative prompts compete with deterministic AST evaluation for statutory applicability.
- **Current Repository Truth**: Both exist in separate repositories.
- **Canonical Decision**: Engine 2 is the **sole statutory applicability authority**. Generative prompts are permanently prohibited from assigning legal applicability.
- **Reason**: Core architectural axiom: RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.
- **Affected Documents**: `01_ENGINEERING_CONSTITUTION.md`, `03_SOURCE_OF_TRUTH.md`, `ADR-001`, `ADR-002`.
- **Migration Impact**: Status prompts purged from ComplianceRag in Phase 5.
