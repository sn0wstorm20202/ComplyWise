# FRONTEND_API_WIRING.md — ComplyWise

## Verified Live API Reference for the Frontend Team

**Companion to:** `FRONTEND_INSTRUCTIONS.md` (design contract).
**Purpose:** the backend integration contract — every statement below was
exercised end-to-end against the running stack (see `PROJECT_EXECUTION.md`,
"V2 Dynamic Prototype Audit" entry, for the verification record).

---

## B1. Base URL & environment switching

- Backend API root locally: `http://127.0.0.1:8000/api/v1` (Django dev server).
- The frontend reads exactly one env var: `NEXT_PUBLIC_API_BASE_URL`
  (consumed once in `frontend/lib/api/client.ts`).
  - Local: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1`
  - Deployed: `NEXT_PUBLIC_API_BASE_URL=https://<host>/api/v1`
  - Set it in `frontend/.env.local` and restart `npm run dev` (or rebuild).
- Never hardcode the API origin in a component.
- API responses use the canonical envelope:
  success `{ "data": ..., "meta": ... }`, error `{ "error": { code, message, details[] } }`.
  `lib/api/client.ts` unwraps `data` and throws on the error shape already.

## B2. Authentication flow

1. `POST /auth/register` `{email, password, full_name}` → `{user, token}`
2. `POST /auth/login` `{email, password}` → `{user, token}`
3. Store the token (this app: `localStorage["complywise_token"]`) and send it as
   `Authorization: Token <token>` on every request — `client.ts` does this.
4. `POST /auth/logout` invalidates the token server-side; clear local storage.
5. `GET /auth/me` returns the current user.
6. Seeded demo account on the team database:
   `compliance.officer@example.com` / `CompliancePass123!`
   (the Sign-In screen's "Fast Demo Login" uses it and pre-registers if absent).
7. `GET /profile/variables` is intentionally public (schema, not user data);
   **everything else requires a token**.

No cookies are used; CORS is restricted to configured origins server-side.

## B3. The primary journey, endpoint by endpoint

| Screen | Call | Request → Response (key fields) |
|---|---|---|
| 03 Business Profile | `POST /businesses` then `POST /businesses/{id}/profile` | `{name}` → `Business`; `{variables: {<key>: {value, origin}}, change_note?, carry_forward?}` → `BusinessProfileVersion` |
| 03.5 Variable schema | `GET /profile/variables` | 19 canonical variables (V01–V19): `code`, `key`, `label`, `data_type`, `options[]`, `why_it_matters`. Build forms from this — never hardcode the registry. |
| 04 Products & Activities | `POST /businesses/{id}/onboarding/products-activities` | `{product_description, import_export_intent?}` → `{profile_version, detected_activities[], import_export_intent}` |
| 05 Smart Questions | `GET /businesses/{id}/onboarding/questions` | `{questions[], total_missing, known_variables_count, unresolvable_variables[]}`; each question: `variable_key`, `question` (ready prompt), `data_type`, `options[]`, `why_it_matters`, `required`, `rule_dependency_count`, `current_value` |
| 05 answers | `POST /businesses/{id}/onboarding/answers` | `{answers: {<variable_key>: value}}` → `{message, profile_version}`. **Omit unanswered questions entirely** — an omitted variable stays UNKNOWN in the engine; never submit `0`/"" for a question the user did not answer. |
| 05b progress | `GET /businesses/{id}/onboarding/status` | `{has_profile, has_products, has_evaluation, variables_count, profile_version, latest_run_id, current_step}` |
| 06 Regulatory Analysis | `POST /businesses/{id}/evaluate` | `()` → `DecisionRun {id, status, evaluation_date, results: DecisionResult[]}`. Synchronous — a spinner is honest, fake staged progress is not. |
| 06b run history | `GET /businesses/{id}/decisions` · `GET /businesses/{id}/decisions/{run_id}` | paginated runs / one run with full results |
| 07 Dashboard | `GET /businesses/{id}/dashboard` | `DashboardSummary` (see types file) |
| 08 Compliance | `GET /businesses/{id}/compliance?status=&authority=&category=` | `{count, requirements[]}` |
| 09 Requirement detail | `GET /businesses/{id}/compliance/{requirement_id}` | `RequirementDetail`: `why_it_applies{summary, matched_rule_id, rule_evaluations[]}`, `what_you_need`, `what_to_do_next`, `statutory_evidence[]` |
| 10 Documents | `GET /businesses/{id}/documents` | checklist derived from APPLICABLE requirements; `upload_available: false` |
| 10b Upload | `POST /businesses/{id}/documents/upload` | **501 NOT_CONFIGURED** — no storage in this milestone |
| 11 Workflows | `GET /businesses/{id}/workflows` | `{available: false, reason, requires}` — render `CapabilityUnavailableNotice` |
| 12 Calendar | `GET /businesses/{id}/calendar` | renewal-cycle events only; response carries `covers` / `not_covered` |
| 13 Schemes | `GET /businesses/{id}/schemes` | `{available: false, ...}` — no scheme rules ingested yet |
| 14 Standards | `GET /standards/search?query=` | published STANDARD-category requirements with citations; `catalogue_available` flag |
| 15 Updates | `GET /regulatory-updates` | `{available: false, ...}` — no change feed ingested |
| 15 Assistant | `POST /assistant/chat` `{prompt}` | `{answer, citations[], grounding_level, answer_generated, disclaimer}` |

Decision result shape (`DecisionResult` inside a run):

- `requirement_id`, `requirement_name`, `status` (enum below)
- `matched_rule` (id/version/type via `explanation_trace.matched_rule_*`)
- `explanation_trace.evaluations[]` — every rule considered with its truth value
- `explanation_trace.reason` — machine reason for unverifiable/jurisdiction cases
- `evidence_refs[]` — `{evidence_id, source_id, source_title, authority, locator, excerpt, verification_status}`

## B4. Enumerations (guarded by `backend/tests/test_status_contract.py`)

- `ApplicabilityStatus`: APPLICABLE | NOT_APPLICABLE | NEEDS_INFORMATION | CONFLICT_REVIEW | UNVERIFIED
- `DecisionRunStatus`: RUNNING | COMPLETED | FAILED
- `VariableOrigin`: USER_PROVIDED | DERIVED | LOOKUP
- Assistant grounding: GROUNDED_IN_CITED_EVIDENCE | NO_MATCHING_EVIDENCE |
  CITATIONS_ONLY_NO_LLM_CONFIGURED | CITATIONS_ONLY_LLM_UNAVAILABLE
- Workflow/Document status unions live in `frontend/types/index.ts`.

NEEDS_INFORMATION / CONFLICT_REVIEW / UNVERIFIED must never render as
"Not applicable" (PRD §17, P4).

## B5. What is real vs. placeholder (do not fake the placeholders)

| Surface | State |
|---|---|
| Onboarding → smart questions → analysis → results → dashboard | **Live**: deterministic rule engine over published knowledge |
| Compliance list + requirement detail + evidence trace | **Live** |
| Documents checklist | Real derivation from APPLICABLE requirement metadata; upload 501 |
| Calendar | Real renewal cycles, only where knowledge records `renewal_period_years` |
| Standards search | Real published STANDARD-category knowledge |
| Workflows, Schemes, Regulatory updates | Honest `available: false` — render `reason`, never mock rows |
| AI Assistant | Citations always; generated prose only when an LLM key is configured |
| Dashboard "Benefits Identified" | `null` → render "Not yet calculated" |

## B6. Error states you must render

- `401` `NOT_AUTHENTICATED` → route to Sign In.
- `404` `NOT_FOUND` → business/requirement missing (also fires for another
  tenant's business — isolation is server-enforced).
- `400` `VALIDATION_ERROR` with `details[].field/messages` — e.g.
  `"Not a recognised business profile variable."` means a key outside the
  V01–V19 registry was sent; fix the form against `GET /profile/variables`.
- `503` `PROVIDER_MISCONFIGURED` (assistant) → show "AI provider is
  misconfigured"; the rest of the app is unaffected.
- Network failure → `ErrorState` with retry.
- `available: false` capability responses are **not errors** — render the reason.

## B7. Backend configuration the frontend can rely on

- `GET /api/v1/health/ready` reports `checks.integrations` (booleans only) and
  `checks.providers` (selected LLM/embedding provider + status). Safe to read.
- Provider switching is backend-only env config (`LLM_PROVIDER`,
  `EMBEDDING_PROVIDER`) and never changes API response shapes.

## B8. Regulatory Source Discovery (Firecrawl Integration)

- Typed client methods available on `api.discovery` (`frontend/lib/api/discovery.ts`):
  - `api.discovery.search(businessId, query, limit)` → calls `GET /api/v1/businesses/{id}/onboarding/discover/search`. Performs server-side discovery over official government sources (`.gov.in`, `.nic.in`) without leaking Firecrawl credentials.
  - `api.discovery.submit(businessId, sources)` → calls `POST /api/v1/businesses/{id}/onboarding/discover/submit`. Stashes discovered URLs as `DISCOVERED` sources pending administrative verification.

