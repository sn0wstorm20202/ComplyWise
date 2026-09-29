# 01. COMPLYWISE ENGINEERING CONSTITUTION
## INDUSTRIAL PRODUCT ARCHITECTURE & GOVERNANCE SPECIFICATION

- **Document ID**: `CW-CONST-2026-V1`
- **Precedence Level**: **LEVEL 1 (HIGHEST ARCHITECTURAL AUTHORITY)**
- **Status**: MANDATORY / NON-NEGOTIABLE
- **Effective Date**: September 28, 2026
- **Scope**: ComplyWise Repository, ComplianceRag Repository (Evidence/Retrieval Subsystem)
- **Out of Scope**: BIS Platform (Completely Separate Entity)
- **Core Axiom**: **RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.**
- **Expanded Axiom**: **GEMINI UNDERSTANDS. RAG RETRIEVES. EVIDENCE SUPPORTS. ENGINE 2 DETERMINES. CIR RECORDS. FRONTEND PROJECTS. ADMIN SCRUTINIZES.**

---

## 1. THE FOUNDATIONAL AXIOM

ComplyWise is not an unconstrained generative conversational agent that answers *"What compliances do I have?"* 

ComplyWise is an **industrial, deterministic regulatory compliance intelligence platform** that uses artificial intelligence strictly for operational understanding and natural language retrieval.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CORE ARCHITECTURAL AXIOM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. GEMINI UNDERSTANDS   : Extracts structured operational facts from text. │
│  2. RAG RETRIEVES        : Finds candidate requirements & legal evidence.   │
│  3. EVIDENCE SUPPORTS    : Provides official statutory provenance & gazette.│
│  4. RULES DECIDE         : Compiled ASTs evaluate deterministic criteria.   │
│  5. ENGINE 2 DETERMINES  : Sole authority on legal applicability status.   │
│  6. CIR RECORDS          : Immutable Compliance Intelligence Record truth.  │
│  7. FRONTEND PROJECTS    : Read-only visual projection of CIR state.        │
│  8. ADMIN SCRUTINIZES    : Audit room for trace inspection & review.        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**The fundamental authority rule:**
> **RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.**

---

## 2. THE 22 NON-NEGOTIABLE INVARIANTS

The following invariants are inviolable architectural laws. No feature request, hackathon shortcut, temporary patch, or external dependency may breach them:

1. **No Unauthenticated Tenant Resolution**: Every business-scoped request must resolve an authenticated, authorized principal. Anonymous callers must never resolve or access a tenant business.
2. **No Implicit or Default Business Selection**: A request that omits a business identifier must fail with an explicit validation error. It must never select a business implicitly.
3. **No `.first()` Fallback for Business-Scoped Requests**: Code patterns such as `Business.objects.first()` or `Business.objects.filter(is_active=True).first()` are strictly prohibited anywhere in the platform.
4. **Mandatory Canonical Resolution Chain**: Every business-scoped operation must explicitly resolve:
   $$\text{Principal} \longrightarrow \text{Business} \longrightarrow \text{Assessment} \longrightarrow \text{Profile Version} \longrightarrow \text{Decision Run} \longrightarrow \text{Result}$$
5. **Engine 2 is the Sole Applicability Authority**: Authoritative determinations of `APPLICABLE`, `NOT_APPLICABLE`, and `NEEDS_INFORMATION` may only be emitted by Engine 2 evaluating versioned AST rules against an immutable business profile version.
6. **UNKNOWN Never Silently Becomes NOT_APPLICABLE**: Kleene 3-valued logic (`TRUE`, `FALSE`, `UNKNOWN`) is strictly preserved across the entire system. Missing or indeterminate variables must yield `NEEDS_INFORMATION`, never silent rejection or approval.
7. **RAG Retrieves Evidence and Candidates; It Does Not Decide Applicability**: The RAG subsystem retrieves candidate requirements, clauses, citations, and evidence chunks. It has zero legal decision authority.
8. **Gemini is a First-Class Intelligence Component, Not a Legal Judge**: Gemini performs business understanding, entity extraction, query planning, adaptive question generation, and layperson explanations. Gemini must never independently assign statutory applicability status.
9. **LLM Output Must Be Validated Before Becoming Trusted Structured Data**: All generative outputs must undergo strict schema validation, type coercion, range validation, and provenance tracking before persisting into canonical profile state.
10. **LLMs Cannot Invent Evidence**: Every statutory claim must be anchored to a physical, hash-verified `EvidenceChunk` from an official regulatory source.
11. **LLMs Cannot Override RuleVersion or Engine 2**: Generative explanations, synthesis summaries, and chatbot responses cannot override, alter, or suppress Engine 2 decision results.
12. **Frontend is Projection-Only**: The user interface is a pure read-only projection of backend CIR truth. The frontend must not evaluate statutory applicability, apply regex filters to suppress obligations, or fabricate mock compliance states on API failure.
13. **Admin is Projection and Review Only With Respect to Legal Truth**: The admin portal provides audit traces, AST visualizers, manual review workflows, and knowledge curation. Admin views must read canonical CIR/DecisionResult records rather than parallel legacy stores.
14. **Unverified Sources Cannot Silently Become Verified Legal Evidence**: The system must explicitly distinguish candidate web discoveries from verified gazette notifications. Unverified text cannot populate authoritative compliance records.
15. **Currentness Must Be Explicit**: Every regulatory source and evidence chunk must carry explicit temporal metadata (`effective_from`, `effective_to`, `supersedes`, `superseded_by`). Repealed laws must never be evaluated as active obligations.
16. **Jurisdiction Must Be Explicit**: Jurisdictions are hierarchical entities (`CENTRAL`, `STATE`, `DISTRICT`, `MUNICIPAL`, `REGULATOR`, `SPECIAL_ZONE`). Location-based filtering must occur prior to retrieval and evaluation to prevent cross-state contamination.
17. **Compliance Decisions Must Be Reproducible From Versioned Inputs**: Given `ProfileVersion(V)`, `RuleVersion(R)`, and `Evidence(E)`, re-evaluating the rule AST must yield the exact same `DecisionResult` and trace every time.
18. **Cache State Must Never Cross Tenant Boundaries**: All cache keys must incorporate tenant identity, business ID, assessment ID, and profile version ID. Cross-tenant cache contamination is a critical security violation.
19. **Production Rules Cannot Be Activated Solely From LLM Suggestions**: LLMs may propose candidate rules and draft ASTs, but activation into production requires human knowledge-engineer approval and cryptographic signing.
20. **RAG Components Must Be Benchmarked Before Replacement**: No embedding model, reranker, vector database, or chunking strategy may be replaced without empirical, recorded benchmark evidence demonstrating metric improvement ($Recall@K$, $nDCG$, $MRR$).
21. **No Company-Specific Hardcoded Compliance Logic**: Rules must be written against generic operational attributes, industrial categories, and statutory thresholds. Hardcoding specific corporate names or sector regex bypasses in application code is forbidden.
22. **No Unrelated BIS Platform Work**: All engineering focus is dedicated strictly to ComplyWise and ComplianceRag evidence integration. The BIS system remains strictly out of scope.

---

## 3. AUTHORITY HIERARCHY & ROLES

```
                       [ STATUTORY AUTHORITY ]
                                  │
                                  ▼
                     Official Gazette / Law Source
                                  │
                                  ▼
                        Verified Evidence Chunk
                                  │
                                  ▼
                   Compiled AST RuleVersion (Engine 2)
                                  │
                                  ▼
                    Deterministic DecisionResult
                                  │
                                  ▼
               Compliance Intelligence Record (CIR)
                                  │
            ┌─────────────────────┴─────────────────────┐
            ▼                                           ▼
   Downstream Projections                      LLM Explanation
(Workflows, Deadlines, Schemes)             (Natural Language Rationale)
            │                                           │
            └─────────────────────┬─────────────────────┘
                                  ▼
                     Frontend & Admin UI Display
```

### Role Separation Matrix

| Subsystem | Permitted Responsibilities (Intelligence / Support) | Strictly Forbidden Actions (Authority) |
|---|---|---|
| **Gemini / LLM** | • Free-text business description understanding<br>• Canonical fact extraction assistance<br>• Natural language query planning<br>• Adaptive question phrasing<br>• Explaining Engine 2 results in plain language | • Declaring `APPLICABLE`, `NOT_APPLICABLE`<br>• Overriding rule evaluation traces<br>• Inventing statutory exemptions<br>• Determining legal deadlines independently |
| **ComplianceRag** | • Ingesting official gazettes & notifications<br>• Hierarchical section/clause chunking<br>• Hybrid BM25 + dense vector retrieval<br>• Cross-encoder evidence reranking<br>• Supplying verified evidence citations | • Evaluating business applicability<br>• Filtering obligations based on generative prompts<br>• Exposing legal verdict endpoints<br>• Ingesting unauthenticated pickle caches |
| **Engine 2** | • Authoritative 3-valued Kleene AST evaluation<br>• Generating execution audit traces<br>• Resolving missing variable dependencies<br>• Emitting `DecisionResult` entities | • Making external network calls<br>• Accessing unversioned profile state<br>• Coercing `UNKNOWN` to `False` |
| **Frontend** | • Rendering canonical CIR state<br>• Capturing user profile form inputs<br>• Presenting adaptive onboarding questions<br>• Showing exact legal citations & gazette URLs | • Applying regex filters to suppress rules<br>• Calculating compliance scores locally<br>• Rendering mock data on API errors<br>• Retaining active business IDs across logout |
| **Admin Portal** | • Visualizing AST evaluation traces<br>• Inspecting fact provenance and profile versions<br>• Auditing decision runs and evidence links<br>• Curating and approving draft rules | • Querying disconnected legacy case models<br>• Altering historical decision records directly<br>• Bypassing multi-tenant authorization |

---

## 4. TENANCY & SECURITY GOVERNANCE

### Canonical Principal Resolution
Every API controller handling tenant data must execute the canonical resolution chain:
```python
def resolve_tenant_context(request, business_id, assessment_id=None):
    if not request.user or not request.user.is_authenticated:
        raise AuthenticationFailed("Authentication required.")
    
    # 1. Enforce organizational membership
    try:
        business = Business.objects.filter(
            memberships__user=request.user,
            pk=business_id
        ).select_related("owner").get()
    except Business.DoesNotExist:
        # Conceal existence from unauthorized callers to prevent UUID enumeration
        raise NotFound("Business not found.")
    
    # 2. Scope assessment if supplied
    assessment = None
    if assessment_id:
        try:
            assessment = Assessment.objects.filter(
                business=business,
                pk=assessment_id
            ).get()
        except Assessment.DoesNotExist:
            raise NotFound("Assessment not found.")
            
    return TenantContext(user=request.user, business=business, assessment=assessment)
```

---

## 5. OBSERVABILITY & TESTING STANDARDS

1. **Structured Traceability**: Every request produces a distributed `correlation_id` passed through API, orchestration, RAG retrieval, and Engine 2 evaluation.
2. **Telemetry Invariants**: Latency, token usage, retrieval depth, and rule outcomes must be emitted as structured JSON logs. Confidential business inputs (revenue, proprietary formulations) must never be logged in cleartext.
3. **Testing Prohibitions**:
   - Zero browser automation (Playwright/Selenium) in backend architectural test suites.
   - Zero dependence on live external LLM API calls during standard unit and regression testing. Mock providers with deterministic fixture responses must be used.
   - Golden regression profiles (Textile, Pharma, SaaS, Food Processing, Logistics, MedTech) must pass deterministically on every release.
