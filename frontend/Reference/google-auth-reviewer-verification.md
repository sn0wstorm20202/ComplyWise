# Google OAuth and reviewer verification — 2026-10-07

Status: **PARTIALLY VERIFIED**. Local fixes and regression checks pass. Fixed real PostgreSQL sign-in, real demo provisioning, production build and deployment remain blocked by this session's effective access restrictions.

## Actual root causes and changes

1. Real local Google account selection succeeded, Google returned to Django, and Django verified the identity and produced the browser-bound handoff. `/auth/google/exchange` then returned HTTP500: PostgreSQL rejected `FOR UPDATE` on the nullable user outer join. `backend/apps/accounts/google_auth.py` now locks only the login-attempt row using `select_for_update(of=("self",))`. Atomic single-use consumption, PKCE, nonce, cookie/state binding and existing password authentication remain intact.
2. Deployed frontend API requests use a same-origin Next.js rewrite. Using that same origin for OAuth initiation puts the host-only state cookie on the frontend while Google's configured callback is on the backend. `frontend/lib/googleAuth.ts` now selects the explicitly configured public backend for the top-level OAuth navigation using `googleAuthNavigation.ts`. Ordinary API routing is unchanged. The deployed-host defect is traced through source/configuration; its corrected real browser journey has not been verified.
3. The older `/admin/login` source embedded a password and incorrectly accepted only staff/superusers after backend reviewer authentication. Embedded credentials are removed, and the existing `is_compliance_officer` contract is accepted. Both reviewer login surfaces have the shared `DemoReviewerAutofill` button. It retrieves dedicated demo credentials on click, fills editable fields, and does not submit/login.
4. The backend adds explicit disabled-by-default demo settings, a no-store demo credential endpoint, and `configure_demo_reviewer`. The endpoint/command refuse private/privileged/inactive/invalid accounts. The command creates an actual non-staff, non-superuser `COMPLIANCE_OFFICER`; no token, business or synthetic workspace is created by autofill/provisioning. Normal admin-login authenticates the submitted password.
5. Gunicorn access logs omit query strings/referrers so Google callback codes do not enter the default production access log. Frontend Docker ignore excludes all `.env.*` files. `.env.example` documents only names and blank demo secrets.

## Local environment

Root `.env` already has `GOOGLE_AUTH_CLIENT_ID`, `GOOGLE_AUTH_CLIENT_SECRET`, backend callback `http://127.0.0.1:8000/api/v1/auth/google/callback`, frontend callback `http://localhost:3000/auth/google/callback`, and local CORS origins. `frontend/.env.local` points to `http://127.0.0.1:8000/api/v1`, with the corresponding backend internal URL. Next.js does not automatically load the repository-root `.env` from its frontend working directory.

The ignored local `.env` was extended with `DEMO_REVIEWER_AUTOFILL_ENABLED`, `DEMO_REVIEWER_EMAIL`, and a generated dedicated `DEMO_REVIEWER_PASSWORD`. No secret value is recorded here or committed. Actual database provisioning failed with a PostgreSQL network permission denial, so a real demo account is **not confirmed created**. Tests create synthetic accounts in the isolated test database only.

Final local HTTP checks: frontend reviewer sign-in200, backend health200, backend readiness200. The pre-existing backend process could not be restarted under the effective restricted permissions and still has the old in-memory OAuth/URL configuration. These200 responses therefore do not prove that it serves the fixed handoff or the new demo endpoint. The frontend development server hot reloads the new form. A real Chrome reviewer layout was opened and inspected; the blank-field form and new button render correctly.

## Safe local/Azure comparison

| Variable | Local | Azure inspected before access restriction | Status |
| --- | --- | --- | --- |
| `GOOGLE_AUTH_CLIENT_ID` | Present | Present | Values not disclosed; exact Azure equality not independently checked |
| `GOOGLE_AUTH_CLIENT_SECRET` | Present | Secret reference `google-auth-client-secret` | Presence confirmed; value not printed/compared |
| `GOOGLE_AUTH_REDIRECT_URI` | `http://127.0.0.1:8000/api/v1/auth/google/callback` | Existing backend HTTPS URL + `/api/v1/auth/google/callback` | Correct environment-specific destinations |
| `GOOGLE_AUTH_FRONTEND_CALLBACK_URL` | `http://localhost:3000/auth/google/callback` | Existing frontend HTTPS URL + `/auth/google/callback` | Correct environment-specific destinations |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend env: local backend `/api/v1` | Existing Azure backend `/api/v1` | Must also be correct at frontend build time |
| `BACKEND_INTERNAL_URL` | Frontend env: local backend | Existing Azure backend HTTPS URL | Rewrite destination is built into image |
| `CORS_ALLOWED_ORIGINS` | Local frontend origins | Azure frontend plus existing Vercel origin | Expected frontend origin is present |
| `CSRF_TRUSTED_ORIGINS` | Supported directly; developer alias also exists | Not independently present; can inherit secure CORS origins | No evidence that it caused this failure |
| `DJANGO_DEBUG` | True | False | Expected environments |
| `DEMO_REVIEWER_*` | Local values prepared | Not configured in the inspected deployed environment | Requires explicit dedicated account/secret configuration |

## Azure state

Resource group `Storyvord-Test`; existing apps `complywise-backend` and `complywise-frontend`. Both inspected images are `4faf3b5` in `complywiseacr.azurecr.io`. Both original FQDNs remain unchanged. No Container App, revision, traffic, secret, environment, registry or image update was performed. No new infrastructure/database/OAuth client was created.

Read-only HTTP probes before the access change returned backend health200, frontend-proxied health200, backend OAuth start302, frontend-proxied OAuth start302, and the expected Azure backend redirect URI. A302 only proves initiation. Deployed browser access was denied; no alternate browser workaround was attempted. Full deployed Google authentication is not verified.

## Current tests

| Check | Actual result | Scope |
| --- | --- | --- |
| Focused backend auth/reviewer | 29passed9.64s | Isolated SQLite; Google exchange mocked; real existing password-auth code |
| Full backend, corrected fresh temp path | 888passed3opt-in live skips188.51s | Local regression; not live integration |
| Django checks | No issues16silenced | Local settings/code |
| Touched backend Ruff | Passed | Auth views/command/tests |
| Frontend unit | 18passed | Includes backend-origin navigation helper |
| Frontend TypeScript | Passed | Current frontend sources, including browser tests |
| Touched frontend lint | 0errors1pre-existing `any` warning | Older admin error handler warning |
| Focused browser | 4passed23.9s | Fixture autofill/edit/no-auto-submit/disabled-state and one-use Google frontend handoff |
| Real local Google before fix | Authorization/callback passed; exchange500 | Actual configured Google and PostgreSQL; no fake identity |
| Real local Google after fix | Blocked | Existing backend restart denied; fresh PostgreSQL connection denied |
| Real demo provisioning | Blocked | PostgreSQL network permission denied; no fallback SQLite database |
| Fresh production frontend build | Failed/externally blocked | Cannot fetch Inter, JetBrains Mono, Playfair Display from Google Fonts |
| Docker build/ACR push/Azure rollout | Not executed | Docker named pipe/config and Azure profile access denied |

The first full backend invocation had20setup permission errors in the old pytest temp directory; rerunning with a fresh dedicated `--basetemp` resolved all20. The first new reviewer browser test incorrectly expected an error message to be visible inside a closed Details disclosure; it now opens the existing disclosure and retains the exact rejection/no-auto-login assertions. An initial isolated build crossed drives through a node_modules junction and Turbopack rejected its root; a workspace-contained isolated build resolves that setup issue and then fails on actual font network access. A misplaced root TypeScript invocation was stopped; the correct frontend TypeScript invocation passed. None of these failed attempts is counted as success.

## Real flow matrix

| Stage | Local | Azure |
| --- | --- | --- |
| Frontend reachable | PASS200; new reviewer UI inspected | PASS HTTP probe before browser denial |
| Backend reachable | PASS200; original process still loaded | PASS health200 probe |
| Google initiation | PASS real302 | PASS302 probe only |
| Google authorization | PASS real account selection | NOT VERIFIED |
| Backend Google callback | PASS real identity/handoff before fix | NOT VERIFIED |
| Frontend exchange/authenticated session | Original500 reproduced; fix tested; real retest BLOCKED | NOT VERIFIED; old image not updated |
| Reviewer autofill | PASS fixtures; real account/endpoint reload BLOCKED | NOT DEPLOYED |
| Reviewer normal login | PASS isolated API account tests; real account BLOCKED | NOT DEPLOYED/VERIFIED |

## Next steps

1. Obtain effective process/network access (reported permission changes did not affect the running restricted execution token).
2. Run `configure_demo_reviewer` against the actual configured PostgreSQL database, restart the local backend, then complete actual Google and demo reviewer login.
3. Build with actual Google font access; use the documented local Docker→ACR→existing-app workflow if deploying.
4. Configure only dedicated demo credentials through Azure secrets, retaining correct Google callbacks/client settings. Google secrets remain backend-only.
5. Verify real deployed Google and reviewer login, preserving the original URLs and recording exact revisions/images/results.

The detailed commands, exact Google Cloud entries and rollback procedure are in [deployment-instructions.md](deployment-instructions.md). This report makes no successful fixed real-session, Docker, build or deployment claim.

## Latest update — owner requested manual testing (2026-10-07)

The earlier access restrictions above no longer describe the latest process/database access. Before the owner stopped further testing, the supplied existing `admin@complywise.in` identity was inspected and its active reviewer/admin status and password match were confirmed. No account creation, password reset or permission change was made.

The stale local backend had retained the old PostgreSQL OAuth exchange code. It was stopped and replaced by PID17392, using the corrected `select_for_update(of=("self",))` implementation and current root environment configuration on127.0.0.1:8000. Frontend PID21632 remains running onlocalhost:3000 with hot reload. Process inspection confirms these processes exist; it does not establish successful authentication.

The supplied existing admin account is now explicitly configured for demo autofill in ignored root `.env`. New `DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT=True` enables only that designated account alongside `DEMO_REVIEWER_AUTOFILL_ENABLED=True`; the default remains `False`. The endpoint checks account status, reviewer eligibility and the real password before returning configured autofill values. Fields remain editable; visitors must submit the normal sign-in form. No secret is embedded into React, logs or this report.

**Latest validation status: NOT RUN at the owner's request.** The owner will manually test Google sign-in, reviewer autofill and normal login. Historical test counts above precede this final opt-in/configuration change and are not fresh results. No further browser checks, provider requests, health probes, automated tests or builds were performed after the instruction.

Azure remains unchanged on the previously inspected4faf3b5 images. No registry push, secret/environment/image/revision/traffic update was made. The existing frontend URL is preserved. Deployed Google authentication still requires the source fixes to be included in new images; this report does not claim deployed success. The deployment guide now covers the explicit existing-admin demo configuration without an unnecessary account-provisioning step.

## Intermittent callback rejection follow-up

The owner reports failures on some first attempts, including a new Google account, followed by successful sign-in. Read-only inspection of saved attempts found failed callbacks without a resolved user or issued ticket, locating those failures before the frontend handoff. Windows time status reports unsynchronized Local CMOS Clock and no successful synchronization; Google token verification previously used zero clock tolerance. Clock drift is a likely cause, but no exact exception or offset was captured in the older code.

The verifier now permits a fixed30-second difference while retaining Google's signature, issuer, audience and expiry validation plus the application's state/nonce/PKCE checks. Safe logging records only callback stage and a bounded reason or exception class, allowing any continued failure to be diagnosed without logging codes, tokens, claims or exception bodies. Failure redirects also disable caching/referrer disclosure. The updated backend was launched as PID364. No authentication testing was performed; successful remediation remains for the owner's manual confirmation. Azure images and URLs remain unchanged.
