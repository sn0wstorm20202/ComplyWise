# 02. COMPLYWISE TARGET ARCHITECTURE SPECIFICATION
## SYSTEM CONTEXT, RUNTIME SEQUENCE, DATA FLOW & SUB-SYSTEM INTERFACES

- **Document ID**: `CW-ARCH-2026-V1`
- **Precedence Level**: **LEVEL 2**
- **Status**: TARGET SPECIFICATION
- **Effective Date**: September 28, 2026
- **Architecture Paradigm**: Event-Driven Service-Oriented Architecture with Clean Domain Boundaries
- **Core Axiom**: **RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.**

---

## 1. CURRENT VS. TARGET ARCHITECTURE TOPOLOGY

```
CURRENT ARCHITECTURE [VERIFIED BROKEN BASELINE]:
  [ Frontend ] ──(HTTP)──> [ DRF API (50 AllowAny Views) ]
                               │
                               ├─(Regex Bypass)─> [ Bypasses Engine 2 ]
                               │
                               ├─(Fallback)────> [ Business.objects.first() Leak ]
                               │
                               ├─(Orchestration)─> [ Engine 2 (Sound Kleene Evaluator) ]
                               │
                               ├─(Admin Overview)─> [ Legacy ComplianceCases Table ]
                               │
                               x  [ ZERO INTEGRATION / AIR-GAPPED ]
                               │
                     [ Standalone ComplianceRag ]
                       ├── Tracked .pkl caches (RCE risk)
                       └── Gemini prompted to decide APPLICABLE
```

```
TARGET ARCHITECTURE [NORMATIVE SPECIFICATION]:
  [ Next.js 15 Frontend ] ──(HTTPS / JWT)──> [ API Gateway & Tenancy Guard ]
                                                      │
                                                      ▼
                                       [ Canonical Profile Manager ]
                                                      │
                     ┌────────────────────────────────┴────────────────────────────────┐
                     ▼                                                                 ▼
      [ Engine 1: Candidate Discovery ]                              [ Gap Analysis & Questioning ]
        (ComplianceRag Private Service)                                  (0-4 Targeted Questions)
                     │                                                                 │
                     ▼                                                                 ▼
      [ Hash-Verified Evidence Pack ]                                [ Frozen Profile Version ]
                     │                                                                 │
                     └────────────────────────────────┬────────────────────────────────┘
                                                      ▼
                                      [ Engine 2: AST Evaluator ]
                                          (Kleene 3-Valued Logic)
                                                      │
                                                      ▼
                                      [ DecisionRun & DecisionResults ]
                                                      │
                                                      ▼
                                    [ Compliance Intelligence Record ]
                                                      │
                     ┌────────────────────────────────┼────────────────────────────────┐
                     ▼                                ▼                                ▼
            [ Workflow Engine ]              [ Statutory Calendar ]           [ Explainer Service ]
          (Filing State Machines)            (Scheduled Deadlines)            (Layperson Summaries)
                     │                                │                                │
                     └────────────────────────────────┼────────────────────────────────┘
                                                      ▼
                                        [ Read-Only UI Projections ]
                                            (User Dashboard & Admin)
```

---

## 2. ENGINE 1 VS. ENGINE 2 ARCHITECTURAL SEPARATION

A foundational flaw in the previous system was the conflation of candidate search with legal applicability. The target architecture establishes a strict two-stage evaluation model:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 ENGINE 1: CANDIDATE DISCOVERY (RAG / SEARCH)                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Responsibility : Broad statutory candidate discovery & evidence gathering. │
│  Input          : Canonical business facts, state, sector, activities.      │
│  Output         : Candidate Requirement IDs (e.g. 25 possible obligations). │
│  Tolerance      : High recall; tolerant of false positives.                 │
│  Authority      : ZERO LEGAL AUTHORITY. Candidate list only.                │
│  Current State  : Disconnected. ComplyWise queries local YAML packs.        │
│  Target State   : Private microservice RPC query to ComplianceRag.          │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ Candidate Requirements + Evidence Pack
┌─────────────────────────────────────────────────────────────────────────────┐
│             ENGINE 2: DETERMINISTIC APPLICABILITY (AST EVALUATOR)           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Responsibility : Precise statutory evaluation against business facts.      │
│  Input          : Canonical Profile Version + Versioned Rule ASTs.          │
│  Output         : TRUE (APPLICABLE) / FALSE (NOT_APPLICABLE) / UNKNOWN.     │
│  Logic          : 3-valued Kleene Boolean Logic (never coerces UNKNOWN).    │
│  Authority      : SOLE LEGAL APPLICABILITY AUTHORITY. Immutable audit trace.│
│  Current State  : Core engine sound, but bypassed downstream by regexes.    │
│  Target State   : Pure, uncompromised applicability authority.              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. END-TO-END RUNTIME FLOW

The complete user lifecycle follows an unbroken, deterministic pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor User as Enterprise User
    participant Web as Next.js Frontend
    participant API as API Gateway (DRF)
    participant Pipe as Orchestration Pipeline
    participant Gemini as Gemini Intelligence
    participant RAG as ComplianceRag Service
    participant E2 as Engine 2 Evaluator
    participant DB as Relational Database

    User->>Web: Submits raw business description & location
    Web->>API: POST /api/v2/onboarding/profile (JWT Auth)
    API->>API: Enforce Tenant Context (user -> business)
    API->>Pipe: Initialize Assessment Run
    
    Pipe->>Gemini: Extract structured operational facts from description
    Gemini-->>Pipe: Structured facts JSON
    Pipe->>Pipe: Schema Validation & Normalization
    Pipe->>DB: Persist Initial Canonical BusinessProfileVersion (v1)

    Pipe->>RAG: POST /v1/retrieval/candidates (Profile v1 facts)
    RAG-->>Pipe: 18 Candidate Requirements + Evidence Chunks
    
    Pipe->>Pipe: Gap Analysis: Identify missing variables for candidate ASTs
    alt Material Unknowns Exist
        Pipe->>Gemini: Draft 0-4 targeted questions for missing variables
        Gemini-->>Pipe: Targeted question list
        Pipe->>DB: Persist SmartQuestionPlan
        Pipe-->>Web: Return 0-4 adaptive questions
        User->>Web: Submits answers (load, boiler capacity, workforce)
        Web->>API: POST /api/v2/assessments/{id}/answers/
        API->>Pipe: Ingest answers & update facts
        Pipe->>DB: Persist Immutable BusinessProfileVersion (v2)
    end

    Pipe->>E2: Evaluate Candidates against Profile v2
    loop For each candidate rule
        E2->>E2: Evaluate AST using 3-valued Kleene logic
        E2->>E2: Generate evaluation trace & capture evidence IDs
    end
    E2-->>Pipe: DecisionResults (APPLICABLE / NOT_APPLICABLE / NEEDS_INFO)

    Pipe->>Pipe: Aggregate into Compliance Intelligence Record (CIR)
    Pipe->>DB: Persist DecisionRun, DecisionResults & CIR
    
    Pipe->>Gemini: Generate layperson explanation of CIR results
    Gemini-->>Pipe: Natural language explanation text
    Pipe->>DB: Persist explanation text to CIR
    
    Pipe-->>Web: Return CIR Presentation DTO
    Web->>User: Renders verified obligations, exact legal clauses, and deadlines
```

---

## 4. CANONICAL DATA FLOW ARCHITECTURE

```
RAW USER INPUT
  (Description, Form Inputs)
        │
        ▼
BUSINESS UNDERSTANDING
  (Gemini Fact Extraction)
        │
        ▼
NORMALIZATION & PROVENANCE
  (Unit conversion, Type Coercion, Source stamping)
        │
        ▼
CANONICAL BUSINESS PROFILE VERSION
  (Immutable JSON/Relational Schema)
        │
        ├─────────────────────────────────────────────────┐
        ▼                                                 ▼
ENGINE 1: CANDIDATE DISCOVERY                    GAP ANALYSIS & QUESTIONING
  (ComplianceRag Hybrid Search)                    (0-4 targeted questions)
        │                                                 │
        ▼                                                 ▼
EVIDENCE PACK (Hash-verified clauses)            UPDATED PROFILE VERSION (v2)
        │                                                 │
        └────────────────────────┬────────────────────────┘
                                 ▼
                     ENGINE 2: AST EVALUATOR
            (Kleene Logic: TRUE / FALSE / UNKNOWN)
                                 │
                                 ▼
                           DECISION RUN
                     (Set of DecisionResults)
                                 │
                                 ▼
                  COMPLIANCE INTELLIGENCE RECORD
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
WORKFLOW ACTIONS         STATUTORY DEADLINES      SCHEMES & STANDARDS
(Application tasks)      (Filing schedules)       (Incentive matches)
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 ▼
                        FRONTEND PROJECTION
                    (Next.js User & Admin UI)
```

---

## 5. RAG RETRIEVAL & EVIDENCE PIPELINE

ComplianceRag is redesigned from an ad-hoc script into an industrial evidence pipeline:

```mermaid
flowchart LR
    subgraph Ingestion ["Ingestion & Normalization"]
        GazettePDF["Official Gazette PDFs"] --> Docling["Docling Document Parser"]
        Docling --> Normalizer["Legal Text Normalizer"]
        Normalizer --> Chunker["Hierarchical Statutory Chunker\n(Act -> Chapter -> Section -> Clause)"]
    end

    subgraph Indexing ["Dual Indexing"]
        Chunker --> BM25_Idx["BM25 Lexical Index (SafeTensors/SQLite)"]
        Chunker --> Dense_Idx["Dense Vector Index (all-MiniLM-L6-v2)"]
    end

    subgraph QueryExecution ["Hybrid Retrieval Execution"]
        ReqContext["Canonical Profile Context\n(State, Sector, Load, Workers)"] --> QueryPlanner["Query & Filter Planner"]
        QueryPlanner --> PreFilter["Hard Siting & Jurisdiction Filter\n(State == GJ, Authority == GPCB)"]
        PreFilter --> BM25_Search["Lexical Search"]
        PreFilter --> Dense_Search["Dense Vector Search"]
        BM25_Search --> RRF["Reciprocal Rank Fusion (k=60)"]
        Dense_Search --> RRF
        RRF --> IdentBoost["Exact Section / Form Identifier Booster"]
        IdentBoost --> Rerank["Cross-Encoder Reranker\n(ms-marco-MiniLM-L-6-v2)"]
        Rerank --> EvidencePack["Verified Evidence Pack\n(Top K Chunks with Content Hashes)"]
    end

    BM25_Idx -.-> BM25_Search
    Dense_Idx -.-> Dense_Search
```

### Statutory Chunker Invariant
Statutory text must never be split across arbitrary character boundaries. The chunker preserves legal document structures:
- **Level 1**: Act / Regulation Title, Notification Number, Issuing Authority.
- **Level 2**: Chapter / Part / Sub-chapter.
- **Level 3**: Section / Rule number with statutory heading.
- **Level 4**: Clause / Sub-rule / Proviso / Explanation.

Every chunk inherits parent metadata (Act title, notification date, jurisdiction).

---

## 6. CIR (COMPLIANCE INTELLIGENCE RECORD) SPECIFICATION

The **Compliance Intelligence Record (CIR)** is the central domain entity that unifies all assessment determinations into an immutable, versioned document:
- **Legal Authority**: Derived strictly from `DecisionResult` objects produced by Engine 2.
- **Integrity**: Hash-verified using RFC 8785 JSON Canonicalization Scheme (JCS) and signed by the internal ComplyWise authority key.
- **Projections**: Derives Workflows, Statutory Deadlines, Schemes, and Standards without mutating underlying compliance determinations.

---

## 7. ASSESSMENT LIFECYCLE STATE MACHINE

```mermaid
stateDiagram-v2
    [*] --> INTAKE: Business Created & Description Submitted
    INTAKE --> UNDERSTANDING: Extract Structured Facts (Gemini)
    UNDERSTANDING --> DISCOVERY: Profile v1 Created & Candidate Discovery (Engine 1)
    DISCOVERY --> QUESTIONING: Material Fact Gaps Identified
    DISCOVERY --> EVALUATING: All Decision Variables Known (0 Questions)
    QUESTIONING --> ANSWERS_RECEIVED: User Submits Question Answers
    ANSWERS_RECEIVED --> PROFILE_FROZEN: Normalization & Profile v2 Locked
    PROFILE_FROZEN --> EVALUATING: Trigger Engine 2 AST Execution
    EVALUATING --> CIR_CREATED: DecisionRun, DecisionResults & CIR Persisted
    CIR_CREATED --> PROJECTIONS_UPDATED: Workflows & Deadlines Generated
    PROJECTIONS_UPDATED --> COMPLETED: Assessment Locked & Projected to UI
    COMPLETED --> [*]
```
- **Lifecycle Invariant**: `Assessment.decision_run` must link directly to the authoritative `DecisionRun`. The system must never rely on unscoped "latest" lookups.
