# ComplyWise: local verification and Azure image updates

Updated 2026-10-07. Use the existing Django/Next.js application, registry and Container Apps. These commands do not create resources or change URLs.

## Fixed deployment destinations

| Resource | Existing value |
| --- | --- |
| Resource group | `Storyvord-Test` |
| Registry | `complywiseacr.azurecr.io` |
| Backend app | `complywise-backend` |
| Frontend app | `complywise-frontend` |
| Frontend URL | `https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io` |
| Backend URL | `https://complywise-backend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io` |
| Previous images inspected | `complywiseacr.azurecr.io/complywise-backend:4faf3b5`, `complywiseacr.azurecr.io/complywise-frontend:4faf3b5` |

Run PowerShell from the repository root. Verify Docker Desktop and Azure CLI access before making changes. Never paste credentials into terminal commands, commit `.env`, dump all Container App environment values, or print Azure secret values.

## 1. Verify locally first

Django reads root `.env`, then `backend/.env` if present. Next.js reads `frontend/.env.local`; exported shell variables take precedence. Do not copy the backend secrets into frontend environment files.

Root `.env`:

```dotenv
DJANGO_DEBUG=True
GOOGLE_AUTH_CLIENT_ID=<existing Google web client ID>
GOOGLE_AUTH_CLIENT_SECRET=<existing Google web client secret>
GOOGLE_AUTH_REDIRECT_URI=http://127.0.0.1:8000/api/v1/auth/google/callback
GOOGLE_AUTH_FRONTEND_CALLBACK_URL=http://localhost:3000/auth/google/callback
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Keep the existing database/provider settings. An unavailable PostgreSQL connection must be diagnosed; do not erase `DATABASE_URL` to hide it with SQLite.

`frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
BACKEND_INTERNAL_URL=http://127.0.0.1:8000
```

For the reviewer convenience, the backend additionally consumes:

```dotenv
DEMO_REVIEWER_AUTOFILL_ENABLED=True
DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT=True
DEMO_REVIEWER_EMAIL=admin@complywise.in
DEMO_REVIEWER_PASSWORD=<owner-supplied demo account password; backend only>
```

**Demo-only disclosure:** enabling this feature deliberately lets a visitor retrieve the designated demo credentials by clicking the button. The owner explicitly designated the existing `admin@complywise.in` account for this purpose. `DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT` defaults to `False`; setting it to `True` permits this configured active reviewer/admin account, with its existing password checked before disclosure. Other accounts remain undisclosed. For a separate nonprivileged reviewer, leave this flag `False`. The endpoint issues no session or token; normal reviewer login is still required. Credentials are loaded on click, not embedded into React/build assets, and responses use `no-store`.

The ignored local `.env` now contains the owner-supplied credentials and both opt-in flags. The existing account was inspected before the owner requested no further testing: it is active, has reviewer/admin access, and matches the supplied password. No new account or password reset is required. Only if configuring a new dedicated reviewer, provision it explicitly:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py configure_demo_reviewer
Pop-Location
```

The command is idempotent. It refuses to reset a mismatched password or modify an existing account; privileged accounts require the explicit opt-in above. New dedicated accounts require a passphrase of at least 16 characters and are created without staff/superuser privileges. It does not create a business, assessment or synthetic compliance result.

Restart the existing local servers so they load the new code and settings. Stop the relevant server normally in its terminal; do not indiscriminately kill all Node/Python processes.

Backend terminal:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Frontend terminal:

```powershell
Set-Location frontend
npm run dev -- --hostname localhost --port 3000
```

Open `http://localhost:3000/auth/signin`. Use this same frontend host throughout OAuth: `sessionStorage` is origin-specific, so beginning on `127.0.0.1:3000` and returning to `localhost:3000` loses the handoff verifier.

Keep Windows automatic date/time synchronized. This host previously reported an unsynchronized Local CMOS Clock. The updated verifier permits only a30-second clock difference; larger drift still correctly rejects Google tokens. If intermittent rejection continues, inspect the backend's safe `Google sign-in rejected` stage/reason messages without recording raw callback URLs or tokens.

Test Google → account selection → backend callback → frontend callback → onboarding/dashboard. A login page or HTTP302 alone is not a successful sign-in. Test Reviewer → Use Demo Reviewer Credentials → editable fields → normal Sign in → review panel. Also test `/admin/login`.

Google callbacks contain sensitive codes. The production Gunicorn access format now logs paths without query strings or referrers. Do not save HAR files, screenshots of revealed passwords, or raw OAuth callback URLs. Django development access logs can include queries; restrict/redact the `django.server` logger while performing a real OAuth test.

## 2. Google Cloud Console

Use the **existing Web application OAuth client**, without creating a replacement.

Authorized redirect URIs (exact paths; no trailing slash):

```text
http://127.0.0.1:8000/api/v1/auth/google/callback
https://complywise-backend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io/api/v1/auth/google/callback
```

Authorized JavaScript origins, if configured for this client:

```text
http://localhost:3000
https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io
```

This implementation uses a server authorization-code redirect, not the Google JavaScript SDK; JavaScript origins do not replace the required backend redirect entries. The frontend `/auth/google/callback` is the application's post-login handoff, **not** Google's registered redirect URI. The frontend must navigate directly to the configured backend for OAuth initiation so the state cookie belongs to the same host as Google's callback. Google's exact redirect matching requirements are documented in [OAuth for web server applications](https://developers.google.com/identity/protocols/oauth2/web-server).

Scopes are `openid email profile`. No Calendar API or calendar scopes are required for sign-in. Calendar OAuth uses separate `GOOGLE_CALENDAR_*` configuration. If the Google consent application is External/Testing, add the intended judge/test Google accounts as test users. Keep the existing audience/client and ensure the consent application is configured for the intended users; broader publishing/domain verification requirements depend on that Google project. Local authorization reached Google and returned successfully on this checkout; production consent has not been verified in this session.

## 3. Inspect existing Azure resources and retain rollback values

```powershell
az account show --query name -o tsv
docker version
$resourceGroup = 'Storyvord-Test'
$frontendApp = 'complywise-frontend'
$backendApp = 'complywise-backend'
$frontendUrl = 'https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io'
$backendUrl = 'https://complywise-backend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io'
$expectedFrontendHost = ([uri]$frontendUrl).Host
$expectedBackendHost = ([uri]$backendUrl).Host
$currentFrontendHost = az containerapp show -g $resourceGroup -n $frontendApp --query properties.configuration.ingress.fqdn -o tsv
$currentBackendHost = az containerapp show -g $resourceGroup -n $backendApp --query properties.configuration.ingress.fqdn -o tsv
if ($currentFrontendHost -ne $expectedFrontendHost -or $currentBackendHost -ne $expectedBackendHost) { throw 'Unexpected app/domain. Stop.' }
$oldFrontendImage = az containerapp show -g $resourceGroup -n $frontendApp --query 'properties.template.containers[0].image' -o tsv
$oldBackendImage = az containerapp show -g $resourceGroup -n $backendApp --query 'properties.template.containers[0].image' -o tsv
az containerapp show -g $resourceGroup -n $frontendApp --query properties.configuration.ingress.traffic -o json
az containerapp show -g $resourceGroup -n $backendApp --query properties.configuration.ingress.traffic -o json
```

Keep the previous image references and active revision/traffic configuration privately for rollback. Inspect revision mode and active health before updating. Do not deactivate old revisions first. For multiple-revision mode, keep traffic on the healthy old revision until the new revision is ready; preserve the recorded traffic policy.

Safely list environment **names/references only**:

```powershell
az containerapp show -g $resourceGroup -n $backendApp --query 'properties.template.containers[0].env[].{name:name,secretRef:secretRef}' -o json
```

## 4. Build both images locally, then push

Use a unique tag rather than overwriting `4faf3b5`. These contexts have `.dockerignore` rules excluding local environment files, caches and database files.

```powershell
$releaseTag = 'auth-reviewer-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$backendImage = "complywiseacr.azurecr.io/complywise-backend:$releaseTag"
$frontendImage = "complywiseacr.azurecr.io/complywise-frontend:$releaseTag"
docker build --pull -f backend/Dockerfile -t $backendImage backend
if ($LASTEXITCODE -ne 0) { throw 'Backend build failed; stop.' }
docker build --pull -f frontend/Dockerfile --build-arg "BACKEND_INTERNAL_URL=$backendUrl" --build-arg "NEXT_PUBLIC_API_BASE_URL=$backendUrl/api/v1" -t $frontendImage frontend
if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed; stop.' }
az acr login --name complywiseacr
if ($LASTEXITCODE -ne 0) { throw 'Registry login failed; stop.' }
docker push $backendImage
if ($LASTEXITCODE -ne 0) { throw 'Backend push failed; stop.' }
docker push $frontendImage
if ($LASTEXITCODE -ne 0) { throw 'Frontend push failed; stop.' }
```

`NEXT_PUBLIC_API_BASE_URL` and the rewrite destination are compiled into the frontend build. Updating only frontend runtime variables cannot repair an image built with the wrong destination. Never pass Google client secrets or reviewer passwords as frontend build arguments.

## 5. Synchronize only required backend settings/secrets

Previously inspected Azure callback URLs and CORS origin already match the fixed destinations. Client-secret presence was confirmed through a secret reference; its value was not printed. Keep correct existing values. Do not upload the whole local `.env` into Azure: it contains local URLs/debug settings and unrelated credentials.

| Backend setting | Production value/purpose |
| --- | --- |
| `GOOGLE_AUTH_CLIENT_ID` | Existing Google Web client ID |
| `GOOGLE_AUTH_CLIENT_SECRET` | Azure secret reference; existing `google-auth-client-secret` where correct |
| `GOOGLE_AUTH_REDIRECT_URI` | Backend URL + `/api/v1/auth/google/callback` |
| `GOOGLE_AUTH_FRONTEND_CALLBACK_URL` | Frontend URL + `/auth/google/callback` |
| `CORS_ALLOWED_ORIGINS` | Preserve existing list containing the exact frontend HTTPS origin |
| `CSRF_TRUSTED_ORIGINS` | Exact frontend HTTPS origin, or the existing secure CORS-derived default |
| `DJANGO_ALLOWED_HOSTS` | Existing backend host policy; do not broaden it for OAuth |
| `DJANGO_DEBUG` | `False` |
| `DEMO_REVIEWER_AUTOFILL_ENABLED` | `True` only for the intentionally public demo account |
| `DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT` | `True` only when intentionally disclosing the owner-designated existing admin demo account; otherwise `False` |
| `DEMO_REVIEWER_EMAIL` | `admin@complywise.in` for the owner-designated account |
| `DEMO_REVIEWER_PASSWORD` | Azure secret reference `demo-reviewer-password` |

In Azure Portal → existing backend Container App → Secrets, enter the designated demo password from local `.env` into `demo-reviewer-password`. Only update `google-auth-client-secret` if comparison shows the existing value is wrong; it is not missing merely because `show` does not expose its value. Never place either password/client secret in plain frontend environment variables. No secret value belongs in this document.

For non-secret callback corrections, use additive updates, not `--replace-env-vars`:

```powershell
az containerapp update -g $resourceGroup -n $backendApp --set-env-vars "GOOGLE_AUTH_REDIRECT_URI=$backendUrl/api/v1/auth/google/callback" "GOOGLE_AUTH_FRONTEND_CALLBACK_URL=$frontendUrl/auth/google/callback" -o none
```

Do not run that command when the values are already correct. Environment changes create revisions. Secret updates may require restarting the relevant revision; check the current Azure secret behavior and revision state. Batch necessary environment changes with the image update to avoid unnecessary rollouts. See Microsoft's [environment variable guidance](https://learn.microsoft.com/en-us/azure/container-apps/environment-variables) and [secret management guidance](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets).

## 6. Update the existing apps, backend first

For this auth-only change there are no new migrations or knowledge packs. The existing backend entrypoint otherwise runs migrations/pack loading on startup. Inspect and record `AUTO_MIGRATE`; use `AUTO_MIGRATE=false` for this rollout to avoid unrelated startup database/knowledge changes. Dedicated reviewer provisioning below is the intentional account write.

```powershell
az containerapp update -g $resourceGroup -n $backendApp --image $backendImage --set-env-vars AUTO_MIGRATE=false DEMO_REVIEWER_AUTOFILL_ENABLED=True DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT=True "DEMO_REVIEWER_EMAIL=admin@complywise.in" DEMO_REVIEWER_PASSWORD=secretref:demo-reviewer-password -o none
if ($LASTEXITCODE -ne 0) { throw 'Backend update failed; stop before frontend rollout.' }
az containerapp revision list -g $resourceGroup -n $backendApp --query '[].{name:name,active:properties.active,health:properties.healthState,provisioning:properties.provisioningState}' -o table
```

These values reflect the owner's explicit existing admin demo designation. For a separate dedicated reviewer, replace the email and set the privileged-account flag to `False`. Do not disclose a different private administrator account.

No provisioning is required when the designated account already exists in the deployed database with the matching password. If configuring a new dedicated reviewer, provision it using the configured secrets inside the ready **new revision**, not a stale replica:

```powershell
# Replace NEW_BACKEND_REVISION with the ready revision returned above.
az containerapp exec -g $resourceGroup -n $backendApp --revision NEW_BACKEND_REVISION --command 'python manage.py configure_demo_reviewer'
```

Do not proceed if provisioning fails or the new revision is unhealthy. Do not manually reset a private account to make the demo work.

```powershell
az containerapp update -g $resourceGroup -n $frontendApp --image $frontendImage -o none
if ($LASTEXITCODE -ne 0) { throw 'Frontend update failed; investigate or roll back.' }
az containerapp revision list -g $resourceGroup -n $frontendApp --query '[].{name:name,active:properties.active,health:properties.healthState,provisioning:properties.provisioningState}' -o table
```

These commands target existing apps and do not change ingress, domains, databases, registry credentials or unrelated environment variables. Verify new revisions/traffic and both original FQDNs after the rollout. In single-revision mode Azure handles revision replacement; in multiple-revision mode follow the recorded traffic policy and direct traffic only after the new revision is healthy.

## 7. Real deployed acceptance gate

Use the original frontend URL. Confirm backend `/health` and `/health/ready`, frontend sign-in, Google initiation directly on the backend, successful Google authorization/callback, frontend handoff, authenticated `/auth/me`, and dashboard/onboarding. Do not capture tokens/codes/passwords in logs.

Then test Reviewer → demo autofill → no automatic submission → normal sign-in → review panel. Edit a field and ensure authentication can reject wrong credentials. Check a normal non-reviewer account cannot enter the review panel. Repeat on mobile.

The old `4faf3b5` OAuth handoff has a PostgreSQL locking bug; environment synchronization alone cannot fix that image. Both the backend lock correction and frontend direct OAuth navigation must be in the new images.

## Rollback

Preserve the recorded revision/traffic configuration. Disable demo disclosure first if necessary:

```powershell
az containerapp update -g $resourceGroup -n $backendApp --set-env-vars DEMO_REVIEWER_AUTOFILL_ENABLED=False -o none
az containerapp update -g $resourceGroup -n $frontendApp --image $oldFrontendImage -o none
az containerapp update -g $resourceGroup -n $backendApp --image $oldBackendImage -o none
```

Restore any changed environment/traffic settings from the recorded non-secret baseline as appropriate; do not revert unrelated secrets. Returning to `4faf3b5` also restores its known Google sign-in defect. Do not delete the new images/revisions until verification and rollback are complete. No database schema rollback is required for this change.

## Current handoff

Earlier restricted-session failures are historical. Full process/database access was subsequently available: the supplied existing reviewer account was inspected and the stale local backend was restarted with the corrected PostgreSQL lock and updated demo configuration. The owner then requested no testing; no tests, browser flows or health probes were run after the final configuration changes. Manual verification remains with the owner. No registry push or Container App/environment/image update was performed; Azure still requires the documented new-image rollout to receive the code fixes. The production URLs remain unchanged. Consult `google-auth-reviewer-verification.md` and task progress for historical results and the latest handoff.
