# COMPLYWISE ARCHITECTURE DECISION RECORDS (ADR)
## FORMAL ARCHITECTURAL DECISIONS & RATIFICATION LOG

- **Document ID**: `CW-ADR-2026-V1`
- **Precedence Level**: **LEVEL 10 (DECISION HISTORY)**
- **Status**: RATIFIED
- **Date**: September 28, 2026
- **Architecture Standard**: Michael Nygard ADR Format

---

## ADR-001: Removal of Gemini from Legal Decision Authority
- **Status**: APPROVED
- **Context**: ComplianceRag previously prompted Gemini (`gemini_analyzer.py:56-140`) to output `APPLICABLE`, `POTENTIALLY_APPLICABLE`, or `NOT_APPLICABLE`. LLMs are probabilistic, prone to hallucinations, lack deterministic reproducibility, and cannot guarantee mathematical compliance proof.
- **Decision**: Gemini is strictly removed from legal decision authority. Gemini is restricted to business understanding, fact extraction, query expansion, question phrasing, and layperson explanations.
- **Consequences**: Engine 2 becomes the sole legal arbiter. LLM prompt templates are stripped of legal verdict instructions.

---

## ADR-002: Engine 2 as Sole Statutory Applicability Authority
- **Status**: APPROVED
- **Context**: Multiple components competed to determine applicability: view-layer regexes (`is_pure_software`), synthesis fallbacks, and frontend heuristics.
- **Decision**: `ApplicabilityEngine` (Engine 2) evaluating compiled AST rules using 3-valued Kleene logic (`TRUE` $\rightarrow$ `APPLICABLE`, `FALSE` $\rightarrow$ `NOT_APPLICABLE`, `UNKNOWN` $\rightarrow$ `NEEDS_INFORMATION`) is established as the sole legal applicability authority.
- **Consequences**: View-layer and frontend regexes are eliminated. `UNKNOWN` is never coerced to `False`.

---

## ADR-003: ComplianceRag Private Microservice Boundary
- **Status**: APPROVED
- **Context**: ComplianceRag existed as an air-gapped CLI prototype without a defined API or runtime integration. Competing endpoint names (`retrieval/candidates` vs `evidence/candidates`) caused specification drift.
- **Decision**: ComplianceRag is established as a private microservice exposing five canonical endpoints (`POST /retrieval/search`, `POST /retrieval/candidates`, `GET /evidence/chunks/{id}`, `POST /evidence/verify`, `GET /health`). It is strictly prohibited from exposing legal verdict endpoints.
- **Consequences**: Clean separation of retrieval from evaluation. ComplyWise interacts across a typed private network interface.

---

## ADR-004: JWT External User Authentication
- **Status**: APPROVED
- **Context**: 50 view classes configured `AllowAny`, and `resolve_safely()` allowed unauthenticated access to tenant businesses.
- **Decision**: All external client requests to ComplyWise must present a valid Bearer JWT. Anonymous access is strictly prohibited on all business-scoped endpoints.
- **Consequences**: Multi-tenant perimeter is fortified; unauthorized requests are rejected immediately with HTTP 401.

---

## ADR-005: Mutual TLS & HMAC Request Signing for Inter-Service Communication
- **Status**: APPROVED
- **Context**: ComplyWise and ComplianceRag operate in different network tiers. Passing user JWTs across the boundary would leak identity and violate domain isolation.
- **Decision**: Inter-service communication uses mTLS and HMAC-SHA256 request signing over a canonical string representation (`METHOD\nPATH\nTIMESTAMP\nNONCE\nSHA256(BODY)`). User JWTs are never forwarded.
- **Consequences**: Zero trust inter-service link; immune to replay attacks (30s clock skew window + 60s nonce cache); ComplianceRag remains tenant-agnostic.

---

## ADR-006: Reconciled RFC 7807 Error Model
- **Status**: APPROVED
- **Context**: Previous specifications claimed RFC 7807 compliance while wrapping errors in a custom nested `{"error": {...}}` envelope.
- **Decision**: Adopt pure RFC 7807 Problem Details at the root of the JSON response with top-level fields (`type`, `title`, `status`, `detail`, `instance`, `code`, `correlation_id`, `timestamp`).
- **Consequences**: Full standards compliance with modern HTTP API client libraries and gateways.

---

## ADR-007: 404 Concealment of Cross-Tenant Resources (Anti-Enumeration)
- **Status**: APPROVED
- **Context**: Returning HTTP 403 when an unauthorized user queries a business UUID confirms that the UUID exists in the database, enabling enumeration attacks.
- **Decision**: Any request for a business or assessment UUID where the caller is not an authorized member returns HTTP 404 (`NOT_FOUND`). HTTP 403 is reserved strictly for authenticated members whose role is insufficient for a specific action.
- **Consequences**: Total concealment of tenant existence from unauthorized actors.

---

## ADR-008: CIR as Authoritative Projection of DecisionResult
- **Status**: APPROVED
- **Context**: Handover documentation described CIR as a core entity, but it was missing from code. There was confusion between `DecisionResult` and `CIR`.
- **Decision**: `DecisionResult` represents individual statutory rule outcomes; `CIR` represents the unified, versioned, hash-verified compliance snapshot for an assessment. CIR derives from `DecisionResult` and cannot act as an independent decision engine.
- **Consequences**: Unbroken audit chain; CIR is cryptographically signed using RFC 8785 JCS + SHA-256.

---

## ADR-009: Elimination of Unsafe Pickle Deserialization
- **Status**: APPROVED
- **Context**: ComplianceRag tracked binary `.pkl` files in git, loaded via `pickle.load()` on startup, posing a severe arbitrary code execution vulnerability.
- **Decision**: Permanently ban `pickle` in production. Migrate BM25 term matrices and document metadata to SQLite FTS5 / SafeTensors.
- **Consequences**: Complete elimination of RCE attack surface; structured queryable index storage.

---

## ADR-010: Explicit Temporal & Hierarchical Jurisdiction Model
- **Status**: APPROVED
- **Context**: The existing retrieval engine treated all Indian laws as a single flat namespace without temporal or state filtering.
- **Decision**: Every rule AST and evidence chunk must carry explicit temporal boundaries (`effective_from`, `effective_to`) and hierarchical jurisdiction tags (`CENTRAL`, `STATE`, `DISTRICT`, `MUNICIPAL`, `REGULATOR`). Hard pre-filtering must occur before retrieval.
- **Consequences**: Elimination of cross-state regulatory contamination and obsolete law citations.

---

## ADR-011: Relational Integrity of Legal Evidence Chains
- **Status**: APPROVED
- **Context**: `DecisionResult.evidence_refs` was implemented as an unindexed `JSONField(default=list)` of arbitrary dictionaries.
- **Decision**: Migrate `evidence_refs` to a typed relationship backed by an immutable, content-addressed `EvidenceChunk` model with SHA-256 content hashes and official gazette URLs.
- **Consequences**: Relational referential integrity; prevention of dangling legal citations.

---

## ADR-012: Dynamic 0–4 Adaptive Questioning Architecture
- **Status**: APPROVED
- **Context**: `domain/intelligence/questionnaire.py:1470` enforced a rigid quota (`if len(questions) != 15:`) that discarded tailored LLM questions and loaded static emergency questions.
- **Decision**: Eliminate the 15-question quota. Implement a material-gap analyzer that inspects candidate rule ASTs against known profile variables to generate 0–4 targeted questions.
- **Consequences**: Dramatically improved user onboarding; zero redundant questions for facts already declared in business descriptions.
