# Architecture connection audit

Status: repository audit and targeted fixes complete, 4 October 2026; external configuration limits remain. No directory restructuring performed.

Final implementation and validation: [product-architecture-audit.md](../frontend/Reference/product-architecture-audit.md).
This document records inspected code, not an assumed deployed architecture.

## Initial map before further implementation (historical baseline)

| Stage | Actual implementation / connection |
| --- | --- |
| Authentication | `apps/accounts`: password + DRF tokens; Google authorization-code/PKCE handoff in `google_auth.py` (added in this task; external OAuth settings pending). |
| Profile / assessment | `apps/businesses`: immutable ProfileVersion; assessment stores profile, decision and discovery run links; tenant resolution through Business.resolve_safely. |
| Understanding | `domain/intelligence/orchestration.py` LLMFirstStrategy → business_understanding.py → get_llm_provider(). Canonical-input emergency understanding exists after failure. |
| Questions / answers | questionnaire.py → apps/onboarding/planner.py; persisted SmartQuestionPlan/instances; answer_interpretation.py writes profile facts. Intake capped at five. |
| Context | context_merge.py combines profile, understanding and interpreted answers; assessment stage metadata retains intermediate results. |
| Retrieval | apps/assistant/services.py retrieve_evidence: token overlap, ACTIVE Source + VERIFIED Evidence, minimum query coverage. Applicability loads published requirements/rules with jurisdiction and evidence guards. |
| Web discovery | LiveRegulatoryDiscoveryProvider → apps/ingestion/services.run_discovery → query planner → Firecrawl search → official ranking → bounded scrape → source/evidence/capture persistence → quarantined CandidateRequirement. |
| Acquisition alternative | domain/acquisition/router.py exposes Crawlee/HTTP provider; current live discovery does not call it. Browser tier metadata currently overstates actual BeautifulSoup acquisition. |
| Applicability | apps/applicability/engine.py ApplicabilityEngine evaluates published AST rules via domain/evaluation against saved ProfileVersion; saves DecisionRun/DecisionResult. |
| Insufficient coverage | synthesis.py + orchestration facade → workspace_guidance.ensure_workspace → shared provider interface → validated structured planning → WorkspaceGuidance. This task added the missing actual-workspace connection. |
| User workspace | compliance rows plus assessment-scoped document/workflow derivation, scheme/standard discovery and calendar derivation; dashboard counts stored results/events/documents/cases. |
| Human review | workflow/document review services persist reviewer decisions; ingestion/review.py records captured-source publication + audit event + assessment reevaluation. Further propagation checks pending. |

## Provider baseline (before gap fixes)

`get_llm_provider()` selects the configured class. Runtime environment selects **OpenAI**;
both OpenAI and Gemini credentials are present. Only `GEMINI_API_KEY` is configured.
No additional Gemini keys/pool/rotation setting or cooldown implementation was found.
Repository searches also found no pool/vector retrieval implementation on locally
available origin/main, V6, token-optimization-v7, Adaptive or compliance-scenario refs.

Gemini → transport ProviderError → OpenAI (when configured).
OpenAI → transport ProviderError → Gemini, but passes unsupported keyword arguments
to Gemini.complete; the resulting TypeError is swallowed and the original failure escapes.
Both directions use `_is_fallback` to avoid a cycle. Empty/malformed/refused responses
are parsed *outside* the fallback boundary and therefore bypass valid alternatives.
Missing credentials also bypass fallback. Only OpenAI records completion telemetry.

Transport retries 429/502/503/504 twice with bounded exponential sleeps. It currently
does not classify timeout/auth/network/schema failures. Raw vendor error messages can
escape into exceptions despite the documented no-response-body logging contract.

## RAG baseline and preservation boundary

The verified-evidence retrieval and downstream excerpt-to-model path exist and will
be preserved. Embedding provider interfaces and a pgvector extension migration exist,
but no embedding invocation, chunk model, vector index, BM25, hybrid search or reranker
is connected in this checkout. No external RAG service setting was found in the local
environment inventory. A deployed implementation elsewhere cannot be inferred or
replaced; its location has been requested. Do not claim vector RAG was verified.

Captured Firecrawl text is persisted in RetrievedDocument (added in this task), but
source captures only reach synthesis through extracted candidate claims. If extraction
fails, useful real captured content is lost downstream: this is a connection gap.

## Confirmed gaps to verify/fill narrowly

1. Gemini multi-key chain absent in inspected checkout; support a configuration-driven
   pool without assuming a key count, preserve the shared provider interface.
2. Provider fallback misses malformed/refused responses and missing primary credentials;
   reverse fallback has incompatible keyword arguments; no cycle may be introduced.
3. Safe failure classification and Gemini attempt/slot/final-provider telemetry missing.
4. Retrieved captures must remain usable when claim extraction/provider fails.
5. RAG errors must not bypass business-context/persisted-workspace recovery.
6. Structured-guidance generation currently retries exhausted transport failures again;
   schema retry should be distinct from provider-chain exhaustion.
7. Complete browser/API/provider tests are pending. Earlier broad suite is not passing;
   legacy tests expecting 15 questions or fabricated knowledge require correct fixtures.

## Secret-free configuration inventory

Configured: DATABASE_URL, ENABLE_PGVECTOR, LLM_PROVIDER, EMBEDDING_PROVIDER,
OPENAI_API_KEY, OPENAI_MODEL, OPENAI_EMBEDDING_MODEL, GEMINI_API_KEY, GEMINI_MODEL,
GEMINI_EMBEDDING_MODEL, FIRECRAWL_API_KEY. No credential values were printed.
Missing: GOOGLE_AUTH_CLIENT_ID / CLIENT_SECRET (Google sign-in external setup),
AZURE_STORAGE_CONNECTION_STRING (local/private storage path remains available).
Frontend environment was inspected by variable name; no provider keys were found.

## Verification record

See the final report for completed verification and current configuration.

The user subsequently updated .env with GEMINI_API1, GEMINI_API2 and
COMPLIANCERAG_URL. These were previously unrecognized by settings. They are now
connected: three Gemini slots and the existing deployed POST /retrieval/search
service. Live health reports four indexed chunks and four requirements. Local
verified-evidence keyword retrieval remains intact; the external service internals
(vector/BM25/reranking implementation) are outside this checkout and were not rewritten.
Its returned chunks are contextual material, not automatically published local rules.
