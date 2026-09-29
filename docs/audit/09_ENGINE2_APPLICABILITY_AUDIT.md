# 09. Engine 2 Applicability Audit

## Executive Summary
This document provides a forensic audit of **Engine 2 (Deterministic Legal Applicability)** across both `ComplyWise` and `ComplianceRag`.

The core architectural mandate dictates:
> **RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.**  
> RAG must never become the legal applicability engine. Engine 2 must be deterministic, auditable, and mathematically grounded in Kleene 3-valued logic.

### Central Findings:
1. **Engine 2 Exists Solely in ComplyWise:** `ComplyWise` possesses a genuinely sophisticated AST-based deterministic rule engine (`apps/applicability/engine.py`) implementing Kleene 3-valued logic (`TRUE`, `FALSE`, `UNKNOWN`).
2. **ComplianceRag Has Usurped Engine 2 with an LLM:** In `ComplianceRag`, there is **no rule engine at all**. The task of determining legal applicability has been completely delegated to Gemini 2.5 Flash via prompt engineering in `gemini_analyzer.py`. This is an absolute violation of the core architectural principle.
3. **ComplyWise Bypasses Engine 2 with View-Layer Regex:** In `ComplyWise`, despite the existence of `ApplicabilityEngine`, `apps/requirements/views.py` (lines 172–205) executes **ad-hoc regex filtering** on `business.name` and profile attributes to drop rules outside the engine!
4. **Knowledge Pack Starvation Forces LLM Fallback:** ComplyWise's static rule packs only cover 5 sectors across 6 states. When an unrepresented sector (e.g. SaaS, Fintech, Cold Storage) is assessed, Engine 2 returns 0 rules, prompting `AssessmentComplianceView` to fall back to ungrounded LLM compliance generation.

---

## 1. ComplyWise Engine 2 Architecture (`apps/applicability/engine.py`)

### 1.1 Mathematical Logic & AST Operators
The engine evaluates rule conditions structured as an Abstract Syntax Tree (AST) using Kleene 3-valued logic:

| Status | Kleene Value | Semantic Meaning | Precondition Action |
| :--- | :--- | :--- | :--- |
| `APPLICABLE` | $\mathbf{T}$ (True) | All rule conditions satisfied by verified facts. | Emits mandatory compliance requirement. |
| `NOT_APPLICABLE` | $\mathbf{F}$ (False) | At least one condition explicitly refuted by verified facts. | Explicitly excluded with audit explanation. |
| `NEEDS_INFORMATION` | $\mathbf{U}$ (Unknown) | Required profile fact or evidence is missing. | Triggers targeted adaptive questionnaire. |

#### Kleene Truth Tables Implemented in `engine.py`:
$$\begin{array}{c|ccc}
\land & \mathbf{T} & \mathbf{U} & \mathbf{F} \\
\hline
\mathbf{T} & \mathbf{T} & \mathbf{U} & \mathbf{F} \\
\mathbf{U} & \mathbf{U} & \mathbf{U} & \mathbf{F} \\
\mathbf{F} & \mathbf{F} & \mathbf{F} & \mathbf{F}
\end{array}
\quad\quad
\begin{array}{c|ccc}
\lor & \mathbf{T} & \mathbf{U} & \mathbf{F} \\
\hline
\mathbf{T} & \mathbf{T} & \mathbf{T} & \mathbf{T} \\
\mathbf{U} & \mathbf{T} & \mathbf{U} & \mathbf{U} \\
\mathbf{F} & \mathbf{T} & \mathbf{U} & \mathbf{F}
\end{array}
\quad\quad
\begin{array}{c|c}
\neg & \\
\hline
\mathbf{T} & \mathbf{F} \\
\mathbf{U} & \mathbf{U} \\
\mathbf{F} & \mathbf{T}
\end{array}$$

- **Verification:** The AST evaluator (`_evaluate_node`) strictly adheres to Kleene tables.
- **Critical Invariant:** An `UNKNOWN` variable combined with `AND` never collapses to `FALSE`; it evaluates to `UNKNOWN` (`NEEDS_INFORMATION`).

### 1.2 Implemented AST Operators
- **Logical:** `AND`, `OR`, `NOT`
- **Relational / Comparison:** `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `GREATER_THAN_OR_EQUAL`, `LESS_THAN`, `LESS_THAN_OR_EQUAL`
- **Set Membership:** `IN`, `NOT_IN`, `CONTAINS`, `EXISTS`
- **Threshold Processing:**
  - `worker_count >= 10` (with power) or `worker_count >= 20` (without power) for Factories Act 1948.
  - `power_load_hp > 10` for industrial electricity licensing.
  - `facility_area_sqft` for municipal trade licenses.
  - `hazardous_substances IN [...]` for MSIHC Rules 1989.

---

## 2. Where Engine 2 Breaks Down in ComplyWise

### 2.1 View-Layer Regex Bypass (`apps/requirements/views.py`)
Despite the mathematical purity of `apps/applicability/engine.py`, the view layer (`RequirementListView.get_queryset()`) contains crude string matching that overrides Engine 2:

```python
# Location: ComplyWise/apps/requirements/views.py (lines 172-205)
# Forensic Code Inspection:
business_name = getattr(business, "name", "").lower()
is_tech = bool(re.search(r'\b(tech|software|saas|ai|platform|digital|app|cloud|data)\b', business_name))
is_manufacturing = bool(re.search(r'\b(manufacturing|textiles|pharma|chemical|factory|works|industries)\b', business_name))

if is_tech:
    # Hardcoded bypass: drop all factory, pollution, and labor inspection rules
    qs = qs.exclude(category__in=["Pollution Control", "Factory Safety", "Hazardous Waste"])
elif is_manufacturing:
    # Hardcoded bypass: drop CERT-In and IT Act rules
    qs = qs.exclude(category__in=["Cybersecurity", "IT Act Compliance"])
```

#### Architectural Impact:
- **Catastrophic Failure of Engine 2 Separation:** A company named *"Apex Software Solutions"* that operates a physical server assembly warehouse with 50 workers will have all Factory Safety rules silently excluded simply because the word *"software"* appears in its legal name.
- **Rule Negation Outside AST:** Legal applicability is being decided by fragile regular expressions in a Django view rather than the deterministic AST evaluator.

### 2.2 Suppression of `NEEDS_INFORMATION` Status
- In `apps/requirements/views.py` and `apps/applicability/views.py`:
  - `DecisionResult` records with status `NEEDS_INFORMATION` are dropped by default filters (`filter(status="applicable")`).
  - Users are never presented with the list of missing variables that would clarify their compliance status.
  - As a result, companies receive false negatives (e.g. an unverified factory is treated as "not applicable" instead of "needs power load and worker count input").

### 2.3 Knowledge Pack Coverage Void
The static rule packs located in `knowledge_packs/` only contain:
- **Sectors:** Textiles, Food Processing, Pharmaceuticals, Chemical Manufacturing, General Engineering.
- **States:** Maharashtra, Gujarat, Tamil Nadu, Karnataka, Telangana, Uttar Pradesh.

When a user onboards a business in **SaaS, Logistics, E-commerce, Hospitality, or Agriculture**:
1. Engine 2 finds **zero rules** matching the sector.
2. `ApplicabilityEngine.evaluate()` returns an empty list.
3. Rather than indicating missing rule coverage, `AssessmentComplianceView` invokes `gemini-1.5-flash` with a generic prompt to hallucinate compliance requirements on the fly.
4. **Result:** Deterministic Engine 2 is completely abandoned for 80%+ of modern Indian businesses.

---

## 3. ComplianceRag: Total Absence of Engine 2

In `ComplianceRag`, there is no rule engine. The entire decision-making process is embedded in a single prompt sent to Gemini:

```python
# Location: ComplianceRag/complywise/analysis/gemini_analyzer.py (lines 88-124)
prompt = f"""
You are ComplyWise, an AI expert in Indian business compliance regulations.
YOUR TASK: Determine which Indian regulatory COMPLIANCES (not schemes) apply to THIS SPECIFIC business.

BUSINESS PROFILE:
{profile_text}

RETRIEVED COMPLIANCES:
{retrieved_context}

For each compliance, classify as:
- APPLICABLE: Legally required
- POTENTIALLY_APPLICABLE: Likely applies based on industry/scale
- NOT_APPLICABLE: Definitely does not apply

Return valid JSON with:
"applicable_compliances": [...],
"potentially_applicable": [...],
"not_applicable": [...]
"""
```

### Forensic Analysis:
- **Direct Violation of Principle:** The LLM is acting as the judge, jury, and applicability engine.
- **Non-Deterministic Outputs:** Running the same business profile twice against Gemini 2.5 Flash yields different compliance subsets depending on sampling temperature, prompt tokens, and model updates.
- **No Traceability:** There is no Abstract Syntax Tree, no boolean evaluation trace, and no ability for an enterprise auditor to verify why a rule was triggered.

---

## 4. Engine 2 Comparison Matrix

| Architectural Dimension | ComplyWise Implementation | ComplianceRag Implementation | Required Target Architecture |
| :--- | :--- | :--- | :--- |
| **Applicability Decision Engine** | `ApplicabilityEngine` (`engine.py`) | Gemini 2.5 Flash LLM Prompt | Purely Deterministic AST Engine |
| **Logic System** | Kleene 3-Valued Logic ($\mathbf{T}, \mathbf{F}, \mathbf{U}$) | Probabilistic LLM Tokens | Kleene 3-Valued Logic |
| **Handling of Missing Facts** | Evaluates to `NEEDS_INFORMATION` | Hallucinates default assumptions | Triggers targeted question generation |
| **View-Layer Integrity** | **Compromised** (Regex filtering in view) | N/A (No view layer) | Strict Separation of Concerns |
| **Knowledge Base Support** | 5 sectors, 6 states | `master_kb.json` (unstructured) | Exhaustive, versioned rule registry |
| **Evidence Gating** | Preconditions check evidence hash | No evidence verification | Cryptographic Evidence Hash Gate |

---

## 5. Required Architectural Remediation

1. **Purge View-Layer Regex:** Immediately delete lines 172–205 of `apps/requirements/views.py`. All filtering must occur within `ApplicabilityEngine` using verified profile facts.
2. **Elevate `NEEDS_INFORMATION` to First-Class Status:** Expose `NEEDS_INFORMATION` in API payloads so the frontend can guide the user to answer the exact missing variable required by the AST.
3. **Migrate RAG to Retrieval-Only:** Strip `gemini_analyzer.py` of its applicability classification prompt. RAG must output raw retrieved chunks with similarity scores; ComplyWise Engine 2 must consume these chunks to satisfy rule preconditions.
4. **Expand Sector Rule Registries:** Implement automated rule ingestion from official gazettes into deterministic AST rule packs, eliminating the ungrounded LLM synthesis fallback.
