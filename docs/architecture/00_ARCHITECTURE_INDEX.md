# COMPLYWISE ARCHITECTURAL SPECIFICATION INDEX
## MASTER GOVERNANCE & ARCHITECTURAL AUTHORITY REPOSITORY

- **Document ID**: `CW-INDEX-2026-V1`
- **Status**: CANONICAL / AUTHORITATIVE
- **Effective Date**: September 28, 2026
- **Architecture Standard**: Industrial Event-Driven Clean Architecture
- **Core Axiom**: **RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.**
- **Expanded Axiom**: **GEMINI UNDERSTANDS. RAG RETRIEVES. EVIDENCE SUPPORTS. ENGINE 2 DETERMINES. CIR RECORDS. FRONTEND PROJECTS. ADMIN SCRUTINIZES.**

---

## 1. ARCHITECTURAL AUTHORITY HIERARCHY

All architectural documentation follows a strict precedence hierarchy. In any scenario where statements between documents appear to conflict, the higher-level document is the canonical authority, and lower-level documents must be interpreted or revised to conform:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: 01_ENGINEERING_CONSTITUTION.md                                     │
│          Fundamental axioms, 22 non-negotiable invariants, authority laws.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 2: 02_TARGET_ARCHITECTURE.md                                          │
│          System context, runtime sequence, data flow, Engine 1 vs Engine 2. │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 3: 03_SOURCE_OF_TRUTH.md                                              │
│          Canonical entity ownership, reader/writer rights, conflict rules.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 4: 04_DOMAIN_BOUNDARIES.md                                            │
│          Subsystem encapsulation, concentric layers, import directions.     │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 5: 05_DATA_CONTRACTS.md                                               │
│          JSON schemas, Pydantic contracts, typed domain entity definitions. │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 6: 06_API_CONTRACTS.md                                                │
│          REST endpoints, RFC 7807 error taxonomy, HTTP semantics.           │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 7: 07_SECURITY_MODEL.md                                               │
│          Tenant isolation, mTLS/HMAC signing, SSRF defense, deserialization.│
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 8: 08_RAG_SERVICE_CONTRACT.md                                         │
│          ComplianceRag private RPC, candidate discovery, evidence schemas.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 9: 09_MIGRATION_PLAN.md                                               │
│          Strangler-fig roadmap, component dispositions, phase test gates.   │
├─────────────────────────────────────────────────────────────────────────────┤
│ LEVEL 10: 10_VALIDATION_REPORT.md / ADR_REGISTER.md / CONFLICT_REGISTER.md  │
│           Verification baselines, architectural decision records, conflicts.│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. REPOSITORY MASTER DOCUMENT REGISTER

| Specification Document | Authority Level | Primary Responsibility | Target Subsystem |
|---|---|---|---|
| [`01_ENGINEERING_CONSTITUTION.md`](file:///E:/complience/ComplyWise/docs/architecture/01_ENGINEERING_CONSTITUTION.md) | Level 1 | 22 Non-negotiable invariants, legal authority laws, security bounds | Whole Platform |
| [`02_TARGET_ARCHITECTURE.md`](file:///E:/complience/ComplyWise/docs/architecture/02_TARGET_ARCHITECTURE.md) | Level 2 | Complete system context, runtime sequence, CIR architecture | Whole Platform |
| [`03_SOURCE_OF_TRUTH.md`](file:///E:/complience/ComplyWise/docs/architecture/03_SOURCE_OF_TRUTH.md) | Level 3 | Canonical entity ownership, competing truth resolution | Data & Domain |
| [`04_DOMAIN_BOUNDARIES.md`](file:///E:/complience/ComplyWise/docs/architecture/04_DOMAIN_BOUNDARIES.md) | Level 4 | 18 Domain modules, concentric layer rules, permitted imports | Backend Core |
| [`05_DATA_CONTRACTS.md`](file:///E:/complience/ComplyWise/docs/architecture/05_DATA_CONTRACTS.md) | Level 5 | Pydantic / JSON Schema contracts, fact provenance, CIR schema | Domain & APIs |
| [`06_API_CONTRACTS.md`](file:///E:/complience/ComplyWise/docs/architecture/06_API_CONTRACTS.md) | Level 6 | Secure REST API specs, RFC 7807 error model, HTTP status codes | API Gateway |
| [`07_SECURITY_MODEL.md`](file:///E:/complience/ComplyWise/docs/architecture/07_SECURITY_MODEL.md) | Level 7 | Multi-tenant isolation chain, SSRF guard, mTLS/HMAC signing | Security Core |
| [`08_RAG_SERVICE_CONTRACT.md`](file:///E:/complience/ComplyWise/docs/architecture/08_RAG_SERVICE_CONTRACT.md) | Level 8 | Private RPC interface, candidate discovery, evidence retrieval | ComplianceRag |
| [`09_MIGRATION_PLAN.md`](file:///E:/complience/ComplyWise/docs/architecture/09_MIGRATION_PLAN.md) | Level 9 | Strangler-fig refactoring, legacy retirement, 10-phase roadmap | Engineering Ops |
| [`10_VALIDATION_REPORT.md`](file:///E:/complience/ComplyWise/docs/architecture/10_VALIDATION_REPORT.md) | Level 10 | Independent forensic verification, golden profiles, test gates | Audit & QA |
| [`ADR_REGISTER.md`](file:///E:/complience/ComplyWise/docs/architecture/ADR_REGISTER.md) | Level 10 | Architectural Decision Records (ADR-001 through ADR-012) | Architecture |
| [`CONFLICT_REGISTER.md`](file:///E:/complience/ComplyWise/docs/architecture/CONFLICT_REGISTER.md) | Level 10 | Reconciled conflict register across API, RAG, Security, & Data | Architecture |
| [`PHASE_0_INDUSTRIAL_ARCHITECTURE_RECON.md`](file:///E:/complience/ComplyWise/docs/architecture/PHASE_0_INDUSTRIAL_ARCHITECTURE_RECON.md) | Historical | Complete Phase 0 read-only forensic baseline report | Historical |

---

## 3. STRICT STATE TAXONOMY

To prevent ambiguity, every architectural statement in this specification suite is explicitly categorized into one of three operational states:
1. `[CURRENT]`: The behavior, model, or integration currently verified to exist in the repository code.
2. `[TARGET]`: The normative architectural standard mandated by this specification suite for future implementation.
3. `[MIGRATION]`: The interim transitional state, compatibility adapter, or strangler-fig bridge active between Current and Target states.

---

## 4. EXECUTIVE MANDATE

Engineers, architects, and automated agents working on ComplyWise must adhere strictly to these consolidated specifications. **No production code may be modified, no database migrations executed, and no deployments initiated during this architectural consolidation phase.**
