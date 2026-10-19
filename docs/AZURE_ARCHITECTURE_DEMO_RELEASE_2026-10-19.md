# Azure architecture and judge demo release — 19 October 2026

## Destination

The existing frontend URL is preserved:

[Open ComplyWise](https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io)

Existing resource group `Storyvord-Test`, environment `complywise-env`, registry `complywiseacr`, backend `complywise-backend`, frontend `complywise-frontend` and retrieval app `compliancerag` are reused. No ingress/domain replacement, new account, password reset, database reset or unrelated BIS service update was performed.

## Release units

| Component | Image tag |
|---|---|
| API | `complywise-backend:architecture-38af647f2ddb7ced0ad2ac21f09024574252e8a3` |
| Frontend | `complywise-frontend:architecture-38af647f2ddb7ced0ad2ac21f09024574252e8a3` |
| Retrieval | `compliancerag:architecture-897c55a1ff2bd97d1e5e69ff05bbfef233e86c87` |

Images use `complywiseacr.azurecr.io/`. The core components share the same source commit. Builds ran on GitHub Actions because ACR Tasks is disabled for this subscription and automatic approval review rejected starting local Docker Desktop. The temporary registry credentials used for builds were removed afterward.

## Runtime configuration and preservation

- API `COMPLYWISE_DEMO_MODE=true`.
- `ENABLE_ASSESSMENT_JOBS=false`. The existing environment is Azure Container Apps Express, which does not support sidecar containers or Container Apps jobs. The tested synchronous API path remains enabled; no worker was deployed. See [Microsoft's feature matrix](https://learn.microsoft.com/en-us/azure/container-apps/express-overview).
- Retrieval demo fixtures remain off. Its indexed catalogue reports 55 description records, with UNVERIFIED status. Signed requests work and unsigned requests return HTTP 401.
- CIR signing uses an Azure secret reference and explicit key identifier. No signing key, provider credential, database URL, authentication token or demo password is included in this report or committed evidence.
- Five additive migrations applied successfully. A private consistent row snapshot of 68 tables / 17,870 rows and the original Azure configuration were retained outside Git before migration. The row snapshot is not a full schema/role backup or a verified restoration exercise.
- Existing account passwords and raw business facts were preserved. Only the six existing prepared assessment records were explicitly re-evaluated in demo mode. Each received a new run; previous decision archives were checked unchanged.
- Express uses its single `--latest` revision. Verify image references and the API's reported release; custom revision suffixes and traffic splitting are not supported here. Previous image/configuration references are retained for rollback; schema changes are additive.

## Judge scenarios

The original curated scenario logic remains a demonstration fixture, not proof of independently verified legal applicability. The compliance screen explicitly says so and presents the recorded scenario explanation rather than the generic missing-rule message.

| Prepared assessment | Browser action items | Open saved demo |
|---|---:|---|
| Meridian pharmaceutical manufacturing | 14 | [Open](https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io/compliance?business_id=7f27ea65-f87d-4c48-9764-ae9edb14c506&assessment_id=24b0e695-d297-4671-9183-987e42745bc4) |
| VoltGrid EV charging | 11 | [Open](https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io/compliance?business_id=8a11ea65-f87d-4c48-9764-ae9edb14c507&assessment_id=1a048026-7227-4dea-8f14-9e13edccd8a6) |
| ApexBuild construction | 12 | [Open](https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io/compliance?business_id=9b22ea65-f87d-4c48-9764-ae9edb14c508&assessment_id=bf1e2991-2287-4f6b-a895-fd95293f6998) |
| SilkRoute textile exports | 10 | [Open](https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io/compliance?business_id=ac33ea65-f87d-4c48-9764-ae9edb14c509&assessment_id=b434d483-92a1-4d14-82af-08387881cb63) |
| CloudAxis data centre | 13 | [Open](https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io/compliance?business_id=bd44ea65-f87d-4c48-9764-ae9edb14c510&assessment_id=b1e67d12-a911-400b-a655-406a19d473ed) |
| Sahaya microfinance | 11 | [Open](https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io/compliance?business_id=ce55ea65-f87d-4c48-9764-ae9edb14c511&assessment_id=e8c36901-c597-4901-8f28-7f4a511be87b) |

Use Reviewer → Use Demo Reviewer Credentials → normal sign-in. The existing designation is preserved. The links identify the prepared assessment explicitly; newer unfinished assessments remain available separately.

## Corrections found during live verification

- The recent-business list previously truncated at 20, excluding older demos and causing repeated selection fallback. Authorized requested/active businesses are retained. The administrator can access 432 businesses, so bootstrap loads one page; the switcher searches and loads additional pages on demand. It does not fetch the whole directory before showing a dashboard. Inaccessible selections return 404, and switching a business navigates to its own URL.
- Curated results were shown with a generic no-rule-matched explanation. Their saved explanation and demo provenance are now explicit.
- Dashboard history links previously ignored their assessment parameter. The selected assessment is now restored through the existing authorized workspace API, with a guard against repeated rejected requests.
- Dashboard reads fetched government portals for every applicable result, exceeding request timeouts. Those reads now resolve recorded portal information without network acquisition. A regression test exercises the non-test runtime setting and forbids acquisition.

## Verification evidence

- Full backend suite: 1,039 passed, 10 explicit skips. Focused suite: 57 passed. The four PostgreSQL checks skipped in the SQLite suite were verified in the earlier architecture increment; the deployed database is PostgreSQL 17.6. No new live concurrency certification is claimed here.
- TypeScript checks passed. Targeted lint reported no errors and 10 warnings. Linux production image builds passed in GitHub Actions.
- A frontend regression test simulates a 432-business account and confirms bootstrap performs one directory request, with subsequent pages/search loaded explicitly.
- All six live compliance pages displayed the correct company, expected action count, populated requirements and explicit demo label. Screenshots and machine-readable results are in `architecture-evidence/azure-2026-10-19-browser/`.
- Additional browser inspection: Meridian's document repository displayed 59 checklist items; VoltGrid's workflow displayed 11 roadmaps and the CEA charging-safety steps.
- The final dashboard reopened Meridian's explicitly requested saved assessment and displayed 14 actions. Directory search reached the older Sahaya business without downloading the whole 432-business directory. Clicking that result changed the URL, selected Sahaya's prepared assessment and displayed 11 actions. The designated account was then restored to Meridian's prepared assessment.
- Each prepared assessment's live compliance response retained demo origin, and its dashboard's saved CIR passed RFC 8785/HMAC integrity verification. The archive remains signed by its original release; display and directory changes do not rewrite it.
- Health, image, live API and CIR verification results are recorded separately in `architecture-evidence/azure-2026-10-19-*`.

No live Google OAuth completion, arbitrary new-business/provider journey, file-upload/OCR exercise, government filing, authority approval, backup restore or production load test is claimed by these checks.
