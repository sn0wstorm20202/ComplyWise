# Existing demo sign-in and notification isolation — 19 October 2026

## Scope
Restore a single Fast Demo Login button for the existing demo user, and correct misleading or stale notifications. The user explicitly rejected new demo identities, separate scenario pages and scenario tiles on sign-in. Those proposed additions were removed before any deployment and are absent from the release.

## Changes
- Main sign-in has one Fast Demo Login button. It authenticates the existing `demo@complywise.test` account through a backend-only, explicitly enabled configuration. No registration fallback, password reset, account creation, business seeding or fixture regeneration occurs. Quick login opens an accessible completed assessment with an existing saved DEMO archive, preserving a valid current selection when possible; it passes the exact assessment in the normal dashboard URL so an unfinished cached workspace cannot override it.
- Reviewer sign-in remains separate. Quick login rejects privileged accounts and invalid credentials; credentials are not sent to the browser.
- Account changes clear tenant caches and invalidate pending workspace reads. Logout resets to an empty business profile.
- Removed fabricated reminders from the bell and alert center, including on empty responses or failed requests. Empty inboxes remain empty; failed requests show an error.
- Non-reviewers can list and mark only notification records addressed to themselves, after business authorization. A distinct delivered in-app unread count drives the bell; other delivery audit counts remain available.
- Alert center ignores responses from a previously selected workspace; the bell clears on workspace/account changes and shows delivered in-app alerts only.

## Diagnosis
Read-only inspection found that the Software Company workspace pictured by the user and its owner were created on 13 September 2026. It has nine persisted delivery audit records from that date (six delivered in-app, one delivered email, two simulated calendar). These historical records are not new registration defaults and were not deleted or rewritten. The UI also contained an invented empty-list reminder and stale state across workspace changes; both issues are corrected.

Git history confirms Fast Demo Login existed before `b09dbf4` and was removed in that earlier product-hardening change. The existing demo user still has ten accessible businesses including the six prepared judge fixtures. Neither memberships nor account roles were changed.

## Architecture
The application architecture and normal assessment pipeline are shared by all authenticated accounts. Demo accounts hold prepared test data; registration does not copy those businesses, decisions or alerts. Curated demo results are explicitly labelled. General-account support does not imply that every possible business has complete published regulatory coverage.

## Validation
- Full backend suite: 1,049 passed, 10 optional/integration checks skipped.
- Registration, empty-inbox, recipient isolation and bell-count regression tests: 3 passed. Quick-login and notification focused suite: 10 passed.
- Focused auth/notifications suite: 54 passed before the additional bell-count regression.
- TypeScript type checking passed; targeted lint has no errors (existing warnings remain).
- No database schema migrations.

## Release
Source: `6ae587a1cc3b446d1a78da285762f0b9e37a49c9` on `architecture/reconciled-core`.
GitHub image build: 39208942273.
Azure rollout succeeded for both existing apps with source-matched images. Database readiness returned HTTP 200. Browser verification confirmed the one Fast Demo Login button, the existing demo identity, the exact saved Meridian assessment and its 14 actions to review. The normal business switcher retains the six prepared businesses; no scenario selector was added to sign-in.

Live API verification through the normal demo identity confirmed ten accessible businesses, all six prepared cases, zero notifications/bell count for an empty existing test workspace, and HTTP 404 for another account’s notifications. Temporary GitHub registry access was removed after the build. No account passwords, business facts or assessment archives were changed. Only the demo account’s active workspace selection was restored during verification.

New registration and a fresh business were also exercised in the isolated test database: no inherited businesses, no inherited alerts and no reviewer privileges. No persistent QA accounts were created on Azure.

Existing URL remains https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io
