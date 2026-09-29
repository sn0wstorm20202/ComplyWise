# 08. COMPLIANCERAG SERVICE CONTRACT SPECIFICATION
## PRIVATE REGULATORY EVIDENCE & CANDIDATE RETRIEVAL INTERFACE

- **Document ID**: `CW-RAG-2026-V1`
- **Precedence Level**: **LEVEL 8**
- **Status**: MANDATORY / NORMATIVE
- **Effective Date**: September 28, 2026
- **Architecture Role**: Private RPC / Microservice
- **Base URI**: `https://compliancerag.internal/v1`
- **Crucial Invariant**: **RAG RETRIEVES. RULES DECIDE.** RAG has ZERO authority to emit legal applicability decisions.

---

## 1. RECONCILED CANONICAL ENDPOINT REGISTER

Previous specifications contained competing endpoint names (e.g. `POST /v1/evidence/candidates` vs `POST /v1/retrieval/candidates`). This document establishes the **five canonical endpoints**:

| Method | Endpoint Path | Primary Responsibility | Input Payload | Output Response |
|---|---|---|---|---|
| `POST` | `/v1/retrieval/search` | Ad-hoc regulatory text search with jurisdiction pre-filters | Text query, jurisdiction, domain | Ranked list of evidence snippets |
| `POST` | `/v1/retrieval/candidates` | Candidate requirement discovery for Engine 1 | Structured business profile facts | Ranked list of candidate requirement IDs |
| `GET` | `/v1/evidence/chunks/{id}` | Direct retrieval of verbatim statutory text and gazette URL | URL parameter `{id}` | Full `EvidenceChunk` with content hash |
| `POST` | `/v1/evidence/verify` | Batch verification of chunk currentness and supersession | List of chunk IDs | Validity status, superseding chunk IDs |
| `GET` | `/v1/health` | Service liveness, model telemetry, and index statistics | None | Index version, model status, latency |

---

## 2. CAPABILITIES VS. IMPLEMENTATION TECHNOLOGY

To ensure long-term architectural stability, normative capabilities are strictly separated from current implementation choices:

| Subsystem Capability | Normative Capability Requirement | Current Implementation `[CURRENT]` | Target Implementation `[TARGET]` |
|---|---|---|---|
| **Lexical Index** | Tokenized statutory text matching with BM25 scoring | `rank_bm25` in Python pickle cache | SQLite FTS5 database / SafeTensors |
| **Dense Vector Index**| Semantic similarity mapping in dense embedding space | `sentence-transformers/all-MiniLM-L6-v2` | `all-MiniLM-L6-v2` (BGE-M3 candidate) |
| **Rank Fusion** | Combining lexical and semantic ranking lists | Reciprocal Rank Fusion ($k=60$) | RRF ($k=60$) with exact identifier boost |
| **Reranker** | Deep cross-attention relevance scoring of top candidates | `cross-encoder/ms-marco-MiniLM-L-6-v2` | `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| **Document Parser** | Structure-preserving legal gazette extraction | Manual JSON parsing of `master_kb.json` | Docling hierarchical statutory parser |

---

## 3. CANONICAL API ENDPOINT SPECIFICATIONS

### A. Candidate Requirement Discovery (`POST /v1/retrieval/candidates`)
- **Headers**:
  - `X-ComplyWise-Signature: sha256=<hmac>`
  - `X-ComplyWise-Timestamp: <epoch_seconds>`
  - `X-ComplyWise-Nonce: <uuid>`
  - `X-Correlation-ID: req-9a1d48c8-3801-447a`
- **Request Payload**:
  ```json
  {
    "jurisdiction": {
      "state_code": "GJ",
      "district": "Surat",
      "zone_type": "NOTIFIED_ESTATE"
    },
    "enterprise": {
      "entity_type": "PRIVATE_LIMITED",
      "msme_category": "SMALL"
    },
    "operations": {
      "manufacturing_status": "PHYSICAL_MANUFACTURING",
      "sector": "TEXTILES",
      "sub_sector": "WEAVING_AND_DYEING",
      "worker_count": 165,
      "connected_load_hp": 643.7
    },
    "environmental": {
      "has_boiler": true,
      "boiler_capacity_tph": 3.0,
      "generates_trade_effluent": true
    },
    "top_k": 25
  }
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "candidates_count": 3,
    "candidates": [
      {
        "requirement_id": "REQ-GPCB-CTE",
        "title": "Consent to Establish (Water & Air Pollution Control)",
        "issuing_authority": "Gujarat Pollution Control Board",
        "regulatory_domain": "ENVIRONMENTAL",
        "confidence_score": 0.96,
        "matched_reasons": ["State GJ match", "Trade effluent discharge", "Textile dyeing sub-sector"],
        "evidence_chunk_id": "EVD-GPCB-WATER-2024-V1"
      },
      {
        "requirement_id": "REQ-GUJ-FACTORY-LICENSE",
        "title": "Factory License & Plan Approval",
        "issuing_authority": "DISH Gujarat",
        "regulatory_domain": "LABOR_FACTORIES",
        "confidence_score": 0.94,
        "matched_reasons": ["Workers >= 10 with power (165 workers, 643.7 HP)"],
        "evidence_chunk_id": "EVD-GUJ-DISH-1948-V1"
      },
      {
        "requirement_id": "REQ-GUJ-BOILER-REG",
        "title": "Boiler Registration & Inspection Certificate",
        "issuing_authority": "Directorate of Boilers, Gujarat",
        "regulatory_domain": "BOILERS",
        "confidence_score": 0.91,
        "matched_reasons": ["Industrial steam boiler present (3.0 TPH)"],
        "evidence_chunk_id": "EVD-GUJ-BOILER-1923-V1"
      }
    ],
    "retrieval_metadata": {
      "retrieval_latency_ms": 48.2,
      "reranker_latency_ms": 32.1,
      "index_version": "2026.09.1"
    }
  }
  ```

---

### B. Natural Language Evidence Search (`POST /v1/retrieval/search`)
- **Request Payload**:
  ```json
  {
    "query": "Consent to Establish discharge limits for textile dyeing unit in Surat",
    "filters": {
      "state_code": "GJ",
      "regulatory_domain": "ENVIRONMENTAL"
    },
    "top_k": 10
  }
  ```
- **Response Payload (200 OK)**: Ranked array of evidence chunks with similarity scores.

---

### C. Evidence Chunk Retrieval (`GET /v1/evidence/chunks/{id}`)
- **Response Payload (200 OK)**:
  ```json
  {
    "chunk_id": "EVD-GPCB-WATER-2024-V1",
    "source_metadata": {
      "source_id": "SRC-GUJ-WATER-RULES-2024",
      "act_title": "Water (Prevention and Control of Pollution) Act, 1974 & Gujarat Rules",
      "issuing_authority": "Gujarat Pollution Control Board",
      "official_url": "https://gpcb.gujarat.gov.in/rules/water_act_consent_rules.pdf",
      "gazette_notification_number": "GPCB/CTE/2024/09",
      "effective_from": "2024-01-01",
      "effective_to": null,
      "currentness_status": "CURRENT"
    },
    "citation": {
      "chapter": "IV",
      "section": "Section 25",
      "clause": "Sub-section (1)",
      "page_number": 42
    },
    "verbatim_text": "Subject to the provisions of this section, no person shall, without the previous consent of the State Board, establish or take any steps to establish any industry, operation or process, or any treatment and disposal system or any extension or addition thereto, which is likely to discharge sewage or trade effluent into a stream or well or sewer or on land...",
    "content_hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "verification": {
      "status": "VERIFIED",
      "last_verified_at": "2026-09-20T00:00:00Z",
      "verifier": "STAFF_LEGAL_TEAM"
    }
  }
  ```

---

### D. Evidence Verification (`POST /v1/evidence/verify`)
- **Request Payload**:
  ```json
  {
    "chunk_ids": ["EVD-GPCB-WATER-2024-V1"]
  }
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "results": [
      {
        "chunk_id": "EVD-GPCB-WATER-2024-V1",
        "is_current": true,
        "superseded_by": null,
        "effective_to": null
      }
    ]
  }
  ```

---

### E. Health & Telemetry (`GET /v1/health`)
- **Response Payload (200 OK)**:
  ```json
  {
    "status": "HEALTHY",
    "dense_model": "sentence-transformers/all-MiniLM-L6-v2",
    "reranker_model": "cross-encoder/ms-marco-MiniLM-L-6-v2",
    "lexical_index_type": "SQLite-BM25",
    "total_chunks_indexed": 48250,
    "last_index_update": "2026-09-25T18:00:00Z"
  }
  ```

---

## 4. PROHIBITED ENDPOINTS & BEHAVIORS

The following endpoints and functions are **expressly prohibited**:
- `POST /v1/applicability` (Legal applicability determination)
- `POST /v1/check-compliance` (Evaluative compliance scoring)
- `POST /v1/decide` (Statutory verdict assignment)
- Accepting incoming JWT user bearer tokens.
- Resolving business organizations or tenant identities.
