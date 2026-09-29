# 15. API Contract Proposal: ComplyWise ↔ RAG Interface

## Executive Summary
This document specifies the formal, typed interface contract between the **ComplyWise Core Platform** and the **RAG Retrieval Engine**.

### Invariant Architectural Constraints:
1. **Evidence-Only Payloads:** The RAG retrieval interface must return raw, verified statutory and regulatory text chunks accompanied by cryptographic hashes and source provenance.
2. **Strict Prohibition of Applicability Classifications:** Under no circumstances may the RAG service return decision labels such as `"APPLICABLE"`, `"NOT_APPLICABLE"`, or `"COMPLIANT"`. Any response containing decision semantics must be rejected by the API gateway.
3. **Strict Business Context Propagation:** Every retrieval request must include the canonical business context (`business_id`, `profile_version_id`, `jurisdiction`, `sector`, `establishment_type`) and the specific `missing_variables` targeted by Engine 2.

---

## 1. Endpoint Specifications

### 1.1 `POST /api/v1/retrieval/query`
Executes hybrid search (dense vector + sparse BM25 + Cross-Encoder reranking) over statutory knowledge bases and official gazettes constrained by the target business context.

#### HTTP Headers:
- `Content-Type: application/json`
- `Accept: application/json`
- `X-Correlation-ID: <uuid>` (Propagated for distributed tracing)
- `Authorization: Bearer <m2m_jwt_token>` (Machine-to-machine authentication)

---

## 2. JSON Schema Definitions

### 2.1 Request Schema (`RetrievalQueryRequest`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RetrievalQueryRequest",
  "type": "object",
  "required": [
    "correlation_id",
    "business_context",
    "search_intent",
    "query_parameters"
  ],
  "properties": {
    "correlation_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique trace identifier for this evaluation run."
    },
    "business_context": {
      "type": "object",
      "required": [
        "business_id",
        "profile_version_id",
        "jurisdiction",
        "sector",
        "establishment_type"
      ],
      "properties": {
        "business_id": { "type": "string", "format": "uuid" },
        "profile_version_id": { "type": "string", "format": "uuid" },
        "jurisdiction": {
          "type": "string",
          "description": "State or central jurisdiction code (e.g. IN-GJ, IN-KA, IN-CENTRAL)"
        },
        "sector": { "type": "string", "example": "textiles" },
        "establishment_type": {
          "type": "string",
          "enum": ["factory", "shop_and_establishment", "warehouse", "office", "hospital", "food_facility"]
        },
        "manufacturing_status": { "type": "boolean" },
        "worker_count": { "type": "integer", "minimum": 0 },
        "power_load_hp": { "type": "number", "minimum": 0 }
      }
    },
    "search_intent": {
      "type": "object",
      "required": ["targeted_rule_codes", "missing_variables"],
      "properties": {
        "targeted_rule_codes": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Engine 2 rule identifiers requiring evidentiary verification (e.g. ['GJ_FACT_001'])."
        },
        "missing_variables": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Specific facts required by Engine 2 AST nodes (e.g. ['effluent_discharge_type', 'boiler_rating'])."
        }
      }
    },
    "query_parameters": {
      "type": "object",
      "properties": {
        "top_k": { "type": "integer", "default": 5, "maximum": 20 },
        "min_similarity_score": { "type": "number", "default": 0.65, "minimum": 0.0, "maximum": 1.0 },
        "allowed_authority_tiers": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["tier_1_government", "tier_2_regulator", "tier_3_statutory"]
          },
          "default": ["tier_1_government", "tier_2_regulator", "tier_3_statutory"]
        }
      }
    }
  }
}
```

---

### 2.2 Response Schema (`RetrievalQueryResponse`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RetrievalQueryResponse",
  "type": "object",
  "required": [
    "correlation_id",
    "retrieval_metadata",
    "evidence_chunks"
  ],
  "properties": {
    "correlation_id": { "type": "string", "format": "uuid" },
    "retrieval_metadata": {
      "type": "object",
      "required": ["total_chunks_scanned", "execution_time_ms", "hybrid_weights"],
      "properties": {
        "total_chunks_scanned": { "type": "integer" },
        "execution_time_ms": { "type": "number" },
        "hybrid_weights": {
          "type": "object",
          "properties": {
            "dense_weight": { "type": "number", "example": 0.6 },
            "bm25_weight": { "type": "number", "example": 0.4 }
          }
        }
      }
    },
    "evidence_chunks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "chunk_id",
          "act_name",
          "section_reference",
          "content_hash",
          "raw_text",
          "source_url",
          "authority_tier",
          "dense_score",
          "sparse_score",
          "cross_encoder_score",
          "final_rank_score"
        ],
        "properties": {
          "chunk_id": { "type": "string", "format": "uuid" },
          "act_name": { "type": "string", "example": "Factories Act, 1948" },
          "section_reference": { "type": "string", "example": "Section 6: Approval, licensing and registration of factories" },
          "content_hash": {
            "type": "string",
            "pattern": "^[a-f0-9]{64}$",
            "description": "SHA256 hex digest of raw_text"
          },
          "raw_text": { "type": "string", "description": "Normalized statutory chunk text" },
          "source_url": { "type": "string", "format": "uri" },
          "authority_tier": {
            "type": "string",
            "enum": ["tier_1_government", "tier_2_regulator", "tier_3_statutory"]
          },
          "dense_score": { "type": "number" },
          "sparse_score": { "type": "number" },
          "cross_encoder_score": { "type": "number" },
          "final_rank_score": { "type": "number" }
        }
      }
    }
  }
}
```

---

## 3. Communication, Resiliency & Timeouts

### 3.1 Network Policies
- **Timeout:** 10.0 seconds maximum. If the hybrid retriever + reranker takes longer than 10 seconds, the client cancels the request.
- **Circuit Breaker:** If 5 consecutive requests fail with 5xx or timeout, open circuit for 30 seconds; fail gracefully to localized database knowledge packs.
- **Retry Strategy:** Exponential backoff with jitter:
  $$\text{Delay} = 2^{\text{attempt}} \times 100\text{ms} + \text{jitter}(0, 50\text{ms})$$
  Maximum retry attempts: 2.

### 3.2 Error Responses

| HTTP Status | Error Code | Description | Client Action |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `INVALID_CONTEXT` | Missing required profile facts (`sector`, `jurisdiction`). | Abort retrieval; trigger questionnaire. |
| `403 Forbidden` | `DECISION_PAYLOAD_DETECTED` | RAG service illegally returned an applicability decision. | Raise critical alert; terminate pipeline. |
| `404 Not Found` | `NO_JURISDICTION_CORPUS` | No statutory chunks indexed for the requested state. | Fall back to central laws; flag missing corpus. |
| `504 Gateway Timeout` | `RETRIEVAL_TIMEOUT` | Vector search / reranker exceeded 10.0s deadline. | Retry once or fall back to cached evidence. |
