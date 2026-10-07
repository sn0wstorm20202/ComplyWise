# Azure Scenario Runtime Repair

Date: 2026-10-07  
Branch: `feature/compliance-scenario-suite`

## Scope

Repair the existing ComplyWise scenario runtime in the deployed Azure Container Apps environment. The repair does not rebuild RAG, change the Azure environment or app URLs, modify BIS/main functionality, or seed/reset demo accounts.

## Findings

- The existing backend app was running image `complywiseacr.azurecr.io/complywise-backend:f58c6af`. Importing `demo.resolver` inside that running container failed with `ModuleNotFoundError`, although the scenario resolver exists in this branch.
- The existing frontend app was running image `complywiseacr.azurecr.io/complywise-frontend:45f8f15`. The branch has later frontend changes after that image's source commit, so both app images need to be aligned to the final branch commit.
- All six demo businesses, profiles, and completed decision runs were already present in the configured database. No database seed or data update was run.
- The app's workspace resolver could restore an assessment from a previously selected business when the user switched enterprises. This could cause the workspace to snap back or show data from the wrong selected enterprise.

## Code change

`backend/apps/businesses/models.py` now resolves assessments within the currently active business. It only uses the global latest-assessment fallback if there is no active business, allowing a selected business without an assessment to remain selected for onboarding.

`backend/apps/businesses/views.py` clears the prior active assessment when the requested business changes and returns the resolved workspace state in the response.

`backend/tests/test_auth_assessment_persistence.py` adds a regression test that switches to a member business, confirms its assessment remains active, and verifies the selection after reloading the workspace.

## Verification

- Focused tests: `2 passed, 4 deselected` (`test_switching_business_does_not_restore_previous_business_assessment` and `test_workspace_switcher_persists_across_sessions`).
- `git diff --check`: passed.
- The signed-in browser's business selector exposed all six scenario businesses. Selecting each and opening its compliance page showed scenario-specific requirements and non-empty results:

| Scenario business | Action Required shown |
| --- | ---: |
| Meridian | 14 |
| VoltGrid | 11 |
| ApexBuild | 12 |
| SilkRoute | 10 |
| CloudAxis | 13 |
| Sahaya | 11 |

These are browser-visible compliance counts, not a claim that an assessment was newly submitted. No assessment was submitted during verification. The complete onboarding questionnaire submission flow was not exercised because that would write new assessment data; only the business selection and resulting compliance pages were verified in the live browser.

## Azure deployment

Existing resources retained:

- Resource group: `Storyvord-Test`
- Container Apps environment: `complywise-env`
- Container registry: `complywiseacr`
- Frontend URL: `https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io`
- Backend URL: `https://complywise-backend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io`
- Existing RAG URL: `https://compliancerag.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io/v1`

The backend's demo mode was confirmed enabled. The existing RAG health endpoint and backend/frontend health endpoints responded successfully before deployment. The frontend image build uses the existing backend API URLs from its Dockerfile. Image tags, active revisions, post-deployment health checks, and the deployed backend resolver import will be recorded below after deployment.

No RAG rebuild, infrastructure recreation, database seed, or BIS/main change was performed.

## Secrets

This report intentionally contains no secret values, credentials, tokens, or environment dumps. During earlier diagnostics, a command output exposed Azure environment values in the tool output. Rotate any credentials that may have been included in that output, then update the corresponding Azure Container App secrets and environment references through the normal secret-management procedure.

