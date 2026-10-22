# Industry profiles and read latency — 22 October 2026

## Requested work
Restore the six existing industry profiles to the onboarding starter selector, research and add two useful examples, and investigate slow or timed-out dashboard/page loads on the existing Azure deployment. Sign-in retains one existing-account Fast Demo Login button.

## Reproduction and diagnosis
Live reads before this change: Meridian dashboard 16.798 seconds and repeat 15.472 seconds; directory 2.997 seconds; workspace 1.805 seconds; assessment list 2.332 seconds; business/profile/assessment reads approximately 1.9–2.2 seconds. Key bootstrap calls were sequential. These baseline responses were HTTP 200; the reported intermittent 504/501 was not reproduced in this particular sample.

Read-only profiling against the deployed database measured 135 dashboard queries and 13.155 seconds from the local profiling process. Scheme matching ran twice. Filtered related-manager calls bypassed their prefetch and issued 74 scheme-version queries. Repeated assessment, workspace and reviewer-treatment lookups added work. Initial dashboard effects could start a competing load before bootstrap selected the URL's saved business and assessment.

## Fix
- Batch active scheme versions once and select current/fallback versions in memory. Active/current semantics and authored-fixture quarantine are retained.
- Reuse one business context and one scheme match between dashboard sections.
- Reuse assessment, contextual guidance and reviewer-treatment projections only inside a single dashboard response. Scope resets on completion or error. Copies prevent enrichment in one section from changing another. No cross-request or cross-account response cache is introduced.
- Use the selected assessment's frozen profile when composing historical dashboard sections and coverage.
- Reuse the authorized workspace already included in the directory response. A valid active assessment avoids another assessment-list request. Its detail provides the frozen profile facts, removing redundant business detail and current-profile history requests.
- Honour explicit business/assessment URLs during bootstrap. Dashboard effects wait for bootstrap instead of starting overlapping loads.
- The long-running Gunicorn deployment uses Supabase's session pooler on port 5432. It previously set DATABASE_CONN_MAX_AGE=0, reopening a connection per request. The Azure runtime now uses a 60-second maximum connection age with the existing connection health checks enabled. The database inspection showed 8 sessions against a limit of 60 before this change; existing worker/thread counts and resource sizes were retained. This setting is for this WSGI/session-pooler deployment, not a blanket recommendation for ASGI or transaction-pooler deployments. See [Django connection guidance](https://docs.djangoproject.com/en/6.0/ref/databases/#persistent-connections) and [Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).

The local read-only profile after changes measured 30 queries and 4.951 seconds, with the same 14 Meridian actions. These are local measurements against the deployed database, not a claim about every live page. Post-release HTTP measurements are recorded separately.

## Profiles and research
Eight featured editable examples: Meridian pharma, VoltGrid EV charging, ApexBuild construction, SilkRoute merchant exports, CloudAxis data centres, Sahaya microfinance, HarvestLink food processing/cold chain and MediBridge medical-device import/distribution. The seven everyday starters remain in an expandable section.

The additions are a design recommendation, chosen to contrast manufacturing/storage/distribution with importing finished devices without manufacturing or clinical care:
- [FSSAI licensing](https://fssai.gov.in/business/licensing) and [FoSCoS](https://foscos.fssai.gov.in/) distinguish food-business activities. HarvestLink combines fruit processing, refrigerated storage and domestic distribution.
- [CDSCO medical-device FAQ](https://cdscomdonline.gov.in/NewMedDev/resources/app_srv/NMD/global/pdf/MD-FAQ.pdf) distinguishes importing, manufacturing, distribution and clinical activities. MediBridge imports finished monitoring devices for distribution; it does not manufacture or treat patients.
- [Django QuerySet documentation](https://docs.djangoproject.com/en/6.0/ref/models/querysets/#prefetch-related) explains why filtering related managers bypasses a prefetch, and describes Prefetch/to_attr for a filtered list.

These are fictional input templates, not licences or verified legal outcomes. No PAN, certification number, scheme eligibility or fixed legal answers are prefilled. Numbers are editable sample business facts. The additions do not create saved cases, accounts or synthetic legal decisions. Existing prepared cases and CIR archives are preserved. Explicit trade intent prevents “No imports or exports” from being mistaken for importing.

## Validation
- Full backend suite: 1,055 passed, 10 optional/integration skips.
- Thirteen frontend unit/transport tests passed, covering profile distinctions, workspace selection, bounded directory requests and job-mode compatibility.
- TypeScript passed. Targeted lint has zero errors and existing warnings.
- New tests bound scheme-version reads as the catalogue grows, preserve current/fallback selection, check projection copies and verify scope isolation between threads and after errors.
- Existing browser fixtures were updated for expandable everyday starters. Local browser fixture runs are not claimed; live browser checks are recorded below.

## Release
Code revision: 1116e903b9b6357e049eb5101acdb859e36850c7 on architecture/reconciled-core.
Image build: 39740428506.
Both Azure applications report Succeeded and use images tagged architecture-1116e903b9b6357e049eb5101acdb859e36850c7. The existing frontend and backend addresses are unchanged. The temporary registry-build credential was removed after the successful build.

Final live serial dashboard reads took 5.071 and 4.813 seconds, compared with 16.798 and 15.472 seconds before this release. With three concurrent reads, all six prepared cases returned HTTP 200 in 5.192–7.598 seconds. Three additional Meridian reads took 5.097, 5.462 and 8.739 seconds. Every saved run ID and expected action count was preserved. These are sampled API read timings, not a production capacity certification or measurements of fresh provider-driven assessments. No 504/501 occurred in these samples. The cold directory read was 5.393 seconds, so improvement is not claimed for every endpoint.

Live browser verification checked all eight profile prefills and selected states, editing the sample name, clearing the sample with “Start from my own business”, and retaining the seven everyday profiles. No assessment was submitted. The saved Meridian dashboard showed 14 actions; its document page populated 59 items and its workflow page populated 14 roadmaps. No document or workflow completion state was changed.

Evidence, including before/after JSON, query profiles, test output and screenshots, is in [the release evidence directory](architecture-evidence/read-performance-2026-10-22/).
No schema migration, account/password reset, replacement of saved assessments or infrastructure size change is included.

## Further product recommendations
1. Show a fact-change comparison in the judging walkthrough: merchant export versus manufacturing, including why a requirement changes or needs information. Use immutable assessment history and retain uncertain cases.
2. Keep evidence status, source date and coverage gaps visible beside results. Applicability and verified completion must remain distinct.
3. Establish a measured read-latency budget and a supported worker deployment for long provider-driven assessments. This release improves saved-page reads; it does not claim to eliminate provider latency or certify production capacity.
