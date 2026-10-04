# ComplyWise architecture and product audit

Completed repository audit and targeted fixes: 4 October 2026. External configuration limits are listed below. Phase B directory cleanup was not performed. The existing Next.js/React/Django/PostgreSQL architecture remains.

## Architecture confirmed

- Password registration/login/logout and DRF tokens remain. Tenant membership guards business, assessment, case, document and reviewer access. Google code/PKCE sign-in is implemented alongside password auth.
- BusinessProfileVersion is immutable. Assessment owns its saved profile, understanding, questions, discovery and decision-run references. Answers create and link the next profile snapshot.
- Business understanding and answer interpretation use the shared LLM interface. The current planner asks zero to five missing, decision-critical questions; it reserves room for sector-specific discovery facts instead of spending every slot on generic rules. Editable starter profiles are optional.
- ApplicabilityEngine evaluates published AST rules, jurisdiction, evidence and precedence against the saved snapshot. DecisionRun/DecisionResult remain the source of deterministic applicability. Generated suggestions and reviewer operational treatment do not overwrite these results.
- The normal workspace combines deterministic decisions, assessment-scoped planning suggestions and explicit reviewer assignments. Documents, workflows, standards, schemes, calendar, notifications and dashboard retain existing routes and integrations.
- Additive migrations for Google identity/handoff, WorkspaceGuidance and RetrievedDocument were applied to the configured PostgreSQL database. Runtime readiness confirms PostgreSQL and pgvector; there is no SQLite fallback in the running server.

## Actual gaps found and fixed

| Gap | Small correction and evidence |
| --- | --- |
| Reverse OpenAI-to-Gemini fallback passed incompatible arguments; missing credentials/malformed output bypassed alternatives | Compatible provider arguments, response validation inside the attempt boundary, cycle guard, provider matrix tests. |
| Multiple Gemini slots were not loaded | Dynamic ordered pool, deduplication and temporary failure cooldown. The updated .env uses GEMINI_API1 and GEMINI_API2; both aliases are now loaded alongside GEMINI_API_KEY. |
| Vendor errors could expose response bodies; Gemini attempt telemetry was missing | Safe error classification, provider/slot/model/latency/usage/fallback telemetry; no API keys, vendor bodies or prompts logged. |
| COMPLIANCERAG_URL was present but not read or connected | Connected the existing deployed POST /retrieval/search contract to discovery and contextual workspace generation; did not rebuild that service. |
| Remote search ignored the supplied business state | Local source-jurisdiction guard excludes recognized other-state titles/authorities; remote verification remains explicitly reported metadata. |
| Unsupported domains ended without a useful workspace | Persisted structured LLM guidance after retrieval/evaluation, integrated into existing workspace APIs. Model omissions now produce linked preparation aids for accepted suggestions. |
| Dashboard and facade could use another assessment or current profile | Snapshot-scoped decision/discovery selection, client stale-response guards, saved profile serialization and tenant tests. |
| Onboarding forced fifteen questions and generic questions crowded out contextual facts | Normal path capped at five, no padding, known-fact suppression, compact selection and persisted answer/retry behavior. |
| Standards/schemes could appear populated from generated or static regulatory data | Verified standard matching requires a real applicable published decision; production fabricated snapshot/catalogue fallback disabled. Contextual suggestions remain suggestions. |
| Firecrawl text disappeared downstream if extraction returned no claims | Saved normalized captures and original source versions survive extraction failure and reach interpretation. |
| Acquisition router was bypassed and browser metadata overstated actual acquisition | Firecrawl scrape failures use the existing router; optional real browser tier or real HTTP acquisition, official redirect checks and PDF extraction. |
| Documents could lack real saved files, overwrite another checklist upload or imply approval | Versioned bytes/storage references, safe storage failure, signed preview access, distinct preliminary checks and human review. |
| Metadata-only inputs fabricated OCR contents; document scan bypassed selected provider | Removed simulated file text, connected scan to shared provider/schema boundary, added existing extraction dependencies and real OCR/PDF tests. Preliminary success is not human verification. |
| Reviewer decisions/assignments did not consistently reach user actions | Scoped saved treatment, reason/audit history, publication plus linked-assessment reevaluation, catalogue assignment visible in compliance/documents/workflows/dashboard without a fake rule. |
| Browser filing/workflow state could be cosmetic | Actual document configuration/case/workflow events persist; step bounds and completion/reopen validation; no fabricated deadlines or procedures. |
| Google sign-in absent; duplicate registration wording wrong | Browser-bound code/nonce/PKCE and single-use token handoff, verified-email account linking, case-insensitive uniqueness, exact duplicate message. Forgot-password UI removed. |

## Provider fallback: real runtime order

Configuration remains **LLM_PROVIDER=openai**. Three distinct Gemini slots are loaded from the updated backend environment:

```text
Current: OpenAI primary → Gemini slot 1 → Gemini slot 2 → Gemini slot 3 → controlled failure
When LLM_PROVIDER=gemini:
Gemini slot 1 → Gemini slot 2 → ... → configured slot N → OpenAI final fallback
```

No provider selection or secret was changed in .env. The number of slots is discovered dynamically, not hardcoded. Every request starts with the configured primary; eligible failed Gemini slots enter a process-local cooldown (default 60 seconds). Authentication, rate-limit, timeout, network and unavailable-provider failures can skip a slot temporarily. Malformed JSON/schema/refusal output advances to the next configured option. Invalid requests and application budgets are not indiscriminately retried. Reverse fallback uses a cycle guard.

The shared transport retains bounded retries for transient HTTP 429/502/503/504. Multi-slot Gemini uses one transport attempt per slot, avoiding retry multiplication. OpenAI/Gemini record safe attempt metadata. Embeddings retain their own configured provider; completion rotation does not substitute incompatible embedding vectors. Optional Grok remains an explicitly selected separate provider, outside this automatic chain; it has no equivalent rotation/attempt telemetry in this checkout.

All three configured Gemini slots passed separately bounded live requests (about 3.42 / 0.91 / 1.28 seconds). The configured OpenAI provider passed readiness and the actual arbitrary-business workflow.

## Retrieval / RAG

Two actual paths coexist:

1. **Preserved local path:** ACTIVE Source + VERIFIED Evidence → token-overlap relevance → numbered source excerpts → assistant or contextual interpretation. Published structured rules use the separate deterministic engine.
2. **Existing deployed service:** COMPLIANCERAG_URL → POST /retrieval/search with query/business context → validate returned chunks, scores and source jurisdiction → discovery metadata → contextual generation → persisted WorkspaceGuidance metadata. Empty/failed retrieval continues with local evidence, captures and business facts.

Live /health reports four indexed chunks and four indexed requirements, index version 2026.09.1. A Gujarat factory query returned its original source/chunk; the same state-specific source was rejected for Maharashtra. A Kerala workshop query returned no passages and continued through the real application pipeline.

External source IDs/excerpts are retained as supplied, never invented. Remote VERIFIED is recorded as reported_verification_status; it does not automatically publish a local RuleVersion or verified Evidence. Unknown/nonofficial hyperlinks are omitted. Guidance does not manufacture official URLs/citations.

The deployed service's embedding, BM25, hybrid search and reranking internals are not present in this checkout and cannot be certified from its HTTP contract. Local embedding interfaces and pgvector exist, but a local chunk/vector index is not wired. Neither path was replaced with a newly invented RAG implementation.

## Error propagation

```text
Frontend → scoped API → assessment/application service → orchestrator
→ shared provider → configured attempts and validation → requesting stage
→ domain processing → snapshot-scoped persistence → normal API response
```

| Boundary | Handling |
| --- | --- |
| HTTP/provider | Classifies failures safely. Eligible slot/provider fallback executes before final propagation. |
| JSON/application schema | Understanding, question planning, workspace and document interpretation validate inside the provider boundary, allowing another configured provider. |
| RAG service/local search | Bounded retrieval failure is recorded and business/capture context remains usable. It does not exhaust or bypass LLM fallback. |
| Firecrawl/extraction | Per-call budget, actual acquisition alternative, retained captures and same-profile persisted recovery. No auto-publication of claims. |
| Workspace generation | Reuses saved guidance for the same snapshot; no provider calls on workspace GET. Does not repeat an exhausted transport chain. Preserves usable deterministic decisions during an interpretation outage. |
| Final exhaustion | Arbitrary-business generation returns controlled 503/retry after available providers fail. Saved inputs remain. An actual system failure is distinct from limited knowledge coverage. |
| Document precheck | Real files remain queued for human review when extraction/interpretation is technically unavailable. Storage failure is a safe 503, never a successful fake upload. |
| Frontend | Loading, retry, stale response rejection and actual errors remain visible; no replacement demo data. |

## Firecrawl and ingestion

Query planning → independent bounded official searches → ranking/official-domain checks → bounded scrape → acquisition alternative if necessary → normalized content/hash/version → RetrievedDocument → verbatim claim extraction → quarantined candidate/evidence → explicit reviewer publication → rule evaluation.

Recent completed same-profile runs are reused (one-hour primary reuse; persisted recovery checks a 24-hour window). Failed runs retain audit information. Original source identities/versions are deduplicated; discovery does not silently publish generated knowledge.

Live Firecrawl search returned official candidates. A live scrape exceeded the 45-second call budget; it was not reported as a scrape success. The existing HTTP acquisition alternative successfully fetched the official BIS page (HTTP 200, 3,807 normalized characters, about 2.08 seconds). Offline tests cover scrape failure recovery and rejecting unofficial redirects. Optional Python Crawlee/browser runtime is not installed; HTTP acquisition works. Windows OCR is installed and real image/orientation tests pass; pypdf handles real vector-PDF extraction. Other operating systems need an available OCR engine for scans.

## Reviewer decisions and workspace integrity

Reviewer publication requires a valid captured passage/source and AST, records identity/reason/audit history, and reevaluates the linked assessment. Operational CONFIRMED_REQUIRED / NOT_REQUIRED treatment affects user actions while preserving saved engine truth. Manual catalogue assignments produce HUMAN_REVIEW_RESULT actions, not fabricated deterministic results. Human document approval, queries and rejection persist and propagate; stale submissions cannot approve a newer upload.

Documents store actual bytes and versions. Automated inspection is preliminary; only human review sets document verification. Workflows record actual steps/case events. Calendar and alerts derive from recorded dates/events; the application does not invent a due date to fill a widget.

## Validation

| Check | Result |
| --- | --- |
| Full backend pytest | **632 passed, 4 skipped**, 31.30 seconds. The skips are opt-in live checks, not hidden functional failures. See docs/backend-validation.txt. |
| Actual-provider arbitrary business | **1 passed**, 34.49 seconds, after connecting deployed RAG. Understanding → up to five questions → answers → discovery/retrieval → structured guidance → saved compliance/documents/workflows API reads. Isolated test records; no published fake knowledge. |
| Provider matrix | Primary success; first/second failures; three-slot success; exhausted Gemini to OpenAI; all fail; missing primary key; malformed/schema/refusal output; cooldown; reverse fallback; safe errors. HTTP failures mocked; rotation/persistence/application code real. |
| RAG / Firecrawl / API | Retrieved passage reaches model; empty/failing retrieval still plans; other-state chunks filtered; captures survive empty extraction; scrape failure uses actual alternative/persisted context; successful fallback persists; final failure controlled. |
| Covered / hybrid knowledge | Published applicability and evidence precedence, explicit full coverage skips contextual generation, partial coverage retains deterministic results and suggestions, unrelated standards remain absent. |
| Human review/auth/assessment | Included in full suite: persistence, audit, propagation, tenant/snapshot isolation, Google handoff/replay/account linking, exact duplicate message, answer idempotency. |
| Frontend unit checks | **13 passed**. Legacy unused preset-data tests remain; actual intake behavior is tested separately. |
| Browser product tests | **19 passed**, installed Chrome; API fixtures, keyboard/modal focus, mobile navigation, upload/review/error behavior, standards/compliance provenance, desktop/tablet/mobile and reduced motion. |
| Landing regression | **2 passed**, desktop/mobile: ivory CSS, floating navigation, visible headline/CTA and no runtime error/overflow. Landing architecture preserved. |
| Next build / TypeScript | Passed; all **39 routes** compile. Browser tests cover specified routes/interactions, not every possible state of every route. |
| ESLint | **0 errors, 421 warnings**. Warnings retained for the deferred cleanup phase. |
| Django checks / migration drift / dependency consistency | Passed; no pending model migration; pip check reports no broken requirements. |
| Runtime | Native backend 127.0.0.1:8000 and frontend localhost:3000; liveness/readiness/home HTTP 200. PostgreSQL/pgvector healthy. No Docker. |
| Patch whitespace | git diff --check passed. |

## Environment and external configuration

No secret values were printed, copied into frontend code or changed in .env.

| Setting | Status / purpose |
| --- | --- |
| DATABASE_URL / ENABLE_PGVECTOR | Configured; live PostgreSQL and extension healthy. |
| OPENAI_API_KEY / OPENAI_MODEL | Configured; live generation passed. |
| GEMINI_API_KEY / GEMINI_API1 / GEMINI_API2 / GEMINI_MODEL | Configured; three distinct slots, all live requests passed. |
| OPENAI_EMBEDDING_MODEL / GEMINI_EMBEDDING_MODEL / EMBEDDING_PROVIDER | Configured interfaces; local vector index remains unwired. |
| COMPLIANCERAG_URL | Configured; deployed health and actual search passed. |
| FIRECRAWL_API_KEY | Configured; live search passed, one live scrape timed out. |
| GOOGLE_AUTH_CLIENT_ID / GOOGLE_AUTH_CLIENT_SECRET | **Missing**; required for real Google sign-in. Calendar credentials do not automatically configure sign-in. |
| GOOGLE_AUTH_REDIRECT_URI / GOOGLE_AUTH_FRONTEND_CALLBACK_URL | Local defaults are present; set explicit matching values for deployment. |
| GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET | Configured. |
| GOOGLE_CALENDAR_REFRESH_TOKEN / GOOGLE_CALENDAR_ACCESS_TOKEN | **Missing**; calendar delivery needs user authorization/token configuration. In-app calendar continues to work. |
| EMAIL_HOST_USER / EMAIL_HOST_PASSWORD | Configured; SMTP delivery not live-tested in this audit. |
| AZURE_STORAGE_CONNECTION_STRING | Missing optional Azure setting; existing private/local document-storage alternatives remain. |

Exact Google sign-in variables:

```dotenv
GOOGLE_AUTH_CLIENT_ID=<Google OAuth web client ID>
GOOGLE_AUTH_CLIENT_SECRET=<Google OAuth web client secret>
GOOGLE_AUTH_REDIRECT_URI=http://127.0.0.1:8000/api/v1/auth/google/callback
GOOGLE_AUTH_FRONTEND_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

Create/configure a Google OAuth Web application, enable the consent screen/test users as needed, and authorize the exact backend redirect URI above. The frontend handoff URL is a separate application setting. Production requires the corresponding HTTPS backend/frontend callbacks and trusted origins. Live Google sign-in remains untested until that external setup is supplied; mocked security/account tests pass. Existing Calendar client credentials may be reused only if that client is deliberately configured for these redirect/scopes.

## Remaining limitations

- Remote RAG internals and broader corpus/source quality are external; four indexed chunks do not imply universal regulatory coverage. Source publication and production knowledge maintenance remain necessary.
- Correcting one published candidate reevaluates its linked assessment. A bulk re-evaluation of every historical tenant assessment is not silently performed.
- Provider cooldown/attempt telemetry is process-local, not a durable cross-worker monitoring service. No unnecessary service was introduced.
- Unsupported businesses receive conditional planning suggestions. Missing real statutory dates legitimately leaves calendar/alert sections without invented events. Schemes/standards appear only where relevant.
- Live Google OAuth, Calendar delivery, SMTP delivery and optional Crawlee browser acquisition require the external configuration/runtime described above. A native Next production-start warning about the existing standalone output setting is nonblocking; HTTP/browser checks passed.
- No claim is made that every possible external provider or legal domain was tested live. The deterministic suite and explicitly listed live checks are the evidence.

## Intentionally not changed

Existing architecture preserved; working local retrieval and the deployed RAG service preserved; configured provider selection preserved; Gemini/OpenAI fallback completed without replacing the provider architecture; deterministic AST engine preserved; password authentication preserved; database relationships preserved with additive migrations. No framework migration, broad service rewrite, directory restructuring, dead-code cleanup, commit or GitHub push was performed. The separate codebase-cleanup prompt remains a future task.

Architecture diagram: ../../docs/backend-architecture.mmd. Initial inspected baseline: ../../docs/architecture-gap-audit.md. Progress/resume history: task-progress.md.
