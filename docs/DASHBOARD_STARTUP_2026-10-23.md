# Dashboard startup and loading feedback — 23 October 2026

## Findings and design

The earlier read budget covered individual saved-page API calls, not the browser's entire startup chain. The browser awaited authentication, profile home/workspace selection and sometimes an assessment list before requesting dashboard data and assessment detail. Normal warm API measurements alone cannot establish an end-to-end browser loading time or reproduce every reported 30–40 second wait.

The pre-change API check measured auth/me at 1.631 s, profile home at 2.635 s, assessment detail at 1.278 s and dashboard at 4.595 s. Assessment detail/dashboard ran in parallel in the old client, but authentication and profile-home reads preceded them. A browser baseline was still unready at the end of a 13.666 s observation; the next observation was much later, so it is not an exact baseline completion measurement.

Two additional code findings were independent of network conditions: document graph aggregation performed one latest-submission query per document requirement, and the HTTP client's timer ended at response headers instead of covering JSON body consumption. Supplying an external cancellation signal also bypassed the timeout's controller.

The structural fix follows [React's guidance on avoiding effect-driven request waterfalls and stale responses](https://react.dev/reference/react/useEffect#fetching-data-with-effects):

- `GET /api/v1/user/workspace-bootstrap` resolves one authorized business/assessment, its exact immutable profile variables and the existing dashboard projection. The directory is fetched after the selected workspace becomes ready. The ordinary evaluator, saved CIRs and provider execution path are unchanged.
- Each startup read is server-authenticated. Explicit business and assessment selections are checked together; a stale browser cache cannot authorize a business or override a valid saved workspace. Responses are private/no-store. No shared cache of tenant results was added.
- With an existing token, the bootstrap may run alongside auth/me. The later auth state update does not restart that load. Superseded reads are cancelled, and both request generation and token identity must still match before applying any response.
- The selected assessment is persisted through the explicit workspace API after rendering, preserving the old dashboard's resume behaviour. That write and directory refresh do not block the graphs. A live historical deep-link check confirmed the selected older assessment was retained in the server workspace.
- Workspace widgets use four bounded queries: daily event counts, the latest ten events, latest document submissions, and case counts. Old document versions do not inflate totals or verified percentages.
- The HTTP deadline now includes the response body and remains effective alongside caller cancellation. Dashboard bootstrap has a 20 s request deadline; failures leave the loading state and expose Retry. Increasing timeouts is not the performance fix.

## Loading feedback

The loading component has a CSS shimmer, spinner, visible loading text, a live elapsed-seconds counter, and a longer-wait message after eight seconds. The dashboard placeholder follows the header/metric/graph layout. It never displays a made-up completion percentage.

The first release's live test browser reported `prefers-reduced-motion: reduce`, which suppressed both the old pulse and the new CSS motion. Its elapsed counter provided activity, but the rectangles remained static. The follow-up below supersedes that loading behaviour. Status text uses a polite live region; the changing numeric timer is hidden from assistive announcements to avoid one announcement every second. See [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

### Follow-up: visible loading activity

Frontend source `40ad9254c31a2e702a28d12660c67f8da9f295fa` changes the dashboard label to **Loading dashboard…** and the longer-wait text to **Still loading. This is taking longer than usual.** It retains shimmer and spinner motion for the normal-motion setting. In reduced-motion mode, a narrowly scoped CSS exception gives only the transient loading shapes and indicator a gentle 2.4-second opacity pulse, without spatial travel. The rest of the product's reduced-motion rule remains intact; see [MDN reduced-motion guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion).

Type checking, targeted lint and the production image build passed. A real deployed business switch showed `cw-loading-breathe`, a running animation, and skeleton overlay opacity changing from `0.2` to `0.955033` between the `0s` and `1s` DOM observations, with reduced motion enabled. VoltGrid's 11-action dashboard loaded afterward, and the original Meridian workspace was restored. No network interception, preference changes or artificial loading delay was used. Normal-motion rendering was not separately verified in this browser. [Two raw screenshots and computed-style observations](architecture-evidence/loading-feedback-2026-10-23/) record this check; screenshot and DOM operations can observe adjacent paint frames.

The frontend-only deployment succeeded at the existing public hostname. Backend, worker, database, judge scenarios and dashboard ordering were unchanged. Temporary GitHub registry credentials were removed after the successful image build. The earlier release and latency measurements below remain historical evidence, not new measurements for this CSS/copy update.

## Verification

- Backend: **1,067 passed, 10 optional/integration skips**. New tests cover authentication, empty accounts, historical profiles, cross-business/cross-account selections, stale cached IDs and bounded widget queries. The widget test uses 35 document requirements with two submission versions each and 25 workflow events.
- Frontend: deadline tests verify a stalled body with an external signal and caller cancellation. Existing queue and workspace-selection checks pass. TypeScript passed; targeted lint reported no errors. No new runtime dependency was introduced.
- Live startup API: all 20 warm samples at concurrency three returned 200; p95 **6.347 s**, maximum **6.556 s**, within the new 8/12 s p95/maximum budget. First-read status is recorded separately in the evidence JSON. This is sampled release acceptance, not production capacity certification.
- An initial deployed browser reload reached the real graph widgets in **5.898 s**, including observer/screenshot overhead. The final elapsed-counter build is verified separately in browser-verification.json.
- On the final frontend, complete navigations reached the graph widgets in **6.357 s** for the curated Meridian case and **8.329 s** for a historical Threadline snapshot. These are observed navigations including UI observer overhead, not a browser latency percentile. During a real business switch, visible loading text progressed from `0s elapsed` to `1s elapsed` with reduced motion enabled. CSS shimmer/spinner were correctly suppressed in that mode; normal-motion CSS was implemented, but a normal-motion browser session was not available for visual verification.
- Six existing judging cases retained their saved run IDs and action counts (14, 11, 12, 10, 13, 11). All checks returned 200; the slowest case read was 5.724 s. All 16 previously recorded archive content hashes were recomputed and matched. Three prepared history snapshots returned their exact captured profile variables and saved run IDs through the new bootstrap.
- The API and Korea worker run backend source `9d819f1ae0f20ce9a5b375e042e614902982d23d`. Their same-release heartbeat was healthy and no queued/running jobs remained at the audit. Frontend release and final Azure metadata are recorded with the evidence.
- Final frontend source: `883dff2b886bc3e9ce0bdb82a83638e9acf0c07c`; [production image build](https://github.com/sn0wstorm20202/ComplyWise/actions/runs/39974887932) succeeded. The deployment retained the existing frontend/API hostnames, compute sizes and database. Temporary GitHub registry credentials were removed after the builds.

Evidence: [dashboard-startup-2026-10-23](architecture-evidence/dashboard-startup-2026-10-23/). The existing public frontend/API hostnames are preserved. The prior dashboard order—metrics, graphs, then comparison/evidence—remains intact.

## Operational limits and rollback

Network, database availability and hosting cold starts still affect real users. [Azure Express is request-driven and can scale down when idle](https://learn.microsoft.com/en-us/azure/container-apps/express-overview); this release does not claim to eliminate every cold start or permanently guarantee a fixed load time. It removes known serial reads, document-dependent query growth and an unbounded body wait, while making remaining waits and failures explicit. Do not add timer-based keepalive traffic as a substitute for measuring the real request path.

Track the new startup route alongside dashboard/job/comparison reads using the existing structured server timing logs. Measure full browser navigation independently. Preserve the bounded request and tenant guards when changing startup. A frontend rollback can use the prior dashboard client against the additive API; reverting backend/worker versions together must retain matching-release heartbeat configuration and any durable queued operations. No migration or historical rewrite is needed for this release.
