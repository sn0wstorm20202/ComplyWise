# Post-Merge Questionnaire Regression Report

## Root cause

The live questionnaire saved all five answers. Its next request was compliance synthesis, after successful regulatory discovery. The UI returned to Smart Questions because that synthesis request failed. A deployment audit also found version skew: the frontend runs image `31c9359`, while the backend runs image `4faf3b5`. The merge contains 55 backend files changed relative to `4faf3b5`, so the current Azure frontend/backend pair is not the merged commit pair. This production skew is a concrete compatibility risk and must be removed before claiming the live regression is fixed.

Two defects made this path fail and made its retry unsafe:

1. `LiveComplianceSynthesisProvider` runs deterministic evaluation and then calls `ensure_workspace` to create optional contextual guidance. `ensure_workspace` re-raises a `ProviderError` when no deterministic result is `APPLICABLE`. The synthesis endpoint maps uncaught exceptions to generic `INTERNAL_ERROR`, and the frontend discarded the structured API error. The production state (completed deterministic DecisionRun, no workspace row, no synthesis stage) localizes failure to this post-evaluation boundary and matches the optional-guidance failure path. Because Azure is running a mismatched backend image, the precise production exception may also depend on that older backend. The underlying provider exception itself was not captured, so its exact provider-side cause is unverified.
2. Reposting an already-saved answer created another immutable profile version. Synthesis then created another `DecisionRun` for that new, otherwise unchanged profile snapshot.

The live test assessment confirmed the sequence: five answers persisted; its orchestration state contained `REGULATORY_DISCOVERY` but no `COMPLIANCE_SYNTHESIS`; a deterministic DecisionRun had 63 `NOT_APPLICABLE` and 30 `UNVERIFIED` results; no workspace guidance row existed. After the user retried, the same assessment had two DecisionRuns against profile versions 7 and 8. This confirms the duplicate-answer/profile-version/DecisionRun retry bug. No Meridian or VoltGrid assessment was modified.

The frontend sends `POST /api/v1/assessments/{run_id}/compliance-synthesis/` with an empty JSON object after `POST /api/v1/assessments/{run_id}/regulatory-discovery/`. The backend maps uncaught exceptions to HTTP 500 / `INTERNAL_ERROR`; the production response status and body were not captured directly. The browser automation surface does not expose network response events, and Azure log streaming failed with an Azure CLI `eventStreamEndpoint` error. Therefore the root boundary is identified, but the precise production wire response and provider-side exception remain unverified.

## Pre-merge and post-merge behavior

Before the merge, the onboarding UI swallowed orchestration errors and used a legacy analysis fallback. That could mask failures and show results without a successful staged analysis. After the merge, synthesis became a required step; optional workspace guidance errors surfaced as a failed onboarding step. The merged architecture remains in place. The fix keeps workspace guidance optional while preserving deterministic results and truthful `NEEDS_INFORMATION` outcomes.

## Changes

- `backend/domain/intelligence/workspace_guidance.py`: a workspace `ProviderError` now yields empty contextual-guidance collections and allows authoritative synthesis to finish. It does not invent or claim legal requirements.
- `backend/domain/intelligence/answer_interpretation.py`: answer persistence is atomic and locks the assessment; resubmitting the same normalized answer no longer creates a profile version.
- `backend/domain/intelligence/synthesis.py`: retries reuse the assessment’s existing DecisionRun when it matches the same immutable profile version.
- `backend/tests/test_api_orchestration_step02.py`: one focused regression test covers duplicate final-answer submission, optional workspace-provider failure, synthesis completion, and decision-run reuse.

## Verification

- Live Playwright repro before the fix: Business Profile, Products & Activities, business understanding, question generation, and five answer submissions succeeded. Final submission entered Regulatory Analysis, then returned to Smart Questions with the error banner. The same analysis retry failed again.
- Live database readback for the synthetic `Neighbourhood Kitchen` test assessment confirmed the persisted sequence described above. Its business ID is `e3ac2ad7-05d7-4d98-b286-a04e332f28fd`; its assessment ID is `5eb4d1e5-8771-4423-b7bc-2ad1636a57d3`.
- Focused regression and neighboring suites: `56 passed` across `test_api_orchestration_step02.py`, `test_workspace_guidance.py`, and `test_workspace_cache_grounding.py`.
- `git diff --check`: passed.
- Post-fix live Playwright retest, Meridian Pharma, EV Charging, Construction, Textile Export, Data Centre, Microfinance, and Admin parity are pending a coherent backend/frontend deployment and retest. No claim is made that these acceptance checks have passed.

## Git and deployment

- Branch: `feature/compliance-scenario-suite`
- Base deployment merge: `31c9359`
- Fix commit: `ba0549f` (`Fix questionnaire completion after orchestration`)
- Azure deployment: blocked. Current images are `complywise-frontend:31c9359` and `complywise-backend:4faf3b5`. Both `az acr build` and Container Apps source deployment were rejected because ACR Tasks are disabled for `complywiseacr` (`TasksOperationsNotAllowed`). Local Docker Desktop was started, but its service is stopped and cannot be opened from this session.
- Main and BIS were not modified.
