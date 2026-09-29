# 05. COMPLYWISE DATA CONTRACTS SPECIFICATION
## CANONICAL SCHEMAS, PROVENANCE & TYPED DOMAIN ENTITIES

- **Document ID**: `CW-DATA-2026-V1`
- **Precedence Level**: **LEVEL 5**
- **Status**: MANDATORY / NORMATIVE
- **Effective Date**: September 28, 2026
- **Serialization Standard**: JSON Schema Draft 2020-12 / Pydantic v2 Models
- **Typing Principle**: Strict static typing; no unvalidated generic dictionaries across domain boundaries.

---

## 1. NORMATIVE CONTRACT VS. ILLUSTRATIVE EXAMPLE

- **Normative Contract**: The formal schema definitions, required field names, strict types, valid enum values, and structural constraints specified herein are **mandatory** and must be enforced at runtime.
- **Illustrative Example**: Code blocks containing sample data values (e.g. "Acme Textiles", "Surat Cotton Mill") are provided solely for visual clarity and do not restrict schema validation.

---

## 2. CANONICAL FACT & PROVENANCE (`CanonicalFact`)

Represents an individual operational fact with comprehensive forensic provenance.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CanonicalFact",
  "type": "object",
  "required": [
    "fact_key",
    "canonical_value",
    "data_type",
    "origin",
    "confidence",
    "confirmed_by_user",
    "updated_at"
  ],
  "properties": {
    "fact_key": { "type": "string", "pattern": "^[a-z_]+(\\.[a-z_]+)*$" },
    "raw_value": { "type": ["string", "number", "boolean", "null"] },
    "raw_unit": { "type": ["string", "null"] },
    "canonical_value": { "type": ["string", "number", "boolean", "array"] },
    "canonical_unit": { "type": ["string", "null"] },
    "data_type": { "type": "string", "enum": ["STRING", "INTEGER", "FLOAT", "BOOLEAN", "ARRAY", "ENUM"] },
    "origin": { "type": "string", "enum": ["USER_TYPED", "LLM_EXTRACTED", "QUESTIONNAIRE_ANSWER", "DOCUMENT_OCR", "ADMIN_OVERRIDE"] },
    "confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
    "source_excerpt": { "type": ["string", "null"] },
    "actor_id": { "type": ["string", "null"], "format": "uuid" },
    "confirmed_by_user": { "type": "boolean" },
    "updated_at": { "type": "string", "format": "date-time" },
    "override_metadata": {
      "type": ["object", "null"],
      "required": ["actor_id", "reason", "previous_value", "timestamp", "audit_event_id"],
      "properties": {
        "actor_id": { "type": "string", "format": "uuid" },
        "reason": { "type": "string", "minLength": 10 },
        "previous_value": { "type": ["string", "number", "boolean", "null"] },
        "timestamp": { "type": "string", "format": "date-time" },
        "audit_event_id": { "type": "string", "format": "uuid" },
        "review_state": { "type": "string", "enum": ["PENDING_SCRUTINY", "APPROVED", "REVERTED"] }
      }
    }
  },
  "additionalProperties": false
}
```

*Illustrative Example (Standard Fact):*
```json
{
  "fact_key": "operations.connected_load_hp",
  "raw_value": 480,
  "raw_unit": "kVA",
  "canonical_value": 643.7,
  "canonical_unit": "HP",
  "data_type": "FLOAT",
  "origin": "QUESTIONNAIRE_ANSWER",
  "confidence": 1.0,
  "source_excerpt": "Connected electrical load is 480 kVA",
  "actor_id": "c0bb5a2e-4b68-45b9-9cf4-90ae89e24691",
  "confirmed_by_user": true,
  "updated_at": "2026-09-28T12:00:00Z",
  "override_metadata": null
}
```

*Illustrative Example (Administrative Override):*
```json
{
  "fact_key": "operations.connected_load_hp",
  "raw_value": 750,
  "raw_unit": "HP",
  "canonical_value": 750.0,
  "canonical_unit": "HP",
  "data_type": "FLOAT",
  "origin": "ADMIN_OVERRIDE",
  "confidence": 1.0,
  "source_excerpt": "Verified against DISH Inspection Report 2026/Q2",
  "actor_id": "a1b2c3d4-0000-0000-0000-000000000001",
  "confirmed_by_user": true,
  "updated_at": "2026-09-28T14:30:00Z",
  "override_metadata": {
    "actor_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "reason": "Corrected sanctioned load per DISH annual inspection certificate submission.",
    "previous_value": 643.7,
    "timestamp": "2026-09-28T14:30:00Z",
    "audit_event_id": "aud-99887766-5544-3322",
    "review_state": "APPROVED"
  }
}
```

---

## 3. BUSINESS PROFILE VERSION (`BusinessProfileVersion`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "BusinessProfileVersion",
  "type": "object",
  "required": [
    "profile_version_id",
    "business_id",
    "version_number",
    "is_frozen",
    "facts",
    "created_at"
  ],
  "properties": {
    "profile_version_id": { "type": "string", "format": "uuid" },
    "business_id": { "type": "string", "format": "uuid" },
    "version_number": { "type": "integer", "minimum": 1 },
    "change_note": { "type": "string" },
    "is_frozen": { "type": "boolean" },
    "facts": {
      "type": "object",
      "additionalProperties": { "$ref": "#/definitions/CanonicalFact" }
    },
    "created_at": { "type": "string", "format": "date-time" }
  },
  "additionalProperties": false
}
```

---

## 4. ADAPTIVE QUESTIONING SCHEMAS

### `SmartQuestion`
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SmartQuestion",
  "type": "object",
  "required": [
    "question_id",
    "target_fact_key",
    "question_text",
    "category",
    "answer_type",
    "required",
    "order",
    "reasoning"
  ],
  "properties": {
    "question_id": { "type": "string", "pattern": "^Q_[A-Z0-9_]+$" },
    "target_fact_key": { "type": "string" },
    "question_text": { "type": "string" },
    "category": { "type": "string" },
    "answer_type": { "type": "string", "enum": ["NUMBER", "BOOLEAN", "SINGLE_SELECT", "MULTI_SELECT", "CURRENCY", "TEXT"] },
    "required": { "type": "boolean" },
    "unit": { "type": ["string", "null"] },
    "options": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["value", "label"],
        "properties": {
          "value": { "type": "string" },
          "label": { "type": "string" }
        }
      }
    },
    "order": { "type": "integer", "minimum": 1, "maximum": 4 },
    "reasoning": { "type": "string" }
  }
}
```

### `QuestionAnswer`
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "QuestionAnswer",
  "type": "object",
  "required": ["question_id", "value", "answered_at"],
  "properties": {
    "question_id": { "type": "string" },
    "value": { "type": ["string", "number", "boolean", "array"] },
    "unit": { "type": ["string", "null"] },
    "answered_at": { "type": "string", "format": "date-time" }
  }
}
```

---

## 5. STATUTORY RULE VERSION (`RuleVersion`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RuleVersion",
  "type": "object",
  "required": [
    "rule_version_id",
    "requirement_id",
    "version_number",
    "ast",
    "required_variables",
    "effective_from",
    "status"
  ],
  "properties": {
    "rule_version_id": { "type": "string" },
    "requirement_id": { "type": "string", "pattern": "^REQ-[A-Z0-9-]+$" },
    "version_number": { "type": "integer", "minimum": 1 },
    "ast": { "type": "object" },
    "required_variables": {
      "type": "array",
      "items": { "type": "string" }
    },
    "effective_from": { "type": "string", "format": "date" },
    "effective_to": { "type": ["string", "null"], "format": "date" },
    "superseded_by": { "type": ["string", "null"] },
    "status": { "type": "string", "enum": ["DRAFT", "ACTIVE", "REVISED", "DEPRECATED"] }
  }
}
```

---

## 6. DECISION RUN (`DecisionRun`) & RESULT (`DecisionResult`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DecisionRun",
  "type": "object",
  "required": ["decision_run_id", "assessment_id", "profile_version_id", "engine_version", "evaluated_at"],
  "properties": {
    "decision_run_id": { "type": "string", "format": "uuid" },
    "assessment_id": { "type": "string", "format": "uuid" },
    "profile_version_id": { "type": "string", "format": "uuid" },
    "engine_version": { "type": "string" },
    "evaluated_at": { "type": "string", "format": "date-time" }
  }
}
```

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DecisionResult",
  "type": "object",
  "required": [
    "result_id",
    "decision_run_id",
    "requirement_id",
    "rule_version_id",
    "status",
    "evaluation_trace",
    "evidence_references"
  ],
  "properties": {
    "result_id": { "type": "string", "format": "uuid" },
    "decision_run_id": { "type": "string", "format": "uuid" },
    "requirement_id": { "type": "string" },
    "rule_version_id": { "type": "string" },
    "status": { "type": "string", "enum": ["APPLICABLE", "NOT_APPLICABLE", "NEEDS_INFORMATION"] },
    "evaluation_trace": { "type": "object" },
    "evidence_references": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

---

## 7. EVIDENCE & REGULATORY SOURCE CONTRACTS

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "EvidenceChunk",
  "type": "object",
  "required": [
    "chunk_id",
    "source_id",
    "citation",
    "verbatim_text",
    "content_hash",
    "verification_status"
  ],
  "properties": {
    "chunk_id": { "type": "string", "pattern": "^EVD-[A-Z0-9-]+$" },
    "source_id": { "type": "string", "pattern": "^SRC-[A-Z0-9-]+$" },
    "citation": {
      "type": "object",
      "required": ["act_title", "section_clause"],
      "properties": {
        "act_title": { "type": "string" },
        "chapter": { "type": ["string", "null"] },
        "section_clause": { "type": "string" },
        "page_number": { "type": ["integer", "null"] }
      }
    },
    "verbatim_text": { "type": "string" },
    "content_hash": { "type": "string", "pattern": "^sha256:[a-f0-9]{64}$" },
    "verification_status": { "type": "string", "enum": ["VERIFIED", "PRELIMINARY", "STALE", "REJECTED"] }
  }
}
```

---

## 8. COMPLIANCE INTELLIGENCE RECORD (`CIR`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ComplianceIntelligenceRecord",
  "type": "object",
  "required": [
    "cir_id",
    "business_id",
    "assessment_id",
    "profile_version_id",
    "decision_run_id",
    "determinations",
    "metrics",
    "content_hash",
    "created_at"
  ],
  "properties": {
    "cir_id": { "type": "string" },
    "business_id": { "type": "string", "format": "uuid" },
    "assessment_id": { "type": "string", "format": "uuid" },
    "profile_version_id": { "type": "string", "format": "uuid" },
    "decision_run_id": { "type": "string", "format": "uuid" },
    "determinations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["requirement_id", "title", "status", "authority", "evidence_chunk_id"],
        "properties": {
          "requirement_id": { "type": "string" },
          "title": { "type": "string" },
          "status": { "type": "string", "enum": ["APPLICABLE", "NOT_APPLICABLE", "NEEDS_INFORMATION"] },
          "authority": { "type": "string" },
          "evidence_chunk_id": { "type": "string" },
          "official_url": { "type": "string", "format": "uri" },
          "explanation": { "type": "string" }
        }
      }
    },
    "metrics": {
      "type": "object",
      "required": ["applicable_count", "not_applicable_count", "needs_info_count"],
      "properties": {
        "applicable_count": { "type": "integer" },
        "not_applicable_count": { "type": "integer" },
        "needs_info_count": { "type": "integer" }
      }
    },
    "content_hash": { "type": "string" },
    "created_at": { "type": "string", "format": "date-time" }
  }
}
```

### Cryptographic CIR Signing Algorithm
1. The CIR JSON payload (excluding `content_hash`) is serialized using **RFC 8785 JSON Canonicalization Scheme (JCS)**.
2. A SHA-256 digest is generated over the canonical bytes: $\text{Digest} = \text{SHA256}(\text{JCS}(\text{CIR}))$.
3. The digest is stored as `content_hash` (`sha256:<hex>`).
4. An HMAC signature is calculated using the internal ComplyWise authority key: $\text{Signature} = \text{HMAC-SHA256}(K_{\text{authority}}, \text{Digest})$.
